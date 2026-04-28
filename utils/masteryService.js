import { CUSTOM_QUESTIONS_EN } from "../data";
import { CUSTOM_QUESTIONS_RO } from "../data-ro";
import { getCategoryLabel, t } from "./i18n";
import { loadJSON, saveJSON } from "./storageService";

// Cheia principala pentru progresul de mastery.
const STORAGE_KEY = "mastery_v1";
const MAX_LEVEL = 50;

// Regulile de XP pentru raspunsuri si streak.
const XP_RULES = {
  correct: 10,
  wrong: 3,
  streakBonusPerCorrect: 1,
  streakBonusMax: 5,
  difficultyMultiplier: {
    easy: 1,
    medium: 1.2,
    hard: 1.5,
  },
};

// Nivelurile la care se ofera recompense.
const REWARD_MAP = [
  { level: 3, type: "badge", labelKey: "rewardBeginner" },
  { level: 5, type: "frame", labelKey: "rewardFrame1" },
  { level: 8, type: "theme", labelKey: "rewardTheme1" },
  { level: 10, type: "title", labelKey: "rewardExpertTitle" },
  { level: 15, type: "theme", labelKey: "rewardTheme2" },
  { level: 20, type: "badge", labelKey: "rewardMaster" },
  { level: 50, type: "badge", labelKey: "rewardLegend" },
];

// Curata valorile care nu sunt numere valide.
function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// Strange toate categoriile folosite in aplicatie.
export function getAllCategoryIds() {
  const ids = new Set();
  [CUSTOM_QUESTIONS_EN, CUSTOM_QUESTIONS_RO].forEach((list) => {
    list.forEach((q) => ids.add(Number(q.category)));
  });
  return [...ids].sort((a, b) => a - b);
}

// Calculeaza cat XP este nevoie pentru nivelul urmator.
export function getXpRequired(level) {
  const base = 50 + (level - 1) * 25;
  if (level >= 45) return Math.round(base * 3.5);
  if (level >= 35) return Math.round(base * 2.2);
  return base;
}

// Starea goala pentru o singura categorie.
function createDefaultCategoryState() {
  return {
    level: 1,
    xp: 0,
    totalXp: 0,
    streak: 0,
    lastUpdated: null,
  };
}

// Starea goala pentru tot sistemul de mastery.
function createDefaultState() {
  return {
    masteryByCategory: {},
    unlockedRewards: {
      cosmetics: [],
      perks: [],
      equipped: {},
    },
  };
}

// Se asigura ca fiecare categorie are intrare in storage.
function ensureCategoryEntries(state) {
  const ids = getAllCategoryIds();
  ids.forEach((id) => {
    const key = String(id);
    if (!state.masteryByCategory[key]) {
      state.masteryByCategory[key] = createDefaultCategoryState();
    }
  });
  return state;
}

// Incarca progresul de mastery si completeaza lipsurile.
export async function loadMasteryState() {
  const stored = await loadJSON(STORAGE_KEY, createDefaultState());
  const state = {
    ...createDefaultState(),
    ...stored,
    masteryByCategory: stored.masteryByCategory || {},
    unlockedRewards: stored.unlockedRewards || {
      cosmetics: [],
      perks: [],
      equipped: {},
    },
  };
  return ensureCategoryEntries(state);
}

// Salveaza progresul de mastery dupa orice schimbare.
async function saveMasteryState(state) {
  await saveJSON(STORAGE_KEY, state);
}

// Construieste obiectul final pentru o recompensa.
function buildReward({ language, categoryId, reward }) {
  const categoryLabel = getCategoryLabel(language, categoryId);
  const label = t(language, reward.labelKey);
  return {
    id: `${categoryId}_${reward.type}_${reward.level}`,
    level: reward.level,
    type: reward.type,
    label: `${label} ${categoryLabel}`,
  };
}

// Intoarce lista de recompense pentru o categorie.
export function getRewardsForCategory({ language, categoryId, unlockedRewards }) {
  return REWARD_MAP.map((reward) => {
    const info = buildReward({ language, categoryId, reward });
    const unlocked =
      unlockedRewards?.cosmetics?.includes(info.id) ||
      unlockedRewards?.perks?.includes(info.id);
    return {
      ...info,
      unlocked,
    };
  });
}

// Adauga recompensa noua in lista corecta.
function addUnlockedReward(state, rewardId, type) {
  if (type === "perk") {
    if (!state.unlockedRewards.perks.includes(rewardId)) {
      state.unlockedRewards.perks.push(rewardId);
    }
  } else {
    if (!state.unlockedRewards.cosmetics.includes(rewardId)) {
      state.unlockedRewards.cosmetics.push(rewardId);
    }
  }
}

// Marcheaza cosmetic-ul echipat pentru o categorie.
function equipCosmetic(state, categoryId, rewardId) {
  state.unlockedRewards.equipped[String(categoryId)] = rewardId;
}

// Calculeaza XP-ul de baza in functie de dificultate.
function computeBaseXp({ isCorrect, difficulty }) {
  const base = isCorrect ? XP_RULES.correct : XP_RULES.wrong;
  const mult =
    difficulty && XP_RULES.difficultyMultiplier[difficulty]
      ? XP_RULES.difficultyMultiplier[difficulty]
      : 1;
  return Math.round(base * mult);
}

// Actualizeaza XP-ul si nivelul dupa fiecare raspuns.
export async function recordMasteryAnswer({
  categoryId,
  isCorrect,
  difficulty,
  language = "en",
}) {
  const state = await loadMasteryState();
  const key = String(categoryId);
  const categoryState = state.masteryByCategory[key] || createDefaultCategoryState();

  let streakBonus = 0;
  if (isCorrect) {
    const newStreak = safeNumber(categoryState.streak) + 1;
    categoryState.streak = newStreak;
    streakBonus = Math.min(
      XP_RULES.streakBonusMax,
      XP_RULES.streakBonusPerCorrect * newStreak
    );
  } else {
    categoryState.streak = 0;
  }

  const baseXp = computeBaseXp({ isCorrect, difficulty });
  const totalGain = isCorrect ? baseXp + streakBonus : baseXp;

  categoryState.totalXp = safeNumber(categoryState.totalXp) + totalGain;
  categoryState.xp = safeNumber(categoryState.xp) + totalGain;
  categoryState.lastUpdated = new Date().toISOString();

  let levelUpInfo = null;
  let leveledUp = false;

  while (categoryState.level < MAX_LEVEL) {
    const required = getXpRequired(categoryState.level);
    if (categoryState.xp < required) break;
    categoryState.xp -= required;
    categoryState.level += 1;
    leveledUp = true;

    const reward = REWARD_MAP.find((r) => r.level === categoryState.level);
    if (reward) {
      const rewardInfo = buildReward({
        language,
        categoryId,
        reward,
      });
      addUnlockedReward(state, rewardInfo.id, reward.type === "perk" ? "perk" : "cosmetic");
      levelUpInfo = {
        level: categoryState.level,
        reward: rewardInfo,
        canEquip: reward.type !== "perk",
      };
    }
  }

  state.masteryByCategory[key] = categoryState;
  await saveMasteryState(state);

  return {
    state,
    leveledUp,
    levelUpInfo,
    xpGained: totalGain,
  };
}

