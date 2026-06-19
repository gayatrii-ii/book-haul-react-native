import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { API_URL } from "../constants/api";
import BubbleBackground from "../components/BubbleBackground";

const { width: screenWidth } = Dimensions.get("window");

export default function Analytics() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { colors, fontSizeMode } = useThemeStore();
  const styles = createStyles(colors);

  const [libraryBooks, setLibraryBooks] = useState([]);
  const [challengeGoal, setChallengeGoal] = useState(24);
  const [loading, setLoading] = useState(true);

  const fetchLibraryData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/library`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setLibraryBooks(data);
      }

      // Fetch user reading goal from backend
      const meRes = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meData = await meRes.json();
      if (meRes.ok && meData.readingGoal) {
        setChallengeGoal(meData.readingGoal);
      }
    } catch (error) {
      console.error("Fetch analytics data error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraryData();
  }, []);

  // Compute analytics metrics
  const completedBooksCount = libraryBooks.filter(b => b.status === "Completed").length;
  const readingBooksCount = libraryBooks.filter(b => b.status === "Reading").length;
  const tbrBooksCount = libraryBooks.filter(b => b.status === "To-Read").length;
  const totalPagesRead = libraryBooks.reduce((acc, b) => acc + (b.currentPage || 0), 0);

  // Compute genre distributions
  const genreCounts = {};
  let totalValidBooks = 0;
  libraryBooks.forEach(b => {
    if (b.book && b.book.genre) {
      const g = b.book.genre;
      genreCounts[g] = (genreCounts[g] || 0) + 1;
      totalValidBooks++;
    }
  });

  const genrePercentages = Object.keys(genreCounts).map(genre => {
    const count = genreCounts[genre];
    const pct = totalValidBooks > 0 ? Math.round((count / totalValidBooks) * 100) : 0;
    return { genre, count, percentage: pct };
  }).sort((a, b) => b.percentage - a.percentage);

  // Reading streak mock logic based on active status
  const readingStreak = readingBooksCount > 0 ? 12 : 0; 

  const progressPercent = Math.min(100, Math.round((completedBooksCount / challengeGoal) * 100));

  // Font Scaling helper
  const getFontSize = (baseSize) => {
    switch (fontSizeMode) {
      case "small": return baseSize - 2;
      case "large": return baseSize + 2;
      case "extra-large": return baseSize + 4;
      default: return baseSize;
    }
  };

  return (
    <View style={styles.container}>
      <BubbleBackground />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reading Analytics</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchLibraryData}>
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* 1. CHALLENGE PROGRESS RING CARD */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>2026 Yearly Reading Challenge</Text>
            <View style={styles.progressRow}>
              {/* Custom visual progress ring using styling */}
              <View style={styles.progressRingOuter}>
                <View style={[styles.progressRingFill, { transform: [{ rotate: `${(progressPercent/100) * 360}deg` }] }]} />
                <View style={styles.progressRingInner}>
                  <Text style={[styles.ringPercentageText, { fontSize: getFontSize(16) }]}>{progressPercent}%</Text>
                  <Text style={styles.ringSubtext}>Complete</Text>
                </View>
              </View>

              <View style={styles.challengeMeta}>
                <Text style={styles.metaTitle}>Your Goal Progress</Text>
                <Text style={[styles.metaCount, { fontSize: getFontSize(18) }]}>
                  <Text style={[styles.highlightText, { fontSize: getFontSize(22) }]}>{completedBooksCount}</Text> of {challengeGoal} books
                </Text>
                <Text style={styles.metaStatus}>
                  {progressPercent >= 50 ? "Ahead of pace! 🚀" : "Keep going, page by page! 📚"}
                </Text>
              </View>
            </View>
          </View>

          {/* 2. CORE READING STATS ROW */}
          <View style={styles.statsGrid}>
            <View style={[styles.statsCard, { marginRight: 10 }]}>
              <Ionicons name="documents-outline" size={22} color={colors.primary} />
              <Text style={[styles.statsVal, { fontSize: getFontSize(20) }]}>{totalPagesRead}</Text>
              <Text style={styles.statsLabel}>Pages Logged</Text>
            </View>
            <View style={[styles.statsCard, { marginLeft: 10 }]}>
              <Ionicons name="flame-outline" size={22} color="#FF9800" />
              <Text style={[styles.statsVal, { fontSize: getFontSize(20) }]}>{readingStreak} Days</Text>
              <Text style={styles.statsLabel}>Active Streak</Text>
            </View>
          </View>

          {/* 3. STATUS DISTRIBUTION */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Library Curation Status</Text>
            <View style={styles.distributionRow}>
              <View style={styles.distItem}>
                <Text style={[styles.distNum, { color: "#2196F3", fontSize: getFontSize(22) }]}>{tbrBooksCount}</Text>
                <Text style={styles.distLabel}>To-Read</Text>
              </View>
              <View style={styles.distItem}>
                <Text style={[styles.distNum, { color: colors.primary, fontSize: getFontSize(22) }]}>{readingBooksCount}</Text>
                <Text style={styles.distLabel}>Reading</Text>
              </View>
              <View style={styles.distItem}>
                <Text style={[styles.distNum, { color: "#FF9800", fontSize: getFontSize(22) }]}>{completedBooksCount}</Text>
                <Text style={styles.distLabel}>Completed</Text>
              </View>
            </View>
          </View>

          {/* 4. GENRE BREAKDOWN (MINT-LEAF THEMED) */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Genre Leaf Breakdown</Text>
            {genrePercentages.length === 0 ? (
              <Text style={styles.noDataText}>No books in library to classify. Add some books to see your genre leaves.</Text>
            ) : (
              <View style={styles.genreList}>
                {genrePercentages.map((item, idx) => (
                  <View key={idx} style={styles.genreRow}>
                    <View style={styles.genreInfo}>
                      <View style={styles.leafBullet}>
                        <Ionicons name="leaf" size={12} color={colors.primary} />
                      </View>
                      <Text style={[styles.genreName, { fontSize: getFontSize(13) }]}>{item.genre}</Text>
                    </View>
                    <View style={styles.genreProgressWrapper}>
                      <View style={styles.genreBarTrack}>
                        <View style={[styles.genreBarFill, { width: `${item.percentage}%`, backgroundColor: colors.primary }]} />
                      </View>
                      <Text style={styles.genrePctText}>{item.percentage}%</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 5. ACTIVE STREAKS CALENDAR CARD */}
          <View style={[styles.card, styles.streakGlowCard]}>
            <View style={styles.streakHeader}>
              <View style={styles.flameCircle}>
                <Ionicons name="flame" size={24} color={colors.white} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.streakTitle}>Daily Reading Habit</Text>
                <Text style={styles.streakSubtitle}>Keep up your momentum</Text>
              </View>
            </View>

            <View style={styles.calendarRow}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => {
                const active = idx < (readingStreak % 7 || 5);
                return (
                  <View key={idx} style={styles.calendarDay}>
                    <View style={[styles.dayCircle, active && styles.dayCircleActive]}>
                      {active ? (
                        <Ionicons name="checkmark" size={14} color={colors.white} />
                      ) : (
                        <Text style={styles.dayInitial}>{day[0]}</Text>
                      )}
                    </View>
                    <Text style={styles.dayLabel}>{day}</Text>
                  </View>
                );
              })}
            </View>
          </View>

        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "JetBrainsMono-Medium",
    color: colors.textPrimary,
  },
  refreshBtn: {
    padding: 4,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: "JetBrainsMono-Medium",
    color: colors.textPrimary,
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressRingOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 8,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  progressRingFill: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 8,
    borderColor: colors.primary,
    borderLeftColor: "transparent",
    borderBottomColor: "transparent",
  },
  progressRingInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringPercentageText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textDark,
  },
  ringSubtext: {
    fontSize: 8,
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  challengeMeta: {
    flex: 1,
    marginLeft: 20,
  },
  metaTitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  metaCount: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
    marginVertical: 4,
  },
  highlightText: {
    color: colors.primary,
    fontSize: 22,
  },
  metaStatus: {
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    marginBottom: 16,
  },
  statsCard: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statsVal: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textDark,
    marginTop: 6,
  },
  statsLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  distributionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  distItem: {
    alignItems: "center",
  },
  distNum: {
    fontSize: 22,
    fontWeight: "bold",
  },
  distLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  genreList: {
    marginTop: 4,
  },
  genreRow: {
    marginBottom: 12,
  },
  genreInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  leafBullet: {
    marginRight: 6,
  },
  genreName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textDark,
  },
  genreProgressWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  genreBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.inputBackground,
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 10,
  },
  genreBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  genrePctText: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.textSecondary,
    width: 30,
    textAlign: "right",
  },
  noDataText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  streakGlowCard: {
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  streakHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  flameCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FF9800",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF9800",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  streakTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.textDark,
  },
  streakSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  calendarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  calendarDay: {
    alignItems: "center",
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardBackground,
  },
  dayCircleActive: {
    backgroundColor: "#FF9800",
    borderColor: "#FF9800",
  },
  dayInitial: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  dayLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
