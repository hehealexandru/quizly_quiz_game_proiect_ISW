import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";

import AchievementsScreen from "../components/AchievementsScreen";
import CategoryMasteryScreen from "../components/CategoryMasteryScreen";
import GameSelectScreen from "../components/GameSelectScreen";
import QuizScreen from "../components/QuizScreen";
import ResultScreen from "../components/ResultScreen";
import StartScreen from "../components/StartScreen";
import VersusScreen from "../components/VersusScreen";
import {
  hasNewUnlocks,
  loadAchievementsData,
  markAchievementsViewed,
} from "../utils/achievements";
import { loadAppFonts } from "../utils/fonts";
import { getHighScoreKey } from "../utils/highscores";

// Fundalul principal pentru toata aplicatia.
const backgroundImg = require("../assets/fundal.jpg");

// Componenta principala decide ce ecran este afisat.
export default function App() {
  const [playerName, setPlayerName] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState("easy");
  const [category, setCategory] = useState(9);
  const [gameMode, setGameMode] = useState("classic");
  const [lastResult, setLastResult] = useState(null);
  const [versusStarted, setVersusStarted] = useState(false);
  const [language, setLanguage] = useState("en");
  const [showAchievements, setShowAchievements] = useState(false);
  const [showMastery, setShowMastery] = useState(false);
  const [showGameSelect, setShowGameSelect] = useState(false);
  const [hasNewAchievements, setHasNewAchievements] = useState(false);
  const [achievementsRefreshKey, setAchievementsRefreshKey] = useState(0);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Incarca fonturile custom la pornire.
  useEffect(() => {
    let mounted = true;

    loadAppFonts()
      .catch(() => {})
      .finally(() => {
        if (mounted) setFontsLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Refoloseste ultimul nume introdus de jucator.
  useEffect(() => {
    async function loadLastPlayer() {
      try {
        const stored = await AsyncStorage.getItem("lastPlayer");
        if (stored) setPlayerName(stored);
      } catch (_error) {
      }
    }

    loadLastPlayer();
  }, []);

  // Actualizeaza badge-ul cand apar realizari noi.
  useEffect(() => {
    async function refreshBadge() {
      const data = await loadAchievementsData();
      setHasNewAchievements(hasNewUnlocks(data));
    }

    refreshBadge();
  }, [achievementsRefreshKey]);

  // Porneste jocul single sau mega cu setarile alese.
  function handleStart(name, diff, lang, cat, mode = "classic") {
    setPlayerName(name);
    setDifficulty(diff);
    setCategory(cat);
    setLanguage(lang);
    setLastResult(null);
    setVersusStarted(false);
    setShowAchievements(false);
    setShowMastery(false);
    setShowGameSelect(false);
    setGameMode(mode);
    setGameStarted(true);
  }

  // Inchide jocul, retine rezultatul si salveaza high score-ul corect.
  async function handleGameEnd(result) {
    setGameStarted(false);
    setLastResult(result);

    try {
      const key = getHighScoreKey({
        mode: result?.mode,
        category: result?.category,
        difficulty: result?.difficulty,
      });
      const savedScore = await AsyncStorage.getItem(key);
      const currentHighScore = savedScore ? parseInt(savedScore, 10) : 0;

      if (result.score > currentHighScore) {
        await AsyncStorage.setItem(key, result.score.toString());
      }
    } catch (_error) {
    }
  }

  // Revine din ecranul de rezultat la meniul principal.
  function handleBackFromResult() {
    setLastResult(null);
  }

  // Porneste modul local 1 vs 1.
  function handleStartVersus(diff, cat, lang) {
    setGameStarted(false);
    setLastResult(null);
    setDifficulty(diff);
    setCategory(cat);
    setLanguage(lang);
    setVersusStarted(true);
    setShowAchievements(false);
    setShowMastery(false);
    setShowGameSelect(false);
    setGameMode("versus");
  }

