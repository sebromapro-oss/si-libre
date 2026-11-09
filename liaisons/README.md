# SI-LIAISONS — laboratoire de cinématique
## Branche expérimentale V3 — 9 novembre 2026

**État : non fusionnée, V2 publique inchangée.**

Évolutions intégrées :
- Parcours explicite en 3 étapes (Observer → Manipuler → Modéliser).
- Objectifs et consignes différenciés CAP, Bac Pro et BTS.
- Réglage de vitesse (0,25× à 2×) et d'amplitude (25 % à 150 %) pour visualiser les mouvements.
- Évaluation des six mobilités par cases à cocher avant révélation du tableau et du DDL.
- Deux tentatives de modélisation, avec correction seulement après réussite ou second essai.
- Conservation des 11 liaisons et des défis de la V2.
- Section « photo/illustration d’atelier » sur 6 fiches avec auteur, nature de l’image, lien de licence et signalement du contre-exemple.
- Croquis fonctionnels OXYZ des 11 liaisons, séparés explicitement des symboles normalisés.
- Renvoi vers la planche officielle Éduscol DT 6/14 contenant les symboles plans et spatiaux.
- Contrôles statiques et moteur de rendu exécutés pour les 66 couples liaison/mouvement.

Non intégrés à ce stade :
- Visuels pertinents et licenciés pour les 5 fiches restant sans photographie spécifique. Les six images actuelles sont chargées à distance depuis Wikimedia Commons : une connexion est nécessaire pour les afficher, contrairement au moteur de simulation.
- Symboles 2D et spatiaux vérifiés selon NF EN ISO 3952-1, à ne pas inventer.
- Rotation libre à la souris ou au doigt du modèle 3D ; l'animation varie selon les mouvements testés mais la caméra reste fixe.
- Graphe de liaisons et schéma cinématique multi-solides.
- Liaison sécurisée au suivi nominatif SI-MISSION.
- Recette utilisateur en classe et sur appareils physiques.

**Condition de fusion :** test en navigateur de la branche déployée en prévisualisation, validation des modèles réels, accessibilité clavier/mobile et comparaison visuelle avec V2.

---

Application pédagogique statique hébergée sur GitHub Pages, dans le dépôt public sebromapro-oss/si-libre.

**Accès :** https://sebromapro-oss.github.io/si-libre/liaisons/

## État de la version 0.2 (9 novembre 2026)

- Interface française, responsive et accessible au clavier.
- Trois entrées : CAP, Bac Pro, BTS TSMA/MMCM.
- 8 liaisons de base pour CAP/Bac Pro, 11 pour BTS.
- 6 commandes de mobilité par fiche : Tx, Ty, Tz, Rx, Ry, Rz.
- Modèles mécaniques 3D procéduraux en projection isométrique : les pièces sont animées par transformations rigides autour des axes OXYZ.
- Flèche verte et déplacement cyclique pour chaque mouvement autorisé ; tentative limitée et croix rouge pour un mouvement interdit.
- Visualisation de la rotation et de la translation couplées du système vis–écrou.
- Lecture et pause de l'animation.
- Repère local OXYZ dessiné sur chaque simulateur.
- Degré de liberté compté en variables indépendantes (cas hélicoïdal : Tx et Rx couplées).
- Situation d'atelier, objectif, modèle, trois questions à correction explicative.
- Score local, validation à partir de 2 réponses correctes sur 3, export texte.
- Sans connexion, sans cookies d'analyse, sans identifiants, sans AppDeploy, sans Supabase, sans dépendance JavaScript externe.

## Attention — limites documentaires

Les scènes sont des modèles 3D calculés en JavaScript et projetés sur un canvas 2D. Elles montrent réellement le changement d'orientation ou de position de chaque solide, mais la géométrie et les trajectoires sont simplifiées : il ne s'agit pas d'un simulateur CAO validé par mesure. Les illustrations ne sont pas à considérer comme des symboles cinématiques normalisés certifiés.

Les symboles 2D/3D normalisés restent à intégrer après contrôle formel des conventions avec l'enseignant, à partir des documents de référence, notamment NF EN ISO 3952-1. La V3 ajoute six visuels externes documentés ; le pilotage libre par glisser-déposer du modèle 3D ne fait pas encore partie de cette version. Les images sont externes et peuvent être indisponibles hors connexion.

Repère adopté dans les fiches : X à droite, Y projeté en bas à gauche, Z vers le haut. Le repère local doit être orienté selon la géométrie de la liaison avant d'attribuer Tx, Ty, Tz, Rx, Ry, Rz.

Les valeurs des mobilités reprennent les deux affiches de travail CAP/BTS transmises par l'enseignant. En particulier pour la rotule à doigt, l'orientation du doigt et des axes doit être vérifiée sur un montage réel avant d'employer le tableau de mobilités comme référence universelle.

## Déploiement

Les fichiers index.html, styles.css, app.js sont servis directement comme un dossier du site si-libre ; aucune compilation nécessaire. Les modifications dans ce dossier ne doivent pas toucher les applications de réactivation mémoire et SI LAB à la racine du dépôt.

## Contrôles réalisés

- Vérification syntaxique JavaScript et correspondance des identifiants DOM.
- 11 matrices de 6 mobilités, DDL indépendants cohérents.
- 33 questions générées : réponse correcte présente parmi les choix.
- Serveur GitHub Pages : réponse HTTP 200 le 9 novembre 2026.
- Test navigateur en direct : navigation jusqu'à Pivot, rotation Rx autorisée, translation Tx bloquée et feedback du défi.
- Vérifier ensuite sur machine réelle et avec les élèves les 11 modélisations et leur lisibilité, notamment sur téléphone.

**À réceptionner avant usage inspection :** qualité visuelle en mobile, manipulation réelle des six boutons, justesse de tous les symboles normatifs, photos sous licence compatible, essai par élèves CAP/BTS et lecture d'écran.

## Banque iconographique V3 (Wikimedia Commons)

- Encastrement, support seul : SICD Ltd, CC0, fichier MX Olimunllum Bracket.jpg.
- Pivot : FNQ, domaine public, fichier Knuckle boom.jpg.
- Glissière : Neerol34, CC BY-SA 4.0, illustration numérique de guidage de machine-outil (non photographie).
- Hélicoïdale : Interiot, domaine public, fichier Jackscrew.jpg.
- Rotule : lemonnn, domaine public, fichier Tie-rod.JPG.
- Pivot glissant : Zdenek Vlasic, CC BY-SA 3.0, **contre-exemple** : image d'une glissière, signalée comme telle.

Les sources et licences sont consultables en cliquant sur « Photo et licence (Wikimedia Commons) » à côté de chaque image. Les photographies ne sont pas des références métrologiques des liaisons.

## Sources

- ISO 3952-1:1981 (confirmée en 2024) : https://www.iso.org/standard/9603.html
- AFNOR — NF EN ISO 3952-1 : https://www.boutique.afnor.org/fr-fr/norme/nf-en-iso-39521/schemas-cinematiques-symboles-graphiques-partie-1/fa036838/6745
- Éduscol — tableau officiel d’examen DT 6/14 : https://bnseep.eduscol.education.fr/ressources/examens/sujets/07/_0403164024_014.pdf#page=6
- Éduscol — ressources schéma cinématique : https://sti.eduscol.education.fr/ressources_pedagogiques/schema-cinematiquecom
