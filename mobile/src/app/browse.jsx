import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { API_URL } from "../constants/api";
import BubbleBackground from "../components/BubbleBackground";

const { width: screenWidth } = Dimensions.get("window");

export default function Browse() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { colors, fontSizeMode } = useThemeStore();
  const styles = createStyles(colors);

  const [searchQuery, setSearchQuery] = useState("");
  const [books, setBooks] = useState([]);
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [communityAddedBooks, setCommunityAddedBooks] = useState([]);
  const [libraryBookIds, setLibraryBookIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [addingBookId, setAddingBookId] = useState(null);

  // Barcode Scanner Simulator State
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [scannedBook, setScannedBook] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // Fetch standard catalog books and user's current library book IDs (to show "Added" state)
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Fetch trending/default catalog
      const catalogRes = await fetch(`${API_URL}/library/catalog`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const catalogData = await catalogRes.json();
      if (catalogRes.ok) {
        setTrendingBooks(catalogData.slice(0, 3));
        setBooks(catalogData);
      }

      // Fetch community catalog additions
      const commRes = await fetch(`${API_URL}/library/catalog?userAdded=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const commData = await commRes.json();
      if (commRes.ok) {
        setCommunityAddedBooks(commData);
      }

      // Fetch user's library to mark what is already added
      const libraryRes = await fetch(`${API_URL}/library`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const libraryData = await libraryRes.json();
      if (libraryRes.ok) {
        const ids = new Set(libraryData.map(lb => lb.book?._id).filter(Boolean));
        setLibraryBookIds(ids);
      }
    } catch (error) {
      console.error("Browse init error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Handle Search Input Query
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSearch = async (query) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/library/catalog?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setBooks(data);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add Book to personal library
  const handleAddToLibrary = async (bookId) => {
    if (libraryBookIds.has(bookId)) return;

    // Optimistic UI Update
    setLibraryBookIds(prev => {
      const copy = new Set(prev);
      copy.add(bookId);
      return copy;
    });

    try {
      setAddingBookId(bookId);
      const response = await fetch(`${API_URL}/library`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookId, status: "To-Read" }),
      });

      const data = await response.json();
      if (!response.ok) {
        // Rollback on error
        setLibraryBookIds(prev => {
          const copy = new Set(prev);
          copy.delete(bookId);
          return copy;
        });
        Alert.alert("Error", data.message || "Failed to add book to library");
      } else {
        Alert.alert("Added! 📚", "This book has been added to your TBR list.");
      }
    } catch (error) {
      console.error("Add library book error:", error);
      // Rollback
      setLibraryBookIds(prev => {
        const copy = new Set(prev);
        copy.delete(bookId);
        return copy;
      });
    } finally {
      setAddingBookId(null);
    }
  };

  // Simulating scanner lookup
  const startScanningSimulation = () => {
    setIsScannerVisible(true);
    setIsScanning(true);
    setScannedBook(null);

    // Simulate scanning duration of 2 seconds, then picks a book
    setTimeout(() => {
      setIsScanning(false);
      // Randomly pick a book from catalog to simulate scanning success
      if (books.length > 0) {
        const randomIndex = Math.floor(Math.random() * books.length);
        setScannedBook(books[randomIndex]);
      } else {
        // Fallback mockup book if catalog is empty
        setScannedBook({
          title: "The Alchemist",
          author: "Paulo Coelho",
          pages: 180,
          genre: "Adventure",
          isbn: "9780061122415",
          image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300",
        });
      }
    }, 2000);
  };

  const handleAddScannedBook = async () => {
    if (!scannedBook) return;
    setIsScannerVisible(false);
    await handleAddToLibrary(scannedBook._id);
    setScannedBook(null);
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
        <Text style={styles.headerTitle}>Browse & Discover</Text>
        <TouchableOpacity style={styles.scannerButton} onPress={startScanningSimulation}>
          <Ionicons name="barcode-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search catalog by title, author, genre..."
            placeholderTextColor={colors.placeholderText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchTextInput}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal Carousel (Trending Hauls / Popular Books) */}
        {searchQuery === "" && (
          <View style={styles.carouselSection}>
            <Text style={styles.sectionTitle}>Trending Curations 🔥</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
              {trendingBooks.map((item) => (
                <View key={item._id} style={styles.carouselCard}>
                  <Image source={item.image} style={styles.carouselCover} contentFit="cover" />
                  <View style={styles.carouselDetails}>
                    <Text style={[styles.carouselTitle, { fontSize: getFontSize(14) }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.carouselAuthor, { fontSize: getFontSize(12) }]} numberOfLines={1}>{item.author}</Text>
                    <Text style={styles.carouselPages}>{item.pages} pages • {item.genre}</Text>
                    
                    <TouchableOpacity
                      style={[
                        styles.addBtnSmall,
                        libraryBookIds.has(item._id) && styles.addedBtnSmall
                      ]}
                      onPress={() => handleAddToLibrary(item._id)}
                    >
                      <Ionicons
                        name={libraryBookIds.has(item._id) ? "checkmark" : "add"}
                        size={14}
                        color={colors.white}
                      />
                      <Text style={styles.addBtnTextSmall}>
                        {libraryBookIds.has(item._id) ? "Added" : "TBR"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Horizontal Carousel (Community Catalog Additions) */}
        {searchQuery === "" && communityAddedBooks.length > 0 && (
          <View style={styles.carouselSection}>
            <Text style={styles.sectionTitle}>Added by the Community 🌟</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
              {communityAddedBooks.map((item) => (
                <View key={item._id} style={styles.carouselCard}>
                  <Image source={item.image} style={styles.carouselCover} contentFit="cover" />
                  <View style={styles.carouselDetails}>
                    <Text style={[styles.carouselTitle, { fontSize: getFontSize(14) }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.carouselAuthor, { fontSize: getFontSize(12) }]} numberOfLines={1}>{item.author}</Text>
                    <Text style={styles.carouselPages}>{item.pages} pages • {item.genre}</Text>
                    
                    <TouchableOpacity
                      style={[
                        styles.addBtnSmall,
                        libraryBookIds.has(item._id) && styles.addedBtnSmall
                      ]}
                      onPress={() => handleAddToLibrary(item._id)}
                    >
                      <Ionicons
                        name={libraryBookIds.has(item._id) ? "checkmark" : "add"}
                        size={14}
                        color={colors.white}
                      />
                      <Text style={styles.addBtnTextSmall}>
                        {libraryBookIds.has(item._id) ? "Added" : "TBR"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Global Catalog Results */}
        <View style={styles.catalogSection}>
          <Text style={styles.sectionTitle}>
            {searchQuery === "" ? "Explore All Catalog Books" : `Search Results (${books.length})`}
          </Text>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
          ) : (
            books.map((item) => (
              <View key={item._id} style={styles.bookRowCard}>
                <Image source={item.image} style={styles.bookRowCover} contentFit="cover" />
                <View style={styles.bookRowInfo}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.bookRowTitle, { fontSize: getFontSize(15) }]}>{item.title}</Text>
                    <Text style={[styles.bookRowAuthor, { fontSize: getFontSize(13) }]}>by {item.author}</Text>
                    <Text style={styles.bookRowGenre}>{item.genre} • {item.pages} pages</Text>
                    <Text style={styles.bookRowIsbn}>ISBN: {item.isbn}</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.addBtnRow,
                      libraryBookIds.has(item._id) && styles.addedBtnRow
                    ]}
                    onPress={() => handleAddToLibrary(item._id)}
                    disabled={addingBookId === item._id}
                  >
                    {addingBookId === item._id ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <Ionicons
                          name={libraryBookIds.has(item._id) ? "checkmark-circle" : "add-circle-outline"}
                          size={18}
                          color={colors.white}
                        />
                        <Text style={styles.addBtnTextRow}>
                          {libraryBookIds.has(item._id) ? "Added" : "Add to Library"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {!loading && books.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={40} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No books found matching search.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Simulated Scanner Modal Overlay */}
      <Modal visible={isScannerVisible} transparent={true} animationType="slide" onRequestClose={() => setIsScannerVisible(false)}>
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerPanel}>
            <View style={styles.scannerHeader}>
              <Text style={styles.scannerTitle}>Simulated Barcode Scanner</Text>
              <TouchableOpacity onPress={() => setIsScannerVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {isScanning ? (
              <View style={styles.scanningFrame}>
                <View style={styles.scannerLaser} />
                <ActivityIndicator size="large" color={colors.primary} style={styles.scannerSpinner} />
                <Text style={styles.scanningText}>Searching database barcode...</Text>
              </View>
            ) : (
              scannedBook && (
                <View style={styles.scannedBookInfo}>
                  <Ionicons name="checkmark-circle" size={48} color={colors.primary} style={{ alignSelf: "center", marginBottom: 12 }} />
                  <Text style={styles.scannedLabel}>ISBN CODE DETECTED</Text>
                  
                  <View style={styles.scannedBookRow}>
                    <Image source={scannedBook.image} style={styles.scannedBookCover} />
                    <View style={styles.scannedBookDetails}>
                      <Text style={styles.scannedTitle}>{scannedBook.title}</Text>
                      <Text style={styles.scannedAuthor}>by {scannedBook.author}</Text>
                      <Text style={styles.scannedPages}>{scannedBook.pages} pages • {scannedBook.genre}</Text>
                      <Text style={styles.scannedIsbn}>ISBN: {scannedBook.isbn}</Text>
                    </View>
                  </View>

                  <View style={styles.scannerActions}>
                    <TouchableOpacity style={styles.scannerCancelBtn} onPress={() => setIsScannerVisible(false)}>
                      <Text style={styles.scannerCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.scannerAddBtn} onPress={handleAddScannedBook}>
                      <Text style={styles.scannerAddText}>Add Book to TBR</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            )}
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
  scrollContainer: {
    paddingBottom: 40,
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
  scannerButton: {
    padding: 4,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
  },
  carouselSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "JetBrainsMono-Medium",
    color: colors.textPrimary,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  carouselContainer: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  carouselCard: {
    flexDirection: "row",
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 12,
    marginRight: 14,
    width: screenWidth * 0.75,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  carouselCover: {
    width: 70,
    height: 100,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  carouselDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  carouselTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.textDark,
  },
  carouselAuthor: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  carouselPages: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  addBtnSmall: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  addedBtnSmall: {
    backgroundColor: colors.textSecondary,
  },
  addBtnTextSmall: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
  catalogSection: {
    paddingHorizontal: 20,
  },
  bookRowCard: {
    flexDirection: "row",
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bookRowCover: {
    width: 60,
    height: 85,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  bookRowInfo: {
    flex: 1,
    marginLeft: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bookRowTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  bookRowAuthor: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bookRowGenre: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  bookRowIsbn: {
    fontSize: 10,
    color: colors.placeholderText,
    marginTop: 2,
  },
  addBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  addedBtnRow: {
    backgroundColor: colors.textSecondary,
  },
  addBtnTextRow: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 10,
    fontFamily: "JetBrainsMono-Medium",
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  scannerPanel: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 320,
    borderWidth: 1,
    borderColor: colors.border
  },
  scannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  scannerTitle: {
    fontSize: 18,
    fontFamily: "JetBrainsMono-Medium",
    color: colors.textDark,
  },
  scanningFrame: {
    flex: 1,
    height: 180,
    backgroundColor: "#112211",
    borderRadius: 12,
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  scannerLaser: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    height: 3,
    backgroundColor: "#FF3B30",
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  scannerSpinner: {
    marginBottom: 12,
  },
  scanningText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: "JetBrainsMono-Medium",
  },
  scannedBookInfo: {
    paddingVertical: 10,
  },
  scannedLabel: {
    textAlign: "center",
    fontSize: 12,
    color: colors.primary,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 14,
  },
  scannedBookRow: {
    flexDirection: "row",
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  scannedBookCover: {
    width: 60,
    height: 85,
    borderRadius: 6,
  },
  scannedBookDetails: {
    marginLeft: 12,
    justifyContent: "center",
  },
  scannedTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.textDark,
  },
  scannedAuthor: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scannedPages: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  scannedIsbn: {
    fontSize: 10,
    color: colors.placeholderText,
    marginTop: 2,
  },
  scannerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scannerCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  scannerCancelText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  scannerAddBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  scannerAddText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
});
