# Conformité juridique — France & Canada (Québec)

> ⚠️ Ce document est une **note de cadrage produit**, pas un avis juridique. Avant toute mise en production,
> faites-le valider par un avocat en droit immobilier en France **et** par un avocat au Barreau du Québec.
> Les deux marchés ne se ressemblent pas : ce qui est obligatoire ici est interdit là-bas.

---

## 0. Les cinq risques qui peuvent tuer le produit

| # | Risque | Marché | Gravité |
|---|--------|--------|---------|
| 1 | Exercer l'entremise immobilière sans carte professionnelle / permis de courtage | FR + QC | 🔴 Pénal |
| 2 | Encaisser des loyers sans statut d'établissement de paiement ou de mandataire garanti | FR + QC | 🔴 Pénal / réglementaire |
| 3 | Collecter des pièces interdites au dossier locataire | FR + QC | 🔴 Amendes + CNIL/CAI |
| 4 | Avis publics sur les logements et les bailleurs → diffamation, dénigrement | FR + QC | 🟠 Civil |
| 5 | Score locataire perçu comme une décision automatisée discriminante | FR + QC | 🔴 RGPD art. 22 / loi 25 / Charte QC |

Traitez ces cinq points **avant** d'écrire une ligne de code de production.

---

## 1. Statut de la plateforme : êtes-vous un intermédiaire ?

### France — loi Hoguet (n° 70-9 du 2 janvier 1970)

Dès que vous **mettez en relation** un bailleur et un locataire contre rémunération, ou que vous **gérez** un bien pour le compte d'autrui, vous exercez une activité réglementée. Il faut :

- une **carte professionnelle** délivrée par la CCI : mention **T** (transaction) et/ou **G** (gestion immobilière) ;
- une **garantie financière** si vous maniez des fonds (dépôts de garantie, loyers) ;
- une **RC professionnelle** ;
- des **mandats écrits** numérotés et un **registre des mandats** ;
- pour les collaborateurs : **attestation d'habilitation**.

**Les trois modèles possibles, par ordre de risque croissant :**

| Modèle | Description | Hoguet ? |
|---|---|---|
| **A. SaaS pur** | Vous vendez un logiciel. Le bailleur gère lui-même, signe lui-même, encaisse sur son propre compte. | ❌ Non applicable |
| **B. Place de marché** | Vous diffusez des annonces et facturez la diffusion, sans intervenir dans la négociation ni encaisser. | ⚠️ Zone grise — à sécuriser par avocat |
| **C. Gestion pour compte de tiers** | Vous rédigez le bail, sélectionnez le locataire, encaissez le loyer. | ✅ Carte G obligatoire |

👉 **Recommandation :** démarrez en **modèle A**, avec les agents comme clients titulaires de leur propre carte
(l'app stocke déjà `licence`, `licenceType`, `licenceExpiry`, `financialGuarantee`, `rcPro` dans le profil agent).
Ne basculez en modèle C qu'une fois la carte G obtenue.

### Québec — Loi sur le courtage immobilier (OACIQ)

- L'**entremise** en vue de la **location d'un immeuble** est une opération de courtage : elle exige en principe un
  **permis de courtier délivré par l'OACIQ**, avec formation, examen, contribution au **Fonds d'indemnisation** et
  **assurance responsabilité** du Fonds d'assurance de l'OACIQ.
- L'**administration d'immeubles** (perception de loyers, entretien) pour le compte d'autrui n'est pas traitée de la
  même façon que le courtage. **La frontière est ténue et doit être tranchée par un avocat.**
- La **publicité** doit identifier le titulaire de permis ; la rétribution doit figurer dans un **contrat de courtage écrit**.
- Vous ne pouvez pas **facturer des frais au locataire** pour la simple location d'un logement.

👉 **Recommandation :** dans l'app, un agent ne devient « actif » qu'après saisie **et vérification** de son numéro
de permis. Ajoutez un blocage dur : pas de permis valide → pas de publication d'annonce.

---

## 2. Encaissement des loyers

### France
- Manier les fonds d'autrui suppose la **garantie financière Hoguet**, ou de passer par un **prestataire de services
  de paiement** agréé (Stripe Connect, Mangopay, Lemonway, SlimPay…) où **vous ne touchez jamais les fonds**.
- Le prélèvement SEPA impose un **mandat SEPA signé** (RUM, ICS), un **préavis de prélèvement** et un droit de
  contestation de 8 semaines (13 mois si mandat inexistant).
- **Interdiction** de refuser un mode de paiement autre que le prélèvement automatique : le locataire ne peut pas y
  être contraint.
- **Quittance de loyer** : gratuite et obligatoire sur demande du locataire.

### Québec / Canada
- **Débit préautorisé (DPA)** : encadré par la **règle H1 de Paiements Canada** — accord écrit ou électronique,
  préavis en cas de changement de montant, droit de révocation.
- **FINTRAC** : selon le volume et le modèle, un statut d'**entreprise de services monétaires** peut être requis.
- **Interdit au Québec** : exiger un **dépôt de garantie**, des **chèques postdatés obligatoires**, ou des frais pour
  la remise des clés. Seul le **premier mois de loyer** peut être demandé d'avance.
- L'app doit refuser toute saisie de dépôt > 0 sur un bien QC — c'est déjà implémenté dans `complianceCheck()`.

---

## 3. Le dossier locataire : ce que vous avez le droit de demander

### France — décret n° 2015-1437 du 5 novembre 2015 (liste limitative)

**Autorisé** : pièce d'identité valide, justificatif de domicile, justificatif d'activité professionnelle,
3 derniers bulletins de salaire (ou 2 derniers bilans), dernier avis d'imposition, acte de cautionnement du garant.

**Interdit** (liste non exhaustive) : relevés de compte bancaire, RIB, copie du livret de famille, carte Vitale,
extrait de casier judiciaire, contrat de mariage, jugement de divorce, attestation d'absence de crédit,
photographie d'identité hors pièce d'identité, dossier médical.

**Sanction** : amende administrative jusqu'à **3 000 €** (personne physique) et **15 000 €** (personne morale).

**À intégrer :** `DossierFacile` (téléservice de l'État) — recommandé par la CNIL, il fournit un dossier vérifié et
anonymisable. Une intégration API est un avantage produit réel : elle règle en même temps la conformité et la fraude documentaire.

### Québec

- Un locateur peut demander **nom, coordonnées, adresse actuelle, références du locateur précédent, preuve de revenu**.
- **Interdit** : exiger le **numéro d'assurance sociale (NAS)**, le numéro de **permis de conduire** ou de
  **carte d'assurance maladie**. La Commission d'accès à l'information s'est prononcée à plusieurs reprises en ce sens.
- **Enquête de crédit** : possible **uniquement avec consentement libre, explicite et éclairé**, pour une finalité précise.
- **Discrimination interdite** (Charte des droits et libertés de la personne, art. 10) : refuser un locataire à cause de
  ses **enfants**, de sa **grossesse**, de son **origine**, de sa **langue**, d'un **handicap**, ou parce qu'il reçoit
  de l'**aide sociale** (condition sociale) est illégal. Recours : **CDPDJ** et **TAL**.

👉 **Dans le produit :** l'écran de création d'utilisateur affiche déjà l'avertissement. Allez plus loin :
- champ NAS **inexistant en base** (pas seulement masqué) ;
- case de consentement horodatée avant toute enquête de crédit (`creditCheckConsent`, `consentDate` sont déjà au modèle) ;
- **purge automatique à 30 jours** des dossiers non retenus (recommandation CNIL) — à implémenter côté serveur.

---

## 4. Données personnelles

### France / UE — RGPD + référentiel CNIL « gestion locative »

| Obligation | Traduction produit |
|---|---|
| Base légale par traitement | Registre des traitements : candidature (mesures précontractuelles), bail (contrat), marketing (consentement) |
| Minimisation | Ne stockez pas ce que vous n'utilisez pas. Chiffrez ou détruisez les pièces après décision |
| Durées de conservation | Dossiers refusés : **30 jours**. Locataires en place : durée du bail **+ 5 ans** (prescription civile). Comptabilité : **10 ans** |
| Information des personnes | Mention d'information **au moment du dépôt du dossier**, pas seulement dans les CGU |
| Droits | Accès, rectification, effacement, portabilité, limitation — réponse sous **1 mois** |
| Sécurité (art. 32) | Chiffrement au repos et en transit, MFA, journalisation des accès, cloisonnement par rôle |
| Sous-traitants | Contrat art. 28 avec l'hébergeur, le prestataire de signature, le scoring, l'e-mail |
| Violation de données | Notification CNIL sous **72 h** |
| DPO | Obligatoire si suivi systématique à grande échelle — probable dès quelques milliers de dossiers |
| AIPD | Une **analyse d'impact** est à prévoir : scoring + données financières + volume |

**Jurisprudence à connaître :** la CNIL a sanctionné un acteur de la gestion locative de **400 000 €** (délibération
SAN-2019-005) pour un espace candidat accessible sans authentification exposant pièces d'identité et bulletins de
salaire, et pour conservation excessive. C'est exactement le risque d'un produit comme le vôtre.

### Québec — Loi 25 (ex-projet de loi 64) + PIPEDA au fédéral

- **Responsable de la protection des renseignements personnels** désigné et **publié sur le site**.
- **Registre des incidents** de confidentialité + notification à la **CAI** et aux personnes concernées.
- **Évaluation des facteurs relatifs à la vie privée (EFVP)** avant tout nouveau système ou communication hors Québec.
- **Consentement distinct** pour chaque finalité secondaire ; **paramètres de confidentialité par défaut au maximum**.
- **Droit à la portabilité** des renseignements en format technologique structuré.
- **Décision automatisée** : la loi 25 impose d'**informer la personne** lorsqu'une décision est fondée
  **exclusivement** sur un traitement automatisé, et de lui permettre de **présenter ses observations** à une
  personne en mesure de réviser la décision. Le RGPD (art. 22) dit la même chose.

👉 **Conséquence directe sur votre score locataire** : il ne doit **jamais** produire un refus automatique.
Le produit affiche déjà les facteurs du score et le message `legal.automatedDecisionInfo`. Ajoutez côté serveur
un flag `humanReviewed` obligatoire avant tout rejet — le champ existe déjà dans le modèle `applications`.

### Hébergement
- Clients français → hébergement **UE**.
- Clients québécois → hébergement **au Canada** de préférence ; toute communication hors Québec exige une EFVP.
- Prévoyez dès l'architecture une **partition par région**, pas une base unique. C'est très coûteux à rétrofiter.

---

## 5. Le bail

### France
- **Bail vide** : 3 ans (bailleur personne physique) / 6 ans (personne morale). **Meublé** : 1 an, 9 mois pour un étudiant.
  **Bail mobilité** : 1 à 10 mois, non renouvelable, sans dépôt de garantie.
- **Dépôt de garantie** : 1 mois de loyer hors charges (vide), 2 mois (meublé). Restitution sous 1 mois (sans retenue)
  ou 2 mois (avec retenues justifiées), pénalité de 10 % du loyer par mois de retard.
- **Préavis locataire** : 3 mois, réduit à **1 mois** en zone tendue et dans plusieurs cas dérogatoires
  (mutation, perte d'emploi, RSA/AAH, état de santé…).
- **Congé bailleur** : 6 mois avant l'échéance (vide) / 3 mois (meublé), avec motif obligatoire
  (reprise, vente, motif légitime et sérieux).
- **Annexes obligatoires** : DPE, ERP, CREP (plomb, immeubles < 1949), amiante, diagnostic électricité et gaz
  (installations > 15 ans), surface habitable (loi Boutin), notice d'information.
- **Révision du loyer** : uniquement si une clause le prévoit, une fois par an, selon l'**IRL** publié par l'INSEE.

### Québec
- **Formulaire de bail obligatoire du TAL** — vous ne pouvez pas rédiger votre propre contrat de bail résidentiel.
- **Section G (art. 1896 C.c.Q., renforcé par la loi 31 de 2024)** : le locateur doit déclarer le **loyer le plus bas
  payé au cours des 12 mois précédents**, ou le loyer fixé par le TAL pendant cette période. Si la section est laissée
  vide ou fausse, le nouveau locataire peut demander au TAL de **fixer le loyer**.
- **Section F** : restriction de fixation pendant 5 ans pour un immeuble neuf ou nouvellement affecté au résidentiel.
- **Reconduction** : le bail se reconduit automatiquement. Avis de modification à envoyer **3 à 6 mois** avant
  l'échéance (bail de 12 mois ou plus) ; le locataire a **1 mois** pour refuser.
- **Cession de bail** : depuis la loi 31, le locateur **peut refuser** une cession — mais le bail est alors
  **résilié** à la date proposée. Délai de réponse : **15 jours**, silence = acceptation.
- **Aucun dépôt de garantie.**

👉 **Différenciateur produit majeur :** la section G est la base juridique parfaite de votre idée « voir combien
payaient les anciens locataires ». Au Québec, c'est une **obligation légale du bailleur**, pas une indiscrétion.
En France, l'équivalent est la mention obligatoire du loyer du précédent locataire en zone d'encadrement.
Construisez la fonctionnalité **sur ce socle légal**, pas sur du déclaratif d'internautes.

---

## 6. Performance énergétique (France, très structurant)

Loi Climat & Résilience — France métropolitaine :

| Classe DPE | Statut |
|---|---|
| **G** | Location **interdite** depuis le **1er janvier 2025** (nouveaux baux, renouvellements, reconductions tacites) |
| **F** | Interdiction au **1er janvier 2028** |
| **E** | Interdiction au **1er janvier 2034** |

- Les logements **F et G** ne peuvent **pas voir leur loyer augmenté**, ni à la révision, ni à la relocation.
- Un **audit énergétique** est obligatoire avant la vente d'un F ou G.
- Le calendrier est **décalé en outre-mer** (G en 2028, F en 2031).
- La sanction est essentiellement **civile** : le locataire peut exiger des travaux, une baisse de loyer,
  voire la résiliation. En revanche, l'**absence de DPE dans une annonce** est directement sanctionnable.

👉 Votre `complianceCheck()` bloque déjà la publication d'un bien G et alerte sur un bien F.
**C'est un argument commercial fort** : aucun concurrent grand public ne bloque la publication d'une annonce illégale.

Au Québec, **aucune interdiction** équivalente. La cote **ÉnerGuide** est volontaire — mais avec les coûts
Hydro-Québec, l'afficher est un excellent argument de conversion.

---

## 7. Encadrement des loyers (France)

Deux périmètres **distincts** qu'il ne faut jamais confondre :

1. **Zone tendue** (décret 2013-392, ~1 150 communes) : préavis réduit à 1 mois, **gel du loyer à la relocation**,
   taxe sur les logements vacants. Le décret n° 2026-644 du 20 juillet 2026 a prolongé le blocage du loyer entre
   deux locataires jusqu'au **31 juillet 2027**.
2. **Encadrement renforcé** (loi ELAN, volontaire) : loyers de référence fixés par **arrêté préfectoral**, plafond au
   **loyer de référence majoré (+20 % de la médiane)**. Concerne notamment Paris, Lille/Hellemmes/Lomme,
   Lyon/Villeurbanne, Bordeaux Métropole, Montpellier, Plaine Commune, Est Ensemble, et s'étend chaque année.

⚠️ **Point de vigilance calendrier** : l'expérimentation ELAN arrive à échéance **fin novembre 2026**. Elle sera soit
pérennisée, soit abandonnée. Ne codez pas la liste des villes en dur : elle doit être **une donnée de configuration
mise à jour**, comme dans `src/app/config/markets.ts`.

Le **complément de loyer** n'est admis que pour des caractéristiques exceptionnelles et justifiées ;
il est très souvent contesté avec succès. Si votre produit le propose, exigez une justification écrite.

---

## 8. Avis et notes : le sujet le plus sous-estimé

Vous voulez permettre de **noter les logements et les bailleurs**. C'est votre meilleure idée et votre plus gros risque.

### France
- Vous êtes **hébergeur** (LCEN) tant que vous ne modifiez pas les contenus : vous devez retirer **promptement**
  un contenu manifestement illicite après notification, et disposer d'un **dispositif de signalement visible**.
- **Article L111-7-2 du code de la consommation** : toute plateforme d'avis en ligne doit préciser si les avis sont
  **contrôlés**, **comment**, la **date de publication**, la date de l'expérience, et les **motifs de refus** d'un avis.
  La norme **NF Z74-501 / ISO 20488** donne le cadre méthodologique.
- **Diffamation / dénigrement** : un avis nommant un bailleur particulier avec des accusations non prouvées expose
  l'auteur **et potentiellement la plateforme**.
- Un bailleur personne physique a des **droits RGPD** sur les données le concernant.

### Canada
- **Loi sur la concurrence** : les faux avis et faux témoignages sont une pratique commerciale trompeuse,
  avec des sanctions considérablement alourdies depuis les amendements récents.
- **Diffamation** : le droit québécois est plus favorable au demandeur que le droit américain — pas de protection
  type « section 230 ».

👉 **Règles produit à appliquer dès le MVP** (déjà amorcées dans l'UI) :
1. **Seul un ancien locataire avec bail vérifié** peut publier un avis (`property.reviewsVerifiedOnly`).
2. On note **le logement et l'immeuble** (isolation, bruit, propreté), pas la personne du bailleur.
   Une note « réactivité » est acceptable ; « Monsieur X est un escroc » ne l'est pas.
3. **Modération a priori** sur signalement, délai de retrait affiché, **droit de réponse du bailleur**.
4. **Journal de modération** conservé.
5. Politique publiée : qui peut publier, comment c'est vérifié, dans quels cas un avis est retiré.

---

## 9. Autres points à ne pas oublier

| Sujet | France | Québec |
|---|---|---|
| **Signature électronique** | eIDAS — viser la **signature avancée** pour les baux ; conserver le dossier de preuve | LCCJTI — l'écrit technologique a la même valeur, à condition d'assurer l'**intégrité** |
| **État des lieux** | Contradictoire, daté, signé, un exemplaire remis. Son absence fait présumer une remise en bon état | Non obligatoire mais **fortement recommandé** ; sans lui, la preuve des dommages est très difficile |
| **Assurance** | Attestation d'assurance habitation exigible chaque année ; le bailleur peut souscrire pour le compte du locataire défaillant | Le locateur peut exiger une assurance responsabilité, mais pas imposer un assureur |
| **Accessibilité** | RGAA / directive européenne accessibilité (EAA, applicable depuis juin 2025) | Standard SGQRI 008 pour le secteur public ; bonne pratique dans le privé |
| **Langue** | — | **Charte de la langue française (loi 96)** : interface, contrats et communications **en français**, au moins aussi visible que toute autre langue. **La version française n'est pas optionnelle** |
| **Consommation** | Code de la consommation, CGU/CGV, droit de rétractation 14 j pour les abonnements | Loi sur la protection du consommateur : encadrement strict des **contrats à exécution successive** et de la résiliation |
| **Fiscalité** | Déclaration des revenus fonciers ; le rapport financier de l'app doit coller aux cases 2044 / 2042-C-PRO | Relevés fiscaux, TPS/TVQ sur vos honoraires de service |
| **Marketing** | Consentement e-mail (B2C), CNIL cookies | **Loi canadienne anti-pourriel (LCAP)** — parmi les plus sévères au monde, consentement exprès et sanctions lourdes |

---

## 10. Plan d'action juridique en 6 étapes

1. **Choisir le modèle** (SaaS pur vs gestion pour compte de tiers). Tout découle de là.
2. **Consulter deux avocats** (FR + QC) sur : statut d'intermédiaire, encaissement, avis en ligne. Budget à prévoir : réel.
3. **Rédiger la documentation RGPD/loi 25** : registre des traitements, AIPD/EFVP, politique de confidentialité,
   contrats de sous-traitance, procédure de violation.
4. **Verrouiller le produit** : champs interdits absents de la base, purge à 30 jours, révision humaine obligatoire
   avant tout rejet, blocage de publication en cas de non-conformité.
5. **Publier la politique d'avis** conforme à L111-7-2 et à la norme ISO 20488.
6. **Mettre en place la veille** : liste des villes encadrées, IRL, calendrier DPE, décisions du TAL.
   Le fichier `src/app/config/markets.ts` est prévu pour cela — il doit être **maintenu**, pas figé.

---

## Sources officielles à suivre

**France** — Legifrance · service-public.fr · CNIL (référentiel gestion locative) · ANIL et ADIL ·
Observatoires locaux des loyers · ADEME (base DPE) · INSEE (IRL) · DGCCRF

**Québec / Canada** — Tribunal administratif du logement (tal.gouv.qc.ca) · Éducaloi ·
Commission d'accès à l'information · OACIQ · CDPDJ · SCHL/CMHC · Paiements Canada · Commissariat à la protection
de la vie privée du Canada
