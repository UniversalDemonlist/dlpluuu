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

  let list = listOverride || getVisibleDemons();

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

  populateDropdowns();
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


