const SUPABASE_URL='https://uytfaovghnnagpzoslzx.supabase.co';
const SUPABASE_KEY='sb_publishable_Pi8cQCzTW30Thxlv3443NA_fXn1j9WO';
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const loginView=$('#loginView'),studentView=$('#studentView'),teacherView=$('#teacherView'),logoutBtn=$('#logoutBtn');
let session=null,profile=null,questions=[],states=[],queue=[],current=null,done=0,sessionResults={correct:0,fragile:0,wrong:0};

const stageOrder=['J0','J+2','J+7','J+21','J+45','J+90'];
const stageDays={'J0':2,'J+2':7,'J+7':21,'J+21':45,'J+45':90,'J+90':90};
const labels={TSMA:'BTS TSMA',MMCM:'BTS MMCM',BAC_PRO:'Bac Pro Maintenance',CAP:'CAP Maintenance'};

function show(el){el.classList.remove('hidden')} function hide(el){el.classList.add('hidden')}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function addDays(n){const d=new Date();d.setDate(d.getDate()+n);return d.toISOString()}
function nextStage(stage,result){
  let i=Math.max(0,stageOrder.indexOf(stage));
  if(result==='correct') i=Math.min(stageOrder.length-1,i+1);
  else if(result==='wrong') i=Math.max(0,i-1);
  return stageOrder[i];
}
function dueFor(stage,result){
  if(result==='wrong') return addDays(1);
  if(result==='fragile') return addDays(2);
  return addDays(stageDays[stage]||2);
}

async function init(){
  const {data:{session:s}}=await db.auth.getSession();session=s;
  db.auth.onAuthStateChange((_e,s2)=>{session=s2;if(!s2)resetToLogin()});
  if(session) await enterApp(); else resetToLogin();
}
function resetToLogin(){session=profile=null;hide(studentView);hide(teacherView);hide(logoutBtn);show(loginView)}
$('#loginForm').addEventListener('submit',async e=>{
  e.preventDefault();$('#loginMsg').textContent='Connexion…';
  const {data,error}=await db.auth.signInWithPassword({email:$('#email').value.trim(),password:$('#password').value});
  if(error){$('#loginMsg').textContent='Connexion impossible. Vérifie tes identifiants.';return}
  session=data.session;$('#loginMsg').textContent='';await enterApp();
});
logoutBtn.addEventListener('click',()=>db.auth.signOut());

async function enterApp(){
  const {data,error}=await db.from('reactivation_profiles').select('*').eq('user_id',session.user.id).single();
  if(error||!data||!data.active){await db.auth.signOut();$('#loginMsg').textContent='Compte non autorisé ou désactivé.';return}
  profile=data;hide(loginView);show(logoutBtn);
  if(profile.role==='teacher'){hide(studentView);show(teacherView);await loadTeacher();return}
  hide(teacherView);show(studentView);await loadStudent();
}
async function loadStudent(){
  $('#trackBadge').textContent=labels[profile.track]||profile.track;
  $('#welcomeTitle').textContent='Bonjour'+(profile.display_name?' '+profile.display_name:'');
  const q=await db.from('reactivation_questions').select('*').eq('track',profile.track).eq('active',true).neq('status','DOUBLON_NOTION');
  const s=await db.from('reactivation_state').select('*').eq('user_id',session.user.id).eq('track',profile.track);
  if(q.error){$('#questionText').textContent='Impossible de charger les réactivations.';return}
  questions=q.data||[];states=s.data||[];
  buildQueue(4);renderMemoryStats();renderQuestion();
}
function buildQueue(target){
  const now=Date.now(), stateMap=new Map(states.map(s=>[s.question_id,s]));
  const due=states.filter(s=>new Date(s.due_at).getTime()<=now)
    .sort((a,b)=>new Date(a.due_at)-new Date(b.due_at))
    .map(s=>questions.find(q=>q.id===s.question_id)).filter(Boolean);
  const fresh=questions.filter(q=>!stateMap.has(q.id));
  const later=states.filter(s=>new Date(s.due_at).getTime()>now)
    .sort((a,b)=>new Date(a.due_at)-new Date(b.due_at))
    .map(s=>questions.find(q=>q.id===s.question_id)).filter(Boolean);
  const unique=[];for(const q of [...due,...shuffle(fresh),...later]) if(q&&!unique.some(x=>x.id===q.id)) unique.push(q);
  queue=unique.slice(0,target);done=0;sessionResults={correct:0,fragile:0,wrong:0};
}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function renderQuestion(){
  $('#dailyProgress').textContent=Math.min(done,queue.length)+' / '+queue.length;
  $('#dailyBar').style.width=(queue.length?Math.min(100,done/queue.length*100):0)+'%';
  if(done>=queue.length||!queue.length){hide($('#questionCard'));show($('#sessionDone'));renderSummary();return}
  current=queue[done];show($('#questionCard'));hide($('#sessionDone'));hide($('#answerBlock'));show($('#revealBtn'));
  $('#sequenceTag').textContent=current.sequence||'Réactivation';
  $('#themeTag').textContent=current.theme||'SI';
  $('#difficultyTag').textContent=current.difficulty||'';
  $('#notionLabel').textContent=current.notion||'';
  $('#questionText').textContent=current.question;
  $('#answerText').textContent=current.answer;
}
$('#revealBtn').addEventListener('click',()=>{show($('#answerBlock'));hide($('#revealBtn'));$$('.rating button')[0]?.focus()});
$$('.rating button').forEach(b=>b.addEventListener('click',()=>rate(b.dataset.result)));
async function rate(result){
  if(!current)return;
  $$('.rating button').forEach(b=>b.disabled=true);
  const existing=states.find(s=>s.question_id===current.id);
  const before=existing?.stage||'J0';
  const after=nextStage(before,result);
  const payload={
    user_id:session.user.id,question_id:current.id,track:profile.track,stage:after,due_at:dueFor(after,result),
    successes:(existing?.successes||0)+(result==='correct'?1:0),
    failures:(existing?.failures||0)+(result==='wrong'?1:0),
    last_result:result,last_seen_at:new Date().toISOString(),updated_at:new Date().toISOString()
  };
  const {error}=await db.from('reactivation_state').upsert(payload,{onConflict:'user_id,question_id,track'});
  if(!error){
    await db.from('reactivation_attempts').insert({user_id:session.user.id,question_id:current.id,track:profile.track,result,stage_before:before,stage_after:after});
    const i=states.findIndex(s=>s.question_id===current.id);if(i>=0)states[i]={...states[i],...payload};else states.push(payload);
    sessionResults[result]++;done++;renderMemoryStats();renderQuestion();
  }
  $$('.rating button').forEach(b=>b.disabled=false);
}
function renderSummary(){
  $('#sessionSummary').textContent=`${sessionResults.correct} acquis • ${sessionResults.fragile} hésitant(s) • ${sessionResults.wrong} à revoir`;
}
$('#extraBtn').addEventListener('click',()=>{buildQueue(2);renderQuestion()});
function renderMemoryStats(){
  const mastered=states.filter(s=>['J+21','J+45','J+90'].includes(s.stage)).length;
  const stable=states.filter(s=>s.stage==='J+90').length;
  const fragile=states.filter(s=>s.last_result==='wrong'||s.last_result==='fragile').length;
  const seen=states.length;
  $('#memoryStats').innerHTML=[
    ['Notions vues',seen],['En consolidation',Math.max(0,seen-mastered)],['Maîtrisées',mastered],['Stables',stable]
  ].map(([l,v])=>`<div class="stat"><span>${esc(l)}</span><strong>${v}</strong></div>`).join('');
}

async function loadTeacher(){
  const [profilesR,questionsR,attemptsR]=await Promise.all([
    db.from('reactivation_profiles').select('user_id,display_name,track,role,active').order('display_name'),
    db.from('reactivation_questions').select('track,id').eq('active',true),
    db.from('reactivation_attempts').select('id',{count:'exact',head:true})
  ]);
  const ps=profilesR.data||[], qs=questionsR.data||[];
  const cards=['TSMA','MMCM','BAC_PRO','CAP'].map(t=>[labels[t],qs.filter(q=>q.track===t).length]);
  cards.push(['Comptes élèves',ps.filter(p=>p.role==='student').length],['Tentatives',attemptsR.count||0]);
  $('#teacherStats').innerHTML=cards.map(([l,v])=>`<div class="stat"><span>${esc(l)}</span><strong>${v}</strong></div>`).join('');
  $('#studentsBody').innerHTML=ps.filter(p=>p.role==='student').map(p=>`<tr><td>${esc(p.display_name||'—')}</td><td>${esc(labels[p.track]||p.track||'—')}</td><td>${p.active?'Oui':'Non'}</td></tr>`).join('');
}
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
init();