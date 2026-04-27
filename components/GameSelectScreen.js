import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getCategoryLabel, getDifficultyLabel, t } from "../utils/i18n";
import { getHighScoreKey } from "../utils/highscores";
import { theme } from "../utils/theme";

const CATEGORY_IDS = [9, 11, 12, 17, 21, 22, 23];
const DIFFICULTIES = ["easy", "medium", "hard"];

// Ecranul unde alegi numele, categoria, dificultatea si modul.
function GameSelectScreen({
  language,
  onClose,
  onStartSingle,
  onStartVersus,
  difficulty,
  setDifficulty,
  category,
  setCategory,
  playerName,
  setPlayerName,
}) {
  const [showCategories, setShowCategories] = useState(false);
  const [showDifficulties, setShowDifficulties] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animeaza usor butoanele principale.
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Citeste high score-ul pentru categoria si dificultatea selectata.
  useEffect(() => {
    async function fetchHighScore() {
      try {
        const key = getHighScoreKey({
          mode: "classic",
          category,
          difficulty,
        });
        const stored = await AsyncStorage.getItem(key);
        setHighScore(stored ? parseInt(stored, 10) : 0);
      } catch (_error) {
        setHighScore(0);
      }
    }

    fetchHighScore();
  }, [category, difficulty]);
