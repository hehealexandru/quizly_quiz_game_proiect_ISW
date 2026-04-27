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
