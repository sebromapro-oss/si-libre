'use strict';
(function(){
 const official='https://bnseep.eduscol.education.fr/ressources/examens/sujets/07/_0403164024_014.pdf#page=6';
 const afnor='https://www.boutique.afnor.org/fr-fr/norme/nf-en-iso-39521/schemas-cinematiques-symboles-graphiques-partie-1/fa036838/6745';
 const photos={
 'encastrement':{file:'MX_Olimunllum_Bracket.jpg',caption:'Support de moteur (pièce isolée)',note:'Observer le support : dans le montage assemblé, le serrage des fixations doit supprimer les mobilités relatives. Le cliché ne montre pas le montage complet.',credit:'SICD Ltd · CC0'},
 'pivot':{file:'Knuckle_boom.jpg',caption:'Articulation de pelle mécanique',note:'Repère les deux éléments de la flèche et l’axe de rotation. Le centre de la liaison doit être localisé sur les bagues de l’articulation.',credit:'FNQ · domaine public'},
 'glissiere':{file:'Machining_Center_with_Linear_Guides,_Ballscrews_and_Cross_Roller_Bearings.jpg',caption:'Guidage linéaire sur machine-outil',note:'Illustration industrielle en 3D, pas une photographie. Repère le rail et le chariot qui se déplace.',credit:'Neerol34 · CC BY-SA 4.0'},
 'helicoidale':{file:'Jackscrew.jpg',caption:'Cric mécanique à vis',note:'Repère la vis et le mouvement d’élévation. La rotation et la translation sont conjuguées par le pas.',credit:'Interiot · domaine public'},
 'rotule':{file:'Tie-rod.JPG',caption:'Rotule de direction ouverte',note:'La coupe montre le contact sphérique : on distingue le pivotement du déplacement du centre.',credit:'lemonnn · domaine public'},
 'pivot-glissant':{file:'Linear_Bearing_Guide_way.jpg',caption:'Contre-exemple : guidage linéaire',note:'Illustration de glissière à comparer avec un arbre cylindrique libre de tourner ET de coulisser. Ce visuel ne représente PAS une pivot glissant.',credit:'Zdenek Vlasic · CC BY-SA 3.0'}
 };
 const path={
 'encastrement':"<path d='M64 99H266' stroke='#2478b0' stroke-width='8'/><path d='M145 99L197 55' stroke='#da843b' stroke-width='8'/>",
 'pivot':"<path d='M54 99H276' stroke='#1b557d' stroke-width='4'/><rect x='116' y='74' width='102' height='49' rx='3' fill='none' stroke='#267da9' stroke-width='5'/><path d='M116 74v49m102-49v49' stroke='#de904e' stroke-width='5'/>",
 'glissiere':"<path d='M49 120H281' stroke='#2478b0' stroke-width='7'/><rect x='113' y='68' width='120' height='49' fill='none' stroke='#dc8841' stroke-width='5'/>",
 'helicoidale':"<path d='M49 99H281' stroke='#2478b0' stroke-width='4'/><rect x='106' y='74' width='128' height='50' fill='none' stroke='#2478b0' stroke-width='4'/><path d='M120 100l11-20 13 38 13-38 13 38 13-38 13 38 14-18' fill='none' stroke='#dc8841' stroke-width='4'/>",
 'pivot-glissant':"<path d='M51 100H279' stroke='#2478b0' stroke-width='4'/><path d='M109 75h110v49H109' fill='none' stroke='#dc8841' stroke-width='5'/>",
 'rotule':"<path d='M50 99H281' stroke='#2478b0' stroke-width='4'/><circle cx='168' cy='99' r='30' fill='none' stroke='#dc8841' stroke-width='5'/>",
 'appui-plan':"<path d='M58 129H274' stroke='#2478b0' stroke-width='6'/><path d='M90 117H250' stroke='#dc8841' stroke-width='6'/>",
 'ponctuelle':"<path d='M58 135H274' stroke='#2478b0' stroke-width='6'/><circle cx='164' cy='96' r='37' fill='none' stroke='#dc8841' stroke-width='5'/>",
 'rotule-doigt':"<path d='M50 99H281' stroke='#2478b0' stroke-width='4'/><circle cx='168' cy='99' r='30' fill='none' stroke='#dc8841' stroke-width='5'/><path d='M168 69v-17' stroke='#2478b0' stroke-width='6'/>",
 'lineaire-annulaire':"<path d='M50 99H281' stroke='#2478b0' stroke-width='4'/><rect x='118' y='76' width='95' height='46' fill='none' stroke='#2478b0' stroke-width='4'/><circle cx='165' cy='99' r='28' fill='none' stroke='#dc8841' stroke-width='5'/>",
 'lineaire-rectiligne':"<path d='M58 139H274' stroke='#2478b0' stroke-width='6'/><path d='M118 113l46-46 47 46' fill='none' stroke='#dc8841' stroke-width='6'/>"
 };
 function esc(t){return String(t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
 function render(j){
   const p=photos[j.id],container=document.getElementById('fieldPhoto');
   if(container){
     if(p){
       const url='https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(p.file)+'?width=900';
       const page='https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(p.file);
       container.innerHTML='<figure class="field-figure"><img id="casePhoto" src="'+esc(url)+'" loading="lazy" referrerpolicy="no-referrer" alt="'+esc(p.caption)+'"><figcaption><h3>'+esc(p.caption)+'</h3><p>'+esc(p.note)+'</p><small>'+esc(p.credit)+' · <a target="_blank" rel="noopener noreferrer" href="'+esc(page)+'">Photo et licence (Wikimedia Commons)</a></small></figcaption></figure>';
       container.hidden=false;
       const img=document.getElementById('casePhoto');
       img.addEventListener('error',function(){img.hidden=true;const info=document.createElement('p');info.textContent='Le visuel externe est indisponible. Utilise le lien de la source Wikimedia Commons.';img.after(info);});
     } else {container.innerHTML='<p class="small-note">Photographie spécifique à documenter. Observe le modèle technique ci-dessous et repère les deux solides.</p>';container.hidden=false;}
   }
   const target=document.getElementById('referenceDiagram');if(!target)return;
   const sketch=path[j.id]||path.pivot;
   const axis="<circle cx='45' cy='184' r='4' fill='#12324a'/><path d='M45 184h44m-44 0v-39m0 39l-27 20' stroke='#174e77' stroke-width='3'/><text x='97' y='190' font-size='15'>X</text><text x='35' y='139' font-size='15'>Z</text><text x='9' y='220' font-size='15'>Y</text><text x='30' y='179' font-size='12'>O</text>";
   target.innerHTML='<div class="reference-grid"><div><h3>Croquis fonctionnel 2D</h3><svg viewBox="0 0 340 225" role="img" aria-label="Croquis pédagogique, non certifié normatif, avec repère OXYZ"><rect x="0" y="0" width="340" height="225" rx="13" fill="#eff5f8"/>'+sketch+axis+'</svg><p class="small-note">Croquis pédagogique d’interprétation du mouvement. Il ne remplace pas le symbole normalisé.</p></div><div><h3>Comparer au symbole officiel</h3><p>Vérifie les représentations <b>plane</b> et <b>en perspective</b>, l’axe, le centre, et les couleurs de solides avant de copier le modèle dans un schéma cinématique.</p><p><a target="_blank" rel="noopener noreferrer" href="'+official+'">Tableau Éduscol — DT 6/14 (symboles usuels)</a></p><p><a target="_blank" rel="noopener noreferrer" href="'+afnor+'">NF EN ISO 3952-1 — référence AFNOR</a></p><p class="small-note">Validation graphique détaillée des 11 symboles encore nécessaire avant une utilisation certificative.</p></div></div>';
 }
 window.SI_MEDIA={render:render,photos:photos};
})();