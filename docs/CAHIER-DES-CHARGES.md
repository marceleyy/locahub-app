# LocaHub — Cahier des charges consolidé

> **À déposer dans `docs/` et à donner à Claude Code phase par phase.**
> Ne jamais lui donner ce document entier en une fois : il contient 7 phases
> dont certaines s'excluent mutuellement dans le temps.

Ce document reprend les 129 points du cahier « Projet Immo Sur » et leur
attribue un **statut réel**, mesuré sur le code du dépôt, pas déclaratif.

| Statut | Signification |
|---|---|
| **FAIT** | Existe et fonctionne. Ne pas réécrire. |
| **PARTIEL** | Existe mais incomplet ou non branché. À étendre. |
| **BLOQUÉ** | Impossible sans backend. Ne pas simuler. |
| **À FAIRE** | Rien n'existe. À construire. |
| **REFUSÉ** | À ne pas construire, pour raison juridique. Motif indiqué. |

---

## 1. État des lieux, sans complaisance

**Ce que LocaHub est aujourd'hui :** une application frontend seule. React 18,
Vite 6, TypeScript, Tailwind v4, primitives Radix/shadcn. 158 fichiers
versionnés, dont 137 sous `src/`.

**Aucun serveur. Aucune base de données. Aucune authentification.** Toutes les
données vivent dans le `localStorage` du navigateur (clé `locahub.db.v4`) et
les médias dans IndexedDB (base `locahub-media`).

C'est un prototype abouti — pas un SaaS. La distinction n'est pas rhétorique :

- un « multi-tenant » dont l'isolation repose sur du JavaScript côté navigateur
  n'est pas une isolation, c'est une décoration ;
- un « RBAC » sans serveur se contourne avec les outils de développement en dix
  secondes ;
- un « journal d'audit » dans le `localStorage` s'efface d'un clic.

**Conséquence : le point 1 du cahier, c'est de se doter d'un backend.** Tout le
reste en découle. Toute fonctionnalité de sécurité, de conformité ou de
multi-tenant construite avant lui devra être refaite.

### Ce qui existe déjà et qui est bon

| Brique | Fichier | Ce qu'elle apporte |
|---|---|---|
| Règles marché déclaratives | `config/markets.ts` | FR/QC : devise, unités, préavis, dépôt, diagnostics, encadrement, quittance, relance, renouvellement |
| Moteur financier | `lib/finance.ts` | VAN, TRI par bissection, amortissement, DSCR, scénarios 10 ans, score de performance explicable |
| Aide à la décision | `lib/assist.ts` | Priorisation de tâches, triage d'incidents, alertes de bail FR/QC, recommandation de loyer, anticipation des travaux, base juridique sourcée |
| Relances | `lib/dunning.ts` | Calendrier J+3/J+10/mise en demeure par marché, fenêtres de renouvellement |
| Documents PDF | `lib/pdf.ts`, `lib/documents.ts` | Générateur PDF sans dépendance, quittances, mises en demeure, avis de renouvellement |
| Transport | `lib/transport.ts` | Courriel/SMS/courrier/recommandé, avec préconditions et erreurs typées |
| File hors ligne | `lib/syncQueue.ts` | FIFO persistée, backoff exponentiel, arrêt au premier échec, pont média |
| Mutations optimistes | `store/optimistic.ts` | Instantané, identifiant temporaire, retour arrière vérifié |
| Médias lourds | `lib/mediaDB.tsx` | IndexedDB, hook de cycle de vie des URLs objet |
| État des lieux | `lib/inventory.ts` | Trame par marché, barème à 4 crans, résumé, mention juridique |
| Reconnaissance de pièces | `lib/scan.ts` | Classement, verdict, pièces autorisées/interdites par marché |
| i18n | `i18n/*` | 1 085 clés FR/EN à parité stricte |
| PWA | `public/sw.js` | Service worker manuel, trois stratégies de cache |
| Garde-fou de build | `scripts/check-names.cjs` | Bloque le build si un identifiant n'est pas résolu |

**Règle absolue : ne rien réécrire de cette liste sans raison documentée.**

---

## 2. Contraintes structurantes — non négociables

Ces règles priment sur toute demande fonctionnelle. Si une fonctionnalité les
contredit, c'est la fonctionnalité qui cède.

### 2.1 Ne jamais encaisser les loyers

Le cahier l'exige, et c'est ce qui sépare l'éditeur de logiciel de l'agent
immobilier soumis à la carte G (loi Hoguet, France) ou au permis OACIQ (Québec).

**Conséquence de schéma, à graver :** aucune table `wallet`, `balance`,
`solde`, `compte_sequestre` ou équivalent. Un paiement n'est qu'une **référence**
à un transfert Stripe Connect entre le locataire et le bailleur. Le jour où
quelqu'un ajoute un solde détenu, tu deviens intermédiaire financier sans t'en
apercevoir.

### 2.2 Ne jamais décider à la place d'un humain

Aucun score ne déclenche de rejet. Le drapeau `humanReviewed` est obligatoire
sur toute candidature. C'est l'article 22 du RGPD et l'article 12.1 de la loi 25.

**Déjà respecté dans le code :** `matchScore`, `performanceScore`,
`suggestProviders` et `prioritizeTask` exposent tous leurs facteurs et ne
rejettent jamais.

### 2.3 Résidence des données par marché

- **France** → hébergement Union européenne.
- **Québec** → hébergement Canada (loi 25, art. 17 : évaluation des facteurs
  relatifs à la vie privée avant toute communication hors Québec).

Ce n'est pas une colonne `market` dans une base mondiale : ce sont **deux
déploiements régionaux étanches**. Les buckets de médias suivent la même règle —
une photo d'intérieur de logement est une donnée personnelle.

**Contrainte produit à assumer et à écrire :** une organisation est
mono-région. Une agence française gérant aussi des lots à Montréal existera
deux fois, avec deux abonnements et sans vue consolidée.

### 2.4 Les règles juridiques sont des données, pas du code

`markets.ts` est aujourd'hui une constante compilée. En SaaS, chaque règle doit
porter : juridiction, source officielle, date de publication, date d'entrée en
vigueur, date de dernière vérification, version.

Sans cela, corriger un préavis impose un redéploiement — et surtout, **on ne
peut pas reconstituer quelle était la règle au moment où un bail a été signé**.
En contentieux, c'est rédhibitoire.

### 2.5 Les documents importés sont des données hostiles

Un PDF de bail peut contenir des instructions cachées visant l'IA. Tout contenu
importé est traité comme **donnée non fiable**, jamais comme instruction
système.

### 2.6 Jamais de critère discriminatoire, direct ou indirect

Interdits comme variables de score ou de sélection : origine, religion, santé,
handicap, orientation sexuelle, opinions politiques, appartenance syndicale,
situation de famille, condition sociale.

**Vigilance sur les proxys.** Le code postal, le type de contrat de travail ou
le mode de versement des revenus peuvent reproduire indirectement une
caractéristique protégée. Toute variable ajoutée à un score doit passer ce test.

Au Québec, l'article 10 de la Charte couvre la **condition sociale** — ce qui
inclut le fait de percevoir l'aide sociale. En France, le décret 2015-1437
énumère limitativement les pièces exigibles.

---

## 3. Phase 1 — Fondations

> **Rien d'autre ne doit être construit avant la fin de cette phase.**

| Point du cahier | Sujet | Statut |
|---|---|---|
| 56, 125 | Architecture en couches, services séparés | À FAIRE |
| 23 | Multi-tenant, isolation par organisation | BLOQUÉ → à faire ici |
| 24 | RBAC, 9 rôles, permissions fines | BLOQUÉ → à faire ici |
| 25 | Journal d'audit | PARTIEL — `log()` existe dans le store, non persistant |
| 22 | Chiffrement, MFA, sessions, rate limiting, CSRF, XSS | BLOQUÉ |
| 31 | API versionnée, pagination, filtres, webhooks, OpenAPI | À FAIRE |
| 42, 43 | Jurisdiction Engine, versionnage des règles | PARTIEL — `markets.ts` déclaratif mais compilé |
| 48, 127 | Tests unitaires, intégration, E2E, permissions, multi-tenant | À FAIRE |
| 49 | Checklist de sécurité avant déploiement | À FAIRE |
| 39, 126 | Performance, pagination, indexation, files, workers | PARTIEL — `syncQueue` existe |

### Décisions à prendre avant de coder

**Le backend.** Supabase est le candidat évident : PostgreSQL, authentification,
RLS pour l'isolation, stockage de fichiers, et régions UE **et** Canada — ce qui
règle le point 2.3 d'un coup.

**Le piège de RLS.** La clé `service_role` contourne toutes les politiques.
Règle : elle ne vit que dans un module étroit et audité, jamais dans un
gestionnaire de requêtes généraliste. Chaque fonction qui l'utilise revérifie
l'`org_id` à la main.

**Le « voir en tant que » du back-office** existe déjà dans `AdminUsers`. C'est
la surface la plus risquée du produit. Il lui faut : un motif saisi, une durée
limitée, une trace, et une notification à l'organisation concernée.

**Les rôles.** Séparer `property_manager` (gestionnaire) de `broker`
(courtier/agent commercial) : ce n'est pas cosmétique, c'est réglementaire —
carte G contre carte T en France, permis OACIQ au Québec. Le code les confond
aujourd'hui sous `role: "agent"`.

**Les prestataires sont multi-organisations.** Un plombier travaille pour
plusieurs agences. Modèle : identité globale + adhésions par organisation.
Le prestataire ne doit **jamais** pouvoir énumérer les organisations.

**Ordre de migration.** Il n'y a aujourd'hui aucune authentification et un seul
jeu de données partagé. On ne peut pas rétro-attribuer un `org_id` à des données
qui n'appartiennent à personne. Donc : **authentification et organisations
d'abord, données ensuite.** Le jeu de démonstration devient une organisation
« démo » semée à l'inscription.

### Critère de fin de phase

Un écran migré de bout en bout — je recommande `ManagerTasks`, simple et
représentatif — avec authentification réelle, `org_id` en base, RLS active, et
un test automatisé prouvant que l'organisation A ne voit jamais les données de
l'organisation B.

**Un écran qui traverse toute la pile prouve l'architecture. Trente écrans
migrés à moitié ne prouvent rien.**

---

## 4. Phase 2 — Cœur métier

| Point | Sujet | Statut |
|---|---|---|
| — | Immeubles, lots, dossier à 5 volets | **FAIT** — `ManagerBuildings.tsx` |
| — | Propriétaires, locataires | **FAIT** — écrans migrés sur le store |
| 16 | Baux : création, dates, loyer, charges, dépôt, échéances | PARTIEL — lecture faite, création à construire |
| 16 | Alertes bail : expiration, renouvellement, indexation | **FAIT** — `leaseAlerts()` |
| — | Paiements, quittances | **FAIT** — `ManagerArrears`, `lib/documents.ts` |
| 18 | Documents : classement, tags, recherche, version, expiration | PARTIEL — capture faite, gestion documentaire à construire |
| 83, 84 | Moteur de tâches, dépendances | PARTIEL — tâches faites, **dépendances à construire** |
| 14 | Interventions : ticket → devis → validation → facture | PARTIEL — `InterventionForm`, `ProviderJobs` ; statuts à étendre |
| 15 | Fournisseurs : fiche, historique, analyses | **FAIT** — `ManagerProviders`, à enrichir d'analyses |
| 32, 33, 70 | Import/export, portabilité, assistant de migration | À FAIRE |

### À trancher avant de figer le schéma

**Deux systèmes de messagerie coexistent.** `conversations` (ancien) et
`threads` (nouveau, avec canaux, pièces jointes et rattachement au bien).
**Décision : supprimer `conversations`, garder `threads`.**

**Le vocabulaire « agent » contre « gestionnaire ».** Les routes sont sous
`/agent`, les libellés disent « gestionnaire ». À harmoniser au moment où les
rôles seront séparés.

---

## 5. Phase 3 — Intelligence

| Point | Sujet | Statut |
|---|---|---|
| 3 | Dashboard intelligent, section « LOCaHUB recommande » | PARTIEL — tableaux de bord existent, recommandations à construire |
| 4 | Page « Ma journée » | À FAIRE — mais `sortByPriority()` fait déjà le calcul |
| 5 | Module impayés avancé, statuts, promesses de paiement | PARTIEL — relances faites, échéanciers et statuts à étendre |
| 6 | Risk Engine explicable | PARTIEL — `performanceScore()` est déjà un score explicable à 6 facteurs |
| 26, 27 | Analytics, KPI, rentabilité | **FAIT** — `lib/finance.ts`, `ManagerFinance`, `LandlordAnalytics` |
| 28 | Simulateur d'investissement | PARTIEL — `runScenario()` et `whatIf()` existent, écran dédié à construire |
| 29 | Détection d'anomalies | PARTIEL — `compareInvoices()` détecte écarts et doublons |
| 62 | Benchmarking interne | À FAIRE |
| 63, 107 | Prévisions, niveau de confiance, moteur d'apprentissage | À FAIRE |
| 64, 67 | Explicabilité, centre « Explique-moi » | PARTIEL — les scores exposent déjà leurs facteurs |
| 101 | Priorité opérationnelle multi-critères | **FAIT** — `prioritizeTask()` |
| 114 | Project Health Score | À FAIRE |

**Point de vigilance sur le point 6.** Le Risk Engine porte sur des personnes.
Relire la contrainte 2.6 avant d'ajouter la moindre variable. Le score sert à
**prioriser du travail**, jamais à décider d'un accès au logement — et l'écran
doit le dire, comme le demande le cahier.

---

## 6. Phase 4 — Automatisation

| Point | Sujet | Statut |
|---|---|---|
| 9, 116 | Moteur de règles SI → ALORS → validation | À FAIRE |
| 10 | Boîte de communication centralisée, timeline | PARTIEL — `Inbox.tsx` existe |
| 11 | Générateur de communications, plusieurs tons | PARTIEL — `buildDunningBody()` génère 3 tons |
| 36, 104 | Notifications groupées, résumé quotidien | À FAIRE |
| 47, 115 | Préparer → Vérifier → Confirmer → Exécuter | **FAIT** — `ConfirmSheet`, blocage hors fenêtre de renouvellement |
| 90, 111 | Moteur d'approbation, expérience propriétaire | À FAIRE |
| 109 | Projets récurrents | À FAIRE |

**Interdit absolu :** aucune mise en demeure, aucun congé, aucune procédure
juridique ne part automatiquement. Le code respecte déjà cette règle — la
relance de niveau juridique exige une validation et avertit si le canal choisi
n'est pas le recommandé.

---

## 7. Phase 5 — IA

| Point | Sujet | Statut |
|---|---|---|
| 7, 8 | LOCaHUB AI, copilote gestionnaire | À FAIRE |
| 35 | Recherche globale et naturelle | À FAIRE |
| 17 | Analyse documentaire, OCR | PARTIEL — `lib/scan.ts` simule ; OCR réel à brancher |
| 44 | Récupération ciblée, permissions, minimisation | À FAIRE |
| 45 | Protection contre l'injection de prompt | À FAIRE |
| 46 | Politique anti-hallucination | À FAIRE |
| 60, 96 | Voix, voice-to-project | PARTIEL — `DictationInput` fait la dictée |
| 103 | AI Project Manager | À FAIRE |

### Règles de conception de la couche IA

**Ne jamais envoyer tout le portefeuille à un modèle.** Récupération ciblée,
filtrée par les permissions de l'utilisateur qui pose la question. Un locataire
qui demande « donne-moi les informations sur les autres locataires » doit
obtenir un refus, pas une réponse filtrée après coup.

**L'IA cite ses sources ou dit qu'elle ne sait pas.** Jamais de chiffre, de
date, de nom ou de règle inventés. La formulation de repli est prévue par le
cahier : « Je ne dispose pas de suffisamment d'informations pour répondre de
manière fiable. »

**L'OCR n'est jamais juridiquement certain.** Mention obligatoire : « Données
extraites automatiquement — vérification humaine recommandée. » `lib/scan.ts`
respecte déjà ce principe : il classe, il n'affirme pas.

---

## 8. Phase 6 — Conformité

| Point | Sujet | Statut |
|---|---|---|
| 19, 52 | Privacy Center, registre des traitements, tableau de bord | À FAIRE |
| 20 | Loi 25, PIPEDA, adaptation par province | PARTIEL — `markets.ts` couvre FR/QC |
| 21 | Compliance Engine avec sources et dates | PARTIEL — `LEGAL_KB` dans `assist.ts`, 8 fiches sourcées |
| 51 | Tableau de conformité documentaire | À FAIRE |
| 53 | Data Retention Engine | À FAIRE |
| 54 | Centre d'incidents | À FAIRE |
| 65 | Zéro dark pattern | **FAIT** — vérifier à chaque écran |
| 66 | Privacy by default | À FAIRE |
| 40 | Accessibilité WCAG | PARTIEL — `aria-label`, cibles 44 px, contrastes, `prefers-reduced-motion` |
| 41 | Internationalisation FR-FR, FR-CA, EN-CA | PARTIEL — FR/EN faits, variantes régionales à ajouter |

**Ne jamais écrire que le produit est « 100 % conforme ».** Sans audit
juridique et technique indépendant, cette affirmation est fausse et engage ta
responsabilité. Le Compliance Engine porte en permanence : « Information
générale — ne constitue pas un avis juridique. »

**Ne jamais supposer que le consentement est la base légale.** L'exécution du
contrat, l'obligation légale et l'intérêt légitime couvrent la majorité des
traitements en gestion locative. Un consentement mal choisi est retirable à tout
moment — ce qui rendrait la gestion du bail impossible.

---

## 9. Phase 7 — Écosystème

| Point | Sujet | Statut |
|---|---|---|
| 12 | Portail locataire | **FAIT** — espace `/tenant` complet |
| 13 | Portail propriétaire | **FAIT** — espace `/landlord` complet |
| 92 | Espace fournisseur limité | **FAIT** — espace `/provider` |
| 5 (PDF juridique) | Stripe Connect, flux direct | BLOQUÉ — voir contrainte 2.1 |
| 37 | Centre de contrôle administrateur | PARTIEL — `/admin` existe |
| 38 | Facturation SaaS, plans | À FAIRE |
| 61 | Rapports PDF professionnels | PARTIEL — `lib/pdf.ts` génère déjà des PDF valides |
| 69 | Onboarding en 10 étapes | À FAIRE |
| 30 | Smart Property, IoT | À FAIRE — architecture seulement |

---

## 10. Module LOCaHUB PROJECTS (points 76 à 129)

C'est le plus gros ajout du cahier, et il est **en grande partie déjà amorcé** :
`ManagerTasks` gère les tâches, les priorités, les transferts et les
commentaires ; `ManagerCalendar` gère l'agenda ; `ManagerBuildings` gère le
dossier immeuble.

Ce qui manque pour passer de « gestionnaire de tâches » à « moteur de projets » :

| Point | Sujet | Statut |
|---|---|---|
| 78 | Property Command Center | À FAIRE |
| 79, 108 | Modèles de projets immobiliers | À FAIRE |
| 80 | Smart Project Creator | À FAIRE |
| 81, 82 | Blueprint et phases | À FAIRE |
| 84, 85 | Dépendances et impact du retard | À FAIRE — **le cœur de la valeur** |
| 86, 112 | Property Impact Engine | PARTIEL — `finance.ts` a les formules |
| 87, 88 | Budget Engine, budget contre réalité | À FAIRE |
| 89 | Change Requests | À FAIRE |
| 94 | Photo timeline avant/pendant/après | PARTIEL — `mediaDB` stocke déjà les médias |
| 95 | Mode inspection | **FAIT** — `InventoryFlow.tsx` |
| 97, 98, 99 | Timeline, Gantt immobilier, calendrier global | PARTIEL |
| 100 | Workload Intelligence | À FAIRE |
| 102 | Project Risk Center | À FAIRE |
| 105, 106 | Revue hebdomadaire, post-mortem | À FAIRE |
| 113 | Carte des projets du portefeuille | À FAIRE |

**Ce qui différencie vraiment ce module, c'est le point 85.** Ne pas afficher
« tâche en retard de 4 jours », mais : « ce retard repousse la peinture, le
nettoyage, les photos, la publication et les visites — vacance supplémentaire
estimée à 4 jours, perte locative estimée à 520 € ». Les formules existent déjà
dans `finance.ts`. Il manque le graphe de dépendances.

**Toujours marquer les estimations comme telles.** « Perte locative estimée »,
jamais « perte locative ».

---

## 11. Ce qu'il faut refuser de construire

| Demande | Motif |
|---|---|
| Liste de mauvais payeurs, blacklist de locataires | Illégal en France comme au Québec |
| Rejet automatique d'une candidature | RGPD art. 22, loi 25 art. 12.1 |
| Séquestre ou solde de loyers | Loi Hoguet — voir contrainte 2.1 |
| Affichage des coordonnées d'un ancien locataire | Relais anonyme avec consentement révocable, ou rien |
| Avis en texte libre sur des personnes | Grilles de critères objectifs portant sur le logement |
| Expulsion, congé ou mise en demeure automatiques | Décision de justice requise ; validation humaine obligatoire |
| Conservation indéfinie de données personnelles | Durées par finalité, purge automatique |
| Géolocalisation continue du gestionnaire | Uniquement ponctuelle, motivée et consentie |

---

## 12. Règle de développement

Avant toute modification :

1. inspecter l'existant ;
2. identifier ce qui manque et les dépendances ;
3. proposer l'architecture ;
4. implémenter ;
5. tester, y compris l'isolation multi-tenant ;
6. vérifier sécurité, conformité, accessibilité, performance.

**Ne pas supprimer de code fonctionnel. Ne pas casser les routes existantes.
Ne pas modifier le schéma sans migration. Ne pas modifier une API sans
compatibilité ascendante.**

Une fonctionnalité n'est terminée que lorsque : UX finie, responsive,
permissions posées, API sécurisée, tests écrits, audit branché, erreurs gérées,
accessibilité vérifiée, multi-tenant vérifié, documentation à jour.

---

## 13. Critère de réussite

> « Pourquoi un gestionnaire choisirait-il LocaHub plutôt qu'un logiciel
> traditionnel ? »

La réponse doit tenir en une phrase, et elle est déjà à moitié vraie
aujourd'hui :

**LocaHub est le seul logiciel de gestion locative qui refuse de publier une
annonce illégale, qui montre au locataire ce que payait l'occupant précédent, et
qui explique chacun de ses calculs.**

Le reste — automatisation, priorisation, prévision — se construit sur cette
promesse. Sans elle, ce n'est qu'un logiciel de plus.
