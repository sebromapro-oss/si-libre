const SUPABASE_URL='https://uytfaovghnnagpzoslzx.supabase.co';
const SUPABASE_KEY='sb_publishable_Pi8cQCzTW30Thxlv3443NA_fXn1j9WO';
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

const $=(s)=>document.querySelector(s);
const $$=(s)=>[...document.querySelectorAll(s)];
const labels={TSMA:'BTS TSMA',MMCM:'BTS MMCM',BAC_PRO:'Bac Pro Maintenance',CAP:'CAP Maintenance'};

let token=sessionStorage.getItem('si_reactivation_teacher_token')||'';
let currentSession=null;
let selectedIds=new Set();
let importedRows=[];
let timerId=null;
let accessMode='register';

function show(el){if(el)el.classList.remove('hidden')}
function hide(el){if(el)el.classList.add('hidden')}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function dateFr(v){return v?new Date(v).toLocaleDateString('fr-FR'):'—'}
function setText(sel,text){const el=$(sel);if(el)el.textContent=text}

async function rpc(name,args={}){
  const {data,error}=await db.rpc(name,args);
  if(error)throw new Error(error.message||name);
  return data;
}

function setAccessMode(mode){
  accessMode=mode;
  const registering=mode==='register';
  $('#showCreateBtn')?.classList.toggle('active',registering);
  $('#showLoginBtn')?.classList.toggle('active',!registering);
  registering?show($('#confirmWrap')):hide($('#confirmWrap'));
  if($('#loginPasswordConfirm'))$('#loginPasswordConfirm').required=registering;
  setText('#loginSubmitBtn',registering?'Créer mon accès professeur':'Se connecter');
  setText('#loginHelp',registering
    ?'Premier accès : choisis ton identifiant et ton mot de passe.'
    :'Utilise l’identifiant et le mot de passe déjà créés.');
  setText('#loginMsg','');
}

async function loginOrRegister(event){
  event.preventDefault();
  const login=$('#loginId').value.trim();
  const password=$('#loginPassword').value;
  const confirmation=$('#loginPasswordConfirm').value;

  if(accessMode==='register'&&password!==confirmation){
    setText('#loginMsg','Les deux mots de passe sont différents.');
    return;
  }
  setText('#loginMsg',accessMode==='register'?'Création du compte…':'Connexion…');

  try{
    const fn=accessMode==='register'?'reactivation_teacher_register':'reactivation_teacher_login';
    const result=await rpc(fn,{p_login:login,p_password:password});
    if(!result?.ok||!result?.token){
      const code=result?.error||'';
      const msg=code==='already_configured'
        ?'Un compte professeur existe déjà : utilise « J’ai déjà un accès ».'
        :code==='invalid_login'
          ?'Identifiant invalide : 4 à 32 caractères, lettres, chiffres, tiret ou underscore.'
          :code==='weak_password'
            ?'Mot de passe trop court : 10 caractères minimum.'
            :'Identifiant ou mot de passe incorrect.';
      setText('#loginMsg',msg);
      return;
    }
    token=result.token;
    sessionStorage.setItem('si_reactivation_teacher_token',token);
    $('#loginPassword').value='';
    $('#loginPasswordConfirm').value='';
    await openTeacher();
  }catch(err){
    setText('#loginMsg','Erreur de connexion : '+err.message);
  }
}

async function openTeacher(){
  try{
    const data=await rpc('reactivation_teacher_dashboard',{p_token:token});
    hide($('#authView'));
    hide($('#archiveView'));
    show($('#teacherView'));
    show($('#logoutBtn'));
    renderStats(data);
    await Promise.all([loadBank(),loadLibrary(),loadLatestSession()]);
    return true;
  }catch{
    token='';
    sessionStorage.removeItem('si_reactivation_teacher_token');
    show($('#authView'));
    hide($('#teacherView'));
    hide($('#logoutBtn'));
    return false;
  }
}

function renderStats(data){
  const counts=data?.counts||{};
  $('#teacherStats').innerHTML=[
    ['BTS TSMA',counts.TSMA||0],
    ['BTS MMCM',counts.MMCM||0],
    ['Bac Pro',counts.BAC_PRO||0],
    ['CAP',counts.CAP||0],
    ['Séances',data?.sessions||0]
  ].map(([label,value])=>`<div class="stat"><span>${esc(label)}</span><strong>${value}</strong></div>`).join('');
}

async function loadBank(){
  const track=$('#bankTrack').value;
  selectedIds.clear();
  updateSelectionCount();
  setText('#bankMsg','');
  $('#questionBank').innerHTML='<p class="micro">Chargement…</p>';

  try{
    const rows=await rpc('reactivation_teacher_list_questions',{
      p_token:token,p_track:track,p_active_only:false,p_limit:500
    });
    renderBank(Array.isArray(rows)?rows:[]);
  }catch(err){
    $('#questionBank').innerHTML='<p class="msg">Impossible de charger la banque : '+esc(err.message)+'</p>';
  }
}

function renderBank(rows){
  if(!rows.length){
    $('#questionBank').innerHTML='<p class="micro">Aucune réactivation pour ce parcours.</p>';
    return;
  }

  $('#questionBank').innerHTML=rows.map(q=>`
    <article class="bank-row" data-id="${esc(q.id)}" data-track="${esc(q.track)}">
      <div class="bank-main">
        <div class="bank-meta">
          <span class="tag soft">${esc(q.sequence||'Sans séquence')}</span>
          <span class="tag soft">${esc(q.notion||'Sans notion')}</span>
          <span class="tag soft">${esc(q.difficulty||'')}</span>
        </div>
        <strong>${esc(q.question)}</strong>
        <small>Réponse : ${esc(q.answer)}</small>
      </div>
      <div class="bank-actions">
        <button class="btn ${q.active?'success':'ghost'} toggle-question" data-active="${q.active}" type="button">
          ${q.active?'Active':'Inactive'}
        </button>
        <label class="select-question">
          <input class="question-check" type="checkbox" ${q.active?'':'disabled'}>
          Sélectionner
        </label>
      </div>
    </article>
  `).join('');

  $$('.toggle-question').forEach(btn=>btn.addEventListener('click',async()=>{
    const row=btn.closest('.bank-row');
    const next=btn.dataset.active!=='true';
    btn.disabled=true;
    try{
      await rpc('reactivation_teacher_set_question_active',{
        p_token:token,
        p_track:row.dataset.track,
        p_question_id:row.dataset.id,
        p_active:next
      });
      setText('#bankMsg',next?'Réactivation activée.':'Réactivation désactivée.');
      await loadBank();
    }catch(err){
      btn.disabled=false;
      setText('#bankMsg','Modification impossible : '+err.message);
    }
  }));

  $$('.question-check').forEach(check=>check.addEventListener('change',()=>{
    const id=check.closest('.bank-row').dataset.id;
    if(check.checked){
      if(selectedIds.size>=4){
        check.checked=false;
        setText('#bankMsg','Maximum : 4 questions.');
        return;
      }
      selectedIds.add(id);
    }else{
      selectedIds.delete(id);
    }
    updateSelectionCount();
  }));
}

function updateSelectionCount(){
  setText('#selectionCount',selectedIds.size+' / 4 sélectionnée(s)');
  if($('#createFromSelection'))$('#createFromSelection').disabled=selectedIds.size!==4;
}

async function createRandomSession(){
  setText('#sessionMsg','Création de la séance…');
  try{
    currentSession=await rpc('reactivation_teacher_create_session',{
      p_token:token,
      p_track:$('#sessionTrack').value,
      p_title:$('#sessionTitle').value.trim()||'Réactivation du jour'
    });
    setText('#sessionMsg','Séance créée.');
    renderSession();
    await loadLibrary();
  }catch(err){
    setText('#sessionMsg','Création impossible : '+err.message);
  }
}

async function createSelectedSession(){
  if(selectedIds.size!==4)return;
  setText('#bankMsg','Création de la séance…');
  try{
    currentSession=await rpc('reactivation_teacher_create_session_from_questions',{
      p_token:token,
      p_track:$('#bankTrack').value,
      p_title:$('#sessionTitle').value.trim()||'Réactivation du jour',
      p_question_ids:[...selectedIds]
    });
    selectedIds.clear();
    updateSelectionCount();
    setText('#bankMsg','Séance créée avec les 4 questions sélectionnées.');
    renderSession();
    await loadLibrary();
    window.scrollTo({top:$('#sessionPanel').offsetTop-80,behavior:'smooth'});
  }catch(err){
    setText('#bankMsg','Création impossible : '+err.message);
  }
}

async function loadLatestSession(){
  try{
    const data=await rpc('reactivation_teacher_latest_session',{p_token:token});
    if(data){currentSession=data;renderSession()}
  }catch{}
}

function phaseLabel(status){
  if(status==='reflection')return 'RÉFLEXION — 5 MIN';
  if(status==='correction')return 'CORRECTION — 10 MIN';
  if(status==='closed')return 'SÉANCE CLÔTURÉE';
  return 'SÉANCE PRÉPARÉE';
}

function renderSession(){
  if(!currentSession)return;
  show($('#sessionPanel'));
  setText('#sessionPhase',phaseLabel(currentSession.status));
  setText('#sessionName',currentSession.title||'Réactivation');
  setText('#sessionMeta',(labels[currentSession.track]||currentSession.track)+' · '+dateFr(currentSession.session_date||currentSession.created_at));

  const reveal=['correction','closed'].includes(currentSession.status);
  $('#sessionQuestions').innerHTML=(currentSession.questions||[]).map((q,i)=>`
    <article class="question-card-mini">
      <div class="question-meta"><span class="tag">Q${i+1}</span><span class="tag soft">${esc(q.sequence||'')}</span><span class="tag soft">${esc(q.notion||'')}</span></div>
      <h3>${esc(q.question)}</h3>
      ${reveal?`<div class="answer"><b>Réponse attendue</b><p>${esc(q.answer)}</p></div>`:''}
    </article>
  `).join('');
  runTimer();
}

function runTimer(){
  clearInterval(timerId);
  if(!currentSession)return;
  const mins=currentSession.status==='reflection'?(currentSession.reflection_minutes||5)
    :currentSession.status==='correction'?(currentSession.correction_minutes||10):0;
  if(!mins){setText('#sessionTimer','');return}

  const end=new Date(currentSession.updated_at||Date.now()).getTime()+mins*60000;
  const tick=()=>{
    const left=Math.max(0,end-Date.now());
    const m=String(Math.floor(left/60000)).padStart(2,'0');
    const s=String(Math.floor((left%60000)/1000)).padStart(2,'0');
    setText('#sessionTimer',m+':'+s);
  };
  tick();
  timerId=setInterval(tick,1000);
}

async function setPhase(status){
  if(!currentSession)return;
  setText('#sessionMsg','Mise à jour…');
  try{
    currentSession=await rpc('reactivation_teacher_set_phase',{
      p_token:token,p_session_id:currentSession.session_id,p_status:status
    });
    setText('#sessionMsg',status==='closed'
      ?'Séance clôturée : elle est maintenant visible depuis les sites élèves.'
      :'');
    renderSession();
    await loadLibrary();
  }catch(err){
    setText('#sessionMsg','Impossible de changer de phase : '+err.message);
  }
}

async function loadLibrary(){
  $('#sessionLibrary').innerHTML='<p class="micro">Chargement…</p>';
  try{
    const rows=await rpc('reactivation_teacher_list_sessions',{
      p_token:token,p_track:$('#libraryTrack').value||null,p_limit:150
    });
    const list=Array.isArray(rows)?rows:[];
    $('#sessionLibrary').innerHTML=list.length?list.map(s=>`
      <button class="history-item library-item" data-id="${esc(s.id)}" type="button">
        <span><strong>${esc(s.title)}</strong><small>${dateFr(s.session_date)} · ${esc(labels[s.track]||s.track)} · ${esc(s.status)}</small></span>
        <span class="tag soft">${s.question_count||0} questions</span>
      </button>
    `).join(''):'<p class="micro">Aucune séance enregistrée.</p>';

    $$('.library-item').forEach(btn=>btn.addEventListener('click',()=>openStoredSession(btn.dataset.id)));
  }catch(err){
    $('#sessionLibrary').innerHTML='<p class="msg">Erreur : '+esc(err.message)+'</p>';
  }
}

async function openStoredSession(id){
  setText('#sessionMsg','Ouverture…');
  try{
    currentSession=await rpc('reactivation_teacher_get_session',{p_token:token,p_session_id:id});
    renderSession();
    setText('#sessionMsg','');
    window.scrollTo({top:$('#sessionPanel').offsetTop-80,behavior:'smooth'});
  }catch(err){
    setText('#sessionMsg','Impossible d’ouvrir la séance : '+err.message);
  }
}

function norm(s){return String(s??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[_-]+/g,' ').replace(/\s+/g,' ')}
function getVal(row,names){
  const map={};Object.keys(row||{}).forEach(k=>map[norm(k)]=row[k]);
  for(const n of names){const v=map[norm(n)];if(v!==undefined&&v!==null&&String(v).trim()!=='')return String(v).trim()}
  return '';
}
function normalizeRow(row){
  return {
    id:getVal(row,['ID']),
    track:getVal(row,['Parcours','Niveau','Track']),
    sequence:getVal(row,['Séquence','Sequence']),
    theme:getVal(row,['Thème','Theme']),
    notion:getVal(row,['Notion']),
    type:getVal(row,['Type']),
    question:getVal(row,['Question / rappel','Question']),
    answer:getVal(row,['Réponse attendue','Reponse attendue','Réponse','Reponse','Answer']),
    difficulty:getVal(row,['Difficulté','Difficulte','Difficulty']),
    origin:getVal(row,['Origine','Origin']),
    status:getVal(row,['Statut','Status']),
    source:getVal(row,['Source'])
  };
}

function parseDelimited(text){
  const lines=String(text||'').replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean);
  if(!lines.length)return [];
  const sep=lines[0].includes(';')?';':lines[0].includes('\t')?'\t':',';
  const headers=lines[0].split(sep).map(v=>v.replace(/^"|"$/g,'').trim());
  return lines.slice(1).map(line=>{
    const vals=line.split(sep).map(v=>v.replace(/^"|"$/g,'').trim());
    return Object.fromEntries(headers.map((h,i)=>[h,vals[i]??'']));
  });
}

async function parseFile(file){
  const name=file.name.toLowerCase();
  if(name.endsWith('.json')){
    const data=JSON.parse(await file.text());
    return Array.isArray(data)?data:(Array.isArray(data.rows)?data.rows:[data]);
  }
  if(name.endsWith('.xlsx')||name.endsWith('.xls')){
    if(!window.XLSX)throw new Error('Bibliothèque Excel indisponible.');
    const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});
    const sheet=wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet,{defval:''});
  }
  return parseDelimited(await file.text());
}

async function previewImport(file){
  importedRows=[];
  hide($('#importPreview'));
  setText('#importMsg','');
  if(!file)return;
  try{
    importedRows=(await parseFile(file)).map(normalizeRow);
    const valid=importedRows.filter(r=>r.track&&r.question&&r.answer);
    setText('#importSummary',importedRows.length+' ligne(s) lue(s) · '+valid.length+' valide(s).');
    $('#importPreviewBody').innerHTML=importedRows.slice(0,12).map(r=>`
      <tr><td>${esc(r.track)}</td><td>${esc(r.sequence)}</td><td>${esc(r.notion)}</td><td>${esc(r.question)}</td><td>${esc(r.answer)}</td></tr>
    `).join('');
    show($('#importPreview'));
  }catch(err){
    setText('#importMsg','Fichier non lisible : '+err.message);
  }
}

async function importBank(){
  if(!importedRows.length)return;
  setText('#importMsg','Import en cours…');
  try{
    const result=await rpc('reactivation_teacher_import_questions',{p_token:token,p_rows:importedRows});
    setText('#importMsg','Import terminé : '+(result.imported||0)+' intégrée(s), '+(result.skipped||0)+' ignorée(s).');
    await loadBank();
  }catch(err){
    setText('#importMsg','Import impossible : '+err.message);
  }
}

async function loadArchive(track){
  hide($('#authView'));hide($('#teacherView'));hide($('#logoutBtn'));show($('#archiveView'));
  setText('#archiveTrack',labels[track]||track);
  $('#archiveList').innerHTML='<p class="micro">Chargement…</p>';
  try{
    const res=await fetch(SUPABASE_URL+'/functions/v1/reactivation-public-archive?track='+encodeURIComponent(track));
    if(!res.ok)throw new Error('archive');
    const data=await res.json();
    const sessions=data.sessions||[];
    $('#archiveList').innerHTML=sessions.length?sessions.map(s=>`
      <button class="history-item archive-item" data-id="${esc(s.id)}" type="button">
        <span><strong>${esc(s.title)}</strong><small>${dateFr(s.session_date)}</small></span>
        <span class="tag soft">${s.questions.length} questions</span>
      </button>
    `).join(''):'<p class="micro">Aucune séance clôturée pour le moment.</p>';
    $$('.archive-item').forEach(btn=>btn.addEventListener('click',()=>{
      const s=sessions.find(x=>x.id===btn.dataset.id);
      if(s)renderArchiveSession(s);
    }));
  }catch{
    $('#archiveList').innerHTML='<p class="msg">Impossible de charger les séances.</p>';
  }
}

function renderArchiveSession(s){
  setText('#archiveTitle',s.title);
  $('#archiveQuestions').innerHTML=(s.questions||[]).map((q,i)=>`
    <article class="question-card-mini">
      <div class="question-meta"><span class="tag">Q${i+1}</span><span class="tag soft">${esc(q.sequence||'')}</span></div>
      <h3>${esc(q.question)}</h3>
      <div class="answer"><b>Réponse attendue</b><p>${esc(q.answer)}</p></div>
    </article>
  `).join('');
  show($('#archiveDetail'));
}

function bind(){
  $('#showCreateBtn').addEventListener('click',()=>setAccessMode('register'));
  $('#showLoginBtn').addEventListener('click',()=>setAccessMode('login'));
  $('#authForm').addEventListener('submit',loginOrRegister);
  $('#logoutBtn').addEventListener('click',()=>{
    token='';sessionStorage.removeItem('si_reactivation_teacher_token');location.reload();
  });

  $('#bankTrack').addEventListener('change',loadBank);
  $('#createFromSelection').addEventListener('click',createSelectedSession);
  $('#createRandom').addEventListener('click',createRandomSession);
  $('#startReflection').addEventListener('click',()=>setPhase('reflection'));
  $('#startCorrection').addEventListener('click',()=>setPhase('correction'));
  $('#closeSession').addEventListener('click',()=>setPhase('closed'));
  $('#libraryTrack').addEventListener('change',loadLibrary);
  $('#bankFile').addEventListener('change',e=>previewImport(e.target.files?.[0]));
  $('#importBank').addEventListener('click',importBank);
}

async function init(){
  bind();
  const params=new URLSearchParams(location.search);
  const track=(params.get('track')||'').toUpperCase();
  if(params.get('mode')==='archive'&&['TSMA','MMCM','BAC_PRO','CAP'].includes(track)){
    await loadArchive(track);
    return;
  }

  hide($('#archiveView'));hide($('#teacherView'));hide($('#logoutBtn'));show($('#authView'));
  setAccessMode('register');

  if(token){
    const ok=await openTeacher();
    if(!ok)setAccessMode('login');
  }
}

init();