import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const themeColors = {
  light: {
    primary: "#802B37", // Elegant deep wine burgundy red
    accent: "#C88B8F", // Sophisticated dusty rose accent
    textPrimary: "#1A1A1A", // crisp graphite/charcoal
    textSecondary: "#6C6C7E", // desaturated slate-grey
    textDark: "#111111", // near black
    placeholderText: "#A5A5B6",
    background: "#FCFAF7", // warm desaturated linen off-white
    cardBackground: "#FFFFFF", // clean solid white
    inputBackground: "#F5F3F0", // desaturated warm cream-grey
    border: "#EAE6DF", // thin warm desaturated grey border
    white: "#ffffff",
    black: "#000000",
  },
  dark: {
    primary: "#E28D92", // Muted warm rose-burgundy for dark mode contrast
    accent: "#F1B8B4", // Pale dusty rose accent
    background: "#141418", // very deep indigo-black
    cardBackground: "#1E1E26", // soft desaturated charcoal card
    inputBackground: "#272733", // slightly lighter desaturated input
    textPrimary: "#ECECEF", // off-white text
    textSecondary: "#9A9AA8", // desaturated grey text
    textDark: "#FFFFFF", // pure white for extreme dark contrast
    placeholderText: "#6E6E80",
    border: "#2E2E3A", // thin dark border lines
    white: "#ffffff",
    black: "#000000",
  }
};

export const useThemeStore = create((set, get) => ({
  theme: "light",
  fontSizeMode: "normal", // 'small', 'normal', 'large', 'extra-large'
  colors: themeColors.light,

  initTheme: async () => {
    try {
      const storedTheme = await AsyncStorage.getItem("themePreference");
      const storedFontSize = await AsyncStorage.getItem("fontSizePreference");
      
      const theme = storedTheme || "light";
      const fontSizeMode = storedFontSize || "normal";
      
      set({ 
        theme, 
        fontSizeMode, 
        colors: themeColors[theme] 
      });
    } catch (err) {
      console.log("Error loading theme settings", err);
    }
  },

  setTheme: async (newTheme) => {
    try {
      await AsyncStorage.setItem("themePreference", newTheme);
      set({ 
        theme: newTheme, 
        colors: themeColors[newTheme] 
      });
    } catch (err) {
      console.log("Error saving theme preference", err);
    }
  },

  setFontSizeMode: async (newMode) => {
    try {
      await AsyncStorage.setItem("fontSizePreference", newMode);
      set({ fontSizeMode: newMode });
    } catch (err) {
      console.log("Error saving font size preference", err);
    }
  },
}));
