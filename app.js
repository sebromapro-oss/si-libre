const SUPABASE_URL='https://uytfaovghnnagpzoslzx.supabase.co';
const SUPABASE_KEY='sb_publishable_Pi8cQCzTW30Thxlv3443NA_fXn1j9WO';
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const loginView=$('#loginView');
const studentView=$('#studentView');
const teacherView=$('#teacherView');
const publicArchiveView=$('#publicArchiveView');
const logoutBtn=$('#logoutBtn');
const labels={TSMA:'BTS TSMA',MMCM:'BTS MMCM',BAC_PRO:'Bac Pro Maintenance',CAP:'CAP Maintenance'};
let teacherToken=sessionStorage.getItem('si_reactivation_teacher_token')||'';
let teacherSession=null;
let timerHandle=null;
let setupMode=false;

function show(el){if(el)el.classList.remove('hidden')}
function hide(el){if(el)el.classList.add('hidden')}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function fmtDate(v){return v?new Date(v).toLocaleDateString('fr-FR'):'—'}

function questionCard(q,pos,reveal){
  return `<article class="panel mini-question">
    <div class="question-meta"><span class="tag">Q${pos}</span><span class="tag soft">${esc(q.sequence||'')}</span><span class="tag soft">${esc(q.theme||'')}</span></div>
    <p class="eyebrow">${esc(q.notion||'')}</p>
    <h3>${esc(q.question)}</h3>
    ${reveal?`<div class="answer compact"><p class="answer-label">Réponse attendue</p><p>${esc(q.answer)}</p></div>`:''}
  </article>`;
}

function phaseLabel(status){
  return status==='reflection'?'PHASE 1 — RÉFLEXION 5 MIN':
         status==='correction'?'PHASE 2 — CORRECTION 10 MIN':
         status==='closed'?'SÉANCE CLÔTURÉE — DISPONIBLE POUR LES ÉLÈVES':
         'SÉANCE PRÉPARÉE';
}

function ensureFirstRunControls(){
  const form=$('#loginForm');
  if(!form)return;
  const password=$('#password');
  if(!$('#confirmWrap')&&password?.parentElement){
    const label=document.createElement('label');
    label.id='confirmWrap';
    label.className='hidden';
    label.textContent='Confirmer le mot de passe';
    const input=document.createElement('input');
    input.id='passwordConfirm';
    input.type='password';
    input.autocomplete='new-password';
    label.appendChild(input);
    password.parentElement.insertAdjacentElement('afterend',label);
  }
  const submit=form.querySelector('button[type="submit"]');
  if(submit&&!submit.id)submit.id='loginSubmitBtn';
  const help=loginView?.querySelector('.micro');
  if(help&&!help.id)help.id='loginHelp';
  const ident=$('#email');
  if(ident)ident.placeholder='Choisis ton identifiant';
}

async function init(){
  ensureFirstRunControls();
  if('serviceWorker' in navigator){
    try{
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r=>r.unregister()));
    }catch{}
  }

  const params=new URLSearchParams(window.location.search);
  const archiveTrack=(params.get('track')||'').toUpperCase();

  if(params.get('mode')==='archive'&&['TSMA','MMCM','BAC_PRO','CAP'].includes(archiveTrack)){
    hide(loginView);hide(studentView);hide(teacherView);hide(logoutBtn);show(publicArchiveView);
    await loadPublicArchive(archiveTrack);
    return;
  }

  hide(studentView);hide(publicArchiveView);

  if(teacherToken){
    const ok=await enterTeacher();
    if(ok)return;
    sessionStorage.removeItem('si_reactivation_teacher_token');
    teacherToken='';
  }

  const {data,error}=await db.rpc('reactivation_teacher_setup_status');
  setupMode=!error&&!data?.configured;
  renderLoginMode();
  resetToLogin();
}

function renderLoginMode(){
  const confirmWrap=$('#confirmWrap');
  const submit=$('#loginSubmitBtn');
  const help=$('#loginHelp');
  const title=loginView?.querySelector('h1');
  const lead=loginView?.querySelector('.lead');

  if(setupMode){
    show(confirmWrap);
    if($('#passwordConfirm'))$('#passwordConfirm').required=true;
    if(title)title.textContent='Créer mon accès professeur.';
    if(lead)lead.textContent='Première connexion : choisis ton identifiant et ton mot de passe. Ils serviront ensuite à toutes tes séances.';
    if(submit)submit.textContent='Créer mon accès professeur';
    if(help)help.textContent='Un seul compte professeur est créé. Les élèves n’ont aucun compte à créer ici.';
  }else{
    hide(confirmWrap);
    if($('#passwordConfirm'))$('#passwordConfirm').required=false;
    if(title)title.textContent='Piloter la réactivation mémoire en classe.';
    if(lead)lead.textContent='Connexion réservée à l’enseignant : 4 questions communes, 5 min de réflexion, puis 10 min de correction active.';
    if(submit)submit.textContent='Se connecter';
    if(help)help.textContent='Les élèves utilisent leur site TSMA, MMCM, Bac Pro ou CAP habituel pour revoir les séances clôturées.';
  }
}

function resetToLogin(){
  clearInterval(timerHandle);
  hide(studentView);hide(teacherView);hide(publicArchiveView);hide(logoutBtn);show(loginView);
}

$('#loginForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const login=$('#email').value.trim();
  const password=$('#password').value;
  const confirm=$('#passwordConfirm')?.value||'';
  $('#loginMsg').textContent=setupMode?'Création de l’accès…':'Connexion…';

  if(setupMode&&password!==confirm){
    $('#loginMsg').textContent='Les deux mots de passe sont différents.';
    return;
  }

  const rpc=setupMode?'reactivation_teacher_register':'reactivation_teacher_login';
  const {data,error}=await db.rpc(rpc,{p_login:login,p_password:password});

  if(error||!data?.ok||!data?.token){
    const code=data?.error||'';
    $('#loginMsg').textContent=
      code==='invalid_login'?'Identifiant invalide : 4 à 32 caractères, lettres/chiffres/tiret/underscore.':
      code==='weak_password'?'Mot de passe trop court : 10 caractères minimum.':
      code==='already_configured'?'Un accès professeur existe déjà. Recharge la page pour te connecter.':
      'Connexion impossible.';
    return;
  }

  teacherToken=data.token;
  sessionStorage.setItem('si_reactivation_teacher_token',teacherToken);
  $('#password').value='';
  if($('#passwordConfirm'))$('#passwordConfirm').value='';
  $('#loginMsg').textContent='';
  setupMode=false;
  await enterTeacher();
});

logoutBtn.addEventListener('click',()=>{
  teacherToken='';
  sessionStorage.removeItem('si_reactivation_teacher_token');
  teacherSession=null;
  setupMode=false;
  renderLoginMode();
  resetToLogin();
});

async function enterTeacher(){
  const {data,error}=await db.rpc('reactivation_teacher_dashboard',{p_token:teacherToken});
  if(error||!data)return false;

  hide(loginView);hide(studentView);hide(publicArchiveView);show(teacherView);show(logoutBtn);

  const counts=data.counts||{};
  $('#teacherStats').innerHTML=[
    ['BTS TSMA',counts.TSMA||0],
    ['BTS MMCM',counts.MMCM||0],
    ['Bac Pro',counts.BAC_PRO||0],
    ['CAP',counts.CAP||0],
    ['Séances créées',data.sessions||0]
  ].map(([l,v])=>`<div class="stat"><span>${esc(l)}</span><strong>${v}</strong></div>`).join('');

  const studentsBody=$('#studentsBody');
  if(studentsBody){
    studentsBody.innerHTML='<tr><td colspan="9">Le suivi individuel reste dans les sites TSMA, MMCM, Bac Pro et CAP. Ici : pilotage collectif de la réactivation mémoire.</td></tr>';
  }

  await loadLatestTeacherSession();
  return true;
}

$('#createSessionBtn').addEventListener('click',async()=>{
  const track=$('#sessionTrack').value;
  const title=$('#sessionTitle').value.trim()||'Réactivation du jour';
  $('#teacherMsg').textContent='Création de la séance…';

  const {data,error}=await db.rpc('reactivation_teacher_create_session',{
    p_token:teacherToken,
    p_track:track,
    p_title:title
  });

  if(error||!data){
    $('#teacherMsg').textContent='Impossible de créer la séance.';
    return;
  }

  teacherSession=data;
  $('#teacherMsg').textContent='Séance prête.';
  renderTeacherSession();
});

async function loadLatestTeacherSession(){
  const {data,error}=await db.rpc('reactivation_teacher_latest_session',{p_token:teacherToken});
  if(error||!data)return;
  teacherSession=data;
  renderTeacherSession();
}

function renderTeacherSession(){
  if(!teacherSession)return;
  show($('#teacherSessionPanel'));
  $('#teacherSessionTitle').textContent=teacherSession.title;
  $('#teacherSessionMeta').textContent=(labels[teacherSession.track]||teacherSession.track)+' • '+phaseLabel(teacherSession.status);

  const reveal=teacherSession.status==='correction'||teacherSession.status==='closed';
  $('#teacherSessionQuestions').innerHTML=(teacherSession.questions||[])
    .map((q,i)=>questionCard(q,i+1,reveal))
    .join('');

  startTeacherTimer();
}

function startTeacherTimer(){
  clearInterval(timerHandle);
  if(!teacherSession)return;

  const mins=teacherSession.status==='reflection'
    ?(teacherSession.reflection_minutes||5)
    :teacherSession.status==='correction'
      ?(teacherSession.correction_minutes||10)
      :0;

  if(!mins)return;

  const started=new Date(teacherSession.updated_at||Date.now()).getTime();
  const end=started+mins*60000;

  const tick=()=>{
    const left=Math.max(0,end-Date.now());
    const m=String(Math.floor(left/60000)).padStart(2,'0');
    const s=String(Math.floor((left%60000)/1000)).padStart(2,'0');
    $('#teacherSessionMeta').textContent=(labels[teacherSession.track]||teacherSession.track)+' • '+phaseLabel(teacherSession.status)+' • '+m+':'+s;
  };

  tick();
  timerHandle=setInterval(tick,1000);
}

async function setTeacherPhase(status){
  if(!teacherSession)return;
  $('#teacherMsg').textContent='Mise à jour…';

  const {data,error}=await db.rpc('reactivation_teacher_set_phase',{
    p_token:teacherToken,
    p_session_id:teacherSession.session_id,
    p_status:status
  });

  if(error||!data){
    $('#teacherMsg').textContent='Impossible de changer de phase.';
    return;
  }

  teacherSession=data;
  $('#teacherMsg').textContent=status==='closed'
    ?'Séance clôturée : elle est maintenant disponible depuis les sites élèves.'
    :'';
  renderTeacherSession();
}

$('#startReflectionBtn').addEventListener('click',()=>setTeacherPhase('reflection'));
$('#startCorrectionBtn').addEventListener('click',()=>setTeacherPhase('correction'));
$('#closeSessionBtn').addEventListener('click',()=>setTeacherPhase('closed'));

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
    if(!sessions.length){
      list.innerHTML='<p class="lead">Aucune séance clôturée pour le moment.</p>';
      return;
    }
    list.innerHTML=sessions.map(s=>`<button class="history-item public-session" data-id="${esc(s.id)}" type="button">
      <span><strong>${esc(s.title)}</strong><small>${fmtDate(s.session_date)}</small></span>
      <span class="tag soft">${s.questions.length} questions</span>
    </button>`).join('');
    $$('.public-session').forEach(b=>b.addEventListener('click',()=>{
      const s=sessions.find(x=>x.id===b.dataset.id);
      if(s)renderPublicArchiveSession(s);
    }));
  }catch{
    list.innerHTML='<p class="msg">Impossible de charger les séances pour le moment.</p>';
  }
}

function renderPublicArchiveSession(s){
  hide($('#publicArchiveList').closest('.panel'));
  show($('#publicArchiveDetail'));
  $('#archiveSessionMeta').textContent='Séance du '+fmtDate(s.session_date)+' • correction autonome';
  $('#archiveSessionTitle').textContent=s.title;
  $('#publicArchiveQuestions').innerHTML=(s.questions||[])
    .map((q,i)=>questionCard(q,i+1,true))
    .join('');
}

$('#archiveBackBtn')?.addEventListener('click',()=>{
  show($('#publicArchiveList').closest('.panel'));
  hide($('#publicArchiveDetail'));
  window.scrollTo({top:0,behavior:'smooth'});
});

init();