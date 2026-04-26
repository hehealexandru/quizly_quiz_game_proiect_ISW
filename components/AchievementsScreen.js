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
