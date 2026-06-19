import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { API_URL } from "../constants/api";
import BubbleBackground from "../components/BubbleBackground";
import Loader from "../components/Loader";
import { formatMemberSince } from "../lib/utils";

const { width } = Dimensions.get("window");

export default function PublicProfile() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const { token, user: currentUser } = useAuthStore();
  const { colors, fontSizeMode } = useThemeStore();
  const styles = createStyles(colors);

  const [targetUser, setTargetUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [hauls, setHauls] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Tab State: "Recommendations" vs "Curations" (Reading Lists)
  const [activeTab, setActiveTab] = useState("Recommendations");

  // Expanded Curations state (keeps track of which haul IDs are expanded)
  const [expandedHauls, setExpandedHauls] = useState({});

  // Adding book to library state (for loading spinner on "Add to TBR" press)
  const [addingBookId, setAddingBookId] = useState(null);

  const fetchPublicProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/auth/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTargetUser(data.user);
        setBooks(data.books || []);
        setHauls(data.hauls || []);
        setCompletedCount(data.completedCount || 0);
      } else {
        console.error("Public profile API error:", data.message);
      }
    } catch (error) {
      console.error("Error fetching public profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      if (userId === currentUser?.id) {
        router.replace("/profile");
        return;
      }
      fetchPublicProfile();
    }
  }, [userId]);

  const toggleHaulExpand = (haulId) => {
    setExpandedHauls(prev => ({
      ...prev,
      [haulId]: !prev[haulId]
    }));
  };

  const handleAddBookToTBR = async (book) => {
    try {
      setAddingBookId(book._id);
      const response = await fetch(`${API_URL}/library`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookId: book._id, status: "To-Read" }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success! 📚", `"${book.title}" has been added to your Library TBR list.`);
      } else {
        Alert.alert("Already Added", data.message || "This book is already in your library.");
      }
    } catch (error) {
      console.error("Add book from curation error:", error);
      Alert.alert("Error", "Failed to add book to library.");
    } finally {
      setAddingBookId(null);
    }
  };

  const renderRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={13}
          color={i <= rating ? colors.accent : colors.textSecondary}
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  // Font Scaling helper
  const getFontSize = (baseSize) => {
    switch (fontSizeMode) {
      case "small": return baseSize - 2;
      case "large": return baseSize + 2;
      case "extra-large": return baseSize + 4;
      default: return baseSize;
    }
  };

  // Recommendation Card Renderer
  const renderRecommendationItem = ({ item, index }) => {
    const cardColors = ["#FFB74D", "#64B5F6", "#F06292", "#81C784"];
    const cardBg = cardColors[index % cardColors.length];
    return (
      <View style={[styles.recommendationCard, { borderLeftWidth: 5, borderLeftColor: cardBg, backgroundColor: colors.cardBackground }]}>
        <Image source={item.image} style={styles.bookCover} contentFit="cover" />
        <View style={styles.bookInfo}>
          <Text style={[styles.bookTitle, { fontSize: getFontSize(15) }]}>{item.title}</Text>
          <View style={styles.ratingContainer}>{renderRatingStars(item.rating)}</View>
          <Text style={[styles.bookCaption, { fontSize: getFontSize(13) }]} numberOfLines={3}>
            {item.caption}
          </Text>
          <Text style={styles.bookDate}>Reviewed on {new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
    );
  };

  // Curated Reading List (Haul) Renderer
  const renderHaulItem = ({ item, index }) => {
    const isExpanded = !!expandedHauls[item._id];
    const cardColors = ["#FFB74D", "#64B5F6", "#F06292", "#81C784"];
    const cardBg = cardColors[index % cardColors.length];
    return (
      <View style={[styles.haulCard, { borderLeftWidth: 5, borderLeftColor: cardBg, backgroundColor: colors.cardBackground }]}>
        <TouchableOpacity style={styles.haulHeader} onPress={() => toggleHaulExpand(item._id)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.haulName}>{item.name}</Text>
            <Text style={styles.haulMeta}>
              {item.books?.length || 0} books • Spent ${item.totalCost?.toFixed(2)}
            </Text>
          </View>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.haulBooksList}>
            {item.books && item.books.length > 0 ? (
              item.books.map((b) => (
                <View key={b._id} style={styles.haulBookRow}>
                  <Image source={b.image} style={styles.haulBookCover} contentFit="cover" />
                  <View style={styles.haulBookDetails}>
                    <Text style={styles.haulBookTitle}>{b.title}</Text>
                    <Text style={styles.haulBookAuthor}>by {b.author}</Text>
                    <Text style={styles.haulBookPages}>{b.pages || 100} pages</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addTbrBtn}
                    onPress={() => handleAddBookToTBR(b)}
                    disabled={addingBookId === b._id}
                  >
                    {addingBookId === b._id ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <Ionicons name="add" size={14} color={colors.white} />
                        <Text style={styles.addTbrText}>TBR</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.noBooksText}>No books in this list.</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) return <Loader />;
  if (!targetUser) {
    return (
      <View style={styles.errorContainer}>
        <BubbleBackground />
        <Ionicons name="alert-circle-outline" size={60} color={colors.textSecondary} />
        <Text style={styles.errorText}>User profile not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const challengeGoal = targetUser.readingGoal || 24;
  const progressPercent = Math.min(100, Math.round((completedCount / challengeGoal) * 100));

  return (
    <View style={styles.container}>
      <BubbleBackground />
      
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backIconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{targetUser.username}'s Profile</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={activeTab === "Recommendations" ? books : hauls}
        keyExtractor={(item) => item._id}
        renderItem={activeTab === "Recommendations" ? renderRecommendationItem : renderHaulItem}
        contentContainerStyle={styles.scrollList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ marginBottom: 12 }}>
            {/* fixed top section profile metadata */}
            <View style={styles.profileHeaderCard}>
              <View style={styles.userRow}>
                <Image source={{ uri: targetUser.profileImage }} style={styles.avatar} />
                <View style={styles.userDetails}>
                  <Text style={[styles.username, { fontSize: getFontSize(18) }]}>{targetUser.username}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{targetUser.membershipTier || "Premium Member"}</Text>
                  </View>
                  <Text style={styles.joinedText}>Member since {formatMemberSince(targetUser.createdAt)}</Text>
                </View>
              </View>

              {/* Bio section */}
              {targetUser.bio ? (
                <View style={styles.bioContainer}>
                  <Text style={[styles.bioText, { fontSize: getFontSize(13) }]}>{targetUser.bio}</Text>
                </View>
              ) : null}

              {/* Stats Row */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={[styles.statVal, { fontSize: getFontSize(16) }]}>{books.length}</Text>
                  <Text style={styles.statLabel}>Works</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statVal, { fontSize: getFontSize(16) }]}>{hauls.length}</Text>
                  <Text style={styles.statLabel}>Reading Lists</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statVal, { fontSize: getFontSize(16) }]}>{progressPercent}%</Text>
                  <Text style={styles.statLabel}>Goal ({completedCount}/{challengeGoal})</Text>
                </View>
              </View>
            </View>

            {/* Segmented Wattpad-style Tab bar */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === "Recommendations" && styles.tabButtonActive]}
                onPress={() => setActiveTab("Recommendations")}
              >
                <Text style={[styles.tabButtonText, activeTab === "Recommendations" && styles.tabButtonTextActive]}>
                  Recommendations ({books.length})
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tabButton, activeTab === "Curations" && styles.tabButtonActive]}
                onPress={() => setActiveTab("Curations")}
              >
                <Text style={[styles.tabButtonText, activeTab === "Curations" && styles.tabButtonTextActive]}>
                  Reading Lists ({hauls.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name={activeTab === "Recommendations" ? "book-outline" : "list-outline"}
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              {activeTab === "Recommendations"
                ? `${targetUser.username} hasn't recommended any books yet.`
                : `${targetUser.username} hasn't created any curated reading lists yet.`}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backIconBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "JetBrainsMono-Medium",
    color: colors.textPrimary,
  },
  scrollList: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileHeaderCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.primary + "15",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  badgeText: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: "700",
  },
  joinedText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 6,
  },
  bioContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  bioText: {
    fontSize: 13,
    color: colors.textDark,
    lineHeight: 18,
    fontStyle: "italic",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statVal: {
    fontSize: 16,
    fontWeight: "750",
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabButtonActive: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: "755",
  },
  recommendationCard: {
    flexDirection: "row",
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  bookCover: {
    width: 65,
    height: 95,
    borderRadius: 8,
  },
  bookInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  ratingContainer: {
    flexDirection: "row",
    marginVertical: 3,
  },
  bookCaption: {
    fontSize: 13,
    color: colors.textDark,
    lineHeight: 17,
  },
  bookDate: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
  },
  haulCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  haulHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  haulName: {
    fontSize: 15,
    fontWeight: "650",
    color: colors.textPrimary,
  },
  haulMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },
  haulBooksList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.inputBackground,
    padding: 12,
  },
  haulBookRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 8,
  },
  haulBookCover: {
    width: 44,
    height: 64,
    borderRadius: 6,
  },
  haulBookDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  haulBookTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textDark,
  },
  haulBookAuthor: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  haulBookPages: {
    fontSize: 10,
    color: colors.placeholderText,
    marginTop: 2,
  },
  addTbrBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  addTbrText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 2,
  },
  noBooksText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: 10,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 18,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  backBtnText: {
    color: colors.white,
    fontWeight: "600",
  },
});
