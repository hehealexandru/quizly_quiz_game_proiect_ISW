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
