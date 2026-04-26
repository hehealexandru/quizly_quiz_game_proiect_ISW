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

  // Face tranzitia scorului mai lina in UI.
  useEffect(() => {
    if (displayScore === score) return;

    const start = displayScore;
    const end = score;
    const duration = 400;
    const steps = 20;
    const stepTime = duration / steps;
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep += 1;
      const progress = currentStep / steps;
      const value = Math.round(start + (end - start) * progress);
      setDisplayScore(value);
      if (currentStep >= steps) clearInterval(timer);
    }, stepTime);

    return () => clearInterval(timer);
  }, [score, displayScore]);

  // Da un mic pulse la streak cand creste.
  useEffect(() => {
    if (streak <= 0) return;

    streakPulse.setValue(1);
    Animated.sequence([
      Animated.timing(streakPulse, {
        toValue: 1.06,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(streakPulse, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [streak, streakPulse]);

  // Ruleaza efectele audio pentru raspuns si final.
  const playEffect = useCallback(async (type) => {
    if (!soundEnabled) return;

    try {
      let soundFile;
      if (type === "correct") soundFile = require("../assets/sounds/correct.mp3");
      else if (type === "wrong") soundFile = require("../assets/sounds/wrong.mp3");
      else if (type === "win") soundFile = require("../assets/sounds/win.mp3");

      const { sound } = await Audio.Sound.createAsync(soundFile);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          await sound.unloadAsync();
        }
      });
    } catch (_error) {
    }
  }, [soundEnabled]);

  // Amesteca raspunsurile pentru fiecare intrebare.
  function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
  }

  // Trece la urmatoarea intrebare si reseteaza starea temporara.
  const moveToNextQuestion = useCallback(() => {
    const next = current + 1;
    if (next < questions.length) {
      setCurrent(next);
      setAnswered(false);
      setSelected(null);
      setTimeLeft(15);
      setDisabledAnswers([]);
    }
  }, [current, questions.length]);

  // Proceseaza raspunsul, scorul, vietile si progresul secundar.
  const handleAnswer = useCallback((answer) => {
      if (disabledAnswers.includes(answer)) return;

      setAnswered(true);
      setSelected(answer);

      const isCorrect = answer === questions[current]?.correct;
      const activeCategory =
        gameMode === "mega"
          ? Number(questions[current]?.category)
          : Number(category);
      const activeDifficulty =
        gameMode === "mega" ? questions[current]?.difficulty : difficulty;
      const safeCategory = Number.isFinite(activeCategory)
        ? activeCategory
        : Number(category);
      const safeDifficulty = activeDifficulty || difficulty;

      if (isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        playEffect("correct");
        setStreak((previous) => previous + 1);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        playEffect("wrong");
        setStreak(0);
      }

      let nextScore = score;
      if (isCorrect) nextScore += 100;
      else nextScore -= 50;
      setScore(nextScore);

      recordAnswer({
        categoryId: safeCategory,
        isCorrect,
        difficulty: safeDifficulty,
        mode: "single",
      }).then(({ newUnlocks }) => {
        if (newUnlocks.length > 0) {
          showAchievementToast(language);
          onAchievementsUnlocked && onAchievementsUnlocked();
        }
      });

      recordMasteryAnswer({
        categoryId: safeCategory,
        isCorrect,
        difficulty: safeDifficulty,
        language,
      }).then(({ levelUpInfo: masteryLevelUp, leveledUp }) => {
        if (leveledUp && masteryLevelUp) {
          setLevelUpInfo(masteryLevelUp);
          setShowLevelUpModal(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          playEffect("win");
        }
      });

      let currentLives = lives;
      if (!isCorrect) {
        currentLives -= 1;
        setLives(currentLives);
      }

      if (currentLives <= 0) {
        setTimeout(() => {
          setShowReviveModal(true);
        }, 1000);
        return;
      }

      const isLastQuestion = current + 1 === questions.length;
      if (isLastQuestion) {
        playEffect("win");
        setTimeout(() => {
          onGameEnd &&
            onGameEnd({
              score: nextScore,
              difficulty,
              category,
              mode: gameMode,
              totalQuestions: questions.length,
            });
        }, 1500);
      } else {
        setTimeout(() => {
          moveToNextQuestion();
        }, 1500);
      }
  }, [
    category,
    current,
    difficulty,
    disabledAnswers,
    gameMode,
    language,
    lives,
    moveToNextQuestion,
    onAchievementsUnlocked,
    onGameEnd,
    playEffect,
    questions,
    score,
  ]);

  // Scade timerul doar cand jocul este activ.
  useEffect(() => {
    if (loading || answered || showReviveModal || showLevelUpModal) return;

    if (timeLeft === 0) {
      handleAnswer(null);
      return;
    }

    const timer = setTimeout(() => setTimeLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, answered, loading, handleAnswer, showReviveModal, showLevelUpModal]);

  // Dezactiveaza doua raspunsuri gresite.
  function activateFifty() {
    setFiftyUsed(true);

    const currentQuestion = questions[current];
    if (!currentQuestion?.answers) return;

    const wrongAnswers = currentQuestion.answers.filter(
      (answer) => answer !== currentQuestion.correct
    );
    const answersToDisable = wrongAnswers
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    setDisabledAnswers(answersToDisable);
  }

  // Blocheaza reutilizarea butonului 50/50.
  function handlePressFifty() {
    if (fiftyUsed || answered) return;
    activateFifty();
  }

  // Sari peste intrebare si ofera punctele standard.
  function activateSkip() {
    const nextScore = score + 100;

    setSkipUsed(true);
    setAnswered(true);
    setSelected("SKIPPED");
    setScore(nextScore);
    playEffect("correct");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setTimeout(() => {
      const next = current + 1;
      if (next < questions.length) {
        moveToNextQuestion();
      } else {
        playEffect("win");
        onGameEnd &&
          onGameEnd({
            score: nextScore,
            difficulty,
            category,
            mode: gameMode,
            totalQuestions: questions.length,
          });
      }
    }, 1200);
  }

  // Blocheaza reutilizarea butonului skip.
  function handlePressSkip() {
    if (skipUsed || answered) return;
    activateSkip();
  }

  // Continua jocul cu o singura viata.
  function activateRevive() {
    setLives(1);
    setShowReviveModal(false);
    playEffect("correct");

    const next = current + 1;
    if (next < questions.length) {
      moveToNextQuestion();
    } else {
      playEffect("win");
      onGameEnd &&
        onGameEnd({
          score,
          difficulty,
          category,
          mode: gameMode,
          totalQuestions: questions.length,
        });
    }
  }

  // Leaga butonul din modal de logica de revive.
  function handlePressRevive() {
    activateRevive();
  }

  // Inchide runda imediat daca jucatorul renunta.
  function handleGiveUp() {
    setShowReviveModal(false);
    playEffect("wrong");
    onGameEnd &&
      onGameEnd({
        score,
        difficulty,
        category,
        mode: gameMode,
        totalQuestions: questions.length,
      });
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  const currentQuestion = questions[current] || {};

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerBar}>
        <Text style={styles.livesText}>
          {t(language, "lives")}: {Array(lives).fill("❤️").join(" ")}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.playerName}>{playerName}</Text>

        <View style={styles.scoreTimer}>
          <Text style={styles.timerText}>
            {t(language, "time")}: {timeLeft}s
          </Text>
          <Text style={styles.scoreText}>
            {t(language, "score")}: {displayScore}
          </Text>
        </View>

        {streak > 0 && (
          <View style={styles.streakPill}>
            <Animated.Text
              style={[styles.streakText, { transform: [{ scale: streakPulse }] }]}
            >
              {t(language, "streak")}: {streak}
            </Animated.Text>
          </View>
        )}

        <View style={styles.timeBar}>
          <View
            style={[
              styles.timeFill,
              {
                width: `${(timeLeft / 15) * 100}%`,
                backgroundColor:
                  timeLeft <= 5 ? theme.colors.danger : theme.colors.accent,
              },
            ]}
          />
        </View>

        <Text style={styles.questionText}>{currentQuestion.question}</Text>

        <View style={styles.powerups}>
          <TouchableOpacity
            style={[styles.powerBtn, fiftyUsed && styles.powerBtnUsed]}
            onPress={handlePressFifty}
            disabled={fiftyUsed || answered}
          >
            <Text style={styles.powerBtnText}>{t(language, "powerFifty")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.powerBtn, skipUsed && styles.powerBtnUsed]}
            onPress={handlePressSkip}
            disabled={skipUsed || answered}
          >
            <Text style={styles.powerBtnText}>{t(language, "powerSkip")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.answers}>
          {currentQuestion.answers?.map((answer, index) => {
            const isCorrect = answer === currentQuestion.correct;
            const isSelected = answer === selected;
            const isDisabled = disabledAnswers.includes(answer);

            const buttonStyle = [styles.answerBtn];
            if (isDisabled) buttonStyle.push(styles.answerBtnDisabled);
            if (answered && isCorrect) buttonStyle.push(styles.answerBtnCorrect);
            else if (answered && isSelected && !isCorrect) {
              buttonStyle.push(styles.answerBtnWrong);
            }

            return (
              <TouchableOpacity
                key={index}
                style={buttonStyle}
                disabled={isDisabled}
                onPress={() => !answered && handleAnswer(answer)}
              >
                <Text style={styles.answerText}>{answer}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.progressText}>
          {t(language, "questionProgress")} {current + 1} / {questions.length}
        </Text>
      </View>

      <Modal visible={showReviveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>💔 {t(language, "ohNo")} 💔</Text>
            <Text style={styles.modalText}>{t(language, "outOfLives")}</Text>
            <Text style={styles.modalSubText}>{t(language, "revivePrompt")}</Text>

            <TouchableOpacity style={styles.reviveBtn} onPress={handlePressRevive}>
              <Text style={styles.reviveBtnText}>{t(language, "reviveBtn")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.giveUpBtn} onPress={handleGiveUp}>
              <Text style={styles.giveUpBtnText}>{t(language, "giveUp")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showLevelUpModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.levelUpModal,
              { opacity: levelUpOpacity, transform: [{ scale: levelUpScale }] },
            ]}
          >
            <Text style={styles.levelUpTitle}>{t(language, "levelUpTitle")}</Text>
            <Text style={styles.levelUpSubtitle}>Lv {levelUpInfo?.level}</Text>

            {levelUpInfo?.reward && (
              <Text style={styles.levelUpReward}>{levelUpInfo.reward.label}</Text>
            )}

            {levelUpInfo?.canEquip && levelUpInfo?.reward && (
              <TouchableOpacity
                style={styles.equipBtn}
                onPress={async () => {
                  await equipReward({
                    categoryId: Number(category),
                    rewardId: levelUpInfo.reward.id,
                  });
                  setShowLevelUpModal(false);
                }}
              >
                <Text style={styles.equipBtnText}>{t(language, "equipNow")}</Text>
              </TouchableOpacity>
            )}
