import { View, Text, TouchableOpacity } from "react-native";
import { useAuthStore } from "../store/authStore";
import { Image } from "expo-image";
import createStyles from "../assets/styles/profile.styles";
import { formatMemberSince } from "../lib/utils";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "../store/themeStore";

export default function ProfileHeader({ onEditAvatar, onEditBio }) {
  const { user } = useAuthStore();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  if (!user) return null;

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
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.memberSince}>🗓️ Joined {formatMemberSince(user.createdAt)}</Text>
        </View>
      </View>

      {/* Bio section */}
      <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textPrimary }}>Bio</Text>
          <TouchableOpacity onPress={onEditBio} style={{ flexDirection: "row", alignItems: "center", padding: 2 }}>
            <Ionicons name="create-outline" size={14} color={colors.primary} />
            <Text style={{ fontSize: 12, color: colors.primary, marginLeft: 2 }}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 13, color: colors.textDark, marginTop: 4, fontStyle: user.bio ? "normal" : "italic", lineHeight: 18 }}>
          {user.bio || "No bio added yet. Tap Edit to add your bio!"}
        </Text>
      </View>
    </View>
  );
}
