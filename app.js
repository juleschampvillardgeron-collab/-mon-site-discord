let session = null;
let content = null;
let editMode = false;

async function init() {
  const [sessionRes, contentRes] = await Promise.all([
    fetch("/api/session").then((r) => r.json()),
    fetch("/api/content").then((r) => r.json()),
  ]);
  session = sessionRes;
  content = contentRes;

  document.getElementById("join-btn").href = session.inviteUrl;

  if (session.isAdmin) {
    document.getElementById("admin-bar").classList.remove("hidden");
  } else if (!session.loggedIn) {
    document.getElementById("login-bar").classList.remove("hidden");
  }
  // Si connecté mais pas admin: on n'affiche ni la barre login ni la barre admin,
  // la personne voit juste le site normalement.

  render();
  wireGlobalButtons();
}

function wireGlobalButtons() {
  const loginBtn = document.getElementById("login-btn");
  if (loginBtn) loginBtn.onclick = () => (window.location.href = "/auth/login");

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn)
    logoutBtn.onclick = async () => {
      await fetch("/auth/logout", { method: "POST" });
      window.location.reload();
    };

  const editToggle = document.getElementById("edit-toggle");
  if (editToggle)
    editToggle.onclick = () => {
      editMode = !editMode;
      editToggle.textContent = editMode ? "👁️ Aperçu" : "✏️ Éditer";
      render();
    };
}

function render() {
  document.getElementById("logo").src = content.logoUrl;
  renderEditable("server-name", content.serverName, (v) => (content.serverName = v));
  renderEditable("description", content.description, (v) => (content.description = v));

  // Stats
  const statsEl = document.getElementById("stats");
  statsEl.innerHTML = "";
  content.stats.forEach((s, i) => {
    const div = document.createElement("div");
    div.className = "stat";
    div.innerHTML = `<b contenteditable="${editMode}" data-stat-i="${i}" data-field="value">${s.value}</b><span contenteditable="${editMode}" data-stat-i="${i}" data-field="label">${s.label}</span>`;
    statsEl.appendChild(div);
  });
  statsEl.querySelectorAll("[contenteditable]").forEach((el) => {
    el.oninput = () => {
      const i = el.dataset.statI;
      content.stats[i][el.dataset.field] = el.textContent;
    };
  });

  // Features
  const featEl = document.getElementById("features");
  featEl.innerHTML = "";
  content.features.forEach((f, i) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3 contenteditable="${editMode}" data-i="${i}" data-field="title">${f.emoji} ${f.title}</h3>
      <p contenteditable="${editMode}" data-i="${i}" data-field="text">${f.text}</p>
      ${editMode ? `<button class="remove-item" data-remove-feature="${i}">Supprimer</button>` : ""}
    `;
    featEl.appendChild(card);
  });
  featEl.querySelectorAll("[contenteditable]").forEach((el) => {
    el.oninput = () => {
      const i = el.dataset.i;
      if (el.dataset.field === "title") {
        content.features[i].title = el.textContent.replace(/^\p{Emoji}\s*/u, "");
      } else {
        content.features[i].text = el.textContent;
      }
    };
  });
  featEl.querySelectorAll("[data-remove-feature]").forEach((btn) => {
    btn.onclick = () => {
      content.features.splice(Number(btn.dataset.removeFeature), 1);
      render();
    };
  });

  // Rules
  const rulesEl = document.getElementById("rules");
  rulesEl.innerHTML = "";
  content.rules.forEach((r, i) => {
    const div = document.createElement("div");
    div.className = "rule";
    div.innerHTML = `
      <span class="num">${i + 1}</span>
      <div style="flex:1">
        <p contenteditable="${editMode}" data-rule-i="${i}">${r}</p>
        ${editMode ? `<button class="remove-item" data-remove-rule="${i}">Supprimer</button>` : ""}
      </div>
    `;
    rulesEl.appendChild(div);
  });
  rulesEl.querySelectorAll("[contenteditable]").forEach((el) => {
    el.oninput = () => (content.rules[el.dataset.ruleI] = el.textContent);
  });
  rulesEl.querySelectorAll("[data-remove-rule]").forEach((btn) => {
    btn.onclick = () => {
      content.rules.splice(Number(btn.dataset.removeRule), 1);
      render();
    };
  });

  renderEditorToolbar();
}

function renderEditable(id, value, onInput) {
  const el = document.getElementById(id);
  el.textContent = value;
  el.contentEditable = editMode ? "true" : "false";
  el.oninput = () => onInput(el.textContent);
}

function renderEditorToolbar() {
  let bar = document.getElementById("editor-toolbar");
  if (bar) bar.remove();
  if (!editMode) return;

  bar = document.createElement("div");
  bar.id = "editor-toolbar";
  bar.className = "editor-toolbar";
  bar.innerHTML = `
    <button id="add-feature-btn">+ Catégorie</button>
    <button id="add-rule-btn">+ Règle</button>
    <button id="save-btn">💾 Enregistrer</button>
  `;
  document.body.appendChild(bar);

  document.getElementById("add-feature-btn").onclick = () => {
    content.features.push({ emoji: "✨", title: "Nouvelle catégorie", text: "Description..." });
    render();
  };
  document.getElementById("add-rule-btn").onclick = () => {
    content.rules.push("Nouvelle règle...");
    render();
  };
  document.getElementById("save-btn").onclick = save;
}

async function save() {
  const res = await fetch("/api/content", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(content),
  });
  if (res.ok) {
    alert("✅ Enregistré !");
  } else {
    const err = await res.json();
    alert("❌ " + (err.error || "Erreur lors de l'enregistrement"));
  }
}

init();
