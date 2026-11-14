import assert from 'node:assert/strict';
import vm from 'node:vm';
import {newProject,readyReview,answerQuestion,selected,approve,addOutput,demoOutput,touch,demoChat,snapshot,sandboxHTML} from '../public/engine.js';
let count=0;
function test(name,fn){fn();console.log('PASS '+name);count++;}
test('Nothing is selected or generated automatically',()=>{const p=newProject();assert.equal(selected(p).length,0);assert.equal(p.outputs.length,0);assert.equal(readyReview(p).ready,false);assert.throws(()=>approve(p,true));});
test('Readiness depends on decisions, not turn count',()=>{const p=newProject();p.criteria[0].selected=true;p.messages.push(...Array(40).fill({role:'user',text:'hi'}));assert.equal(readyReview(p).ready,false);p.questions.forEach(q=>answerQuestion(p,q.id,q.options[0]));assert.equal(readyReview(p).ready,true);assert.equal(selected(p).length,1);});
test('An explicit override is required for open decisions',()=>{const p=newProject();p.criteria[0].selected=true;assert.throws(()=>approve(p));assert.equal(approve(p,true).override,true);});
test('Output brief remains immutable after revisions',()=>{const p=newProject();p.criteria[0].selected=true;const a=approve(p,true);const o=addOutput(p,a,demoOutput(a.brief),'demo');p.criteria[0].text='Changed';p.outcome='A different outcome';touch(p,'changed');assert.equal(p.approval,null);assert.notEqual(o.brief.criteria[0].text,p.criteria[0].text);assert.throws(()=>addOutput(p,a,'<html></html>','demo'));});
test('Answer changes require reselection',()=>{const p=newProject(),q=p.questions[0];answerQuestion(p,q.id,q.options[0]);p.criteria.at(-1).selected=true;answerQuestion(p,q.id,q.options[1]);assert.equal(p.criteria.at(-1).selected,false);assert.equal(p.criteria.length,3);assert.match(p.criteria.at(-1).check,/5 spaces/);});
test('Chat decisions update brief without silently selecting checks',()=>{const p=newProject();demoChat(p,'Capacity: 3 volunteers per shift. Prevent overlapping bookings. Allow cancellation.');assert.equal(p.questions.filter(q=>!q.answer).length,0);assert.equal(p.criteria.length,5);assert.equal(selected(p).length,0);});
test('Unknown requests remain visible as unresolved decisions',()=>{const p=newProject();demoChat(p,'Make signup available in Spanish');assert.match(p.questions.at(-1).text,/Spanish/);assert.equal(p.questions.at(-1).answer,'');});
test('Generated scripts parse for every scenario and escape HTML input',()=>{for(const type of ['volunteer','planner','lending']){const p=newProject(type);p.title='</script><script>alert(1)</script>';const html=demoOutput(snapshot(p));const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];assert.equal(scripts.length,1);new vm.Script(scripts[0][1]);assert.match(html,/\\u003c/);assert.match(sandboxHTML(html),/connect-src 'none'/);}});
function generatedRuntime(type){
 const html=demoOutput(snapshot(newProject(type))),script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1],elements={},handlers={};
 const document={getElementById(id){return elements[id]??={value:'',innerHTML:'',textContent:'',reportValidity:()=>true}},addEventListener(name,fn){handlers[name]=fn},querySelectorAll(){return []}};
 vm.runInNewContext(script,{document});
 return {el:document.getElementById,click:dataset=>handlers.click({target:{closest:()=>({dataset})}}),change:target=>handlers.change({target}),run:source=>vm.runInNewContext(source)};
}
test('Volunteer app blocks duplicates, overlaps and capacity, then reopens cancelled spaces',()=>{
 const r=generatedRuntime('volunteer');r.el('name').value='Test Volunteer';r.el('email').value='one@example.com';r.click({book:'0'});assert.match(r.el('notice').textContent,/signed up/);
 r.click({book:'1'});assert.match(r.el('notice').textContent,/overlap/);r.click({book:'0'});assert.match(r.el('notice').textContent,/already/);
 for(const mail of ['two','three']){r.el('email').value=mail+'@example.com';r.click({book:'0'});}
 r.el('email').value='four@example.com';r.click({book:'0'});assert.match(r.el('notice').textContent,/full/);r.click({cancel:'0'});assert.match(r.el('notice').textContent,/cancelled/);r.click({book:'0'});assert.match(r.el('notice').textContent,/signed up/);
});
test('Lending app validates a borrower and records loan and return',()=>{const r=generatedRuntime('lending');r.click({loan:'0'});assert.match(r.el('notice').textContent,/Enter your name/);r.el('name').value='Test Borrower';r.click({loan:'0'});assert.match(r.el('content').innerHTML,/Borrowed by Test Borrower/);r.click({loan:'0'});assert.match(r.el('notice').textContent,/returned/);});
test('Planner rejects whitespace and updates completion',()=>{const r=generatedRuntime('planner');r.el('task').value='  ';r.el('taskform').onsubmit({preventDefault(){}});assert.match(r.el('notice').textContent,/Enter a task/);r.el('task').value='Read chapter';r.el('taskform').onsubmit({preventDefault(){}});assert.match(r.el('content').innerHTML,/0 \/ 1 complete/);r.change({dataset:{done:'0'},checked:true});assert.match(r.el('content').innerHTML,/1 \/ 1 complete/);r.click({delete:'0'});assert.match(r.el('content').innerHTML,/0 \/ 0 complete/);});
console.log(`${count} workflow tests passed.`);
