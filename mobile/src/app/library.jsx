import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
  RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { API_URL } from "../constants/api";
import BubbleBackground from "../components/BubbleBackground";

const { width: screenWidth } = Dimensions.get("window");

export default function Library() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { colors, fontSizeMode } = useThemeStore();
  const styles = createStyles(colors);
  
  const [libraryBooks, setLibraryBooks] = useState([]);
  const [hauls, setHauls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tabs Filter
  const [activeTab, setActiveTab] = useState("All"); // All, To-Read, Reading, Completed

  // Modals visibility
  const [isManualModalVisible, setIsManualModalVisible] = useState(false);
  const [isHaulModalVisible, setIsHaulModalVisible] = useState(false);
  const [isPageLogVisible, setIsPageLogVisible] = useState(false);

  // New Custom Book Form State
  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [manualPages, setManualPages] = useState("");
  const [manualGenre, setManualGenre] = useState("");
  const [submittingManual, setSubmittingManual] = useState(false);

  // New Haul Form State
  const [haulName, setHaulName] = useState("");
  const [haulCost, setHaulCost] = useState("");
  const [selectedHaulBooks, setSelectedHaulBooks] = useState([]);
  const [submittingHaul, setSubmittingHaul] = useState(false);

  // Progress update state
  const [selectedLibraryBook, setSelectedLibraryBook] = useState(null);
  const [updatePageVal, setUpdatePageVal] = useState("");
  const [submittingProgress, setSubmittingProgress] = useState(false);

  // Fetch Library & Hauls
  const fetchLibraryAndHauls = async () => {
    try {
      setLoading(true);
      const libRes = await fetch(`${API_URL}/library`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const libData = await libRes.json();
      if (libRes.ok) {
        setLibraryBooks(libData);
      }

      const haulRes = await fetch(`${API_URL}/hauls`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const haulData = await haulRes.json();
      if (haulRes.ok) {
        setHauls(haulData);
      }
    } catch (error) {
      console.error("Fetch library/hauls error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraryAndHauls();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLibraryAndHauls();
    setRefreshing(false);
  };

  // Add a Custom Book Manually
  const handleAddManualBook = async () => {
    if (!manualTitle || !manualAuthor || !manualPages) {
      Alert.alert("Error", "Please fill in Title, Author, and Page Count.");
      return;
    }

    try {
      setSubmittingManual(true);
      const res = await fetch(`${API_URL}/library/custom`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: manualTitle,
          author: manualAuthor,
          pages: parseInt(manualPages),
          genre: manualGenre || "General",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setLibraryBooks(prev => [data, ...prev]);
        setIsManualModalVisible(false);
        setManualTitle("");
        setManualAuthor("");
        setManualPages("");
        setManualGenre("");
        Alert.alert("Success", `${manualTitle} added to your library!`);
      } else {
        Alert.alert("Error", data.message || "Failed to save custom book");
      }
    } catch (error) {
      console.error("Save custom book error:", error);
    } finally {
      setSubmittingManual(false);
    }
  };

  // Log a Haul
  const handleLogHaul = async () => {
    if (!haulName || !haulCost) {
      Alert.alert("Error", "Please enter a Haul name and Total Cost.");
      return;
    }

    try {
      setSubmittingHaul(true);
      const res = await fetch(`${API_URL}/hauls`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: haulName,
          totalCost: parseFloat(haulCost),
          books: selectedHaulBooks,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setHauls(prev => [data, ...prev]);
        setIsHaulModalVisible(false);
        setHaulName("");
        setHaulCost("");
        setSelectedHaulBooks([]);
        Alert.alert("Logged! 🏷️", "Haul logged successfully.");
      } else {
        Alert.alert("Error", data.message || "Failed to log haul");
      }
    } catch (error) {
      console.error("Log haul error:", error);
    } finally {
      setSubmittingHaul(false);
    }
  };

  // Update book progress pages or status
  const handleUpdateProgress = async (id, status, currentPage) => {
    // Optimistic UI updates
    setLibraryBooks(prev =>
      prev.map(lb => {
        if (lb._id === id) {
          const updated = { ...lb };
          if (status) updated.status = status;
          if (currentPage !== undefined) updated.currentPage = currentPage;
          if (status === "Completed") {
            updated.currentPage = lb.totalPages || lb.book?.pages || 0;
          }
          return updated;
        }
        return lb;
      })
    );

    try {
      const body = {};
      if (status) body.status = status;
      if (currentPage !== undefined) body.currentPage = currentPage;

      const res = await fetch(`${API_URL}/library/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        // Sync with db
        setLibraryBooks(prev =>
          prev.map(lb => (lb._id === id ? data : lb))
        );
      }
    } catch (error) {
      console.error("Update progress error:", error);
    }
  };

  const handleOpenPageLog = (libBook) => {
    setSelectedLibraryBook(libBook);
    setUpdatePageVal(libBook.currentPage.toString());
    setIsPageLogVisible(true);
  };

  const handleSavePageLog = async () => {
    if (!selectedLibraryBook) return;
    const pageNum = parseInt(updatePageVal);
    const maxPages = selectedLibraryBook.totalPages || selectedLibraryBook.book?.pages || 999;
    if (isNaN(pageNum) || pageNum < 0 || pageNum > maxPages) {
      Alert.alert("Invalid input", `Please enter a valid page number between 0 and ${maxPages}.`);
      return;
    }

    setIsPageLogVisible(false);
    await handleUpdateProgress(selectedLibraryBook._id, null, pageNum);
    setSelectedLibraryBook(null);
  };

  // Toggle book in haul creation list
  const toggleBookForHaul = (bookId) => {
    setSelectedHaulBooks(prev => {
      if (prev.includes(bookId)) {
        return prev.filter(id => id !== bookId);
      } else {
        return [...prev, bookId];
      }
    });
  };

  // Filter local books for rendering
  const filteredBooks = libraryBooks.filter(item => {
    if (activeTab === "All") return true;
    return item.status === activeTab;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Reading": return colors.primary; // slate blue
      case "Completed": return colors.accent; // terracotta rose
      case "To-Read": return colors.textSecondary; // muted grey/slate
      case "DNF": return "#C0392B";
      default: return colors.textSecondary;
    }
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

  return (
    <View style={styles.container}>
      <BubbleBackground />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Library & Hauls</Text>
        <TouchableOpacity style={styles.haulButton} onPress={() => setIsHaulModalVisible(true)}>
          <Ionicons name="pricetags-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Hauls Quick Metric Banner */}
      {hauls.length > 0 && (
        <View style={styles.haulsMetricsCard}>
          <Text style={styles.metricsTitle}>Reading Purchase Tracker 🏷️</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{hauls.length}</Text>
              <Text style={styles.metricLabel}>Total Hauls</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>
                ${hauls.reduce((acc, h) => acc + h.totalCost, 0).toFixed(2)}
              </Text>
              <Text style={styles.metricLabel}>Total Spent</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>
                {hauls.reduce((acc, h) => acc + h.books.length, 0)}
              </Text>
              <Text style={styles.metricLabel}>Haul Books</Text>
            </View>
          </View>
        </View>
      )}

      {/* Tab Segmented Control */}
      <View style={styles.tabBar}>
        {["All", "To-Read", "Reading", "Completed"].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, isActive && { backgroundColor: colors.primary }]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, isActive && { color: colors.white }]}>
                {tab === "To-Read" ? "TBR" : tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filteredBooks}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />
          }
          renderItem={({ item, index }) => {
            const bookDetail = item.book || {};
            const totalPg = item.totalPages || bookDetail.pages || 0;
            const progressPercent = totalPg > 0 ? Math.min(100, Math.round((item.currentPage / totalPg) * 100)) : 0;
            const cardColors = ["#FFB74D", "#64B5F6", "#F06292", "#81C784"];
            const cardBg = cardColors[index % cardColors.length];

            return (
              <View style={[styles.bookCard, { borderLeftWidth: 5, borderLeftColor: cardBg, backgroundColor: colors.cardBackground }]}>
                <Image source={bookDetail.image} style={styles.coverImage} contentFit="cover" />

                <View style={styles.infoCol}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.bookTitle, { fontSize: getFontSize(15) }]} numberOfLines={1}>{bookDetail.title}</Text>
                      <Text style={[styles.bookAuthor, { fontSize: getFontSize(12) }]}>{bookDetail.author}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + "22" }]}>
                      <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                    </View>
                  </View>

                  {/* Reading Progress details */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressBarTrack}>
                      <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: getStatusColor(item.status) }]} />
                    </View>
                    <View style={styles.progressLabels}>
                      <Text style={[styles.pagesText, { fontSize: getFontSize(10) }]}>Page {item.currentPage} of {totalPg}</Text>
                      <Text style={[styles.percentText, { fontSize: getFontSize(10) }]}>{progressPercent}%</Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.cardActions}>
                    {item.status === "To-Read" && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: colors.primary }]}
                        onPress={() => handleUpdateProgress(item._id, "Reading")}
                      >
                        <Ionicons name="book" size={14} color={colors.primary} />
                        <Text style={[styles.actionBtnText, { color: colors.primary }]}>Start Reading</Text>
                      </TouchableOpacity>
                    )}

                    {item.status === "Reading" && (
                      <>
                        <TouchableOpacity
                          style={[styles.actionBtn, { borderColor: colors.primary }]}
                          onPress={() => handleOpenPageLog(item)}
                        >
                          <Ionicons name="create-outline" size={14} color={colors.primary} />
                          <Text style={[styles.actionBtnText, { color: colors.primary }]}>Log Page</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionBtn, { borderColor: "#FF9800" }]}
                          onPress={() => handleUpdateProgress(item._id, "Completed")}
                        >
                          <Ionicons name="checkmark-done" size={14} color="#FF9800" />
                          <Text style={[styles.actionBtnText, { color: "#FF9800" }]}>Finish</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {item.status === "Completed" && (
                      <Text style={[styles.completionDateText, { fontSize: getFontSize(10) }]}>
                        Completed on {item.dateFinished ? new Date(item.dateFinished).toLocaleDateString() : new Date().toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="library-outline" size={54} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No books in this list</Text>
              <Text style={styles.emptySubtext}>Browse catalog or tap the + FAB below to add a book manually.</Text>
            </View>
          }
        />
      )}

      {/* Manual Book FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setIsManualModalVisible(true)}>
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      {/* MODAL 1: ADD BOOK MANUALLY */}
      <Modal visible={isManualModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Book</Text>
              <TouchableOpacity onPress={() => setIsManualModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Book Title</Text>
              <TextInput style={styles.input} placeholder="e.g. Normal People" value={manualTitle} onChangeText={setManualTitle} />

              <Text style={styles.label}>Author</Text>
              <TextInput style={styles.input} placeholder="e.g. Sally Rooney" value={manualAuthor} onChangeText={setManualAuthor} />

              <Text style={styles.label}>Total Page Count</Text>
              <TextInput style={styles.input} placeholder="e.g. 273" keyboardType="number-pad" value={manualPages} onChangeText={setManualPages} />

              <Text style={styles.label}>Genre (Optional)</Text>
              <TextInput style={styles.input} placeholder="e.g. Fiction" value={manualGenre} onChangeText={setManualGenre} />

              <TouchableOpacity style={styles.submitBtn} onPress={handleAddManualBook} disabled={submittingManual}>
                {submittingManual ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.submitBtnText}>Add Custom Book</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: LOG A HAUL */}
      <Modal visible={isHaulModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Book Haul 🏷️</Text>
              <TouchableOpacity onPress={() => setIsHaulModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Haul Curation Name</Text>
              <TextInput style={styles.input} placeholder="e.g. Bookstore Haul" value={haulName} onChangeText={setHaulName} />

              <Text style={styles.label}>Total Cost ($)</Text>
              <TextInput style={styles.input} placeholder="e.g. 49.99" keyboardType="numeric" value={haulCost} onChangeText={setHaulCost} />

              <Text style={styles.label}>Select Books in Haul</Text>
              {libraryBooks.length === 0 ? (
                <Text style={styles.subtext}>No books in library to link yet.</Text>
              ) : (
                libraryBooks.map(lb => {
                  const title = lb.book?.title || "Custom Book";
                  const isChecked = selectedHaulBooks.includes(lb.book?._id);
                  return (
                    <TouchableOpacity
                      key={lb._id}
                      style={[styles.checklistRow, isChecked && styles.checklistRowChecked]}
                      onPress={() => toggleBookForHaul(lb.book?._id)}
                    >
                      <Ionicons
                        name={isChecked ? "checkbox" : "square-outline"}
                        size={20}
                        color={isChecked ? colors.primary : colors.textSecondary}
                      />
                      <Text style={[styles.checklistText, isChecked && { fontWeight: "bold" }]}>{title}</Text>
                    </TouchableOpacity>
                  );
                })
              )}

              <TouchableOpacity style={[styles.submitBtn, { marginTop: 12 }]} onPress={handleLogHaul} disabled={submittingHaul}>
                {submittingHaul ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.submitBtnText}>Create Haul Curation</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: LOG READING PAGE */}
      <Modal visible={isPageLogVisible} transparent={true} animationType="fade">
        <View style={styles.pageLogOverlay}>
          <View style={styles.pageLogPanel}>
            <Text style={styles.pageLogTitle}>Log Progress page</Text>
            <Text style={styles.pageLogBookTitle}>
              Update page count for {selectedLibraryBook?.book?.title}
            </Text>

            <View style={styles.pageLogInputRow}>
              <TextInput
                style={styles.pageLogInput}
                keyboardType="number-pad"
                value={updatePageVal}
                onChangeText={setUpdatePageVal}
                autoFocus={true}
              />
              <Text style={styles.pageLogInputTotal}>
                / {selectedLibraryBook?.totalPages || selectedLibraryBook?.book?.pages}
              </Text>
            </View>

            <View style={styles.pageLogActions}>
              <TouchableOpacity
                style={[styles.pageLogBtn, styles.pageLogBtnSec]}
                onPress={() => {
                  setIsPageLogVisible(false);
                  setSelectedLibraryBook(null);
                }}
              >
                <Text style={styles.pageLogBtnTextSec}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.pageLogBtn, styles.pageLogBtnPrim]} onPress={handleSavePageLog}>
                <Text style={styles.pageLogBtnTextPrim}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  haulButton: {
    padding: 4,
  },
  haulsMetricsCard: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  metricsTitle: {
    fontSize: 13,
    fontFamily: "JetBrainsMono-Medium",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricItem: {
    alignItems: "center",
    flex: 1,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textDark,
  },
  metricLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    marginHorizontal: 20,
    padding: 3,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 20,
  },
  activeTabItem: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.white,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  bookCard: {
    flexDirection: "row",
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  coverImage: {
    width: 65,
    height: 95,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  infoCol: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  bookAuthor: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  progressSection: {
    marginVertical: 8,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: colors.inputBackground,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  pagesText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  percentText: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.textDark,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 4,
  },
  completionDateText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "JetBrainsMono-Medium",
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 24,
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "JetBrainsMono-Medium",
    color: colors.textDark,
  },
  label: {
    fontSize: 13,
    fontFamily: "JetBrainsMono-Medium",
    color: colors.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.textDark,
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  submitBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "bold",
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  checklistRowChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.cardBackground,
  },
  checklistText: {
    fontSize: 13,
    color: colors.textDark,
    marginLeft: 10,
  },
  subtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginVertical: 10,
  },
  pageLogOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  pageLogPanel: {
    width: "80%",
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border
  },
  pageLogTitle: {
    fontSize: 16,
    fontFamily: "JetBrainsMono-Medium",
    color: colors.textDark,
    marginBottom: 4,
  },
  pageLogBookTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  pageLogInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  pageLogInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    width: 60,
    height: 40,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textDark,
    backgroundColor: colors.inputBackground,
  },
  pageLogInputTotal: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  pageLogActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  pageLogBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pageLogBtnSec: {
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  pageLogBtnPrim: {
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  pageLogBtnTextSec: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  pageLogBtnTextPrim: {
    color: colors.white,
    fontWeight: "600",
  },
});
