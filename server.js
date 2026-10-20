require("dotenv").config();
const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");

const {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_REDIRECT_URI,
  ADMIN_DISCORD_ID,
  SESSION_SECRET,
  DISCORD_INVITE_URL,
  PORT,
} = process.env;

const CONTENT_PATH = path.join(__dirname, "content.json");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      // En prod derrière HTTPS (Vercel/Render), passe ceci à true
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours
    },
  })
);

// ---------- Auth Discord ----------

// 1. On envoie l'utilisateur chez Discord pour s'authentifier
app.get("/auth/login", (req, res) => {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify",
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});

// 2. Discord renvoie l'utilisateur ici avec un "code"
app.get("/auth/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect("/?error=no_code");

  try {
    // On échange le code contre un token d'accès
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) throw new Error("Échange du token raté");
    const tokenData = await tokenRes.json();

    // On récupère le profil Discord de l'utilisateur
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userRes.ok) throw new Error("Récupération du profil ratée");
    const discordUser = await userRes.json();

    // On stocke l'essentiel en session, rien de secret côté client
    req.session.user = {
      id: discordUser.id,
      username: discordUser.username,
      avatar: discordUser.avatar,
    };

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.redirect("/?error=auth_failed");
  }
});

app.post("/auth/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// ---------- API ----------

function isAdmin(req) {
  return !!(req.session.user && req.session.user.id === ADMIN_DISCORD_ID);
}

// Qui suis-je, et ai-je les droits d'édition ?
app.get("/api/session", (req, res) => {
  res.json({
    loggedIn: !!req.session.user,
    user: req.session.user || null,
    isAdmin: isAdmin(req),
    inviteUrl: DISCORD_INVITE_URL || "#",
  });
});

// Contenu public, lu par tout le monde
app.get("/api/content", (req, res) => {
  const content = JSON.parse(fs.readFileSync(CONTENT_PATH, "utf-8"));
  res.json(content);
});

// Modification du contenu, réservée à l'admin (toi)
app.put("/api/content", (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: "Réservé à l'administrateur du site." });
  }
  fs.writeFileSync(CONTENT_PATH, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

const port = PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${port}`);
});
