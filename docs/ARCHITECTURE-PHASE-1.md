# Phase 1 — Décisions d'architecture

> Répond aux six décisions ouvertes de la section 3 de `CAHIER-DES-CHARGES.md`.
> Chaque décision est motivée par le code existant, pas par une préférence.
> **Aucun code n'a été écrit.** Ce document est à valider avant implémentation.

---

## Ce que le code dit déjà

Trois constats tirés de la lecture de `AppStore.tsx`, `seed.ts` et `markets.ts` :

**1. Le `market` est déjà sur chaque entité.** Chaque `user`, chaque `property`,
chaque `task` porte `market: "FR" | "QC"`. L'application a été pensée
multi-marché depuis le début — c'est un atout majeur pour la suite.

**2. La donnée réglementaire des professionnels existe déjà.** Les agents
portent `licence`, `licenceType` (« Carte T + G (loi Hoguet) », « Courtier
immobilier résidentiel »), `financialGuarantee`, `rcPro`, `licenceExpiry`.
Le modèle sait déjà distinguer un titulaire de carte d'un simple gestionnaire —
seul le champ `role` ne le sait pas.

**3. Les relations d'appartenance sont éparpillées.** `ownerId`, `agentId`,
`landlordIds`, `propertyIds`, `tenantId` — chaque entité pointe vers d'autres
par des tableaux d'identifiants. Il n'y a **aucune notion d'organisation**.
C'est précisément le trou que la phase 1 doit combler.

**27 collections** vivent dans `buildInitialState()`. C'est le périmètre exact
à porter en base.

---

## Décision 1 — Le backend : Supabase

**Retenu : Supabase.** Motifs, par ordre d'importance :

| Besoin | Ce que Supabase apporte |
|---|---|
| Résidence des données (§2.3) | Régions `eu-west-3` (Paris) **et** `ca-central-1` (Montréal) |
| Isolation multi-tenant | RLS PostgreSQL, natif, au niveau du moteur |
| Authentification | Fournie, avec MFA et gestion de session |
| Médias (§2.3) | Storage avec politiques par bucket, même région que la base |
| Temps réel | Utile plus tard pour la messagerie et les notifications |
| Migration progressive | Client JS compatible avec `mutate()` sans réécrire les écrans |

**Alternative écartée : une API maison (Node/Fastify + Postgres).** Plus de
contrôle, mais il faudrait réécrire l'authentification, les politiques d'accès,
le stockage et la gestion des sessions — soit deux à trois mois de travail
avant la première ligne de valeur métier.

**Conséquence : deux projets Supabase distincts**, un par région, comme exigé
au §2.3. Même schéma, même code, deux instances. La sélection se fait à la
connexion, d'après le domaine ou le marché déclaré à l'inscription.

### Ce qui reste à trancher avec toi

Le plan gratuit de Supabase met les projets en pause après une semaine
d'inactivité et ne garantit pas la région. Pour un produit commercialisé, le
plan payant est nécessaire — sur **deux projets**. À budgéter dès maintenant.

---

## Décision 2 — RLS : le contrat d'isolation

### Le principe

Chaque table porte `org_id uuid not null`. Une fonction lit l'organisation
depuis le jeton, **jamais depuis le client** :

```sql
create function auth.current_org() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::json ->> 'org_id', '')::uuid
$$;
```

Politique type, appliquée à chaque table :

```sql
alter table properties enable row level security;

create policy org_isolation on properties
  using (org_id = auth.current_org())
  with check (org_id = auth.current_org());
```

Le `with check` est aussi important que le `using` : sans lui, un utilisateur
peut **écrire** une ligne dans une autre organisation, même s'il ne peut pas la
relire.

### Le piège, et la règle qui l'évite

La clé `service_role` **contourne toutes les politiques RLS**. C'est voulu — les
tâches d'administration en ont besoin — mais c'est le trou par lequel passent la
plupart des fuites inter-locataires.

**Règle à graver :**

1. La clé `service_role` ne quitte jamais le serveur. Jamais dans le frontend,
   jamais dans une variable `VITE_*` — tout ce qui commence par `VITE_` est
   compilé dans le bundle et lisible par n'importe qui.
2. Elle ne vit que dans un module unique, nommé explicitement
   `server/lib/admin-client.ts`, avec un commentaire d'avertissement en tête.
3. **Toute fonction qui l'utilise revérifie l'`org_id` à la main.** Le RLS ne
   protège plus, c'est au code de le faire.
4. Chaque appel via cette clé écrit une ligne d'audit.

### Le test qui prouve l'isolation

Sans ce test, on ne sait pas si l'isolation fonctionne — on l'espère.

```
Créer org A et org B, chacune avec un utilisateur et un logement.
Se connecter comme utilisateur A.
  → lire les logements : ne doit renvoyer que celui de A
  → lire le logement de B par son identifiant : doit renvoyer vide, pas 403
  → écrire un logement avec org_id = B : doit être refusé
Répéter en inversant A et B.
```

Le point important : une lecture interdite doit renvoyer **vide**, pas une
erreur. Une erreur 403 confirme l'existence de l'identifiant — c'est une fuite
d'information en soi.

---

## Décision 3 — Le « voir en tant que » du back-office

`AdminUsers.tsx` propose déjà cette fonction. En SaaS, c'est **la surface la
plus risquée du produit** : un employé de LocaHub accède aux données
personnelles des locataires d'un client.

### Encadrement retenu

| Exigence | Mise en œuvre |
|---|---|
| Motif obligatoire | Champ libre, minimum 20 caractères, enregistré |
| Durée limitée | 30 minutes, jeton expirant, non renouvelable sans nouveau motif |
| Lecture seule par défaut | L'écriture exige une seconde confirmation explicite |
| Trace inaltérable | Table `impersonation_log`, en `append-only`, hors RLS d'organisation |
| Transparence | L'organisation reçoit une notification, et la voit dans son propre journal |
| Périmètre | Jamais les pièces d'identité ni les justificatifs de ressources |

**Le dernier point est le plus important.** Le support n'a aucune raison
d'ouvrir la carte d'identité d'un candidat locataire. Les documents de catégorie
`id`, `income` et `tax` sont exclus de l'usurpation, sans exception.

Base légale : intérêt légitime (support contractuel), à inscrire au registre des
traitements, avec la durée de conservation du journal — 3 ans est un choix
raisonnable.

---

## Décision 4 — Les rôles : séparer gestionnaire et courtier

### Pourquoi c'est réglementaire et non cosmétique

En France, la loi Hoguet distingue deux habilitations : la **carte T**
(transaction) et la **carte G** (gestion immobilière). Au Québec, la gestion
locative pure n'exige aucun permis, tandis que le courtage exige un permis
**OACIQ**.

Le code porte déjà cette distinction dans les données (`licenceType`), mais
l'écrase dans `role: "agent"`.

### Rôles retenus

| Rôle | Périmètre | Habilitation requise |
|---|---|---|
| `super_admin` | Plateforme, toutes organisations | Employé LocaHub |
| `org_admin` | Une organisation, réglages, utilisateurs, facturation | — |
| `property_manager` | Gestion locative : baux, loyers, travaux, relances | Carte G (FR) |
| `broker` | Commercialisation : mandats, visites, candidatures, commissions | Carte T (FR) / OACIQ (QC) |
| `assistant` | Comme gestionnaire, sans finance ni juridique | — |
| `accountant` | Finances, factures, exports, en lecture seule sur le reste | — |
| `landlord` | Ses biens uniquement | — |
| `tenant` | Son bail uniquement | — |
| `provider` | Ses interventions uniquement | Licence RBQ (QC) / décennale (FR) |
| `auditor` | Lecture seule, journaux compris | — |

Les rôles se cumulent : `karim.benali` est `property_manager` **et** `broker`,
puisqu'il détient une carte T + G.

### La règle qui en découle

**Une fonctionnalité de courtage est refusée à un utilisateur sans habilitation
valide et non expirée.** Le champ `licenceExpiry` existe déjà — il devient
bloquant, pas décoratif. Un courtier dont le permis a expiré perd l'accès à la
publication d'annonces et à la gestion des mandats, tout en gardant la gestion
locative.

C'est exactement le genre de garde-fou qui justifie le positionnement produit :
*le logiciel qui refuse de te laisser commettre une infraction*.

---

## Décision 5 — Les prestataires multi-organisations

Un plombier travaille pour plusieurs agences. Il ne peut donc pas porter un
`org_id` unique.

### Modèle retenu : identité globale + adhésions

```
providers            (identité : nom, licence, assurance, métiers)  — PAS d'org_id
provider_memberships (provider_id, org_id, note, tarif, statut)     — une ligne par relation
jobs                 (org_id, provider_id, property_id, …)          — porte l'org_id
```

Trois règles :

**1. Le prestataire ne voit que les interventions qui lui sont assignées.**
Sa politique RLS ne passe pas par `org_id` mais par `provider_id = auth.uid()`.

**2. Il ne peut jamais énumérer les organisations.** Aucune requête ne lui
retourne la liste de ses donneurs d'ordre sous forme d'organisations — seulement
les interventions, avec le nom de l'agence en clair sur chacune.

**3. La notation reste privée à chaque organisation.** L'agence A ne voit pas la
note donnée par l'agence B. Une note partagée serait un fichier d'évaluation de
professionnels — avec les obligations d'information et de droit de réponse que
cela implique. À écarter pour l'instant.

---

## Décision 6 — Ordre de migration

### Pourquoi cet ordre et pas un autre

Il n'existe aujourd'hui **aucune authentification** et **un seul jeu de données
partagé**. On ne peut pas rétro-attribuer un `org_id` à des données qui
n'appartiennent à personne. L'authentification et les organisations viennent
donc en premier, nécessairement.

### Les six étapes

**Étape 1 — Socle, sans toucher à l'application.**
Deux projets Supabase. Schéma des tables `organizations`, `memberships`,
`profiles`. RLS activée. Le test d'isolation de la décision 2 doit passer avant
d'aller plus loin.

**Étape 2 — Authentification.**
Inscription, connexion, MFA. À l'inscription : création de l'organisation,
choix du pays, et **semis du jeu de démonstration** dans cette organisation.
L'application continue de fonctionner sur `localStorage` pendant ce temps.

**Étape 3 — Une tranche verticale : `ManagerTasks`.**
Tables `tasks` et `task_comments` en base, avec `org_id` et RLS. L'écran bascule
de `store.db.tasks` vers un appel réel. `mutate()` reçoit enfin sa fonction
`commit`.

**Pourquoi `ManagerTasks` :** l'écran fait lecture, création, modification,
transfert entre utilisateurs et commentaires. Il touche donc aux permissions
entre membres d'une même organisation. C'est le cas le plus représentatif du
produit, et il est petit.

**Étape 4 — Les collections structurantes.**
`properties`, `buildings`, `leases`, `payments`, dans cet ordre — chacune
dépendant de la précédente.

**Étape 5 — Les médias.**
`mediaDB` (IndexedDB) devient un cache local devant Supabase Storage.
`syncQueue` sert déjà exactement à ça : la file téléverse, puis purge le local.
**Rien à réécrire côté écrans.**

**Étape 6 — Le reste des 27 collections**, par ordre de dépendance.

### Ce qui rend la migration peu risquée

Le store expose déjà `mutate()`, avec instantané, identifiant temporaire et
retour arrière testé. `syncQueue` gère déjà le hors-ligne, l'ordre FIFO et le
backoff. `transport.ts` a déjà la forme d'un appel distant avec erreurs typées.

**Ces trois briques ont été écrites pour ce moment précis.** La bascule consiste
à fournir la fonction `commit` — pas à réécrire les écrans.

---

## Deux points à trancher avant l'étape 1

**La messagerie en double.** `Messages.tsx` lit `conversations`, `Inbox.tsx` lit
`threads`. Deux écrans, deux collections, même fonction.
**Proposition : supprimer `conversations` et `Messages.tsx`.** `threads` porte
les canaux, les pièces jointes et le rattachement au bien — c'est le modèle
complet.

**Les dossiers `pages/agent/` et `pages/manager/`.** Six écrans d'un côté, dix
de l'autre, tous sous les routes `/agent`.
**Proposition :** `pages/agent/` devient `pages/broker/` (mandats, visites,
pipeline, commissions), `pages/manager/` reste la gestion locative. Les routes
suivent. C'est le bon moment : les rôles sont en train d'être séparés.

---

## Critère de fin de phase 1

Un seul écran, `ManagerTasks`, fonctionnant de bout en bout :

- authentification réelle, jeton portant `org_id` ;
- données en PostgreSQL, RLS active ;
- **le test d'isolation de la décision 2 passe en intégration continue** ;
- la clé `service_role` est absente du bundle — vérifiable par un `grep` sur
  `dist/` ajouté à `scripts/` ;
- le mode hors ligne fonctionne toujours : couper le réseau, créer une tâche,
  rétablir, la tâche part.

**Un écran qui traverse toute la pile prouve l'architecture. Trente écrans
migrés à moitié ne prouvent rien.**

---

## Ce que je n'ai pas tranché, et qui t'appartient

1. **Le budget.** Deux projets Supabase payants, plus Stripe Connect à terme.
2. **Le pilote.** Le document juridique recommande de lancer la France d'abord,
   puis le Québec une fois le modèle validé. Cela signifie qu'un seul projet
   Supabase est nécessaire au départ. Je suis d'accord — mais le schéma doit
   être conçu pour deux dès maintenant.
3. **L'identité de l'éditeur.** SAS ou SASU à créer avant tout encaissement
   d'abonnement. Sans structure, pas de compte Stripe professionnel.
