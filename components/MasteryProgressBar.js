import { StyleSheet, View } from "react-native";
import { theme } from "../utils/theme";

// Bara simpla folosita pentru XP si progres.
function MasteryProgressBar({ xp, xpRequired, color = theme.colors.accent }) {
  const ratio = xpRequired > 0 ? Math.min(xp / xpRequired, 1) : 0;
  return (
    <View style={styles.bar}>
      <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: color }]} />
    </View>
  );
}
