import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { CUSTOM_QUESTIONS_EN } from "../data";
import { CUSTOM_QUESTIONS_RO } from "../data-ro";
import { recordAnswer, showAchievementToast } from "../utils/achievements";
import { decodeHtml } from "../utils/decodeHtml";
import { t } from "../utils/i18n";
import { equipReward, recordMasteryAnswer } from "../utils/masteryService";
import { theme } from "../utils/theme";

// Ecranul principal de single player tine toata logica unei runde.
function QuizScreen({
  playerName,
  difficulty,
  language,
  category,
  gameMode,
  onGameEnd,
  onAchievementsUnlocked,
}) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(15);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(null);
  const [lives, setLives] = useState(3);
  const [showReviveModal, setShowReviveModal] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState(null);
  const [streak, setStreak] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fiftyUsed, setFiftyUsed] = useState(false);
  const [skipUsed, setSkipUsed] = useState(false);
  const [disabledAnswers, setDisabledAnswers] = useState([]);

  const streakPulse = useRef(new Animated.Value(1)).current;
  const levelUpScale = useRef(new Animated.Value(0.9)).current;
  const levelUpOpacity = useRef(new Animated.Value(0)).current;

  // Citeste setarea pentru sunet o singura data.
  useEffect(() => {
    async function checkSoundSetting() {
      const stored = await AsyncStorage.getItem("soundEnabled");
      if (stored !== null) {
        setSoundEnabled(stored === "true");
      }
    }

    checkSoundSetting();
  }, []);

  // Animeaza popup-ul de level up cand apare.
  useEffect(() => {
    if (!showLevelUpModal) return;

    levelUpScale.setValue(0.9);
    levelUpOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(levelUpScale, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(levelUpOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [showLevelUpModal, levelUpScale, levelUpOpacity]);

  // Pregateste lista de intrebari dupa mod, categorie si dificultate.
  useEffect(() => {
    setLoading(true);

    const sourceQuestions =
      language === "ro" && CUSTOM_QUESTIONS_RO.length > 0
        ? CUSTOM_QUESTIONS_RO
        : CUSTOM_QUESTIONS_EN;
    const questionsPerGame = gameMode === "mega" ? 100 : 10;
    const filteredByCategoryAndDifficulty = sourceQuestions.filter(
      (question) =>
        question.category === Number(category) &&
        question.difficulty === difficulty
    );
    const filteredByCategory = sourceQuestions.filter(
      (question) => question.category === Number(category)
    );

    const sourceData =
      gameMode === "mega"
        ? sourceQuestions
        : filteredByCategoryAndDifficulty.length >= questionsPerGame
          ? filteredByCategoryAndDifficulty
          : filteredByCategory.length >= questionsPerGame
            ? filteredByCategory
            : sourceQuestions;

    const shuffled = sourceData
      .sort(() => Math.random() - 0.5)
      .slice(0, questionsPerGame);

    const finalQuestions = shuffled.map((question) => {
      const decodedQuestion = decodeHtml(question.question);
      const decodedCorrect = decodeHtml(question.correct_answer);
      const decodedIncorrect = question.incorrect_answers.map((answer) =>
        decodeHtml(answer)
      );

      return {
        question: decodedQuestion,
        answers: shuffle([...decodedIncorrect, decodedCorrect]),
        correct: decodedCorrect,
        category: question.category,
        difficulty: question.difficulty,
      };
    });

    setQuestions(finalQuestions);
    setLoading(false);
  }, [difficulty, category, language, gameMode]);
