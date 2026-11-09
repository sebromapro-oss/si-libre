'use strict';
/* SI-LIAISONS — ressource statique autonome. Modèles didactiques, pas plans de définition. */
const KEYS = ['Tx','Ty','Tz','Rx','Ry','Rz'];
const COPY = {
  Tx:'translation suivant X',Ty:'translation suivant Y',Tz:'translation suivant Z',
  Rx:'rotation autour de X',Ry:'rotation autour de Y',Rz:'rotation autour de Z'
};
const JOINTS = [
 {id:'encastrement',name:'Encastrement',ddl:0,level:'CAP',m:[0,0,0,0,0,0],axis:'Tous les mouvements bloqués',short:'Deux solides restent solidaires.',work:'Support moteur boulonné au bâti',story:'Sur un tracteur, un support moteur est serré par des vis sur le bâti. Dans le modèle cinématique parfait, les deux solides ne bougent pas l’un par rapport à l’autre.',objective:'Distinguer une liaison fixe d’une liaison mobile.',model:'Aucune translation et aucune rotation relative. Le nombre de degrés de liberté est nul.',choice:'Aucun mouvement relatif',kind:'fixed'},
 {id:'pivot',name:'Pivot',ddl:1,level:'CAP',m:[0,0,0,1,0,0],axis:'Axe (O, X)',short:'Une seule rotation autour de l’axe X.',work:'Articulation d’un bras de pelle',story:'Le bras de pelle tourne autour d’un axe monté dans des bagues. Les butées empêchent son déplacement axial dans le modèle retenu.',objective:'Repérer l’axe de rotation et reconnaître Rx comme seule mobilité.',model:'La liaison pivot autorise Rx. Elle bloque Tx, Ty, Tz, Ry et Rz.',choice:'Rx',kind:'shaft'},
 {id:'glissiere',name:'Glissière',ddl:1,level:'CAP',m:[1,0,0,0,0,0],axis:'Direction X',short:'Une translation suivant X, aucune rotation.',work:'Guidage linéaire d’un chariot',story:'Le chariot d’un équipement d’atelier avance et recule sur un rail, sans pouvoir tourner autour du rail.',objective:'Différencier une translation unique d’une rotation.',model:'La glissière autorise Tx et bloque les cinq autres composantes.',choice:'Tx',kind:'rail'},
 {id:'helicoidale',name:'Hélicoïdale',ddl:1,level:'CAP',m:[1,0,0,1,0,0],axis:'Axe (O, X), pas p',short:'Une translation et une rotation liées.',work:'Vis–écrou d’un cric mécanique',story:'En tournant une vis, l’écrou avance. La translation et la rotation sont liées par le pas de la vis : ce ne sont pas deux réglages indépendants.',objective:'Expliquer pourquoi deux mouvements observés ne donnent qu’un seul degré de liberté.',model:'Tx et Rx sont possibles mais couplés : un seul paramètre suffit à déterminer le mouvement relatif.',choice:'Tx et Rx couplées',kind:'screw',formula:'Relation : déplacement x = p × θ / (2π), où p est le pas en mm/tr et θ l’angle en rad ; x en mm.'},
 {id:'pivot-glissant',name:'Pivot glissant',ddl:2,level:'CAP',m:[1,0,0,1,0,0],axis:'Axe (O, X)',short:'Une translation et une rotation indépendantes.',work:'Arbre guidé dans une bague sans butées',story:'Un arbre cylindrique peut à la fois coulisser suivant son axe et tourner dans la bague lorsque aucune butée axiale ne l’empêche.',objective:'Distinguer deux mobilités indépendantes d’une hélicoïdale.',model:'Tx et Rx sont indépendantes. La liaison comporte deux degrés de liberté.',choice:'Tx et Rx indépendantes',kind:'shaft'},
 {id:'rotule',name:'Rotule',ddl:3,level:'CAP',m:[0,0,0,1,1,1],axis:'Centre O',short:'Trois rotations autour du centre O.',work:'Rotule de direction d’un tracteur',story:'La rotule permet à la tige de direction de s’orienter autour du même centre. Le modèle idéal ne comporte aucune translation relative.',objective:'Reconnaître trois rotations et aucune translation.',model:'Rx, Ry et Rz sont possibles, alors que Tx, Ty et Tz sont bloquées.',choice:'Rx, Ry et Rz',kind:'ball'},
 {id:'appui-plan',name:'Appui plan',ddl:3,level:'CAP',m:[1,1,0,0,0,1],axis:'Normale Z',short:'Deux translations dans le plan et une rotation normale au plan.',work:'Pièce posée sur une table de machine',story:'Une pièce sur une table plane peut glisser suivant X et Y et pivoter autour de Z si l’on considère l’appui parfait maintenu sans décollement.',objective:'Identifier la normale au plan et les trois mobilités du modèle.',model:'Tx, Ty, Rz sont possibles. Tz, Rx et Ry sont bloquées dans ce modèle de contact maintenu.',choice:'Tx, Ty et Rz',kind:'plane'},
 {id:'ponctuelle',name:'Ponctuelle',ddl:5,level:'CAP',m:[1,1,0,1,1,1],axis:'Normale Z',short:'Cinq mobilités, une seule translation normale bloquée.',work:'Bille au contact d’une plaque',story:'Une bille touche un plan en un point. Le modèle de contact ponctuel maintenu interdit le mouvement relatif normal de pénétration tout en autorisant les autres mobilités.',objective:'Justifier la différence entre six composantes possibles et cinq mobilités.',model:'Tx, Ty, Rx, Ry, Rz sont autorisées dans le modèle idéal de contact maintenu ; Tz est bloquée.',choice:'Tx, Ty, Rx, Ry et Rz',kind:'point'},
 {id:'rotule-doigt',name:'Rotule à doigt',ddl:2,level:'BTS',m:[0,0,0,0,1,1],axis:'Repère local orienté : Rx bloquée',short:'Deux rotations indépendantes.',work:'Articulation à rotule avec dispositif antirotation',story:'Un doigt ou dispositif antirotation retire une mobilité à une rotule. Dans le repère adopté pour cette activité, la rotation Rx est empêchée.',objective:'Choisir correctement les axes locaux avant d’interpréter les composantes.',model:'Dans ce repère pédagogique, Ry et Rz sont possibles ; Rx et les translations sont bloquées. La direction réelle du doigt doit être analysée sur l’assemblage.',choice:'Ry et Rz',kind:'ball-stop'},
 {id:'lineaire-annulaire',name:'Linéaire annulaire',ddl:4,level:'BTS',m:[1,0,0,1,1,1],axis:'Axe local X',short:'Une translation axiale et trois rotations.',work:'Contact sphérique dans un alésage cylindrique',story:'Une surface sphérique est guidée dans un alésage cylindrique. Dans ce modèle de liaison idéale, le déplacement axial demeure possible.',objective:'Associer la géométrie du contact aux quatre degrés de liberté.',model:'Tx, Rx, Ry, Rz sont possibles ; Ty et Tz sont bloquées dans le repère où l’axe de l’alésage est X.',choice:'Tx, Rx, Ry et Rz',kind:'annular'},
 {id:'lineaire-rectiligne',name:'Linéaire rectiligne',ddl:4,level:'BTS',m:[1,1,0,1,0,1],axis:'Ligne X, normale Z',short:'Quatre mobilités pour un contact linéique rectiligne.',work:'Cylindre appuyé selon une génératrice',story:'Un cylindre repose sur une surface plane selon une génératrice orientée X. Le contact reste maintenu et la normale est Z.',objective:'Repérer la ligne de contact, la normale et les mobilités indépendantes.',model:'Dans le repère adopté : Tx, Ty, Rx et Rz sont possibles ; Tz et Ry sont bloquées.',choice:'Tx, Ty, Rx et Rz',kind:'line'}
];
const s = {level:'CAP',view:'home',current:null,motion:null,quiz:null};
let saved = {done:{},score:0};
try { const p=JSON.parse(localStorage.getItem('si-liaisons-v1')||'null'); if(p && typeof p==='object')saved={done:p.done||{},score:Number(p.score)||0}; const l=localStorage.getItem('si-liaisons-level'); if(['CAP','BAC','BTS'].includes(l))s.level=l; if(localStorage.getItem('si-liaisons-dys')==='1')document.body.classList.add('dys'); }catch(e){}
const $ = id=>document.getElementById(id);
const esc = text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function store(){try{localStorage.setItem('si-liaisons-v1',JSON.stringify(saved));}catch(e){}}
function offered(){return JOINTS.filter(j=>s.level==='BTS'||j.level==='CAP');}
function nav(view){
  s.view=view;
  document.querySelectorAll('.view').forEach(x=>x.hidden=(x.id!=='view-'+view));
  document.querySelectorAll('.nav-button').forEach(x=>{ const yes=x.dataset.view===view; x.classList.toggle('active',yes);if(yes)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current'); });
  if(view==='home')renderStats(); if(view==='catalog')renderCatalog(); if(view==='challenge'&&!s.quiz)startQuiz(); 
  window.scrollTo({top:0,behavior:'instant'});
}
function renderStats(){
  const set=offered();$('availableCount').textContent=String(set.length);
  $('completeCount').textContent=String(set.filter(j=>saved.done[j.id]).length);$('scoreTotal').textContent=String(saved.score);
}
function miniSvg(j){
 const body={
   fixed:'<rect x="99" y="65" width="90" height="62" rx="5" fill="#38a5ce"/><path d="M90 65L160 26L248 47L189 66Z" fill="#75c9e9"/><path d="M190 65L249 46V113L190 128Z" fill="#276386"/><path d="M112 91L229 80" stroke="#f5a56f" stroke-width="7"/><circle cx="133" cy="59" r="6" fill="#ddeef7"/><circle cx="164" cy="59" r="6" fill="#ddeef7"/>',
   shaft:'<rect x="112" y="62" width="133" height="74" rx="12" fill="#277fae" stroke="#90def5" stroke-width="3"/><path d="M72 100H286" stroke="#afcee0" stroke-width="42" stroke-linecap="round"/><path d="M72 89H285" stroke="#e3f4ff" stroke-width="8" stroke-linecap="round"/><path d="M111 58H245M111 137H245" stroke="#52c1ea" stroke-width="7"/>',
   screw:'<rect x="106" y="55" width="156" height="85" rx="8" fill="#1d668f" stroke="#72bee4" stroke-width="3"/><path d="M72 98H288" stroke="#d9e7ef" stroke-width="27" stroke-linecap="round"/><path d="M91 84l19 29m2-29l19 29m2-29l19 29m2-29l19 29m2-29l19 29m2-29l19 29m2-29l19 29" stroke="#e39a5d" stroke-width="3"/>',
   rail:'<rect x="67" y="119" width="248" height="17" rx="6" fill="#9ac5db"/><rect x="67" y="76" width="248" height="14" rx="6" fill="#9ac5db"/><rect x="147" y="50" width="92" height="108" rx="6" fill="#348fbd" stroke="#bce4f2" stroke-width="4"/><path d="M151 68H232M151 139H232" stroke="#6ed3f1" stroke-width="4"/>',
   ball:'<path d="M104 149Q90 65 173 54Q259 58 260 147Z" fill="#286c9b" stroke="#87c8e8" stroke-width="4"/><circle cx="181" cy="91" r="46" fill="#c0d8e7" stroke="#edf7fe" stroke-width="4"/><path d="M182 55L182 16" stroke="#dd9868" stroke-width="21" stroke-linecap="round"/>',
   'ball-stop':'<path d="M104 149Q90 65 173 54Q259 58 260 147Z" fill="#286c9b" stroke="#87c8e8" stroke-width="4"/><circle cx="181" cy="91" r="46" fill="#c0d8e7" stroke="#edf7fe" stroke-width="4"/><path d="M182 55L182 16" stroke="#dd9868" stroke-width="21" stroke-linecap="round"/><path d="M136 90H225" stroke="#f5a863" stroke-width="10"/>',
   plane:'<path d="M50 116L245 65L308 90L110 146Z" fill="#357ba9"/><path d="M50 116V134L110 164V146Z" fill="#195b8b"/><path d="M110 146L308 90V110L110 164Z" fill="#4e99be"/><path d="M99 87L204 55L245 71L141 102Z" fill="#e7b084" stroke="#ffe0b9" stroke-width="3"/>',
   point:'<path d="M51 135L251 92L310 113L110 155Z" fill="#3785b2"/><circle cx="179" cy="73" r="42" fill="#b9d7e9" stroke="#fff" stroke-width="3"/>',
   annular:'<ellipse cx="175" cy="96" rx="75" ry="50" fill="#2576a8" stroke="#91d1e9" stroke-width="4"/><ellipse cx="175" cy="96" rx="45" ry="36" fill="#0e3959" stroke="#8eb5cf" stroke-width="3"/><circle cx="177" cy="94" r="31" fill="#d7e4ed" stroke="#fff" stroke-width="3"/>',
   line:'<path d="M50 131L250 100L318 121L115 161Z" fill="#287ba4"/><path d="M79 72L272 53" stroke="#cddce8" stroke-width="60" stroke-linecap="round"/><path d="M79 61L272 42" stroke="#f1f8fe" stroke-width="8" stroke-linecap="round"/>'
 }[j.kind]||'';
 return '<svg viewBox="0 0 360 190" aria-hidden="true"><g opacity=".15" stroke="#b3e3ef"><path d="M5 50H355M5 100H355M5 150H355M60 5V185M120 5V185M180 5V185M240 5V185M300 5V185"/></g>'+body+'<path d="M30 168H94" stroke="#ffa36e" stroke-width="3"/><path d="M94 168l-9 -5m9 5l-9 5" stroke="#ffa36e" stroke-width="3"/><text x="102" y="173" font-size="16" fill="#fff" font-weight="800">X</text></svg>';
}
function renderCatalog(){
 const query=$('search').value.trim().toLowerCase();
 const list=offered().filter(j=> (j.name+' '+j.work).toLowerCase().includes(query));
 $('resultsCount').textContent=list.length+' liaison'+(list.length>1?'s':'');
 $('jointGrid').innerHTML=list.map((j,i)=>'<article class="joint-card"><div class="joint-visual"><span class="joint-num">LIAISON '+String(i+1).padStart(2,'0')+'</span>'+miniSvg(j)+'</div><div class="joint-card-content"><h2>'+esc(j.name)+'</h2><p>'+esc(j.short)+'<br><small>'+esc(j.work)+'</small></p><div class="joint-card-bottom"><span class="chip'+(saved.done[j.id]?' done':'')+'">'+(saved.done[j.id]?'✓ Validée':j.ddl+' DDL')+'</span><button type="button" data-joint="'+j.id+'">Explorer →</button></div></div></article>').join('');
 if(!list.length)$('jointGrid').innerHTML='<p>Aucun résultat. Essaie un autre mot.</p>';
}
function openJoint(id){
 const j=JOINTS.find(x=>x.id===id);if(!j || !offered().includes(j))return;
 s.current=j;s.motion=null;
 $('jointOrdinal').textContent='Liaison '+(offered().indexOf(j)+1)+' / '+offered().length;
 $('jointName').textContent=j.name;$('jointSubtitle').textContent=j.short;
 $('jointDdl').textContent=j.ddl+' DDL';
 $('jointCategory').textContent='FICHE DE DÉCOUVERTE • '+j.axis;
 $('situationTitle').textContent=j.work;$('situationText').textContent=j.story;$('objectiveText').textContent=j.objective;
 $('modelText').textContent=j.model;$('formulaText').textContent=j.formula||'';
 $('axisNotice').textContent=j.axis;
 $('mobilityMatrix').innerHTML=KEYS.map((k,i)=>'<div class="mobility-cell '+(j.m[i]?'allow':'lock')+'"><span>'+k+'</span><b>'+j.m[i]+'</b></div>').join('');
 $('ddlNote').textContent=j.id==='helicoidale'?'ATTENTION : Tx et Rx sont couplées, donc 1 seul degré de liberté.':(j.ddl+' mouvement'+(j.ddl>1?'s':'')+' indépendant'+(j.ddl>1?'s':'')+' dans le modèle.');
 $('motionButtons').innerHTML=KEYS.map((k,i)=>'<button type="button" class="'+(j.m[i]?'allowed':'blocked')+'" data-motion="'+k+'" aria-pressed="false" title="'+esc(COPY[k])+'">'+k+'</button>').join('');
 $('motionMessage').textContent='Test : choisis l’une des six mobilités en observant le repère OXYZ.';
 $('motionMessage').classList.remove('blocked');
 renderScene(j,null);nav('detail');
}
function scenePieces(j){
 const shapes={
 fixed:['<path d="M240 228L410 178L468 214L299 260Z" fill="#136998" stroke="#73cee9" stroke-width="4"/><rect x="290" y="125" width="115" height="96" rx="5" fill="#227bac" stroke="#8ccee5" stroke-width="3"/><circle cx="312" cy="148" r="7" fill="#a6d5ea"/><circle cx="385" cy="148" r="7" fill="#a6d5ea"/>','<path d="M245 120L360 92L427 124L312 156Z" fill="#eea062" stroke="#ffe0b6" stroke-width="4"/><path d="M245 120V145L312 183V156Z" fill="#b77b51"/><path d="M312 156L427 124V149L312 183Z" fill="#d38a55"/>'],
 shaft:['<path d="M214 128H432V239H214Z" fill="#246e99" stroke="#7dcaeb" stroke-width="4"/><rect x="241" y="106" width="154" height="142" rx="10" fill="#247ca7" stroke="#a1e4f4" stroke-width="4"/><path d="M253 119H383" stroke="#61c6ec" stroke-width="6"/>','<path d="M178 175H485" stroke="#bfd4e0" stroke-width="47" stroke-linecap="round"/><path d="M182 161H477" stroke="#edf9ff" stroke-width="7" stroke-linecap="round"/><ellipse cx="485" cy="175" rx="13" ry="24" fill="#d7e9f5" stroke="#f6fdff" stroke-width="3"/>'],
 screw:['<rect x="250" y="105" width="144" height="147" rx="15" fill="#206e9e" stroke="#93daf4" stroke-width="4"/>','<path d="M184 175H490" stroke="#cbdce9" stroke-width="38" stroke-linecap="round"/><g stroke="#e59d69" stroke-width="4"><path d="M208 157l23 36m0-36l23 36m0-36l23 36m0-36l23 36m0-36l23 36m0-36l23 36m0-36l23 36m0-36l23 36"/></g>'],
 rail:['<rect x="188" y="232" width="299" height="17" rx="7" fill="#2777a2" stroke="#93d4ef" stroke-width="3"/><rect x="188" y="137" width="299" height="16" rx="6" fill="#2777a2" stroke="#93d4ef" stroke-width="3"/>','<rect x="287" y="124" width="96" height="148" rx="8" fill="#de965d" stroke="#ffce9a" stroke-width="4"/><path d="M295 140H373M295 252H373" stroke="#f7caa6" stroke-width="5"/>'],
 ball:['<path d="M260 264Q227 131 327 128Q438 129 409 264Z" fill="#236e99" stroke="#9ad2e9" stroke-width="4"/><path d="M268 225Q327 267 400 222" stroke="#6bbad9" stroke-width="4"/>','<circle cx="332" cy="165" r="64" fill="#c7dce9" stroke="#f1fcff" stroke-width="4"/><path d="M332 113V56" stroke="#ed9d66" stroke-width="32" stroke-linecap="round"/><circle cx="320" cy="141" r="13" fill="#f3faff" opacity=".8"/>'],
 'ball-stop':['<path d="M260 264Q227 131 327 128Q438 129 409 264Z" fill="#236e99" stroke="#9ad2e9" stroke-width="4"/><path d="M268 225Q327 267 400 222" stroke="#6bbad9" stroke-width="4"/>','<circle cx="332" cy="165" r="64" fill="#c7dce9" stroke="#f1fcff" stroke-width="4"/><path d="M332 113V56" stroke="#ed9d66" stroke-width="32" stroke-linecap="round"/><path d="M279 167H387" stroke="#f3ad68" stroke-width="9"/>'],
 plane:['<path d="M155 227L422 156L506 195L234 276Z" fill="#2d84ab" stroke="#91c8e3" stroke-width="4"/><path d="M155 227V245L234 294V276L155 227M234 276L506 195V216L234 294Z" fill="#165379" stroke="#91c8e3" stroke-width="3"/>','<path d="M245 164L385 125L446 158L304 205Z" fill="#e49a64" stroke="#ffd6a7" stroke-width="4"/><path d="M245 164V187L304 225V205Z" fill="#bf7b4c"/><path d="M304 205L446 158V184L304 225Z" fill="#d98c56"/>'],
 point:['<path d="M164 244L434 174L511 206L238 285Z" fill="#2c86af" stroke="#91cde5" stroke-width="4"/>','<circle cx="338" cy="167" r="65" fill="#c1d6e4" stroke="#f9ffff" stroke-width="4"/><circle cx="310" cy="140" r="13" fill="#f0f9ff"/>'],
 annular:['<ellipse cx="334" cy="176" rx="120" ry="86" fill="#267ca6" stroke="#9ad3e8" stroke-width="5"/><ellipse cx="334" cy="176" rx="70" ry="57" fill="#143f61" stroke="#a2c1d8" stroke-width="3"/>','<circle cx="331" cy="174" r="51" fill="#d2e1eb" stroke="#f6ffff" stroke-width="4"/><circle cx="310" cy="156" r="11" fill="#f7ffff"/>'],
 line:['<path d="M154 243L430 177L507 216L226 286Z" fill="#237da6" stroke="#99d4e9" stroke-width="4"/>','<path d="M212 154L451 128" stroke="#c0d8e7" stroke-width="105" stroke-linecap="round"/><path d="M212 130L450 105" stroke="#edf8ff" stroke-width="11" stroke-linecap="round"/>']
 };
 return shapes[j.kind]||shapes.shaft;
}
function renderScene(j,motion){
 const p=scenePieces(j);
 let transform='',arrow='';
 const label=motion?motion:'OXYZ';
 if(motion && j.m[KEYS.indexOf(motion)]){
   if(motion==='Tx')transform='translate(26 0)';
   if(motion==='Ty')transform='translate(-16 12)';
   if(motion==='Tz')transform='translate(0 -27)';
   const isRot=motion.charAt(0)==='R';
   if(isRot)arrow='<path d="M445 71a45 32 0 1 0 18 46" fill="none" stroke="#ffd38e" stroke-width="5" stroke-dasharray="9 5"/><path d="M464 115l-18 2 8 -16" fill="#ffd38e"/><text x="465" y="58" fill="#ffd38e" font-size="20" font-weight="800">'+motion+'</text>';
   else arrow='<path d="M345 66L434 66" stroke="#ffd38e" stroke-width="6"/><path d="M434 66l-17 -10m17 10l-17 10" stroke="#ffd38e" stroke-width="5"/><text x="445" y="73" fill="#ffd38e" font-size="20" font-weight="800">'+motion+'</text>';
   if(j.id==='helicoidale')arrow+='<text x="322" y="307" fill="#f6d7a1" font-size="15" font-weight="800">Rotation ↔ Translation couplées</text>';
 }
 $('simSvg').innerHTML='<defs><pattern id="gridx" width="38" height="38" patternUnits="userSpaceOnUse"><path d="M38 0H0V38" fill="none" stroke="#2d4c64" stroke-width="1"/></pattern><linearGradient id="stageglow"><stop stop-color="#255675"/><stop offset="1" stop-color="#0b253a"/></linearGradient></defs><rect width="620" height="350" fill="url(#stageglow)"/><rect width="620" height="350" fill="url(#gridx)" opacity=".55"/><g opacity=".3" stroke="#75a5c4" stroke-width="2" stroke-dasharray="5 6"><path d="M145 175H546"/><path d="M336 43V280"/></g><g id="fixedSolid">'+p[0]+'</g><g id="movingSolid" transform="'+transform+'">'+p[1]+'</g>'+arrow+
 '<g stroke-width="4" stroke-linecap="round"><circle cx="82" cy="281" r="5" fill="#fff"/><path d="M82 281L179 281" stroke="#ffae7c"/><path d="M179 281l-14 -8m14 8l-14 8" stroke="#ffae7c"/><path d="M82 281L37 315" stroke="#7de1c1"/><path d="M37 315l15 -3m-15 3l7 -13" stroke="#7de1c1"/><path d="M82 281L82 181" stroke="#82b8ff"/><path d="M82 181l-8 15m8 -15l8 15" stroke="#82b8ff"/></g><g font-size="22" font-weight="850" fill="#fff"><text x="191" y="287">X</text><text x="21" y="335">Y</text><text x="75" y="167">Z</text><text x="60" y="275" font-size="15">O</text></g><rect x="428" y="15" width="177" height="32" rx="16" fill="#0b304b" stroke="#4b809f"/><text x="516" y="37" fill="#daeeff" text-anchor="middle" font-size="14" font-weight="800">'+esc(j.axis)+'</text>';
}
function motionTest(k){
 const j=s.current;if(!j)return;s.motion=k;const idx=KEYS.indexOf(k),isAllowed=Boolean(j.m[idx]); 
 document.querySelectorAll('[data-motion]').forEach(b=>{const active=b.dataset.motion===k;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active?'true':'false');});
 let msg;
 if(!isAllowed)msg=k+' bloqué : le modèle de liaison '+j.name.toLowerCase()+' interdit la '+COPY[k]+'.';
 else if(j.id==='helicoidale' && (k==='Tx'||k==='Rx')) msg=k+' possible, mais COUPLÉ à '+(k==='Tx'?'Rx':'Tx')+' : un seul degré de liberté indépendant.';
 else msg=k+' autorisé : '+COPY[k]+' possible dans le repère local OXYZ.';
 $('motionMessage').textContent=msg;$('motionMessage').classList.toggle('blocked',!isAllowed);
 renderScene(j,isAllowed?k:null);
}
function rand(a){const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function quizFor(j){
 const other=rand(JOINTS.filter(x=>x.id!==j.id)).slice(0,3);
 let motionOptions;
 if(j.ddl===0)motionOptions=['Aucun mouvement relatif','Tx uniquement','Rx uniquement','Trois rotations'];
 else if(j.id==='helicoidale')motionOptions=['Tx et Rx couplées','Tx et Rx indépendantes','Rx seule','Tx seule'];
 else if(j.id==='pivot-glissant')motionOptions=['Tx et Rx indépendantes','Tx et Rx couplées','Rx seule','Tx seule'];
 else if(j.id==='rotule')motionOptions=['Rx, Ry et Rz','Tx, Ty et Tz','Rx seule','Ty et Rz'];
 else if(j.id==='ponctuelle')motionOptions=['Tx, Ty, Rx, Ry et Rz','Tx, Ty et Tz','Rx, Ry et Rz','Aucun mouvement relatif'];
 else if(j.id==='appui-plan')motionOptions=['Tx, Ty et Rz','Tx, Ty et Tz','Rx, Ry et Rz','Rx seule'];
 else if(j.id==='rotule-doigt')motionOptions=['Ry et Rz','Rx, Ry et Rz','Tx et Rx','Rx seule'];
 else if(j.id==='lineaire-annulaire')motionOptions=['Tx, Rx, Ry et Rz','Tx, Ty, Tz et Rz','Tx et Rx','Rx, Ry et Rz'];
 else if(j.id==='lineaire-rectiligne')motionOptions=['Tx, Ty, Rx et Rz','Tx, Ty et Tz','Tx et Rx','Rx, Ry et Rz'];
 else motionOptions=[j.choice,'Rx seulement','Tx seulement','Tous les mouvements'];
 motionOptions=Array.from(new Set(motionOptions)); while(motionOptions.length<4)motionOptions.push('Ty uniquement');
 return [
  {title:'Combien de degrés de liberté INDEPENDANTS comporte la liaison '+j.name.toLowerCase()+' ?',hint:'Attention aux mouvements couplés.',options:rand([0,1,2,3,4,5].filter(x=> x===j.ddl || Math.abs(x-j.ddl)<=2)).map(String),answer:String(j.ddl),explain:j.model},
  {title:'Quel ensemble de mouvements est possible dans le repère local indiqué ?',hint:j.axis+'. Les symboles T sont des translations, R des rotations.',options:rand(motionOptions),answer:j.choice,explain:j.model},
  {title:'Quelle situation d’atelier correspond à une liaison '+j.name.toLowerCase()+' ?',hint:'Cherche la fonction mécanique et les mouvements possibles.',options:rand([j.work,...other.map(o=>o.work)]),answer:j.work,explain:j.story}
 ];
}
function startQuiz(fixedId){
 const pool=offered(),j=pool.find(x=>x.id===fixedId)||pool[Math.floor(Math.random()*pool.length)];
 s.quiz={j:j,qs:quizFor(j),index:0,correct:0,responded:false};
 nav('challenge');renderQuiz();
}
function renderQuiz(){
 const q=s.quiz;if(!q)return;const question=q.qs[q.index];
 $('quizStep').textContent='QUESTION '+(q.index+1)+' / '+q.qs.length;
 $('quizLabel').textContent='Mécanisme : '+q.j.name;
 $('quizBar').style.width=((q.index+1)/q.qs.length*100)+'%';
 $('quizContext').textContent='REPÈRE LOCAL OXYZ • '+q.j.axis;
 $('questionTitle').textContent=question.title;$('questionHelp').textContent=question.hint;
 $('quizOptions').innerHTML=question.options.map((a,i)=>'<label class="quiz-option"><input required type="radio" name="answer" value="'+esc(a)+'"><span>'+esc(a)+'</span></label>').join('');
 $('quizForm').hidden=false;$('quizSubmit').disabled=false;$('quizFeedback').hidden=true;$('quizFeedback').classList.remove('error');
 $('nextQuestion').hidden=true;$('nextQuestion').textContent=q.index===q.qs.length-1?'Voir mon bilan →':'Question suivante →';
 $('quizFinal').hidden=true;q.responded=false;
}
function submitQuiz(event){
 event.preventDefault();const q=s.quiz;if(!q||q.responded)return;
 const selected=$('quizForm').querySelector('input[name="answer"]:checked');
 if(!selected)return;
 const question=q.qs[q.index]; const yes=selected.value===question.answer;
 if(yes)q.correct++;q.responded=true;
 $('quizFeedback').hidden=false;$('quizFeedback').classList.toggle('error',!yes);
 $('quizFeedback').textContent=(yes?'Bonne réponse. ':'À reprendre. Réponse attendue : '+question.answer+'. ')+question.explain;
 $('quizForm').querySelectorAll('input').forEach(x=>{x.disabled=true;x.closest('label').classList.toggle('correct',x.value===question.answer);x.closest('label').classList.toggle('incorrect',x.checked&&!yes);});
 $('quizSubmit').disabled=true;$('nextQuestion').hidden=false;
}
function nextQuiz(){
 const q=s.quiz;if(!q)return;
 if(q.index<q.qs.length-1){q.index++;renderQuiz();return;}
 const earned=q.correct*10;saved.score+=earned;
 const passed=q.correct>=2;if(passed)saved.done[q.j.id]=true;store();
 $('quizForm').hidden=true;$('quizFeedback').hidden=true;$('nextQuestion').hidden=true;
 $('quizContext').textContent='BILAN DU DÉFI';$('questionTitle').textContent=q.correct+' / '+q.qs.length+' réponses justes';
 $('questionHelp').textContent='Score : +'+earned+' points. '+(passed?'Liaison validée.':'La liaison n’est pas encore validée : il faut 2 bonnes réponses sur 3.');
 $('quizFinal').hidden=false;$('quizFinal').innerHTML='<p><b>'+esc(q.j.name)+'</b> — '+esc(q.j.axis)+'</p><p>'+esc(q.j.model)+'</p><button type="button" class="btn primary" id="retryThis">Recommencer ce défi</button>';
 $('retryThis').addEventListener('click',()=>startQuiz(q.j.id));renderStats();
}
function exportProgress(){
 const lines=['SI-LIAISONS - Bilan personnel','Date : '+new Date().toLocaleDateString('fr-FR'),'Parcours : '+s.level,'Points : '+saved.score,'Liaisons validées :'];
 JOINTS.filter(j=>saved.done[j.id]).forEach(j=>lines.push('- '+j.name));if(!JOINTS.some(j=>saved.done[j.id]))lines.push('(aucune)');
 const data=new Blob([lines.join('\n')+'\n'],{type:'text/plain;charset=utf-8'});
 const url=URL.createObjectURL(data),a=document.createElement('a');a.href=url;a.download='SI-LIAISONS-bilan.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
 $('exportStatus').textContent='Bilan créé localement. Aucune donnée nominative transmise.';
}
function bind(){
 $('level').value=s.level; $('dys').setAttribute('aria-pressed',document.body.classList.contains('dys')?'true':'false');
 $('level').addEventListener('change',e=>{s.level=e.target.value;try{localStorage.setItem('si-liaisons-level',s.level);}catch(err){}s.quiz=null;nav('home');});
 $('dys').addEventListener('click',()=>{document.body.classList.toggle('dys');const active=document.body.classList.contains('dys');$('dys').setAttribute('aria-pressed',active?'true':'false');try{localStorage.setItem('si-liaisons-dys',active?'1':'0');}catch(e){}});
 document.querySelectorAll('.nav-button').forEach(x=>x.addEventListener('click',()=>{if(x.dataset.view==='challenge')startQuiz();else nav(x.dataset.view);}));
 document.querySelectorAll('[data-go]').forEach(x=>x.addEventListener('click',()=>{if(x.dataset.go==='challenge')startQuiz();else nav(x.dataset.go);}));
 $('flashButton').addEventListener('click',()=>{const el=$('flashAnswer');el.hidden=!el.hidden;$('flashButton').textContent=el.hidden?'Afficher la réponse':'Masquer la réponse';});
 $('search').addEventListener('input',renderCatalog);
 $('jointGrid').addEventListener('click',e=>{const b=e.target.closest('[data-joint]');if(b)openJoint(b.dataset.joint);});
 $('backCatalog').addEventListener('click',()=>nav('catalog'));
 $('motionButtons').addEventListener('click',e=>{const b=e.target.closest('[data-motion]');if(b)motionTest(b.dataset.motion);});
 $('resetMotion').addEventListener('click',()=>{if(s.current)openJoint(s.current.id);});
 $('detailChallenge').addEventListener('click',()=>{if(s.current)startQuiz(s.current.id);});
 $('newChallenge').addEventListener('click',()=>startQuiz());
 $('quizForm').addEventListener('submit',submitQuiz);$('nextQuestion').addEventListener('click',nextQuiz);
 $('exportProgress').addEventListener('click',exportProgress);
 $('clearProgress').addEventListener('click',()=>{if(confirm('Effacer uniquement les scores et validations de cet appareil ?')){saved={done:{},score:0};store();renderStats();$('exportStatus').textContent='Progression locale réinitialisée.';}});
}
bind();nav('home');