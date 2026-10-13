// Run --record, restart the guarded local e2e server with E2E_KEEP_DATA=1, then --verify.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Http,WEB_ORIGIN,apiRoot} from './lib/backend.mjs';
const root=new URL(apiRoot());
assert.ok(root.protocol==='http:'&&['localhost','127.0.0.1'].includes(root.hostname),'Local fixture only');
const fixture=JSON.parse(readFileSync(process.env.E2E_FIXTURE_FILE??'/tmp/eclipse-contract-e2e-fixture.json','utf8'));
assert.ok(fixture.email.endsWith('@example.test'),'Fictional account only');
const http=new Http(apiRoot(),WEB_ORIGIN);
await http.preauth();
const login=await http.request('POST','/api/v1/auth/client/login',{body:{email:fixture.email,password:fixture.password}});
assert.equal(login.status,200);http.csrf=login.json.csrfToken;
const detail=await http.request('GET',`/api/v1/client/engagements/${fixture.engagementId}`);
assert.equal(detail.status,200);
const row=detail.json.engagement??detail.json;
const copies=[];
for(const id of [fixture.issueId,fixture.deliveryId]){
 const response=await http.request('GET',`/api/v1/client/contracts/${id}/content`,{raw:true});
 assert.equal(response.status,200);
 const hash=createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
 assert.equal(hash,row.issues.find(i=>i.id===id).documentHash);
 const evidence=await http.request('GET',`/api/v1/client/contracts/${id}/evidence`);
 assert.equal(evidence.status,200);
 copies.push({id,hash,evidence:evidence.json});
}
assert.equal(row.projectId,fixture.projectId);
const proof={snapshot:row.snapshot,projectId:row.projectId,issues:row.issues,copies};
const file=process.env.E2E_RESTART_PROOF??'/tmp/eclipse-contract-restart-proof.json';
if(process.argv.includes('--record')){writeFileSync(file,JSON.stringify(proof));console.log('Recorded fictional copies/hashes/evidence/project before restart.');}
else{assert.ok(process.argv.includes('--verify'));assert.deepEqual(proof,JSON.parse(readFileSync(file,'utf8')));console.log('PASS process restart: new real login, exact snapshot, one project, both immutable document bytes/hashes and persisted evidence unchanged.');}
