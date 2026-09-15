import copy
import json
import tempfile
import threading
import unittest
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from backend.server import make_server

class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp=tempfile.TemporaryDirectory()
        cls.server=make_server(0,cls.tmp.name+'/test.sqlite3')
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start()
        cls.base=f'http://127.0.0.1:{cls.server.server_port}'

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown();cls.server.server_close();cls.thread.join();cls.tmp.cleanup()

    def request(self,path,body=None,headers=None):
        req=Request(self.base+path,data=json.dumps(body).encode() if body is not None else None,
                    headers={'Content-Type':'application/json',**(headers or {})})
        try:
            with urlopen(req) as res:return res.status,json.loads(res.read())
        except HTTPError as e:return e.code,json.loads(e.read())

    def test_invalid_import_atomic(self):
        _,original=self.request('/api/data')
        bad=copy.deepcopy(original);bad['visits'][0]['siteId']='unknown'
        status,_=self.request('/api/import',{'actor':'Test','data':bad})
        self.assertEqual(status,400)
        self.assertEqual(original,self.request('/api/data')[1])

    def test_review_capa_workflow_and_audit(self):
        _,analysis=self.request('/api/analysis');f=analysis['findings'][0]
        body={'actor':'QA Test','findingId':f['id'],'decision':'confirmed','reason':'Verified synthetic source.'}
        self.assertEqual(self.request('/api/reviews',body)[0],200)
        reviewed=next(x for x in self.request('/api/analysis')[1]['findings'] if x['id']==f['id'])
        self.assertEqual(reviewed['status'],'confirmed')
        capa={'actor':'QA Test','findingId':f['id'],'owner':'Site QA','dueDate':'2026-09-25','rootCause':'Investigating',
              'correctiveAction':'Verify event','preventiveAction':'Train staff','effectiveness':'Review next 10 visits','status':'closed'}
        self.assertEqual(self.request('/api/capas',capa)[0],400)
        status,saved=self.request('/api/capas',{**capa,'closureEvidence':'Ten source records reviewed; all passed.'})
        self.assertEqual(status,200);self.assertEqual(saved['status'],'closed')
        self.assertTrue(any(e['action']=='capa_saved' for e in self.request('/api/audit')[1]))
        self.assertIn(saved['id'],[c['id'] for c in self.request('/api/report')[1]['analysis']['capas']])

    def test_stale_finding_rejected(self):
        self.assertEqual(self.request('/api/reviews',{'actor':'Test','findingId':'missing','decision':'confirmed','reason':'x'})[0],400)

    def test_cross_origin_write_rejected(self):
        self.assertEqual(self.request('/api/import',{'actor':'x'}, {'Origin':'https://evil.example'})[0],403)

    def test_protocol_version_reuse_rejected(self):
        p=self.request('/api/protocol')[1]
        self.assertEqual(self.request('/api/protocol',{'actor':'Test','protocol':p})[0],400)

    def test_exports_and_static(self):
        with urlopen(self.base+'/api/export.csv') as res:
            text=res.read().decode();self.assertIn('recommendation',text);self.assertIn('DEV-',text)
        with urlopen(self.base+'/') as res:
            self.assertIn('ArcGuardAI',res.read().decode());self.assertIn("frame-ancestors 'none'",res.headers['Content-Security-Policy'])
        self.assertEqual(self.request('/api/missing')[0],404)

    def test_valid_import_and_protocol_round_trip(self):
        batch=self.request('/api/data')[1]
        self.assertEqual(self.request('/api/import',{'actor':'Integration Tester','data':batch})[0],200)
        p=self.request('/api/protocol')[1]
        new={**p,'version':'integration-v2'}
        self.assertEqual(self.request('/api/protocol',{'actor':'Integration Tester','protocol':new})[0],200)
        self.assertEqual(self.request('/api/analysis')[1]['protocol']['version'],'integration-v2')
        self.assertEqual(self.request('/api/protocol',{'actor':'Integration Tester','protocol':p})[0],400)

    def test_missing_actor_and_malformed_schema(self):
        self.assertEqual(self.request('/api/reviews',{})[0],400)
        self.assertEqual(self.request('/api/import',{'actor':'Test','data':{'sites':[None],'visits':[None]}})[0],400)

if __name__=='__main__':unittest.main()
