import { useEffect, useState, useRef } from "react";
import {
  View,
  Alert,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  PanResponder
} from "react-native";
import { useRouter } from "expo-router";
import { API_URL } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createStyles from "../../assets/styles/profile.styles";
import ProfileHeader from "../../components/ProfileHeader";
import LogoutButton from "../../components/LogoutButton";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import Loader from "../../components/Loader";
import SafeScreen from "../../components/SafeScreen";
import BubbleBackground from "../../components/BubbleBackground";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Profile() {
  const router = useRouter();
  const { token, user: authUser } = useAuthStore();
  const { colors, fontSizeMode } = useThemeStore();
  const styles = createStyles(colors);

  const getFontSize = (baseSize) => {
    switch (fontSizeMode) {
      case "small": return baseSize - 2;
      case "large": return baseSize + 2;
      case "extra-large": return baseSize + 4;
      default: return baseSize;
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        return isHorizontal && gestureState.dx > 15;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 100 || gestureState.vx > 0.4) {
          router.push("/create");
        }
      },
    })
  ).current;

  const [books, setBooks] = useState([]);
  const [circles, setCircles] = useState([]);
  const [catalogBooks, setCatalogBooks] = useState([]);
  const [readingGoal, setReadingGoal] = useState(24);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Goal Editing state
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("24");
  const [savingGoal, setSavingGoal] = useState(false);

  // Bio Editing state
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [savingBio, setSavingBio] = useState(false);

  // Avatar Selection state
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);

  // Create Circle from Profile state
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newCircleName, setNewCircleName] = useState("");
  const [newCircleDesc, setNewCircleDesc] = useState("");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [milestonePage, setMilestonePage] = useState("");
  const [creatingCircle, setCreatingCircle] = useState(false);

  const [deleteBookId, setDeleteBookId] = useState(null);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  const fetchProfileAndData = async () => {
    try {
      setIsLoading(true);

      // 1. Fetch User Profile for latest Goal and avatar
      const meRes = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meData = await meRes.json();
      if (meRes.ok) {
        setReadingGoal(meData.readingGoal || 24);
        setGoalInput((meData.readingGoal || 24).toString());

        // Sync with local storage and authStore to replace old cached avatar
        const updatedUser = { ...authUser, ...meData, id: meData._id };
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        useAuthStore.setState({ user: updatedUser });
      }

      // 2. Fetch User Recommendations
      const booksRes = await fetch(`${API_URL}/books/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const booksData = await booksRes.json();
      if (booksRes.ok) {
        setBooks(booksData);
      }

      // 3. Fetch Circles and filter for user joined/created ones
      const circlesRes = await fetch(`${API_URL}/circles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const circlesData = await circlesRes.json();
      if (circlesRes.ok) {
        const userCircles = circlesData.filter(c => 
          c.createdBy === authUser?.id || c.createdBy?._id === authUser?.id ||
          c.members?.some(m => m === authUser?.id || m._id === authUser?.id)
        );
        setCircles(userCircles);
      }

      // 4. Fetch Catalog Books for selector
      const catRes = await fetch(`${API_URL}/library/catalog`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const catData = await catRes.json();
      if (catRes.ok) {
        setCatalogBooks(catData);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      Alert.alert("Error", "Failed to load profile details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProfileAndData();
    setRefreshing(false);
  };

  // Save Year Challenge Goal to Backend
  const handleSaveGoal = async () => {
    const val = parseInt(goalInput);
    if (isNaN(val) || val <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid yearly goal.");
      return;
    }

    try {
      setSavingGoal(true);
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ readingGoal: val }),
      });

      const data = await res.json();
      if (res.ok) {
        setReadingGoal(data.readingGoal);
        setIsEditingGoal(false);
        
        // Sync with local storage and authStore
        const updatedUser = { ...authUser, readingGoal: data.readingGoal };
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        useAuthStore.setState({ user: updatedUser });

        Alert.alert("Goal Updated! 🎯", `Your yearly goal is now set to ${data.readingGoal} books.`);
      } else {
        Alert.alert("Error", data.message || "Failed to update reading goal");
      }
    } catch (error) {
      console.error("Goal save error:", error);
    } finally {
      setSavingGoal(false);
    }
  };

  const handleSaveBio = async () => {
    try {
      setSavingBio(true);
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bio: bioInput }),
      });

      const data = await res.json();
      if (res.ok) {
        // Sync local storage and authStore
        const updatedUser = { ...authUser, bio: data.bio };
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        useAuthStore.setState({ user: updatedUser });

        setIsEditingBio(false);
        Alert.alert("Bio Updated! ✨", "Your profile bio has been updated successfully.");
      } else {
        Alert.alert("Error", data.message || "Failed to update bio");
      }
    } catch (error) {
      console.error("Bio save error:", error);
      Alert.alert("Error", "Server error while saving bio.");
    } finally {
      setSavingBio(false);
    }
  };

  // Update profile avatar image
  const handleUpdateAvatar = async (imageUrl) => {
    try {
      setIsAvatarModalVisible(false);
      // Update local storage and Zustand store optimistically
      const updatedUser = { ...authUser, profileImage: imageUrl };
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      useAuthStore.setState({ user: updatedUser });

      // Save to database
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profileImage: imageUrl }),
      });

      const data = await res.json();
      if (res.ok) {
        const finalUser = { ...authUser, ...data, id: data.id || data._id };
        await AsyncStorage.setItem("user", JSON.stringify(finalUser));
        useAuthStore.setState({ user: finalUser });
      } else {
        Alert.alert("Error", data.message || "Failed to update profile picture");
      }
    } catch (error) {
      console.error("Avatar update error:", error);
    }
  };

  const pickImage = async (mode) => {
    try {
      let permissionResult;
      if (mode === "camera") {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (!permissionResult.granted) {
        Alert.alert("Permission Required", `Permission to access the ${mode === "camera" ? "camera" : "photo gallery"} is required.`);
        return;
      }

      let pickerResult;
      const options = {
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      };

      if (mode === "camera") {
        pickerResult = await ImagePicker.launchCameraAsync(options);
      } else {
        pickerResult = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        const localUri = pickerResult.assets[0].uri;
        setIsAvatarModalVisible(false);
        setUpdatingAvatar(true);

        // Convert file URI to base64
        const base64 = await FileSystem.readAsStringAsync(localUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const base64Data = `data:image/jpeg;base64,${base64}`;

        // Call handleUpdateAvatar with base64Data
        await handleUpdateAvatar(base64Data);
      }
    } catch (err) {
      console.error("Image pick error:", err);
      Alert.alert("Error", "An error occurred while picking the image.");
    } finally {
      setUpdatingAvatar(false);
    }
  };

  // Launch circle from profile page
  const handleCreateCircle = async () => {
    if (!newCircleName) {
      Alert.alert("Error", "Please enter a circle name.");
      return;
    }

    try {
      setCreatingCircle(true);
      const res = await fetch(`${API_URL}/circles`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCircleName,
          description: newCircleDesc,
          currentBookId: selectedBookId || undefined,
          milestonePage: milestonePage ? parseInt(milestonePage) : 0,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCircles(prev => [data, ...prev]);
        setIsCreateModalVisible(false);
        setNewCircleName("");
        setNewCircleDesc("");
        setSelectedBookId("");
        setMilestonePage("");
        Alert.alert("Circle Launched! 💬", `Circle "${data.name}" is now live!`);
      } else {
        Alert.alert("Error", data.message || "Failed to create circle");
      }
    } catch (error) {
      console.error("Create circle error:", error);
    } finally {
      setCreatingCircle(false);
    }
  };

  const handleDeleteBook = async (bookId) => {
    try {
      setDeleteBookId(bookId);
      const response = await fetch(`${API_URL}/books/${bookId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete book");

      setBooks(books.filter((book) => book._id !== bookId));
      Alert.alert("Success", "Recommendation deleted successfully");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to delete recommendation");
    } finally {
      setDeleteBookId(null);
    }
  };

  const confirmDelete = (bookId) => {
    Alert.alert("Delete Recommendation", "Are you sure you want to delete this recommendation?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => handleDeleteBook(bookId) },
    ]);
  };

  const renderBookItem = ({ item, index }) => {
    const cardColors = ["#FFB74D", "#64B5F6", "#F06292", "#81C784"];
    const cardBg = cardColors[index % cardColors.length];
    return (
      <View style={[styles.bookItem, { borderLeftWidth: 5, borderLeftColor: cardBg, backgroundColor: colors.cardBackground }]}>
        <Image source={item.image} style={styles.bookImage} />
        <View style={styles.bookInfo}>
          <Text style={[styles.bookTitle, { fontSize: getFontSize(16) }]}>{item.title}</Text>
          <View style={styles.ratingContainer}>{renderRatingStars(item.rating)}</View>
          <Text style={[styles.bookCaption, { fontSize: getFontSize(14) }]} numberOfLines={2}>
            {item.caption}
          </Text>
          <Text style={styles.bookDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(item._id)}>
          {deleteBookId === item._id ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="trash-outline" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={14}
          color={i <= rating ? colors.accent : colors.textSecondary}
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  if (isLoading && !refreshing) return <Loader />;

  return (
    <SafeScreen>
      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        <BubbleBackground />
        <View style={[styles.container, { backgroundColor: "transparent" }]}>
        
        <FlatList
          data={books}
          renderItem={renderBookItem}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.booksList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />
          }
          ListHeaderComponent={
            <View style={{ marginBottom: 16 }}>
              {/* Header components */}
              <ProfileHeader 
                onEditAvatar={() => setIsAvatarModalVisible(true)} 
                onEditBio={() => {
                  setBioInput(authUser?.bio || "");
                  setIsEditingBio(true);
                }}
              />

              {/* YEARLY READING CHALLENGE GOAL EDITOR */}
              <View style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Ionicons name="trophy-outline" size={20} color={colors.primary} />
                  <Text style={[styles.goalTitle, { fontSize: getFontSize(13) }]}>Yearly Challenge Goal</Text>
                </View>

                {isEditingGoal ? (
                  <View style={styles.goalEditorRow}>
                    <TextInput
                      style={styles.goalInput}
                      keyboardType="number-pad"
                      value={goalInput}
                      onChangeText={setGoalInput}
                      autoFocus
                    />
                    <TouchableOpacity style={styles.goalSaveBtn} onPress={handleSaveGoal} disabled={savingGoal}>
                      {savingGoal ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <Text style={styles.goalSaveText}>Save</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.goalCancelBtn} onPress={() => setIsEditingGoal(false)}>
                      <Text style={styles.goalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.goalDisplayRow}>
                    <Text style={[styles.goalDisplayText, { fontSize: getFontSize(14) }]}>
                      Targeting <Text style={[styles.goalHighlight, { fontSize: getFontSize(18) }]}>{readingGoal}</Text> books in 2026
                    </Text>
                    <TouchableOpacity style={styles.goalEditBtn} onPress={() => setIsEditingGoal(true)}>
                      <Ionicons name="create-outline" size={16} color={colors.primary} />
                      <Text style={[styles.goalEditText, { fontSize: getFontSize(12) }]}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* MY READING CIRCLES BOARD */}
              <View style={styles.circlesSection}>
                <View style={styles.circlesHeaderRow}>
                  <Text style={[styles.sectionHeaderTitle, { fontSize: getFontSize(14) }]}>My Discussion Circles 💬</Text>
                  <TouchableOpacity style={styles.launchCircleBtn} onPress={() => setIsCreateModalVisible(true)}>
                    <Ionicons name="add" size={14} color={colors.white} />
                    <Text style={styles.launchCircleText}>Launch</Text>
                  </TouchableOpacity>
                </View>

                {circles.length === 0 ? (
                  <Text style={styles.noCirclesText}>You are not in any discussion circles yet.</Text>
                ) : (
                  circles.map(circle => (
                     <TouchableOpacity
                      key={circle._id}
                      style={styles.circleItemRow}
                      onPress={() => router.push("/circles")}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.circleItemName, { fontSize: getFontSize(13) }]}>{circle.name}</Text>
                        <Text style={[styles.circleItemDesc, { fontSize: getFontSize(11) }]} numberOfLines={1}>{circle.description}</Text>
                      </View>
                      <View style={styles.circleItemBadge}>
                        <Ionicons name="people" size={12} color={colors.textPrimary} />
                        <Text style={styles.circleItemBadgeText}>{circle.members?.length || 0}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>

              {/* Logout button */}
              <LogoutButton />

              {/* Book recommendations titles */}
              <View style={styles.booksHeader}>
                <Text style={[styles.booksTitle, { fontSize: getFontSize(18) }]}>Your Recommendations 📚</Text>
                <Text style={styles.booksCount}>{books.length} books</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={50} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { fontSize: getFontSize(16) }]}>No recommendations yet</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => router.push("/create")}>
                <Text style={styles.addButtonText}>Add Your First Book</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>

      {/* CREATE CIRCLE MODAL FROM PROFILE */}
      <Modal visible={isCreateModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Launch Discussion Circle</Text>
              <TouchableOpacity onPress={() => setIsCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Circle Name</Text>
              <TextInput style={styles.input} placeholder="e.g. Fantasy Enthusiasts" value={newCircleName} onChangeText={setNewCircleName} />

              <Text style={styles.label}>Description</Text>
              <TextInput style={styles.input} placeholder="e.g. Deep discussions on fantasy novels." value={newCircleDesc} onChangeText={setNewCircleDesc} />

              <Text style={styles.label}>Select Current Book</Text>
              <View style={styles.pickerWrapper}>
                <ScrollView style={{ maxHeight: 120 }}>
                  {catalogBooks.map(b => (
                    <TouchableOpacity
                      key={b._id}
                      style={[styles.pickerItem, selectedBookId === b._id && styles.pickerItemActive]}
                      onPress={() => setSelectedBookId(b._id)}
                    >
                      <Text style={[styles.pickerText, selectedBookId === b._id && { fontWeight: "bold" }]}>
                        {b.title} ({b.author})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.label}>Spoiler Milestone Page</Text>
              <TextInput style={styles.input} placeholder="e.g. 150" keyboardType="number-pad" value={milestonePage} onChangeText={setMilestonePage} />

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateCircle} disabled={creatingCircle}>
                {creatingCircle ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.submitBtnText}>Create Circle</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CHOOSE AVATAR MODAL */}
      <Modal visible={isAvatarModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsAvatarModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Profile Picture 📸</Text>
              <TouchableOpacity onPress={() => setIsAvatarModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {updatingAvatar ? (
              <View style={{ paddingVertical: 30, alignItems: "center" }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 12, color: colors.textPrimary, fontWeight: "500" }}>
                  Uploading to Cloud Storage...
                </Text>
              </View>
            ) : (
              <View style={{ paddingVertical: 10, gap: 12 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.primary + "15",
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.primary + "40",
                  }}
                  onPress={() => pickImage("camera")}
                >
                  <Ionicons name="camera-outline" size={24} color={colors.primary} style={{ marginRight: 12 }} />
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: "bold", color: colors.textDark }}>Take Photo</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>Use your camera to snap a new picture</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.accent + "15",
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.accent + "40",
                  }}
                  onPress={() => pickImage("library")}
                >
                  <Ionicons name="image-outline" size={24} color={colors.accent} style={{ marginRight: 12 }} />
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: "bold", color: colors.textDark }}>Choose from Gallery</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>Select a picture from your library</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* EDIT BIO MODAL */}
      <Modal visible={isEditingBio} transparent={true} animationType="slide" onRequestClose={() => setIsEditingBio(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile Bio 📝</Text>
              <TouchableOpacity onPress={() => setIsEditingBio(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Tell others about yourself:</Text>
              <TextInput
                style={[styles.input, { height: 100, textAlignVertical: "top", paddingTop: 10 }]}
                placeholder="e.g. Reader of indie fiction and sci-fi. Sally Rooney enthusiast."
                placeholderTextColor={colors.placeholderText}
                value={bioInput}
                onChangeText={setBioInput}
                multiline
                numberOfLines={4}
                maxLength={200}
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveBio} disabled={savingBio}>
                {savingBio ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.submitBtnText}>Save Bio</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      </View>
    </SafeScreen>
  );
}
