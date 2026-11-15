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
let disableSpaceUK = true;

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
  initMegaMenu();
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

const spaceUKBtn = document.getElementById("spaceuk-toggle");

if (spaceUKBtn) {
  updateSpaceUKButton();

  spaceUKBtn.addEventListener("click", () => {
  disableSpaceUK = !disableSpaceUK;

    rebuildVisibleLists();

    updateSpaceUKButton();

     renderDemonCards();
     loadLeaderboard();
  });
}

function getPlayerRank(score) {
  if (score >= 100000) return "Legend";
  if (score >= 50000) return "Absolute";

  if (score >= 10000) return "Mythic II";
  if (score >= 5000) return "Mythic I";

  if (score >= 4250) return "Champion II";
  if (score >= 3500) return "Champion I";

  if (score >= 2750) return "Diamond II";
  if (score >= 2000) return "Diamond I";

  if (score >= 1500) return "Platinum II";
  if (score >= 1000) return "Platinum I";

  if (score >= 750) return "Gold II";
  if (score >= 500) return "Gold I";

  if (score >= 350) return "Silver II";
  if (score >= 200) return "Silver I";

  if (score >= 100) return "Bronze II";
  return "Bronze I";
}

function getLevelBadge(position) {
  if (!position) return "data/level1.png";

  if (position <= 10) return "data/challenger.png";
  if (position <= 25) return "data/level10.png";
  if (position <= 50) return "data/level9.png";
  if (position <= 75) return "data/level8.png";
  if (position <= 100) return "data/level7.png";
  if (position <= 150) return "data/level6.png";
  if (position <= 200) return "data/level5.png";
  if (position <= 275) return "data/level4.png";
  if (position <= 350) return "data/level3.png";
  if (position <= 500) return "data/level2.png";

  return "data/level1.png";
}

function getDifficultyInfo(position) {
  if (position <= 5) {
    return {
      name: "Unreal",
      color: "#000000",
      outline: "#5100CB"
    };
  }

  if (position <= 10) {
    return {
      name: "Horrific",
      color: "#000000",
      outline: "#9695FF"
    };
  }

  if (position <= 20) {
    return {
      name: "Catastrophic",
      color: "#FFFFFF"
    };
  }

  if (position <= 35) {
    return {
      name: "Terrifying",
      color: "#00FFFF"
    };
  }

  if (position <= 50) {
    return {
      name: "Extreme",
      color: "#0389FF"
    };
  }

  if (position <= 155) {
    return {
      name: "Insane",
      color: "#0000FF"
    };
  }

  if (position <= 900) {
    return {
      name: "Check Difficulty In Discord",
      color: "#A00000"
    };
  }
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
  const [players, banned, method, path, cheated, manual] = await Promise.all([
    fetch("data/players.json").then(r => r.json()).catch(() => []),
    fetch("data/banned.json").then(r => r.json()).catch(() => []),
    fetch("data/method.json").then(r => r.json()).catch(() => []),
    fetch("data/path.json").then(r => r.json()).catch(() => []),
    fetch("data/cheated.json").then(r => r.json()).catch(() => []),
    fetch("data/manualcompleted.json").then(r => r.json()).catch(() => [])
  ]);

  playersList = players;
  bannedPlayers = banned;
  methodList = method;
  pathList = path;
  cheatedList = cheated.map(x => x.toLowerCase());
  manualCompleted = manual;

  updateHomeStats();
  await loadDemonList();
  await loadChallengeList();
}

function animateStatValue(el, target) {
  if (!el) return;
  const safeTarget = Math.max(1, target);
  el.dataset.currentVal = safeTarget;
  el.textContent = safeTarget.toLocaleString();
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
    btn.addEventListener("click", (e) => {
      const tab = btn.getAttribute("data-tab");
      
      if (!tab) return;
      
      const targetContent = document.getElementById(tab);
      if (!targetContent) return;

      stopAllVideos();

      buttons.forEach(b => b.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));

      btn.classList.add("active");
      targetContent.classList.add("active");

      window.scrollTo({ top: 0, behavior: "smooth" });

      if (tab === "leaderboard") loadLeaderboard();
    });
  });
}

function getVisibleDemons() {
  let newPosition = 1;

  return globalDemons
    .map(demon => {
      let records = (demon.records || []).map(r => {
        if (typeof r === "string") {
          return { user: r, percent: 100, link: "" };
        }
        return { user: r.user || "", percent: r.percent || 100, link: r.link || "" };
      });

      if (disableSpaceUK) {
        records = records.filter(r => !r.user.toLowerCase().includes("[c]"));
      }

      let verifier = demon.verifier || "Unknown";
      let verifierIsCheater = verifier.toLowerCase().includes("[c]");

      if (disableSpaceUK && verifierIsCheater) {
        if (records.length > 0) {
          verifier = records[0].user;
        } else {
          return null;
        }
      }

      return {
        ...demon,
        verifier,
        records,
        position: demon.cosmetic ? null : newPosition++
      };
    })
    .filter(Boolean);
}

function openDemonPage(demon) {
  stopAllVideos();
  const container = document.getElementById("demon-page-container");
  if (!container) return;

  const notUsable = ["112313819", "88201288", "109780665", "0"];
  const levelThumb = !notUsable.includes(String(demon.id))
    ? "https://prevter.me" + demon.id
    : "";

  const videoUrl = demon.verification || demon.video || demon.showcase || "";

  const thumb =
    (demon.thumbnail && demon.thumbnail.trim()) ||
    getYoutubeThumbnail(videoUrl) ||
    levelThumb ||
    "";

  const score = demon.position
    ? 5500 / Math.sqrt(demon.position)
    : 5500 / Math.sqrt(999);

  const videoId = getYoutubeId(videoUrl);
  const embedBase = ["https://youtube.com", "embed", videoId].join("/");
  const iframeSrc = videoId ? embedBase : "";
  const videoBlock = iframeSrc
    ? '<div class="dp-video-wrap"><iframe src="' + iframeSrc + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>'
    : '<div class="dp-video-wrap"><img src="' + thumb + '" alt="' + demon.name + '"></div>';

  const displayVerifier = cleanDisplayName(demon.verifier || "Unknown");

  const descHtml = demon.description
    ? '<p class="dp-description">' + demon.description + '</p>'
    : "";

  const levelPassword = demon.password || "Free Copy";

  const validRecords = (demon.records || [])
    .map(r =>
      typeof r === "string"
        ? { user: r, percent: 100, link: "" }
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
      const vid = r.link
        ? '<a href="' + r.link + '" target="_blank" rel="noopener noreferrer" class="dp-record-link">Video ▶</a>'
        : '<span style="opacity:0.5;">No video</span>';
      return (
        '<div class="dp-record-row">' +
          '<span class="dp-record-user">' + cleanDisplayName(r.user) + '</span>' +
          '<div class="dp-record-right">' +
            '<span class="dp-record-pct">' + r.percent + '%</span>' +
            vid +
          '</div>' +
        '</div>'
      );
    })
    .join("");

  const rankBadge = demon.position
    ? '<span class="dp-rank-pill">#' + demon.position + '</span>'
    : "";

  container.innerHTML =
    '<div class="dp-main-card">' +
      '<div class="dp-header">' +
        '<div class="dp-title-row">' +
          rankBadge +
          '<h1 class="dp-title">' + demon.name + '</h1>' +
        '</div>' +
      '</div>' +
      '<div class="dp-verifier-bar">' +
        '<span class="dp-verifier-check">✓</span>' +
        '<span>Verified by <span class="dp-verifier-name">' + displayVerifier + '</span></span>' +
      '</div>' +
      descHtml +
      videoBlock +
    '</div>' +
    '<div class="dp-info-grid">' +
      '<div class="dp-info-box">' +
        '<div class="dp-info-lbl">PASSWORD</div>' +
        '<div class="dp-info-val">' + levelPassword + '</div>' +
      '</div>' +
      '<div class="dp-info-box">' +
        '<div class="dp-info-lbl">SCORE</div>' +
        '<div class="dp-info-val">' + score.toFixed(2) + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="dp-records-card">' +
      '<h2>Records</h2>' +
      '<div class="dp-record-list">' +
        (validRecords || '<p style="opacity:0.6;margin:0;">No records yet.</p>') +
      '</div>' +
    '</div>';

  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  document.getElementById("demon-page").classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}




function createDemonCard(demon) {
  const card = document.createElement("div");
  card.className = "demon-card";

  const img = document.createElement("img");
  img.src =
    demon.thumbnail ||
    getYoutubeThumbnail(demon.verification) ||
    "https://placeholder.com";

  const info = document.createElement("div");
  info.className = "demon-info";

  const score = demon.position
    ? 5500 / Math.sqrt(demon.position)
    : 5500 / Math.sqrt(999);

  const listPercent = demon.percentToQualify || 100;
  const minScore = score * (listPercent / 100);
  const difficulty = getDifficultyInfo(demon.position);

  if (demon.cosmetic) {
    info.innerHTML = `
      <h2>${demon.name}</h2>
      <p class="demon-meta-line">Levels past this zone are harder than ${demon.name}</p>
    `;
  } else if (demon.missingJson) {
    info.innerHTML = `
      <h2><span class="demon-rank">#${demon.position}</span> ${demon.name}</h2>
      <p style="color:#ff3232;font-weight:700;margin:0;">
        JSON NOT FOUND!
      </p>
    `;
  } else {
    const creatorHtml = demon.author
      ? `<span class="demon-creator">${demon.author}</span>`
      : "";

    info.innerHTML = `
      <h2><span class="demon-rank">#${demon.position}</span> ${demon.name}</h2>
      <p class="demon-meta-line">
        ${creatorHtml}
        <span class="demon-verifier">${demon.verifier}</span>
        <span class="demon-dot">•</span>
        <span>${minScore.toFixed(2)} — <span class="demon-score">${score.toFixed(2)}</span> points</span>
      </p>
      <p class="demon-diff-line">
        <strong>Difficulty:</strong>
        <span
          style="
            color:${difficulty.outline ? "#000000" : difficulty.color};
            font-weight:700;
            ${
              difficulty.outline
                ? `-webkit-text-stroke: 1px ${difficulty.outline};`
                : ""
            }
          "
        >
          ${difficulty.name}
        </span>
      </p>
    `;
  }

  card.appendChild(img);
  card.appendChild(info);

  card.addEventListener("click", () => openDemonPage(demon));

  return card;
}

function createPlayerCard(name, score, rank) {
  const hardest = getPlayerHardestDemon(name);
  const t = getPlayerTier(hardest);
  const tierColor = getTierColor(t.tier);
  const segmentColor = getSegmentColor(t.segment);

  const rankColor = {
    Legend: "#ff3030",
    Absolute: "#a020f0",
    "Mythic II": "#ff00ff",
    "Mythic I": "#d400d4",
    "Champion II": "#00bfff",
    "Champion I": "#0099cc",
    "Diamond II": "#7df9ff",
    "Diamond I": "#4fd6ff",
    "Platinum II": "#e5e4e2",
    "Platinum I": "#cfcfcf",
    "Gold II": "#ffd700",
    "Gold I": "#d4af37",
    "Silver II": "#c0c0c0",
    "Silver I": "#a8a8a8",
    "Bronze II": "#cd7f32",
    "Bronze I": "#a97142"
  }[getPlayerRank(score)];

  const hardestName = hardest ? `#${hardest.position} — ${hardest.name}` : "None";

  const card = document.createElement("div");
  card.className = "player-card no-image";
  
  const badge = document.createElement("img");
  badge.className = "rank-badge";
  badge.src = getLevelBadge(hardest?.position);
  card.appendChild(badge);

  const info = document.createElement("div");
  info.className = "player-info";

  info.innerHTML = `
    <h2>#${rank} — ${cleanDisplayName(name)}</h2>
    <p><strong>Score:</strong> ${score.toFixed(2)}</p>
    <p><strong>Rank:</strong> <span class="${
      getPlayerRank(score) === "Legend"
        ? "rank-legend"
        : getPlayerRank(score) === "Absolute"
        ? "rank-absolute"
        : getPlayerRank(score).includes("Mythic")
        ? "rank-mythic"
        : ""
    }" style="color:${rankColor}; font-weight:600;">
      ${getPlayerRank(score)}
    </span></p>
    <p><strong>Hardest Demon:</strong> ${hardestName}</p>
  `;

  card.appendChild(info);
  card.addEventListener("click", () => openPlayerPage(normalizeName(name), window._leaderboardScores));

  return card;
}

function createDemonCard(demon) {
  const card = document.createElement("div");
  card.className = "demon-card";

  const notUsable = ["112313819", "88201288", "109780665", "0"];
  const bg = demon.background || (!notUsable.includes(String(demon.id)) ? `https://prevter.me{demon.id}` : "");
  card.style.setProperty("--card-bg", `url('${bg}')`);

  const img = document.createElement("img");
  img.src = demon.thumbnail || getYoutubeThumbnail(demon.verification) || "https://placeholder.com";

  const info = document.createElement("div");
  info.className = "demon-info";

  const score = demon.position ? 5500 / Math.sqrt(demon.position) : 5500 / Math.sqrt(999);
  const difficulty = getDifficultyInfo(demon.position);
  let displayVerifier = cleanDisplayName(demon.verifier);

  if (demon.cosmetic) {
    info.innerHTML = `
      <h2>${demon.name}</h2>
      <p>Levels past this zone are harder than ${demon.name}</p>
    `;
  } else if (demon.missingJson) {
    info.innerHTML = `
      <h2>#${demon.position} — ${demon.name}</h2>
      <p style="color:#ff3232;font-weight:700;">JSON NOT FOUND!</p>
    `;
  } else {
    info.innerHTML = `
      <h2>#${demon.position} — ${demon.name}</h2>
      <p>Verifier: ${displayVerifier}</p>
      <p>Score: ${score.toFixed(2)}</p>
      <p>
        <strong>Difficulty:</strong>
        <span style="color:${difficulty.outline ? "#000000" : difficulty.color}; font-weight:700; ${difficulty.outline ? `-webkit-text-stroke: 1px ${difficulty.outline};` : ""}">
          ${difficulty.name}
        </span>
      </p>
    `;
  }

  card.appendChild(img);
  card.appendChild(info);
  card.addEventListener("click", () => openDemonPage(demon));

  return card;
}



async function loadDemonList() {
  const list = await fetch("data/list.json").then(r => r.json());

  const demonFiles = await Promise.all(
    list.map(entry => {
      const id = typeof entry === "string" ? entry : entry.id;

      return fetch(`data/demons/${id}.json`)
        .then(r => {
          if (r.ok) return r.json();

          return {
            id,
            name:
              typeof entry === "object"
                ? (entry.name || id)
                : id.replace(".json", ""),
            verifier: "Unknown",
            records: [],
            missingJson: true
          };
        })
        .catch(() => ({
          id,
          name:
            typeof entry === "object"
              ? (entry.name || id)
              : id.replace(".json", ""),
          verifier: "Unknown",
          records: [],
          missingJson: true
        }))
        .then(d => {
          if (typeof entry === "object") {
            d.cosmetic = entry.cosmetic || null;
          }
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

  mainList = globalDemons.filter(
    d => !d.cosmetic && d.position <= 75
  );

  extendedList = globalDemons.filter(
    d => !d.cosmetic && d.position > 75 && d.position <= 100
  );

  legacyList = globalDemons.filter(
    d => !d.cosmetic && d.position > 100
  );

  renderDemonCards();
  renderMegaMenuGrid();
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

  let list = listOverride || getVisibleDemons();

  if (hideCheated) {
    list = list.filter(d => !cheatedList.includes(d.id.toLowerCase()));
  }

  setTimeout(() => {
    container.innerHTML = "";
    list.forEach(d => container.appendChild(createDemonCard(d)));
  }, 500);
}

const LIST_DESCRIPTIONS = {
  main: "The main section of the Demonlist. These demons are the hardest levels in the game. Records are accepted above a given threshold and award a large amount of points!",
  extended: "The extended section of the Demonlist (ranks 76–150). Records are still accepted and award points toward the leaderboard.",
  legacy: "The beyond section of the Demonlist (ranks 151+). These levels award list points, and might be accessible."
};

let activeMenuCategory = null;

function initMegaMenu() {
  const wrapper = document.getElementById("demon-megamenu");
  const panel = document.getElementById("megamenu-panel");
  const tabs = document.querySelectorAll(".megamenu-tab");

  if (!wrapper || !panel) return;

  tabs.forEach(tab => {
    tab.addEventListener("click", (e) => {
      e.stopPropagation();
      const category = tab.dataset.list;

      if (activeMenuCategory === category && panel.classList.contains("open")) {
        closeMegaMenu();
        return;
      }

      activeMenuCategory = category;
      tabs.forEach(t => t.classList.toggle("active", t === tab));
      panel.classList.add("open");
      renderMegaMenuGrid();
    });
  });

  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) closeMegaMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMegaMenu();
  });
}

function closeMegaMenu() {
  const panel = document.getElementById("megamenu-panel");
  if (panel) panel.classList.remove("open");
  document.querySelectorAll(".megamenu-tab").forEach(t => t.classList.remove("active"));
  activeMenuCategory = null;
}

function renderMegaMenuGrid() {
  const grid = document.getElementById("megamenu-grid");
  const desc = document.getElementById("megamenu-desc");
  if (!grid || !activeMenuCategory) return;

  const sourceMap = {
    main: mainList,
    extended: extendedList,
    legacy: legacyList
  };

  const currentList = sourceMap[activeMenuCategory] || [];
  desc.textContent = LIST_DESCRIPTIONS[activeMenuCategory] || "";

  grid.innerHTML = currentList
    .map(d => `
      <div class="megamenu-item" data-pos="${d.position}">
        <div class="megamenu-item-title">#${d.position} - ${d.name}</div>
        <div class="megamenu-item-creator">${d.creator || d.verifier || ""}</div>
      </div>
    `)
    .join("");

  grid.querySelectorAll(".megamenu-item").forEach(item => {
    item.addEventListener("click", () => {
      stopAllVideos();
      const pos = Number(item.dataset.pos);
      const demon = currentList.find(d => d.position === pos);
      closeMegaMenu();
      if (demon) openDemonPage(demon);
    });
  });
}

function getYoutubeId(url) {
  if (!url || typeof url !== "string") return "";
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match.at(1) : "";
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

  const levelThumb =
    !notUsable.includes(String(demon.id))
      ? `https://levelthumbs.prevter.me/thumbnail/${demon.id}`
      : "";

  const bg = demon.background || levelThumb;
  card.style.setProperty("--card-bg", `url('${bg}')`);

  const fallbackSvg = "data:image/svg+xml;utf8,<svg xmlns='http://w3.org' width='300' height='170'><rect width='100%25' height='100%25' fill='%23111622'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-family='sans-serif' font-size='16' font-weight='bold'>No Preview</text></svg>";

  const img = document.createElement("img");
  img.src =
    (demon.thumbnail && demon.thumbnail.trim()) ||
    getYoutubeThumbnail(demon.verification) ||
    bg ||
    fallbackSvg;

  img.onerror = () => {
    const ytThumb = getYoutubeThumbnail(demon.verification);
    if (ytThumb && img.src !== ytThumb) {
      img.src = ytThumb;
    } else if (levelThumb && img.src !== levelThumb) {
      img.src = levelThumb;
    } else if (img.src !== fallbackSvg) {
      img.src = fallbackSvg;
    }
  };

  const info = document.createElement("div");
  info.className = "demon-info";

  const score = demon.position
    ? 5500 / Math.sqrt(demon.position)
    : 5500 / Math.sqrt(999);

  const listPercent = demon.percentToQualify || 100;
  const minScore = score * (listPercent / 100);

  if (demon.cosmetic) {
    info.innerHTML = `
      <h2>${demon.name}</h2>
      <p class="demon-meta-line">Levels past this zone are harder than ${demon.name}</p>
    `;
  } else if (demon.missingJson) {
    info.innerHTML = `
      <h2><span class="demon-rank">#${demon.position}</span> ${demon.name}</h2>
      <p style="color:#ff3232;font-weight:700;margin:0;">JSON NOT FOUND!</p>
    `;
  } else {
    const creatorHtml = demon.author
      ? `<span class="demon-creator">${demon.author}</span>`
      : "";

    info.innerHTML = `
      <h2><span class="demon-rank">#${demon.position}</span> ${demon.name}</h2>
      <p class="demon-meta-line">
        ${creatorHtml}
        <span class="demon-verifier">${cleanDisplayName(demon.verifier)}</span>
        <span class="demon-dot">•</span>
        <span>${minScore.toFixed(2)} — <span class="demon-score">${score.toFixed(2)}</span> points</span>
      </p>
    `;
  }

  card.appendChild(img);
  card.appendChild(info);

  const userProgress = typeof getPlayerProgressOnDemon === "function"
    ? getPlayerProgressOnDemon(demon, loggedInUserKey)
    : null;

  if (userProgress !== null) {
    const badge = document.createElement("div");
    badge.className = userProgress === 100
      ? "demon-completion-badge"
      : "demon-completion-badge partial";
    badge.textContent = `${userProgress}%`;
    card.appendChild(badge);
    if (userProgress === 100) {
      card.classList.add("demon-completed");
    }
  }

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

  getVisibleDemons().forEach(demon => {
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

  getVisibleDemons().forEach(demon => {
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
    Legend: "#ff3030",
    Absolute: "#a020f0",
    "Mythic II": "#ff00ff",
    "Mythic I": "#d400d4",
    "Champion II": "#00bfff",
    "Champion I": "#0099cc",
    "Diamond II": "#7df9ff",
    "Diamond I": "#4fd6ff",
    "Platinum II": "#e5e4e2",
    "Platinum I": "#cfcfcf",
    "Gold II": "#ffd700",
    "Gold I": "#d4af37",
    "Silver II": "#c0c0c0",
    "Silver I": "#a8a8a8",
    "Bronze II": "#cd7f32",
    "Bronze I": "#a97142"
  }[getPlayerRank(score)];

  const hardestName = hardest ? `#${hardest.position} — ${hardest.name}` : "None";

  const card = document.createElement("div");
  card.className = "player-card no-image";

  const badge = document.createElement("img");
  badge.className = "rank-badge";
  badge.src = getLevelBadge(hardest?.position);
  card.appendChild(badge);

  const info = document.createElement("div");
  info.className = "player-info";

  info.innerHTML = `
    <h2>#${rank} — ${cleanDisplayName(name)}</h2>
    <p><strong>Score:</strong> ${score.toFixed(2)}</p>
    <p><strong>Rank:</strong> <span class="${
      getPlayerRank(score) === "Legend"
        ? "rank-legend"
        : getPlayerRank(score) === "Absolute"
        ? "rank-absolute"
        : getPlayerRank(score).includes("Mythic")
        ? "rank-mythic"
        : ""
    }" style="color:${rankColor}; font-weight:600;">
      ${getPlayerRank(score)}
    </span></p>
    <p><strong>Hardest Demon:</strong> ${hardestName}</p>
  `;

  card.appendChild(info);

  card.addEventListener("click", () => {
    document.querySelectorAll(".player-card").forEach(c => c.classList.remove("selected-player"));
    card.classList.add("selected-player");
    openPlayerPage(normalizeName(name), window._leaderboardScores);
  });

  return card;
}







function openPlayerPage(key, scores) {
  stopAllVideos();

  const playerName = window._playerMap.get(key) || key;
  const container = document.getElementById("leaderboard-profile-view");
  if (!container) return;

  const stats = getPlayerStats(playerName);
  const score = scores[key] || 0;
  const rank = getPlayerRank(score);

  const rankColor = {
    "Legend": "#ff3030",
    "Absolute": "#a020f0",
    "Mythic II": "#ff00ff",
    "Mythic I": "#d400d4",
    "Champion II": "#00bfff",
    "Champion I": "#0099cc",
    "Diamond II": "#7df9ff",
    "Diamond I": "#4fd6ff",
    "Platinum II": "#e5e4e2",
    "Platinum I": "#cfcfcf",
    "Gold II": "#ffd700",
    "Gold I": "#d4af37",
    "Silver II": "#c0c0c0",
    "Silver I": "#a8a8a8",
    "Bronze II": "#cd7f32",
    "Bronze I": "#a97142"
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

function animateStatValue(el, target, duration = 1000) {
  if (!el) return;
  const safeTarget = Math.max(1, target);
  const start = Number(el.dataset.currentVal) || 1;
  el.dataset.currentVal = safeTarget;

  if (start === safeTarget) {
    el.textContent = safeTarget.toLocaleString();
    return;
  }

  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.max(1, Math.round(start + (safeTarget - start) * eased));
    el.textContent = current.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = safeTarget.toLocaleString();
    }
  }

  requestAnimationFrame(step);
}

function updateHomeStats(leaderboardCount = null) {
  const usersEl = document.getElementById("home-stat-users");
  const recordsEl = document.getElementById("home-stat-records");
  const levelsEl = document.getElementById("home-stat-levels");

  const visibleDemons = getVisibleDemons().filter(d => !d.cosmetic);

  let totalRecords = 0;
  const uniquePlayers = new Set();

  (typeof playersList !== "undefined" ? playersList : []).forEach(p => {
    if (p && !bannedPlayers.includes(p)) uniquePlayers.add(normalizeName(p));
  });

  visibleDemons.forEach(d => {
    if (d.verifier && d.verifier !== "Unknown" && !bannedPlayers.includes(d.verifier)) {
      totalRecords++;
      uniquePlayers.add(normalizeName(d.verifier));
    }
    (d.records || []).forEach(r => {
      const u = typeof r === "string" ? r : r.user;
      if (u && u !== "Not beaten yet" && !bannedPlayers.includes(u)) {
        totalRecords++;
        uniquePlayers.add(normalizeName(u));
      }
    });
  });

  (typeof manualCompleted !== "undefined" ? manualCompleted : []).forEach(m => {
    totalRecords++;
    if (m.player && !bannedPlayers.includes(m.player)) {
      uniquePlayers.add(normalizeName(m.player));
    }
  });

  const rawUsers = leaderboardCount !== null ? leaderboardCount : uniquePlayers.size;
  const userCount = Math.max(1, rawUsers - 1);

  animateStatValue(usersEl, userCount);
  animateStatValue(recordsEl, Math.max(1, totalRecords));
  animateStatValue(levelsEl, Math.max(1, visibleDemons.length));
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

    getVisibleDemons().forEach(demon => {
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

    getVisibleDemons().forEach(demon => {
      if (hideCheated && cheatedList.includes(demon.name.toLowerCase())) return;

      const pos = demon.position || 999;
      const baseScore = 5500 / Math.sqrt(pos);

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
      const points = {
        easy: 20,
        medium: 40,
        hard: 60,
        insane: 80
      }[diff] || 0;

      scores[key] += points;
    });

    manualPoints.forEach(mp => {
      const key = normalizeName(mp.player);
      if (scores[key] !== undefined) scores[key] += Number(mp.extrapoints) || 0;
    });

    window._leaderboardScores = scores;

    const searchQuery = (document.getElementById("player-search")?.value || "").toLowerCase();
    const filterMode = document.getElementById("leaderboard-filter")?.value || "points";

    let allPlayers = Object.entries(scores)
      .map(([key, score]) => {
        const name = playerMap.get(key);
        const hardest = getPlayerHardestDemon(name);
        return {
          key,
          name,
          score,
          hardestPosition: hardest?.position || 999999,
          rankName: getPlayerRank(score)
        };
      });

    updateHomeStats(allPlayers.length);

    let sorted = allPlayers.filter(p => {
      if (!searchQuery.trim()) return true;
      return cleanDisplayName(p.name).toLowerCase().includes(searchQuery);
    });

    if (filterMode === "points") {
      sorted.sort((a, b) => b.score - a.score);
    } else if (filterMode === "tier") {
      sorted.sort((a, b) => a.hardestPosition - b.hardestPosition || b.score - a.score);
    } else if (filterMode === "rank") {
      const order = ["Mythic", "Champion", "Diamond", "Platinum", "Gold", "Silver", "Bronze"];
      sorted.sort((a, b) => order.indexOf(a.rankName) - order.indexOf(b.rankName));
    }

    container.innerHTML = `
      <div class="leaderboard-warning">
        WARNING: Rankings might not be accurate due to this list not being very popular. Take your rank with a grain of salt.
      </div>
    `;

    const profileView = document.getElementById("leaderboard-profile-view");

    if (sorted.length > 0) {
      sorted.forEach((p, index) => {
        const card = createPlayerCard(p.name, p.score, index + 1);
        container.appendChild(card);
      });

      if (profileView) {
        profileView.innerHTML = "<p class='leaderboard-placeholder-text'>Select a player to view their profile.</p>";
      }
    } else {
      container.innerHTML = "<p>No players with scores yet.</p>";
      if (profileView) {
        profileView.innerHTML = "<p class='leaderboard-placeholder-text'>No players found.</p>";
      }
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
      const baseScore = 5500 / Math.sqrt(pos);

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


function updateSpaceUKButton() {
  const btn = document.getElementById("spaceuk-toggle");

  if (!btn) return;

  btn.textContent =
    disableSpaceUK
      ? "Enable SpaceUK"
      : "Disable SpaceUK";
}

function rebuildVisibleLists() {
  const demons = getVisibleDemons();

  mainList = demons.filter(
    d => !d.cosmetic && d.position <= 75
  );

  extendedList = demons.filter(
    d => !d.cosmetic &&
    d.position > 75 &&
    d.position <= 100
  );

  legacyList = demons.filter(
    d => !d.cosmetic &&
    d.position > 100
  );

  renderMegaMenuGrid();
}

function startTargetedTagRemover() {
  const cleanTargetElements = () => {
    const selectors = [
      ".demon-info p",
      "#demon-page-container h1",
      "#demon-page-container p",
      ".fancy-records-box p",
      ".fancy-records-box strong"
    ];

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        if (element.children.length === 0) {
          if (/\[c\]/i.test(element.textContent)) {
            element.textContent = element.textContent.replace(/\[c\]/gi, "");
          }
        } else {
          Array.from(element.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && /\[c\]/i.test(node.nodeValue)) {
              node.nodeValue = node.nodeValue.replace(/\[c\]/gi, "");
            }
          });
        }
      });
    });
  };

  cleanTargetElements();

  const observer = new MutationObserver(() => {
    cleanTargetElements();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

document.addEventListener("DOMContentLoaded", () => {
  startTargetedTagRemover();
});


function applyLegitVerifiersAndVideos() {
  if (!disableSpaceUK || !globalDemons || globalDemons.length === 0) return;

  globalDemons.forEach(demon => {
    const currentVerifier = demon.verifier || "";
    
    if (/\[c\]/i.test(currentVerifier)) {
      const records = demon.records || [];
      
      const legitRecordIndex = records.findIndex(r => {
        const username = typeof r === "string" ? r : (r.user || "");
        return username && !/\[c\]/i.test(username);
      });

      if (legitRecordIndex !== -1) {
        const firstLegitRecord = records[legitRecordIndex];
        const legitUser = typeof firstLegitRecord === "string" ? firstLegitRecord : firstLegitRecord.user;
        
        demon.verifier = legitUser;

        if (typeof firstLegitRecord === "object" && firstLegitRecord.link) {
          demon.verification = firstLegitRecord.link;
          const newThumb = getYoutubeThumbnail(firstLegitRecord.link);
          if (newThumb) {
            demon.thumbnail = newThumb;
          }
        }

        demon.records.splice(legitRecordIndex, 1);
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const originalLoadDemonList = window.loadDemonList;
  if (originalLoadDemonList) {
    window.loadDemonList = async function(...args) {
      await originalLoadDemonList.apply(this, args);
      applyLegitVerifiersAndVideos();
      rebuildVisibleLists();
      renderDemonCards();
    };
  }
});

function initHashRouting() {
  let internalNav = false;
  const validTabs = ["home", "demonlist", "leaderboard", "staff", "rules", "guidelines"];

  const setHash = (hash) => {
    if (internalNav) return;
    const target = "#" + hash.replace(/^#/, "");
    if (window.location.hash !== target) {
      history.pushState(null, "", target);
    }
  };

  const origOpenDemon = window.openDemonPage;
  if (typeof origOpenDemon === "function") {
    window.openDemonPage = function (demon, ...args) {
      origOpenDemon.call(this, demon, ...args);
      if (demon && demon.position) {
        setHash(`demon/${demon.position}`);
      }
    };
  }

  const origOpenPlayer = window.openPlayerPage;
  if (typeof origOpenPlayer === "function") {
    window.openPlayerPage = function (key, scores, ...args) {
      origOpenPlayer.call(this, key, scores, ...args);
      if (key && document.getElementById("leaderboard")?.classList.contains("active")) {
        setHash(`player/${encodeURIComponent(key)}`);
      }
    };
  }

  document.addEventListener("click", (e) => {
    const tabBtn = e.target.closest(".tab-btn[data-tab]");
    if (tabBtn) {
      setHash(tabBtn.getAttribute("data-tab"));
    }
  });

  const routeFromHash = () => {
    const raw = window.location.hash.replace(/^#/, "").trim();
    if (!raw || raw.startsWith("rules-")) return;

    internalNav = true;
    try {
      const demonMatch = raw.match(/^(?:demon\/)?(\d+)$/i);
      if (demonMatch) {
        const pos = Number(demonMatch);
        const waitForDemons = setInterval(() => {
          const demons = typeof getVisibleDemons === "function" ? getVisibleDemons() : [];
          if (demons.length > 0) {
            clearInterval(waitForDemons);
            const match = demons.find((d) => d.position === pos);
            if (match && typeof window.openDemonPage === "function") {
              internalNav = true;
              window.openDemonPage(match);
              internalNav = false;
            }
          }
        }, 100);
        setTimeout(() => clearInterval(waitForDemons), 8000);
        return;
      }

      const playerMatch = raw.match(/^player\/(.+)$/i);
      if (playerMatch) {
        let decoded = "";
        try {
          decoded = decodeURIComponent(playerMatch).toLowerCase();
        } catch {
          return;
        }
        document.querySelector('.tab-btn[data-tab="leaderboard"]')?.click();
        const waitForScores = setInterval(() => {
          if (window._leaderboardScores && Object.keys(window._leaderboardScores).length > 0) {
            clearInterval(waitForScores);
            if (window._playerMap && window._playerMap.has(decoded)) {
              internalNav = true;
              window.openPlayerPage?.(decoded, window._leaderboardScores);
              internalNav = false;
            }
          }
        }, 100);
        setTimeout(() => clearInterval(waitForScores), 8000);
        return;
      }

      const tabName = raw.toLowerCase();
      if (validTabs.includes(tabName)) {
        const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
        if (tabBtn) tabBtn.click();
      }
    } finally {
      internalNav = false;
    }
  };

  window.addEventListener("hashchange", routeFromHash);
  routeFromHash();
}

document.addEventListener("DOMContentLoaded", initHashRouting);

function setHomeStatsLoading() {
  ["home-stat-users", "home-stat-records", "home-stat-levels"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "Loading...";
  });
}

setHomeStatsLoading();

(function fixPrematureHomeStats() {
  const originalUpdate = window.updateHomeStats;
  window.updateHomeStats = function (leaderboardCount = null) {
    if (!globalDemons || globalDemons.length === 0) return;
    if (typeof originalUpdate === "function") {
      originalUpdate(leaderboardCount);
    }
  };
})();

(function bindDemonDropdowns() {
  const wireDropdown = (selectId) => {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.addEventListener("change", () => {
      const pos = Number(select.value);
      if (!pos) return;

      const demon = getVisibleDemons().find(d => d.position === pos);
      if (demon) openDemonPage(demon);

      select.value = "";
    });
  };

  wireDropdown("select-main");
  wireDropdown("select-extended");
  wireDropdown("select-legacy");
})();

(function setupNavigationQoL() {
  window.jumpToPlayerProfile = function (rawName) {
    const key = normalizeName(rawName);
    if (!key) return;

    stopAllVideos();
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    const lbBtn = document.querySelector('[data-tab="leaderboard"]');
    const lbTab = document.getElementById("leaderboard");
    if (lbBtn) lbBtn.classList.add("active");
    if (lbTab) lbTab.classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (window._leaderboardScores && Object.keys(window._leaderboardScores).length > 0) {
      openPlayerPage(key, window._leaderboardScores);
    } else {
      loadLeaderboard();
      setTimeout(() => {
        if (window._leaderboardScores) {
          openPlayerPage(key, window._leaderboardScores);
        }
      }, 550);
    }
  };

  window.jumpToDemonByName = function (demonName) {
    const target = demonName.trim().toLowerCase();
    const demon = getVisibleDemons().find(d => d.name.trim().toLowerCase() === target);
    if (demon) {
      openDemonPage(demon);
    }
  };

  const origOpenDemonPage = window.openDemonPage;
  window.openDemonPage = function (demon) {
    origOpenDemonPage(demon);
    const container = document.getElementById("demon-page-container");
    if (!container) return;

    const backBtn = document.createElement("button");
    backBtn.className = "dp-back-btn";
    backBtn.innerHTML = "← Back to Demonlist";
    backBtn.addEventListener("click", () => {
      stopAllVideos();
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      document.querySelector('[data-tab="demonlist"]')?.classList.add("active");
      document.getElementById("demonlist")?.classList.add("active");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    container.prepend(backBtn);

    const verifierEl = container.querySelector(".dp-verifier-name");
    if (verifierEl && demon.verifier && demon.verifier !== "Unknown") {
      verifierEl.classList.add("dp-player-link");
      verifierEl.title = `View ${cleanDisplayName(demon.verifier)}'s profile`;
      verifierEl.addEventListener("click", () => jumpToPlayerProfile(demon.verifier));
    }

    container.querySelectorAll(".dp-record-user").forEach(userEl => {
      const playerName = userEl.textContent.trim();
      if (!playerName) return;
      userEl.classList.add("dp-player-link");
      userEl.title = `View ${playerName}'s profile`;
      userEl.addEventListener("click", () => jumpToPlayerProfile(playerName));
    });
  };

  const origOpenPlayerPage = window.openPlayerPage;
  window.openPlayerPage = function (key, scores) {
    origOpenPlayerPage(key, scores);
    const profileContainer = document.getElementById("leaderboard-profile-view");
    if (!profileContainer) return;

    profileContainer.querySelectorAll(".completed-card").forEach(card => {
      const titleEl = card.querySelector("h3");
      if (!titleEl) return;
      const demonName = titleEl.textContent.trim();

      const existsOnList = getVisibleDemons().some(
        d => !d.cosmetic && d.name.trim().toLowerCase() === demonName.toLowerCase()
      );

      if (existsOnList) {
        card.title = `Open ${demonName}`;
        card.addEventListener("click", () => jumpToDemonByName(demonName));
      } else {
        card.style.cursor = "default";
      }
    });
  };

  const topBtn = document.createElement("button");
  topBtn.id = "back-to-top-btn";
  topBtn.title = "Back to Top";
  topBtn.innerHTML = "↑";
  document.body.appendChild(topBtn);

  topBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", () => {
    if (window.scrollY > 320) {
      topBtn.classList.add("visible");
    } else {
      topBtn.classList.remove("visible");
    }
  });
})();

(function showFivePercentScoreOnCards() {
  const origCreateDemonCard = window.createDemonCard;

  window.createDemonCard = function (demon) {
    const card = origCreateDemonCard.apply(this, arguments);
    if (!demon || demon.cosmetic || demon.missingJson) return card;

    const fullScore = demon.position
      ? 5500 / Math.sqrt(demon.position)
      : 5500 / Math.sqrt(999);
    const fivePercentScore = fullScore * 0.05;

    const info = card.querySelector(".demon-info");
    if (!info) return card;

    Array.from(info.querySelectorAll("p")).forEach(p => {
      if (p.textContent.trim().startsWith("Score:")) {
        p.remove();
      }
    });

    let metaLine = info.querySelector(".demon-meta-line");
    if (!metaLine) {
      metaLine = document.createElement("p");
      metaLine.className = "demon-meta-line";
      const diffLine = info.querySelector(".demon-diff-line") || info.querySelector("p:last-of-type");
      if (diffLine) {
        info.insertBefore(metaLine, diffLine);
      } else {
        info.appendChild(metaLine);
      }
    }

    metaLine.innerHTML = `
      <span class="demon-verifier">${cleanDisplayName(demon.verifier)}</span>
      <span class="demon-dot">•</span>
      <span>${fivePercentScore.toFixed(2)} — <span class="demon-score">${fullScore.toFixed(2)}</span> points</span>
    `;

    return card;
  };
})();

(function showProgressOnPlayerPages() {
  const prevOpenPlayerPage = window.openPlayerPage;

  window.openPlayerPage = function (key, scores) {
    prevOpenPlayerPage(key, scores);

    const container = document.getElementById("leaderboard-profile-view");
    const profileEl = container?.querySelector(".player-profile");
    if (!profileEl) return;

    const progressRuns = [];

    getVisibleDemons().forEach(demon => {
      if (demon.cosmetic) return;

      let bestPercent = 0;
      (demon.records || []).forEach(r => {
        const record = typeof r === "string"
          ? { user: r, percent: 100 }
          : { user: r.user, percent: Number(r.percent) || 100 };

        if (normalizeName(record.user) === key && record.percent < 100 && record.percent >= 5) {
          if (record.percent > bestPercent) bestPercent = record.percent;
        }
      });

      if (bestPercent > 0) {
        progressRuns.push({
          demon,
          name: demon.name,
          position: demon.position,
          percent: bestPercent,
          background: demon.background || demon.thumbnail || getYoutubeThumbnail(demon.verification) || ""
        });
      }
    });

    if (progressRuns.length === 0) return;

    progressRuns.sort((a, b) => (a.position || 9999) - (b.position || 9999));

    const section = document.createElement("div");
    section.className = "player-profile-section";
    section.innerHTML = `
      <h2>Progress</h2>
      <div class="completed-grid">
        ${progressRuns.map(p => `
          <div class="completed-card fancy-completed progress-card" data-demon="${p.name}" style="background-image:url('${p.background}'); cursor:pointer;" title="Open ${p.name}">
            <div class="completed-overlay"></div>
            <div class="completed-info">
              <h3>#${p.position} — ${p.name}</h3>
              <span style="color:#38bdf8; font-weight:800; font-size:0.95rem;">${p.percent}%</span>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    section.querySelectorAll(".progress-card").forEach(card => {
      const targetName = card.getAttribute("data-demon");
      const match = progressRuns.find(p => p.name === targetName);
      if (match) {
        card.addEventListener("click", () => openDemonPage(match.demon));
      }
    });

    profileEl.appendChild(section);
  };
})();

function fixMegaMenuLayering() {
  const panel = document.querySelector("#demonlist .panel");
  const wrapper = document.getElementById("demon-megamenu");
  const menu = document.getElementById("megamenu-panel");

  if (panel) {
    panel.style.overflow = "visible";
    panel.style.position = "relative";
    panel.style.zIndex = "500";
  }

  if (wrapper) {
    wrapper.style.position = "relative";
    wrapper.style.zIndex = "9998";
  }

  if (menu) {
    menu.style.zIndex = "9999";
  }
}

function getCleanMegaMenuList(category) {
  let visible = typeof getVisibleDemons === "function" ? getVisibleDemons() : globalDemons;
  visible = visible.filter(d => !d.cosmetic && d.position);

  if (typeof disableSpaceUK !== "undefined" && disableSpaceUK) {
    visible = visible.filter(d => {
      const verifier = String(d.verifier || "").toLowerCase();
      const hasLegitRecord = (d.records || []).some(r => {
        const u = typeof r === "string" ? r : (r.user || "");
        return u && !u.toLowerCase().includes("[c]");
      });
      return !verifier.includes("[c]") || hasLegitRecord;
    });
  }

  if (typeof hideCheated !== "undefined" && hideCheated && Array.isArray(cheatedList)) {
    visible = visible.filter(d => !cheatedList.includes(String(d.id).toLowerCase()));
  }

  if (category === "main") return visible.filter(d => d.position <= 75);
  if (category === "extended") return visible.filter(d => d.position > 75 && d.position <= 150);
  if (category === "legacy") return visible.filter(d => d.position > 150);
  return [];
}

function syncMegaMenuWithSpaceUK() {
  fixMegaMenuLayering();

  const spaceBtn = document.getElementById("spaceuk-toggle");
  if (spaceBtn && !spaceBtn.dataset.megaBound) {
    spaceBtn.dataset.megaBound = "1";
    spaceBtn.addEventListener("click", () => {
      setTimeout(() => {
        if (typeof renderMegaMenuGrid === "function") renderMegaMenuGrid();
        if (typeof updateMegaMenuContent === "function") updateMegaMenuContent();
      }, 0);
    });
  }

  const tabs = document.querySelectorAll(".megamenu-tab");
  tabs.forEach(tab => {
    if (!tab.dataset.layerBound) {
      tab.dataset.layerBound = "1";
      tab.addEventListener("click", fixMegaMenuLayering);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", syncMegaMenuWithSpaceUK);
} else {
  syncMegaMenuWithSpaceUK();
}

function applyBeyondAndExtendedRanges() {
  const getList = () => {
    let visible = typeof getVisibleDemons === "function" ? getVisibleDemons() : globalDemons;
    visible = visible.filter(d => !d.cosmetic && d.position);
    if (typeof hideCheated !== "undefined" && hideCheated && Array.isArray(cheatedList)) {
      visible = visible.filter(d => !cheatedList.includes(String(d.id).toLowerCase()));
    }
    return visible;
  };

  function syncMenu() {
    const visible = getList();
    mainList = visible.filter(d => d.position <= 75);
    extendedList = visible.filter(d => d.position >= 76 && d.position <= 150);
    legacyList = visible.filter(d => d.position >= 151);

    const grid = document.getElementById("megamenu-grid");
    const desc = document.getElementById("megamenu-desc");
    const activeTab = document.querySelector(".megamenu-tab.active");
    if (!grid || !activeTab) return;

    const category = activeTab.dataset.list;
    const rangeMap = {
      main: mainList,
      extended: extendedList,
      legacy: legacyList
    };

    const descMap = {
      main: "The main section of the Demonlist (ranks 1–75). These demons are the hardest levels in the game and award the most points!",
      extended: "The extended section of the Demonlist (ranks 76–150). Records are still accepted and award points toward the leaderboard.",
      legacy: "The beyond section of the Demonlist (ranks 151+). These levels award list points, and might be accessible."
    };

    const items = rangeMap[category] || [];
    if (desc) desc.textContent = descMap[category] || "";

    grid.innerHTML = items
      .map(d => {
        const rawAuthor = d.author || d.creator || d.verifier || "";
        const author = typeof cleanDisplayName === "function"
          ? cleanDisplayName(rawAuthor)
          : rawAuthor.replace(/\[c\]/gi, "").trim();

        return `
          <div class="megamenu-item" data-pos="${d.position}">
            <div class="megamenu-item-title">#${d.position} - ${d.name}</div>
            <div class="megamenu-item-creator">${author}</div>
          </div>
        `;
      })
      .join("");

    grid.querySelectorAll(".megamenu-item").forEach(el => {
      el.addEventListener("click", () => {
        if (typeof stopAllVideos === "function") stopAllVideos();
        const pos = Number(el.dataset.pos);
        const demon = items.find(d => d.position === pos);
        const panel = document.getElementById("megamenu-panel");
        if (panel) panel.classList.remove("open");
        document.querySelectorAll(".megamenu-tab").forEach(t => t.classList.remove("active"));
        if (demon && typeof openDemonPage === "function") openDemonPage(demon);
      });
    });
  }

  document.querySelectorAll(".megamenu-tab").forEach(tab => {
    tab.addEventListener("click", () => setTimeout(syncMenu, 0));
  });

  ["spaceuk-toggle", "toggle-cheated"].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", () => setTimeout(syncMenu, 0));
  });

  syncMenu();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", applyBeyondAndExtendedRanges);
} else {
  applyBeyondAndExtendedRanges();
}

function forceMegaMenuVerifierOnly() {
  const grid = document.getElementById("megamenu-grid");
  if (!grid) return;

  const replaceWithVerifier = () => {
    const visible = typeof getVisibleDemons === "function" ? getVisibleDemons() : globalDemons;
    const demonByPosition = new Map();

    visible.forEach(d => {
      if (!d.cosmetic && d.position) {
        demonByPosition.set(Number(d.position), d);
      }
    });

    grid.querySelectorAll(".megamenu-item").forEach(item => {
      const pos = Number(item.dataset.pos);
      const demon = demonByPosition.get(pos);
      const subtitleEl = item.querySelector(".megamenu-item-creator");
      if (!demon || !subtitleEl) return;

      const rawVerifier = demon.verifier || "Unknown";
      const cleanVerifier = typeof cleanDisplayName === "function"
        ? cleanDisplayName(rawVerifier)
        : rawVerifier.replace(/\[c\]/gi, "").trim();

      if (subtitleEl.textContent !== cleanVerifier) {
        subtitleEl.textContent = cleanVerifier;
      }
    });
  };

  replaceWithVerifier();

  const observer = new MutationObserver(replaceWithVerifier);
  observer.observe(grid, { childList: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", forceMegaMenuVerifierOnly);
} else {
  forceMegaMenuVerifierOnly();
}

(function initListRoulette() {
  let rlState = {
    active: false,
    finished: false,
    gaveUp: false,
    target: 1,
    poolIds: [],
    usedIds: [],
    currentId: null,
    history: []
  };

  const STORAGE_KEY = "gdl_roulette_save_v1";

  function showStatus(msg, isError = false) {
    const el = document.getElementById("rl-status-msg");
    if (!el) return;
    el.style.color = isError ? "#ef4444" : "var(--accent-green)";
    el.textContent = msg;
    setTimeout(() => {
      if (el.textContent === msg) el.textContent = "";
    }, 4000);
  }

  function getDemonById(id) {
    const list = typeof getVisibleDemons === "function" ? getVisibleDemons() : globalDemons;
    return list.find(d => String(d.id) === String(id)) || globalDemons.find(d => String(d.id) === String(id));
  }

  function buildPool() {
    const useMain = document.getElementById("rl-opt-main")?.checked;
    const useExt = document.getElementById("rl-opt-ext")?.checked;
    const useBeyond = document.getElementById("rl-opt-beyond")?.checked;

    const visible = (typeof getVisibleDemons === "function" ? getVisibleDemons() : globalDemons)
      .filter(d => !d.cosmetic && d.position);

    return visible.filter(d => {
      if (d.position <= 75 && useMain) return true;
      if (d.position >= 76 && d.position <= 150 && useExt) return true;
      if (d.position >= 151 && useBeyond) return true;
      return false;
    });
  }

  function persistLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rlState));
    } catch {}
  }

  function restoreLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.poolIds)) {
          rlState = parsed;
        }
      }
    } catch {}
  }

  function encodeSaveCode(state) {
    const compact = {
      a: state.active ? 1 : 0,
      f: state.finished ? 1 : 0,
      g: state.gaveUp ? 1 : 0,
      t: state.target,
      p: state.poolIds,
      u: state.usedIds,
      c: state.currentId,
      h: state.history.map(item => [item.id, item.percent])
    };
    return "GDL1-" + btoa(unescape(encodeURIComponent(JSON.stringify(compact))));
  }

  function decodeSaveCode(code) {
    const cleaned = code.trim();
    if (!cleaned.startsWith("GDL1-")) return null;
    const raw = decodeURIComponent(escape(atob(cleaned.slice(5))));
    const c = JSON.parse(raw);
    if (!c || !Array.isArray(c.p) || typeof c.t !== "number") return null;
    return {
      active: Boolean(c.a),
      finished: Boolean(c.f),
      gaveUp: Boolean(c.g),
      target: c.t,
      poolIds: c.p,
      usedIds: Array.isArray(c.u) ? c.u : [],
      currentId: c.c || null,
      history: Array.isArray(c.h) ? c.h.map(x => ({ id: x[0], percent: x[1] })) : []
    };
  }

  function pickNextDemon() {
    const remaining = rlState.poolIds.filter(id => !rlState.usedIds.includes(id));
    if (remaining.length === 0 || rlState.target > 100) {
      rlState.active = false;
      rlState.finished = true;
      rlState.currentId = null;
      return;
    }
    const chosenId = remaining[Math.floor(Math.random() * remaining.length)];
    rlState.currentId = chosenId;
    rlState.usedIds.push(chosenId);
  }

  function startNewRun() {
    const pool = buildPool();
    if (pool.length === 0) {
      showStatus("Select at least one list section with available levels.", true);
      return;
    }
    rlState = {
      active: true,
      finished: false,
      gaveUp: false,
      target: 1,
      poolIds: pool.map(d => String(d.id)),
      usedIds: [],
      currentId: null,
      history: []
    };
    pickNextDemon();
    persistLocal();
    renderRoulette();
    showStatus("New roulette run started!");
  }

  function submitProgress(pct) {
    if (!rlState.active || !rlState.currentId) return;
    const val = Number(pct);
    if (isNaN(val) || val < rlState.target || val > 100) {
      showStatus(`Enter a percentage between ${rlState.target}% and 100%.`, true);
      return;
    }

    rlState.history.unshift({
      id: rlState.currentId,
      percent: val
    });

    if (val >= 100) {
      rlState.active = false;
      rlState.finished = true;
      rlState.currentId = null;
    } else {
      rlState.target = val + 1;
      pickNextDemon();
    }

    persistLocal();
    renderRoulette();
  }

  function giveUpRun() {
    if (!rlState.active) return;
    rlState.active = false;
    rlState.finished = true;
    rlState.gaveUp = true;
    persistLocal();
    renderRoulette();
  }

  function renderRoulette() {
    const activeArea = document.getElementById("rl-active-area");
    const historyArea = document.getElementById("rl-history-area");
    if (!activeArea || !historyArea) return;

    activeArea.innerHTML = "";
    historyArea.innerHTML = "";

    if (rlState.finished) {
      const score = rlState.history.length;
      const title = rlState.gaveUp ? "Run Ended" : "Roulette Completed!";
      activeArea.innerHTML = `
        <div class="rl-summary-box">
          <h2>${title}</h2>
          <p>Levels Cleared: <strong>${score}</strong> • Highest Percent: <strong>${rlState.history[0]?.percent || 0}%</strong></p>
        </div>
      `;
    } else if (rlState.active && rlState.currentId) {
      const demon = getDemonById(rlState.currentId);
      if (demon) {
        const thumb =
          (demon.thumbnail && demon.thumbnail.trim()) ||
          getYoutubeThumbnail(demon.verification) ||
          `https://prevter.me{demon.id}`;

        const card = document.createElement("div");
        card.className = "rl-current-card";
        card.innerHTML = `
          <img src="${thumb}" alt="${demon.name}" title="Open ${demon.name}">
          <div class="rl-current-info">
            <span class="rl-target-badge">GOAL: AT LEAST ${rlState.target}%</span>
            <h2>#${demon.position || "?"} — ${demon.name}</h2>
            <p class="demon-meta-line">Verified by <span class="demon-verifier">${cleanDisplayName(demon.verifier)}</span></p>
            <div class="rl-controls">
              <input type="number" id="rl-pct-input" min="${rlState.target}" max="100" value="${rlState.target}" placeholder="${rlState.target}%">
              <button type="button" id="rl-done-btn" class="rl-done-btn">Done</button>
              <button type="button" id="rl-giveup-btn" class="rl-giveup-btn">Give Up</button>
            </div>
          </div>
        `;

        card.querySelector("img").addEventListener("click", () => openDemonPage(demon));
        card.querySelector("#rl-done-btn").addEventListener("click", () => {
          const val = card.querySelector("#rl-pct-input").value;
          submitProgress(val);
        });
        card.querySelector("#rl-pct-input").addEventListener("keydown", (e) => {
          if (e.key === "Enter") submitProgress(e.target.value);
        });
        card.querySelector("#rl-giveup-btn").addEventListener("click", giveUpRun);

        activeArea.appendChild(card);
      }
    }

    if (rlState.history.length > 0) {
      rlState.history.forEach((entry, idx) => {
        const d = getDemonById(entry.id);
        const name = d ? `#${d.position || "?"} — ${d.name}` : `Level ID ${entry.id}`;
        const row = document.createElement("div");
        row.className = "rl-history-row";
        row.innerHTML = `
          <span><strong>#${rlState.history.length - idx}</strong> &nbsp; ${name}</span>
          <span class="rl-history-pct">${entry.percent}%</span>
        `;
        if (d) {
          row.style.cursor = "pointer";
          row.addEventListener("click", () => openDemonPage(d));
        }
        historyArea.appendChild(row);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    restoreLocal();

    document.getElementById("rl-start-btn")?.addEventListener("click", startNewRun);

    document.getElementById("rl-save-btn")?.addEventListener("click", () => {
      if (!rlState.active && !rlState.finished) {
        showStatus("Start a roulette run first before saving.", true);
        return;
      }
      const code = encodeSaveCode(rlState);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(() => {
          showStatus("Save code copied to clipboard!");
        }).catch(() => {
          prompt("Copy your save code:", code);
        });
      } else {
        prompt("Copy your save code:", code);
      }
    });

    document.getElementById("rl-load-toggle-btn")?.addEventListener("click", () => {
      const box = document.getElementById("rl-load-box");
      if (!box) return;
      box.style.display = box.style.display === "none" ? "flex" : "none";
    });

    document.getElementById("rl-load-confirm-btn")?.addEventListener("click", () => {
      const input = document.getElementById("rl-code-input");
      if (!input || !input.value.trim()) return;
      try {
        const decoded = decodeSaveCode(input.value);
        if (!decoded) {
          showStatus("Invalid save code.", true);
          return;
        }
        rlState = decoded;
        persistLocal();
        renderRoulette();
        input.value = "";
        document.getElementById("rl-load-box").style.display = "none";
        showStatus("Save code loaded successfully!");
      } catch {
        showStatus("Invalid save code.", true);
      }
    });

    document.querySelector('[data-tab="roulette"]')?.addEventListener("click", () => {
      renderRoulette();
    });
  });
})();

(function enforceBannedAcrossAllModes() {
  function isPlayerBanned(rawName) {
    if (!rawName || typeof rawName !== "string") return false;
    const target = normalizeName(rawName);
    if (!target) return false;
    return (bannedPlayers || []).some(b => normalizeName(b) === target);
  }

  window.isPlayerBanned = isPlayerBanned;

  const origGetVisibleDemons = window.getVisibleDemons;
  window.getVisibleDemons = function () {
    let newPosition = 1;

    return globalDemons
      .map(demon => {
        let records = (demon.records || []).map(r => {
          if (typeof r === "string") {
            return { user: r, percent: 100, link: "" };
          }
          return {
            user: r.user || "",
            percent: r.percent || 100,
            link: r.link || ""
          };
        });

        records = records.filter(r => !isPlayerBanned(r.user));

        if (disableSpaceUK) {
          records = records.filter(r => !r.user.toLowerCase().includes("[c]"));
        }

        let verifier = demon.verifier || "Unknown";
        const verifierBanned = isPlayerBanned(verifier);
        const verifierIsCheater = verifier.toLowerCase().includes("[c]");

        if (verifierBanned || (disableSpaceUK && verifierIsCheater)) {
          if (records.length > 0) {
            verifier = records.user;
          } else {
            return null;
          }
        }

        return {
          ...demon,
          verifier,
          records,
          position: demon.cosmetic ? null : newPosition++
        };
      })
      .filter(Boolean);
  };

  const origLoadLeaderboard = window.loadLeaderboard;
  window.loadLeaderboard = async function (...args) {
    await origLoadLeaderboard.apply(this, args);

    setTimeout(() => {
      if (!window._leaderboardScores || !window._playerMap) return;

      let changed = false;
      Object.keys(window._leaderboardScores).forEach(key => {
        const display = window._playerMap.get(key) || key;
        if (isPlayerBanned(display) || isPlayerBanned(key)) {
          delete window._leaderboardScores[key];
          window._playerMap.delete(key);
          changed = true;
        }
      });

      if (changed) {
        const container = document.getElementById("leaderboard-container");
        if (!container) return;

        const searchQuery = (document.getElementById("player-search")?.value || "").toLowerCase();
        const filterMode = document.getElementById("leaderboard-filter")?.value || "points";

        const allPlayers = Object.entries(window._leaderboardScores).map(([key, score]) => {
          const name = window._playerMap.get(key);
          const hardest = getPlayerHardestDemon(name);
          return {
            key,
            name,
            score,
            hardestPosition: hardest?.position || 999999,
            rankName: getPlayerRank(score)
          };
        });

        if (typeof updateHomeStats === "function") {
          updateHomeStats(allPlayers.length);
        }

        const sorted = allPlayers.filter(p => {
          if (!searchQuery.trim()) return true;
          return cleanDisplayName(p.name).toLowerCase().includes(searchQuery);
        });

        if (filterMode === "points") {
          sorted.sort((a, b) => b.score - a.score);
        } else if (filterMode === "tier") {
          sorted.sort((a, b) => a.hardestPosition - b.hardestPosition || b.score - a.score);
        }

        container.innerHTML = `
          <div class="leaderboard-warning">
            WARNING: Rankings might not be accurate due to this list not being very popular. Take your rank with a grain of salt.
          </div>
        `;

        if (sorted.length > 0) {
          sorted.forEach((p, index) => {
            container.appendChild(createPlayerCard(p.name, p.score, index + 1));
          });
        } else {
          container.innerHTML = "<p>No players with scores yet.</p>";
        }
      }
    }, 520);
  };
})();

(function initTopThreeSpotlights() {
  const medals = [
    { cls: "podium-gold", label: "#1" },
    { cls: "podium-silver", label: "#2" },
    { cls: "podium-bronze", label: "#3" }
  ];

  function renderTopDemons() {
    const grid = document.getElementById("home-top-demons-grid");
    if (!grid) return;

    const visible = (typeof getVisibleDemons === "function" ? getVisibleDemons() : globalDemons)
      .filter(d => !d.cosmetic && d.position)
      .slice(0, 3);

    grid.innerHTML = "";

    visible.forEach((demon, i) => {
      const medal = medals[i];
      const thumb =
        (demon.thumbnail && demon.thumbnail.trim()) ||
        getYoutubeThumbnail(demon.verification) ||
        `https://prevter.me{demon.id}`;

      const score = demon.position ? (5500 / Math.sqrt(demon.position)).toFixed(2) : "0.00";

      const card = document.createElement("div");
      card.className = `podium-card ${medal.cls}`;
      card.innerHTML = `
        <img class="podium-thumb" src="${thumb}" alt="${demon.name}">
        <div class="podium-body">
          <span class="podium-rank-tag">${medal.label}</span>
          <h3 class="podium-title">${demon.name}</h3>
          <p class="podium-sub">Verified by ${cleanDisplayName(demon.verifier)} • ${score} pts</p>
        </div>
      `;
      card.addEventListener("click", () => openDemonPage(demon));
      grid.appendChild(card);
    });
  }

  function renderTopPlayers() {
    const grid = document.getElementById("home-top-players-grid");
    if (!grid) return;

    const scores = window._leaderboardScores || {};
    const playerMap = window._playerMap || new Map();

    const topPlayers = Object.entries(scores)
      .map(([key, score]) => ({
        key,
        name: playerMap.get(key) || key,
        score
      }))
      .filter(p => typeof window.isPlayerBanned !== "function" || !window.isPlayerBanned(p.name))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    grid.innerHTML = "";

    topPlayers.forEach((player, i) => {
      const medal = medals[i];
      const rankTitle = typeof getPlayerRank === "function" ? getPlayerRank(player.score) : "";

      const card = document.createElement("div");
      card.className = `podium-card ${medal.cls}`;
      card.innerHTML = `
        <div class="podium-body">
          <span class="podium-rank-tag">${medal.label}</span>
          <h3 class="podium-title">${cleanDisplayName(player.name)}</h3>
          <p class="podium-sub">${player.score.toFixed(2)} pts • ${rankTitle}</p>
        </div>
      `;
      card.addEventListener("click", () => {
        if (typeof window.jumpToPlayerProfile === "function") {
          window.jumpToPlayerProfile(player.name);
        }
      });
      grid.appendChild(card);
    });
  }

  function renderAllTopThree() {
    renderTopDemons();
    renderTopPlayers();
  }

  window.renderAllTopThree = renderAllTopThree;

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("spaceuk-toggle")?.addEventListener("click", () => {
      renderTopDemons();
      setTimeout(renderAllTopThree, 560);
    });

    const pollReady = setInterval(() => {
      if (
        globalDemons &&
        globalDemons.length > 0 &&
        window._leaderboardScores &&
        Object.keys(window._leaderboardScores).length > 0
      ) {
        clearInterval(pollReady);
        renderAllTopThree();
      }
    }, 150);
    setTimeout(() => clearInterval(pollReady), 8000);
  });
})();

(function initExtrasAndCustomLists() {
  const MAX_CODE_CHARS = 250000;
  const MAX_LEVELS = 250;
  const MAX_RECORDS_PER_LEVEL = 200;

  let customList = {
    title: "Untitled Custom List",
    levels: []
  };

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&#34;")
      .replace(/'/g, "&#39;");
  }

  function cleanText(str, maxLen) {
    if (typeof str !== "string") return "";
    return str.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, maxLen);
  }

  function sanitizeUrl(raw) {
    if (typeof raw !== "string") return "";
    const trimmed = raw.trim().slice(0, 300);
    if (!trimmed) return "";
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        return parsed.href;
      }
      return "";
    } catch {
      return "";
    }
  }

  function sanitizeRecord(rawRec) {
    if (!rawRec || typeof rawRec !== "object") return null;
    const user = cleanText(rawRec.user, 40);
    if (!user) return null;
    let percent = Number(rawRec.percent);
    if (!Number.isFinite(percent)) percent = 100;
    percent = Math.max(1, Math.min(100, Math.round(percent)));
    const link = sanitizeUrl(rawRec.link || "");
    return { user, percent, link };
  }

  function sanitizeLevel(rawLvl) {
    if (!rawLvl || typeof rawLvl !== "object") return null;
    const name = cleanText(rawLvl.name, 60);
    const verifier = cleanText(rawLvl.verifier, 40);
    const verification = sanitizeUrl(rawLvl.verification);
    if (!name || !verifier || !verification) return null;
    const thumbnail = sanitizeUrl(rawLvl.thumbnail || "");
    const existingId = rawLvl.existingId ? cleanText(String(rawLvl.existingId), 20) : "";
    const records = Array.isArray(rawLvl.records)
      ? rawLvl.records.slice(0, MAX_RECORDS_PER_LEVEL).map(sanitizeRecord).filter(Boolean)
      : [];
    return { name, verifier, verification, thumbnail, existingId, records };
  }

  function setStatus(msg, isError) {
    const el = document.getElementById("cl-status-msg");
    if (!el) return;
    el.style.color = isError ? "#ef4444" : "var(--accent-green)";
    el.textContent = msg;
    setTimeout(function () {
      if (el.textContent === msg) el.textContent = "";
    }, 4500);
  }

      function encodeCustomList(listObj) {
    const payload = {
      t: cleanText(listObj.title, 60) || "Untitled Custom List",
      l: listObj.levels.slice(0, MAX_LEVELS).map(function (lvl) {
        return {
          n: lvl.name,
          v: lvl.verifier,
          u: lvl.verification,
          m: lvl.thumbnail || "",
          i: lvl.existingId || "",
          r: (lvl.records || []).map(function (r) {
            return [r.user, r.percent, r.link || ""];
          })
        };
      })
    };
    return "GDCL1-" + btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  }

  function decodeCustomList(rawCode) {
    if (typeof rawCode !== "string") return null;
    const trimmed = rawCode.trim();
    if (!trimmed.startsWith("GDCL1-") || trimmed.length > MAX_CODE_CHARS) return null;
    const jsonStr = decodeURIComponent(escape(atob(trimmed.slice(6))));
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.l)) return null;

    const title = cleanText(parsed.t, 60) || "Untitled Custom List";
    const levels = parsed.l
      .slice(0, MAX_LEVELS)
      .map(function (item) {
        if (!item || typeof item !== "object") return null;
        return sanitizeLevel({
          name: item.n,
          verifier: item.v,
          verification: item.u,
          thumbnail: item.m,
          existingId: item.i,
          records: Array.isArray(item.r)
            ? item.r.map(function (arr) {
                return Array.isArray(arr) ? { user: arr, percent: arr, link: arr } : null;
              })
            : []
        });
      })
      .filter(Boolean);

    return { title, levels };
  }

  function parseRecordsTextarea(text) {
    if (!text || typeof text !== "string") return [];
    return text
      .split("\n")
      .map(function (line) {
        return line.trim();
      })
      .filter(Boolean)
      .slice(0, MAX_RECORDS_PER_LEVEL)
      .map(function (line) {
        const parts = line.split(",").map(function (p) {
          return p.trim();
        });
        return sanitizeRecord({
          user: parts,
          percent: parts !== undefined ? parts : 100,
          link: parts || ""
        });
      })
      .filter(Boolean);
  }

  function getResolvedThumbnail(lvl) {
    if (lvl.thumbnail) return lvl.thumbnail;
    const yt = typeof getYoutubeThumbnail === "function" ? getYoutubeThumbnail(lvl.verification) : "";
    if (yt) return yt;
    if (lvl.existingId) return "https://prevter.me" + encodeURIComponent(lvl.existingId);
    return "extreme.png";
  }

  function updateHeaderBadge() {
    const badge = document.getElementById("cl-active-title");
    if (badge) {
      const plural = customList.levels.length === 1 ? "" : "s";
      badge.textContent = "Active List: " + customList.title + " (" + customList.levels.length + " level" + plural + ")";
    }
  }

      function renderCustomListView() {
    const container = document.getElementById("cl-levels-container");
    if (!container) return;
    container.innerHTML = "";

    if (customList.levels.length === 0) {
      container.innerHTML = '<div class="panel"><p>No levels in this custom list yet. Switch to <strong>List Maker</strong> or load a save code.</p></div>';
      return;
    }

    customList.levels.forEach(function (lvl, idx) {
      const pos = idx + 1;
      const pts = (5500 / Math.sqrt(pos)).toFixed(2);
      const thumb = getResolvedThumbnail(lvl);

      const card = document.createElement("div");
      card.className = "cl-level-card";

      const img = document.createElement("img");
      img.className = "cl-level-thumb";
      img.src = thumb;
      img.alt = lvl.name;

      const body = document.createElement("div");
      body.className = "cl-level-body";
      body.innerHTML =
        '<h3><span class="demon-rank">#' + pos + '</span> — ' + escapeHtml(lvl.name) + '</h3>' +
        '<p class="demon-meta-line">Verified by <span class="demon-verifier">' + escapeHtml(lvl.verifier) + '</span> • <strong>' + pts + ' pts</strong></p>' +
        '<div>' +
          '<a href="' + escapeHtml(lvl.verification) + '" target="_blank" rel="noopener noreferrer nofollow" class="dp-back-btn" style="display:inline-flex;margin:4px 0 0 0;padding:6px 12px;font-size:0.8rem;">Watch Verification ↗</a>' +
        '</div>';

      if (lvl.records && lvl.records.length > 0) {
        const pillsWrap = document.createElement("div");
        pillsWrap.className = "cl-records-pills";
        lvl.records.forEach(function (r) {
          if (r.link) {
            const a = document.createElement("a");
            a.className = "cl-rec-pill";
            a.href = r.link;
            a.target = "_blank";
            a.rel = "noopener noreferrer nofollow";
            a.textContent = r.user + " (" + r.percent + "%)";
            pillsWrap.appendChild(a);
          } else {
            const span = document.createElement("span");
            span.className = "cl-rec-pill";
            span.textContent = r.user + " (" + r.percent + "%)";
            pillsWrap.appendChild(span);
          }
        });
        body.appendChild(pillsWrap);
      }

      card.appendChild(img);
      card.appendChild(body);
      container.appendChild(card);
    });
  }

  function renderCustomLeaderboard() {
    const container = document.getElementById("cl-leaderboard-container");
    if (!container) return;
    container.innerHTML = "";

    if (customList.levels.length === 0) {
      container.innerHTML = '<div class="panel"><p>Add levels to your custom list to generate a leaderboard.</p></div>';
      return;
    }

    const scoreMap = new Map();
    const displayNames = new Map();

    function addScore(rawName, pts) {
      const key = rawName.toLowerCase();
      if (!displayNames.has(key)) displayNames.set(key, rawName);
      scoreMap.set(key, (scoreMap.get(key) || 0) + pts);
    }

    customList.levels.forEach(function (lvl, idx) {
      const pos = idx + 1;
      const basePts = 5500 / Math.sqrt(pos);

      addScore(lvl.verifier, basePts);

      const seenOnLevel = new Set([lvl.verifier.toLowerCase()]);
      (lvl.records || []).forEach(function (r) {
        const rKey = r.user.toLowerCase();
        if (seenOnLevel.has(rKey)) return;
        seenOnLevel.add(rKey);
        const earned = r.percent >= 100 ? basePts : basePts * (r.percent / 100) * 0.5;
        addScore(r.user, earned);
      });
    });

    const ranked = Array.from(scoreMap.entries())
      .map(function (entry) {
        return {
          name: displayNames.get(entry),
          score: entry
        };
      })
      .sort(function (a, b) {
        return b.score - a.score;
      });

    ranked.forEach(function (p, idx) {
      const row = document.createElement("div");
      row.className = "cl-lb-row";
      row.innerHTML =
        '<span><strong>#' + (idx + 1) + '</strong> &nbsp; ' + escapeHtml(p.name) + '</span>' +
        '<strong>' + p.score.toFixed(2) + ' pts</strong>';
      container.appendChild(row);
    });
  }

      function renderMakerOrder() {
    const listEl = document.getElementById("cl-maker-order-list");
    if (!listEl) return;
    listEl.innerHTML = "";

    if (customList.levels.length === 0) {
      listEl.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem;">No levels added yet.</p>';
      return;
    }

    customList.levels.forEach(function (lvl, idx) {
      const row = document.createElement("div");
      row.className = "cl-order-item";

      const meta = document.createElement("div");
      meta.className = "cl-order-meta";
      meta.innerHTML =
        '<strong>#' + (idx + 1) + ' — ' + escapeHtml(lvl.name) + '</strong>' +
        '<span>Verifier: ' + escapeHtml(lvl.verifier) + ' • ' + (lvl.records || []).length + ' record(s)</span>';

      const btns = document.createElement("div");
      btns.className = "cl-order-btns";

      const upBtn = document.createElement("button");
      upBtn.type = "button";
      upBtn.className = "cl-mini-btn";
      upBtn.textContent = "↑";
      upBtn.disabled = idx === 0;
      upBtn.addEventListener("click", function () {
        const temp = customList.levels[idx - 1];
        customList.levels[idx - 1] = customList.levels[idx];
        customList.levels[idx] = temp;
        refreshAllCustomViews();
      });

      const downBtn = document.createElement("button");
      downBtn.type = "button";
      downBtn.className = "cl-mini-btn";
      downBtn.textContent = "↓";
      downBtn.disabled = idx === customList.levels.length - 1;
      downBtn.addEventListener("click", function () {
        const temp = customList.levels[idx + 1];
        customList.levels[idx + 1] = customList.levels[idx];
        customList.levels[idx] = temp;
        refreshAllCustomViews();
      });

      const addRecBtn = document.createElement("button");
      addRecBtn.type = "button";
      addRecBtn.className = "cl-mini-btn";
      addRecBtn.textContent = "+Rec";
      addRecBtn.addEventListener("click", function () {
        const raw = prompt('Add record to "' + lvl.name + '" (Format: Player, Percent, OptionalURL):');
        if (!raw) return;
        const parsed = parseRecordsTextarea(raw);
        if (parsed.length === 0) {
          setStatus("Invalid record format.", true);
          return;
        }
        lvl.records = (lvl.records || []).concat(parsed).slice(0, MAX_RECORDS_PER_LEVEL);
        refreshAllCustomViews();
        setStatus("Added record for " + parsed[0].user + ".");
      });

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "cl-mini-btn danger";
      delBtn.textContent = "✕";
      delBtn.addEventListener("click", function () {
        customList.levels.splice(idx, 1);
        refreshAllCustomViews();
      });

      btns.append(upBtn, downBtn, addRecBtn, delBtn);
      row.append(meta, btns);
      listEl.appendChild(row);
    });
  }

  function refreshAllCustomViews() {
    updateHeaderBadge();
    renderCustomListView();
    renderCustomLeaderboard();
    renderMakerOrder();
  }

  function populateExistingSelect() {
    const select = document.getElementById("cl-import-select");
    if (!select) return;
    const demons = (typeof getVisibleDemons === "function" ? getVisibleDemons() : globalDemons)
      .filter(function (d) {
        return !d.cosmetic;
      });

    select.innerHTML = "";
    demons.forEach(function (d) {
      const opt = document.createElement("option");
      opt.value = String(d.id);
      opt.textContent = "#" + (d.position || "?") + " — " + d.name;
      select.appendChild(opt);
    });
  }

  function convertOfficialDemonToCustom(d) {
    return sanitizeLevel({
      name: cleanDisplayName(d.name),
      verifier: cleanDisplayName(d.verifier),
      verification: d.verification || "https://youtube.com",
      thumbnail: d.thumbnail || "",
      existingId: String(d.id || ""),
      records: (d.records || []).map(function (r) {
        if (typeof r === "string") {
          return { user: cleanDisplayName(r), percent: 100, link: "" };
        }
        return {
          user: cleanDisplayName(r.user || ""),
          percent: r.percent || 100,
          link: r.link || ""
        };
      })
    });
  }

      document.addEventListener("DOMContentLoaded", function () {
    const dropdown = document.getElementById("extras-dropdown");
    const toggleBtn = document.getElementById("extras-dropdown-toggle");
    const menuItems = document.querySelectorAll(".extras-menu-item");

    if (dropdown && toggleBtn) {
      function syncExtrasActiveState() {
        const anyActive = Array.from(menuItems).some(function (item) {
          return item.classList.contains("active");
        });
        toggleBtn.classList.toggle("active", anyActive);
      }

      toggleBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        dropdown.classList.toggle("open");
      });

      menuItems.forEach(function (item) {
        item.addEventListener("click", function () {
          dropdown.classList.remove("open");
          setTimeout(syncExtrasActiveState, 0);
        });
      });

      document.querySelectorAll(".tabs > .tab-btn:not(.extras-dropdown-btn)").forEach(function (btn) {
        btn.addEventListener("click", function () {
          dropdown.classList.remove("open");
          toggleBtn.classList.remove("active");
        });
      });

      document.addEventListener("click", function (e) {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove("open");
        }
      });

      setTimeout(syncExtrasActiveState, 100);
    }

    document.querySelectorAll(".cl-view-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".cl-view-btn").forEach(function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
        const target = btn.dataset.clview;
        document.getElementById("cl-pane-list").style.display = target === "list" ? "block" : "none";
        document.getElementById("cl-pane-leaderboard").style.display = target === "leaderboard" ? "block" : "none";
        document.getElementById("cl-pane-maker").style.display = target === "maker" ? "block" : "none";
        refreshAllCustomViews();
      });
    });

    const listNameInput = document.getElementById("cl-list-name-input");
    if (listNameInput) {
      listNameInput.addEventListener("input", function (e) {
        customList.title = cleanText(e.target.value, 60) || "Untitled Custom List";
        updateHeaderBadge();
      });
    }

    const importAddBtn = document.getElementById("cl-import-add-btn");
    if (importAddBtn) {
      importAddBtn.addEventListener("click", function () {
        if (customList.levels.length >= MAX_LEVELS) {
          setStatus("Maximum of " + MAX_LEVELS + " levels reached.", true);
          return;
        }
        const selectEl = document.getElementById("cl-import-select");
        const id = selectEl ? selectEl.value : "";
        const demons = typeof getVisibleDemons === "function" ? getVisibleDemons() : globalDemons;
        const found = demons.find(function (d) {
          return String(d.id) === String(id);
        });
        if (!found) return;
        const converted = convertOfficialDemonToCustom(found);
        if (converted) {
          customList.levels.push(converted);
          refreshAllCustomViews();
          setStatus('Added "' + converted.name + '" to custom list.');
        }
      });
    }

    const importAllBtn = document.getElementById("cl-import-all-btn");
    if (importAllBtn) {
      importAllBtn.addEventListener("click", function () {
        const demons = (typeof getVisibleDemons === "function" ? getVisibleDemons() : globalDemons)
          .filter(function (d) {
            return !d.cosmetic;
          })
          .slice(0, MAX_LEVELS);
        customList.levels = demons.map(convertOfficialDemonToCustom).filter(Boolean);
        refreshAllCustomViews();
        setStatus("Imported " + customList.levels.length + " levels.");
      });
    }

    const shuffleBtn = document.getElementById("cl-shuffle-btn");
    if (shuffleBtn) {
      shuffleBtn.addEventListener("click", function () {
        if (customList.levels.length < 2) {
          setStatus("Add at least 2 levels to shuffle.", true);
          return;
        }
        for (let i = customList.levels.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const temp = customList.levels[i];
          customList.levels[i] = customList.levels[j];
          customList.levels[j] = temp;
        }
        refreshAllCustomViews();
        setStatus("List order shuffled!");
      });
    }

    const addCustomBtn = document.getElementById("cl-add-custom-btn");
    if (addCustomBtn) {
      addCustomBtn.addEventListener("click", function () {
        if (customList.levels.length >= MAX_LEVELS) {
          setStatus("Maximum of " + MAX_LEVELS + " levels reached.", true);
          return;
        }
        const nameInput = document.getElementById("cl-new-name");
        const verifierInput = document.getElementById("cl-new-verifier");
        const verifUrlInput = document.getElementById("cl-new-verification");
        const thumbInput = document.getElementById("cl-new-thumb");
        const recordsInput = document.getElementById("cl-new-records");

        const lvl = sanitizeLevel({
          name: nameInput.value,
          verifier: verifierInput.value,
          verification: verifUrlInput.value,
          thumbnail: thumbInput.value,
          records: parseRecordsTextarea(recordsInput.value)
        });

        if (!lvl) {
          setStatus("Enter a valid Level Name, Verifier, and http(s) Verification URL.", true);
          return;
        }

        customList.levels.push(lvl);
        nameInput.value = "";
        verifierInput.value = "";
        verifUrlInput.value = "";
        thumbInput.value = "";
        recordsInput.value = "";

        refreshAllCustomViews();
        setStatus('Created "' + lvl.name + '"!');
      });
    }

    const copyCodeBtn = document.getElementById("cl-copy-code-btn");
    if (copyCodeBtn) {
      copyCodeBtn.addEventListener("click", function () {
        if (customList.levels.length === 0) {
          setStatus("Add at least one level before generating a save code.", true);
          return;
        }
        const code = encodeCustomList(customList);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(function () {
            setStatus("Custom list save code copied to clipboard!");
          }).catch(function () {
            prompt("Copy your custom list save code:", code);
          });
        } else {
          prompt("Copy your custom list save code:", code);
        }
      });
    }

    const toggleLoadBtn = document.getElementById("cl-toggle-load-btn");
    if (toggleLoadBtn) {
      toggleLoadBtn.addEventListener("click", function () {
        const drawer = document.getElementById("cl-load-drawer");
        if (!drawer) return;
        drawer.style.display = drawer.style.display === "none" ? "flex" : "none";
      });
    }

    const confirmLoadBtn = document.getElementById("cl-confirm-load-btn");
    if (confirmLoadBtn) {
      confirmLoadBtn.addEventListener("click", function () {
        const input = document.getElementById("cl-load-input");
        if (!input || !input.value.trim()) return;
        try {
          const decoded = decodeCustomList(input.value);
          if (!decoded) {
            setStatus("Invalid or unsafe custom list code.", true);
            return;
          }
          customList = decoded;
          const titleInput = document.getElementById("cl-list-name-input");
          if (titleInput) titleInput.value = customList.title;
          input.value = "";
          document.getElementById("cl-load-drawer").style.display = "none";
          refreshAllCustomViews();
          setStatus('Loaded "' + customList.title + '" (' + customList.levels.length + ' levels).');
        } catch {
          setStatus("Failed to decode custom list code.", true);
        }
      });
    }

    const resetBtn = document.getElementById("cl-reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        customList = { title: "Untitled Custom List", levels: [] };
        const titleInput = document.getElementById("cl-list-name-input");
        if (titleInput) titleInput.value = "";
        refreshAllCustomViews();
        setStatus("Custom list cleared.");
      });
    }

    const customListsTabBtn = document.querySelector('.extras-menu-item[data-tab="custom-lists"]');
    if (customListsTabBtn) {
      customListsTabBtn.addEventListener("click", function () {
        populateExistingSelect();
        refreshAllCustomViews();
      });
    }

    const pollDemons = setInterval(function () {
      if (globalDemons && globalDemons.length > 0) {
        clearInterval(pollDemons);
        populateExistingSelect();
        refreshAllCustomViews();
      }
    }, 150);
    setTimeout(function () {
      clearInterval(pollDemons);
    }, 8000);
  });
})();

window._customListState = {
  active: false,
  title: "Official Demonlist",
  demons: []
};

window.useCustomList = function (levels, title) {
  if (!Array.isArray(levels) || levels.length === 0) return false;

  const cleanTitle = typeof title === "string" && title.trim()
    ? title.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, 60)
    : "Custom Demonlist";

  const formatted = levels.map(function (lvl, index) {
    const safeUrl = function (u) {
      try {
        const parsed = new URL(String(u || "").trim());
        return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : "";
      } catch {
        return "";
      }
    };

    const rawRecords = Array.isArray(lvl.records) ? lvl.records : [];
    const cleanRecords = rawRecords.map(function (r) {
      if (typeof r === "string") {
        return { user: r.trim().slice(0, 40), percent: 100, link: "" };
      }
      const pct = Number(r.percent);
      return {
        user: String(r.user || "").trim().slice(0, 40),
        percent: Number.isFinite(pct) ? Math.max(1, Math.min(100, Math.round(pct))) : 100,
        link: safeUrl(r.link)
      };
    }).filter(function (r) {
      return r.user.length > 0;
    });

    return {
      id: lvl.id ? String(lvl.id).slice(0, 30) : "custom-" + (index + 1),
      name: String(lvl.name || "Untitled").trim().slice(0, 60),
      verifier: String(lvl.verifier || "Unknown").trim().slice(0, 40),
      creator: String(lvl.creator || lvl.verifier || "Unknown").trim().slice(0, 40),
      verification: safeUrl(lvl.verification) || "https://youtube.com",
      thumbnail: safeUrl(lvl.thumbnail),
      password: String(lvl.password || "Free Copy").slice(0, 20),
      position: index + 1,
      cosmetic: false,
      records: cleanRecords
    };
  });

  window._customListState = {
    active: true,
    title: cleanTitle,
    demons: formatted
  };

  const banner = document.getElementById("cl-active-banner");
  const bannerText = document.getElementById("cl-banner-text");
  if (banner && bannerText) {
    banner.style.display = "flex";
    bannerText.textContent = "Custom List: " + cleanTitle + " (" + formatted.length + " levels)";
  }

  if (typeof renderDemonCards === "function") renderDemonCards();
  if (typeof populateMegaMenu === "function") populateMegaMenu();
  if (typeof loadLeaderboard === "function") loadLeaderboard();
  if (typeof window.renderAllTopThree === "function") window.renderAllTopThree();

  return true;
};

window.exitCustomList = function () {
  window._customListState = {
    active: false,
    title: "Official Demonlist",
    demons: []
  };

  const banner = document.getElementById("cl-active-banner");
  if (banner) banner.style.display = "none";

  if (typeof renderDemonCards === "function") renderDemonCards();
  if (typeof populateMegaMenu === "function") populateMegaMenu();
  if (typeof loadLeaderboard === "function") loadLeaderboard();
  if (typeof window.renderAllTopThree === "function") window.renderAllTopThree();
};

(function hookCustomListIntoSite() {
  const originalGetVisibleDemons = window.getVisibleDemons;
  window.getVisibleDemons = function () {
    if (window._customListState && window._customListState.active) {
      return window._customListState.demons;
    }
    return typeof originalGetVisibleDemons === "function" ? originalGetVisibleDemons() : globalDemons;
  };

  const originalLoadLeaderboard = window.loadLeaderboard;
  window.loadLeaderboard = async function () {
    if (window._customListState && window._customListState.active) {
      const demons = window._customListState.demons;
      const scores = {};
      const playerMap = new Map();

      const addPts = function (rawName, pts) {
        if (!rawName) return;
        const key = typeof normalizeName === "function" ? normalizeName(rawName) : rawName.toLowerCase();
        if (!key) return;
        if (!playerMap.has(key)) {
          playerMap.set(key, typeof cleanDisplayName === "function" ? cleanDisplayName(rawName) : rawName);
        }
        scores[key] = (scores[key] || 0) + pts;
      };

      demons.forEach(function (d) {
        const baseScore = 5500 / Math.sqrt(d.position);
        addPts(d.verifier, baseScore);

        const seen = new Set([
          typeof normalizeName === "function" ? normalizeName(d.verifier) : d.verifier.toLowerCase()
        ]);

        (d.records || []).forEach(function (r) {
          const rKey = typeof normalizeName === "function" ? normalizeName(r.user) : r.user.toLowerCase();
          if (!rKey || seen.has(rKey)) return;
          seen.add(rKey);
          const earned = r.percent >= 100 ? baseScore : baseScore * (r.percent / 100) * 0.5;
          addPts(r.user, earned);
        });
      });

      window._leaderboardScores = scores;
      window._playerMap = playerMap;

      const container = document.getElementById("leaderboard-container");
      if (!container) return;

      const searchQuery = (document.getElementById("player-search")?.value || "").toLowerCase();
      const filterMode = document.getElementById("leaderboard-filter")?.value || "points";

      const sorted = Object.entries(scores)
        .map(function (pair) {
          const name = playerMap.get(pair[0]);
          const hardest = typeof getPlayerHardestDemon === "function" ? getPlayerHardestDemon(name) : null;
          return {
            key: pair[0],
            name: name,
            score: pair[1],
            hardestPosition: hardest ? hardest.position : 999999
          };
        })
        .filter(function (p) {
          return !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery);
        });

      if (filterMode === "points") {
        sorted.sort(function (a, b) { return b.score - a.score; });
      } else {
        sorted.sort(function (a, b) { return a.hardestPosition - b.hardestPosition || b.score - a.score; });
      }

      container.innerHTML = "";
      if (sorted.length > 0 && typeof createPlayerCard === "function") {
        sorted.forEach(function (p, i) {
          container.appendChild(createPlayerCard(p.name, p.score, i + 1));
        });
      } else {
        container.innerHTML = "<p>No players with scores in this custom list yet.</p>";
      }
      return;
    }

    if (typeof originalLoadLeaderboard === "function") {
      return originalLoadLeaderboard.apply(this, arguments);
    }
  };
})();

(function () {
  const MAX_CODE_CHARS = 250000;
  const MAX_LEVELS = 250;
  const MAX_RECORDS_PER_LEVEL = 200;

  let customList = {
    title: "Untitled Custom List",
    levels: []
  };

  function cleanText(str, maxLen) {
    if (typeof str !== "string") return "";
    return str.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, maxLen);
  }

  function sanitizeUrl(raw) {
    if (typeof raw !== "string") return "";
    const trimmed = raw.trim().slice(0, 300);
    if (!trimmed) return "";
    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : "";
    } catch {
      return "";
    }
  }

  function sanitizeRecord(rawRec) {
    if (!rawRec || typeof rawRec !== "object") return null;
    const user = cleanText(rawRec.user, 40);
    if (!user) return null;
    let percent = Number(rawRec.percent);
    if (!Number.isFinite(percent)) percent = 100;
    percent = Math.max(1, Math.min(100, Math.round(percent)));
    return {
      user: user,
      percent: percent,
      link: sanitizeUrl(rawRec.link || "")
    };
  }

  function sanitizeLevel(rawLvl) {
    if (!rawLvl || typeof rawLvl !== "object") return null;
    const name = cleanText(rawLvl.name, 60);
    const verifier = cleanText(rawLvl.verifier, 40);
    const verification = sanitizeUrl(rawLvl.verification);
    if (!name || !verifier || !verification) return null;
    const records = Array.isArray(rawLvl.records)
      ? rawLvl.records.slice(0, MAX_RECORDS_PER_LEVEL).map(sanitizeRecord).filter(Boolean)
      : [];
    return {
      id: rawLvl.id ? cleanText(String(rawLvl.id), 30) : "",
      name: name,
      verifier: verifier,
      creator: rawLvl.creator ? cleanText(rawLvl.creator, 40) : verifier,
      verification: verification,
      thumbnail: sanitizeUrl(rawLvl.thumbnail || ""),
      password: rawLvl.password ? cleanText(String(rawLvl.password), 20) : "Free Copy",
      records: records
    };
  }

  function setStatus(msg, isError) {
    const el = document.getElementById("cl-status-msg");
    if (!el) return;
    el.style.color = isError ? "#ef4444" : "var(--accent-green)";
    el.textContent = msg;
    setTimeout(function () {
      if (el.textContent === msg) el.textContent = "";
    }, 4000);
  }

   function getThumb(lvl) {
    if (lvl.thumbnail) return lvl.thumbnail;
    if (typeof getYoutubeThumbnail === "function") {
      const yt = getYoutubeThumbnail(lvl.verification);
      if (yt) return yt;
    }
    if (lvl.id && !String(lvl.id).startsWith("custom")) {
      return "https://prevter.me" + encodeURIComponent(lvl.id);
    }
    return "extreme.png";
  }

  function getYoutubeEmbed(url) {
    try {
      const u = new URL(url);
      let vid = "";
      if (u.hostname.includes("youtu.be")) {
        vid = u.pathname.slice(1);
      } else if (u.hostname.includes("youtube.com")) {
        vid = u.searchParams.get("v") || "";
      }
      return vid ? "https://youtube.com" + encodeURIComponent(vid) : "";
    } catch {
      return "";
    }
  }

  function openCustomDemonDetail(lvl, position) {
    const listEl = document.getElementById("cl-levels-container");
    const detailEl = document.getElementById("cl-demon-detail");
    if (!listEl || !detailEl) return;

    listEl.style.display = "none";
    detailEl.style.display = "block";
    detailEl.innerHTML = "";

    const score = (5500 / Math.sqrt(position)).toFixed(2);
    const embedUrl = getYoutubeEmbed(lvl.verification);

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "dp-back-btn";
    backBtn.textContent = "← Back to Custom List";
    backBtn.addEventListener("click", function () {
      detailEl.style.display = "none";
      listEl.style.display = "flex";
    });
    detailEl.appendChild(backBtn);

    const mainCard = document.createElement("div");
    mainCard.className = "dp-main-card";

    const header = document.createElement("div");
    header.className = "dp-header";

    const titleWrap = document.createElement("div");
    const h1 = document.createElement("h1");
    h1.className = "dp-title";
    h1.textContent = lvl.name;

    const sub = document.createElement("p");
    sub.className = "dp-creators";
    sub.textContent = "By " + (lvl.creator || lvl.verifier) + " • Verified by " + lvl.verifier;
    titleWrap.append(h1, sub);

    const pill = document.createElement("span");
    pill.className = "dp-rank-pill";
    pill.textContent = "#" + position;

    header.append(titleWrap, pill);
    mainCard.appendChild(header);

    if (embedUrl) {
      const videoWrap = document.createElement("div");
      videoWrap.className = "dp-video-wrap";
      const iframe = document.createElement("iframe");
      iframe.src = embedUrl;
      iframe.allowFullscreen = true;
      iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      videoWrap.appendChild(iframe);
      mainCard.appendChild(videoWrap);
    } else {
      const linkBtn = document.createElement("a");
      linkBtn.href = lvl.verification;
      linkBtn.target = "_blank";
      linkBtn.rel = "noopener noreferrer nofollow";
      linkBtn.className = "sidebar-action-btn";
      linkBtn.style.display = "inline-block";
      linkBtn.style.width = "auto";
      linkBtn.textContent = "Watch Verification Video ↗";
      mainCard.appendChild(linkBtn);
    }

    const infoGrid = document.createElement("div");
    infoGrid.className = "dp-info-grid";

    const boxes = [
      { label: "List Score (100%)", value: score + " pts" },
      { label: "Verifier", value: lvl.verifier },
      { label: "Password", value: lvl.password || "Free Copy" },
      { label: "Level ID", value: lvl.id || "Custom" }
    ];

    boxes.forEach(function (b) {
      const box = document.createElement("div");
      box.className = "dp-info-box";
      const lbl = document.createElement("span");
      lbl.className = "dp-info-label";
      lbl.textContent = b.label;
      const val = document.createElement("span");
      val.className = "dp-info-value";
      val.textContent = b.value;
      box.append(lbl, val);
      infoGrid.appendChild(box);
    });

    mainCard.appendChild(infoGrid);
    detailEl.appendChild(mainCard);

    const recCard = document.createElement("div");
    recCard.className = "dp-records-card";
    const recTitle = document.createElement("h2");
    recTitle.textContent = "Records (" + (lvl.records ? lvl.records.length : 0) + ")";
    recCard.appendChild(recTitle);

    if (lvl.records && lvl.records.length > 0) {
      const recList = document.createElement("div");
      recList.className = "dp-records-list";
      lvl.records.forEach(function (r) {
        const row = document.createElement("div");
        row.className = "dp-record-row";

        const userSpan = document.createElement("span");
        userSpan.className = "dp-record-user";
        userSpan.textContent = r.user;

        const rightWrap = document.createElement("div");
        rightWrap.style.display = "flex";
        rightWrap.style.alignItems = "center";
        rightWrap.style.gap = "12px";

        const pctSpan = document.createElement("span");
        pctSpan.className = "dp-record-pct";
        pctSpan.textContent = r.percent + "%";
        rightWrap.appendChild(pctSpan);

        if (r.link) {
          const vidLink = document.createElement("a");
          vidLink.href = r.link;
          vidLink.target = "_blank";
          vidLink.rel = "noopener noreferrer nofollow";
          vidLink.className = "dp-record-link";
          vidLink.textContent = "Video ↗";
          rightWrap.appendChild(vidLink);
        }

        row.append(userSpan, rightWrap);
        recList.appendChild(row);
      });
      recCard.appendChild(recList);
    } else {
      const emptyP = document.createElement("p");
      emptyP.style.color = "var(--text-muted)";
      emptyP.textContent = "No records submitted on this level yet.";
      recCard.appendChild(emptyP);
    }

    detailEl.appendChild(recCard);
  }

   function renderCustomListCards() {
    const listEl = document.getElementById("cl-levels-container");
    const detailEl = document.getElementById("cl-demon-detail");
    if (!listEl) return;

    if (detailEl) detailEl.style.display = "none";
    listEl.style.display = "flex";
    listEl.innerHTML = "";

    if (customList.levels.length === 0) {
      listEl.innerHTML = '<div class="panel"><p>No levels in this custom list yet. Open <strong>List Maker</strong> or load a save code.</p></div>';
      return;
    }

    customList.levels.forEach(function (lvl, idx) {
      const pos = idx + 1;
      const pts = (5500 / Math.sqrt(pos)).toFixed(2);

      const card = document.createElement("div");
      card.className = "demon-card";

      const img = document.createElement("img");
      img.src = getThumb(lvl);
      img.alt = lvl.name;

      const info = document.createElement("div");
      info.className = "demon-info";

      const h2 = document.createElement("h2");
      const rankSpan = document.createElement("span");
      rankSpan.className = "demon-rank";
      rankSpan.textContent = "#" + pos;
      h2.append(rankSpan, document.createTextNode(" — " + lvl.name));

      const meta = document.createElement("p");
      meta.className = "demon-meta-line";
      meta.textContent = "Verified by " + lvl.verifier + " • " + pts + " pts";

      info.append(h2, meta);
      card.append(img, info);

      card.addEventListener("click", function () {
        openCustomDemonDetail(lvl, pos);
      });

      listEl.appendChild(card);
    });
  }

  function renderCustomLeaderboard() {
    const container = document.getElementById("cl-leaderboard-container");
    const profilePane = document.getElementById("cl-player-profile");
    if (!container) return;

    container.innerHTML = "";

    if (customList.levels.length === 0) {
      container.innerHTML = "<p>Add levels to your custom list to generate rankings.</p>";
      if (profilePane) profilePane.innerHTML = '<p style="color:var(--text-muted);">No custom list loaded.</p>';
      return;
    }

    const players = new Map();

    function ensurePlayer(rawName) {
      const key = rawName.toLowerCase();
      if (!players.has(key)) {
        players.set(key, {
          name: rawName,
          score: 0,
          verified: [],
          completed: []
        });
      }
      return players.get(key);
    }

    customList.levels.forEach(function (lvl, idx) {
      const pos = idx + 1;
      const basePts = 5500 / Math.sqrt(pos);

      const verPlayer = ensurePlayer(lvl.verifier);
      verPlayer.score += basePts;
      verPlayer.verified.push({ name: lvl.name, position: pos, pts: basePts });

      const seen = new Set([lvl.verifier.toLowerCase()]);
      (lvl.records || []).forEach(function (r) {
        const rKey = r.user.toLowerCase();
        if (seen.has(rKey)) return;
        seen.add(rKey);
        const earned = r.percent >= 100 ? basePts : basePts * (r.percent / 100) * 0.5;
        const pObj = ensurePlayer(r.user);
        pObj.score += earned;
        pObj.completed.push({ name: lvl.name, position: pos, percent: r.percent, pts: earned });
      });
    });

    const query = (document.getElementById("cl-player-search")?.value || "").toLowerCase().trim();
    const ranked = Array.from(players.values())
      .filter(function (p) {
        return !query || p.name.toLowerCase().includes(query);
      })
      .sort(function (a, b) {
        return b.score - a.score;
      });

    function showCustomPlayerProfile(playerObj, rankNum) {
      if (!profilePane) return;
      profilePane.innerHTML = "";

      const header = document.createElement("div");
      header.className = "player-profile-header";

      const h1 = document.createElement("h1");
      h1.textContent = "#" + rankNum + " — " + playerObj.name;

      const ptsP = document.createElement("p");
      ptsP.textContent = "Score: " + playerObj.score.toFixed(2) + " pts";

      const rankTitle = typeof getPlayerRank === "function" ? getPlayerRank(playerObj.score) : "";
      const rankP = document.createElement("p");
      rankP.textContent = "Rank: " + (rankTitle || "Ranked");

      header.append(h1, ptsP, rankP);
      profilePane.appendChild(header);

      if (playerObj.verified.length > 0) {
        const vTitle = document.createElement("h3");
        vTitle.textContent = "Verified (" + playerObj.verified.length + ")";
        profilePane.appendChild(vTitle);

        playerObj.verified.forEach(function (v) {
          const item = document.createElement("div");
          item.className = "dp-record-row";
          item.style.marginBottom = "6px";
          item.textContent = "#" + v.position + " — " + v.name + " (" + v.pts.toFixed(2) + " pts)";
          profilePane.appendChild(item);
        });
      }

      if (playerObj.completed.length > 0) {
        const cTitle = document.createElement("h3");
        cTitle.textContent = "Completed (" + playerObj.completed.length + ")";
        profilePane.appendChild(cTitle);

        playerObj.completed.forEach(function (c) {
          const item = document.createElement("div");
          item.className = "dp-record-row";
          item.style.marginBottom = "6px";
          item.textContent = "#" + c.position + " — " + c.name + " (" + c.percent + "% • " + c.pts.toFixed(2) + " pts)";
          profilePane.appendChild(item);
        });
      }
    }

    ranked.forEach(function (p, i) {
      const rankNum = i + 1;
      const card = typeof createPlayerCard === "function"
        ? createPlayerCard(p.name, p.score, rankNum)
        : document.createElement("div");

      if (typeof createPlayerCard !== "function") {
        card.className = "player-card";
        card.textContent = "#" + rankNum + " " + p.name + " — " + p.score.toFixed(2) + " pts";
      }

      const cleanCard = card.cloneNode(true);
      cleanCard.addEventListener("click", function () {
        container.querySelectorAll(".player-card").forEach(function (el) {
          el.classList.remove("selected-player");
        });
        cleanCard.classList.add("selected-player");
        showCustomPlayerProfile(p, rankNum);
      });

      container.appendChild(cleanCard);
      if (i === 0) {
        cleanCard.classList.add("selected-player");
        showCustomPlayerProfile(p, rankNum);
      }
    });
  }

  function renderMakerOrder() {
    const badge = document.getElementById("cl-active-title");
    if (badge) {
      badge.textContent = "Active List: " + customList.title + " (" + customList.levels.length + " levels)";
    }

    const listEl = document.getElementById("cl-maker-order-list");
    if (!listEl) return;
    listEl.innerHTML = "";

    if (customList.levels.length === 0) {
      listEl.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem;">No levels added yet.</p>';
      return;
    }

    customList.levels.forEach(function (lvl, idx) {
      const row = document.createElement("div");
      row.className = "cl-order-item";

      const meta = document.createElement("div");
      meta.className = "cl-order-meta";

      const strong = document.createElement("strong");
      strong.textContent = "#" + (idx + 1) + " — " + lvl.name;

      const span = document.createElement("span");
      span.textContent = "Verifier: " + lvl.verifier + " • " + (lvl.records ? lvl.records.length : 0) + " record(s)";

      meta.append(strong, span);

      const btns = document.createElement("div");
      btns.className = "cl-order-btns";

      const upBtn = document.createElement("button");
      upBtn.type = "button";
      upBtn.className = "cl-mini-btn";
      upBtn.textContent = "↑";
      upBtn.disabled = idx === 0;
      upBtn.addEventListener("click", function () {
        const prev = customList.levels.at(idx - 1);
        customList.levels.splice(idx - 1, 2, lvl, prev);
        refreshAllCustomUI();
      });

      const downBtn = document.createElement("button");
      downBtn.type = "button";
      downBtn.className = "cl-mini-btn";
      downBtn.textContent = "↓";
      downBtn.disabled = idx === customList.levels.length - 1;
      downBtn.addEventListener("click", function () {
        const next = customList.levels.at(idx + 1);
        customList.levels.splice(idx, 2, next, lvl);
        refreshAllCustomUI();
      });

      const addRecBtn = document.createElement("button");
      addRecBtn.type = "button";
      addRecBtn.className = "cl-mini-btn";
      addRecBtn.textContent = "+Rec";
      addRecBtn.addEventListener("click", function () {
        const raw = prompt('Add record to "' + lvl.name + '" (Format: Player, Percent, OptionalURL):');
        if (!raw) return;
        const parts = raw.split(",").map(function (p) { return p.trim(); });
        const rec = sanitizeRecord({
          user: parts.at(0) || "",
          percent: parts.at(1) !== undefined ? parts.at(1) : 100,
          link: parts.at(2) || ""
        });
        if (!rec) {
          setStatus("Invalid record format.", true);
          return;
        }
        lvl.records = (lvl.records || []).concat([rec]).slice(0, MAX_RECORDS_PER_LEVEL);
        refreshAllCustomUI();
        setStatus("Added record for " + rec.user + ".");
      });

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "cl-mini-btn danger";
      delBtn.textContent = "✕";
      delBtn.addEventListener("click", function () {
        customList.levels.splice(idx, 1);
        refreshAllCustomUI();
      });

      btns.append(upBtn, downBtn, addRecBtn, delBtn);
      row.append(meta, btns);
      listEl.appendChild(row);
    });
  }

  function refreshAllCustomUI() {
    renderMakerOrder();
    renderCustomListCards();
    renderCustomLeaderboard();
  }

  function fillImportSelect() {
    const select = document.getElementById("cl-import-select");
    if (!select || !Array.isArray(globalDemons)) return;
    select.innerHTML = "";
    const visible = typeof getVisibleDemons === "function" ? getVisibleDemons() : globalDemons;
    visible.filter(function (d) { return !d.cosmetic; }).forEach(function (d, i) {
      const opt = document.createElement("option");
      opt.value = String(d.id);
      opt.textContent = "#" + (d.position || i + 1) + " — " + d.name;
      select.appendChild(opt);
    });
  }

   document.addEventListener("DOMContentLoaded", function () {
    const tabsBar = document.querySelector(".tabs");
    if (tabsBar && !document.getElementById("extras-dropdown")) {
      const rouletteBtn = tabsBar.querySelector('[data-tab="roulette"]');
      const wrap = document.createElement("div");
      wrap.className = "extras-dropdown";
      wrap.id = "extras-dropdown";
      wrap.innerHTML =
        '<button type="button" class="tab-btn extras-dropdown-btn" id="extras-dropdown-toggle">Extras <span class="extras-caret">▾</span></button>' +
        '<div class="extras-dropdown-menu" id="extras-dropdown-menu">' +
          '<button type="button" class="tab-btn extras-menu-item" data-tab="roulette">Roulette</button>' +
          '<button type="button" class="tab-btn extras-menu-item" data-tab="custom-lists">Custom Lists</button>' +
        '</div>';

      if (rouletteBtn) {
        rouletteBtn.replaceWith(wrap);
      } else {
        tabsBar.appendChild(wrap);
      }
    }

    if (!document.getElementById("custom-lists")) {
      const footer = document.querySelector(".site-footer");
      const section = document.createElement("div");
      section.id = "custom-lists";
      section.className = "tab-content";
      section.innerHTML =
        '<div class="cl-topbar">' +
          '<h1>Custom Lists</h1>' +
          '<div class="cl-mode-tabs">' +
            '<button type="button" class="cl-view-btn active" data-clview="list">List</button>' +
            '<button type="button" class="cl-view-btn" data-clview="leaderboard">Leaderboard</button>' +
            '<button type="button" class="cl-view-btn" data-clview="maker">List Maker</button>' +
          '</div>' +
        '</div>' +
        '<div class="panel cl-io-bar">' +
          '<div class="cl-io-left"><span id="cl-active-title" class="cl-active-badge">Active List: Untitled Custom List (0 levels)</span></div>' +
          '<div class="cl-io-actions">' +
            '<button type="button" id="cl-copy-code-btn" class="sidebar-action-btn">Copy Save Code</button>' +
            '<button type="button" id="cl-toggle-load-btn" class="dp-back-btn">Load Code</button>' +
            '<button type="button" id="cl-reset-btn" class="rl-giveup-btn">Clear List</button>' +
          '</div>' +
          '<div id="cl-load-drawer" class="cl-load-drawer" style="display:none;">' +
            '<input type="text" id="cl-load-input" placeholder="Paste GDCL1-... save code here">' +
            '<button type="button" id="cl-confirm-load-btn" class="sidebar-action-btn">Load List</button>' +
          '</div>' +
          '<p id="cl-status-msg" class="roulette-status"></p>' +
        '</div>' +
        '<div id="cl-pane-list" class="cl-pane active"><div id="cl-levels-container"></div><div id="cl-demon-detail" style="display:none;"></div></div>' +
        '<div id="cl-pane-leaderboard" class="cl-pane" style="display:none;">' +
          '<div class="leaderboard-split">' +
            '<div class="leaderboard-left"><input type="text" id="cl-player-search" placeholder="Search custom list players"><div id="cl-leaderboard-container"></div></div>' +
            '<div class="leaderboard-right" id="cl-player-profile"><p style="color:var(--text-muted);">Select a player on the left to view their custom list completions.</p></div>' +
          '</div>' +
        '</div>' +
        '<div id="cl-pane-maker" class="cl-pane" style="display:none;">' +
          '<div class="cl-maker-grid">' +
            '<div class="panel">' +
              '<h2 class="cl-section-title">1. List Settings & Import Existing</h2>' +
              '<div class="cl-field"><label>Custom List Name</label><input type="text" id="cl-list-name-input" maxlength="60" placeholder="My Custom Demonlist"></div>' +
              '<div class="cl-field"><label>Add Existing Level from Official List</label>' +
                '<div class="cl-inline-row"><select id="cl-import-select"></select><button type="button" id="cl-import-add-btn" class="sidebar-action-btn">Add</button></div>' +
              '</div>' +
              '<div class="cl-inline-row" style="margin-top:10px;">' +
                '<button type="button" id="cl-import-all-btn" class="dp-back-btn">Import All Official Levels</button>' +
                '<button type="button" id="cl-shuffle-btn" class="dp-back-btn">Shuffle Order</button>' +
              '</div>' +
              '<hr class="cl-divider">' +
              '<h2 class="cl-section-title">2. Create New Custom Level</h2>' +
              '<div class="cl-field"><label>Level Name *</label><input type="text" id="cl-new-name" maxlength="60" placeholder="e.g. Acheron"></div>' +
              '<div class="cl-field"><label>Verifier *</label><input type="text" id="cl-new-verifier" maxlength="40" placeholder="e.g. Zoink"></div>' +
              '<div class="cl-field"><label>Verification Video URL *</label><input type="url" id="cl-new-verification" maxlength="200" placeholder="https://youtube.com..."></div>' +
              '<div class="cl-field"><label>Thumbnail URL (Optional)</label><input type="url" id="cl-new-thumb" maxlength="200" placeholder="https://..."></div>' +
              '<div class="cl-field"><label>Records (Optional — Player, Percent, VideoURL)</label><textarea id="cl-new-records" rows="4" maxlength="4000" placeholder="PlayerOne, 100, https://youtube.com..."></textarea></div>' +
              '<button type="button" id="cl-add-custom-btn" class="sidebar-action-btn">Add Custom Level</button>' +
            '</div>' +
            '<div class="panel"><h2 class="cl-section-title">3. Current List Order</h2><div id="cl-maker-order-list" class="cl-maker-order-list"></div></div>' +
          '</div>' +
        '</div>';

      if (footer && footer.parentNode) {
        footer.parentNode.insertBefore(section, footer);
      } else {
        document.body.appendChild(section);
      }
    }

                                 const dropdown = document.getElementById("extras-dropdown");
    const toggleBtn = document.getElementById("extras-dropdown-toggle");
    if (dropdown && toggleBtn) {
      toggleBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        dropdown.classList.toggle("open");
      });

      dropdown.querySelectorAll(".extras-menu-item").forEach(function (item) {
        item.addEventListener("click", function (e) {
          e.stopPropagation();
          const tabId = item.getAttribute("data-tab");
          document.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.remove("active"); });
          document.querySelectorAll(".tab-content").forEach(function (c) { c.classList.remove("active"); });
          item.classList.add("active");
          toggleBtn.classList.add("active");
          const target = document.getElementById(tabId);
          if (target) {
            target.classList.add("active");
            window.location.hash = tabId;
          }
          dropdown.classList.remove("open");
          if (tabId === "custom-lists") refreshAllCustomUI();
        });
      });

      document.querySelectorAll(".tabs > .tab-btn:not(.extras-dropdown-btn)").forEach(function (btn) {
        btn.addEventListener("click", function () {
          dropdown.classList.remove("open");
          toggleBtn.classList.remove("active");
        });
      });

      document.addEventListener("click", function (e) {
        if (!dropdown.contains(e.target)) dropdown.classList.remove("open");
      });
    }

    document.querySelectorAll(".cl-view-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".cl-view-btn").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        const view = btn.dataset.clview;
        document.getElementById("cl-pane-list").style.display = view === "list" ? "block" : "none";
        document.getElementById("cl-pane-leaderboard").style.display = view === "leaderboard" ? "block" : "none";
        document.getElementById("cl-pane-maker").style.display = view === "maker" ? "block" : "none";
        refreshAllCustomUI();
      });
    });

    document.getElementById("cl-player-search")?.addEventListener("input", renderCustomLeaderboard);

    document.getElementById("cl-list-name-input")?.addEventListener("input", function (e) {
      customList.title = cleanText(e.target.value, 60) || "Untitled Custom List";
      renderMakerOrder();
    });

    document.getElementById("cl-import-add-btn")?.addEventListener("click", function () {
      if (customList.levels.length >= MAX_LEVELS) return setStatus("Maximum of " + MAX_LEVELS + " levels reached.", true);
      const id = document.getElementById("cl-import-select")?.value;
      const visible = typeof getVisibleDemons === "function" ? getVisibleDemons() : globalDemons;
      const found = (visible || []).find(function (d) { return String(d.id) === String(id); });
      if (!found) return;
      const converted = sanitizeLevel({
        id: found.id,
        name: typeof cleanDisplayName === "function" ? cleanDisplayName(found.name) : found.name,
        verifier: typeof cleanDisplayName === "function" ? cleanDisplayName(found.verifier) : found.verifier,
        creator: found.creator || found.verifier,
        password: found.password || "Free Copy",
        verification: found.verification || "https://youtube.com",
        thumbnail: found.thumbnail || "",
        records: (found.records || []).map(function (r) {
          return typeof r === "string"
            ? { user: typeof cleanDisplayName === "function" ? cleanDisplayName(r) : r, percent: 100, link: "" }
            : { user: typeof cleanDisplayName === "function" ? cleanDisplayName(r.user || "") : (r.user || ""), percent: r.percent || 100, link: r.link || "" };
        })
      });
      if (converted) {
        customList.levels.push(converted);
        refreshAllCustomUI();
        setStatus('Added "' + converted.name + '".');
      }
    });

    document.getElementById("cl-import-all-btn")?.addEventListener("click", function () {
      const visible = typeof getVisibleDemons === "function" ? getVisibleDemons() : globalDemons;
      customList.levels = (visible || [])
        .filter(function (d) { return !d.cosmetic; })
        .slice(0, MAX_LEVELS)
        .map(function (found) {
          return sanitizeLevel({
            id: found.id,
            name: typeof cleanDisplayName === "function" ? cleanDisplayName(found.name) : found.name,
            verifier: typeof cleanDisplayName === "function" ? cleanDisplayName(found.verifier) : found.verifier,
            creator: found.creator || found.verifier,
            password: found.password || "Free Copy",
            verification: found.verification || "https://youtube.com",
            thumbnail: found.thumbnail || "",
            records: (found.records || []).map(function (r) {
              return typeof r === "string"
                ? { user: typeof cleanDisplayName === "function" ? cleanDisplayName(r) : r, percent: 100, link: "" }
                : { user: typeof cleanDisplayName === "function" ? cleanDisplayName(r.user || "") : (r.user || ""), percent: r.percent || 100, link: r.link || "" };
            })
          });
        })
        .filter(Boolean);
      refreshAllCustomUI();
      setStatus("Imported " + customList.levels.length + " levels.");
    });

    document.getElementById("cl-shuffle-btn")?.addEventListener("click", function () {
      if (customList.levels.length < 2) return setStatus("Add at least 2 levels to shuffle.", true);
      for (let i = customList.levels.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const a = customList.levels.at(i);
        const b = customList.levels.at(j);
        customList.levels.splice(i, 1, b);
        customList.levels.splice(j, 1, a);
      }
      refreshAllCustomUI();
      setStatus("Shuffled list order!");
    });


    document.getElementById("cl-add-custom-btn")?.addEventListener("click", function () {
      if (customList.levels.length >= MAX_LEVELS) return setStatus("Maximum of " + MAX_LEVELS + " levels reached.", true);
      const nameEl = document.getElementById("cl-new-name");
      const verEl = document.getElementById("cl-new-verifier");
      const urlEl = document.getElementById("cl-new-verification");
      const thumbEl = document.getElementById("cl-new-thumb");
      const recEl = document.getElementById("cl-new-records");

      const records = (recEl?.value || "")
        .split("\n")
        .map(function (line) { return line.trim(); })
        .filter(Boolean)
        .slice(0, MAX_RECORDS_PER_LEVEL)
        .map(function (line) {
          const parts = line.split(",").map(function (p) { return p.trim(); });
          return sanitizeRecord({
            user: parts.at(0) || "",
            percent: parts.at(1) !== undefined ? parts.at(1) : 100,
            link: parts.at(2) || ""
          });
        })
        .filter(Boolean);

      const lvl = sanitizeLevel({
        name: nameEl?.value || "",
        verifier: verEl?.value || "",
        verification: urlEl?.value || "",
        thumbnail: thumbEl?.value || "",
        records: records
      });

      if (!lvl) return setStatus("Enter a valid Level Name, Verifier, and http(s) Video URL.", true);

      customList.levels.push(lvl);
      nameEl.value = "";
      verEl.value = "";
      urlEl.value = "";
      thumbEl.value = "";
      recEl.value = "";
      refreshAllCustomUI();
      setStatus('Created "' + lvl.name + '"!');
    });

    document.getElementById("cl-copy-code-btn")?.addEventListener("click", function () {
      if (customList.levels.length === 0) return setStatus("Add at least 1 level before saving.", true);
      const payload = {
        t: customList.title,
        l: customList.levels.map(function (lvl) {
          return {
            n: lvl.name,
            v: lvl.verifier,
            u: lvl.verification,
            m: lvl.thumbnail || "",
            i: lvl.id || "",
            r: (lvl.records || []).map(function (r) { return [r.user, r.percent, r.link || ""]; })
          };
        })
      };
      const code = "GDCL1-" + btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(function () {
          setStatus("Save code copied!");
        }).catch(function () {
          prompt("Copy save code:", code);
        });
      } else {
        prompt("Copy save code:", code);
      }
    });

    document.getElementById("cl-toggle-load-btn")?.addEventListener("click", function () {
      const drawer = document.getElementById("cl-load-drawer");
      if (drawer) drawer.style.display = drawer.style.display === "none" ? "flex" : "none";
    });

    document.getElementById("cl-confirm-load-btn")?.addEventListener("click", function () {
      const input = document.getElementById("cl-load-input");
      const raw = (input?.value || "").trim();
      if (!raw.startsWith("GDCL1-") || raw.length > MAX_CODE_CHARS) return setStatus("Invalid save code.", true);
      try {
        const parsed = JSON.parse(decodeURIComponent(escape(atob(raw.slice(6)))));
        if (!parsed || !Array.isArray(parsed.l)) return setStatus("Invalid save code.", true);
        customList = {
          title: cleanText(parsed.t, 60) || "Untitled Custom List",
          levels: parsed.l.slice(0, MAX_LEVELS).map(function (item) {
            return sanitizeLevel({
              id: item.i || "",
              name: item.n,
              verifier: item.v,
              verification: item.u,
              thumbnail: item.m,
              records: Array.isArray(item.r) ? item.r.map(function (arr) {
                return Array.isArray(arr) ? { user: arr.at(0), percent: arr.at(1), link: arr.at(2) } : null;
              }) : []
            });
          }).filter(Boolean)
        };
        const titleInput = document.getElementById("cl-list-name-input");
        if (titleInput) titleInput.value = customList.title;
        input.value = "";
        document.getElementById("cl-load-drawer").style.display = "none";
        refreshAllCustomUI();
        setStatus('Loaded "' + customList.title + '".');
      } catch {
        setStatus("Failed to decode save code.", true);
      }
    });

    document.getElementById("cl-reset-btn")?.addEventListener("click", function () {
      customList = { title: "Untitled Custom List", levels: [] };
      const titleInput = document.getElementById("cl-list-name-input");
      if (titleInput) titleInput.value = "";
      refreshAllCustomUI();
      setStatus("Custom list cleared.");
    });

    const poll = setInterval(function () {
      if (Array.isArray(globalDemons) && globalDemons.length > 0) {
        clearInterval(poll);
        fillImportSelect();
        refreshAllCustomUI();
      }
    }, 150);
    setTimeout(function () { clearInterval(poll); }, 8000);
  });
})();

(function fixDuplicateExtrasListeners() {
  function bindCleanDropdown() {
    const oldDropdown = document.getElementById("extras-dropdown");
    if (!oldDropdown) return;

    const cleanDropdown = oldDropdown.cloneNode(true);
    oldDropdown.parentNode.replaceChild(cleanDropdown, oldDropdown);

    const toggleBtn = cleanDropdown.querySelector("#extras-dropdown-toggle");
    const menuItems = cleanDropdown.querySelectorAll(".extras-menu-item");

    if (toggleBtn) {
      toggleBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        cleanDropdown.classList.toggle("open");
      });
    }

    menuItems.forEach(function (item) {
      item.addEventListener("click", function (e) {
        e.stopPropagation();
        const tabId = item.getAttribute("data-tab");

        document.querySelectorAll(".tab-btn").forEach(function (b) {
          b.classList.remove("active");
        });
        document.querySelectorAll(".tab-content").forEach(function (c) {
          c.classList.remove("active");
        });

        item.classList.add("active");
        if (toggleBtn) toggleBtn.classList.add("active");

        const target = document.getElementById(tabId);
        if (target) {
          target.classList.add("active");
          window.location.hash = tabId;
        }

        cleanDropdown.classList.remove("open");
      });
    });

    document.addEventListener("click", function (e) {
      if (!cleanDropdown.contains(e.target)) {
        cleanDropdown.classList.remove("open");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(bindCleanDropdown, 50);
    });
  } else {
    setTimeout(bindCleanDropdown, 50);
  }
})();

(function fixCustomListDetailAndLayout() {
  function ensureDetailContainer() {
    const paneList = document.getElementById("cl-pane-list");
    if (paneList && !document.getElementById("cl-demon-detail")) {
      const detailDiv = document.createElement("div");
      detailDiv.id = "cl-demon-detail";
      detailDiv.style.display = "none";
      paneList.appendChild(detailDiv);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureDetailContainer);
  } else {
    ensureDetailContainer();
  }
})();

(function unifyCustomDemonPages() {
  function extractYoutubeId(url) {
    if (!url || typeof url !== "string") return "";
    try {
      const u = new URL(url.trim());
      if (u.hostname.includes("youtu.be")) {
        return u.pathname.replace("/", "").split("/").at(0) || "";
      }
      if (u.hostname.includes("youtube.com")) {
        if (u.pathname.startsWith("/shorts/")) {
          return u.pathname.split("/").at(2) || "";
        }
        if (u.pathname.startsWith("/embed/")) {
          return u.pathname.split("/").at(2) || "";
        }
        return u.searchParams.get("v") || "";
      }
    } catch {}
    return "";
  }

  function renderFullCustomDemonPage(demonObj, position) {
    const demonPage = document.getElementById("demon-page");
    if (!demonPage) return;

    document.querySelectorAll(".tab-content").forEach(function (tab) {
      tab.classList.remove("active");
    });
    demonPage.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });

    const score = (5500 / Math.sqrt(position)).toFixed(2);
    const ytId = extractYoutubeId(demonObj.verification);
    const records = Array.isArray(demonObj.records) ? demonObj.records : [];

    demonPage.innerHTML = "";

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "dp-back-btn";
    backBtn.textContent = "← Back to Custom List";
    backBtn.addEventListener("click", function () {
      demonPage.innerHTML = "";
      demonPage.classList.remove("active");
      const clTab = document.getElementById("custom-lists");
      if (clTab) clTab.classList.add("active");
      const listPane = document.getElementById("cl-pane-list");
      const listContainer = document.getElementById("cl-levels-container");
      const detailContainer = document.getElementById("cl-demon-detail");
      if (listPane) listPane.style.display = "block";
      if (listContainer) listContainer.style.display = "flex";
      if (detailContainer) detailContainer.style.display = "none";
    });
    demonPage.appendChild(backBtn);

    const mainCard = document.createElement("div");
    mainCard.className = "dp-main-card";

    const header = document.createElement("div");
    header.className = "dp-header";

    const titleWrap = document.createElement("div");
    const h1 = document.createElement("h1");
    h1.className = "dp-title";
    h1.textContent = demonObj.name;

    const creatorsP = document.createElement("p");
    creatorsP.className = "dp-creators";
    const creatorName = demonObj.creator || demonObj.verifier;
    creatorsP.textContent = "Published by " + creatorName + " • Verified by " + demonObj.verifier;
    titleWrap.append(h1, creatorsP);

    const rankPill = document.createElement("span");
    rankPill.className = "dp-rank-pill";
    rankPill.textContent = "#" + position;

    header.append(titleWrap, rankPill);
    mainCard.appendChild(header);

    if (ytId) {
      const videoWrap = document.createElement("div");
      videoWrap.className = "dp-video-wrap";
      const iframe = document.createElement("iframe");
      iframe.src = "https://youtube-nocookie.com" + encodeURIComponent(ytId);
      iframe.title = demonObj.name + " Verification";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      videoWrap.appendChild(iframe);
      mainCard.appendChild(videoWrap);
    } else if (demonObj.verification) {
      const fallbackLink = document.createElement("a");
      fallbackLink.href = demonObj.verification;
      fallbackLink.target = "_blank";
      fallbackLink.rel = "noopener noreferrer nofollow";
      fallbackLink.className = "sidebar-action-btn";
      fallbackLink.style.display = "inline-block";
      fallbackLink.style.width = "auto";
      fallbackLink.style.marginBottom = "16px";
      fallbackLink.textContent = "Watch Verification Video ↗";
      mainCard.appendChild(fallbackLink);
    }

(function upgradeCustomListsFullParity() {
  function isCheatedOrBanned(rawUser) {
    if (!rawUser || typeof rawUser !== "string") return false;
    if (typeof window.isPlayerBanned === "function" && window.isPlayerBanned(rawUser)) {
      return true;
    }
    if (typeof disableSpaceUK !== "undefined" && disableSpaceUK && rawUser.toLowerCase().includes("[c]")) {
      return true;
    }
    return false;
  }

  function extractYtId(url) {
    if (!url || typeof url !== "string") return "";
    const trimmed = url.trim();
    const reg = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = trimmed.match(reg);
    return match ? match.at(1) : "";
  }

  function formatPlayerDisplay(name) {
    return typeof cleanDisplayName === "function" ? cleanDisplayName(name) : String(name || "").trim();
  }

  function getFilteredRecords(rawRecords) {
    if (!Array.isArray(rawRecords)) return [];
    return rawRecords
      .map(function (r) {
        if (typeof r === "string") {
          return { user: r, percent: 100, link: "" };
        }
        return {
          user: r.user || "",
          percent: Number(r.percent) || 100,
          link: r.link || ""
        };
      })
      .filter(function (r) {
        return r.user && !isCheatedOrBanned(r.user);
      })
      .map(function (r) {
        return {
          user: formatPlayerDisplay(r.user),
          percent: r.percent,
          link: r.link
        };
      });
  }

  function openExactDemonPage(demonObj, position) {
    const demonPage = document.getElementById("demon-page");
    if (!demonPage) return;

    document.querySelectorAll(".tab-content").forEach(function (tab) {
      tab.classList.remove("active");
    });
    demonPage.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });

    const score = (5500 / Math.sqrt(position)).toFixed(2);
    const ytId = extractYtId(demonObj.verification);
    const cleanRecords = getFilteredRecords(demonObj.records);
    const cleanVerifier = formatPlayerDisplay(demonObj.verifier);
    const cleanCreator = formatPlayerDisplay(demonObj.creator || demonObj.verifier);

    demonPage.innerHTML = "";

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "dp-back-btn";
    backBtn.textContent = "← Back to Custom List";
    backBtn.addEventListener("click", function () {
      demonPage.innerHTML = "";
      demonPage.classList.remove("active");
      const clTab = document.getElementById("custom-lists");
      if (clTab) clTab.classList.add("active");
    });
    demonPage.appendChild(backBtn);

    const mainCard = document.createElement("div");
    mainCard.className = "dp-main-card";

    const header = document.createElement("div");
    header.className = "dp-header";

    const titleWrap = document.createElement("div");
    const h1 = document.createElement("h1");
    h1.className = "dp-title";
    h1.textContent = demonObj.name;

    const creatorsP = document.createElement("p");
    creatorsP.className = "dp-creators";
    creatorsP.textContent = "Published by " + cleanCreator + " • Verified by " + cleanVerifier;
    titleWrap.append(h1, creatorsP);

    const rankPill = document.createElement("span");
    rankPill.className = "dp-rank-pill";
    rankPill.textContent = "#" + position;

    header.append(titleWrap, rankPill);
    mainCard.appendChild(header);

    if (ytId) {
      const videoWrap = document.createElement("div");
      videoWrap.className = "dp-video-wrap";

      if (window.location.protocol === "file:") {
        const notice = document.createElement("div");
        notice.style.padding = "24px";
        notice.style.textAlign = "center";
        notice.style.background = "var(--bg-input)";
        notice.style.borderRadius = "8px";
        notice.innerHTML = '<p style="margin:0 0 12px 0;color:var(--text-muted);font-size:0.9rem;">YouTube blocks embedded players on local <code>file://</code> pages. Open on a local server or watch directly:</p>';
        const ytBtn = document.createElement("a");
        ytBtn.href = demonObj.verification;
        ytBtn.target = "_blank";
        ytBtn.rel = "noopener noreferrer nofollow";
        ytBtn.className = "sidebar-action-btn";
        ytBtn.style.display = "inline-block";
        ytBtn.style.width = "auto";
        ytBtn.textContent = "Watch Verification on YouTube ↗";
        notice.appendChild(ytBtn);
        videoWrap.appendChild(notice);
      } else {
        const iframe = document.createElement("iframe");
        iframe.src = "https://youtube.com" + encodeURIComponent(ytId);
        iframe.title = demonObj.name + " Verification";
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
        iframe.allowFullscreen = true;
        videoWrap.appendChild(iframe);
      }
      mainCard.appendChild(videoWrap);
    } else if (demonObj.verification) {
      const linkBtn = document.createElement("a");
      linkBtn.href = demonObj.verification;
      linkBtn.target = "_blank";
      linkBtn.rel = "noopener noreferrer nofollow";
      linkBtn.className = "sidebar-action-btn";
      linkBtn.style.display = "inline-block";
      linkBtn.style.width = "auto";
      linkBtn.style.marginBottom = "16px";
      linkBtn.textContent = "Watch Verification Video ↗";
      mainCard.appendChild(linkBtn);
    }


      
    const infoGrid = document.createElement("div");
    infoGrid.className = "dp-info-grid";

    const infoItems = [
      { label: "List Score (100%)", value: score + " pts" },
      { label: "Verifier", value: demonObj.verifier },
      { label: "Password", value: demonObj.password || "Free Copy" }
    ];

    infoItems.forEach(function (item) {
      const box = document.createElement("div");
      box.className = "dp-info-box";
      const lbl = document.createElement("span");
      lbl.className = "dp-info-label";
      lbl.textContent = item.label;
      const val = document.createElement("span");
      val.className = "dp-info-value";
      val.textContent = item.value;
      box.append(lbl, val);
      infoGrid.appendChild(box);
    });

    mainCard.appendChild(infoGrid);
    demonPage.appendChild(mainCard);

    const recordsCard = document.createElement("div");
    recordsCard.className = "dp-records-card";

    const recH2 = document.createElement("h2");
    recH2.textContent = "Records (" + records.length + ")";
    recordsCard.appendChild(recH2);

    if (records.length === 0) {
      const noneP = document.createElement("p");
      noneP.style.color = "var(--text-muted)";
      noneP.textContent = "No records submitted yet.";
      recordsCard.appendChild(noneP);
    } else {
      const listDiv = document.createElement("div");
      listDiv.className = "dp-records-list";

      records.forEach(function (r) {
        const row = document.createElement("div");
        row.className = "dp-record-row";

        const userSpan = document.createElement("span");
        userSpan.className = "dp-record-user";
        userSpan.textContent = r.user;

        const rightBox = document.createElement("div");
        rightBox.style.display = "flex";
        rightBox.style.alignItems = "center";
        rightBox.style.gap = "12px";

        const pctSpan = document.createElement("span");
        pctSpan.className = "dp-record-pct";
        pctSpan.textContent = r.percent + "%";
        rightBox.appendChild(pctSpan);

        if (r.link) {
          const linkA = document.createElement("a");
          linkA.href = r.link;
          linkA.target = "_blank";
          linkA.rel = "noopener noreferrer nofollow";
          linkA.className = "dp-record-link";
          linkA.textContent = "Video ↗";
          rightBox.appendChild(linkA);
        }

        row.append(userSpan, rightBox);
        listDiv.appendChild(row);
      });

      recordsCard.appendChild(listDiv);
    }

    demonPage.appendChild(recordsCard);
  }

  document.addEventListener("click", function (e) {
    const card = e.target.closest("#cl-levels-container .demon-card");
    if (!card) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    const allCards = Array.from(document.querySelectorAll("#cl-levels-container .demon-card"));
    const index = allCards.indexOf(card);
    if (index === -1) return;

    const position = index + 1;
    const h2Text = card.querySelector("h2")?.textContent || "";
    const levelName = h2Text.replace(/^#\d+\s*[—-]\s*/, "").trim() || "Custom Level";
    const metaText = card.querySelector(".demon-meta-line")?.textContent || "";
    const verifierMatch = metaText.match(/Verified by\s+(.+?)\s*•/);
    const verifierName = verifierMatch ? verifierMatch.at(1).trim() : "Unknown";

    const officialMatch = (typeof globalDemons !== "undefined" && Array.isArray(globalDemons))
      ? globalDemons.find(function (d) {
          const cleanOfficial = typeof cleanDisplayName === "function" ? cleanDisplayName(d.name) : d.name;
          return cleanOfficial.toLowerCase() === levelName.toLowerCase();
        })
      : null;

    const demonData = {
      name: levelName,
      verifier: verifierName,
      creator: officialMatch ? (officialMatch.creator || verifierName) : verifierName,
      password: officialMatch ? (officialMatch.password || "Free Copy") : "Free Copy",
      verification: officialMatch ? (officialMatch.verification || "") : "",
      records: officialMatch && Array.isArray(officialMatch.records)
        ? officialMatch.records.map(function (r) {
            if (typeof r === "string") {
              return { user: typeof cleanDisplayName === "function" ? cleanDisplayName(r) : r, percent: 100, link: "" };
            }
            return {
              user: typeof cleanDisplayName === "function" ? cleanDisplayName(r.user || "") : (r.user || ""),
              percent: r.percent || 100,
              link: r.link || ""
            };
          })
        : []
    };

    renderFullCustomDemonPage(demonData, position);
  }, true);
})();



    const infoGrid = document.createElement("div");
    infoGrid.className = "dp-info-grid";

    [
      { label: "List Score (100%)", value: score + " pts" },
      { label: "Verifier", value: cleanVerifier },
      { label: "Password", value: demonObj.password || "Free Copy" }
    ].forEach(function (item) {
      const box = document.createElement("div");
      box.className = "dp-info-box";
      const lbl = document.createElement("span");
      lbl.className = "dp-info-label";
      lbl.textContent = item.label;
      const val = document.createElement("span");
      val.className = "dp-info-value";
      val.textContent = item.value;
      box.append(lbl, val);
      infoGrid.appendChild(box);
    });

    mainCard.appendChild(infoGrid);
    demonPage.appendChild(mainCard);

    const recordsCard = document.createElement("div");
    recordsCard.className = "dp-records-card";

    const recH2 = document.createElement("h2");
    recH2.textContent = "Records (" + cleanRecords.length + ")";
    recordsCard.appendChild(recH2);

    if (cleanRecords.length === 0) {
      const emptyP = document.createElement("p");
      emptyP.style.color = "var(--text-muted)";
      emptyP.textContent = "No records submitted yet.";
      recordsCard.appendChild(emptyP);
    } else {
      const recList = document.createElement("div");
      recList.className = "dp-records-list";

      cleanRecords.forEach(function (r) {
        const row = document.createElement("div");
        row.className = "dp-record-row";

        const userSpan = document.createElement("span");
        userSpan.className = "dp-record-user";
        userSpan.textContent = r.user;

        const rightDiv = document.createElement("div");
        rightDiv.style.display = "flex";
        rightDiv.style.alignItems = "center";
        rightDiv.style.gap = "12px";

        const pctSpan = document.createElement("span");
        pctSpan.className = "dp-record-pct";
        pctSpan.textContent = r.percent + "%";
        rightDiv.appendChild(pctSpan);

        if (r.link) {
          const linkA = document.createElement("a");
          linkA.href = r.link;
          linkA.target = "_blank";
          linkA.rel = "noopener noreferrer nofollow";
          linkA.className = "dp-record-link";
          linkA.textContent = "Video ↗";
          rightDiv.appendChild(linkA);
        }

        row.append(userSpan, rightDiv);
        recList.appendChild(row);
      });

      recordsCard.appendChild(recList);
    }

    demonPage.appendChild(recordsCard);
  }

  document.addEventListener("click", function (e) {
    const card = e.target.closest("#cl-levels-container .demon-card");
    if (!card) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    const allCards = Array.from(document.querySelectorAll("#cl-levels-container .demon-card"));
    const index = allCards.indexOf(card);
    if (index === -1) return;

    const position = index + 1;
    const h2Text = card.querySelector("h2")?.textContent || "";
    const levelName = h2Text.replace(/^#\d+\s*[—-]\s*/, "").trim() || "Custom Level";
    const metaText = card.querySelector(".demon-meta-line")?.textContent || "";
    const verifierMatch = metaText.match(/Verified by\s+(.+?)\s*•/);
    const verifierName = verifierMatch ? verifierMatch.at(1).trim() : "Unknown";

    const officialMatch = Array.isArray(globalDemons)
      ? globalDemons.find(function (d) {
          return formatPlayerDisplay(d.name).toLowerCase() === levelName.toLowerCase();
        })
      : null;

    let savedVerification = card.dataset.verification || (officialMatch ? officialMatch.verification : "");
    let savedRecords = [];
    if (card.dataset.records) {
      try {
        savedRecords = JSON.parse(card.dataset.records);
      } catch {}
    } else if (officialMatch && Array.isArray(officialMatch.records)) {
      savedRecords = officialMatch.records;
    }

    openExactDemonPage({
      name: levelName,
      verifier: verifierName,
      creator: officialMatch ? (officialMatch.creator || verifierName) : verifierName,
      password: officialMatch ? (officialMatch.password || "Free Copy") : "Free Copy",
      verification: savedVerification,
      records: savedRecords
    }, position);
  }, true);

  const observer = new MutationObserver(function () {
    const cards = document.querySelectorAll("#cl-levels-container .demon-card");
    cards.forEach(function (card) {
      if (card.dataset.synced) return;
      card.dataset.synced = "1";
      const h2Text = card.querySelector("h2")?.textContent || "";
      const levelName = h2Text.replace(/^#\d+\s*[—-]\s*/, "").trim();
      const inputUrl = document.getElementById("cl-new-verification")?.value || "";
      if (inputUrl && !card.dataset.verification) {
        card.dataset.verification = inputUrl;
      }
      if (Array.isArray(globalDemons)) {
        const match = globalDemons.find(function (d) {
          return formatPlayerDisplay(d.name).toLowerCase() === levelName.toLowerCase();
        });
        if (match) {
          card.dataset.verification = match.verification || "";
          card.dataset.records = JSON.stringify(getFilteredRecords(match.records || []));
        }
      }
    });
  });

  document.addEventListener("DOMContentLoaded", function () {
    const target = document.getElementById("custom-lists");
    if (target) {
      observer.observe(target, { childList: true, subtree: true });
    }
  });
})();

(function cleanResetCustomLists() {
  function init() {
    const allCustomTabs = document.querySelectorAll("#custom-lists");
    for (let i = 1; i < allCustomTabs.length; i++) {
      allCustomTabs.item(i).remove();
    }

    const tab = document.getElementById("custom-lists");
    if (!tab) return;

    const freshTab = tab.cloneNode(true);
    tab.parentNode.replaceChild(freshTab, tab);

    let state = {
      title: "Untitled Custom List",
      levels: []
    };

    function cleanStr(s, max) {
      return typeof s === "string" ? s.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max) : "";
    }

    function cleanUrl(u) {
      const t = cleanStr(u, 300);
      if (!t) return "";
      try {
        const p = new URL(t);
        return p.protocol === "http:" || p.protocol === "https:" ? p.href : "";
      } catch {
        return "";
      }
    }

    function isHiddenUser(name) {
      if (!name) return true;
      if (typeof window.isPlayerBanned === "function" && window.isPlayerBanned(name)) return true;
      if (typeof disableSpaceUK !== "undefined" && disableSpaceUK && String(name).toLowerCase().includes("[c]")) return true;
      return false;
    }

    function formatName(name) {
      return typeof cleanDisplayName === "function" ? cleanDisplayName(name) : cleanStr(name, 40);
    }

    function notify(msg, isErr) {
      const el = freshTab.querySelector("#cl-status-msg");
      if (!el) return;
      el.style.color = isErr ? "#ef4444" : "var(--accent-green)";
      el.textContent = msg;
      setTimeout(function () {
        if (el.textContent === msg) el.textContent = "";
      }, 4000);
    }

    function getYtId(url) {
      const m = String(url || "").match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      return m ? m.at(1) : "";
    }

    function openDemonModalPage(lvl, pos) {
      let dp = document.getElementById("demon-page");
      if (!dp) {
        dp = document.createElement("div");
        dp.id = "demon-page";
        dp.className = "tab-content";
        freshTab.parentNode.appendChild(dp);
      }

      document.querySelectorAll(".tab-content").forEach(function (c) {
        c.classList.remove("active");
        c.style.display = "none";
      });

      dp.classList.add("active");
      dp.style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });

      const score = (5500 / Math.sqrt(pos)).toFixed(2);
      const ytId = getYtId(lvl.verification);
      const recs = (lvl.records || []).filter(function (r) {
        return !isHiddenUser(r.user);
      });

      dp.innerHTML = "";

      const backBtn = document.createElement("button");
      backBtn.type = "button";
      backBtn.className = "dp-back-btn";
      backBtn.textContent = "← Back to Custom List";
      backBtn.addEventListener("click", function () {
        dp.innerHTML = "";
        dp.classList.remove("active");
        dp.style.display = "none";
        document.querySelectorAll(".tab-content").forEach(function (c) {
          c.style.display = "";
        });
        freshTab.classList.add("active");
      });
      dp.appendChild(backBtn);

      const mainCard = document.createElement("div");
      mainCard.className = "dp-main-card";

      const header = document.createElement("div");
      header.className = "dp-header";

      const tWrap = document.createElement("div");
      const h1 = document.createElement("h1");
      h1.className = "dp-title";
      h1.textContent = lvl.name;

      const sub = document.createElement("p");
      sub.className = "dp-creators";
      sub.textContent = "Published by " + formatName(lvl.creator || lvl.verifier) + " • Verified by " + formatName(lvl.verifier);
      tWrap.append(h1, sub);

      const pill = document.createElement("span");
      pill.className = "dp-rank-pill";
      pill.textContent = "#" + pos;

      header.append(tWrap, pill);
      mainCard.appendChild(header);

      if (ytId) {
        const vWrap = document.createElement("div");
        vWrap.className = "dp-video-wrap";
        if (window.location.protocol === "file:") {
          const box = document.createElement("div");
          box.style.padding = "20px";
          box.style.textAlign = "center";
          box.style.background = "var(--bg-input)";
          box.style.borderRadius = "8px";
          const a = document.createElement("a");
          a.href = lvl.verification;
          a.target = "_blank";
          a.rel = "noopener noreferrer nofollow";
          a.className = "sidebar-action-btn";
          a.style.display = "inline-block";
          a.style.width = "auto";
          a.textContent = "Watch Verification on YouTube ↗";
          box.appendChild(a);
          vWrap.appendChild(box);
        } else {
          const iframe = document.createElement("iframe");
          iframe.src = "https://youtube.com" + encodeURIComponent(ytId);
          iframe.setAttribute("frameborder", "0");
          iframe.allowFullscreen = true;
          vWrap.appendChild(iframe);
        }
        mainCard.appendChild(vWrap);
      } else if (lvl.verification) {
        const a = document.createElement("a");
        a.href = lvl.verification;
        a.target = "_blank";
        a.rel = "noopener noreferrer nofollow";
        a.className = "sidebar-action-btn";
        a.style.display = "inline-block";
        a.style.width = "auto";
        a.style.marginBottom = "14px";
        a.textContent = "Watch Verification Video ↗";
        mainCard.appendChild(a);
      }

      const grid = document.createElement("div");
      grid.className = "dp-info-grid";
      [
        { l: "List Score (100%)", v: score + " pts" },
        { l: "Verifier", v: formatName(lvl.verifier) },
        { l: "Password", v: lvl.password || "Free Copy" }
      ].forEach(function (item) {
        const b = document.createElement("div");
        b.className = "dp-info-box";
        const s1 = document.createElement("span");
        s1.className = "dp-info-label";
        s1.textContent = item.l;
        const s2 = document.createElement("span");
        s2.className = "dp-info-value";
        s2.textContent = item.v;
        b.append(s1, s2);
        grid.appendChild(b);
      });
      mainCard.appendChild(grid);
      dp.appendChild(mainCard);

      const recCard = document.createElement("div");
      recCard.className = "dp-records-card";
      const recH2 = document.createElement("h2");
      recH2.textContent = "Records (" + recs.length + ")";
      recCard.appendChild(recH2);

      if (recs.length === 0) {
        const p = document.createElement("p");
        p.style.color = "var(--text-muted)";
        p.textContent = "No records submitted yet.";
        recCard.appendChild(p);
      } else {
        const list = document.createElement("div");
        list.className = "dp-records-list";
        recs.forEach(function (r) {
          const row = document.createElement("div");
          row.className = "dp-record-row";
          const u = document.createElement("span");
          u.className = "dp-record-user";
          u.textContent = formatName(r.user);

          const right = document.createElement("div");
          right.style.display = "flex";
          right.style.alignItems = "center";
          right.style.gap = "12px";

          const pct = document.createElement("span");
          pct.className = "dp-record-pct";
          pct.textContent = r.percent + "%";
          right.appendChild(pct);

          if (r.link) {
            const la = document.createElement("a");
            la.href = r.link;
            la.target = "_blank";
            la.rel = "noopener noreferrer nofollow";
            la.className = "dp-record-link";
            la.textContent = "Video ↗";
            right.appendChild(la);
          }

          row.append(u, right);
          list.appendChild(row);
        });
        recCard.appendChild(list);
      }
      dp.appendChild(recCard);
    }

      
    function renderAll() {
      const badge = freshTab.querySelector("#cl-active-title");
      if (badge) {
        badge.textContent = "Active List: " + state.title + " (" + state.levels.length + " levels)";
      }

      const levelsBox = freshTab.querySelector("#cl-levels-container");
      if (levelsBox) {
        levelsBox.innerHTML = "";
        if (state.levels.length === 0) {
          levelsBox.innerHTML = '<div class="panel"><p>No levels yet. Switch to <strong>List Maker</strong> or load a save code.</p></div>';
        } else {
          state.levels.forEach(function (lvl, idx) {
            const pos = idx + 1;
            const pts = (5500 / Math.sqrt(pos)).toFixed(2);
            const ytId = getYtId(lvl.verification);
            const thumb = lvl.thumbnail || (ytId ? "https://ytimg.com" + ytId + "/hqdefault.jpg" : (lvl.id ? "https://prevter.me" + encodeURIComponent(lvl.id) : "extreme.png"));

            const card = document.createElement("div");
            card.className = "demon-card";

            const img = document.createElement("img");
            img.src = thumb;
            img.alt = lvl.name;

            const info = document.createElement("div");
            info.className = "demon-info";

            const h2 = document.createElement("h2");
            const rSpan = document.createElement("span");
            rSpan.className = "demon-rank";
            rSpan.textContent = "#" + pos;
            h2.append(rSpan, document.createTextNode(" — " + lvl.name));

            const meta = document.createElement("p");
            meta.className = "demon-meta-line";
            meta.textContent = "Verified by " + formatName(lvl.verifier) + " • " + pts + " pts";

            info.append(h2, meta);
            card.append(img, info);

            card.addEventListener("click", function () {
              openDemonModalPage(lvl, pos);
            });

            levelsBox.appendChild(card);
          });
        }
      }

      const lbBox = freshTab.querySelector("#cl-leaderboard-container");
      const profBox = freshTab.querySelector("#cl-player-profile");
      if (lbBox) {
        lbBox.innerHTML = "";
        if (state.levels.length === 0) {
          lbBox.innerHTML = "<p>Add levels to generate a leaderboard.</p>";
          if (profBox) profBox.innerHTML = '<p style="color:var(--text-muted);">No custom list loaded.</p>';
        } else {
          const pMap = new Map();
          function addP(raw, pts, txt) {
            if (isHiddenUser(raw)) return;
            const disp = formatName(raw);
            const key = disp.toLowerCase();
            if (!pMap.has(key)) pMap.set(key, { name: disp, score: 0, items: [] });
            const obj = pMap.get(key);
            obj.score += pts;
            obj.items.push(txt);
          }

          state.levels.forEach(function (lvl, idx) {
            const pos = idx + 1;
            const base = 5500 / Math.sqrt(pos);
            addP(lvl.verifier, base, "#" + pos + " " + lvl.name + " (Verified)");
            const seen = new Set([formatName(lvl.verifier).toLowerCase()]);
            (lvl.records || []).forEach(function (r) {
              if (isHiddenUser(r.user)) return;
              const k = formatName(r.user).toLowerCase();
              if (seen.has(k)) return;
              seen.add(k);
              const earned = r.percent >= 100 ? base : base * (r.percent / 100) * 0.5;
              addP(r.user, earned, "#" + pos + " " + lvl.name + " (" + r.percent + "%)");
            });
          });

          const q = (freshTab.querySelector("#cl-player-search")?.value || "").toLowerCase().trim();
          const ranked = Array.from(pMap.values())
            .filter(function (p) { return !q || p.name.toLowerCase().includes(q); })
            .sort(function (a, b) { return b.score - a.score; });

          function showProf(p, rankNum, el) {
            lbBox.querySelectorAll(".player-card").forEach(function (c) { c.classList.remove("selected-player"); });
            if (el) el.classList.add("selected-player");
            if (!profBox) return;
            profBox.innerHTML = "";
            const hdr = document.createElement("div");
            hdr.className = "player-profile-header";
            const h1 = document.createElement("h1");
            h1.textContent = "#" + rankNum + " — " + p.name;
            const sp = document.createElement("p");
            sp.textContent = "Score: " + p.score.toFixed(2) + " pts";
            hdr.append(h1, sp);
            profBox.appendChild(hdr);
            p.items.forEach(function (t) {
              const row = document.createElement("div");
              row.className = "completed-card";
              row.textContent = t;
              profBox.appendChild(row);
            });
          }

          ranked.forEach(function (p, i) {
            const card = typeof createPlayerCard === "function"
              ? createPlayerCard(p.name, p.score, i + 1)
              : document.createElement("div");
            if (!card.className) {
              card.className = "player-card";
              card.textContent = "#" + (i + 1) + " " + p.name + " — " + p.score.toFixed(2) + " pts";
            }
            const cNode = card.cloneNode(true);
            cNode.addEventListener("click", function () { showProf(p, i + 1, cNode); });
            lbBox.appendChild(cNode);
            if (i === 0) showProf(p, 1, cNode);
          });
        }
      }

      const orderBox = freshTab.querySelector("#cl-maker-order-list");
      if (orderBox) {
        orderBox.innerHTML = "";
        if (state.levels.length === 0) {
          orderBox.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem;">No levels added yet.</p>';
        } else {
          state.levels.forEach(function (lvl, idx) {
            const row = document.createElement("div");
            row.className = "cl-order-item";
            const meta = document.createElement("div");
            meta.className = "cl-order-meta";
            const st = document.createElement("strong");
            st.textContent = "#" + (idx + 1) + " — " + lvl.name;
            const sp = document.createElement("span");
            sp.textContent = "Verifier: " + formatName(lvl.verifier) + " • " + (lvl.records || []).length + " record(s)";
            meta.append(st, sp);

            const btns = document.createElement("div");
            btns.className = "cl-order-btns";

            const up = document.createElement("button");
            up.type = "button";
            up.className = "cl-mini-btn";
            up.textContent = "↑";
            up.disabled = idx === 0;
            up.addEventListener("click", function () {
              const prev = state.levels.at(idx - 1);
              state.levels.splice(idx - 1, 2, lvl, prev);
              renderAll();
            });

            const dn = document.createElement("button");
            dn.type = "button";
            dn.className = "cl-mini-btn";
            dn.textContent = "↓";
            dn.disabled = idx === state.levels.length - 1;
            dn.addEventListener("click", function () {
              const next = state.levels.at(idx + 1);
              state.levels.splice(idx, 2, next, lvl);
              renderAll();
            });

            const addR = document.createElement("button");
            addR.type = "button";
            addR.className = "cl-mini-btn";
            addR.textContent = "+Rec";
            addR.addEventListener("click", function () {
              const raw = prompt('Add record to "' + lvl.name + '" (Player, Percent, OptionalURL):');
              if (!raw) return;
              const pts = raw.split(",").map(function (x) { return x.trim(); });
              const u = cleanStr(pts.at(0), 40);
              if (!u) return;
              const pct = Math.max(1, Math.min(100, Math.round(Number(pts.at(1)) || 100)));
              lvl.records = (lvl.records || []).concat([{ user: u, percent: pct, link: cleanUrl(pts.at(2)) }]);
              renderAll();
            });

            const del = document.createElement("button");
            del.type = "button";
            del.className = "cl-mini-btn danger";
            del.textContent = "✕";
            del.addEventListener("click", function () {
              state.levels.splice(idx, 1);
              renderAll();
            });

            btns.append(up, dn, addR, del);
            row.append(meta, btns);
            orderBox.appendChild(row);
          });
        }
      }
    }


    freshTab.querySelectorAll(".cl-view-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        freshTab.querySelectorAll(".cl-view-btn").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        const v = btn.dataset.clview;
        freshTab.querySelector("#cl-pane-list").style.display = v === "list" ? "block" : "none";
        freshTab.querySelector("#cl-pane-leaderboard").style.display = v === "leaderboard" ? "block" : "none";
        freshTab.querySelector("#cl-pane-maker").style.display = v === "maker" ? "block" : "none";
        renderAll();
      });
    });

    freshTab.querySelector("#cl-player-search")?.addEventListener("input", renderAll);

    freshTab.querySelector("#cl-list-name-input")?.addEventListener("input", function (e) {
      state.title = cleanStr(e.target.value, 60) || "Untitled Custom List";
      renderAll();
    });

    freshTab.querySelector("#cl-add-custom-btn")?.addEventListener("click", function () {
      const name = cleanStr(freshTab.querySelector("#cl-new-name")?.value, 60);
      const verifier = cleanStr(freshTab.querySelector("#cl-new-verifier")?.value, 40);
      const verification = cleanUrl(freshTab.querySelector("#cl-new-verification")?.value);
      const thumbnail = cleanUrl(freshTab.querySelector("#cl-new-thumb")?.value);
      const recRaw = freshTab.querySelector("#cl-new-records")?.value || "";

      if (!name || !verifier || !verification) {
        notify("Enter Level Name, Verifier, and a valid http(s) Video URL.", true);
        return;
      }

      const records = recRaw.split("\n").map(function (line) {
        const p = line.split(",").map(function (x) { return x.trim(); });
        const u = cleanStr(p.at(0), 40);
        if (!u) return null;
        return {
          user: u,
          percent: Math.max(1, Math.min(100, Math.round(Number(p.at(1)) || 100))),
          link: cleanUrl(p.at(2))
        };
      }).filter(Boolean);

      state.levels.push({
        id: "",
        name: name,
        verifier: verifier,
        creator: verifier,
        password: "Free Copy",
        verification: verification,
        thumbnail: thumbnail,
        records: records
      });

      freshTab.querySelector("#cl-new-name").value = "";
      freshTab.querySelector("#cl-new-verifier").value = "";
      freshTab.querySelector("#cl-new-verification").value = "";
      freshTab.querySelector("#cl-new-thumb").value = "";
      freshTab.querySelector("#cl-new-records").value = "";

      renderAll();
      notify('Added "' + name + '"!');
    });

    freshTab.querySelector("#cl-import-add-btn")?.addEventListener("click", function () {
      const id = freshTab.querySelector("#cl-import-select")?.value;
      const src = typeof getVisibleDemons === "function" ? getVisibleDemons() : globalDemons;
      const d = (src || []).find(function (x) { return String(x.id) === String(id); });
      if (!d) return;
      state.levels.push({
        id: String(d.id || ""),
        name: formatName(d.name),
        verifier: formatName(d.verifier),
        creator: d.creator || d.verifier,
        password: d.password || "Free Copy",
        verification: d.verification || "https://youtube.com",
        thumbnail: d.thumbnail || "",
        records: (d.records || []).map(function (r) {
          return typeof r === "string"
            ? { user: r, percent: 100, link: "" }
            : { user: r.user || "", percent: r.percent || 100, link: r.link || "" };
        })
      });
      renderAll();
      notify('Imported "' + d.name + '".');
    });

    freshTab.querySelector("#cl-import-all-btn")?.addEventListener("click", function () {
      const src = typeof getVisibleDemons === "function" ? getVisibleDemons() : globalDemons;
      state.levels = (src || []).filter(function (d) { return !d.cosmetic; }).slice(0, 250).map(function (d) {
        return {
          id: String(d.id || ""),
          name: formatName(d.name),
          verifier: formatName(d.verifier),
          creator: d.creator || d.verifier,
          password: d.password || "Free Copy",
          verification: d.verification || "https://youtube.com",
          thumbnail: d.thumbnail || "",
          records: (d.records || []).map(function (r) {
            return typeof r === "string"
              ? { user: r, percent: 100, link: "" }
              : { user: r.user || "", percent: r.percent || 100, link: r.link || "" };
          })
        };
      });
      renderAll();
      notify("Imported " + state.levels.length + " levels.");
    });

    freshTab.querySelector("#cl-shuffle-btn")?.addEventListener("click", function () {
      if (state.levels.length < 2) return notify("Need at least 2 levels to shuffle.", true);
      for (let i = state.levels.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const a = state.levels.at(i);
        const b = state.levels.at(j);
        state.levels.splice(i, 1, b);
        state.levels.splice(j, 1, a);
      }
      renderAll();
      notify("Shuffled!");
    });

    freshTab.querySelector("#cl-copy-code-btn")?.addEventListener("click", function () {
      if (state.levels.length === 0) return notify("Add a level first.", true);
      const code = "GDCL1-" + btoa(unescape(encodeURIComponent(JSON.stringify(state))));
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(function () { notify("Save code copied!"); }).catch(function () { prompt("Copy save code:", code); });
      } else {
        prompt("Copy save code:", code);
      }
    });

    freshTab.querySelector("#cl-toggle-load-btn")?.addEventListener("click", function () {
      const d = freshTab.querySelector("#cl-load-drawer");
      if (d) d.style.display = d.style.display === "none" ? "flex" : "none";
    });

    freshTab.querySelector("#cl-confirm-load-btn")?.addEventListener("click", function () {
      const inp = freshTab.querySelector("#cl-load-input");
      const raw = (inp?.value || "").trim();
      if (!raw.startsWith("GDCL1-")) return notify("Invalid code.", true);
      try {
        const parsed = JSON.parse(decodeURIComponent(escape(atob(raw.slice(6)))));
        if (!parsed || !Array.isArray(parsed.levels)) return notify("Invalid code.", true);
        state = {
          title: cleanStr(parsed.title, 60) || "Untitled Custom List",
          levels: parsed.levels.slice(0, 250)
        };
        const tInp = freshTab.querySelector("#cl-list-name-input");
        if (tInp) tInp.value = state.title;
        inp.value = "";
        freshTab.querySelector("#cl-load-drawer").style.display = "none";
        renderAll();
        notify('Loaded "' + state.title + '".');
      } catch {
        notify("Failed to load code.", true);
      }
    });

    freshTab.querySelector("#cl-reset-btn")?.addEventListener("click", function () {
      state = { title: "Untitled Custom List", levels: [] };
      const tInp = freshTab.querySelector("#cl-list-name-input");
      if (tInp) tInp.value = "";
      renderAll();
      notify("Cleared.");
    });

    const poll = setInterval(function () {
      const src = typeof getVisibleDemons === "function" ? getVisibleDemons() : globalDemons;
      if (Array.isArray(src) && src.length > 0) {
        clearInterval(poll);
        const sel = freshTab.querySelector("#cl-import-select");
        if (sel) {
          sel.innerHTML = "";
          src.filter(function (d) { return !d.cosmetic; }).forEach(function (d, i) {
            const o = document.createElement("option");
            o.value = String(d.id);
            o.textContent = "#" + (d.position || i + 1) + " — " + d.name;
            sel.appendChild(o);
          });
        }
        renderAll();
      }
    }, 150);
    setTimeout(function () { clearInterval(poll); }, 8000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 80); });
  } else {
    setTimeout(init, 80);
  }
})();

(function fixCustomThumbnailsAndEmbeds() {
  function parseYoutubeVideoId(url) {
    if (!url || typeof url !== "string") return "";
    try {
      const u = new URL(url.trim());
      if (u.hostname.includes("youtu.be")) {
        return u.pathname.replace("/", "").split("/").at(0) || "";
      }
      if (u.hostname.includes("youtube.com")) {
        if (u.searchParams.get("v")) return u.searchParams.get("v");
        const parts = u.pathname.split("/").filter(Boolean);
        if (parts.at(0) === "shorts" || parts.at(0) === "embed" || parts.at(0) === "live" || parts.at(0) === "v") {
          return parts.at(1) || "";
        }
      }
    } catch {}
    const m = String(url).match(/([a-zA-Z0-9_-]{11})/);
    return m ? m.at(1) : "";
  }

  function applyImageFallbacks() {
    document.querySelectorAll("#cl-levels-container .demon-card img").forEach(function (img) {
      if (img.dataset.fbBound) return;
      img.dataset.fbBound = "1";

      const src = img.getAttribute("src") || "";
      if (!src || src === "undefined" || src === "null") {
        img.src = "extreme.png";
      }

      img.addEventListener("error", function () {
        if (!img.dataset.triedMax) {
          img.dataset.triedMax = "1";
          if (img.src.includes("hqdefault.jpg")) {
            img.src = img.src.replace("hqdefault.jpg", "mqdefault.jpg");
            return;
          }
        }
        if (img.src !== "extreme.png" && !img.src.endsWith("extreme.png")) {
          img.src = "extreme.png";
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    const target = document.getElementById("custom-lists");
    if (target) {
      const obs = new MutationObserver(applyImageFallbacks);
      obs.observe(target, { childList: true, subtree: true });
    }
    setInterval(applyImageFallbacks, 500);
  });

  window._parseYoutubeVideoId = parseYoutubeVideoId;
})();

(function initRouletteWheelSpin() {
  const SLICE_COUNT = 10;
  const SLICE_COLORS = [
    "#1e293b",
    "#0f172a",
    "#1d4ed8",
    "#1e293b",
    "#b91c1c",
    "#0f172a",
    "#1d4ed8",
    "#1e293b",
    "#047857",
    "#0f172a"
  ];

  function drawLevelWheel(canvas, sliceLabels) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 4;
    const arc = (Math.PI * 2) / sliceLabels.length;

    ctx.clearRect(0, 0, size, size);

    sliceLabels.forEach(function (label, i) {
      const startAngle = i * arc - Math.PI / 2;
      const endAngle = startAngle + arc;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = SLICE_COLORS.at(i % SLICE_COLORS.length);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#334155";
      ctx.stroke();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 12px sans-serif";
      const shortName = label.length > 16 ? label.slice(0, 15) + "…" : label;
      ctx.fillText(shortName, radius - 14, 4);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(center, center, 22, 0, Math.PI * 2);
    ctx.fillStyle = "#090b11";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ef4444";
    ctx.stroke();
  }

  function spinWheelForCard(card) {
    if (!card || card.dataset.wheelSpun) return;
    card.dataset.wheelSpun = "1";

    const activeArea = document.getElementById("rl-active-area");
    if (!activeArea) return;

    const h2Text = card.querySelector("h2")?.textContent || "Chosen Level";
    const winnerName = h2Text.replace(/^#\d+\s*[—-]\s*/, "").trim();

    const list = typeof getVisibleDemons === "function" ? getVisibleDemons() : (typeof globalDemons !== "undefined" ? globalDemons : []);
    const pool = (list || []).filter(function (d) { return !d.cosmetic; });

    const slices = [winnerName];
    for (let i = 1; i < SLICE_COUNT; i++) {
      if (pool.length > 0) {
        const rnd = pool.at(Math.floor(Math.random() * pool.length));
        slices.push(rnd.name);
      } else {
        slices.push("Level #" + (i + 1));
      }
    }

    card.style.display = "none";

    const stage = document.createElement("div");
    stage.className = "rl-wheel-stage";

    const wrapper = document.createElement("div");
    wrapper.className = "rl-wheel-wrapper";

    const pointer = document.createElement("div");
    pointer.className = "rl-wheel-pointer";

    const canvas = document.createElement("canvas");
    canvas.className = "rl-wheel-canvas";
    canvas.width = 290;
    canvas.height = 290;

    const caption = document.createElement("p");
    caption.className = "rl-wheel-caption";
    caption.textContent = "Spinning Wheel…";

    wrapper.append(pointer, canvas);
    stage.append(wrapper, caption);
    activeArea.insertBefore(stage, card);

    drawLevelWheel(canvas, slices);

    const sliceAngle = 360 / SLICE_COUNT;
    const targetRotation = 360 * 5 - sliceAngle / 2;

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        canvas.style.transform = "rotate(" + targetRotation + "deg)";
      });
    });

    setTimeout(function () {
      caption.textContent = "Landed on: " + winnerName;
      caption.style.color = "var(--accent-green)";
    }, 2200);

    setTimeout(function () {
      stage.remove();
      card.style.display = "flex";
    }, 2750);
  }

  document.addEventListener("DOMContentLoaded", function () {
    const activeArea = document.getElementById("rl-active-area");
    if (!activeArea) return;

    const obs = new MutationObserver(function () {
      const card = activeArea.querySelector(".rl-current-card");
      if (card && !card.dataset.wheelSpun) {
        spinWheelForCard(card);
      }
    });

    obs.observe(activeArea, { childList: true });
  });
})();

(function initHigherOrLowerGame() {
  const BEST_KEY = "gdl_hl_best_streak_v1";
  let currentStreak = 0;
  let bestStreak = 0;
  let leftDemon = null;
  let rightDemon = null;
  let locked = false;

  try {
    bestStreak = Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {}

  function getPool() {
    const raw = typeof getVisibleDemons === "function" ? getVisibleDemons() : (typeof globalDemons !== "undefined" ? globalDemons : []);
    return (raw || []).filter(function (d) {
      return !d.cosmetic && d.position;
    });
  }

  function getLevelThumb(d) {
    if (d.thumbnail && d.thumbnail.trim()) return d.thumbnail.trim();
    if (typeof getYoutubeThumbnail === "function") {
      const yt = getYoutubeThumbnail(d.verification);
      if (yt) return yt;
    }
    return "https://prevter.me" + encodeURIComponent(d.id);
  }

  function formatDisplay(name) {
    return typeof cleanDisplayName === "function" ? cleanDisplayName(name) : String(name || "");
  }

  function pickRandomExcluding(pool, excludeId) {
    const candidates = pool.filter(function (d) {
      return String(d.id) !== String(excludeId);
    });
    const list = candidates.length > 0 ? candidates : pool;
    return list.at(Math.floor(Math.random() * list.length));
  }

  function updateScorePills() {
    const curEl = document.getElementById("hl-cur-streak");
    const bestEl = document.getElementById("hl-best-streak");
    if (curEl) curEl.textContent = String(currentStreak);
    if (bestEl) bestEl.textContent = String(bestStreak);
  }

  function startNewHlGame() {
    const pool = getPool();
    if (pool.length < 2) return;
    currentStreak = 0;
    locked = false;
    leftDemon = pickRandomExcluding(pool, null);
    rightDemon = pickRandomExcluding(pool, leftDemon.id);
    updateScorePills();
    renderArena(false, null);
  }

  function handleGuess(guessHigher) {
    if (locked || !leftDemon || !rightDemon) return;
    locked = true;

    const isActuallyHigher = rightDemon.position < leftDemon.position;
    const correct = guessHigher ? isActuallyHigher : !isActuallyHigher;

    if (correct) {
      currentStreak++;
      if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
        try {
          localStorage.setItem(BEST_KEY, String(bestStreak));
        } catch {}
      }
      updateScorePills();
      renderArena(true, true);

      setTimeout(function () {
        const pool = getPool();
        leftDemon = rightDemon;
        rightDemon = pickRandomExcluding(pool, leftDemon.id);
        locked = false;
        renderArena(false, null);
      }, 1150);
    } else {
      renderArena(true, false);
    }
  }

  function renderArena(revealed, wasCorrect) {
    const stage = document.getElementById("hl-stage");
    if (!stage || !leftDemon || !rightDemon) return;

    stage.innerHTML = "";

    const arena = document.createElement("div");
    arena.className = "hl-arena";

    function buildCard(demon, showRank, stateClass) {
      const card = document.createElement("div");
      card.className = "hl-card" + (stateClass ? " " + stateClass : "");

      const img = document.createElement("img");
      img.className = "hl-card-thumb";
      img.src = getLevelThumb(demon);
      img.alt = demon.name;
      img.addEventListener("error", function () {
        if (!img.src.endsWith("extreme.png")) img.src = "extreme.png";
      });

      const body = document.createElement("div");
      body.className = "hl-card-body";

      const title = document.createElement("h2");
      title.className = "hl-card-title";
      title.textContent = formatDisplay(demon.name);

      const sub = document.createElement("p");
      sub.className = "hl-card-sub";
      sub.textContent = "Verified by " + formatDisplay(demon.verifier);

      body.append(title, sub);

      if (showRank) {
        const pts = (5500 / Math.sqrt(demon.position)).toFixed(2);
        const rankDiv = document.createElement("div");
        rankDiv.className = "hl-rank-reveal";
        rankDiv.textContent = "#" + demon.position;

        const ptsDiv = document.createElement("div");
        ptsDiv.className = "hl-pts-reveal";
        ptsDiv.textContent = pts + " pts";

        body.append(rankDiv, ptsDiv);
      } else {
        const promptP = document.createElement("p");
        promptP.className = "hl-card-sub";
        promptP.style.marginTop = "6px";
        promptP.textContent = "is ranked…";

        const btnGroup = document.createElement("div");
        btnGroup.className = "hl-btn-group";

        const higherBtn = document.createElement("button");
        higherBtn.type = "button";
        higherBtn.className = "hl-guess-btn";
        higherBtn.textContent = "▲ Higher (Harder)";
        higherBtn.addEventListener("click", function () {
          handleGuess(true);
        });

        const lowerBtn = document.createElement("button");
        lowerBtn.type = "button";
        lowerBtn.className = "hl-guess-btn";
        lowerBtn.textContent = "▼ Lower (Easier)";
        lowerBtn.addEventListener("click", function () {
          handleGuess(false);
        });

        btnGroup.append(higherBtn, lowerBtn);
        body.append(promptP, btnGroup);
      }

      card.append(img, body);
      return card;
    }

    const leftCard = buildCard(leftDemon, true, "");
    const vsDiv = document.createElement("div");
    vsDiv.className = "hl-vs-badge";
    vsDiv.textContent = "VS";

    const rightState = revealed ? (wasCorrect ? "hl-correct" : "hl-wrong") : "";
    const rightCard = buildCard(rightDemon, revealed, rightState);

    arena.append(leftCard, vsDiv, rightCard);
    stage.appendChild(arena);

    if (revealed && !wasCorrect) {
      const over = document.createElement("div");
      over.className = "hl-gameover-box";

      const h2 = document.createElement("h2");
      h2.textContent = "Wrong Guess!";

      const p = document.createElement("p");
      p.textContent = formatDisplay(rightDemon.name) + " is #" + rightDemon.position + " (vs " + formatDisplay(leftDemon.name) + " at #" + leftDemon.position + "). Final Streak: " + currentStreak;

      const retryBtn = document.createElement("button");
      retryBtn.type = "button";
      retryBtn.className = "sidebar-action-btn";
      retryBtn.style.width = "auto";
      retryBtn.style.marginTop = "12px";
      retryBtn.textContent = "Play Again";
      retryBtn.addEventListener("click", startNewHlGame);

      over.append(h2, p, retryBtn);
      stage.appendChild(over);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    const menu = document.getElementById("extras-dropdown-menu");
    if (menu && !menu.querySelector('[data-tab="higher-lower"]')) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tab-btn extras-menu-item";
      btn.setAttribute("data-tab", "higher-lower");
      btn.textContent = "Higher or Lower";
      menu.appendChild(btn);

      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        document.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.remove("active"); });
        document.querySelectorAll(".tab-content").forEach(function (c) { c.classList.remove("active"); });
        btn.classList.add("active");
        document.getElementById("extras-dropdown-toggle")?.classList.add("active");
        const target = document.getElementById("higher-lower");
        if (target) {
          target.classList.add("active");
          window.location.hash = "higher-lower";
        }
        document.getElementById("extras-dropdown")?.classList.remove("open");
        if (!leftDemon) startNewHlGame();
      });
    }

    if (!document.getElementById("higher-lower")) {
      const footer = document.querySelector(".site-footer");
      const sec = document.createElement("div");
      sec.id = "higher-lower";
      sec.className = "tab-content";
      sec.innerHTML =
        '<div class="hl-topbar">' +
          '<h1>Higher or Lower</h1>' +
          '<div class="hl-score-pills">' +
            '<div class="hl-pill">Streak: <span id="hl-cur-streak">0</span></div>' +
            '<div class="hl-pill">Best: <span id="hl-best-streak">' + bestStreak + '</span></div>' +
          '</div>' +
        '</div>' +
        '<div id="hl-stage"></div>';

      if (footer && footer.parentNode) {
        footer.parentNode.insertBefore(sec, footer);
      } else {
        document.body.appendChild(sec);
      }
    }

    const poll = setInterval(function () {
      if (getPool().length >= 2) {
        clearInterval(poll);
        startNewHlGame();
      }
    }, 150);
    setTimeout(function () { clearInterval(poll); }, 8000);
  });
})();

(function overrideRouletteWith3DSphere() {
  const SPHERE_RADIUS_X = 270;
  const SPHERE_RADIUS_Y = 120;
  const SPHERE_RADIUS_Z = 220;
  const PERSPECTIVE = 650;

  function getCardThumb(demon) {
    if (!demon) return "extreme.png";
    if (demon.thumbnail && demon.thumbnail.trim()) return demon.thumbnail.trim();
    if (typeof getYoutubeThumbnail === "function") {
      const yt = getYoutubeThumbnail(demon.verification);
      if (yt) return yt;
    }
    return "https://prevter.me" + encodeURIComponent(demon.id);
  }

  function launchSphereAnimation(wheelStage, resultCard) {
    const activeArea = document.getElementById("rl-active-area");
    if (!activeArea || !resultCard || resultCard.dataset.sphereOverride) return;
    resultCard.dataset.sphereOverride = "1";

    if (wheelStage) wheelStage.remove();

    const h2Text = resultCard.querySelector("h2")?.textContent || "Chosen Level";
    const winnerName = h2Text.replace(/^#\d+\s*[—-]\s*/, "").trim();

    const list = typeof getVisibleDemons === "function"
      ? getVisibleDemons()
      : (typeof globalDemons !== "undefined" ? globalDemons : []);
    const pool = (list || []).filter(function (d) { return !d.cosmetic; });

    const useMain = document.getElementById("rl-opt-main")?.checked;
    const useExt = document.getElementById("rl-opt-ext")?.checked;
    const useBeyond = document.getElementById("rl-opt-beyond")?.checked;

    let sphereDemons = pool.filter(function (d) {
      if (d.position <= 75 && useMain) return true;
      if (d.position >= 76 && d.position <= 150 && useExt) return true;
      if (d.position >= 151 && useBeyond) return true;
      return false;
    });

    if (sphereDemons.length === 0) sphereDemons = pool.slice();
    if (sphereDemons.length > 90) sphereDemons = sphereDemons.slice(0, 90);

    let winnerIndex = sphereDemons.findIndex(function (d) {
      return d.name.trim().toLowerCase() === winnerName.toLowerCase();
    });

    if (winnerIndex === -1) {
      const found = pool.find(function (d) {
        return d.name.trim().toLowerCase() === winnerName.toLowerCase();
      }) || { name: winnerName, position: "?", verifier: "Unknown", id: "" };
      sphereDemons.unshift(found);
      winnerIndex = 0;
    }

    resultCard.style.display = "none";

    const stage = document.createElement("div");
    stage.className = "rl-sphere-stage";

    const viewport = document.createElement("div");
    viewport.className = "rl-sphere-viewport";

    const count = sphereDemons.length;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const nodes = [];

    sphereDemons.forEach(function (demon, i) {
      const card = document.createElement("div");
      card.className = "rl-sphere-card";

      const img = document.createElement("img");
      img.src = getCardThumb(demon);
      img.alt = demon.name;
      img.onerror = function () {
        if (!img.src.endsWith("extreme.png")) img.src = "extreme.png";
      };

      const info = document.createElement("div");
      info.className = "rl-sphere-card-info";

      const title = document.createElement("div");
      title.className = "rl-sphere-card-title";
      title.textContent = "#" + (demon.position || "?") + " — " + demon.name;

      const sub = document.createElement("div");
      sub.className = "rl-sphere-card-sub";
      const ver = typeof cleanDisplayName === "function" ? cleanDisplayName(demon.verifier) : (demon.verifier || "");
      sub.textContent = ver ? "By " + ver : "";

      info.append(title, sub);
      card.append(img, info);
      viewport.appendChild(card);

      let y = count > 1 ? 1 - (i / (count - 1)) * 2 : 0;
      if (i === winnerIndex) y = 0;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = i === winnerIndex ? 0 : goldenAngle * i;

      nodes.push({
        el: card,
        x: Math.cos(theta) * radiusAtY,
        y: y,
        z: Math.sin(theta) * radiusAtY,
        isWinner: i === winnerIndex
      });
    });

    const caption = document.createElement("p");
    caption.className = "rl-wheel-caption";
    caption.textContent = "Rolling level…";

    stage.append(viewport, caption);
    activeArea.insertBefore(stage, resultCard);

    const winnerNode = nodes[winnerIndex];
    const targetRotY = Math.atan2(winnerNode.x, winnerNode.z);
    const totalRotY = targetRotY + Math.PI * 6;
    const duration = 3400;
    const startTime = performance.now();

    function renderFrame(rotY, tiltX, zoomProgress) {
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(tiltX);
      const sinX = Math.sin(tiltX);

      nodes.forEach(function (node) {
        const rx = node.x * cosY - node.z * sinY;
        const rz = node.z * cosY + node.x * sinY;

        const ry = node.y * cosX - rz * sinX;
        const fz = rz * cosX + node.y * sinX;

        const px = rx * SPHERE_RADIUS_X;
        const py = ry * SPHERE_RADIUS_Y;
        const pz = fz * SPHERE_RADIUS_Z;

        const scaleBase = PERSPECTIVE / (PERSPECTIVE - pz);
        const depthNorm = (fz + 1) / 2;

        if (node.isWinner && zoomProgress > 0) {
          const finalX = px * (1 - zoomProgress);
          const finalY = py * (1 - zoomProgress);
          const finalScale = scaleBase + (1.45 - scaleBase) * zoomProgress;
          node.el.style.transform = "translate3d(" + finalX.toFixed(1) + "px, " + finalY.toFixed(1) + "px, 0) scale(" + finalScale.toFixed(3) + ")";
          node.el.style.zIndex = "500";
          node.el.style.opacity = "1";
          node.el.style.filter = "brightness(1)";
        } else {
          const fadeOthers = zoomProgress > 0 ? Math.max(0.15, 1 - zoomProgress * 0.85) : 1;
          const opacity = (0.25 + depthNorm * 0.75) * fadeOthers;
          const brightness = 0.35 + depthNorm * 0.65;
          node.el.style.transform = "translate3d(" + px.toFixed(1) + "px, " + py.toFixed(1) + "px, 0) scale(" + (scaleBase * 0.88).toFixed(3) + ")";
          node.el.style.zIndex = String(Math.round(depthNorm * 200));
          node.el.style.opacity = opacity.toFixed(2);
          node.el.style.filter = "brightness(" + brightness.toFixed(2) + ")";
        }
      });
    }

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 0.82) {
        const spinP = progress / 0.82;
        const eased = 1 - Math.pow(1 - spinP, 4);
        const currentY = totalRotY * eased;
        const currentTilt = Math.sin(spinP * Math.PI) * 0.38;
        renderFrame(currentY, currentTilt, 0);
        requestAnimationFrame(animate);
      } else {
        const zoomP = (progress - 0.82) / 0.18;
        const easedZoom = 1 - Math.pow(1 - zoomP, 3);
        renderFrame(targetRotY, 0, easedZoom);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          winnerNode.el.classList.add("winner");
          const winDemon = sphereDemons[winnerIndex];
          caption.textContent = "Landed on: #" + (winDemon.position || "?") + " — " + winDemon.name;
          caption.style.color = "var(--accent-green)";

          setTimeout(function () {
            stage.remove();
            resultCard.style.display = "flex";
          }, 950);
        }
      }
    }

    requestAnimationFrame(animate);
  }

  document.addEventListener("DOMContentLoaded", function () {
    const activeArea = document.getElementById("rl-active-area");
    if (!activeArea) return;

    const obs = new MutationObserver(function () {
      const wheelStage = activeArea.querySelector(".rl-wheel-stage");
      const resultCard = activeArea.querySelector(".rl-current-card");
      if (wheelStage && resultCard) {
        launchSphereAnimation(wheelStage, resultCard);
      }
    });

    obs.observe(activeArea, { childList: true });
  });
})();

(function syncExtrasActiveTabState() {
  function updateExtrasHighlight() {
    const toggleBtn = document.getElementById("extras-dropdown-toggle");
    const menuItems = document.querySelectorAll("#extras-dropdown-menu .extras-menu-item");
    if (!toggleBtn || menuItems.length === 0) return;

    const isAnyExtraTabOpen = Array.from(menuItems).some(function (item) {
      const tabId = item.getAttribute("data-tab");
      const panel = tabId ? document.getElementById(tabId) : null;
      const isOpen = Boolean(panel && panel.classList.contains("active"));
      item.classList.toggle("active", isOpen);
      return isOpen;
    });

    toggleBtn.classList.toggle("active", isAnyExtraTabOpen);
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("click", function () {
      setTimeout(updateExtrasHighlight, 0);
    });

    window.addEventListener("hashchange", updateExtrasHighlight);
    setTimeout(updateExtrasHighlight, 120);
  });
})();

(function unifyTabClosing() {
  function closeAllTabsExcept(activeTabId) {
    document.querySelectorAll(".tab-content").forEach(function (panel) {
      panel.style.display = "";
      if (panel.id === activeTabId) {
        panel.classList.add("active");
      } else {
        panel.classList.remove("active");
      }
    });

    const toggleBtn = document.getElementById("extras-dropdown-toggle");
    const extraItems = document.querySelectorAll("#extras-dropdown-menu .extras-menu-item");
    let isExtraActive = false;

    extraItems.forEach(function (item) {
      const matches = item.getAttribute("data-tab") === activeTabId;
      item.classList.toggle("active", matches);
      if (matches) isExtraActive = true;
    });

    if (toggleBtn) {
      toggleBtn.classList.toggle("active", isExtraActive);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("click", function (e) {
      const tabTrigger = e.target.closest("[data-tab]");
      if (!tabTrigger) return;

      const targetTabId = tabTrigger.getAttribute("data-tab");
      if (!targetTabId || !document.getElementById(targetTabId)) return;

      setTimeout(function () {
        closeAllTabsExcept(targetTabId);
      }, 0);
    }, true);

    const observer = new MutationObserver(function () {
      const activeTabs = Array.from(document.querySelectorAll(".tab-content.active"));
      if (activeTabs.length > 1) {
        const latestTab = activeTabs[activeTabs.length - 1];
        closeAllTabsExcept(latestTab.id);
      }
    });

    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ["class"]
    });
  });
})();
