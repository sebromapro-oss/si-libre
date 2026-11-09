# SI-LIAISONS — Audit pédagogique et ergonomique mobile
Date : 9 novembre 2026. Versions : V4.0 analysée, V4.1 corrigée. Statut : GO limité sous réserves de recette réelle.

## Synthèse de non-conformités et actions
| Gravité | Constat | Correctif ou action |
|---|---|---|
| P0 | Navigation et en-tête trop lourds en portrait | Barre tactile basse à quatre accès, adaptation 320/360/390/430 px et marges de sécurité iOS |
| P0 | Simulateur trop bas sur petit écran | Hauteur utile augmentée, repère OXYZ et légendes repositionnés |
| P0 | Réponses visibles avant investigation | Catalogue neutre, scène initiale sans mouvement, DDL et objectifs ciblés masqués jusqu'à vérification |
| P1 | Interactivité peu tracée | Compteur des six mouvements effectivement testés, sans blocage de la navigation |
| P1 | Évaluation trop fermée | QCM à quatre choix homogènes pour les DDL ; ajouter question de justification orale ou écrite |
| P1 | Confusion réussite et certification | Afficher « défi réussi » ; ne jamais assimiler ce statut à une compétence validée par professeur |
| P1 | Photos externes et certaines non correspondantes | Vérifier la pertinence, l'auteur, la licence et la disponibilité hors réseau |
| P1 | Différenciation surtout sur les consignes | Préparer trois activités graduées CAP / Bac Pro / BTS avec critères spécifiques |
| P2 | Schéma cinématique et graphe multi-solides absents | Production ultérieure après validation des symboles normalisés |

## Chaîne pédagogique et taxonomie de Bloom
1. Mémoriser : rituel d'entrée sur translation, rotation et hélicoïdale.
2. Comprendre : observer les deux solides et positionner le repère OXYZ.
3. Appliquer : tester Tx Ty Tz Rx Ry Rz sur le mécanisme animé.
4. Analyser : proposer la matrice des mobilités et distinguer couplage et indépendance.
5. Évaluer : comparer la proposition à la correction et répondre au défi.
6. Créer : niveau encore absent ; faire construire un schéma cinématique argumenté, après qualification normative.

## Parcours par diplôme
CAP : identifier 2 solides, nommer une mobilité, repérer l'axe ; 8 liaisons.
Bac Pro maintenance des matériels : justifier guidage et contraintes mécaniques dans une situation atelier ; 8 liaisons. Ajouter classes d'équivalence, graphe et diagnostic de jeu/usure.
BTS TSMA/MMCM : analyser repère et six mouvements, DDL indépendants, contacts maintenus, couplage ; 11 liaisons. Ajouter études multi-solides, choix de modèle, schémas et argumentation.

Les référentiels officiels par diplôme restent à confronter activité par activité. Une conformité à tous les attendus n'est pas démontrée.

## Points de vigilance scientifique
Liaison hélicoïdale : Tx et Rx couplées, un seul degré de liberté indépendant. Convention d'axe et signe du pas à préciser.
Contacts parfaits : appui plan, ponctuelle et linéaire rectiligne supposent contact maintenu.
Rotule à doigt : le choix des deux rotations autorisées dépend de l'orientation locale du repère.
Les croquis et animations sont pédagogiques et simplifiés ; ils ne constituent ni symboles ISO certifiés ni modèles de CAO validés.

## Recette de réception obligatoire
- Reflow 320, 360, 390 et 430 px CSS : aucune information essentielle masquée ni défilement horizontal de page.
- Les quatre boutons de navigation, la sélection CAP/Bac Pro/BTS et le confort DYS doivent rester accessibles au toucher.
- Simulateur : vérifier les 11 liaisons et 6 commandes, lisibilité et retour textuel autorisé/bloqué.
- Clavier et TalkBack/VoiceOver : focus visible, absence de masque par la navigation fixe, annonces des corrections.
- Pause et réduction d'animation, portrait et paysage, zoom 200 %, photos indisponibles.
- En classe : essai au moins avec un élève de chaque niveau ; relevé des incompréhensions avant certification pédagogique.

## Vérifications effectuées par le développement
- Syntaxe JavaScript, correspondance des identifiants HTML et actions des boutons.
- 27 parcours de logique sur les 11 liaisons selon les niveaux : OK.
- 264 cas simulés de rendu cinématique sur quatre largeurs CSS : OK.
- Ce ne sont PAS des tests en navigateur physique. La conformité mobile et WCAG ne peut être affirmée sans la recette.

## Sources
W3C, WCAG 2.2, Reflow 320px : https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
W3C, Target Size (Minimum) : https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
W3C, Focus Not Obscured : https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum
W3C, Pause Stop Hide : https://www.w3.org/TR/WCAG22/#pause-stop-hide
ISO 3952-1, référence : https://www.iso.org/standard/9603.html

DECISION : GO LIMITÉ. Déploiement possible pour observation pédagogique, mais non-conformités de contenu normatif et essais réels à lever avant présentation comme ressource finalisée d'inspection.