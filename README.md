# SI Réactivation

Application unique de réactivation mémoire pour :
- BTS TSMA
- BTS MMCM
- Bac Pro Maintenance des Matériels
- CAP Maintenance des Matériels

## Architecture

- Frontend statique GitHub Pages.
- Authentification et données : Supabase.
- Aucune banque de questions n'est stockée publiquement dans ce dépôt.
- Les questions ne sont accessibles qu'après authentification et selon le parcours attribué au compte.
- Réactivation espacée : J0 → J+2 → J+7 → J+21 → J+45 → J+90.
- Retour accéléré après hésitation ou erreur.

## Sécurité

Les tables Supabase utilisent RLS. Un utilisateur non authentifié ne peut pas lire les questions.
Les élèves ne voient que leur parcours. Le rôle enseignant peut consulter les quatre parcours et les comptes.

## Créer un compte élève

1. Créer l'utilisateur dans **Supabase > Authentication > Users**.
2. Copier son UUID.
3. Ajouter son profil :

```sql
insert into public.reactivation_profiles
(user_id, role, track, display_name, active)
values
('<UUID>', 'student', 'TSMA', 'Prénom NOM', true);
```

Valeurs de `track` : `TSMA`, `MMCM`, `BAC_PRO`, `CAP`.

Pour l'enseignant :

```sql
insert into public.reactivation_profiles
(user_id, role, track, display_name, active)
values
('<UUID>', 'teacher', null, 'Enseignant', true);
```

Aucune inscription libre n'est proposée dans l'application.

## Contenu actuellement chargé

- TSMA : 68 réactivations
- MMCM : 69 réactivations
- Bac Pro : 29 réactivations
- CAP : 28 réactivations

Les réactivations proviennent de la banque maître consolidée à partir des cours, TD, devoirs, corrigés, fiches de révision et erreurs fréquentes.
