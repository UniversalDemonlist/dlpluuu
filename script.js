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

function getPlayerRank(score) {
  if (score >= 5000) return "Mythic";
  if (score >= 3500) return "Champion";
  if (score >= 2000) return "Diamond";
  if (score >= 1000) return "Platinum";
  if (score >= 500) return "Gold";
  if (score >= 200) return "Silver";
  return "Bronze";
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

    const searchQuery = document.getElementById("player-search")?.value.toLowerCase() || "";
    const filterMode = document.getElementById("leaderboard-filter")?.value || "points";

    let sorted = Object.entries(scores)
      .map(([key, score]) => {
        const name = playerMap.get(key);
        return {
          key,
          name,
          score,
          rankName: getPlayerRank(score)
        };
      })
      .filter(p => cleanDisplayName(p.name).toLowerCase().includes(searchQuery));

    if (filterMode === "points") {
      sorted.sort((a, b) => b.score - a.score);
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
      const diff = getDemonDifficulty(demon);

      if (diff === "list") listDemons.push(demon);
      if (diff === "extreme") extremeDemons.push(demon);
      if (diff === "insane") insaneDemons.push(demon);
      if (diff === "hard") hardDemons.push(demon);
      if (diff === "medium") mediumDemons.push(demon);
      if (diff === "easy") easyDemons.push(demon);
    }
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
  const card = document.createElement("div");
  card.className = "player-card no-image";

  const info = document.createElement("div");
  info.className = "player-info";

  info.innerHTML = `
    <h2>#${rank} — ${cleanDisplayName(name)}</h2>
    <p><strong>Score:</strong> ${score.toFixed(2)}</p>
    <p><strong>Rank:</strong> ${getPlayerRank(score)}</p>
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

  function buildSection(title, arr) {
    return `
      <div class="player-profile-section">
        <h2>${title}</h2>
        <div class="completed-grid">
          ${arr.map(d => `
            <div class="completed-card fancy-completed" style="background-image:url('${d.background || ""}')">
              <div class="completed-overlay"></div>
              <div class="completed-info">
                <h3>${d.name}</h3>
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
        <p><strong>Rank:</strong> ${getPlayerRank(score)}</p>
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
