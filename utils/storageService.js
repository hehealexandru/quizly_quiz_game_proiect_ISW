import AsyncStorage from "@react-native-async-storage/async-storage";

// Citeste JSON din storage si intoarce fallback daca lipseste.
export async function loadJSON(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

// Salveaza orice obiect simplu ca JSON.
export async function saveJSON(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}
