import { StyleSheet, Text, View } from "react-native";
import { t } from "../utils/i18n";
import { theme } from "../utils/theme";

// Lista recompenselor arata ce este luat si ce urmeaza.
function RewardTimeline({ language, rewards }) {
  const nextReward = rewards.find((r) => !r.unlocked);
  return (
    <View style={styles.container}>
      {rewards.map((reward) => {
        const isNext = nextReward && reward.id === nextReward.id;
        return (
          <View key={reward.id} style={[styles.row, isNext && styles.rowNext]}>
            <View
              style={[
                styles.dot,
                reward.unlocked ? styles.dotUnlocked : styles.dotLocked,
              ]}
            />
            <View style={styles.info}>
              <Text style={styles.levelText}>Lv {reward.level}</Text>
              <Text style={[styles.label, !reward.unlocked && styles.lockedText]}>
                {reward.label}
              </Text>
              <Text style={styles.statusText}>
                {reward.unlocked
                  ? t(language, "statusUnlocked")
                  : isNext
                    ? t(language, "nextReward")
                    : t(language, "statusLocked")}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// Stilurile timeline-ului de recompense.
const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
  rowNext: {
    borderColor: theme.colors.gold,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 12,
  },
  dotUnlocked: {
    backgroundColor: theme.colors.success,
  },
  dotLocked: {
    backgroundColor: theme.colors.textFaint,
  },
  info: {
    flex: 1,
  },
  levelText: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "700",
  },
  label: {
    color: theme.colors.text,
    fontWeight: "600",
    marginTop: 2,
  },
  lockedText: {
    color: theme.colors.textFaint,
  },
  statusText: {
    color: theme.colors.textFaint,
    fontSize: 11,
    marginTop: 4,
  },
});

export default RewardTimeline;
