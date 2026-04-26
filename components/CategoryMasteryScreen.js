import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CategoryCard from "./CategoryCard";
import MasteryProgressBar from "./MasteryProgressBar";
import RewardTimeline from "./RewardTimeline";
import {
  getCategorySummary,
  getTopCategories,
  loadMasteryState,
} from "../utils/masteryService";
import { t } from "../utils/i18n";
import { theme } from "../utils/theme";

// Ecranul de mastery arata progresul si recompensele pe categorii.
function CategoryMasteryScreen({ language, onClose }) {
  const [state, setState] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [showCosmetics, setShowCosmetics] = useState(false);

  // Incarca tot progresul de mastery salvat local.
  useEffect(() => {
    let mounted = true;
    async function load() {
      const stored = await loadMasteryState();
      if (mounted) setState(stored);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Construieste sumarul pentru toate categoriile.
  const summaries = useMemo(() => {
    if (!state) return [];
    return Object.keys(state.masteryByCategory)
      .sort((a, b) => Number(a) - Number(b))
      .map((id) =>
        getCategorySummary({
          language,
          categoryId: Number(id),
          categoryState: state.masteryByCategory[id],
          unlockedRewards: state.unlockedRewards,
        })
      );
  }, [state, language]);

  // Construieste detaliile doar pentru categoria deschisa.
  const selectedSummary = useMemo(() => {
    if (!state || !selectedCategoryId) return null;
    return getCategorySummary({
      language,
      categoryId: selectedCategoryId,
      categoryState: state.masteryByCategory[String(selectedCategoryId)],
      unlockedRewards: state.unlockedRewards,
    });
  }, [state, selectedCategoryId, language]);

  if (!state) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>{t(language, "loading")}</Text>
      </View>
    );
  }
 if (selectedSummary) {
    const unlockedCosmetics = selectedSummary.rewards.filter(
      (reward) => reward.unlocked && reward.type !== "perk"
    );
    const nextReward = selectedSummary.rewards.find((r) => !r.unlocked);
    return (
      <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>X</Text>
        </TouchableOpacity>
      </View>

        <Text style={styles.detailsTitle}>{selectedSummary.label}</Text>
        <Text style={styles.detailsLevel}>Lv {selectedSummary.level}</Text>
        <Text style={styles.detailsXp}>
          {selectedSummary.xp}/{selectedSummary.xpRequired} XP
        </Text>
        <MasteryProgressBar
          xp={selectedSummary.xp}
          xpRequired={selectedSummary.xpRequired}
          color={theme.colors.gold}
        />
        <Text style={styles.nextRewardText}>
          {nextReward
            ? ${t(language, "nextReward")} Lv ${nextReward.level}
            : t(language, "maxLevelReached")}
        </Text>

        <Text style={styles.sectionTitle}>{t(language, "rewardsTitle")}</Text>
        <RewardTimeline language={language} rewards={selectedSummary.rewards} />

        {unlockedCosmetics.length > 0 && (
          <TouchableOpacity
            style={styles.cosmeticsBtn}
            onPress={() => setShowCosmetics((prev) => !prev)}
          >
            <Text style={styles.cosmeticsBtnText}>
              {showCosmetics
                ? t(language, "hideCosmetics")
                : t(language, "viewCosmetics")}
            </Text>
          </TouchableOpacity>
        )}
        {showCosmetics && unlockedCosmetics.length > 0 && (
          <View style={styles.cosmeticsList}>
            {unlockedCosmetics.map((reward) => (
              <Text key={reward.id} style={styles.cosmeticItem}>
                {reward.label}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  }

  const topCategories = getTopCategories({ language, state });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>X</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t(language, "masteryTitle")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.topSection}>
        <Text style={styles.sectionTitle}>{t(language, "topCategories")}</Text>
        <View style={styles.topList}>
          {topCategories.map((item) => (
            <View key={item.categoryId} style={styles.topItem}>
              <Text style={styles.topLabel}>{item.label}</Text>
              <Text style={styles.topValue}>Lv {item.level}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {summaries.map((summary) => (
          <CategoryCard
            key={summary.categoryId}
            language={language}
            summary={summary}
            onPress={() => {
              setShowCosmetics(false);
              setSelectedCategoryId(summary.categoryId);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// Stilurile pentru lista si pagina de detalii la mastery.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  loading: {
    color: theme.colors.text,
    textAlign: "center",
    marginTop: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeBtn: {
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
    width: 44,
    alignItems: "center",
  },
  closeBtnText: {
    color: theme.colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "800",
    fontFamily: theme.fonts.title,
  },
  topSection: {
    marginTop: 16,
    marginBottom: 12,
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  topList: {
    gap: 6,
  },
  topItem: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topLabel: {
    color: theme.colors.textMuted,
    fontWeight: "600",
  },
  topValue: {
    color: theme.colors.accent,
    fontWeight: "700",
  },
  list: {
    gap: 12,
    paddingBottom: 40,
  },
  detailsTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "800",
    fontFamily: theme.fonts.title,
    textAlign: "center",
    marginTop: 12,
  },
  detailsLevel: {
    color: theme.colors.accent,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  detailsXp: {
    color: theme.colors.textMuted,
    textAlign: "center",
    marginBottom: 8,
    fontFamily: theme.fonts.mono,
  },
  nextRewardText: {
    color: theme.colors.gold,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
    fontWeight: "600",
  },
  cosmeticsBtn: {
    marginTop: 12,
    backgroundColor: theme.colors.accent,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
  },
  cosmeticsBtnText: {
    color: theme.colors.bgDeep,
    fontWeight: "800",
    textAlign: "center",
  },
  cosmeticsList: {
    marginTop: 10,
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    gap: 6,
  },
  cosmeticItem: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
});

export default CategoryMasteryScreen;
