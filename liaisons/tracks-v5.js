/* SI-LIAISONS V5 — situations différenciées, aucune validation certificative.
   Les tâches sont construites par liaison et diplôme. Aucune donnée nominative. */
(function () {
'use strict';
const LEVELS={
 CAP:{
  name:"CAP Maintenance des matériels",phase:"Identifier",bloom:"Mémoriser · Comprendre · Appliquer",
  role:"Apprenti en atelier, accompagné par le responsable.",
  objective:"Repérer deux solides et identifier un mouvement relatif observable.",
  prereq:"Reconnaître une translation, une rotation et lire les axes X, Y, Z.",
  criteria:"Je nomme les deux pièces, je repère le mouvement et je choisis la réponse correcte.",
  action:"Identifier et observer",duration:"10 à 15 min",requireReason:false,
  evidence:"Observation orale ou réponse courte à partir du mécanisme."
 },
 BAC:{
  name:"Bac Pro Maintenance des matériels",phase:"Diagnostiquer",bloom:"Comprendre · Appliquer · Analyser",
  role:"Technicien de maintenance chargé d'une première analyse.",
  objective:"Relier une liaison, le mouvement attendu et un contrôle professionnel pertinent.",
  prereq:"Reconnaître les liaisons usuelles, les six mobilités et les règles de sécurité d'atelier.",
  criteria:"Je décris l'anomalie, je sélectionne un contrôle cohérent et je justifie sa pertinence.",
  action:"Analyser un dysfonctionnement",duration:"15 à 20 min",requireReason:true,
  evidence:"Choix du contrôle + justification écrite ; validation technique par l'enseignant."
 },
 BTS:{
  name:"BTS TSMA / BTS MMCM",phase:"Modéliser",bloom:"Appliquer · Analyser · Évaluer · Créer",
  role:"Technicien supérieur préparant un diagnostic ou une étude cinématique.",
  objective:"Justifier un modèle de liaison avec repère local, contraintes et mobilités indépendantes.",
  prereq:"Repère OXYZ, mobilité relative, hypothèse de contact maintenu et écriture d'un modèle.",
  criteria:"Je choisis le modèle cohérent, j'explicite mes hypothèses et je justifie les DDL indépendants.",
  action:"Modéliser et argumenter",duration:"20 à 30 min",requireReason:true,
  evidence:"Modèle ou résultat sélectionné + argument écrit ; schéma à réaliser sous contrôle professeur."
 }
};
const CASES={
 encastrement:{
  CAP:{trigger:"Le support moteur est assemblé sur le bâti par des fixations.",question:"Quel mouvement relatif doit-on observer dans le modèle parfait ?",choices:["Aucun mouvement relatif","Une rotation autour de X","Une translation suivant X","Trois rotations"],answer:0,explain:"Le support et le bâti restent solidaires. Aucun déplacement relatif n'est permis.",hint:"Observe si le support peut bouger par rapport au bâti."},
  BAC:{trigger:"Le conducteur signale une vibration anormale au niveau du support moteur. La machine est immobilisée et sécurisée.",question:"Quelle vérification initiale est cohérente avec une liaison encastrement ?",choices:["Vérifier l'état des fixations et le serrage selon la procédure constructeur","Augmenter la vitesse du moteur pour confirmer la vibration","Créer volontairement un jeu au niveau du support","Remplacer immédiatement toute la motorisation"],answer:0,explain:"L'encastrement idéal interdit tout mouvement relatif. Une dégradation des fixations ou du support peut conduire à un mouvement parasite ; elle doit être contrôlée sans conclure d'emblée à une cause unique.",hint:"L'encastrement repose notamment sur l'intégrité des éléments d'assemblage."},
  BTS:{trigger:"Tu modélises la liaison entre un support moteur et le bâti d'une machine supposés parfaitement assemblés.",question:"Quelle écriture cinématique est cohérente dans le modèle parfait ?",choices:["Toutes les composantes de vitesse relative sont nulles","Seule la vitesse angulaire autour de X est non nulle","Les translations sont libres dans le plan XY","Trois rotations indépendantes sont possibles"],answer:0,explain:"Une liaison encastrement parfaite a zéro DDL. Le torseur cinématique relatif est nul en tout point.",hint:"Compte les paramètres indépendants du mouvement relatif."}
 },
 pivot:{
  CAP:{trigger:"Le bras d'une pelle est articulé autour d'un axe traversant les deux pièces.",question:"Quel mouvement est autorisé dans le repère où l'axe du pivot est X ?",choices:["Tourner autour de X","Glisser suivant X","Tourner autour de Z","Glisser suivant Z"],answer:0,explain:"Une liaison pivot autour de X autorise Rx et interdit les cinq autres mobilités du modèle parfait.",hint:"L'axe de l'articulation donne la direction de la rotation."},
  BAC:{trigger:"Sur une articulation de bras de pelle, un jeu anormal est signalé. Le bras est posé et l'ensemble consigné.",question:"Quel contrôle est le plus adapté pour préciser l'état du pivot ?",choices:["Contrôler l'axe, les bagues et le jeu selon la méthode constructeur","Régler la cylindrée de la pompe avant tout contrôle","Souder les deux pièces pour supprimer la rotation","Forcer l'articulation sous charge pour mesurer le jeu"],answer:0,explain:"Le pivot est un guidage en rotation : l'état des bagues et de l'axe, ainsi que les jeux prescrits, sont des points d'investigation pertinents.",hint:"Le défaut concerne un guidage tournant et son jeu."},
  BTS:{trigger:"En O sur l'axe X, tu établis le torseur cinématique du bras par rapport au bâti.",question:"Quel ensemble de composantes peut être non nul dans le modèle de pivot ?",choices:["La seule vitesse angulaire Ωx","La seule vitesse linéaire Vx","Les vitesses Ωx et Vx indépendantes","Les trois vitesses angulaires"],answer:0,explain:"Pour le pivot d'axe (O,X), Ωx peut être non nulle ; les translations et les autres rotations sont bloquées.",hint:"Une pivot parfaite possède un seul paramètre angulaire."}
 },
 glissiere:{
  CAP:{trigger:"Un chariot se déplace sur des rails sans changer d'orientation.",question:"Comment se déplace le chariot si la direction du guidage est X ?",choices:["Il glisse suivant X","Il tourne autour de X","Il monte suivant Z","Il tourne autour de Y"],answer:0,explain:"La glissière autorise une seule translation Tx dans le repère où X est la direction du rail.",hint:"Le chariot garde la même orientation pendant son déplacement."},
  BAC:{trigger:"Un chariot de machine présente des points durs pendant sa course. La machine est arrêtée et sécurisée.",question:"Quel contrôle initial est cohérent ?",choices:["Inspecter la propreté, les surfaces de guidage et leur état selon la procédure","Augmenter l'effort d'entraînement jusqu'à disparition du point dur","Desserrer toutes les fixations du guidage sans relever leur position","Diagnostiquer exclusivement la partie électrique"],answer:0,explain:"La qualité des surfaces de guidage et les défauts d'alignement peuvent limiter la translation. Une inspection raisonnée précède toute intervention.",hint:"La liaison glissière guide une translation sans rotation."},
  BTS:{trigger:"Le mouvement relatif d'un chariot est guidé selon X, sans rotation.",question:"Quelle mobilité correspond au modèle cinématique ?",choices:["Vx seule peut être non nulle","Ωx seule peut être non nulle","Vx et Ωx indépendantes","Vx et Vy indépendantes"],answer:0,explain:"La glissière idéale autorise seulement Tx : une composante de vitesse de translation suivant X.",hint:"L'orientation du chariot demeure constante."}
 },
 helicoidale:{
  CAP:{trigger:"La vis d'un cric est tournée et l'écrou se déplace le long de l'axe.",question:"Que faut-il retenir de cette liaison ?",choices:["La rotation et la translation sont liées","La translation et la rotation sont indépendantes","Le déplacement est uniquement latéral","Tous les mouvements sont bloqués"],answer:0,explain:"La liaison hélicoïdale réalise simultanément une rotation et une translation liées par le pas.",hint:"Le déplacement suit le nombre de tours effectué."},
  BAC:{trigger:"Un cric à vis présente un effort inhabituel à la manœuvre et un déplacement irrégulier. Il est hors charge et sécurisé.",question:"Quel contrôle est justifié avant toute remise en service ?",choices:["Inspecter vis, écrou, filets et lubrification prescrite","Forcer la manivelle en charge jusqu'au déblocage","Supprimer l'écrou pour diminuer le frottement","Conclure sans mesure que le moteur hydraulique est en cause"],answer:0,explain:"L'état des filets et des surfaces en contact affecte la transformation rotation–translation. Le contrôle doit respecter les prescriptions constructeur.",hint:"Ce sont les surfaces filetées qui réalisent la fonction cinématique."},
  BTS:{trigger:"Une vis à droite est orientée suivant +X, avec pas positif p = 4 mm/tr. La rotation est θ = +π rad ; la convention retenue est x = pθ/(2π).",question:"Quel déplacement axial algébrique résulte de cette rotation ?",choices:["+2 mm","+4 mm","+8 mm","−2 mm"],answer:0,explain:"x = (4 mm/tr) × (π rad)/(2π rad/tr) = +2 mm. Le déplacement a le même signe que la convention positive choisie. Tx et Rx sont couplées, donc 1 DDL.",hint:"Un demi-tour vaut 0,5 tr. Contrôle les unités et le signe."}
 },
 'pivot-glissant':{
  CAP:{trigger:"Un arbre guidé dans une bague peut glisser et tourner sur son axe.",question:"Que peux-tu observer ?",choices:["Une translation axiale et une rotation axiale","Aucun mouvement","Une rotation autour de Y uniquement","Une translation selon Z uniquement"],answer:0,explain:"L'arbre peut tourner autour de X et coulisser suivant X indépendamment.",hint:"L'arbre peut avancer et aussi être tourné à la main (machine sécurisée)."},
  BAC:{trigger:"Un arbre libre en rotation devient difficile à déplacer axialement dans sa bague. La machine est arrêtée.",question:"Quel constat faut-il investiguer ?",choices:["État des surfaces de guidage, géométrie et lubrification prescrite","Circuit de chauffage du poste de conduite uniquement","Usure des pneumatiques de l'engin exclusivement","Diminution volontaire des butées de sécurité"],answer:0,explain:"Une pivot glissant conserve normalement rotation et translation indépendantes. Un obstacle axial impose de contrôler le guidage et les conditions de montage.",hint:"Une des deux mobilités normalement indépendantes est devenue difficile."},
  BTS:{trigger:"Un arbre cylindrique sans butée axiale est modélisé dans une bague coaxiale X.",question:"Quelle relation définit ses mobilités ?",choices:["Tx et Rx peuvent varier indépendamment","Tx et Rx sont liées par un pas p","Rx seule est possible","Ty et Rz sont les seules mobilités"],answer:0,explain:"Une pivot glissant possède deux DDL indépendants : translation suivant X et rotation autour de X. Elle diffère de l'hélicoïdale par l'absence de couplage imposé.",hint:"Il n'y a ni filet ni transformation cinématique imposée."}
 },
 rotule:{
  CAP:{trigger:"Une rotule de direction permet à une tige de s'orienter dans plusieurs directions.",question:"Quel type de mouvements est possible autour du centre O ?",choices:["Des rotations, sans translation du centre","Trois translations du centre","Une translation selon X uniquement","Aucun changement d'orientation"],answer:0,explain:"Une rotule idéale autorise trois rotations autour d'un même centre et n'autorise aucune translation de celui-ci.",hint:"Le centre de la bille reste au même endroit."},
  BAC:{trigger:"Une articulation à rotule de direction présente un claquement et un jeu supérieur à la valeur autorisée.",question:"Quelle démarche initiale est pertinente ?",choices:["Contrôler le jeu, les fixations et l'état de l'articulation selon procédure","Régler la géométrie sans vérifier la rotule","Graisser à l'aveugle une articulation non prévue pour cela","Rendre le système solidaire par soudage"],answer:0,explain:"Le jeu d'une rotule peut affecter le guidage d'orientation. Les contrôles doivent être réalisés dans les conditions de sécurité et les tolérances définies par le constructeur.",hint:"Il faut d'abord qualifier mécaniquement le jeu signalé."},
  BTS:{trigger:"Le centre O d'une rotule parfaite est commun aux deux solides.",question:"Quelle condition cinématique locale représente une rotule ?",choices:["Vitesse de translation relative au centre O nulle ; rotations libres","Translations libres ; toutes rotations bloquées","Seule Ωx non nulle","Tx et Rx couplées par un pas"],answer:0,explain:"Pour la rotule idéale, V_O est nulle et les trois composantes de vitesse angulaire peuvent varier : 3 DDL.",hint:"On distingue translation du centre et orientation autour du centre."}
 },
 'appui-plan':{
  CAP:{trigger:"Une pièce repose à plat sur la table d'une machine. Le contact est maintenu.",question:"Si Z est normal à la table, quel mouvement simple est possible ?",choices:["Glisser suivant X sur la table","Traverser la table suivant −Z","Basculer librement autour de X sans perdre le contact","Se déplacer suivant Z en gardant le contact"],answer:0,explain:"Dans le modèle d'appui plan maintenu, la pièce peut glisser selon X et Y, et tourner autour de la normale Z.",hint:"La pièce peut bouger dans le plan sans traverser le support."},
  BAC:{trigger:"Une pièce posée sur le plan d'un dispositif de réglage présente des mouvements parasites et des marques de contact.",question:"Quel contrôle aidera à comprendre la tenue de l'appui ?",choices:["Inspecter l'état, la propreté et la planéité des surfaces en contact","Conclure qu'une rotule interne est obligatoirement cassée","Déformer la table pour supprimer le jeu","Augmenter la charge au-delà de la limite constructeur"],answer:0,explain:"La qualité des surfaces conditionne la réalité du contact plan. L'appui plan idéal suppose des plans géométriquement cohérents et un contact maintenu.",hint:"Le défaut concerne directement les surfaces planes."},
  BTS:{trigger:"Deux plans sont en contact maintenu ; le plan d'appui est XY, de normale +Z.",question:"Quel ensemble représente les mobilités relatives du modèle idéal ?",choices:["Tx, Ty et Rz","Tx, Tz et Ry","Rx, Ry et Rz","Tx, Ty et Tz"],answer:0,explain:"L'appui plan maintenu autorise deux translations dans XY et une rotation autour de Z. Les autres mobilités ne maintiennent pas le contact plan.",hint:"Raisonne dans le plan et autour de sa normale."}
 },
 ponctuelle:{
  CAP:{trigger:"Une bille est en contact avec une surface plane horizontale, sans la quitter.",question:"Quelle direction de déplacement pénétrerait dans le plan et n'est pas autorisée ?",choices:["La direction normale Z vers le support","La direction X le long du plan","La direction Y le long du plan","Une rotation de la bille"],answer:0,explain:"Le modèle ponctuel avec contact maintenu interdit la pénétration suivant la normale Z, mais laisse les autres mobilités libres.",hint:"Une bille ne peut pas traverser la plaque."},
  BAC:{trigger:"Une bille chargée marque anormalement sa surface d'appui. L'ensemble est immobilisé et sécurisé.",question:"Quel relevé initial est pertinent pour qualifier le contact ?",choices:["Observer l'état des surfaces, la zone de contact et les traces d'effort","Mesurer uniquement la pression des pneumatiques","Ajouter une cale sans connaître les charges","Conclure immédiatement à une rupture de vis"],answer:0,explain:"Les marques de contact justifient une inspection des surfaces, de la géométrie et des charges ; le modèle ponctuel idéal ne prédit pas à lui seul la pression réelle.",hint:"La liaison concerne une zone de contact localisée."},
  BTS:{trigger:"Une sphère touche un plan en O, la normale au contact vaut Z ; le contact est supposé maintenu.",question:"Quelle composante est nulle au point de contact dans ce modèle ?",choices:["La vitesse normale relative Vz","La vitesse tangentielle Vx","Toutes les rotations","Les vitesses Vx et Vy"],answer:0,explain:"Au point de contact de la liaison ponctuelle maintenue, la composante normale de vitesse relative est nulle. Les cinq autres composantes sont libres dans le modèle idéal.",hint:"Écris l'impossibilité de pénétrer le plan au point de contact."}
 },
 'rotule-doigt':{
  BTS:{trigger:"Le dispositif antirotation d'une rotule à doigt est orienté de sorte que Rx soit bloquée dans le repère local retenu.",question:"Quelles rotations restent indépendantes dans ce repère ?",choices:["Ry et Rz","Rx et Ry","Rx, Ry et Rz","Aucune rotation"],answer:0,explain:"Une rotule à doigt retire une rotation par rapport à la rotule : dans le repère imposé ici, Ry et Rz restent possibles, soit 2 DDL.",hint:"La réponse dépend de l'orientation locale du doigt : ici Rx est la rotation bloquée."}
 },
 'lineaire-annulaire':{
  BTS:{trigger:"Une sphère de guidage est logée dans un alésage cylindrique orienté X, avec contacts idéaux maintenus.",question:"Quelles translations sont interdites dans le repère du guidage ?",choices:["Ty et Tz","Tx uniquement","Tx et Ty","Aucune translation"],answer:0,explain:"Dans le modèle linéaire annulaire d'axe X, les translations transversales Ty et Tz sont bloquées. Tx et les trois rotations restent possibles.",hint:"Le guidage limite la translation transverse à son axe."}
 },
 'lineaire-rectiligne':{
  BTS:{trigger:"Un cylindre repose selon une génératrice parallèle à X sur un plan XY ; normale Z, contact maintenu.",question:"Quelle composante de rotation est bloquée dans ce modèle ?",choices:["Ry","Rx","Rz","Toutes les rotations"],answer:0,explain:"Une rotation autour de Y fait perdre le contact selon toute la ligne. Dans le repère retenu, Ry et Tz sont bloquées, tandis que Tx, Ty, Rx, Rz restent possibles.",hint:"Imagine l'effet d'un basculement autour de Y sur le contact rectiligne."}
 }
};
function escapes(text){return String(text).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function item(level,j){
 const c=CASES[j.id]&&CASES[j.id][level];
 if(!c)throw new Error("Mission manquante "+level+" / "+j.id);
 const l=LEVELS[level];
 return {
 level:level,id:j.id,role:l.role,objective:l.objective,prereq:l.prereq,criteria:l.criteria,
 action:l.action,bloom:l.bloom,evidence:l.evidence,duration:l.duration,
 context:j.work,trigger:c.trigger,question:c.question,choices:c.choices,answer:c.answer,
 hint:c.hint,explain:c.explain,justify:level==="BAC"?"Explique en une phrase le lien entre le mouvement attendu et le contrôle choisi.":"Justifie le modèle : repère retenu, mobilité(s) indépendante(s), hypothèse éventuelle et conséquence mécanique.",
 requireReason:l.requireReason
 };
}
function question(title,options,answer,explain,hint){
 if(options.length!==4||new Set(options).size!==4||!options.includes(answer))throw new Error("Question mal définie : "+title);
 return {title:title,options:options,answer:answer,explain:explain,hint:hint};
}
function quiz(level,j,rand){
 const t=item(level,j);const shuffle=typeof rand==="function"?rand:(x=>x);
 const ddls=[j.ddl,...[0,1,2,3,4,5].filter(n=>n!==j.ddl).sort((a,b)=>Math.abs(a-j.ddl)-Math.abs(b-j.ddl)).slice(0,3)].map(String);
 if(level==="CAP"){
  const axis=j.axis.includes("X")?"X":j.axis.includes("Z")?"Z":"O";
  return [
   question("CAP • Que faut-il identifier pour étudier la liaison "+j.name.toLowerCase()+" ?",shuffle(["Les deux solides en mouvement relatif","Le numéro d'immatriculation de la machine","La couleur de peinture du carter","La marque du poste de conduite"]),"Les deux solides en mouvement relatif","Une liaison décrit les mouvements possibles entre deux solides.", "Commence par repérer les pièces."),
   question("CAP • Combien de mobilités indépendantes possède la liaison "+j.name.toLowerCase()+" ?",shuffle(ddls),String(j.ddl),j.model,"Compte les mouvements indépendants, pas seulement les flèches."),
   question("CAP • Dans la situation observée, que dois-tu reconnaître ?",shuffle([t.choices[t.answer],...t.choices.filter((x,i)=>i!==t.answer)]),t.choices[t.answer],t.explain,t.hint)
  ];
 }
 if(level==="BAC"){
  return [
   question("BAC PRO • Quel contrôle de maintenance est pertinent dans cette situation ?",shuffle(t.choices.slice()),t.choices[t.answer],t.explain,t.hint),
   question("BAC PRO • Quelle démarche professionnelle évite un diagnostic hâtif ?",shuffle(["Sécuriser, contrôler et comparer à la documentation constructeur","Remplacer tous les composants sans contrôle","Faire fonctionner la machine en surcharge pour confirmer","Supprimer les sécurités pour multiplier les essais"]),"Sécuriser, contrôler et comparer à la documentation constructeur","Un diagnostic exige des contrôles adaptés, la sécurité et une comparaison aux données constructeur.","Le symptôme seul ne suffit pas à conclure."),
   question("BAC PRO • Combien de DDL indépendants sont prévus par le modèle de liaison "+j.name.toLowerCase()+" ?",shuffle(ddls),String(j.ddl),j.model,"Le défaut réel est à comparer au comportement idéal.")
  ];
 }
 return [
  question("BTS • Quelle analyse ou quel résultat cinématique est correct ?",shuffle(t.choices.slice()),t.choices[t.answer],t.explain,t.hint),
  question("BTS • Quel nombre de degrés de liberté indépendants possède le modèle "+j.name.toLowerCase()+" ?",shuffle(ddls),String(j.ddl),j.model,"N'oublie pas le couplage des mouvements s'il existe."),
  question("BTS • Quelle hypothèse garantit la cohérence du modèle idéal ?",shuffle(["Repère local orienté et conditions de liaison explicitées","Axe choisi au hasard sans lien avec la géométrie","Absence totale de contact entre les solides","Mobilités déterminées uniquement par la couleur des pièces"]),"Repère local orienté et conditions de liaison explicitées","Les DDL n'ont de sens que relativement à un repère et à des hypothèses mécaniques explicites.","Un même symbole doit représenter la géométrie réelle du contact.")
 ];
}
function render(j,level){
 const t=item(level,j),sec=document.getElementById("levelMission");
 if(!sec)return;
 const l=LEVELS[level],choiceHtml=t.choices.map(function(v,i){
  return '<label class="mission-option"><input type="radio" name="missionAnswer" value="'+i+'" required><span>'+escapes(v)+'</span></label>';
 }).join("");
 sec.innerHTML='<div class="mission-header"><span class="eyebrow dark">MISSION PROFESSIONNELLE · '+escapes(level)+'</span><h2>'+escapes(l.phase)+' : '+escapes(j.name)+'</h2><span class="mission-level-tag">'+escapes(l.bloom)+'</span></div>'+
 '<div class="mission-data"><div><strong>Ton rôle</strong><p>'+escapes(t.role)+'</p></div><div><strong>Situation</strong><p>'+escapes(t.trigger)+'</p></div></div>'+
 '<p class="mission-objective"><strong>Objectif :</strong> '+escapes(t.objective)+' <strong>Réussite :</strong> '+escapes(t.criteria)+'</p>'+
 '<form id="missionForm"><fieldset><legend>'+escapes(t.question)+'</legend><div class="mission-options">'+choiceHtml+'</div></fieldset>'+
 (t.requireReason?'<label class="mission-reason" for="missionReason">Justification technique (une phrase minimum)<textarea id="missionReason" rows="3" placeholder="'+escapes(t.justify)+'"></textarea></label>':'')+
 '<button type="submit" class="btn primary" id="missionCheck">Vérifier mon analyse</button><p id="missionFeedback" role="status" aria-live="polite"></p></form>'+
 '<div class="mission-correction" id="missionCorrection" hidden></div>'+
 '<p class="mission-disclaimer">Évaluation formative : seule la réponse à choix est vérifiée automatiquement. La justification écrite doit être relue par le professeur. Aucune validation officielle de compétence.</p>';
 sec.hidden=true;sec.dataset.level=level;sec.dataset.joint=j.id;sec.dataset.attempts="0";
 const form=document.getElementById("missionForm");
 form.addEventListener("submit",function(e){e.preventDefault();
  const selected=form.querySelector('input[name="missionAnswer"]:checked');
  const reason=form.querySelector("#missionReason");
  const feedback=document.getElementById("missionFeedback"),corr=document.getElementById("missionCorrection");
  if(!selected){feedback.textContent="Choisis une proposition.";return;}
  if(t.requireReason&&(!reason||reason.value.trim().length<12)){
    feedback.textContent="Ajoute une phrase de justification (au moins 12 caractères), puis valide. Elle ne sera pas notée automatiquement.";return;
  }
  const tries=Number(sec.dataset.attempts)+1;sec.dataset.attempts=String(tries);
  const correct=Number(selected.value)===t.answer;
  if(!correct&&tries===1){feedback.textContent="À reprendre. "+t.hint+" Tu disposes d'un second essai.";feedback.className="mission-feedback error";return;}
  feedback.textContent=correct?"Choix correct. "+(t.requireReason?"Ta justification reste à faire vérifier par ton professeur.":"Tu as identifié le fonctionnement de la liaison."):"Deuxième essai terminé. Lis et explique la correction.";
  feedback.className="mission-feedback "+(correct?"success":"error");
  corr.hidden=false;corr.innerHTML='<strong>Correction :</strong> '+escapes(t.choices[t.answer])+'. '+escapes(t.explain)+
   (level==="BTS"?'<p>Trace écrite attendue : repère OXYZ, hypothèses de contact et mobilités indépendantes. Un schéma cinématique est à produire sur papier, puis à vérifier avec l’enseignant avant toute référence normative.</p>':"")+
   '<button type="button" class="btn primary" id="missionToQuiz">Passer au défi de mon niveau →</button>';
  form.querySelectorAll('input[name="missionAnswer"]').forEach(i=>i.disabled=true);
  if(reason)reason.readOnly=true;form.querySelector("button").disabled=true;
 });
}
window.SI_TRACKS={levels:LEVELS,cases:CASES,item:item,quiz:quiz,render:render};
})();
