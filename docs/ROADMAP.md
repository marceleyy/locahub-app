# Feuille de route

## Fait

### Socle
- Quatre espaces (locataire, propriétaire, gestionnaire, back-office) avec
  navigation dédiée et coquille applicative commune.
- Bilingue FR/EN, deux marchés FR/QC, bascule à chaud sur les deux axes.
- Configuration marché centralisée : devise, unités, régulateurs, documents
  obligatoires, dépôt, préavis, indexation, énergie, encadrement des loyers.
- Store unique persistant, mutations à signature d'API, journal d'audit.
- Kit UI conforme à la baseline fournie (pas de dégradés, `aria-label` sur les
  boutons à icône, `tabular-nums`, `text-balance` / `text-pretty`, `size-*`).

### Exploitation
- Planificateur de tâches priorisées avec motifs affichés, transfert entre
  collègues avec acceptation ou refus, fil de commentaires daté.
- Agenda mensuel, créneaux proposés à valider, alertes de bail convertibles en
  tâches.
- Dossier immeuble à cinq volets : financier, technique, locataire, juridique,
  prévisionnel.
- Répertoire de prestataires : notation, ponctualité, assurance ou licence avec
  échéance, historique et suivi des factures.
- Diffusion multi-portails avec blocage sur anomalie bloquante.
- Assistant juridique : huit fiches sourcées, filtrées par marché.

### Finance
- Rendement brut et net, résultat d'exploitation, cash-flow, DSCR.
- Échéancier de prêt agrégé par année.
- TRI par bissection, VAN actualisée, trois scénarios sur dix ans avec revente.
- Simulateur « et si » convertissant les points de pourcentage en euros ou en
  dollars annuels.
- Comparateur de factures : écart à la médiane de catégorie, doublons probables.
- Note de performance à six facteurs, tous explicités.

### Location
- Carte des logements disponibles avec filtres complets et favoris.
- Candidature en couple ou en colocation avec rattachement des profils et
  cumul des revenus.
- Fiche d'intervention : photos, qualification automatique, délai cible, conseil
  immédiat, prestataires classés avec détail du classement.

## Dette assumée

**Neuf écrans hérités de la maquette** restent en français en dur et lisent
`src/app/data/mockData.ts` au lieu du store : `TenantProfile`,
`TenantApplications`, `TenantPayments`, `TenantLease`, `LandlordDashboard`,
`LandlordProperties`, `LandlordTenants`, `LandlordAnalytics`,
`LandlordFinances`. Ils fonctionnent, mais ne réagissent ni au changement de
langue ni au changement de marché. C'est le premier chantier à reprendre.

**Vocabulaire.** Les routes de l'espace gestionnaire restent sous `/agent` alors
que les libellés disent « gestionnaire ». Renommer les routes est possible mais
casserait les liens éventuellement partagés.

## Suite

### Vague suivante
- Messagerie rattachée à l'adresse courriel du gestionnaire, avec envoi de
  vidéos et de documents.
- Quittances PDF générées automatiquement, relances d'impayés programmées.
- Renouvellement de bail en un clic, paramétrable dès la signature (rappel dans
  X mois, X années).
- Comparateur d'immeubles côte à côte.
- Espace prestataire dédié, avec acceptation des interventions et dépôt de
  facture.
- Contact des anciens locataires côté visiteur, avec modération.

### Passage en production
- Remplacer les mutations du store par des appels API, une par une.
- Paiement en ligne : Stripe Connect ou Mangopay en France, respect de la règle
  H1 de Paiements Canada et déclaration FINTRAC au Québec.
- Signature électronique conforme eIDAS (France) et LCCJTI (Québec).
- Hébergement des données de santé exclu ; hébergement des données
  personnelles en Union européenne pour le marché français.
- Accessibilité : audit RGAA et European Accessibility Act.
- Loi 96 sur la langue française pour toute activité au Québec : le français
  doit primer, y compris dans les communications contractuelles.

## Positionnement

Le produit ne cherche pas à être le logiciel de gestion le plus complet. Il
cherche à être **le seul qui refuse de publier une annonce illégale et qui
montre au locataire ce que payait l'occupant précédent**.

Deux conséquences de conception, jamais négociables :

1. Aucun score ne déclenche de décision automatique. Chaque score affiche ses
   facteurs et leur poids. C'est ce qu'imposent l'article 22 du RGPD et
   l'article 12.1 de la loi 25 québécoise.
2. L'assistant propose, l'humain valide. Priorisation, créneaux, prestataires,
   loyer recommandé : tout est révisable, rien n'est appliqué sans un clic.
