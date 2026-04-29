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
          
// Stilurile pentru cardul de rezultat.
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  card: {
    width: "90%",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    paddingVertical: 24,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: theme.colors.text,
    fontFamily: theme.fonts.title,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: "center",
    marginBottom: 18,
  },
  playerName: {
    fontWeight: "800",
    color: theme.colors.accent,
  },
  scoreBox: {
    alignItems: "center",
    marginBottom: 20,
  },
  scoreLabel: {
    fontSize: 13,
    color: theme.colors.textFaint,
  },
  scoreValue: {
    fontSize: 26,
    fontWeight: "800",
    color: theme.colors.gold,
    marginTop: 6,
    textAlign: "center",
    width: "100%",
    flexShrink: 1,
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.3,
    fontFamily: theme.fonts.mono,
  },
  rankBox: {
    marginBottom: 18,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  rankLabel: {
    fontSize: 13,
    color: theme.colors.textFaint,
    marginBottom: 4,
  },
  rankTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.accent,
    textAlign: "center",
    marginBottom: 4,
  },
  rankDescription: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
  meta: {
    fontSize: 12,
    color: theme.colors.textFaint,
    textAlign: "center",
    marginBottom: 22,
  },
  metaStrong: {
    color: theme.colors.text,
    fontWeight: "600",
  },
  backButton: {
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
  },
  backButtonText: {
    color: theme.colors.bgDeep,
    fontWeight: "700",
    fontSize: 16,
  },
});

