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