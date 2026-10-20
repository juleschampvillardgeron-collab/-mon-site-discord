# Site Discord avec connexion et édition admin

Un petit site qui présente ton serveur Discord. Tout le monde peut le visiter.
Si **toi** (l'admin) te connectes avec ton compte Discord, un bouton "✏️ Éditer"
apparaît et tu peux modifier le texte, les catégories et les règles directement
sur la page.

## 1. Créer l'application Discord (2 min)

1. Va sur https://discord.com/developers/applications
2. Clique **New Application**, donne-lui un nom, crée-la.
3. Dans le menu de gauche, va dans **OAuth2** → **General**.
   - Copie le **Client ID** et le **Client Secret** (clique "Reset Secret" si besoin).
4. Toujours dans **OAuth2**, section **Redirects**, clique **Add Redirect** et ajoute :
   - Pour tester en local : `http://localhost:3000/auth/callback`
   - Pour la version en ligne : `https://ton-site.vercel.app/auth/callback`
     (tu l'ajouteras après avoir déployé, une fois que tu connais l'URL)

## 2. Trouver ton ID Discord

1. Dans Discord : **Paramètres utilisateur** → **Avancés** → active **Mode développeur**.
2. Clique droit sur ton pseudo n'importe où → **Copier l'ID utilisateur**.
   C'est ton `ADMIN_DISCORD_ID`.

## 3. Configurer le projet

1. Copie `.env.example` en `.env` :
   ```
   cp .env.example .env
   ```
2. Remplis les valeurs dans `.env` avec ce que tu as récupéré aux étapes 1 et 2.
3. Mets aussi ton lien d'invitation Discord dans `DISCORD_INVITE_URL`
   (Discord → ton serveur → clic droit → Inviter des gens → copier le lien).

## 4. Lancer en local pour tester

```bash
npm install
npm start
```

Puis ouvre http://localhost:3000 — connecte-toi avec Discord, tu devrais voir
apparaître la barre admin et le bouton "✏️ Éditer".

## 5. Mettre le site en ligne (gratuit, avec Vercel)

1. Crée un compte sur https://vercel.com (connexion avec GitHub la plus simple)
2. Mets ce dossier dans un repo GitHub, puis sur Vercel clique **Add New → Project**
   et importe ce repo.
3. Dans les réglages du projet Vercel, onglet **Environment Variables**, ajoute
   toutes les variables qui sont dans ton `.env` (sauf `PORT`).
4. Déploie. Vercel te donne une URL du style `https://ton-site.vercel.app`.
5. Retourne sur le Discord Developer Portal → OAuth2 → Redirects, et ajoute :
   `https://ton-site.vercel.app/auth/callback`
6. Mets à jour `DISCORD_REDIRECT_URI` dans les variables d'environnement Vercel
   avec cette même URL, puis redéploie.

(Render ou Railway fonctionnent aussi très bien si tu préfères, le principe est identique :
variables d'environnement + redirect URI à jour.)

## Comment ça marche

- Seul toi (ton `ADMIN_DISCORD_ID`) obtient les droits d'édition — vérifié côté
  serveur (`server.js`), impossible à tricher depuis le navigateur.
- Le contenu du site est stocké dans `content.json` et modifié uniquement via
  une route protégée (`PUT /api/content`).
- Pour changer qui est admin, change juste `ADMIN_DISCORD_ID` dans les
  variables d'environnement.

## Fichiers

- `server.js` — serveur Express, connexion Discord (OAuth2), API du contenu
- `public/index.html` / `style.css` / `app.js` — la page et le mode édition
- `content.json` — les textes du site (nom, description, catégories, règles)
- `.env.example` — modèle des variables à configurer
