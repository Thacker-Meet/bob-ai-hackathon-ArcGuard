"""Pure, versioned protocol evaluation and explainable prioritization."""
from datetime import date, timedelta
from decimal import Decimal
import hashlib
import json
import math

RULES = {'wrong_dose': 'Wrong Dose', 'banned_medication': 'Banned Co-Medication',
         'missed_visit': 'Missed Visit', 'visit_window': 'Visit Window Violation', 'documentation': 'Missing Documentation'}
MITIGATIONS = {
    'wrong_dose': 'Ask the investigator to assess the dosing event and any protocol-required follow-up. Review dispensing records and introduce a documented pre-dose verification.',
    'banned_medication': 'Request investigator review of medication exposure and protocol-required follow-up. Reconcile medications at every visit and retrain staff on the approved list.',
    'missed_visit': 'Contact the site to verify the visit record. Review scheduling barriers and implement reminders and escalation before the visit window closes.',
    'visit_window': 'Verify actual dates against source records. Review scheduling controls and add alerts before the allowable window closes.',
    'documentation': 'Reconcile missing source documentation. Retrain staff on documentation completion and monitor the next review cycle.',
}
WEIGHTS = {'upcoming': 30, 'queries': 20, 'training': 15, 'freshness': 10, 'burden': 25}

def day(value, field='date'):
    if not isinstance(value, str) or len(value) != 10:
        raise ValueError(f'{field} must be YYYY-MM-DD')
    try:
        parsed = date.fromisoformat(value)
    except ValueError:
        raise ValueError(f'{field} must be a valid YYYY-MM-DD date') from None
    if parsed.isoformat() != value: raise ValueError(f'{field} must be YYYY-MM-DD')
    return parsed

def number(v, field, low=0, high=1_000_000):
    if isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) or not low <= v <= high:
        raise ValueError(f'{field} must be a number between {low} and {high}')

def nonempty(value, field, maximum=200):
    if not isinstance(value, str) or not value.strip() or len(value) > maximum:
        raise ValueError(f'{field} must be non-empty text (up to {maximum} characters)')

def validate_protocol(p):
    if not isinstance(p, dict): raise ValueError('protocol must be an object')
    for key in ('id', 'version'): nonempty(p.get(key), key, 80)
    day(p.get('effectiveDate'), 'effectiveDate')
    number(p.get('visitWindowDays'), 'visitWindowDays', 0, 90)
    if not isinstance(p['visitWindowDays'], int): raise ValueError('visitWindowDays must be an integer')
    number(p.get('doseMg'), 'doseMg'); number(p.get('doseToleranceMg'), 'doseToleranceMg')
    if p['doseToleranceMg'] > p['doseMg']: raise ValueError('doseToleranceMg cannot exceed doseMg')
    if not isinstance(p.get('bannedMedications'), list): raise ValueError('bannedMedications must be a list')
    for med in p['bannedMedications']: nonempty(med, 'medication')
    if len({m.strip().casefold() for m in p['bannedMedications']}) != len(p['bannedMedications']): raise ValueError('Duplicate banned medication')
    if not isinstance(p.get('severity'), dict) or set(p['severity']) != set(RULES): raise ValueError('severity must specify all five rule keys')
    if any(s not in ('major', 'minor', 'administrative') for s in p['severity'].values()): raise ValueError('Invalid severity')
    if not isinstance(p.get('references'), dict): raise ValueError('references must be an object')
    for key in RULES: nonempty(p['references'].get(key), f'references.{key}')
    return p

def validate_batch(batch, as_of):
    today = day(as_of)
    if not isinstance(batch, dict) or not isinstance(batch.get('sites'), list) or not isinstance(batch.get('visits'), list):
        raise ValueError('Expected an object with sites and visits arrays')
    if not batch['sites'] or not batch['visits']: raise ValueError('sites and visits cannot be empty')
    if len(batch['visits']) > 100_000 or len(batch['sites']) > 10_000: raise ValueError('Batch too large')
    site_ids, visit_ids = set(), set()
    for s in batch['sites']:
        if not isinstance(s, dict): raise ValueError('Each site must be an object')
        for k in ('id', 'name', 'region'): nonempty(s.get(k), f'site.{k}')
        if s['id'] in site_ids: raise ValueError('Duplicate site id')
        site_ids.add(s['id'])
        for k in ('openQueries', 'overdueQueries', 'staffCount', 'untrainedStaff'):
            number(s.get(k), k)
            if not isinstance(s[k], int): raise ValueError(f'{k} must be an integer')
        if s['overdueQueries'] > s['openQueries'] or s['untrainedStaff'] > s['staffCount']: raise ValueError('Signal numerator exceeds denominator')
        if day(s.get('signalsUpdatedAt'), 'signalsUpdatedAt') > today: raise ValueError('Future signal timestamp')
    for v in batch['visits']:
        if not isinstance(v, dict): raise ValueError('Each visit must be an object')
        for k in ('id', 'participantId', 'siteId'): nonempty(v.get(k), f'visit.{k}')
        if v['id'] in visit_ids: raise ValueError('Duplicate visit id')
        visit_ids.add(v['id'])
        if v['siteId'] not in site_ids: raise ValueError('Unknown siteId')
        day(v.get('scheduledDate'), 'scheduledDate')
        for k in ('actualDate', 'doseMg', 'medications', 'documented', 'confirmed', 'updatedAt'):
            if k not in v: raise ValueError(f'Missing field {k}; use null for unknown clinical data')
        if v['actualDate'] is not None and day(v['actualDate'], 'actualDate') > today: raise ValueError('actualDate cannot be in the future')
        if day(v['updatedAt'], 'updatedAt') > today: raise ValueError('updatedAt cannot be in the future')
        if v['actualDate'] and day(v['updatedAt']) < day(v['actualDate']): raise ValueError('updatedAt precedes actualDate')
        if v['doseMg'] is not None: number(v['doseMg'], 'doseMg')
        if v['medications'] is not None:
            if not isinstance(v['medications'], list): raise ValueError('medications must be a list or null')
            for med in v['medications']: nonempty(med, 'medication')
        if v['documented'] is not None and not isinstance(v['documented'], bool): raise ValueError('documented must be boolean or null')
        if not isinstance(v['confirmed'], bool): raise ValueError('confirmed must be boolean')
    return batch

def evaluate_visit(v, p, as_of):
    today, scheduled = day(as_of), day(v['scheduledDate'])
    findings, gaps = [], []
    if scheduled < day(p['effectiveDate']):
        return [], ['No applicable protocol version'], False
    actual = day(v['actualDate']) if v['actualDate'] else None
    if actual and actual > today: return [], ['Visit occurs after evaluation date'], False
    def add(rule, observed, expected):
        # Identity and event dates are part of evidence: a reassigned record needs fresh review.
        fingerprint = json.dumps([p['id'], p['version'], v['id'], v['siteId'], v['participantId'],
                                  v['scheduledDate'], v['actualDate'], rule, observed, expected], ensure_ascii=True)
        findings.append({'id': 'DEV-'+hashlib.sha256(fingerprint.encode()).hexdigest()[:12], 'visitId': v['id'],
                         'participantId': v['participantId'], 'siteId': v['siteId'], 'rule': rule,
                         'title': RULES[rule], 'severity': p['severity'][rule], 'observed': observed, 'expected': expected,
                         'reference': p['references'][rule], 'protocolVersion': p['version'],
                         'recommendation': MITIGATIONS[rule], 'eventDate': v['actualDate'] or v['scheduledDate'], 'status': 'open'})
    window = p['visitWindowDays']
    if actual is None:
        if today > scheduled + timedelta(days=window):
            add('missed_visit', 'No completed visit recorded', f'Completion by {(scheduled+timedelta(days=window)).isoformat()}')
            gaps.append('Visit completion must be verified against source records')
            return findings, gaps, True
        return [], [], False
    delta = (actual-scheduled).days
    if abs(delta) > window: add('visit_window', f'{delta:+d} days from scheduled date', f'Within ±{window} calendar days (inclusive)')
    if v['doseMg'] is None: gaps.append('Dose not available')
    elif abs(Decimal(str(v['doseMg']))-Decimal(str(p['doseMg']))) > Decimal(str(p['doseToleranceMg'])):
        add('wrong_dose', f"{v['doseMg']} mg", f"{p['doseMg']} ± {p['doseToleranceMg']} mg")
    if v['medications'] is None: gaps.append('Medication reconciliation not available')
    else:
        banned = {m.strip().casefold() for m in p['bannedMedications']}
        matches = sorted({m.strip().casefold() for m in v['medications']} & banned)
        if matches: add('banned_medication', ', '.join(matches), 'No listed prohibited medication')
    if v['documented'] is None: gaps.append('Documentation status not available')
    elif v['documented'] is False: add('documentation', 'Required documentation marked incomplete', 'Documentation complete')
    return findings, gaps, True

def score_site(site, visits, findings, as_of):
    today = day(as_of)
    upcoming = [v for v in visits if not v['actualDate'] and today <= day(v['scheduledDate']) <= today+timedelta(days=7)]
    # Visits inside an open window are not a lagging denominator.
    due = [v for v in visits if v['actualDate'] or day(v['scheduledDate']) < today]
    affected = {f['visitId'] for f in findings}
    severity = {'major': 1, 'minor': .4, 'administrative': .1}
    per_visit = {}
    for f in findings: per_visit[f['visitId']] = max(per_visit.get(f['visitId'], 0), severity[f['severity']])
    ages = [(today-day(v['updatedAt'])).days for v in visits]
    age = max(ages + [(today-day(site['signalsUpdatedAt'])).days])
    values = {'upcoming': sum(not v['confirmed'] for v in upcoming)/len(upcoming) if upcoming else 0,
              'queries': site['overdueQueries']/site['openQueries'] if site['openQueries'] else 0,
              'training': site['untrainedStaff']/site['staffCount'] if site['staffCount'] else 1,
              'freshness': min(max(age, 0)/14, 1),
              'burden': min(sum(per_visit.values())/max(len(due), 1)/.2, 1)}
    components = {k: {'value': round(v, 4), 'weight': WEIGHTS[k], 'points': round(v*WEIGHTS[k], 2)} for k, v in values.items()}
    score = round(sum(v*WEIGHTS[k] for k, v in values.items())) if visits else None
    band = 'not evaluable' if score is None else 'critical' if score >= 80 else 'high' if score >= 60 else 'moderate' if score >= 35 else 'low'
    return {**site, 'score': score, 'band': band, 'components': components, 'visitCount': len(visits),
            'affectedVisits': len(affected), 'majorCount': sum(f['severity']=='major' for f in findings),
            'upcomingCount': len(upcoming), 'dataAgeDays': age}

def analyze(batch, protocol, as_of, reviews=None):
    day(as_of)
    findings, gaps, evaluated, clean, pending = [], [], 0, 0, 0
    by_site = {s['id']: [] for s in batch['sites']}
    by_findings = {s['id']: [] for s in batch['sites']}
    site_counts = {s['id']: {'evaluated': 0, 'clean': 0, 'gaps': 0} for s in batch['sites']}
    for v in batch['visits']:
        fs, gs, eligible = evaluate_visit(v, protocol, as_of)
        by_site[v['siteId']].append(v)
        by_findings[v['siteId']].extend(fs)
        for f in fs:
            f['review'] = (reviews or {}).get(f['id'])
            if f['review']: f['status'] = f['review']['decision']
        findings.extend(fs)
        if gs: gaps.append({'visitId': v['id'], 'siteId': v['siteId'], 'reasons': gs})
        fully = eligible and not gs
        evaluated += fully
        clean += fully and not fs
        pending += not eligible and not gs
        site_counts[v['siteId']]['evaluated'] += fully
        site_counts[v['siteId']]['clean'] += fully and not fs
        site_counts[v['siteId']]['gaps'] += bool(gs)
    sites = []
    for s in batch['sites']:
        result = score_site(s, by_site[s['id']], by_findings[s['id']], as_of)
        counts = site_counts[s['id']]
        result.update({'compliance': round(100*counts['clean']/counts['evaluated'], 1) if counts['evaluated'] else None,
                       'evaluatedVisits': counts['evaluated'], 'dataGapVisits': counts['gaps']})
        sites.append(result)
    sites.sort(key=lambda s: -(s['score'] if s['score'] is not None else -1))
    findings.sort(key=lambda f: ({'major': 0, 'minor': 1, 'administrative': 2}[f['severity']], f['id']))
    return {'asOf': as_of, 'protocol': protocol, 'sites': sites, 'findings': findings, 'dataGaps': gaps,
            'summary': {'sites': len(sites), 'visits': len(batch['visits']), 'findings': len(findings),
                        'highRiskSites': sum(s['band'] in ('critical', 'high') for s in sites),
                        'compliance': round(clean/evaluated*100, 1) if evaluated else None,
                        'evaluatedVisits': evaluated, 'cleanVisits': clean, 'pendingVisits': pending, 'dataGapVisits': len(gaps)},
            'scorePolicy': {'version': 'demo-risk-1.0', 'weights': WEIGHTS, 'note': 'Prioritization heuristic; not a probability. Reviews do not erase observed events.'}}
