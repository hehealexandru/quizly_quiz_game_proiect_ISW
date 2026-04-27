import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Platform, ToastAndroid } from "react-native";
import { CUSTOM_QUESTIONS_EN } from "../data";
import { CUSTOM_QUESTIONS_RO } from "../data-ro";
import { getCategoryLabel, getDifficultyLabel, t } from "./i18n";

// Cheia principala unde se tine progresul la realizari.
const STORAGE_KEY = "achievements_v1";

// Pragurile folosite pentru categorii, dificultati si total.
const CATEGORY_MILESTONES = [10, 25, 50, 100, 200];
const CATEGORY_DIFFICULTY_MILESTONES = [25, 100, 250, 500, 1000];
const GLOBAL_TOTAL_MILESTONES = [100, 500, 1000];
const GLOBAL_STREAK_MILESTONES = [10, 25, 50];
const DIFFICULTY_KEYS = ["easy", "medium", "hard"];
const DIFFICULTY_ROMANS = ["I", "II", "III", "IV", "V"];

// Denumirile nivelurilor de realizari pe categorie.
const CATEGORY_LEVELS = {
  en: ["Beginner", "Intermediate", "Advanced", "Expert", "Master"],
  ro: ["Incepator", "Intermediar", "Avansat", "Expert", "Maestru"],
};

// Intoarce forma goala a progresului la prima rulare.
function getDefaultData() {
  return {
    correctByCategory: {},
    correctByCategoryDifficulty: {},
    totalCorrect: 0,
    currentStreak: 0,
    bestStreak: 0,
    unlockedAtById: {},
    lastViewedAt: null,
  };
}
// Evita erorile cand vine un numar invalid.
function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// Strange toate categoriile disponibile din datele aplicatiei.
export function getAllCategoryIds() {
  const ids = new Set();
  [CUSTOM_QUESTIONS_EN, CUSTOM_QUESTIONS_RO].forEach((list) => {
    list.forEach((q) => ids.add(Number(q.category)));
  });
  return [...ids].sort((a, b) => a - b);
}

// Alege lista corecta de titluri pentru limba curenta.
function getCategoryLevels(lang) {
  return CATEGORY_LEVELS[lang] || CATEGORY_LEVELS.en;
}

// Creeaza id-ul unic pentru o realizare de categorie.
function buildCategoryAchievementId(categoryId, threshold) {
  return `cat_${categoryId}_t_${threshold}`;
}

// Creeaza id-ul unic pentru o realizare de categorie si dificultate.
function buildCategoryDifficultyAchievementId(categoryId, difficulty, threshold) {
  return `cat_${categoryId}_diff_${difficulty}_t_${threshold}`;
}

// Creeaza id-ul unic pentru realizarile globale.
function buildGlobalAchievementId(type, threshold) {
  return `global_${type}_${threshold}`;
}

// Pune litera mare la inceput pentru etichetele afisate.
function capitalizeLabel(label) {
  if (!label || typeof label !== "string") return label || "";
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Construieste lista de realizari simple pe categorie.
function buildCategoryAchievements({
  language,
  categoryId,
  correctCount,
  unlockedAtById,
}) {
  const levels = getCategoryLevels(language);
  return CATEGORY_MILESTONES.map((threshold, index) => {
    const title = levels[index] || levels[levels.length - 1];
    const description =
      language === "ro"
        ? `Raspunde corect la ${threshold} intrebari in ${getCategoryLabel(
            language,
            categoryId
          )}.`
        : `Answer ${threshold} questions correctly in ${getCategoryLabel(
            language,
            categoryId
          )}.`;
    const id = buildCategoryAchievementId(categoryId, threshold);
    const unlockedAt = unlockedAtById[id] || null;
    const progress = Math.min(correctCount, threshold);
    const status = unlockedAt
      ? "unlocked"
      : correctCount > 0
        ? "in_progress"
        : "locked";
    return {
      id,
      title,
      description,
      threshold,
      progress,
      status,
      unlockedAt,
    };
  });
}
