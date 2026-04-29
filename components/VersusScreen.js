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

  // Proceseaza raspunsul jucatorului activ si schimba starea meciului.
  function handleAnswer(answer) {
      setAnswered(true);
      setSelected(answer);

      const isCorrect = answer === questions[current]?.correct;
      let currentPlayerDied = false;
      let nextP1Score = p1Score;
      let nextP2Score = p2Score;

      if (isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        playEffect("correct");
        if (turn === 1) {
          nextP1Score += 100;
          setP1Score(nextP1Score);
        } else {
          nextP2Score += 100;
          setP2Score(nextP2Score);
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        playEffect("wrong");

        if (turn === 1) {
          nextP1Score -= 50;
          setP1Score(nextP1Score);
        } else {
          nextP2Score -= 50;
          setP2Score(nextP2Score);
        }

        if (turn === 1) {
          const nextLives = p1Lives - 1;
          setP1Lives(nextLives);
          if (nextLives <= 0) currentPlayerDied = true;
        } else {
          const nextLives = p2Lives - 1;
          setP2Lives(nextLives);
          if (nextLives <= 0) currentPlayerDied = true;
        }
      }

      if (activeCategoryId) {
        recordAnswer({
          categoryId: activeCategoryId,
          isCorrect,
          mode: "versus",
        }).then(({ newUnlocks }) => {
          if (newUnlocks.length > 0) {
            showAchievementToast(language);
            onAchievementsUnlocked && onAchievementsUnlocked();
          }
        });
      }

      if (currentPlayerDied) {
        setTimeout(() => {
          setPlayerToRevive(turn);
          setShowReviveModal(true);
        }, 1000);
      } else {
        setTimeout(() => {
          switchTurn({ p1: nextP1Score, p2: nextP2Score });
        }, 1500);
      }
  }

  if (isSetup) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.setupContainer}
      >
        <Text style={styles.setupTitle}>{t(language, "vsModeTitle")}</Text>
        <Text style={styles.setupSubtitle}>{t(language, "vsSubtitle")}</Text>

        <View style={styles.infoBadge}>
          <Text style={styles.infoText}>{t(language, "vsInfo")}</Text>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>{t(language, "p1NameLabel")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t(language, "nameExample")}
            placeholderTextColor="#64748b"
            value={p1Name}
            onChangeText={setP1Name}
          />
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>{t(language, "p2NameLabel")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t(language, "nameExample")}
            placeholderTextColor="#64748b"
            value={p2Name}
            onChangeText={setP2Name}
          />
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={handleStartGame}>
          <Text style={styles.startBtnText}>{t(language, "startRandom")}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleExitMatch} style={{ marginTop: 20 }}>
          <Text style={styles.cancelText}>{t(language, "cancel")}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  const questionsPerPlayer = 7;
  const currentRound = Math.floor(current / 2) + 1;
  const progressText = `${t(language, "round")}: ${currentRound} / ${questionsPerPlayer}`;
  const currentQuestion = questions[current] || {};
  const seriesScoreText = `${p1Wins}-${p2Wins}`;

  // Zona unui jucator se roteste sus si ramane normala jos.
  const PlayerZone = ({ playerNum, name, score, lives, isActive, rotated }) => {
    const themeColor =
      playerNum === 1 ? theme.colors.accent : theme.colors.danger;
    const backgroundColor = isActive
      ? theme.colors.surfaceStrong
      : theme.colors.surface;

    return (
      <View
        style={[
          styles.playerZone,
          rotated && styles.rotatedZone,
          {
            backgroundColor,
            borderColor: isActive ? themeColor : "transparent",
          },
        ]}
      >
        <View style={styles.playerHeader}>
          <View>
            <Text style={[styles.pLabel, { color: themeColor }]}>{name}</Text>
            <Text style={styles.pLives}>{Array(lives).fill("❤️").join(" ")}</Text>
          </View>
          <Text style={[styles.pScore, { color: themeColor }]}>{score}</Text>
        </View>

        {isActive ? (
          <View style={styles.quizContent}>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
            <View style={styles.answersGrid}>
              {currentQuestion.answers?.map((answer, index) => {
                const isCorrect = answer === currentQuestion.correct;
                const isSelected = answer === selected;
                const buttonStyle = [styles.answerBtn];

                if (answered) {
                  if (isCorrect) buttonStyle.push({ backgroundColor: theme.colors.success });
                  else if (isSelected) {
                    buttonStyle.push({ backgroundColor: theme.colors.danger });
                  }
                }

                return (
                  <TouchableOpacity
                    key={index}
                    style={buttonStyle}
                    disabled={answered}
                    onPress={() => handleAnswer(answer)}
                  >
                    <Text style={styles.answerText}>{answer}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.waitingContainer}>
            <Text style={[styles.waitingText, { color: themeColor }]}>
              {name} {t(language, "waiting")}
            </Text>
          </View>
        )}

        <Text style={styles.progressText}>{progressText}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.halfScreen}>
        <PlayerZone
          playerNum={2}
          name={p2Name}
          score={p2Score}
          lives={p2Lives}
          isActive={turn === 2}
          rotated
        />
      </View>

      <View style={styles.centerDivider}>
        <Text style={styles.seriesLabel}>{t(language, "seriesScore")}</Text>
        <Text style={styles.seriesScore}>{seriesScoreText}</Text>
        <TouchableOpacity onPress={handleExitMatch} style={styles.smallExitBtn}>
          <Text style={styles.smallExitText}>{t(language, "quit")}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.halfScreen}>
        <PlayerZone
          playerNum={1}
          name={p1Name}
          score={p1Score}
          lives={p1Lives}
          isActive={turn === 1}
          rotated={false}
        />
      </View>

      <Modal visible={showReviveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              playerToRevive === 2 && { transform: [{ rotate: "180deg" }] },
            ]}
          >
            <Text style={styles.modalTitle}>{t(language, "eliminatedTitle")}</Text>
            <Text style={styles.modalText}>
              {playerToRevive === 1 ? p1Name : p2Name} {t(language, "eliminatedText")}
            </Text>
            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={handleContinueRevive}
            >
              <Text style={styles.primaryActionBtnText}>
                {t(language, "reviveBtnVs")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.giveUpBtn} onPress={handleRefuseRevive}>
              <Text style={styles.giveUpText}>{t(language, "endGame")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showGameOverModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, styles.gameOverTitle]}>
              {t(language, "finalScoreTitle")}
            </Text>
            <Text style={[styles.modalText, styles.gameOverText]}>
              {gameOverMessage}
            </Text>
            <TouchableOpacity style={styles.primaryActionBtn} onPress={startNewMatch}>
              <Text style={styles.primaryActionBtnText}>{t(language, "playAgain")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={handleExitMatch}
            >
              <Text style={styles.secondaryActionBtnText}>{t(language, "exit")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
                  
// Stilurile pentru ecranul versus si modalele lui.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgDeep,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.bgDeep,
  },
  setupContainer: {
    flex: 1,
    backgroundColor: theme.colors.bgDeep,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  setupTitle: {
    fontSize: 42,
    fontWeight: "900",
    color: theme.colors.text,
    fontFamily: theme.fonts.title,
    marginBottom: 8,
    letterSpacing: 2,
  },
  setupSubtitle: {
    fontSize: 18,
    color: theme.colors.textMuted,
    marginBottom: 30,
  },
  infoBadge: {
    backgroundColor: theme.colors.accentSoft,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: theme.radius.md,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoText: {
    color: theme.colors.gold,
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  inputCard: {
    width: "100%",
    marginBottom: 20,
  },
  inputLabel: {
    color: theme.colors.textMuted,
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    backgroundColor: theme.colors.surfaceStrong,
    padding: 16,
    borderRadius: theme.radius.md,
    color: theme.colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  startBtn: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: theme.radius.lg,
    marginTop: 20,
    width: "100%",
    alignItems: "center",
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  startBtnText: {
    color: theme.colors.bgDeep,
    fontWeight: "800",
    fontSize: 18,
  },
  cancelText: {
    color: theme.colors.danger,
    fontSize: 16,
  },
  halfScreen: {
    flex: 1,
    padding: 8,
    justifyContent: "center",
  },
  centerDivider: {
    minHeight: 62,
    backgroundColor: theme.colors.bgDeep,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    gap: 4,
    paddingVertical: 6,
  },
  seriesLabel: {
    color: theme.colors.textFaint,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  seriesScore: {
    color: theme.colors.gold,
    fontSize: 18,
    fontWeight: "900",
    fontFamily: theme.fonts.mono,
  },
  smallExitBtn: {
    backgroundColor: theme.colors.surfaceStrong,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
  smallExitText: {
    color: theme.colors.textMuted,
    fontWeight: "bold",
    fontSize: 10,
  },
  playerZone: {
    flex: 1,
    borderRadius: theme.radius.lg,
    padding: 16,
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: "transparent",
  },
  rotatedZone: {
    transform: [{ rotate: "180deg" }],
  },
  playerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  pLabel: {
    fontSize: 18,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  pScore: {
    fontSize: 24,
    fontWeight: "bold",
    minWidth: 56,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
    fontFamily: theme.fonts.mono,
  },
  pLives: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: "bold",
  },
  quizContent: {
    flex: 1,
    justifyContent: "center",
  },
  questionText: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 24,
  },
  answersGrid: {
    gap: 10,
  },
  answerBtn: {
    backgroundColor: theme.colors.surfaceStrong,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: theme.radius.md,
  },
  answerText: {
    color: theme.colors.text,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 15,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.7,
  },
  waitingText: {
    fontSize: 20,
    fontWeight: "bold",
    opacity: 0.6,
  },
  progressText: {
    textAlign: "center",
    color: theme.colors.textFaint,
    fontSize: 12,
    marginTop: 10,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(7,11,20,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "75%",
    backgroundColor: theme.colors.surface,
    padding: 24,
    borderRadius: theme.radius.xl,
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colors.gold,
  },
  modalTitle: {
    color: theme.colors.danger,
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 5,
  },
  modalText: {
    color: theme.colors.text,
    marginBottom: 20,
    textAlign: "center",
    fontSize: 16,
  },
  gameOverTitle: {
    color: theme.colors.gold,
  },
  gameOverText: {
    lineHeight: 24,
  },
  primaryActionBtn: {
    backgroundColor: theme.colors.accent,
    padding: 14,
    borderRadius: theme.radius.md,
    width: "100%",
    marginBottom: 12,
  },
  primaryActionBtnText: {
    color: theme.colors.bgDeep,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  secondaryActionBtn: {
    backgroundColor: theme.colors.surfaceStrong,
    padding: 14,
    borderRadius: theme.radius.md,
    width: "100%",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryActionBtnText: {
    color: theme.colors.text,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  giveUpBtn: {
    paddingVertical: 8,
  },
  giveUpText: {
    color: theme.colors.textFaint,
    textDecorationLine: "underline",
    fontSize: 14,
  },
});

export default VersusScreen;

