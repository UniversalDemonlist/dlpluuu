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
    bannedPlayers = await fetch("data/banned.json").then(r => r.json()).catch(() => []);
    methodList = await fetch("data/method.json").then(r => r.json()).catch(() => []);
    pathList = await fetch("data/path.json").then(r => r.json()).catch(() => []);
    cheatedList = await fetch("data/cheated.json").then(r => r.json()).catch(() => []);
      cheatedList = cheatedList.map(x => x.toLowerCase());
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
    list.map(id =>
      fetch(`data/demons/${id}.json`)
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  );

  globalDemons = demonFiles
    .map((d, i) => {
      if (!d) return null;

      const fileName = list[i];
      const baseName = fileName.replace(/\.json$/i, "");

      if (methodList.includes(baseName)) d.warning = "method";
      if (pathList.includes(baseName)) d.warning = "path";

      return { ...d, position: i + 1 };
    })
    .filter(Boolean);

  mainList = globalDemons.filter(d => d.position <= 75);
  extendedList = globalDemons.filter(d => d.position > 75 && d.position <= 100);
  legacyList = globalDemons.filter(d => d.position > 100);

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

  let list = listOverride || globalDemons.filter(d => d.position <= 100);

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

function getPlayerTitle(segment, tier) {
  if (!tier) return "Unranked";

  const titles = {
    39: { High: "ABSOLUTE", Mid: "ABSOLUTE", Low: "ABSOLUTE" },
    38: { High: "MASTER", Mid: "MASTER", Low: "MASTER" },
    37: { High: "EXPERT", Mid: "EXPERT", Low: "EXPERT" },
    36: { High: "ADVANCED", Mid: "ADVANCED", Low: "ADVANCED" },
    35: { High: "NOVICE", Mid: "NOVICE", Low: "NOVICE" }
  };

  return titles[tier][segment] || "Unranked";
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

  const score = demon.position <= 150 ? 350 / Math.sqrt(demon.position) : 0;

  info.innerHTML = `
    <h2>#${demon.position} — ${demon.name}</h2>
    <p><strong>Author:</strong> ${demon.author}</p>
    <p><strong>Score Value:</strong> ${score.toFixed(2)}</p>
    <p><strong>Verifier:</strong> ${demon.verifier}</p>
    <p><strong>GDDL Tier:</strong> ${getTier(demon.position)}</p>
  `;

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

  const creators = Array.isArray(demon.creators)
    ? demon.creators.join(", ")
    : demon.creators || "Unknown";

  const score = demon.position <= 150 ? 350 / Math.sqrt(demon.position) : 0;

  const videoId = getYoutubeId(demon.verification);
  const iframeSrc = videoId ? `https://www.youtube.com/embed/${videoId}` : "";

  const videoBlock = iframeSrc
    ? `<div class="fancy-video-wrap"><iframe src="${iframeSrc}" allowfullscreen></iframe></div>`
    : `<div class="fancy-video-wrap"><img src="${thumb}"></div>`;

  let warningHTML = "";
  if (demon.warning === "method") {
    warningHTML = `
      <div class="warning-box">
        THIS LEVEL ACCEPTS RECORDS ONLY USING THE METHOD USED IN THE VERIFICATION
      </div>
    `;
  }
  if (demon.warning === "path") {
    warningHTML = `
      <div class="warning-box">
        THIS LEVEL ACCEPTS RECORDS ONLY USING THE PATH USED IN THE VERIFICATION
      </div>
    `;
  }

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
      <h1>#${demon.position} — ${demon.name}</h1>
      ${demon.description ? `<p class="fancy-desc">${demon.description}</p>` : ""}
      <div class="fancy-meta-box">
        <p><strong>Author:</strong> ${demon.author}</p>
        <p><strong>Creators:</strong> ${creators}</p>
        <p><strong>Verifier:</strong> ${demon.verifier}</p>
        <p><strong>Tier:</strong> ${getTier(demon.position)}</p>
        <p><strong>Score Value:</strong> ${score.toFixed(2)}</p>
        ${warningHTML}
      </div>
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
    const combined = [...mainList, ...extendedList];
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

function getPlayerStats(playerName) {
  const key = normalizeName(playerName);

  let main = 0;
  let extended = 0;
  let legacy = 0;
  let completed = [];
  let created = [];
  let verified = [];

  globalDemons.forEach(demon => {
    const pos = demon.position;
    let isCompleted = false;

    demon.records.forEach(r => {
      const record = typeof r === "string"
        ? { user: r, percent: 100 }
        : { user: r.user, percent: r.percent || 100 };

      if (normalizeName(record.user) === key && record.percent === 100) {
        isCompleted = true;
      }
    });

    if (normalizeName(demon.verifier) === key) {
      isCompleted = true;
      verified.push(demon);
    }

    if (isCompleted) {
      completed.push(demon);

      if (pos <= 75) main++;
      else if (pos <= 150) extended++;
      else legacy++;
    }

    if (Array.isArray(demon.creators) && demon.creators.some(c => normalizeName(c) === key)) {
      created.push(demon);
    } else if (normalizeName(demon.creators) === key) {
      created.push(demon);
    }
  });

  return { main, extended, legacy, completed, created, verified };
}

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
function createPlayerCard(name, score, rank) {
  const hardest = getPlayerHardestDemon(name);
  const t = getPlayerTier(hardest);
  const tierColor = getTierColor(t.tier);
  const segmentColor = getSegmentColor(t.segment);
  const title = getPlayerTitle(t.segment, t.tier);

  const hardestName = hardest ? `#${hardest.position} — ${hardest.name}` : "None";

  const card = document.createElement("div");
  card.className = "player-card no-image";

  const info = document.createElement("div");
  info.className = "player-info";

  const tierHtml = t.tier
    ? `<span style="color:${segmentColor}; font-weight:600;">${t.segment}</span>
       <span style="color:${tierColor}; font-weight:600;">Tier ${t.tier}</span>`
    : `<span style="color:#888; font-weight:600;">Unranked</span>`;

  info.innerHTML = `
    <h2>#${rank} — ${cleanDisplayName(name)}</h2>
    <p><strong>Score:</strong> ${score.toFixed(2)}</p>
    <p><strong>Player Tier:</strong> ${tierHtml}</p>
    <p><strong>Title:</strong> ${title}</p>
    <p><strong>Hardest Demon:</strong> ${hardestName}</p>
  `;

  card.appendChild(info);

  card.addEventListener("click", () => openPlayerPage(normalizeName(name), window._leaderboardScores));

  return card;
}

function openPlayerPage(key, scores) {
  stopAllVideos();

  const playerName = window._playerMap.get(key) || key;
  const container = document.getElementById("leaderboard-container");
  if (!container) return;

  const stats = getPlayerStats(playerName);
  const hardest = getPlayerHardestDemon(playerName);
  const t = getPlayerTier(hardest);
  const tierColor = getTierColor(t.tier);
  const segmentColor = getSegmentColor(t.segment);
  const title = getPlayerTitle(t.segment, t.tier);

  const tierHtml = t.tier
    ? `<span style="color:${segmentColor}; font-weight:600;">${t.segment}</span>
       <span style="color:${tierColor}; font-weight:600;">Tier ${t.tier}</span>`
    : `<span style="color:#888; font-weight:600;">Unranked</span>`;

  const hardestName = hardest ? `#${hardest.position} — ${hardest.name}` : "None";

  const completedList = stats.completed
    .sort((a, b) => a.position - b.position)
    .map(d => `<li>#${d.position} — ${d.name}</li>`)
    .join("");

  const createdList = stats.created
    .sort((a, b) => a.position - b.position)
    .map(d => `<li>#${d.position} — ${d.name}</li>`)
    .join("");

  const verifiedList = stats.verified
    .sort((a, b) => a.position - b.position)
    .map(d => `<li>#${d.position} — ${d.name}</li>`)
    .join("");

  const score = scores[key] || 0;

  container.innerHTML = `
    <div class="player-profile">
      <div class="player-profile-header">
        <h1>${cleanDisplayName(playerName)}</h1>
        <p><strong>Score:</strong> ${score.toFixed(2)}</p>
        <p><strong>Player Tier:</strong> ${tierHtml}</p>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Hardest Demon:</strong> ${hardestName}</p>
        <p><strong>Main List Completed:</strong> ${stats.main}</p>
        <p><strong>Extended List Completed:</strong> ${stats.extended}</p>
        <p><strong>Legacy List Completed:</strong> ${stats.legacy}</p>
      </div>

      <div class="player-profile-section">
        <h2>Completed Demons</h2>
        <ul>${completedList || "<li>None</li>"}</ul>
      </div>

      <div class="player-profile-section">
        <h2>Verified Demons</h2>
        <ul>${verifiedList || "<li>None</li>"}</ul>
      </div>

      <div class="player-profile-section">
        <h2>Created Demons</h2>
        <ul>${createdList || "<li>None</li>"}</ul>
      </div>
    </div>
  `;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setupPlayerSearch() {
  const input = document.getElementById("player-search");
  const select = document.getElementById("leaderboard-filter");
  if (input) {
    input.addEventListener("input", () => {
      loadLeaderboard();
    });
  }
  if (select) {
    select.addEventListener("change", () => {
      loadLeaderboard();
    });
  }
}

function loadLeaderboard() {
  stopAllVideos();

  const container = document.getElementById("leaderboard-container");
  if (!container) return;

  container.innerHTML = "";
  for (let i = 0; i < 6; i++) container.appendChild(createPlaceholderPlayer());

  setTimeout(() => {
    const playerMap = new Map();

    globalDemons.forEach(demon => {
      if (hideCheated && cheatedList.includes(demon.name.toLowerCase())) return;

      if (demon.verifier && !bannedPlayers.includes(demon.verifier)) {
        if (!(hideCheated && demon.verifier.toLowerCase().includes("[c]"))) {
          const key = normalizeName(demon.verifier);
          if (!playerMap.has(key)) playerMap.set(key, demon.verifier);
        }
      }

      demon.records.forEach(r => {
        const record = typeof r === "string"
          ? { user: r, percent: 100 }
          : { user: r.user, percent: r.percent || 100 };

        if (!record.user || record.user === "Not beaten yet") return;
        if (bannedPlayers.includes(record.user)) return;
        if (hideCheated && record.user.toLowerCase().includes("[c]")) return;

        const key = normalizeName(record.user);
        if (!playerMap.has(key)) playerMap.set(key, record.user);
      });
    });

    window._playerMap = playerMap;

    const scores = {};
    playerMap.forEach((display, key) => {
      scores[key] = 0;
    });

    globalDemons.forEach(demon => {
      if (demon.position > 150) return;
      if (hideCheated && cheatedList.includes(demon.name.toLowerCase())) return;

      const baseScore = 350 / Math.sqrt(demon.position);

      demon.records.forEach(r => {
        const record = typeof r === "string"
          ? { user: r, percent: 100 }
          : { user: r.user, percent: r.percent || 100 };

        const p = record.user;
        if (!p || p === "Not beaten yet") return;
        if (bannedPlayers.includes(p)) return;
        if (hideCheated && p.toLowerCase().includes("[c]")) return;

        if (record.percent >= demon.percentToQualify) {
          const key = normalizeName(p);
          const earned = record.percent === 100 ? baseScore : baseScore * (record.percent / 100);
          if (scores[key] !== undefined) scores[key] += earned;
        }
      });

      const verifier = demon.verifier;
      if (verifier && !bannedPlayers.includes(verifier)) {
        if (!(hideCheated && verifier.toLowerCase().includes("[c]"))) {
          const key = normalizeName(verifier);
          if (scores[key] !== undefined) scores[key] += baseScore;
        }
      }
    });

    window._leaderboardScores = scores;

    const searchQuery = document.getElementById("player-search")?.value.toLowerCase() || "";
    const filterMode = document.getElementById("leaderboard-filter")?.value || "points";

    let sorted = Object.entries(scores)
      .filter(([key, score]) => score > 0)
      .map(([key, score]) => {
        const name = playerMap.get(key);
        const hardest = getPlayerHardestDemon(name);
        const t = getPlayerTier(hardest);
        return {
          key,
          name,
          score,
          tier: t.tier || 0,
          segment: t.segment
        };
      })
      .filter(p => p.name.toLowerCase().includes(searchQuery));

    const segmentRank = { High: 3, Mid: 2, Low: 1, Unranked: 0 };

    if (filterMode === "points") {
      sorted.sort((a, b) => b.score - a.score);
    } else if (filterMode === "tier") {
      sorted.sort((a, b) =>
        b.tier - a.tier ||
        segmentRank[b.segment] - segmentRank[a.segment] ||
        b.score - a.score
      );
    }

    container.innerHTML = "";

    sorted.forEach((p, index) => {
      container.appendChild(createPlayerCard(p.name, p.score, index + 1));
    });

    if (sorted.length === 0) {
      container.innerHTML = "<p>No players with scores yet.</p>";
    }
  }, 500);
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
