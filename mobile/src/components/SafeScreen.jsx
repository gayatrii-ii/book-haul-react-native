import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeStore } from "../store/themeStore";

export default function SafeScreen({ children }) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      {children}
    </View>
  );
}
