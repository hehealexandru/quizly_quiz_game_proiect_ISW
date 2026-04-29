import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getCategoryLabel, getDifficultyLabel, t } from "../utils/i18n";
import { theme } from "../utils/theme";

// Traduce scorul final intr-un rang usor de afisat.
function getRank(score, language) {
  if (score >= 900) {
    return {
      title: t(language, "rankTitles").supreme,
      description: t(language, "rankDescriptions").supreme,
    };
  } else if (score >= 800) {
    return {
      title: t(language, "rankTitles").encyclopedia,
      description: t(language, "rankDescriptions").encyclopedia,
    };
  } else if (score >= 700) {
    return {
      title: t(language, "rankTitles").geek,
      description: t(language, "rankDescriptions").geek,
    };
  } else if (score >= 500) {
    return {
      title: t(language, "rankTitles").serious,
      description: t(language, "rankDescriptions").serious,
    };
  } else if (score >= 300) {
    return {
      title: t(language, "rankTitles").explorer,
      description: t(language, "rankDescriptions").explorer,
    };
  } else if (score >= 0) {
    return {
      title: t(language, "rankTitles").survivor,
      description: t(language, "rankDescriptions").survivor,
    };
  }
  return {
    title: t(language, "rankTitles").chaos,
    description: t(language, "rankDescriptions").chaos,
  };
}

// Ecranul final arata scorul, rangul si sumarul jocului.
function ResultScreen({ playerName, result, language, onBack }) {
  if (!result) return null;

  const { score, difficulty, category, mode, totalQuestions } = result;
  const rank = getRank(score, language);
  const maxScore = (totalQuestions || 10) * 100;

  const rawDifficultyLabel = getDifficultyLabel(language, difficulty) || "-";
  const difficultyLabel =
    rawDifficultyLabel && rawDifficultyLabel !== "-"
      ? rawDifficultyLabel.charAt(0).toUpperCase() + rawDifficultyLabel.slice(1)
      : rawDifficultyLabel;
  const categoryLabel = getCategoryLabel(language, Number(category)) || "Other";

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <Text style={styles.title}>{t(language, "gameOver")}</Text>
        <Text style={styles.subtitle}>
          {t(language, "wellPlayed")},{" "}
          <Text style={styles.playerName}>{playerName}</Text>!
        </Text>

        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>{t(language, "finalScore")}</Text>
          <Text style={styles.scoreValue} numberOfLines={1} adjustsFontSizeToFit>
            {score}pts / {maxScore}pts
          </Text>
        </View>

        <View style={styles.rankBox}>
          <Text style={styles.rankLabel}>{t(language, "yourRank")}</Text>
          <Text style={styles.rankTitle}>{rank.title}</Text>
          <Text style={styles.rankDescription}>{rank.description}</Text>
        </View>

        {mode === "mega" ? (
          <Text style={styles.meta}>
            <Text style={styles.metaStrong}>{t(language, "megaMix")}</Text>
          </Text>
        ) : (
          <Text style={styles.meta}>
            {t(language, "difficulty")}:{" "}
            <Text style={styles.metaStrong}>{difficultyLabel}</Text> /{" "}
            {t(language, "category")}:{" "}
            <Text style={styles.metaStrong}>{categoryLabel}</Text>
          </Text>
        )}

        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>{t(language, "backToMenu")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default ResultScreen;
