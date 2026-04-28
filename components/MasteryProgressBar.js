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

// Stilurile barei de progres.
const styles = StyleSheet.create({
  bar: {
    height: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.bgDeep,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: theme.radius.pill,
  },
});

export default MasteryProgressBar;
