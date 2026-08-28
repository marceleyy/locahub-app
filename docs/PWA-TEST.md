# Tester le mode hors ligne depuis un smartphone

Le service worker est **désactivé en développement** (`import.meta.env.DEV`). Le
tester impose donc de compiler puis de servir le résultat.

---

## Le piège à connaître avant de commencer

Un service worker ne s'enregistre que dans un **contexte sécurisé** : HTTPS, ou
`localhost`. Une adresse comme `http://192.168.1.42:4173` n'en est pas un —
l'application s'affichera, mais **le worker ne s'installera jamais** et le mode
avion échouera sans le moindre message d'erreur.

Deux chemins, selon ce que tu as sous la main.

---

## Chemin A — Android + câble USB (recommandé)

Le plus fiable : le téléphone voit `localhost`, donc le contexte est sécurisé
sans certificat ni configuration réseau.

### 1. Compiler et servir

```bash
cd C:\Users\ms-ma\Downloads\LocaHub_v2\projet
npm.cmd run build
npm.cmd run preview
```

Laisse ce terminal ouvert. L'application est servie sur `http://localhost:4173`.

### 2. Brancher le téléphone

Active les **options pour les développeurs** puis le **débogage USB** sur
Android, branche le câble et accepte la demande d'autorisation.

### 3. Rediriger le port

Dans Chrome **sur l'ordinateur**, ouvre `chrome://inspect/#devices`, clique sur
**Port forwarding**, coche *Enable port forwarding* et ajoute :

```
Port local : 4173
Cible      : localhost:4173
```

### 4. Ouvrir sur le téléphone

Dans Chrome **sur le téléphone**, va sur :

```
http://localhost:4173
```

Le worker s'enregistre : `localhost` est un contexte sécurisé même sur du HTTP.

### 5. Vérifier l'installation

Toujours dans `chrome://inspect`, clique sur **inspect** sous l'onglet du
téléphone, puis onglet **Application → Service Workers**. Tu dois voir
`sw.js` avec le statut *activated and is running*.

Onglet **Application → Cache Storage** : `locahub-shell-v4` et
`locahub-assets-v4` doivent être remplis.

### 6. Tester le mode avion

Active le **mode avion** sur le téléphone, puis recharge la page.
L'application doit se peindre normalement, avec la bannière orange
« Hors ligne » en haut. Navigue entre les espaces : tout doit répondre.

---

## Chemin B — Wi-Fi, sans câble

Fonctionne pour vérifier la mise en page tactile, **mais pas le service worker**
si tu restes en HTTP. Deux variantes.

### B1. Mise en page seulement (worker inactif)

```bash
npm.cmd run build
npm.cmd run preview:lan
```

Vite affiche une ligne `Network: http://192.168.x.x:4173/`. Ouvre cette adresse
sur le téléphone, connecté au **même réseau Wi-Fi**.

Si rien ne répond, c'est le pare-feu Windows :

```powershell
New-NetFirewallRule -DisplayName "Vite preview 4173" -Direction Inbound -LocalPort 4173 -Protocol TCP -Action Allow
```

### B2. Forcer le contexte sécurisé sur l'IP locale

Dans Chrome **sur le téléphone**, ouvre :

```
chrome://flags/#unsafely-treat-insecure-origin-as-secure
```

Passe le réglage sur **Enabled**, saisis exactement `http://192.168.x.x:4173`
dans le champ, puis redémarre Chrome. Le worker s'enregistrera.

À n'utiliser que pour un test, et à remettre sur *Disabled* ensuite.

---

## Vérifier la mise à jour du worker

1. Modifie une ligne visible, par exemple un titre.
2. `npm.cmd run build` à nouveau, le serveur `preview` peut rester ouvert.
3. Recharge sur le téléphone.

Un toast persistant doit apparaître : **« Une nouvelle version est disponible »**
avec un bouton *Mettre à jour*. Rien ne se recharge tant que tu n'appuies pas —
c'est voulu, pour ne pas effacer une saisie en cours.

---

## Vérifier l'installation en application

Sur Android, menu Chrome → **Installer l'application**. L'icône apparaît sur
l'écran d'accueil, et l'application s'ouvre en plein écran, sans barre
d'adresse (`display: standalone` dans le manifeste).

Sur iOS, Safari → Partager → **Sur l'écran d'accueil**. iOS ignore une partie du
manifeste mais respecte `apple-touch-icon` et le mode plein écran.

---

## En cas de problème

| Symptôme | Cause probable |
|---|---|
| Aucun worker dans l'onglet Application | Contexte non sécurisé — voir le piège en tête de page |
| Page blanche en mode avion | Le pré-cache a échoué : vider Cache Storage et recharger en ligne |
| L'ancienne version persiste | Application → Service Workers → **Unregister**, puis recharger |
| Le worker s'installe mais reste *waiting* | Une version tourne encore : fermer tous les onglets de l'application |

Pour repartir de zéro : Application → **Clear site data**, ce qui efface le
cache, le worker et les données `localStorage` de démonstration.
