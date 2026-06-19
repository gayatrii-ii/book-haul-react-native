import { View, Text, TouchableOpacity } from "react-native";
import { useAuthStore } from "../store/authStore";
import { Image } from "expo-image";
import createStyles from "../assets/styles/profile.styles";
import { formatMemberSince } from "../lib/utils";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "../store/themeStore";

export default function ProfileHeader({ onEditAvatar, onEditBio }) {
  const { user } = useAuthStore();
  const { colors, fontSizeMode } = useThemeStore();
  const styles = createStyles(colors);

  if (!user) return null;

  const getFontSize = (baseSize) => {
    switch (fontSizeMode) {
      case "small": return baseSize - 2;
      case "large": return baseSize + 2;
      case "extra-large": return baseSize + 4;
      default: return baseSize;
    }
  };

  return (
    <View style={[styles.profileHeader, { flexDirection: "column", alignItems: "stretch" }]}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={onEditAvatar} activeOpacity={0.7} style={{ position: "relative" }}>
          <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
          <View style={{
            position: "absolute",
            right: 12,
            bottom: 0,
            backgroundColor: colors.accent,
            width: 26,
            height: 26,
            borderRadius: 13,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: colors.white,
          }}>
            <Ionicons name="camera" size={12} color={colors.white} />
          </View>
        </TouchableOpacity>

        <View style={styles.profileInfo}>
          <Text style={[styles.username, { fontSize: getFontSize(20) }]}>{user.username}</Text>
          <Text style={[styles.email, { fontSize: getFontSize(14) }]}>{user.email}</Text>
          <Text style={[styles.memberSince, { fontSize: getFontSize(12) }]}>🗓️ Joined {formatMemberSince(user.createdAt)}</Text>
        </View>
      </View>

      {/* Bio section */}
      <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: getFontSize(13), fontWeight: "600", color: colors.textPrimary }}>Bio</Text>
          <TouchableOpacity onPress={onEditBio} style={{ flexDirection: "row", alignItems: "center", padding: 2 }}>
            <Ionicons name="create-outline" size={14} color={colors.primary} />
            <Text style={{ fontSize: getFontSize(12), color: colors.primary, marginLeft: 2 }}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: getFontSize(13), color: colors.textDark, marginTop: 4, fontStyle: user.bio ? "normal" : "italic", lineHeight: 18 }}>
          {user.bio || "No bio added yet. Tap Edit to add your bio!"}
        </Text>
      </View>
    </View>
  );
}
