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
let setupMode=true;
let importRows=[];

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

function setAccessMode(createMode){
  setupMode=createMode;
  const createBtn=$('#showCreateBtn');
  const loginBtn=$('#showLoginBtn');
  const confirmWrap=$('#confirmWrap');
  const submit=$('#loginSubmitBtn');
  const help=$('#loginHelp');
  const ident=$('#email');
  const password=$('#password');
  const confirm=$('#passwordConfirm');

  if(createBtn)createBtn.classList.toggle('active',createMode);
  if(loginBtn)loginBtn.classList.toggle('active',!createMode);

  if(createMode){
    show(confirmWrap);
    if(confirm)confirm.required=true;
    if(ident)ident.placeholder='Choisis ton identifiant';
    if(password)password.autocomplete='new-password';
    if(submit)submit.textContent='Créer mon accès professeur';
    if(help)help.textContent='Premier accès : crée toi-même ton identifiant et ton mot de passe. Les élèves n’ont aucun compte à créer ici.';
  }else{
    hide(confirmWrap);
    if(confirm){confirm.required=false;confirm.value='';}
    if(ident)ident.placeholder='Ton identifiant';
    if(password)password.autocomplete='current-password';
    if(submit)submit.textContent='Se connecter';
    if(help)help.textContent='Connexion professeur existante.';
  }

  $('#loginMsg').textContent='';
}

$('#showCreateBtn')?.addEventListener('click',()=>setAccessMode(true));
$('#showLoginBtn')?.addEventListener('click',()=>setAccessMode(false));

async function init(){
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

  setAccessMode(true);
  resetToLogin();
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
  setAccessMode(false);
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

  await Promise.all([loadLatestTeacherSession(),loadSessionLibrary()]);
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
async function loadSessionLibrary(){
  const box=$('#sessionLibrary');
  if(!box)return;
  box.innerHTML='<p class="micro">Chargement…</p>';
  const track=$('#libraryTrack')?.value||'';
  const {data,error}=await db.rpc('reactivation_teacher_list_sessions',{p_token:teacherToken,p_track:track||null,p_limit:150});
  if(error){box.innerHTML='<p class="msg">Impossible de charger les réactivations.</p>';return;}
  const rows=Array.isArray(data)?data:[];
  if(!rows.length){box.innerHTML='<p class="micro">Aucune réactivation créée pour ce filtre.</p>';return;}
  box.innerHTML=rows.map(s=>'<button class="history-item teacher-session-item" data-id="'+esc(s.id)+'" type="button"><span><strong>'+esc(s.title)+'</strong><small>'+fmtDate(s.session_date)+' · '+esc(labels[s.track]||s.track)+' · '+esc(s.status)+'</small></span><span class="tag soft">'+(s.question_count||0)+' questions</span></button>').join('');
  $$('.teacher-session-item').forEach(btn=>btn.addEventListener('click',()=>openTeacherSession(btn.dataset.id)));
}

async function openTeacherSession(id){
  $('#teacherMsg').textContent='Ouverture de la séance…';
  const {data,error}=await db.rpc('reactivation_teacher_get_session',{p_token:teacherToken,p_session_id:id});
  if(error||!data){$('#teacherMsg').textContent='Impossible d’ouvrir cette séance.';return;}
  teacherSession=data;
  $('#teacherMsg').textContent='';
  renderTeacherSession();
  window.scrollTo({top:$('#teacherSessionPanel').offsetTop-90,behavior:'smooth'});
}

$('#libraryTrack')?.addEventListener('change',loadSessionLibrary);

function normalizeHeader(s){return String(s??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[_-]+/g,' ').replace(/\s+/g,' ');}
function rowValue(obj,aliases){const map={};Object.keys(obj||{}).forEach(k=>map[normalizeHeader(k)]=obj[k]);for(const a of aliases){const v=map[normalizeHeader(a)];if(v!==undefined&&v!==null&&String(v).trim()!=='')return String(v).trim();}return '';}
function normalizeImportedRow(raw){return {
  id:rowValue(raw,['ID','id']),
  track:rowValue(raw,['Parcours','Niveau','track']),
  sequence:rowValue(raw,['Séquence','Sequence','sequence']),
  theme:rowValue(raw,['Thème','Theme','theme']),
  notion:rowValue(raw,['Notion','notion']),
  type:rowValue(raw,['Type','type']),
  question:rowValue(raw,['Question / rappel','Question','question']),
  answer:rowValue(raw,['Réponse attendue','Reponse attendue','Réponse','Reponse','answer']),
  difficulty:rowValue(raw,['Difficulté','Difficulte','difficulty']),
  origin:rowValue(raw,['Origine','origin']),
  status:rowValue(raw,['Statut','status']),
  source:rowValue(raw,['Source','source'])
};}

function parseDelimited(text){
  const lines=String(text||'').replace(/^\uFEFF/,'').split(/\r?\n/).filter(l=>l.trim());
  if(!lines.length)return [];
  const first=lines[0];
  const delimiter=first.includes(';')?';':first.includes('\t')?'\t':',';
  const headers=first.split(delimiter).map(x=>x.replace(/^"|"$/g,'').trim());
  return lines.slice(1).map(line=>{const vals=line.split(delimiter).map(x=>x.replace(/^"|"$/g,'').trim());const obj={};headers.forEach((h,i)=>obj[h]=vals[i]??'');return obj;});
}

async function parseBankFile(file){
  const name=file.name.toLowerCase();
  if(name.endsWith('.json')){const parsed=JSON.parse(await file.text());return Array.isArray(parsed)?parsed:(Array.isArray(parsed.rows)?parsed.rows:[parsed]);}
  if(name.endsWith('.xlsx')||name.endsWith('.xls')){if(!window.XLSX)throw new Error('xlsx');const buf=await file.arrayBuffer();const wb=XLSX.read(buf,{type:'array'});const ws=wb.Sheets[wb.SheetNames[0]];return XLSX.utils.sheet_to_json(ws,{defval:''});}
  return parseDelimited(await file.text());
}

$('#bankFile')?.addEventListener('change',async e=>{
  const file=e.target.files?.[0];
  importRows=[];hide($('#importPreview'));$('#importMsg').textContent='';
  if(!file)return;
  try{
    const raw=await parseBankFile(file);
    importRows=raw.map(normalizeImportedRow);
    const valid=importRows.filter(r=>r.track&&r.question&&r.answer);
    $('#importSummary').textContent=importRows.length+' ligne(s) détectée(s) · '+valid.length+' avec Parcours + Question + Réponse.';
    $('#importPreviewBody').innerHTML=importRows.slice(0,12).map(r=>'<tr><td>'+esc(r.track)+'</td><td>'+esc(r.sequence)+'</td><td>'+esc(r.notion)+'</td><td>'+esc(r.question)+'</td><td>'+esc(r.answer)+'</td></tr>').join('');
    show($('#importPreview'));
  }catch{$('#importMsg').textContent='Fichier non lisible. Utilise .xlsx, .csv, .txt ou .json.';}
});

$('#importBankBtn')?.addEventListener('click',async()=>{
  if(!importRows.length)return;
  $('#importMsg').textContent='Import en cours…';
  const {data,error}=await db.rpc('reactivation_teacher_import_questions',{p_token:teacherToken,p_rows:importRows});
  if(error||!data?.ok){$('#importMsg').textContent='Import impossible.';return;}
  $('#importMsg').textContent='Import terminé : '+(data.imported||0)+' intégrée(s), '+(data.skipped||0)+' ignorée(s).';
  await enterTeacher();
});