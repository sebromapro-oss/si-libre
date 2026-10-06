const SUPABASE_URL='https://uytfaovghnnagpzoslzx.supabase.co';
const SUPABASE_KEY='sb_publishable_Pi8cQCzTW30Thxlv3443NA_fXn1j9WO';
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

const loginView=$('#loginView'),studentView=$('#studentView'),teacherView=$('#teacherView'),publicArchiveView=$('#publicArchiveView'),logoutBtn=$('#logoutBtn');
let session=null,profile=null,questions=[],states=[],freeQueue=[],freeIndex=0,freeCurrent=null,currentClassSession=null,classQuestions=[],teacherSession=null,timerHandle=null;
const stageOrder=['J0','J+2','J+7','J+21','J+45','J+90'];
const stageDays={'J0':0,'J+2':2,'J+7':7,'J+21':21,'J+45':45,'J+90':90};
const labels={TSMA:'BTS TSMA',MMCM:'BTS MMCM',BAC_PRO:'Bac Pro Maintenance',CAP:'CAP Maintenance'};

function show(el){if(el)el.classList.remove('hidden')}
function hide(el){if(el)el.classList.add('hidden')}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function addDays(n){const d=new Date();d.setDate(d.getDate()+n);return d.toISOString()}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function nextStage(stage,result){
  let i=Math.max(0,stageOrder.indexOf(stage));
  if(result==='correct')i=Math.min(stageOrder.length-1,i+1);
  else if(result==='wrong')i=Math.max(0,i-1);
  return stageOrder[i];
}
function dueFor(stage,result){
  if(result==='wrong')return addDays(1);
  if(result==='fragile')return addDays(2);
  return addDays(stageDays[stage]||2);
}
function fmtDate(v){return v?new Date(v).toLocaleDateString('fr-FR'):'—'}

async function init(){
  const params=new URLSearchParams(window.location.search);
  const archiveTrack=(params.get('track')||'').toUpperCase();
  if(params.get('mode')==='archive'&&['TSMA','MMCM','BAC_PRO','CAP'].includes(archiveTrack)){
    hide(loginView);hide(studentView);hide(teacherView);hide(logoutBtn);show(publicArchiveView);
    await loadPublicArchive(archiveTrack);
    return;
  }
  const {data:{session:s}}=await db.auth.getSession();session=s;
  db.auth.onAuthStateChange((_e,s2)=>{session=s2;if(!s2)resetToLogin()});
  if(session)await enterApp();else resetToLogin();
}
function resetToLogin(){
  session=profile=null;
  hide(studentView);hide(teacherView);hide(publicArchiveView);hide(logoutBtn);show(loginView);
}
$('#loginForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const login=$('#email').value.trim().toUpperCase();
  const password=$('#password').value;
  const internalEmail=login==='PROF-SI'?'prof-si@local.invalid':'';
  $('#loginMsg').textContent='Connexion…';
  if(!internalEmail){$('#loginMsg').textContent='Identifiant inconnu.';return}
  let auth=await db.auth.signInWithPassword({email:internalEmail,password});
  if(auth.error){
    const activation=await db.rpc('activate_reactivation_teacher',{p_login:login,p_password:password});
    if(!activation.error&&activation.data===true){
      auth=await db.auth.signInWithPassword({email:internalEmail,password});
    }
  }
  if(auth.error){$('#loginMsg').textContent='Connexion impossible. Vérifie ton identifiant et ton mot de passe.';return}
  session=auth.data.session;$('#loginMsg').textContent='';await enterApp();
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
  const [q,s]=await Promise.all([
    db.from('reactivation_questions').select('*').eq('track',profile.track).eq('active',true).neq('status','DOUBLON_NOTION'),
    db.from('reactivation_state').select('*').eq('user_id',session.user.id).eq('track',profile.track)
  ]);
  questions=q.data||[];states=s.data||[];
  renderMemoryStats();
  await loadCurrentClassSession();
  await loadSessionHistory();
  buildFreeQueue();
  renderFreeQuestion();
}

$$('.mode-btn').forEach(btn=>btn.addEventListener('click',()=>{
  $$('.mode-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
  $$('.student-pane').forEach(hide);show($('#'+btn.dataset.view));
}));

async function loadCurrentClassSession(){
  const {data,error}=await db.from('reactivation_sessions')
    .select('*').eq('track',profile.track).neq('status','draft')
    .order('session_date',{ascending:false}).order('created_at',{ascending:false}).limit(1);
  if(error||!data?.length){currentClassSession=null;show($('#noClassSession'));hide($('#classSessionPanel'));return}
  currentClassSession=data[0];
  const sq=await db.from('reactivation_session_questions').select('*')
    .eq('session_id',currentClassSession.id).order('position');
  classQuestions=(sq.data||[]).map(x=>questions.find(q=>q.id===x.question_id)).filter(Boolean);
  hide($('#noClassSession'));show($('#classSessionPanel'));renderClassSession();
}

function phaseLabel(status){
  return status==='reflection'?'PHASE 1 — RÉFLEXION 5 MIN':
         status==='correction'?'PHASE 2 — CORRECTION 10 MIN':
         status==='closed'?'SÉANCE ARCHIVÉE — REPRISE AUTONOME':'SÉANCE PRÉPARÉE';
}
function renderClassSession(){
  if(!currentClassSession)return;
  $('#classPhase').textContent=phaseLabel(currentClassSession.status);
  $('#classTitle').textContent=currentClassSession.title;
  $('#classDate').textContent='Séance du '+new Date(currentClassSession.session_date+'T12:00:00').toLocaleDateString('fr-FR');
  const reveal=currentClassSession.status==='correction'||currentClassSession.status==='closed';
  $('#classQuestions').innerHTML=classQuestions.map((q,i)=>questionCard(q,i+1,reveal,true)).join('');
  reveal?show($('#classCorrectionHint')):hide($('#classCorrectionHint'));
  bindClassRatings();
  startPhaseTimer(currentClassSession);
}
function questionCard(q,pos,reveal,rateable){
  return `<article class="panel mini-question">
    <div class="question-meta"><span class="tag">Q${pos}</span><span class="tag soft">${esc(q.sequence||'')}</span><span class="tag soft">${esc(q.theme||'')}</span></div>
    <p class="eyebrow">${esc(q.notion||'')}</p>
    <h3>${esc(q.question)}</h3>
    ${reveal?`<div class="answer compact"><p class="answer-label">Réponse attendue</p><p>${esc(q.answer)}</p>
      ${rateable?`<div class="rating compact-rating" data-qid="${esc(q.id)}">
        <button class="btn success" data-result="correct" type="button">Je savais</button>
        <button class="btn warn" data-result="fragile" type="button">J’ai hésité</button>
        <button class="btn danger" data-result="wrong" type="button">À revoir</button>
      </div>`:''}
    </div>`:''}
  </article>`;
}
function bindClassRatings(){
  $$('#classQuestions .rating button').forEach(b=>b.addEventListener('click',async()=>{
    const wrap=b.closest('.rating');const q=questions.find(x=>x.id===wrap.dataset.qid);if(!q)return;
    await rateQuestion(q,b.dataset.result);wrap.querySelectorAll('button').forEach(x=>x.disabled=true);b.textContent='Enregistré';
  }));
}

function startPhaseTimer(sess){
  clearInterval(timerHandle);
  const mins=sess.status==='reflection'?sess.reflection_minutes:sess.status==='correction'?sess.correction_minutes:0;
  if(!mins){$('#phaseTimer').textContent='—';$('#timerLabel').textContent=sess.status==='closed'?'À revoir librement':'Temps conseillé';return}
  $('#timerLabel').textContent=sess.status==='reflection'?'Réflexion':'Correction';
  const started=new Date(sess.updated_at).getTime(),end=started+mins*60000;
  const tick=()=>{
    const left=Math.max(0,end-Date.now()),m=String(Math.floor(left/60000)).padStart(2,'0'),s=String(Math.floor((left%60000)/1000)).padStart(2,'0');
    $('#phaseTimer').textContent=m+':'+s;
  };
  tick();timerHandle=setInterval(tick,1000);
}

async function loadSessionHistory(){
  const {data}=await db.from('reactivation_sessions').select('*').eq('track',profile.track)
    .order('session_date',{ascending:false}).order('created_at',{ascending:false}).limit(30);
  const rows=data||[];
  $('#sessionHistory').innerHTML=rows.length?rows.map(s=>`<button class="history-item" data-id="${s.id}" type="button">
    <span><strong>${esc(s.title)}</strong><small>${fmtDate(s.session_date)}</small></span>
    <span class="tag soft">${s.status==='closed'?'Revoir':'En cours'}</span>
  </button>`).join(''):'<p class="micro">Aucune ancienne séance pour le moment.</p>';
  $$('#sessionHistory .history-item').forEach(b=>b.addEventListener('click',()=>openArchivedSession(b.dataset.id)));
}
async function openArchivedSession(id){
  const {data:s}=await db.from('reactivation_sessions').select('*').eq('id',id).single();
  const {data:items}=await db.from('reactivation_session_questions').select('*').eq('session_id',id).order('position');
  if(!s)return;
  currentClassSession={...s,status:'closed'};
  classQuestions=(items||[]).map(x=>questions.find(q=>q.id===x.question_id)).filter(Boolean);
  $$('.mode-btn').forEach(b=>b.classList.toggle('active',b.dataset.view==='classSession'));
  $$('.student-pane').forEach(hide);show($('#classSession'));
  hide($('#noClassSession'));show($('#classSessionPanel'));renderClassSession();
  window.scrollTo({top:0,behavior:'smooth'});
}

function buildFreeQueue(){
  const now=Date.now(),stateMap=new Map(states.map(s=>[s.question_id,s]));
  const due=states.filter(s=>new Date(s.due_at).getTime()<=now)
    .sort((a,b)=>new Date(a.due_at)-new Date(b.due_at))
    .map(s=>questions.find(q=>q.id===s.question_id)).filter(Boolean);
  const fresh=shuffle(questions.filter(q=>!stateMap.has(q.id)));
  const later=states.filter(s=>new Date(s.due_at).getTime()>now)
    .sort((a,b)=>new Date(a.due_at)-new Date(b.due_at))
    .map(s=>questions.find(q=>q.id===s.question_id)).filter(Boolean);
  const unique=[];for(const q of [...due,...fresh,...later])if(q&&!unique.some(x=>x.id===q.id))unique.push(q);
  freeQueue=unique.slice(0,4);freeIndex=0;
}
function renderFreeQuestion(){
  const card=$('#freeQuestionCard');
  if(!freeQueue.length){card.innerHTML='<p class="lead">Aucune question disponible.</p>';return}
  if(freeIndex>=freeQueue.length){card.innerHTML='<div class="center"><p class="eyebrow">SÉRIE TERMINÉE</p><h2>4 réactivations terminées.</h2><button id="againBtn" class="btn primary" type="button">Nouvelle série</button></div>';$('#againBtn')?.addEventListener('click',()=>{buildFreeQueue();renderFreeQuestion()});return}
  freeCurrent=freeQueue[freeIndex];
  card.innerHTML=`<div class="question-meta"><span class="tag">${freeIndex+1} / ${freeQueue.length}</span><span class="tag soft">${esc(freeCurrent.sequence||'')}</span><span class="tag soft">${esc(freeCurrent.theme||'')}</span></div>
  <p class="eyebrow">${esc(freeCurrent.notion||'')}</p><h2>${esc(freeCurrent.question)}</h2>
  <button id="freeRevealBtn" class="btn primary" type="button">Afficher la réponse</button>
  <div id="freeAnswer" class="answer hidden"><p class="answer-label">Réponse attendue</p><p>${esc(freeCurrent.answer)}</p>
    <div class="rating"><button class="btn success" data-result="correct" type="button">Je savais</button><button class="btn warn" data-result="fragile" type="button">J’ai hésité</button><button class="btn danger" data-result="wrong" type="button">À revoir</button></div>
  </div>`;
  $('#freeRevealBtn').addEventListener('click',()=>{hide($('#freeRevealBtn'));show($('#freeAnswer'))});
  $$('#freeAnswer .rating button').forEach(b=>b.addEventListener('click',async()=>{await rateQuestion(freeCurrent,b.dataset.result);freeIndex++;renderFreeQuestion()}));
}
$('#newFreeReviewBtn').addEventListener('click',()=>{buildFreeQueue();renderFreeQuestion()});

async function rateQuestion(q,result){
  const existing=states.find(s=>s.question_id===q.id),before=existing?.stage||'J0',after=nextStage(before,result);
  const payload={user_id:session.user.id,question_id:q.id,track:profile.track,stage:after,due_at:dueFor(after,result),
    successes:(existing?.successes||0)+(result==='correct'?1:0),
    failures:(existing?.failures||0)+(result==='wrong'?1:0),
    last_result:result,last_seen_at:new Date().toISOString(),updated_at:new Date().toISOString()};
  const {error}=await db.from('reactivation_state').upsert(payload,{onConflict:'user_id,question_id,track'});
  if(error)return;
  await db.from('reactivation_attempts').insert({user_id:session.user.id,question_id:q.id,track:profile.track,result,stage_before:before,stage_after:after});
  const i=states.findIndex(s=>s.question_id===q.id);if(i>=0)states[i]={...states[i],...payload};else states.push(payload);
  renderMemoryStats();
}

function renderMemoryStats(){
  const mastered=states.filter(s=>['J+21','J+45','J+90'].includes(s.stage)).length;
  const stable=states.filter(s=>s.stage==='J+90').length;
  const fragile=states.filter(s=>s.last_result==='wrong'||s.last_result==='fragile').length;
  const seen=states.length;
  $('#masteredCount').textContent=mastered+' maîtrisée'+(mastered>1?'s':'');
  $('#fragileCount').textContent=fragile+' à revoir';
  $('#memoryStats').innerHTML=[['Notions vues',seen],['En consolidation',Math.max(0,seen-mastered)],['Maîtrisées',mastered],['Stables',stable]]
    .map(([l,v])=>`<div class="stat"><span>${esc(l)}</span><strong>${v}</strong></div>`).join('');
}

async function loadTeacher(){
  await Promise.all([loadTeacherDashboard(),loadLatestTeacherSession()]);
}
async function loadTeacherDashboard(){
  const [profilesR,questionsR,attemptsR,stateR]=await Promise.all([
    db.from('reactivation_profiles').select('user_id,display_name,track,role,active').order('display_name'),
    db.from('reactivation_questions').select('track,id,status').eq('active',true),
    db.from('reactivation_attempts').select('user_id,result,attempted_at'),
    db.from('reactivation_state').select('user_id,stage,last_result,last_seen_at')
  ]);
  const ps=profilesR.data||[],qs=questionsR.data||[],ats=attemptsR.data||[],st=stateR.data||[];
  const cards=['TSMA','MMCM','BAC_PRO','CAP'].map(t=>[labels[t],qs.filter(q=>q.track===t&&q.status!=='DOUBLON_NOTION').length]);
  cards.push(['Comptes élèves',ps.filter(p=>p.role==='student').length],['Tentatives',ats.length]);
  $('#teacherStats').innerHTML=cards.map(([l,v])=>`<div class="stat"><span>${esc(l)}</span><strong>${v}</strong></div>`).join('');
  $('#studentsBody').innerHTML=ps.filter(p=>p.role==='student').map(p=>{
    const ss=st.filter(x=>x.user_id===p.user_id),aa=ats.filter(x=>x.user_id===p.user_id);
    const mastered=ss.filter(x=>['J+21','J+45','J+90'].includes(x.stage)).length,stable=ss.filter(x=>x.stage==='J+90').length;
    const fragile=ss.filter(x=>x.last_result==='wrong'||x.last_result==='fragile').length;
    const last=[...ss.map(x=>x.last_seen_at),...aa.map(x=>x.attempted_at)].filter(Boolean).sort().at(-1);
    return `<tr><td>${esc(p.display_name||'—')}</td><td>${esc(labels[p.track]||p.track||'—')}</td><td>${ss.length}</td><td>${fragile}</td><td>${mastered}</td><td>${stable}</td><td>${aa.length}</td><td>${last?fmtDate(last):'—'}</td><td>${p.active?'Oui':'Non'}</td></tr>`;
  }).join('');
}

$('#createSessionBtn').addEventListener('click',createClassSession);
async function createClassSession(){
  const track=$('#sessionTrack').value,title=$('#sessionTitle').value.trim()||'Réactivation du jour';
  $('#teacherMsg').textContent='Création de la séance…';
  const {data:q,error}=await db.from('reactivation_questions').select('*').eq('track',track).eq('active',true).neq('status','DOUBLON_NOTION');
  if(error||!q?.length){$('#teacherMsg').textContent='Impossible de charger les questions.';return}
  const selected=pickDiverse(q,4);
  const {data:s,error:se}=await db.from('reactivation_sessions').insert({track,title,created_by:session.user.id}).select().single();
  if(se){$('#teacherMsg').textContent='Impossible de créer la séance.';return}
  const rows=selected.map((x,i)=>({session_id:s.id,position:i+1,question_id:x.id,track}));
  const ins=await db.from('reactivation_session_questions').insert(rows);
  if(ins.error){$('#teacherMsg').textContent='Séance créée mais questions non enregistrées.';return}
  teacherSession=s;$('#teacherMsg').textContent='Séance prête.';await renderTeacherSession(selected);
}
function pickDiverse(q,n){
  const shuffled=shuffle(q),out=[],notions=new Set();
  for(const x of shuffled){if(!notions.has(x.notion)){out.push(x);notions.add(x.notion)}if(out.length===n)break}
  for(const x of shuffled){if(out.length===n)break;if(!out.some(y=>y.id===x.id))out.push(x)}
  return out;
}
async function loadLatestTeacherSession(){
  const {data}=await db.from('reactivation_sessions').select('*').order('created_at',{ascending:false}).limit(1);
  if(!data?.length)return;
  teacherSession=data[0];
  const {data:items}=await db.from('reactivation_session_questions').select('*').eq('session_id',teacherSession.id).order('position');
  const {data:q}=await db.from('reactivation_questions').select('*').eq('track',teacherSession.track).in('id',(items||[]).map(x=>x.question_id));
  const ordered=(items||[]).map(x=>(q||[]).find(y=>y.id===x.question_id)).filter(Boolean);
  await renderTeacherSession(ordered);
}
async function renderTeacherSession(qs){
  show($('#teacherSessionPanel'));
  $('#teacherSessionTitle').textContent=teacherSession.title;
  $('#teacherSessionMeta').textContent=(labels[teacherSession.track]||teacherSession.track)+' • '+phaseLabel(teacherSession.status);
  const reveal=teacherSession.status==='correction'||teacherSession.status==='closed';
  $('#teacherSessionQuestions').innerHTML=qs.map((q,i)=>questionCard(q,i+1,reveal,false)).join('');
}
async function setTeacherPhase(status){
  if(!teacherSession)return;
  const {data,error}=await db.from('reactivation_sessions').update({status,updated_at:new Date().toISOString()}).eq('id',teacherSession.id).select().single();
  if(error){$('#teacherMsg').textContent='Impossible de changer de phase.';return}
  teacherSession=data;
  const {data:items}=await db.from('reactivation_session_questions').select('*').eq('session_id',teacherSession.id).order('position');
  const {data:q}=await db.from('reactivation_questions').select('*').eq('track',teacherSession.track).in('id',(items||[]).map(x=>x.question_id));
  await renderTeacherSession((items||[]).map(x=>(q||[]).find(y=>y.id===x.question_id)).filter(Boolean));
}
$('#startReflectionBtn').addEventListener('click',()=>setTeacherPhase('reflection'));
$('#startCorrectionBtn').addEventListener('click',()=>setTeacherPhase('correction'));
$('#closeSessionBtn').addEventListener('click',()=>setTeacherPhase('closed'));

if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
init();

async function loadPublicArchive(track){
  $('#archiveTrackBadge').textContent=labels[track]||track;
  const list=$('#publicArchiveList');
  list.innerHTML='<p class="micro">Chargement des séances…</p>';
  try{
    const url=SUPABASE_URL+'/functions/v1/reactivation-public-archive?track='+encodeURIComponent(track);
    const res=await fetch(url);
    if(!res.ok)throw new Error('archive');
    const data=await res.json();
    const sessions=data.sessions||[];
    if(!sessions.length){list.innerHTML='<p class="lead">Aucune séance clôturée pour le moment.</p>';return}
    list.innerHTML=sessions.map(s=>`<button class="history-item public-session" data-id="${esc(s.id)}" type="button">
      <span><strong>${esc(s.title)}</strong><small>${fmtDate(s.session_date)}</small></span>
      <span class="tag soft">${s.questions.length} questions</span>
    </button>`).join('');
    $$('.public-session').forEach(b=>b.addEventListener('click',()=>{
      const s=sessions.find(x=>x.id===b.dataset.id);if(s)renderPublicArchiveSession(s);
    }));
  }catch(e){
    list.innerHTML='<p class="msg">Impossible de charger les séances pour le moment.</p>';
  }
}
function renderPublicArchiveSession(s){
  hide($('#publicArchiveList').closest('.panel'));show($('#publicArchiveDetail'));
  $('#archiveSessionMeta').textContent='Séance du '+fmtDate(s.session_date)+' • correction autonome';
  $('#archiveSessionTitle').textContent=s.title;
  $('#publicArchiveQuestions').innerHTML=(s.questions||[]).map((q,i)=>questionCard(q,i+1,true,false)).join('');
}
$('#archiveBackBtn')?.addEventListener('click',()=>{
  show($('#publicArchiveList').closest('.panel'));hide($('#publicArchiveDetail'));
  window.scrollTo({top:0,behavior:'smooth'});
});
