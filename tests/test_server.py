import unittest
from unittest.mock import patch
import server

class ModelAdapterTests(unittest.TestCase):
    def test_missing_key_is_explicit(self):
        with patch.dict(server.os.environ,{},clear=True):
            with self.assertRaisesRegex(ValueError,'not configured'):
                server.call_model('readiness',{})
    def test_readiness_schema(self):
        self.assertEqual(server.validate_response('readiness',{'ready':False,'summary':'Unresolved capacity','blockers':['Capacity']} )['ready'],False)
        with self.assertRaises(AssertionError):
            server.validate_response('readiness',{'ready':'yes','summary':'Ready','blockers':[]})
    def test_generation_requires_complete_document(self):
        self.assertEqual(server.validate_response('generate',{'html':'<html><body>Test</body></html>'})['html'],'<html><body>Test</body></html>')
        with self.assertRaises(AssertionError):
            server.validate_response('generate',{'html':'<div>Partial</div>'})
    def test_clarification_schema_preserves_only_supported_shapes(self):
        data={'reply':'Who is it for?','brief':{k:'' for k in ('title','outcome','users','constraints','assumptions')},'criteria':[{'text':'Show availability','check':'Every shift shows remaining spaces.'}],'questions':['Who uses this?'],'answers':[]}
        self.assertEqual(server.validate_response('clarify',data),data)
        data['criteria'][0]['check']=None
        with self.assertRaises(AssertionError):
            server.validate_response('clarify',data)
    def test_independent_role_prompts(self):
        self.assertIn('independent readiness-review agent',server.PROMPTS['readiness'])
        self.assertIn('Never generate',server.PROMPTS['clarify'])
        self.assertIn('explicitly approved',server.PROMPTS['generate'])

if __name__=='__main__':unittest.main()
