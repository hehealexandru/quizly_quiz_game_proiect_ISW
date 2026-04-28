import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MasteryProgressBar from "./MasteryProgressBar";
import { t } from "../utils/i18n";
import { theme } from "../utils/theme";

// Cardul rezuma rapid nivelul unei categorii.
function CategoryCard({ language, summary, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{summary.label}</Text>
        <Text style={styles.level}>Lv {summary.level}</Text>
      </View>
      <View style={styles.progressRow}>
        <Text style={styles.xpText}>
          {summary.xp}/{summary.xpRequired} XP
        </Text>
      </View>
      <MasteryProgressBar xp={summary.xp} xpRequired={summary.xpRequired} />
      <Text style={styles.nextReward}>
        {summary.nextRewardLevel
          ? `${t(language, "nextReward")} Lv ${summary.nextRewardLevel}`
          : t(language, "maxLevelReached")}
      </Text>
    </TouchableOpacity>
  );
}


// Stilurile cardului de categorie.
const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: theme.fonts.title,
  },
  level: {
    color: theme.colors.accent,
    fontWeight: "700",
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  xpText: {
    color: theme.colors.textFaint,
    fontSize: 12,
  },
  nextReward: {
    color: theme.colors.gold,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
});

export default CategoryCard;