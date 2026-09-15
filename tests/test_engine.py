import copy
import unittest
from backend.engine import analyze, evaluate_visit, score_site, validate_batch, validate_protocol
from backend.seed import AS_OF, PROTOCOL, make_seed

class EngineTests(unittest.TestCase):
    def setUp(self):
        self.p = copy.deepcopy(PROTOCOL)
        self.v = {'id':'V1','participantId':'P1','siteId':'S1','scheduledDate':'2026-09-10',
                  'actualDate':'2026-09-10','doseMg':50,'medications':[],'documented':True,'confirmed':True,'updatedAt':AS_OF}
        self.site = {'id':'S1','name':'Test','region':'Test','openQueries':10,'overdueQueries':0,'staffCount':10,'untrainedStaff':0,'signalsUpdatedAt':AS_OF}

    def evaluate(self, **changes):
        return evaluate_visit({**self.v, **changes}, self.p, AS_OF)

    def test_clean_visit(self):
        self.assertEqual(self.evaluate(), ([], [], True))

    def test_inclusive_window_both_sides(self):
        for date in ('2026-09-07','2026-09-13'):
            self.assertFalse(self.evaluate(actualDate=date)[0])
        for date in ('2026-09-06','2026-09-14'):
            f = self.evaluate(actualDate=date)[0][0]
            self.assertEqual((f['rule'],f['severity']), ('visit_window','minor'))

    def test_missed_only_after_window_closes(self):
        self.assertFalse(self.evaluate(actualDate=None, scheduledDate='2026-09-12')[0])
        f, gaps, eligible = self.evaluate(actualDate=None, scheduledDate='2026-09-11')
        self.assertEqual(f[0]['rule'], 'missed_visit'); self.assertTrue(gaps); self.assertTrue(eligible)

    def test_future_visit_pending(self):
        self.assertEqual(self.evaluate(actualDate=None, scheduledDate='2026-09-20'), ([], [], False))

    def test_unknown_is_not_deviation_or_compliance(self):
        f, gaps, _ = self.evaluate(doseMg=None, medications=None, documented=None)
        self.assertFalse(f); self.assertEqual(len(gaps),3)
        result = analyze({'sites':[self.site],'visits':[{**self.v,'doseMg':None}]},self.p,AS_OF)
        self.assertIsNone(result['summary']['compliance'])
        self.assertEqual(result['summary']['dataGapVisits'],1)

    def test_severity_and_multiple_rules(self):
        f, _, _ = self.evaluate(doseMg=75,medications=[' demo-med-x '],documented=False)
        self.assertEqual({x['rule']:x['severity'] for x in f}, {'wrong_dose':'major','banned_medication':'major','documentation':'administrative'})

    def test_medication_exact_match(self):
        self.assertFalse(self.evaluate(medications=['DEMO-MED-XR'])[0])

    def test_dose_tolerance_inclusive(self):
        self.p['doseToleranceMg']=5
        self.assertFalse(self.evaluate(doseMg=55)[0])
        self.assertEqual(self.evaluate(doseMg=55.01)[0][0]['rule'],'wrong_dose')

    def test_decimal_tolerance_does_not_create_rounding_deviation(self):
        self.p['doseToleranceMg']=.1
        self.assertFalse(self.evaluate(doseMg=50.1)[0])
        self.assertFalse(self.evaluate(doseMg=49.9)[0])
        self.assertEqual(self.evaluate(doseMg=50.1001)[0][0]['rule'],'wrong_dose')

    def test_id_stable_and_evidence_sensitive(self):
        a=self.evaluate(doseMg=75)[0][0]['id']
        self.assertEqual(a,self.evaluate(doseMg=75)[0][0]['id'])
        self.assertNotEqual(a,self.evaluate(doseMg=70)[0][0]['id'])
        self.p['version']='2'
        self.assertNotEqual(a,self.evaluate(doseMg=75)[0][0]['id'])

    def test_protocol_effective_date(self):
        self.p['effectiveDate']='2026-09-12'
        f,gaps,eligible=self.evaluate()
        self.assertFalse(f);self.assertTrue(gaps);self.assertFalse(eligible)

    def test_reassigned_record_requires_new_review(self):
        original=self.evaluate(doseMg=75)[0][0]['id']
        for changes in ({'siteId':'S2'},{'participantId':'P2'},{'actualDate':'2026-09-11'}):
            self.assertNotEqual(original,self.evaluate(doseMg=75,**changes)[0][0]['id'])

    def test_review_does_not_erase_observed_burden(self):
        batch={'sites':[self.site],'visits':[{**self.v,'doseMg':75}]}
        a=analyze(batch,self.p,AS_OF)
        b=analyze(batch,self.p,AS_OF,{a['findings'][0]['id']:{'decision':'dismissed'}})
        self.assertEqual(a['sites'][0]['score'],b['sites'][0]['score'])
        self.assertEqual(b['findings'][0]['status'],'dismissed')

    def test_score_maximum_and_zero_staff(self):
        s={**self.site,'overdueQueries':10,'untrainedStaff':10,'signalsUpdatedAt':'2026-09-01'}
        upcoming={**self.v,'id':'V2','scheduledDate':'2026-09-17','actualDate':None,'confirmed':False}
        result=score_site(s,[self.v,upcoming],self.evaluate(doseMg=75)[0],AS_OF)
        self.assertEqual(result['score'],100)
        self.assertEqual(result['band'],'critical')
        result=score_site({**self.site,'staffCount':0},[self.v],[],AS_OF)
        self.assertEqual(result['components']['training']['points'],15)

    def test_bad_protocol_inputs(self):
        for key,value in [('doseMg',-1),('doseMg',True),('doseMg',float('nan')),('visitWindowDays',1.5),('severity',{}),('effectiveDate','2026-02-30')]:
            with self.subTest(key=key,value=value),self.assertRaises(ValueError):validate_protocol({**self.p,key:value})

    def test_bad_batch_inputs(self):
        bad_visits=[{**self.v,'doseMg':float('inf')},{**self.v,'siteId':'unknown'}, {**self.v,'actualDate':'2026-09-20'}, {**self.v,'confirmed':1}, {**self.v,'medications':'x'}]
        for v in bad_visits:
            with self.subTest(v=v),self.assertRaises(ValueError):validate_batch({'sites':[self.site],'visits':[v]},AS_OF)
        with self.assertRaises(ValueError):validate_batch({'sites':[self.site],'visits':[self.v,self.v]},AS_OF)

    def test_seed_scale_and_validation(self):
        batch=make_seed();validate_batch(batch,AS_OF);validate_protocol(self.p)
        self.assertEqual(len(batch['sites']),204);self.assertEqual(len(batch['visits']),5304)
        result=analyze(batch,self.p,AS_OF)
        self.assertTrue(result['findings']);self.assertEqual(result['summary']['visits'],5304)
        self.assertEqual(result['summary']['evaluatedVisits']+result['summary']['pendingVisits']+result['summary']['dataGapVisits'],5304)

    def test_empty_site_no_score(self):
        self.assertIsNone(score_site(self.site,[],[],AS_OF)['score'])

    def test_leading_signals_alone_raise_risk(self):
        v={**self.v,'actualDate':None,'scheduledDate':'2026-09-17','confirmed':False}
        s={**self.site,'overdueQueries':10,'untrainedStaff':10,'signalsUpdatedAt':'2026-09-01'}
        score=score_site(s,[v],[],AS_OF)
        self.assertEqual(score['score'],75)

    def test_risk_monotonic_and_bounded(self):
        scores=[score_site({**self.site,'overdueQueries':n},[self.v],[],AS_OF)['score'] for n in range(11)]
        self.assertEqual(scores,sorted(scores));self.assertEqual(scores[-1],20)

    def test_burden_uses_max_per_visit(self):
        findings=self.evaluate(doseMg=75,medications=['DEMO-MED-X'])[0]
        a=score_site(self.site,[self.v],findings,AS_OF)
        b=score_site(self.site,[self.v],findings[:1],AS_OF)
        self.assertEqual(a['components']['burden'],b['components']['burden'])

    def test_burden_normalized_by_volume(self):
        findings=self.evaluate(doseMg=75)[0]
        a=score_site(self.site,[self.v]*10,findings,AS_OF)
        b=score_site(self.site,[self.v]*20,findings,AS_OF)
        self.assertGreater(a['score'],b['score'])

if __name__=='__main__':unittest.main()
