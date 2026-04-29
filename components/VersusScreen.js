import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { CUSTOM_QUESTIONS_EN } from "../data";
import { CUSTOM_QUESTIONS_RO } from "../data-ro";
import { recordAnswer, showAchievementToast } from "../utils/achievements";
import { decodeHtml } from "../utils/decodeHtml";
import { t } from "../utils/i18n";
import { theme } from "../utils/theme";

const CATEGORY_IDS = [9, 11, 12, 17, 21, 22, 23];

// Amesteca raspunsurile si intrebarile in mod simplu.
function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

// Construieste un meci nou 1 vs 1 cu intrebari random.
function buildVersusRound(language) {
  const sourceQuestions =
    language === "ro" && CUSTOM_QUESTIONS_RO.length > 0
      ? CUSTOM_QUESTIONS_RO
      : CUSTOM_QUESTIONS_EN;
  const randomCategoryId =
    CATEGORY_IDS[Math.floor(Math.random() * CATEGORY_IDS.length)];

  let filteredQuestions = sourceQuestions.filter(
    (question) => question.category === randomCategoryId
  );
  if (filteredQuestions.length < 14) {
    filteredQuestions = sourceQuestions;
  }

  const questions = shuffle(filteredQuestions)
    .slice(0, 14)
    .map((question) => ({
      question: decodeHtml(question.question),
      answers: shuffle([
        ...question.incorrect_answers.map((answer) => decodeHtml(answer)),
        decodeHtml(question.correct_answer),
      ]),
      correct: decodeHtml(question.correct_answer),
    }));

  return {
    categoryId: randomCategoryId,
    questions,
  };
}

// Ecranul versus tine o runda locala pentru doi jucatori.
function VersusScreen({ onExit, language, onAchievementsUnlocked }) {
  const [isSetup, setIsSetup] = useState(true);
  const [p1Name, setP1Name] = useState("");
  const [p2Name, setP2Name] = useState("");
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [turn, setTurn] = useState(1);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [p1Wins, setP1Wins] = useState(0);
  const [p2Wins, setP2Wins] = useState(0);
  const [p1Lives, setP1Lives] = useState(2);
  const [p2Lives, setP2Lives] = useState(2);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showReviveModal, setShowReviveModal] = useState(false);
  const [playerToRevive, setPlayerToRevive] = useState(null);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState("");

  // Citeste setarea de sunet salvata local.
  useEffect(() => {
    async function checkSoundSetting() {
      const stored = await AsyncStorage.getItem("soundEnabled");
      if (stored !== null) setSoundEnabled(stored === "true");
    }

    checkSoundSetting();
  }, [language]);
