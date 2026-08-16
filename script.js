document.body.classList.add("dark");

let globalDemons = [];
let mainList = [];
let extendedList = [];
let legacyList = [];
let bannedPlayers = [];
let methodList = [];
let pathList = [];
let cheatedList = [];
let hideCheated = false;
let playersList = [];
let manualCompleted = [];

window._leaderboardScores = {};
window._playerMap = new Map();

function normalizeName(name) {
  if (typeof name !== "string") return "";
  return name.replace("[c]", "").replace("[C]", "").trim().toLowerCase();
}

document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupThemeToggle();
  loadEverything();
  setupSearchBar();
  setupDropdownSelects();
  setupPlayerSearch();

  const toggleBtn = document.getElementById("toggle-cheated");
  if (toggleBtn) {
    toggleBtn.textContent = "Hide Cheated";
    toggleBtn.addEventListener("click", () => {
      hideCheated = !hideCheated;
      toggleBtn.textContent = hideCheated ? "Show Cheated" : "Hide Cheated";
      loadLeaderboard();
      renderDemonCards();
    });
  }
});

function createPlaceholderPlayer() {
  const card = document.createElement("div");
  card.className = "placeholder-card player-placeholder";

  const info = document.createElement("div");
  info.className = "placeholder-info";

  for (let i = 0; i < 4; i++) {
    const line = document.createElement("div");
    line.className = "placeholder-line";
    info.appendChild(line);
  }

  card.appendChild(info);
  return card;
}

function setupThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });
}

async function loadEverything() {
  showInitialPlaceholders();
  setTimeout(async () => {
    playersList = await fetch("data/players.json").then(r => r.json()).catch(() => []);
    bannedPlayers = await fetch("data/banned.json").then(r => r.json()).catch(() => []);
    methodList = await fetch("data/method.json").then(r => r.json()).catch(() => []);
    pathList = await fetch("data/path.json").then(r => r.json()).catch(() => []);
    cheatedList = await fetch("data/cheated.json").then(r => r.json()).catch(() => []);
    cheatedList = cheatedList.map(x => x.toLowerCase());
    manualCompleted = await fetch("data/manualcompleted.json").then(r => r.json()).catch(() => []);
    await loadDemonList();
  }, 200);
}

function stopAllVideos() {
  document.querySelectorAll("iframe").forEach(f => {
    const old = f.src;
    f.src = "";
    f.src = old;
  });
}

function setupTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  const contents = document.querySelectorAll(".tab-content");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      stopAllVideos();
      const tab = btn.getAttribute("data-tab");

      buttons.forEach(b => b.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(tab).classList.add("active");

      window.scrollTo({ top: 0, behavior: "smooth" });

      if (tab === "leaderboard") loadLeaderboard();
    });
  });
}

async function loadDemonList() {
  const list = await fetch("data/list.json").then(r => r.json());

  const demonFiles = await Promise.all(
    list.map(entry => {
      const id = typeof entry === "string" ? entry : entry.id;
      return fetch(`data/demons/${id}.json`)
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null)
        .then(d => {
          if (!d) return null;
          if (typeof entry === "object") d.cosmetic = entry.cosmetic || null;
          return d;
        });
    })
  );

  let rank = 0;

  globalDemons = demonFiles
    .map((d, i) => {
      if (!d) return null;

      const entry = list[i];
      const fileName = typeof entry === "string" ? entry : entry.id;
      const baseName = fileName.replace(/\.json$/i, "");

      if (methodList.includes(baseName)) d.warning = "method";
      if (pathList.includes(baseName)) d.warning = "path";

      if (!d.cosmetic) rank++;

      return {
        ...d,
        position: d.cosmetic ? null : rank,
        cosmetic: d.cosmetic || null
      };
    })
    .filter(Boolean);

  mainList = globalDemons.filter(d => !d.cosmetic && d.position <= 75);
  extendedList = globalDemons.filter(d => !d.cosmetic && d.position > 75 && d.position <= 100);
  legacyList = globalDemons.filter(d => !d.cosmetic && d.position > 100);

  renderDemonCards();
  populateDropdowns();
  loadLeaderboard();
}

function renderDemonCards(listOverride) {
  stopAllVideos();
  const container = document.getElementById("demon-container");
  if (!container) return;

  container.innerHTML = "";
  for (let i = 0; i < 6; i++) container.appendChild(createPlaceholderCard());

  let list = listOverride || globalDemons;

  if (hideCheated) {
    list = list.filter(d => !cheatedList.includes(d.id.toLowerCase()));
  }

  setTimeout(() => {
    container.innerHTML = "";
    list.forEach(d => container.appendChild(createDemonCard(d)));
  }, 500);
}

function populateDropdowns() {
  const mainSelect = document.getElementById("select-main");
  const extSelect = document.getElementById("select-extended");
  const legacySelect = document.getElementById("select-legacy");

  function fill(select, list) {
    if (!select) return;
    select.innerHTML = '<option value="">Select a demon</option>';
    list.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d.position;
      opt.textContent = `#${d.position} — ${d.name}`;
      select.appendChild(opt);
    });
  }

  fill(mainSelect, mainList);
  fill(extSelect, extendedList);
  fill(legacySelect, legacyList);
}

function setupDropdownSelects() {
  function attach(select, list) {
    if (!select) return;
    select.addEventListener("change", () => {
      stopAllVideos();
      const pos = Number(select.value);
      if (!pos) return;
      const demon = list.find(d => d.position === pos);
      if (demon) openDemonPage(demon);
      select.value = "";
    });
  }

  attach(document.getElementById("select-main"), mainList);
  attach(document.getElementById("select-extended"), extendedList);
  attach(document.getElementById("select-legacy"), legacyList);
}

function getYoutubeId(url) {
  if (!url) return "";
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/);
  return match ? match[1] : "";
}

function getYoutubeThumbnail(url) {
  const id = getYoutubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
}

function getTier(pos) {
  if (pos <= 10) return 39;
  if (pos <= 20) return 38;
  if (pos <= 30) return 37;
  if (pos <= 40) return 36;
  if (pos <= 50) return 35;
  return 34;
}

function getTierColor(tier) {
  if (!tier || tier === 34) return "#888";
  switch (tier) {
    case 39: return "#a020f0";
    case 38: return "#ff00ff";
    case 37: return "#cc5500";
    case 36: return "#ff6600";
    case 35: return "#ff8800";
    default: return "#888";
  }
}

function getSegmentColor(segment) {
  if (segment === "High") return "#ffd700";
  if (segment === "Mid") return "#c0c0c0";
  if (segment === "Low") return "#cd7f32";
  return "#888";
}

function getPlayerTier(demon) {
  if (!demon) return { segment: "Unranked", tier: null };

  const pos = demon.position;
  const tier = getTier(pos);

  if (tier === 34) return { segment: "Unranked", tier: null };

  let segment = "Low";

  if (tier === 39) {
    if (pos <= 3) segment = "High";
    else if (pos <= 6) segment = "Mid";
  }

  if (tier === 38) {
    if (pos <= 13) segment = "High";
    else if (pos <= 16) segment = "Mid";
  }

  if (tier === 37) {
    if (pos <= 23) segment = "High";
    else if (pos <= 26) segment = "Mid";
  }

  if (tier === 36) {
    if (pos <= 33) segment = "High";
    else if (pos <= 36) segment = "Mid";
  }

  if (tier === 35) {
    if (pos <= 43) segment = "High";
    else if (pos <= 46) segment = "Mid";
  }

  return { segment, tier };
}

function getPlayerRank(score, listPoints) {
  if (listPoints === 0) return "Unranked";
  if (score >= 5000) return "Mythic";
  if (score >= 3500) return "Champion";
  if (score >= 2000) return "Diamond";
  if (score >= 1000) return "Platinum";
  if (score >= 500) return "Gold";
  if (score >= 200) return "Silver";
  return "Bronze";
}

function createDemonCard(demon) {
  const card = document.createElement("div");
  card.className = "demon-card";

  const bg =
    demon.background ||
    demon.thumbnail ||
    getYoutubeThumbnail(demon.verification) ||
    "";

  card.style.setProperty("--card-bg", `url('${bg}')`);

  const img = document.createElement("img");
  img.src =
    (demon.thumbnail && demon.thumbnail.trim()) ||
    getYoutubeThumbnail(demon.verification) ||
    "https://via.placeholder.com/300x170?text=No+Preview";

  const info = document.createElement("div");
  info.className = "demon-info";

  const score = demon.position ? 350 / Math.sqrt(demon.position) : 350 / Math.sqrt(999);

  if (demon.cosmetic) {
    info.innerHTML = `
      <h2>${demon.name}</h2>
      <p>Levels past this zone are harder than ${demon.name}</p>
    `;
  } else {
    info.innerHTML = `
      <h2>#${demon.position} — ${demon.name}</h2>
      <p>Verifier: ${demon.verifier}</p>
      <p>Score: ${score.toFixed(2)}</p>
    `;
  }

  card.appendChild(img);
  card.appendChild(info);

  card.addEventListener("click", () => openDemonPage(demon));

  return card;
}

function createPlaceholderCard() {
  const card = document.createElement("div");
  card.className = "placeholder-card";

  const thumb = document.createElement("div");
  thumb.className = "placeholder-thumb";

  const info = document.createElement("div");
  info.className = "placeholder-info";

  for (let i = 0; i < 5; i++) {
    const line = document.createElement("div");
    line.className = "placeholder-line";
    info.appendChild(line);
  }

  card.appendChild(thumb);
  card.appendChild(info);

  return card;
}
function openDemonPage(demon) {
  stopAllVideos();
  const container = document.getElementById("demon-page-container");
  if (!container) return;

  const thumb =
    (demon.thumbnail && demon.thumbnail.trim()) ||
    getYoutubeThumbnail(demon.verification) ||
    "https://via.placeholder.com/300x170?text=No+Preview";

  const bg =
    demon.background ||
    demon.thumbnail ||
    getYoutubeThumbnail(demon.verification) ||
    "";

  const score = demon.position ? 350 / Math.sqrt(demon.position) : 350 / Math.sqrt(999);

  const videoId = getYoutubeId(demon.verification);
  const iframeSrc = videoId ? `https://www.youtube.com/embed/${videoId}` : "";

  const videoBlock = iframeSrc
    ? `<div class="fancy-video-wrap"><iframe src="${iframeSrc}" allowfullscreen></iframe></div>`
    : `<div class="fancy-video-wrap"><img src="${thumb}"></div>`;

  const validRecords = demon.records
    .map(r =>
      typeof r === "string"
        ? { user: r, percent: 100 }
        : { user: r.user, percent: r.percent || 100, link: r.link || "" }
    )
    .filter(r => {
      if (!r.user || r.user === "Not beaten yet") return false;
      if (bannedPlayers.includes(r.user)) return false;
      if (hideCheated && r.user.toLowerCase().includes("[c]")) return false;
      return true;
    })
    .sort((a, b) => b.percent - a.percent)
    .map(r => {
      const vid = r.link ? `<a href="${r.link}" target="_blank">Video</a>` : "No video";
      return `<p><strong>${r.user}</strong> — ${r.percent}% (${vid})</p>`;
    })
    .join("");

  container.innerHTML = `
    <div class="fancy-demon-header" style="background-image:url('${bg}')">
      <h1>${demon.position ? "#" + demon.position + " — " : ""}${demon.name}</h1>
      <p>Verifier: ${demon.verifier}</p>
      <p>Score: ${score.toFixed(2)}</p>
    </div>

    ${videoBlock}

    <h2 class="fancy-records-title">Records</h2>
    <div class="fancy-records-box">${validRecords || "<p>No records yet.</p>"}</div>
  `;

  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  document.getElementById("demon-page").classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setupSearchBar() {
  const input = document.getElementById("search-bar");
  if (!input) return;
  input.addEventListener("input", () => {
    stopAllVideos();
    const q = input.value.toLowerCase();
    const combined = [...mainList, ...extendedList, ...legacyList];
    const filtered = combined.filter(d =>
      d.name.toLowerCase().includes(q) ||
      String(d.position).includes(q)
    );
    renderDemonCards(filtered);
  });
}

function getPlayerHardestDemon(playerName) {
  const key = normalizeName(playerName);
  let hardest = null;

  globalDemons.forEach(demon => {
    let beaten = false;

    demon.records.forEach(r => {
      const record = typeof r === "string"
        ? { user: r, percent: 100 }
        : { user: r.user, percent: r.percent || 100 };

      if (normalizeName(record.user) === key && record.percent === 100) beaten = true;
    });

    if (normalizeName(demon.verifier) === key) beaten = true;

    if (beaten) {
      if (!hardest || demon.position < hardest.position) hardest = demon;
    }
  });

  return hardest;
}

function getDifficultyFace(diff) {
  return `data/${diff}.png`;
}

function getPlayerStats(playerName) {
  const key = normalizeName(playerName);

  let listDemons = [];
  let extremeDemons = [];
  let insaneDemons = [];
  let hardDemons = [];
  let mediumDemons = [];
  let easyDemons = [];

  globalDemons.forEach(demon => {
    let beaten = false;

    demon.records.forEach(r => {
      const record = typeof r === "string"
        ? { user: r, percent: 100 }
        : { user: r.user, percent: r.percent || 100 };

      if (normalizeName(record.user) === key && record.percent === 100) beaten = true;
    });

    if (normalizeName(demon.verifier) === key) beaten = true;

    if (beaten) {
      if (demon.position && demon.position <= 150) listDemons.push(demon);
      extremeDemons.push(demon);
    }
  });

  manualCompleted.forEach(m => {
    const diff = m.difficulty.toLowerCase();
    const obj = {
      name: m.name,
      background: m.background,
      difficulty: m.difficulty
    };

    if (diff === "insane") insaneDemons.push(obj);
    else if (diff === "hard") hardDemons.push(obj);
    else if (diff === "medium") mediumDemons.push(obj);
    else if (diff === "easy") easyDemons.push(obj);
  });

  return {
    listDemons,
    extremeDemons,
    insaneDemons,
    hardDemons,
    mediumDemons,
    easyDemons
  };
}

function createPlayerCard(name, score, rankNumber) {
  const listPoints = getPlayerStats(name).listDemons.length;

  const div = document.createElement("div");
  div.className = "player-card";
  div.innerHTML = `
    <h3>${rankNumber}. ${cleanDisplayName(name)}</h3>
    <p><strong>Score:</strong> ${score.toFixed(2)}</p>
    <p><strong>Rank:</strong> ${getPlayerRank(score, listPoints)}</p>
    <p><strong>Tier:</strong> ${getPlayerTier(getPlayerHardestDemon(name)).tier}</p>
  `;
  div.onclick = () => openPlayerPage(normalizeName(name), window._leaderboardScores);
  return div;
}

function showInitialPlaceholders() {
  const demonContainer = document.getElementById("demon-container");
  const leaderboardContainer = document.getElementById("leaderboard-container");
  if (demonContainer) {
    demonContainer.innerHTML = "";
    for (let i = 0; i < 6; i++) demonContainer.appendChild(createPlaceholderCard());
  }
  if (leaderboardContainer) {
    leaderboardContainer.innerHTML = "";
    for (let i = 0; i < 6; i++) leaderboardContainer.appendChild(createPlaceholderPlayer());
  }
}

function cleanDisplayName(name) {
  if (typeof name !== "string") return "";
  return name.replace("[c]", "").replace("[C]", "").trim();
}
