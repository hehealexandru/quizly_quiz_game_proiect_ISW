export function getHighScoreKey({ mode, category, difficulty }) {
  if (mode === "mega") return "highscore_mega";
  return `highscore_${category}_${difficulty}`;
}
