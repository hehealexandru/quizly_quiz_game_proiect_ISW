import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getAchievementsView,
  hasNewUnlocks,
  loadAchievementsData,
  markAchievementsViewed,
} from "../utils/achievements";
import { t } from "../utils/i18n";
import { theme } from "../utils/theme";

// Filtrele ramase in UI pentru lista de realizari.
const FILTERS = ["all", "completed", "in_progress"];

// Uniformizeaza statusurile afisate in ecran.
function getDisplayStatus(status) {
  return status === "unlocked" ? "completed" : "in_progress";
}

// Ecranul de realizari grupeaza progresul pe global si pe categorii.
function AchievementsScreen({ language, onClose, onViewed }) {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("all");
  const [expandedCategories, setExpandedCategories] = useState({});
  const [globalExpanded, setGlobalExpanded] = useState(false);

  // Incarca datele brute salvate pentru realizari.
  useEffect(() => {
    let mounted = true;
    async function load() {
      const stored = await loadAchievementsData();
      if (mounted) setData(stored);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Construieste varianta pregatita pentru afisare.
  const view = useMemo(() => {
    if (!data) return null;
    return getAchievementsView({ language, data });
  }, [data, language]);

  // Filtreaza lista unei categorii dupa tab-ul selectat.
  const filteredCategory = (category) => {
    const list = category.achievements || [];
    if (filter === "all") return list;
    return list.filter((a) => getDisplayStatus(a.status) === filter);
  };

  // Filtreaza separat zona de realizari globale.
  const filteredGlobal = useMemo(() => {
    if (!view) return [];
    if (filter === "all") return view.globalAchievements;
    return view.globalAchievements.filter(
      (a) => getDisplayStatus(a.status) === filter
    );
  }, [view, filter]);
  const globalAchievements = view?.globalAchievements || [];
  const completedGlobal = globalAchievements.filter(
    (a) => getDisplayStatus(a.status) === "completed"
  ).length;

  // Marcheaza realizarile noi ca vazute dupa ce intri pe ecran.
  useEffect(() => {
    if (!data) return;
    if (!hasNewUnlocks(data)) return;
    markAchievementsViewed().then((updated) => {
      setData(updated);
      onViewed && onViewed();
    });
  }, [data, onViewed]);

  // Pune cele mai relevante realizari primele in lista.
  function sortAchievements(list) {
    return [...list].sort((a, b) => {
      const statusOrder = { in_progress: 0, completed: 1 };
      const statusDiff =
        statusOrder[getDisplayStatus(a.status)] -
        statusOrder[getDisplayStatus(b.status)];
      if (statusDiff !== 0) return statusDiff;
      const remainingA = a.threshold - a.progress;
      const remainingB = b.threshold - b.progress;
      return remainingA - remainingB;
    });
  }

  // Deschide sau inchide o categorie din lista.
  function toggleCategory(categoryId) {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev?.[categoryId],
    }));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
          <Text style={styles.backBtnText}>X</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t(language, "achievementsTitle")}</Text>
          <Text style={styles.subtitle}>{t(language, "achievementsSubtitle")}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const labelKey =
            f === "all"
              ? "filterAll"
              : f === "completed"
                ? "filterCompleted"
                : "filterInProgress";
          const selected = filter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, selected && styles.filterBtnSelected]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterText,
                  selected && styles.filterTextSelected,
                ]}
              >
                {t(language, labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.categoryHeader}
            onPress={() => setGlobalExpanded((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Text style={styles.sectionTitle}>{t(language, "globalAchievements")}</Text>
            <Chevron expanded={globalExpanded} />
          </TouchableOpacity>
          <ProgressBar
            progress={completedGlobal}
            threshold={globalAchievements.length}
            color={theme.colors.accent}
          />
          {globalExpanded &&
            sortAchievements(filteredGlobal).map((a) => (
              <AchievementRow key={a.id} achievement={a} language={language} />
            ))}
          {globalExpanded && filteredGlobal.length === 0 && (
            <Text style={styles.emptyText}>{t(language, "emptyFilter")}</Text>
          )}
        </View>

        {view?.categories.map((category) => {
          const list = sortAchievements(filteredCategory(category));
          const isExpanded = !!expandedCategories?.[category.id];
          const totalAchievements = category.achievements?.length || 0;
          const completedAchievements = (category.achievements || []).filter(
            (a) => getDisplayStatus(a.status) === "completed"
          ).length;
          return (
            <View key={category.id} style={styles.section}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(category.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.sectionTitle}>{category.label}</Text>
                <Chevron expanded={isExpanded} />
              </TouchableOpacity>
              <ProgressBar
                progress={completedAchievements}
                threshold={totalAchievements}
                color={theme.colors.accent}
              />
              {isExpanded &&
                list.map((a) => (
                  <AchievementRow key={a.id} achievement={a} language={language} />
                ))}
              {isExpanded && list.length === 0 && (
                <Text style={styles.emptyText}>{t(language, "emptyFilter")}</Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// Bara mica ce arata cat este completat dintr-o sectiune.
function ProgressBar({ progress, threshold, color }) {
  const ratio = threshold > 0 ? Math.min(progress / threshold, 1) : 0;
  return (
    <View style={styles.progressBar}>
      <View
        style={[
          styles.progressFill,
          { width: `${ratio * 100}%`, backgroundColor: color || theme.colors.accent },
        ]}
      />
    </View>
  );
}

// Chevron-ul se roteste cand sectiunea este deschisa.
function Chevron({ expanded }) {
  return <View style={[styles.chevron, expanded && styles.chevronExpanded]} />;
}

// Randul unei realizari arata titlul, progresul si statusul curent.
function AchievementRow({ achievement, language }) {
  const displayStatus = getDisplayStatus(achievement.status);
  const completed = displayStatus === "completed";
  const ratio =
    achievement.threshold > 0
      ? Math.min(achievement.progress / achievement.threshold, 1)
      : 0;
  return (
    <View style={styles.achievementRow}>
      <View style={styles.achievementHeader}>
        <Text style={styles.achievementTitle}>{achievement.title}</Text>
        <Text style={styles.achievementStatus}>
          {achievement.progress}/{achievement.threshold} -{" "}
          {completed
            ? t(language, "statusCompleted")
            : t(language, "statusInProgress")}
        </Text>
      </View>
      <Text style={styles.achievementDesc}>{achievement.description}</Text>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${ratio * 100}%`,
              backgroundColor: completed ? theme.colors.gold : theme.colors.accent,
            },
          ]}
        />
      </View>
    </View>
  );
}

export default AchievementsScreen;

// Stilurile pentru ecranul de realizari.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerText: {
    alignItems: "center",
    flex: 1,
  },
  backBtn: {
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
    width: 44,
    alignItems: "center",
  },
  backBtnText: {
    color: theme.colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  title: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: "800",
    fontFamily: theme.fonts.title,
    textAlign: "center",
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
    justifyContent: "center",
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.surfaceStrong,
  },
  filterBtnSelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  filterText: {
    color: theme.colors.textMuted,
    fontWeight: "700",
    fontSize: 12,
  },
  filterTextSelected: {
    color: theme.colors.bgDeep,
  },
  scrollContent: {
    paddingBottom: 24,
    gap: 16,
  },
  section: {
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chevron: {
    width: 10,
    height: 10,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: theme.colors.textMuted,
    transform: [{ rotate: "45deg" }],
    marginTop: 2,
  },
  chevronExpanded: {
    transform: [{ rotate: "-135deg" }],
    marginTop: 0,
  },
  progressBar: {
    height: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.bgDeep,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  achievementRow: {
    backgroundColor: theme.colors.surfaceStrong,
    borderRadius: theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    gap: 6,
  },
  achievementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  achievementTitle: {
    color: theme.colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  achievementStatus: {
    color: theme.colors.textFaint,
    fontSize: 11,
    fontWeight: "600",
  },
  achievementDesc: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  lockedText: {
    color: theme.colors.textFaint,
  },
  emptyText: {
    color: theme.colors.textFaint,
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
});
