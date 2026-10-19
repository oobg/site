#!/usr/bin/env python3
"""Exercise production failure/rollback ordering without Docker or a remote host."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
MOCK = r'''#!/usr/bin/env python3
import json, os, sys
from pathlib import Path
root=Path(os.environ['DEPLOY_TEST_ROOT']); args=sys.argv[1:]; scenario=os.environ['DEPLOY_TEST_SCENARIO']
with (root/'commands').open('a') as f: f.write(json.dumps(args)+'\n')
state_path=root/'state'; state=json.loads(state_path.read_text()) if state_path.exists() else {'phase':'before'}
def save(): state_path.write_text(json.dumps(state))
if args[:2]==['compose','version']: print('2'); sys.exit(0)
if args[:2]==['network','inspect']: sys.exit(0)
if args and args[0]=='compose':
 if 'build' in args:
  if scenario=='build-fail': sys.exit(1)
  state['phase']='built'; save()
 elif 'up' in args:
  if '--force-recreate' in args:
   state['phase']='rollback'; save()
   if scenario=='rollback-up-fail': sys.exit(1)
  else:
   state['phase']='new'; save()
   if scenario=='up-fail': sys.exit(1)
 sys.exit(0)
if args and args[0]=='inspect':
 if scenario=='no-previous': sys.exit(1)
 if '{{.Image}}' in args: print('sha256:healthy-running')
 elif any('.State.Health' in arg for arg in args): print('unhealthy' if scenario=='unhealthy-previous' else 'healthy')
 sys.exit(0)
if args[:2]==['image','inspect']: sys.exit(0)
if args and args[0]=='exec':
 phase=state['phase']
 fail=(phase=='new' and scenario not in ['success','empty-tags']) or (phase=='rollback' and scenario=='rollback-health-fail')
 if fail: sys.exit(1)
 print('{"status":"ready"}'); sys.exit(0)
if args and args[0]=='images':
 if scenario!='empty-tags': print('current\t2026-10-19\nprevious\t2026-10-18\n'+'a'*40+'\t2026-10-17')
 sys.exit(0)
sys.exit(0)
'''

def run_case(scenario):
    with tempfile.TemporaryDirectory(prefix='raven-deploy-test-') as temporary:
        root=Path(temporary); app=root/'app'; config=root/'config'; bin_dir=root/'bin'
        (app/'docker').mkdir(parents=True); config.mkdir(); bin_dir.mkdir()
        (app/'docker/compose.oci.yml').write_text('services: {}\n')
        (config/'DEPLOY_TARGET').write_text('raven-production\n')
        settings={'NODE_ENV':'production','CONTENT_SOURCE':'supabase','SITE_URL':'https://raven.kr','R2_PUBLIC_URL':'https://cdn.raven.kr'}
        for key in ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','SUPABASE_SERVICE_ROLE_KEY','NEXT_PUBLIC_GOOGLE_CLIENT_ID','CMS_OWNER_EMAILS','R2_ACCOUNT_ID','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_BUCKET']:
            settings[key]='test-placeholder'
        for name, content in [('.env.production','\n'.join(f'{k}={v}' for k,v in settings.items())),('.env.tunnel','TUNNEL_TOKEN=test-placeholder')]:
            path=config/name;path.write_text(content+'\n');path.chmod(0o600)
        (bin_dir/'docker').write_text(MOCK)
        (bin_dir/'flock').write_text('#!/bin/sh\nexit 0\n')
        (bin_dir/'sleep').write_text('#!/bin/sh\nexit 0\n')
        # Advance a deterministic wall clock so health timeouts do not block CI.
        (bin_dir/'date').write_text("#!/usr/bin/env python3\nimport os\nfrom pathlib import Path\np=Path(os.environ['DEPLOY_TEST_ROOT'])/'clock'\nn=int(p.read_text())+1 if p.exists() else 1\np.write_text(str(n))\nprint(n)\n")
        for path in bin_dir.iterdir(): path.chmod(0o755)
        env={**os.environ,'PATH':str(bin_dir)+os.pathsep+os.environ['PATH'],'RAVEN_APP_DIR':str(root),'RAVEN_HEALTH_TIMEOUT':'4','DEPLOY_TEST_ROOT':str(root),'DEPLOY_TEST_SCENARIO':scenario}
        result=subprocess.run(['bash',str(ROOT/'deploy/server/deploy-production.sh'),'a'*40],env=env,text=True,capture_output=True,timeout=15)
        commands=[json.loads(line) for line in (root/'commands').read_text().splitlines()]
        rollback=[cmd for cmd in commands if '--force-recreate' in cmd]
        success=scenario in ['success','empty-tags']
        assert (result.returncode==0)==success, (scenario,result.returncode,result.stdout,result.stderr)
        if scenario=='build-fail': assert not any('up' in cmd for cmd in commands), scenario
        if scenario in ['no-previous','unhealthy-previous']: assert not rollback, scenario
        if scenario in ['up-fail','health-fail','rollback-health-fail','rollback-up-fail']: assert len(rollback)==1, scenario
        if scenario not in ['no-previous','unhealthy-previous']:
            assert ['tag','sha256:healthy-running','raven-web-production:previous'] in commands, scenario
        if rollback:
            assert ['tag','sha256:healthy-running','raven-web-production:current'] in commands, scenario
            if scenario!='rollback-up-fail':
                index=commands.index(rollback[0]); assert any(cmd[0]=='exec' for cmd in commands[index+1:]), scenario
        if scenario in ['rollback-health-fail','rollback-up-fail','no-previous','unhealthy-previous']:
            assert '복구 후 프로세스 health 확인 완료' not in result.stdout, scenario
        assert 'test-placeholder' not in result.stdout+result.stderr, 'configuration leaked'
        print(f'PASS {scenario}')

if __name__=='__main__':
    subprocess.run(['bash','-n',str(ROOT/'deploy/server/deploy-production.sh')],check=True)
    for scenario in ['success','empty-tags','build-fail','up-fail','health-fail','rollback-health-fail','rollback-up-fail','no-previous','unhealthy-previous']:
        run_case(scenario)
