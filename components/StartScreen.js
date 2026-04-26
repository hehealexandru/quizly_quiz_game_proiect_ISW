import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Alert,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { t } from "../utils/i18n";
import { theme } from "../utils/theme";

// Lista simpla de limbi afisate in setari.
const LANGUAGE_OPTIONS = [
  { id: "en", label: { en: "English", ro: "Engleza" } },
  { id: "ro", label: { en: "Romanian", ro: "Romana" } },
];

// Ecranul de start tine accesul catre joc, realizari si setari.
function StartScreen({
  onOpenGameSelect = () => {},
  language,
  setLanguage,
  onOpenAchievements = () => {},
  onOpenMastery = () => {},
  hasNewAchievements = false,
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const entranceOpacity = useRef(new Animated.Value(0)).current;
  const entranceTranslate = useRef(new Animated.Value(12)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Alege numele corect pentru limba afisata in buton.
  function getLanguageLabel(currentLang, optionLang) {
    const entry = LANGUAGE_OPTIONS.find((opt) => opt.id === optionLang);
    if (!entry) return optionLang.toUpperCase();
    return entry.label[currentLang] || entry.label.en || optionLang.toUpperCase();
  }

  // Incarca setarile salvate local, de exemplu sunetul.
  useEffect(() => {
    async function loadSettings() {
      const storedSound = await AsyncStorage.getItem("soundEnabled");
      if (storedSound !== null) {
        setSoundEnabled(storedSound === "true");
      }
    }

    loadSettings();
  }, []);

  // Porneste animatiile de intrare si puls pentru butoane.
  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(entranceTranslate, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [entranceOpacity, entranceTranslate, pulseAnim]);

  // Salveaza imediat schimbarea pentru sunet.
  async function toggleSound(value) {
    setSoundEnabled(value);
    await AsyncStorage.setItem("soundEnabled", value.toString());
  }

  // Sterge toate high score-urile salvate in telefon.
  function handleResetScores() {
    Alert.alert(
      t(language, "resetScoresTitle"),
      t(language, "resetScoresMsg"),
      [
        { text: t(language, "cancel"), style: "cancel" },
        {
          text: t(language, "delete"),
          style: "destructive",
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const scoreKeys = keys.filter((key) => key.startsWith("highscore_"));
              await AsyncStorage.multiRemove(scoreKeys);
              Alert.alert(
                t(language, "resetScoresSuccessTitle"),
                t(language, "resetScoresSuccessMsg")
              );
            } catch (_error) {
            }
          },
        },
      ]
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: entranceOpacity, transform: [{ translateY: entranceTranslate }] },
      ]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.languageBtn}
          onPress={() => setShowLanguages(true)}
        >
          <Text style={styles.languageBtnText}>🌐</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Quizly</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => setShowSettings(true)}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>{t(language, "subtitle")}</Text>

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity style={styles.startBtn} onPress={onOpenGameSelect}>
          <Text style={styles.startBtnText}>{t(language, "chooseGame")}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={[styles.startBtn, styles.achievementsBtn]}
          onPress={onOpenAchievements}
        >
          <View style={styles.achievementsRow}>
            <Text style={styles.startBtnText}>{t(language, "achievementsTab")}</Text>
            {hasNewAchievements && <View style={styles.badgeDot} />}
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={[styles.startBtn, styles.masteryBtn]}
          onPress={onOpenMastery}
        >
          <Text style={styles.startBtnText}>{t(language, "masteryTab")}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={showSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t(language, "settingsTitle")}</Text>

            <View style={styles.settingRow}>
              <Text style={styles.settingText}>{t(language, "soundEffects")}</Text>
              <Switch
                trackColor={{ false: "#475569", true: theme.colors.accent }}
                thumbColor={soundEnabled ? "#fff" : "#f4f3f4"}
                onValueChange={toggleSound}
                value={soundEnabled}
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleResetScores}>
              <Text style={[styles.menuText, { color: "#ef4444" }]}>
                {t(language, "resetScores")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.closeBtnText}>{t(language, "close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showLanguages}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguages(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t(language, "languageLabel")}</Text>

            <View style={styles.categoryList}>
              {LANGUAGE_OPTIONS.map((lang) => (
                <TouchableOpacity
                  key={lang.id}
                  style={[
                    styles.categoryOption,
                    language === lang.id && styles.categoryOptionSelected,
                  ]}
                  onPress={() => {
                    setLanguage(lang.id);
                    setShowLanguages(false);
                  }}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      language === lang.id && styles.categoryOptionTextSelected,
                    ]}
                  >
                    {getLanguageLabel(language, lang.id)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowLanguages(false)}
            >
              <Text style={styles.closeBtnText}>{t(language, "close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

export default StartScreen;

// Stilurile pentru ecranul de start si modale.
const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: theme.colors.surface,
    padding: 24,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  languageBtn: {
    padding: 8,
    minWidth: 40,
    alignItems: "center",
    backgroundColor: theme.colors.surfaceStrong,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
  languageBtnText: {
    fontSize: 20,
    color: theme.colors.text,
  },
  settingsBtn: {
    padding: 8,
    backgroundColor: theme.colors.surfaceStrong,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
  settingsIcon: {
    fontSize: 20,
    color: theme.colors.text,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: theme.colors.text,
    fontFamily: theme.fonts.title,
    letterSpacing: 0.6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: "center",
    marginBottom: 32,
  },
  categoryList: {
    width: "100%",
    gap: 8,
  },
  categoryOption: {
    backgroundColor: theme.colors.bgDeep,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  categoryOptionSelected: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent,
  },
  categoryOptionText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  categoryOptionTextSelected: {
    color: theme.colors.text,
  },
  startBtn: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 16,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
  achievementsBtn: {
    backgroundColor: theme.colors.gold,
  },
  achievementsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  masteryBtn: {
    backgroundColor: theme.colors.success,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.gold,
  },
  startBtnText: {
    color: theme.colors.bgDeep,
    fontSize: 18,
    fontWeight: "800",
    fontFamily: theme.fonts.body,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(7,11,20,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.colors.text,
    fontFamily: theme.fonts.title,
    textAlign: "center",
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  settingText: {
    color: theme.colors.text,
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderSoft,
    marginVertical: 12,
  },
  menuItem: {
    paddingVertical: 10,
  },
  menuText: {
    color: theme.colors.accent,
    fontSize: 16,
    textAlign: "center",
  },
  closeBtn: {
    marginTop: 20,
    backgroundColor: theme.colors.surfaceStrong,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
  closeBtnText: {
    color: theme.colors.text,
    textAlign: "center",
    fontWeight: "bold",
  },
});
