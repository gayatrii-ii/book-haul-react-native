import { View, ActivityIndicator } from "react-native";
import { useThemeStore } from "../store/themeStore";

export default function Loader({ size = "large" }) {
  const { colors } = useThemeStore();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size={size} color={colors.primary} />
    </View>
  );
}
