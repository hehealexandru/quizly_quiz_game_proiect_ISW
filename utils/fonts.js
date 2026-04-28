import * as Font from "expo-font";

// Incarca fonturile folosite in toata aplicatia.
export async function loadAppFonts() {
  return Font.loadAsync({
    "SpaceGrotesk-Bold": require("../assets/fonts/SpaceGrotesk-Bold.ttf"),
    "Sora-Regular": require("../assets/fonts/Sora-Regular.ttf"),
    "Sora-SemiBold": require("../assets/fonts/Sora-SemiBold.ttf"),
  });
}
