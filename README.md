# LocaHub

Plateforme de gestion locative pour la **France** et le **Québec**, bilingue
français / anglais, avec quatre espaces : locataire, propriétaire, gestionnaire
et back-office.

## Démarrer

```bash
npm install
npm run dev
```

Puis ouvrez `http://localhost:5173`.

Sous Windows, si PowerShell refuse d'exécuter `npm` (« exécution de scripts
désactivée »), utilisez `npm.cmd install` puis `npm.cmd run dev`, ou ouvrez une
fenêtre `cmd` au lieu de PowerShell.

Ouvrir `index.html` directement dans le navigateur ne fonctionne pas : c'est un
projet Vite, les modules doivent être servis par le serveur de développement.

## Les quatre espaces

| Espace | URL | Pour qui |
|---|---|---|
| Locataire / visiteur | `/tenant` | Chercher, candidater, payer, signaler |
| Propriétaire | `/landlord` | Suivre ses biens, ses revenus, ses locataires |
| Gestionnaire | `/agent` | Piloter un portefeuille pour le compte de tiers |
| Back-office | `/admin` | Comptes, conformité, journal d'audit, réglages |

Le sélecteur de **marché** (France / Québec) et celui de **langue** sont dans
l'en-tête. Changer de marché recalcule les règles juridiques, les devises, les
unités de surface, les documents obligatoires et les portails de diffusion.

## Ce que couvre l'application

**Exploitation** — planificateur de tâches priorisées, agenda avec créneaux
proposés, dossier immeuble à cinq volets, répertoire de prestataires, diffusion
multi-portails, assistant juridique sourcé.

**Finance** — cash-flow, rendements, DSCR, échéancier de prêt, TRI, VAN,
scénarios de revente sur dix ans, simulateur en points de pourcentage,
comparateur de factures avec détection d'incohérences.

**Location** — carte des logements, filtres détaillés, candidature en couple ou
en colocation, fiches d'intervention avec qualification automatique et
proposition de prestataire.

Le détail écran par écran est dans [`docs/MODULES.md`](docs/MODULES.md).

## Architecture

```
src/app/
  config/markets.ts       Règles France / Québec (le point d'entrée à modifier)
  i18n/                   Dictionnaires FR/EN et provider
  data/seed.ts            Jeu de démonstration locatif
  data/seedOps.ts         Jeu de démonstration exploitation
  lib/finance.ts          VAN, TRI, amortissement, scénarios, score
  lib/assist.ts           Priorisation, triage, alertes, juridique
  store/AppStore.tsx      Source de données unique + mutations
  components/             Kit UI, coquille applicative, layouts
  pages/                  Écrans par espace
  routes.tsx              Table de routage
```

Le store persiste dans `localStorage` sous la clé `locahub.db.v4` et fusionne
défensivement avec le jeu de démonstration : ajouter une collection ne casse pas
une sauvegarde existante. Un bouton « réinitialiser la démo » est dans les
réglages du back-office.

## Ajouter une langue

1. Ajouter le code dans `LOCALES` (`src/app/i18n/dictionary.ts`).
2. Ajouter l'objet de traductions dans `dictionary` et `dictionaryOps.ts`.
3. Renseigner `intlLocale` pour chaque marché dans `config/markets.ts`.

## Ajouter un marché

1. Ajouter une entrée dans `MARKETS` (`src/app/config/markets.ts`) : devise,
   unités, régulateurs, documents obligatoires, règles de dépôt et de préavis.
2. Ajouter le code dans `MARKET_LIST`.
3. Compléter `LEGAL_KB` dans `lib/assist.ts` et la table des portails dans
   `data/seedOps.ts`.

Aucun autre fichier n'a besoin d'être touché : les écrans lisent tous la config.

## Documentation

- [`docs/MODULES.md`](docs/MODULES.md) — guide des modules, marché par marché
- [`docs/LEGAL_FR_CA.md`](docs/LEGAL_FR_CA.md) — analyse juridique détaillée
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — état d'avancement et suite

## Statut

Prototype fonctionnel avec données de démonstration. Aucun appel réseau, aucun
paiement réel, aucune donnée personnelle transmise. Les mutations du store ont
la signature d'appels API et sont conçues pour être remplacées une à une.
