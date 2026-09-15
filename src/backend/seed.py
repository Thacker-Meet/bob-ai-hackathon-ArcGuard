"""Deterministic, fictional demonstration data. Never use as a clinical protocol."""
from datetime import date, timedelta

# ---------------------------------------------------------------------------
# Finding snapshots – pre-computed from the seeded batch + DEMO-ARC-01 v1.0
# evaluated as of AS_OF.  These are read-only reference copies embedded in
# each CAPA record (findingSnapshot field) so the action-plan page renders
# correctly even before a user has opened the findings tab.
# ---------------------------------------------------------------------------
_F_WRONG_DOSE_101 = {
    "id": "DEV-1f71ef714c46", "visitId": "V-001-05", "participantId": "PT-0003",
    "siteId": "SITE-101", "rule": "wrong_dose", "title": "Wrong Dose",
    "severity": "major", "observed": "75 mg", "expected": "50 \u00b1 0 mg",
    "reference": "Demo \u00a76.1", "protocolVersion": "1.0",
    "recommendation": "Ask the investigator to assess the dosing event and any protocol-required follow-up. Review dispensing records and introduce a documented pre-dose verification.",
    "eventDate": "2026-08-14", "status": "open", "review": None,
}
_F_BANNED_MED_101 = {
    "id": "DEV-327934dac105", "visitId": "V-001-02", "participantId": "PT-0001",
    "siteId": "SITE-101", "rule": "banned_medication", "title": "Banned Co-Medication",
    "severity": "major", "observed": "demo-med-x", "expected": "No listed prohibited medication",
    "reference": "Demo \u00a76.3", "protocolVersion": "1.0",
    "recommendation": "Request investigator review of medication exposure and protocol-required follow-up. Reconcile medications at every visit and retrain staff on the approved list.",
    "eventDate": "2026-08-08", "status": "open", "review": None,
}
_F_WRONG_DOSE_102 = {
    "id": "DEV-368903fcd728", "visitId": "V-002-05", "participantId": "PT-0016",
    "siteId": "SITE-102", "rule": "wrong_dose", "title": "Wrong Dose",
    "severity": "major", "observed": "75 mg", "expected": "50 \u00b1 0 mg",
    "reference": "Demo \u00a76.1", "protocolVersion": "1.0",
    "recommendation": "Ask the investigator to assess the dosing event and any protocol-required follow-up. Review dispensing records and introduce a documented pre-dose verification.",
    "eventDate": "2026-08-14", "status": "open", "review": None,
}
_F_BANNED_MED_102 = {
    "id": "DEV-5171081176a0", "visitId": "V-002-02", "participantId": "PT-0014",
    "siteId": "SITE-102", "rule": "banned_medication", "title": "Banned Co-Medication",
    "severity": "major", "observed": "demo-med-x", "expected": "No listed prohibited medication",
    "reference": "Demo \u00a76.3", "protocolVersion": "1.0",
    "recommendation": "Request investigator review of medication exposure and protocol-required follow-up. Reconcile medications at every visit and retrain staff on the approved list.",
    "eventDate": "2026-08-08", "status": "open", "review": None,
}
_F_VISIT_WINDOW_101 = {
    "id": "DEV-0e38893a0f3d", "visitId": "V-001-04", "participantId": "PT-0002",
    "siteId": "SITE-101", "rule": "visit_window", "title": "Visit Window Violation",
    "severity": "minor", "observed": "+4 days from scheduled date",
    "expected": "Within \u00b13 calendar days (inclusive)",
    "reference": "Demo \u00a75.2", "protocolVersion": "1.0",
    "recommendation": "Verify actual dates against source records. Review scheduling controls and add alerts before the allowable window closes.",
    "eventDate": "2026-08-16", "status": "open", "review": None,
}
_F_MISSING_DOC_153 = {
    "id": "DEV-0a1d562f539a", "visitId": "V-053-04", "participantId": "PT-0678",
    "siteId": "SITE-153", "rule": "documentation", "title": "Missing Documentation",
    "severity": "administrative", "observed": "Required documentation marked incomplete",
    "expected": "Documentation complete",
    "reference": "Demo \u00a78.1", "protocolVersion": "1.0",
    "recommendation": "Reconcile missing source documentation. Retrain staff on documentation completion and monitor the next review cycle.",
    "eventDate": "2026-08-12", "status": "open", "review": None,
}

SEED_CAPAS = [
    {
        "id": "CAPA-a1b2c3d4",
        "findingId": "DEV-1f71ef714c46",
        "siteId": "SITE-101",
        "status": "closed",
        "owner": "Dr. Sarah Mitchell",
        "dueDate": "2026-09-01",
        "rootCause": "Dispenser calibration drift caused a systematic 50% overdose on five consecutive visits. The pre-dose weight check was skipped due to an undocumented workflow shortcut introduced during a staff changeover.",
        "correctiveAction": "Dispensing unit recalibrated and re-verified against reference weights. All five affected participant records flagged for safety review by the principal investigator. Dispensing logs reconciled.",
        "preventiveAction": "Mandatory two-person pre-dose weight verification reinstated as a hard stop in the electronic dispensing system. Monthly calibration checks added to the site quality calendar.",
        "effectiveness": "Zero dispensing deviations in the 30-day post-correction monitoring window. Calibration log reviewed at next monitoring visit scheduled for 2026-10-01.",
        "closureEvidence": "Calibration certificate (Ref CAL-101-26-08), PI safety assessment memo dated 2026-08-22, and 30-day clean dispensing log attached to site file.",
        "actor": "admin@arcguard.local",
        "findingSnapshot": _F_WRONG_DOSE_101,
    },
    {
        "id": "CAPA-e5f6a7b8",
        "findingId": "DEV-327934dac105",
        "siteId": "SITE-101",
        "status": "effectiveness check",
        "owner": "James Okonkwo (Site Coordinator)",
        "dueDate": "2026-09-30",
        "rootCause": "DEMO-MED-X was prescribed by an external physician unaware of the trial. The site intake checklist did not include a cross-reference to the protocol's banned-medication list at the time of the visit.",
        "correctiveAction": "Medication reconciliation performed; DEMO-MED-X usage period documented and reported to the sponsor safety team. Participant's eligibility reviewed and confirmed by PI.",
        "preventiveAction": "Banned-medication card laminated and placed at all intake stations. Pharmacy liaison notified. Electronic medication reconciliation form updated to flag banned medications automatically.",
        "effectiveness": "Review of the next three intake visits to confirm the new electronic flag fires correctly and no banned medication is missed.",
        "closureEvidence": "",
        "actor": "admin@arcguard.local",
        "findingSnapshot": _F_BANNED_MED_101,
    },
    {
        "id": "CAPA-c9d0e1f2",
        "findingId": "DEV-368903fcd728",
        "siteId": "SITE-102",
        "status": "in progress",
        "owner": "Dr. Priya Nair",
        "dueDate": "2026-10-15",
        "rootCause": "Investigational product kit substitution error: a 75 mg kit was dispensed instead of the 50 mg kit because outer packaging labels were visually similar and storage bins were not segregated by dose.",
        "correctiveAction": "Incorrect kit recalled and quarantined. Replacement 50 mg dose administered within protocol window and documented. Sponsor notified per protocol deviation reporting requirements.",
        "preventiveAction": "Storage room reorganised with colour-coded bins and bin-level dose labels. A kit barcode scan step added to the dispensing SOP to prevent mismatch.",
        "effectiveness": "Pharmacist audit of 10 consecutive dispensing events after SOP update to confirm zero kit mismatches. Audit report to be submitted to QA by 2026-10-10.",
        "closureEvidence": "",
        "actor": "admin@arcguard.local",
        "findingSnapshot": _F_WRONG_DOSE_102,
    },
    {
        "id": "CAPA-03a4b5c6",
        "findingId": "DEV-5171081176a0",
        "siteId": "SITE-102",
        "status": "in progress",
        "owner": "Maria Santos (QA Lead)",
        "dueDate": "2026-10-20",
        "rootCause": "Participant's GP added DEMO-MED-X post-randomisation without informing the study team. Concomitant medication reporting was reliant on participant self-report with no independent pharmacy verification.",
        "correctiveAction": "Concomitant medication log updated; GP notified of study restrictions. Participant counselled on the requirement to disclose all new medications immediately.",
        "preventiveAction": "GP liaison letter sent to all participant GPs at SITE-102. Monthly concomitant medication cross-check against pharmacy dispensing records introduced.",
        "effectiveness": "Compliance with the new pharmacy cross-check process to be confirmed at the next monitoring visit (2026-11-05).",
        "closureEvidence": "",
        "actor": "admin@arcguard.local",
        "findingSnapshot": _F_BANNED_MED_102,
    },
    {
        "id": "CAPA-d7e8f9a0",
        "findingId": "DEV-0e38893a0f3d",
        "siteId": "SITE-101",
        "status": "draft",
        "owner": "Tom Reyes (Study Coordinator)",
        "dueDate": "2026-10-31",
        "rootCause": "Participant travel conflict was not identified in advance. The scheduling system lacked automatic alerts when a visit falls within 5 days of the window boundary.",
        "correctiveAction": "Visit rescheduled and source document updated to reflect actual date. Window deviation documented in the protocol deviation log.",
        "preventiveAction": "Automated scheduling alert to be configured to notify coordinators 7 days before a visit approaches the window boundary. Escalation path defined for unresolved conflicts.",
        "effectiveness": "No further window violations detected across the next 10 scheduled visits after alert system is activated.",
        "closureEvidence": "",
        "actor": "admin@arcguard.local",
        "findingSnapshot": _F_VISIT_WINDOW_101,
    },
    {
        "id": "CAPA-b1c2d3e4",
        "findingId": "DEV-0a1d562f539a",
        "siteId": "SITE-153",
        "status": "draft",
        "owner": "Linda Osei (Site Monitor)",
        "dueDate": "2026-11-15",
        "rootCause": "Source document was completed by a recently onboarded research nurse who had not yet completed the trial documentation training module.",
        "correctiveAction": "Missing source document sections completed and co-signed by the PI. Training gap identified and escalated to site training coordinator.",
        "preventiveAction": "Training completion made a prerequisite for independent documentation sign-off in the trial management system. Documentation checklist review added to onboarding sign-off.",
        "effectiveness": "100% documentation completion rate on the next monitoring review cycle for SITE-153.",
        "closureEvidence": "",
        "actor": "admin@arcguard.local",
        "findingSnapshot": _F_MISSING_DOC_153,
    },
]

AS_OF = '2026-09-15'
PROTOCOL = {
    'id': 'DEMO-ARC-01', 'version': '1.0', 'effectiveDate': '2026-01-01',
    'visitWindowDays': 3, 'doseMg': 50, 'doseToleranceMg': 0,
    'bannedMedications': ['DEMO-MED-X', 'DEMO-MED-Y'],
    'severity': {'wrong_dose': 'major', 'banned_medication': 'major',
                 'missed_visit': 'minor', 'visit_window': 'minor', 'documentation': 'administrative'},
    'references': {'wrong_dose': 'Demo §6.1', 'banned_medication': 'Demo §6.3',
                   'missed_visit': 'Demo §5.2', 'visit_window': 'Demo §5.2', 'documentation': 'Demo §8.1'},
}

def make_seed():
    sites, visits = [], []
    cities = ['Boston', 'Chicago', 'Atlanta', 'Seattle', 'Phoenix', 'London', 'Berlin', 'Mumbai', 'Toronto', 'Madrid', 'Sydney', 'Paris']
    for i in range(204):
        site_id = f'SITE-{101+i:03}'
        pressure = [1, .82, .64, .4, .18][i] if i < 5 else (i % 9) / 60
        sites.append({'id': site_id, 'name': cities[i % len(cities)], 'region': ['North America', 'Europe', 'Asia Pacific'][i % 3],
                      'openQueries': 10, 'overdueQueries': round(10*pressure), 'staffCount': 10,
                      'untrainedStaff': round(10*pressure), 'signalsUpdatedAt': AS_OF})
        for j in range(26):
            scheduled = date.fromisoformat(AS_OF) + timedelta(days=(j-20)*2)
            actual = scheduled if j <= 20 else None
            dose, meds, documented = 50, [], True
            if i < 5 and j < (5-i)*2:
                if j % 4 == 0: dose = 75
                elif j % 4 == 1: meds = ['DEMO-MED-X']
                elif j % 4 == 2: actual = None
                else: actual = scheduled + timedelta(days=4)
            elif i % 13 == 0 and j == 3: documented = False
            if i % 17 == 0 and j == 8: dose = None
            visits.append({'id': f'V-{i+1:03}-{j+1:02}', 'participantId': f'PT-{i*13+j//2+1:04}',
                           'siteId': site_id, 'scheduledDate': scheduled.isoformat(),
                           'actualDate': actual.isoformat() if actual else None, 'doseMg': dose if actual else None,
                           'medications': meds if actual else None, 'documented': documented if actual else None,
                           'confirmed': j <= 20 or (j-21)/5 >= pressure,
                           'updatedAt': AS_OF})
    return {'sites': sites, 'visits': visits}
