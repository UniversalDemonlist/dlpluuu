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
let challengeList = [];

window._leaderboardScores = {};
window._playerMap = new Map();

function normalizeName(name) {
  if (typeof name !== "string") return "";
  return name.replace("[c]", "").replace("[C]", "").trim().toLowerCase();
}

function getDemonDifficulty(demon) {
  const name = demon.name.toLowerCase();

  if (demon.position && demon.position <= 150) return "list";
  if (name.includes("extreme")) return "extreme";
  if (name.includes("insane")) return "insane";
  if (name.includes("hard")) return "hard";
  if (name.includes("medium")) return "medium";
  if (name.includes("easy")) return "easy";

  return "unknown";
}


document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupThemeToggle();
  loadEverything();
  setupSearchBar();
  setupDropdownSelects();
  setupPlayerSearch();
  setupSubTabs();
  setupLeaderboardSubTabs();


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

function getPlayerRank(score) {
  if (score >= 5000) return "Mythic";
  if (score >= 3500) return "Champion";
  if (score >= 2000) return "Diamond";
  if (score >= 1000) return "Platinum";
  if (score >= 500) return "Gold";
  if (score >= 200) return "Silver";
  return "Bronze";
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
    await loadChallengeList();
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
async function loadChallengeList() {
  const list = await fetch("data/challenge_list.json").then(r => r.json());

  const challengeFiles = await Promise.all(
    list.map((id, index) =>
      fetch(`data/demons/${id}.json`)
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null)
        .then(d => d ? { ...d, position: index + 1 } : null)
    )
  );

  challengeList = challengeFiles.filter(Boolean);
}



function renderChallengeCards() {
  stopAllVideos();
  const container = document.getElementById("challenge-container");
  if (!container) return;

  container.innerHTML = "";
  for (let i = 0; i < 6; i++) container.appendChild(createPlaceholderCard());

  setTimeout(() => {
    container.innerHTML = "";
    challengeList.forEach(d => container.appendChild(createDemonCard(d)));
  }, 500);
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

  const notUsable = ["112313819", "88201288", "109780665", "0"];

  const bg =
    demon.background ||
    (
      !notUsable.includes(String(demon.id))
        ? `https://levelthumbs.prevter.me/thumbnail/${demon.id}`
        : ""
    );

  card.style.setProperty("--card-bg", `url('${bg}')`);

  const img = document.createElement("img");
  img.src =
    demon.thumbnail ||
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
  if (diff === "list") return "data/extreme.png";
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
      const entry = {
        name: demon.name,
        background: demon.background || demon.thumbnail || "",
        difficulty: demon.position <= 150 ? "list" : "extreme"
      };

      if (entry.difficulty === "list") listDemons.push(entry);
      else extremeDemons.push(entry);
    }
  });

  manualCompleted.forEach(m => {
    if (normalizeName(m.player) !== key) return;

    const diff = m.difficulty.toLowerCase();

    const entry = {
      name: m.name,
      background: m.background || "",
      difficulty: diff
    };

    if (diff === "insane") insaneDemons.push(entry);
    if (diff === "hard") hardDemons.push(entry);
    if (diff === "medium") mediumDemons.push(entry);
    if (diff === "easy") easyDemons.push(entry);
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




function createPlayerCard(name, score, rank) {
  const hardest = getPlayerHardestDemon(name);
  const t = getPlayerTier(hardest);
  const tierColor = getTierColor(t.tier);
  const segmentColor = getSegmentColor(t.segment);

  const rankColor = {
    Mythic: "#a020f0",
    Champion: "#ff00ff",
    Diamond: "#00bfff",
    Platinum: "#e5e4e2",
    Gold: "#ffd700",
    Silver: "#c0c0c0",
    Bronze: "#cd7f32"
  }[getPlayerRank(score)];

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
    <p><strong>Rank:</strong> <span style="color:${rankColor}; font-weight:600;">${getPlayerRank(score)}</span></p>
    <p><strong>Player Tier:</strong> ${tierHtml}</p>
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
  const score = scores[key] || 0;

  const rank = getPlayerRank(score);

  const rankColor = {
    Mythic: "#a020f0",
    Champion: "#ff00ff",
    Diamond: "#00bfff",
    Platinum: "#e5e4e2",
    Gold: "#ffd700",
    Silver: "#c0c0c0",
    Bronze: "#cd7f32"
  }[rank];

  function buildSection(title, arr) {
    return `
      <div class="player-profile-section">
        <h2>${title}</h2>
        <div class="completed-grid">
          ${arr.map(d => `
            <div class="completed-card fancy-completed" style="background-image:url('${d.background}')">
              <div class="completed-overlay"></div>
              <div class="completed-info">
                <h3>${d.name}</h3>
                <img src="${getDifficultyFace(d.difficulty)}" class="difficulty-face">
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="player-profile">
      <div class="player-profile-header">
        <h1>${cleanDisplayName(playerName)}</h1>
        <p><strong>Score:</strong> ${score.toFixed(2)}</p>
        <p><strong>Rank:</strong> <span style="color:${rankColor}; font-weight:600;">${rank}</span></p>
      </div>

      ${buildSection("List Demons", stats.listDemons)}
      ${buildSection("Extreme Demons", stats.extremeDemons)}
      ${buildSection("Insane Demons", stats.insaneDemons)}
      ${buildSection("Hard Demons", stats.hardDemons)}
      ${buildSection("Medium Demons", stats.mediumDemons)}
      ${buildSection("Easy Demons", stats.easyDemons)}
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

async function loadLeaderboard() {
  stopAllVideos();

  const container = document.getElementById("leaderboard-container");
  if (!container) return;

  container.innerHTML = "";
  for (let i = 0; i < 6; i++) container.appendChild(createPlaceholderPlayer());

  const manualPoints = await fetch("data/manualpoints.json").then(r => r.json()).catch(() => []);

  setTimeout(() => {
    const playerMap = new Map();

    playersList.forEach(p => {
      const key = normalizeName(p);
      if (!bannedPlayers.includes(p)) playerMap.set(key, p);
    });

    manualCompleted.forEach(m => {
      const key = normalizeName(m.player);
      if (!playerMap.has(key)) playerMap.set(key, m.player);
    });

    manualPoints.forEach(mp => {
      const key = normalizeName(mp.player);
      if (!playerMap.has(key)) playerMap.set(key, mp.player);
    });

    globalDemons.forEach(demon => {
      if (demon.verifier && !bannedPlayers.includes(demon.verifier)) {
        const key = normalizeName(demon.verifier);
        if (!playerMap.has(key)) playerMap.set(key, demon.verifier);
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
      if (hideCheated && cheatedList.includes(demon.name.toLowerCase())) return;

      const pos = demon.position || 999;
      const baseScore = 350 / Math.sqrt(pos);

      demon.records.forEach(r => {
        const record = typeof r === "string"
          ? { user: r, percent: 100 }
          : { user: r.user, percent: r.percent || 100 };

        const p = record.user;
        if (!p || p === "Not beaten yet") return;
        if (bannedPlayers.includes(p)) return;
        if (hideCheated && p.toLowerCase().includes("[c]")) return;

        const key = normalizeName(p);
        if (scores[key] === undefined) return;

        const earned = record.percent === 100
          ? baseScore
          : baseScore * (record.percent / 100);

        scores[key] += earned;
      });

      const verifier = demon.verifier;
      if (verifier && !bannedPlayers.includes(verifier)) {
        const key = normalizeName(verifier);
        if (scores[key] !== undefined) scores[key] += baseScore;
      }
    });

    manualCompleted.forEach(m => {
      const key = normalizeName(m.player);
      if (scores[key] === undefined) return;

      const diff = m.difficulty.toLowerCase();
      const mult = {
        easy: 0.20,
        medium: 0.40,
        hard: 0.60,
        insane: 0.80
      }[diff] || 0.20;

      const baseScore = 350 * mult;
      scores[key] += baseScore;
    });

    manualPoints.forEach(mp => {
      const key = normalizeName(mp.player);
      if (scores[key] !== undefined) scores[key] += Number(mp.extrapoints) || 0;
    });

    window._leaderboardScores = scores;

    const searchQuery = (document.getElementById("player-search")?.value || "").toLowerCase();
    const filterMode = document.getElementById("leaderboard-filter")?.value || "points";

    let sorted = Object.entries(scores)
      .map(([key, score]) => {
        const name = playerMap.get(key);
        const hardest = getPlayerHardestDemon(name);
        const t = getPlayerTier(hardest);
        return {
          key,
          name,
          score,
          tier: t.tier || 0,
          segment: t.segment,
          rankName: getPlayerRank(score)
        };
      })
      .filter(p => {
        if (!searchQuery.trim()) return true;
        return cleanDisplayName(p.name).toLowerCase().includes(searchQuery);
      });

    const segmentRank = { High: 3, Mid: 2, Low: 1, Unranked: 0 };

    if (filterMode === "points") {
      sorted.sort((a, b) => b.score - a.score);
    } else if (filterMode === "tier") {
      sorted.sort((a, b) =>
        b.tier - a.tier ||
        segmentRank[b.segment] - segmentRank[a.segment] ||
        b.score - a.score
      );
    } else if (filterMode === "rank") {
      const order = ["Mythic", "Champion", "Diamond", "Platinum", "Gold", "Silver", "Bronze"];
      sorted.sort((a, b) => order.indexOf(a.rankName) - order.indexOf(b.rankName));
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

function setupSubTabs() {
  const buttons = document.querySelectorAll(".subtab-btn");
  const contents = document.querySelectorAll(".subtab-content");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.subtab;

      buttons.forEach(b => b.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(tab).classList.add("active");

      if (tab === "demons") renderDemonCards();
      if (tab === "challenges") renderChallengeCards();
    });
  });
}
function renderChallengeCards() {
  stopAllVideos();
  const container = document.getElementById("challenge-container");
  if (!container) return;

  container.innerHTML = "";
  for (let i = 0; i < 6; i++) container.appendChild(createPlaceholderCard());

  setTimeout(() => {
    container.innerHTML = "";
    challengeList.forEach(d => container.appendChild(createDemonCard(d)));
  }, 500);
}

async function loadChallengeLeaderboard() {
  stopAllVideos();

  const container = document.getElementById("challenge-leaderboard-container");
  if (!container) return;

  container.innerHTML = "";
  for (let i = 0; i < 6; i++) container.appendChild(createPlaceholderPlayer());

  setTimeout(() => {
    const playerMap = new Map();
    const scores = {};

    challengeList.forEach(ch => {
      if (ch.verifier && !bannedPlayers.includes(ch.verifier)) {
        const key = normalizeName(ch.verifier);
        if (!playerMap.has(key)) playerMap.set(key, ch.verifier);
      }

      ch.records.forEach(r => {
        const record = typeof r === "string"
          ? { user: r, percent: 100 }
          : { user: r.user, percent: r.percent || 100 };

        const p = record.user;
        if (!p || p === "Not beaten yet") return;
        if (bannedPlayers.includes(p)) return;
        if (hideCheated && p.toLowerCase().includes("[c]")) return;

        const key = normalizeName(p);
        if (!playerMap.has(key)) playerMap.set(key, p);
      });
    });

    playerMap.forEach((display, key) => {
      scores[key] = 0;
    });

    challengeList.forEach(ch => {
      const pos = ch.position || 999;
      const baseScore = 350 / Math.sqrt(pos);

      ch.records.forEach(r => {
        const record = typeof r === "string"
          ? { user: r, percent: 100 }
          : { user: r.user, percent: r.percent || 100 };

        const p = record.user;
        if (!p || p === "Not beaten yet") return;
        if (bannedPlayers.includes(p)) return;
        if (hideCheated && p.toLowerCase().includes("[c]")) return;

        const key = normalizeName(p);
        if (scores[key] === undefined) return;

        const earned = record.percent === 100
          ? baseScore
          : baseScore * (record.percent / 100);

        scores[key] += earned;
      });

      const verifier = ch.verifier;
      if (verifier && !bannedPlayers.includes(verifier)) {
        const key = normalizeName(verifier);
        if (scores[key] !== undefined) scores[key] += baseScore;
      }
    });

    container.innerHTML = "";

    Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .forEach(([key, score], index) => {
        const name = playerMap.get(key);
        container.appendChild(createPlayerCard(name, score, index + 1));
      });
  }, 500);
}


function setupLeaderboardSubTabs() {
  const buttons = document.querySelectorAll(".leaderboard-subtab-btn");
  const contents = document.querySelectorAll(".leaderboard-subtab-content");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.lb;

      buttons.forEach(b => b.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(tab).classList.add("active");

      if (tab === "main-lb") loadLeaderboard();
      if (tab === "challenge-lb") loadChallengeLeaderboard();
    });
  });
}



function cleanDisplayName(name) {
  if (typeof name !== "string") return "";
  return name.replace("[c]", "").replace("[C]", "").trim();
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

