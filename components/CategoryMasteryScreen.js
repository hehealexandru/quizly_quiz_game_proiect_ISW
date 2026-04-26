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
