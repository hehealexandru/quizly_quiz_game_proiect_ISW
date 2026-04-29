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

  // Pregateste prima runda cand intri in modul versus.
  useEffect(() => {
    const nextRound = buildVersusRound(language);
    setActiveCategoryId(nextRound.categoryId);
    setQuestions(nextRound.questions);
    setLoading(false);
  }, [language]);

  // Ruleaza efectele audio folosite in meci.
  async function playEffect(type) {
    if (!soundEnabled) return;

    try {
      let soundFile;
      if (type === "correct") soundFile = require("../assets/sounds/correct.mp3");
      else if (type === "wrong") soundFile = require("../assets/sounds/wrong.mp3");
      else if (type === "win") soundFile = require("../assets/sounds/win.mp3");

      const { sound } = await Audio.Sound.createAsync(soundFile);
      await sound.playAsync();
    } catch (_error) {
    }
  }

  // Decide mesajul final pe baza scorului din runda.
  function getWinnerMessage(scoreOne = p1Score, scoreTwo = p2Score) {
    if (scoreOne > scoreTwo) return `${p1Name} ${t(language, "wins")}`;
    if (scoreTwo > scoreOne) return `${p2Name} ${t(language, "wins")}`;
    return t(language, "tie");
  }

  // Deschide modalul final cu scorul rundei si scorul seriei.
  function openGameOverModal({
    winnerMessage,
    scoreOne = p1Score,
    scoreTwo = p2Score,
    winsOne = p1Wins,
    winsTwo = p2Wins,
  } = {}) {
    setGameOverMessage(
      `${p1Name}: ${scoreOne}\n${p2Name}: ${scoreTwo}\n\n${
        winnerMessage || getWinnerMessage(scoreOne, scoreTwo)
      }\n\n${t(language, "seriesScore")}: ${winsOne}-${winsTwo}`
    );
    setShowGameOverModal(true);
  }

  // Reseteaza starea unei runde si, optional, toata seria.
  function resetVersusState(resetSeries = false) {
    setShowGameOverModal(false);
    setGameOverMessage("");
    setShowReviveModal(false);
    setPlayerToRevive(null);
    setCurrent(0);
    setTurn(1);
    setP1Score(0);
    setP2Score(0);
    setP1Lives(2);
    setP2Lives(2);
    setAnswered(false);
    setSelected(null);
    if (resetSeries) {
      setP1Wins(0);
      setP2Wins(0);
    }
  }

  // Porneste o runda noua fara sa iesi din versus.
  function startNewMatch() {
    const nextRound = buildVersusRound(language);

    setLoading(true);
    resetVersusState();
    setActiveCategoryId(nextRound.categoryId);
    setQuestions(nextRound.questions);
    setLoading(false);
  }

  // Iese din versus si curata complet scorurile seriei.
  function handleExitMatch() {
    resetVersusState(true);
    onExit();
  }

  // Inchide runda curenta si actualizeaza scorul de meciuri castigate.
  function finalizeMatch({ scoreOne = p1Score, scoreTwo = p2Score, winner = null } = {}) {
    let nextP1Wins = p1Wins;
    let nextP2Wins = p2Wins;
    let winnerMessage = t(language, "tie");

    if (winner === 1 || (winner === null && scoreOne > scoreTwo)) {
      nextP1Wins += 1;
      winnerMessage = `${p1Name} ${t(language, "wins")}`;
    } else if (winner === 2 || (winner === null && scoreTwo > scoreOne)) {
      nextP2Wins += 1;
      winnerMessage = `${p2Name} ${t(language, "wins")}`;
    } else if (winner === null) {
      winnerMessage = getWinnerMessage(scoreOne, scoreTwo);
    }

    setP1Wins(nextP1Wins);
    setP2Wins(nextP2Wins);
    playEffect("win");
    openGameOverModal({
      winnerMessage,
      scoreOne,
      scoreTwo,
      winsOne: nextP1Wins,
      winsTwo: nextP2Wins,
    });
  }

  // Valideaza numele si scoate ecranul de setup.
  function handleStartGame() {
    if (!p1Name.trim() || !p2Name.trim()) {
      Alert.alert(
        t(language, "namesRequiredTitle"),
        t(language, "namesRequiredMsg")
      );
      return;
    }

    setIsSetup(false);
  }

  // Continua jocul dupa revive pentru jucatorul eliminat.
  function handleContinueRevive() {
    if (playerToRevive === 1) setP1Lives(1);
    if (playerToRevive === 2) setP2Lives(1);

    setShowReviveModal(false);
    setPlayerToRevive(null);
    switchTurn();
  }

  // Inchide runda daca jucatorul refuza revive-ul.
  function handleRefuseRevive() {
    setShowReviveModal(false);
    setPlayerToRevive(null);
    finalizeMatch({ winner: playerToRevive === 1 ? 2 : 1 });
  }

  // Schimba jucatorul activ sau inchide runda la final.
  function switchTurn(nextScores = { p1: p1Score, p2: p2Score }) {
    const next = current + 1;
    if (next < questions.length) {
      setCurrent(next);
      setTurn((previous) => (previous === 1 ? 2 : 1));
      setAnswered(false);
      setSelected(null);
      return;
    }

    finalizeMatch({
      scoreOne: nextScores.p1,
      scoreTwo: nextScores.p2,
    });
  }
