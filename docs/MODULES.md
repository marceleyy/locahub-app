# Guide des modules

Ce document décrit ce que fait chaque écran, où le trouver, et ce qui change
selon le marché sélectionné. Le sélecteur de marché est dans l'en-tête, à côté
du sélecteur de langue : **tout l'écran se recalcule** quand vous en changez.

---

## 1. Espace gestionnaire — `/agent`

C'est l'espace le plus fourni. Il correspond à ce que le cahier des charges
appelle « gestionnaire ». Les URL restent sous `/agent` pour ne pas casser les
liens existants ; les libellés affichés disent « gestionnaire ».

### 1.1 Planificateur — `/agent/tasks`

Toutes les tâches de tous les immeubles, classées de la plus urgente à la moins
urgente. Le score va de 0 à 100 et **affiche toujours ses motifs** sous la tâche.

Quatre leviers entrent dans le calcul :

| Levier | Poids maximum | Déclencheur |
|---|---|---|
| Échéance | 45 pts | Retard, puis moins de 3 j, 14 j, 45 j |
| Obligation légale | 30 pts | Case « obligation légale » cochée |
| Blocage locatif | 20 pts | La tâche empêche de mettre en location |
| Impact occupant | 18 pts | Fort / moyen |
| Enjeu financier | 12 pts | Au-delà de 5 000 € ou $ |

**Transfert entre collègues.** Vous proposez la tâche ; elle apparaît dans un
bandeau en haut de l'écran du collègue, qui accepte ou refuse. Tant qu'il n'a
pas accepté, la tâche reste sous votre responsabilité — c'est ce qui évite les
tâches orphelines.

**Commentaires.** Chaque tâche a un fil daté et attribué.

### 1.2 Agenda — `/agent/calendar`

Grille mensuelle, liste des rendez-vous à venir, et deux colonnes d'aide :

- **Créneaux proposés** — calculés à partir des tâches non planifiées et de vos
  disponibilités réelles, en évitant les week-ends et les heures déjà prises.
  Vous acceptez (le rendez-vous est créé et la tâche est planifiée) ou vous
  refusez. Rien n'est jamais inscrit sans votre accord.
- **Alertes de bail** — voir §1.7. Chaque alerte se convertit en tâche d'un clic.

### 1.3 Immeubles — `/agent/buildings`

Liste des immeubles, puis pour chacun un **dossier à cinq onglets** :

**Financier** — loyers bruts, résultat d'exploitation, rendement net, cash-flow
après dette, DSCR par logement, échéancier de prêt année par année, factures
rattachées avec distinction récupérable / non récupérable.

**Technique** — identité de l'immeuble, puis une barre par équipement indiquant
la part de durée de vie consommée (chaudière 18 ans, toiture 40 ans, façade
15 ans, menuiseries 30 ans, électricité 35 ans, ascenseur 25 ans, colonnes
45 ans). Au-delà de 85 %, la barre passe au rouge. Travaux réalisés et
historique des interventions en dessous.

**Locataire** — occupant, échéance du bail, impayés, six derniers paiements.

**Juridique** — assurance de l'immeuble, anomalies de conformité par logement,
et la liste des documents obligatoires **du marché sélectionné**, chacun avec sa
date ou la mention « manquant ».

**Prévisionnel** — note de performance, travaux à anticiper, loyer recommandé,
et trois scénarios sur dix ans.

### 1.4 Note de performance

Six facteurs pondérés, tous affichés avec leur poids :

| Facteur | Poids |
|---|---|
| Rentabilité nette | 30 % |
| Taux d'occupation | 20 % |
| Maîtrise des impayés | 15 % |
| Satisfaction locataire | 15 % |
| Délai d'intervention | 10 % |
| Performance énergétique | 10 % |

Note A partir de 82, B à 68, C à 54, D à 40, E en dessous.

### 1.5 Prestataires — `/agent/providers`

Fiche par intervenant : coordonnées, métiers couverts, note sur 5, taux de
respect des délais, nombre d'interventions, taux horaire, assurance ou licence
avec sa date de validité, disponibilités, notes internes, et l'historique
complet des factures avec leur statut payé / à payer. Un bandeau signale les
assurances qui expirent dans moins de 90 jours.

### 1.6 Financement — `/agent/finance`

Trois onglets, avec un sélecteur **par jour / par mois / par an** en haut.

- **Vue d'ensemble** : rentabilité par logement, taux d'occupation, taux
  d'impayés, coût de maintenance, et un encart sur la ventilation fiscale.
- **Leviers** : le simulateur « et si ». Il convertit un point de pourcentage en
  montant annuel — « gagner 2 points d'occupation représenterait +18 600 $/an ».
- **Factures** : le comparateur. Il signale les montants qui dépassent de 60 % ou
  plus la médiane de leur catégorie, et les doublons probables (même prestataire,
  même montant, moins de 10 jours d'écart).

Scénarios de revente dans l'onglet **Prévisionnel** du dossier immeuble :

| Hypothèse | Pessimiste | Réaliste | Optimiste |
|---|---|---|---|
| Indexation des loyers | 0,5 % | 2,0 % | 3,5 % |
| Dérive des charges | 3,5 % | 2,5 % | 2,0 % |
| Revalorisation du bien | −0,5 % | 2,0 % | 4,0 % |
| Vacance additionnelle | +6 pts | 0 | −2 pts |
| Frais de revente | 8 % | 7 % | 6 % |

Chaque scénario produit le cash-flow cumulé, le produit net de revente, le TRI
et la VAN actualisée à 5 %.

### 1.7 Alertes de bail

C'est le module où la logique diverge le plus entre les deux marchés.

**France** — la date limite de congé bailleur est calculée à 6 mois de
l'échéance pour un bail vide, 3 mois pour un meublé. Une seconde alerte suit la
révision annuelle du loyer : elle se prescrit un an après la date convenue, et
elle est purement et simplement interdite si le logement est classé F ou G.

**Québec** — la fenêtre d'avis de modification s'ouvre 6 mois avant l'échéance
et se ferme 3 mois avant. L'alerte affiche les deux bornes. Passé la date de
fermeture, le bail se reconduit aux mêmes conditions : c'est irréversible, d'où
la sévérité « critique » dans les 30 derniers jours.

### 1.8 Assistant juridique — `/agent/legal`

Base de huit fiches consultables, filtrées par marché, chacune avec sa réponse
en français et en anglais, ses **liens officiels de vérification** (Légifrance,
service-public.fr, Code civil du Québec, TAL, CDPDJ, CNIL, CAI) et une mise en
garde. Un bandeau rappelle en permanence qu'il s'agit d'information et non de
conseil juridique.

### 1.9 Diffusion — `/agent/publishing`

Publication et retrait sur plusieurs portails en un clic. Portails France :
SeLoger, Leboncoin, PAP, Bien'ici. Portails Québec : Centris, Kijiji, LesPAC,
Marketplace. Suivi des vues, des contacts et du coût par contact.

**La publication est bloquée** tant qu'une anomalie bloquante subsiste sur le
logement — un logement classé G en France, par exemple. Le bouton est désactivé
et l'anomalie est nommée. C'est le cœur du positionnement produit.

---

## 2. Espace locataire / visiteur — `/tenant`

### 2.1 Carte — `/tenant/map`

Vue cartographique schématique (projection des coordonnées réelles, sans appel
à un fournisseur de tuiles externe). Filtres : type de logement du studio au T5
et plus, budget maximum charges comprises, secteur, meublé ou non, extérieur,
ascenseur. Tri par compatibilité, prix ou surface. Favoris. Chaque logement
affiche son score de compatibilité avec le dossier du candidat.

### 2.2 Candidature groupée

Depuis la carte, le bouton « Candidater » ouvre un formulaire qui demande
d'abord si vous candidatez seul ou à plusieurs. En mode groupé, vous rattachez
les profils des co-candidats déjà inscrits ou vous les invitez par courriel :
ils rattachent leur dossier sans le ressaisir. Les revenus se cumulent et le
rapport revenus / loyer se recalcule en direct.

Un encart rappelle deux choses au candidat : le fameux seuil des trois fois le
loyer n'a aucune valeur légale, et un refus ne peut pas reposer uniquement sur
un traitement automatisé.

### 2.3 Fiche d'intervention — `/tenant/report`

Le locataire décrit son problème et joint des photos. La qualification se fait
en direct pendant la saisie :

- **Priorité** — urgent, élevé, normal, faible.
- **Corps de métier** — dix règles couvrant plomberie, gaz, électricité,
  chauffage, serrurerie, humidité, nuisibles, ascenseur, voisinage, entretien.
- **Délai cible** — de 1 h pour une odeur de gaz à 336 h pour de l'esthétique.
- **Conseil immédiat** — ce qu'il faut faire tout de suite, avec la conséquence
  juridique quand il y en a une.
- **Prestataires proposés** — classés par note, ponctualité, expérience et tarif,
  avec le détail du classement dépliable.

La mention « l'assistant propose, le gestionnaire valide » est affichée sous la
qualification. Aucune intervention n'est déclenchée automatiquement.

---

## 3. Ce qui change entre France et Québec

| Sujet | France | Québec |
|---|---|---|
| Dépôt de garantie | 1 mois nu, 2 mois meublé | **Interdit** (art. 1904 C.c.Q.) |
| Loyer précédent | Mention en zone tendue | **Section G obligatoire** au bail |
| Formulaire de bail | Libre, mentions obligatoires | Formulaire du TAL **obligatoire** |
| Préavis bailleur | 6 mois nu / 3 mois meublé | Avis de modification 3 à 6 mois |
| Indexation | IRL, prescription à un an | Fixation par le TAL en cas de litige |
| Diagnostics | DPE, ERP, CREP, amiante, élec, gaz, Boutin | Annexes du bail, sections F et G |
| Énergie | G interdit depuis 2025, F en 2028, E en 2034 | ÉnerGuide volontaire |
| Encadrement des loyers | Zones tendues, loyer de référence majoré | Pas d'encadrement, arbitrage TAL |
| Données personnelles | RGPD, CNIL, décret 2015-1437 | Loi 25, CAI, NAS et permis interdits |
| Pièces interdites | RIB, relevés, casier, dossier médical | NAS, permis de conduire, frais d'étude |
| Régulateur professionnel | Carte professionnelle (loi Hoguet) | Permis OACIQ |
| Fiscalité locative | Formulaire 2044 / 2042-C-PRO | T776 fédéral + déclaration du Québec |
| Unité de surface | m² | pi² |
| Taxes | Taxe foncière, TEOM | Taxes municipales et scolaires |

Le détail complet, avec les références de textes et les sanctions encourues, est
dans `LEGAL_FR_CA.md`.

---

## 4. Règles de conception appliquées

Les écrans créés dans cette vague suivent la baseline UI fournie :

- aucun dégradé décoratif, un seul accent par vue ;
- `aria-label` sur tous les boutons à icône seule ;
- `tabular-nums` sur tous les chiffres, ce qui évite le tremblement des colonnes ;
- `text-balance` sur les titres, `text-pretty` sur les paragraphes ;
- `size-*` pour les éléments carrés, `min-h-dvh` au lieu de `h-screen` ;
- échelle de z-index fixe, pas de valeur arbitraire ;
- chaque état vide propose une action claire.
