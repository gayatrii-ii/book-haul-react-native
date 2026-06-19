import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
  TextInput,
  Modal,
  StyleSheet,
  PanResponder,
  Alert,
  ScrollView
} from "react-native";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useEffect, useState, useRef } from "react";
import createStyles from "../../assets/styles/home.styles";
import { API_URL } from "../../constants/api";
import { Ionicons } from "@expo/vector-icons";
import { formatPublishDate } from "../../lib/utils";
import Loader from "../../components/Loader";
import BubbleBackground from "../../components/BubbleBackground";
import { useRouter } from "expo-router";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const SIDEBAR_WIDTH = 260;

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Home() {
  const { token, logout } = useAuthStore();
  const { colors, theme, setTheme, fontSizeMode, setFontSizeMode } = useThemeStore();
  const styles = createStyles(colors);
  const router = useRouter();

  // Comments Modal State
  const [isCommentsModalVisible, setIsCommentsModalVisible] = useState(false);
  const [activeBookForComments, setActiveBookForComments] = useState(null);
  const [commentsList, setCommentsList] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  
  // Feed Books State
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Search Filter State
  const [searchQuery, setSearchQuery] = useState("");
  
  // Sidebar Drawer Animation State (Opened by default on load)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isSidebarOpenRef = useRef(true);
  const wasSidebarOpenOnGrant = useRef(false);
  const sidebarTranslateX = useRef(new Animated.Value(0)).current;
  const sidebarBackdropOpacity = useRef(new Animated.Value(0.4)).current;

  // Reading Progress State (Now Reading banner)
  const [currentBook, setCurrentBook] = useState({
    id: null,
    title: "Normal People",
    author: "Sally Rooney",
    currentPage: 180,
    totalPages: 320,
    isPlaying: true,
    cover: "https://res.cloudinary.com/dftde80n7/image/upload/v1781860387/kyth84lmxljbygxtdpl2.jpg"
  });
  const [isProgressModalVisible, setIsProgressModalVisible] = useState(false);
  const [pageLogInput, setPageLogInput] = useState("180");

  // Reading Challenge State
  const [challengeCount, setChallengeCount] = useState(0);
  const [challengeGoal, setChallengeGoal] = useState(24);
  const [dbUser, setDbUser] = useState(null);

  // Settings Modal State
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [settingsGoalInput, setSettingsGoalInput] = useState("24");
  const [savingSettingsGoal, setSavingSettingsGoal] = useState(false);

  // Sync settings goal input when challengeGoal updates
  useEffect(() => {
    setSettingsGoalInput(challengeGoal.toString());
  }, [challengeGoal]);

  // Font Size Scaling helper
  const getFontSize = (baseSize) => {
    switch (fontSizeMode) {
      case "small": return baseSize - 2;
      case "large": return baseSize + 2;
      case "extra-large": return baseSize + 4;
      default: return baseSize;
    }
  };

  // --- DATABASE DATA LOAD ---
  const fetchDbUser = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setDbUser(data);
        if (data.readingGoal) {
          setChallengeGoal(data.readingGoal);
        }
      }
    } catch (err) {
      console.log("Error fetching db user info:", err);
    }
  };

  const fetchLibraryChallengeProgress = async () => {
    try {
      const res = await fetch(`${API_URL}/library`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const completedCount = data.filter(b => b.status === "Completed").length;
        setChallengeCount(completedCount);
        
        // Populate Now Reading banner from actual active reading book
        const activeReadingBook = data.find(b => b.status === "Reading");
        if (activeReadingBook && activeReadingBook.book) {
          setCurrentBook({
            id: activeReadingBook._id,
            title: activeReadingBook.book.title,
            author: activeReadingBook.book.author,
            currentPage: activeReadingBook.currentPage || 0,
            totalPages: activeReadingBook.totalPages || activeReadingBook.book.pages || 100,
            isPlaying: true,
            cover: activeReadingBook.book.image
          });
          setPageLogInput((activeReadingBook.currentPage || 0).toString());
        }
      }
    } catch (err) {
      console.log("Error fetching challenge progress:", err);
    }
  };

  const fetchBooks = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);

      const response = await fetch(`${API_URL}/books?page=${pageNum}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch books");

      const uniqueBooks =
        refresh || pageNum === 1
          ? data.books
          : Array.from(new Set([...books, ...data.books].map((book) => book._id))).map((id) =>
              [...books, ...data.books].find((book) => book._id === id)
            );

      setBooks(uniqueBooks);
      setHasMore(pageNum < data.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.log("Error fetching books", error);
    } finally {
      if (refresh) {
        await sleep(800);
        setRefreshing(false);
      } else setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchDbUser();
    fetchLibraryChallengeProgress();
  }, []);

  const handleLoadMore = async () => {
    if (hasMore && !loading && !refreshing) {
      await fetchBooks(page + 1);
    }
  };

  // --- SIDEBAR DRAWER CONTROLS ---
  const openSidebar = () => {
    setIsSidebarOpen(true);
    isSidebarOpenRef.current = true;
    Animated.parallel([
      Animated.timing(sidebarTranslateX, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(sidebarBackdropOpacity, {
        toValue: 0.4,
        duration: 220,
        useNativeDriver: true,
      })
    ]).start();
  };

  const closeSidebar = () => {
    isSidebarOpenRef.current = false;
    Animated.parallel([
      Animated.timing(sidebarTranslateX, {
        toValue: -SIDEBAR_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(sidebarBackdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsSidebarOpen(false);
    });
  };

  const handleLogout = async () => {
    closeSidebar();
    await logout();
  };

  // --- SWIPE GESTURES (PAN RESPONDER) ---
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const isNearLeftEdge = gestureState.x0 < 60;
        // Check if movement is mostly horizontal
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        
        if (!isSidebarOpenRef.current) {
          // Intercept swipe right from left edge (for sidebar) OR swipe left anywhere (for tab transition)
          return isHorizontal && (isNearLeftEdge && gestureState.dx > 10 || gestureState.dx < -10);
        } else {
          // If sidebar is open, intercept swipe left from anywhere
          return isHorizontal && gestureState.dx < -10;
        }
      },
      onPanResponderGrant: () => {
        wasSidebarOpenOnGrant.current = isSidebarOpenRef.current;
        if (!isSidebarOpenRef.current) {
          setIsSidebarOpen(true);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        let newX;
        if (wasSidebarOpenOnGrant.current) {
          newX = gestureState.dx;
        } else {
          newX = -SIDEBAR_WIDTH + gestureState.dx;
        }
        
        if (newX > 0) newX = 0;
        if (newX < -SIDEBAR_WIDTH) newX = -SIDEBAR_WIDTH;
        
        sidebarTranslateX.setValue(newX);
        
        const opacity = 0.4 * (1 - newX / -SIDEBAR_WIDTH);
        sidebarBackdropOpacity.setValue(opacity);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (wasSidebarOpenOnGrant.current) {
          // If it was open, close it if swiped left significantly or velocity is high to the left
          if (gestureState.dx < -80 || gestureState.vx < -0.3) {
            closeSidebar();
          } else {
            openSidebar();
          }
        } else {
          // If it was closed:
          // Check if swipe left to go to Create page
          if (gestureState.dx < -100 || gestureState.vx < -0.4) {
            router.push("/create");
          }
          // Check if swipe right to open sidebar
          else if (gestureState.dx > 80 || gestureState.vx > 0.3) {
            openSidebar();
          } else {
            closeSidebar();
          }
        }
      },
    })
  ).current;

  // --- NOW READING CONTROLS ---
  const togglePlayPause = () => {
    setCurrentBook(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying
    }));
  };

  const handleLogPagesSubmit = async () => {
    const pageNum = parseInt(pageLogInput);
    if (!isNaN(pageNum) && pageNum >= 0 && pageNum <= currentBook.totalPages) {
      // Update local state optimistically
      setCurrentBook(prev => ({
        ...prev,
        currentPage: pageNum
      }));
      setIsProgressModalVisible(false);

      if (currentBook.id) {
        try {
          await fetch(`${API_URL}/library/${currentBook.id}`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ currentPage: pageNum }),
          });
          
          // Re-fetch progress to update Completed challenge count
          await fetchLibraryChallengeProgress();
        } catch (err) {
          console.log("Error syncing progress log to database:", err);
        }
      }
    }
  };

  // --- FEED ACTIONS ---
  const handleLikePress = async (bookId) => {
    try {
      // Optimistically update the UI locally
      setBooks(prevBooks =>
        prevBooks.map(book => {
          if (book._id === bookId) {
            const isLiked = book.isLikedByMe;
            return {
              ...book,
              isLikedByMe: !isLiked,
              likesCount: (book.likesCount || 0) + (isLiked ? -1 : 1)
            };
          }
          return book;
        })
      );

      // Save to database
      const response = await fetch(`${API_URL}/books/${bookId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (response.ok) {
        // Sync with database values
        setBooks(prevBooks =>
          prevBooks.map(book => {
            if (book._id === bookId) {
              return {
                ...book,
                isLikedByMe: data.isLikedByMe,
                likesCount: data.likesCount
              };
            }
            return book;
          })
        );
      }
    } catch (error) {
      console.log("Error toggling like", error);
    }
  };

  const handleSavePress = (bookId) => {
    setBooks(prevBooks =>
      prevBooks.map(book => {
        if (book._id === bookId) {
          return {
            ...book,
            isSavedByMe: !book.isSavedByMe
          };
        }
        return book;
      })
    );
  };

  const fetchComments = async (bookId) => {
    try {
      setCommentsLoading(true);
      const response = await fetch(`${API_URL}/books/${bookId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setCommentsList(data);
      }
    } catch (error) {
      console.log("Error loading comments", error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleOpenComments = (book) => {
    setActiveBookForComments(book);
    setIsCommentsModalVisible(true);
    fetchComments(book._id);
  };

  const handlePostComment = async () => {
    if (!newCommentText.trim() || !activeBookForComments) return;
    
    try {
      const bookId = activeBookForComments._id;
      const response = await fetch(`${API_URL}/books/${bookId}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newCommentText }),
      });
      const newComment = await response.json();
      if (response.ok) {
        setCommentsList(prev => [...prev, newComment]);
        setNewCommentText("");
        
        // Update local comment count in feed
        setBooks(prevBooks =>
          prevBooks.map(book => {
            if (book._id === bookId) {
              return {
                ...book,
                commentsCount: (book.commentsCount || 0) + 1,
              };
            }
            return book;
          })
        );
      }
    } catch (error) {
      console.log("Error posting comment", error);
    }
  };

  // --- SAVE SETTINGS CHALLENGE GOAL ---
  const handleSaveSettingsGoal = async () => {
    const val = parseInt(settingsGoalInput);
    if (isNaN(val) || val <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid yearly goal.");
      return;
    }

    try {
      setSavingSettingsGoal(true);
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
        setChallengeGoal(data.readingGoal);
        
        // Sync with local storage and authStore
        const updatedUser = { ...dbUser, readingGoal: data.readingGoal };
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        useAuthStore.setState({ user: updatedUser });

        Alert.alert("Goal Updated! 🎯", `Your yearly goal is now set to ${data.readingGoal} books.`);
        setIsSettingsModalVisible(false);
      } else {
        Alert.alert("Error", data.message || "Failed to update reading goal");
      }
    } catch (error) {
      console.error("Goal save error:", error);
    } finally {
      setSavingSettingsGoal(false);
    }
  };

  // --- RENDER ITEMS ---
  const filteredBooks = books.filter(book => {
    const q = searchQuery.toLowerCase();
    return (
      book.title.toLowerCase().includes(q) ||
      (book.caption && book.caption.toLowerCase().includes(q)) ||
      (book.user && book.user.username.toLowerCase().includes(q))
    );
  });

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

  const renderItem = ({ item, index }) => {
    const cardColors = ["#FFB74D", "#64B5F6", "#F06292", "#81C784"];
    const cardBg = cardColors[index % cardColors.length];
    return (
      <View style={[styles.bookCard, { borderLeftWidth: 5, borderLeftColor: cardBg, backgroundColor: colors.cardBackground }]}>
      <View style={styles.bookHeader}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => {
            if (item.user?._id) {
              router.push({
                pathname: "/publicProfile",
                params: { userId: item.user._id }
              });
            }
          }}
        >
          <Image source={{ uri: item.user?.profileImage }} style={styles.avatar} />
          <Text style={[styles.username, { fontSize: getFontSize(13) }]}>{item.user?.username || "Unknown"}</Text>
        </TouchableOpacity>
        <Text style={[styles.timestamp, { fontSize: getFontSize(11) }]}>{formatPublishDate(item.createdAt)}</Text>
      </View>

      <View style={styles.bookImageContainer}>
        <Image source={item.image} style={styles.bookImage} contentFit="cover" />
      </View>

      <View style={styles.bookDetails}>
        <Text style={[styles.bookTitle, { fontSize: getFontSize(15) }]}>{item.title}</Text>
        <View style={styles.ratingContainer}>{renderRatingStars(item.rating)}</View>

        {/* Metadata Pills Row */}
        {(item.isFavorite || item.isReread || item.format || (item.tags && item.tags.length > 0)) && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginVertical: 6 }}>
            {item.isFavorite && (
              <View style={{ backgroundColor: "#FCE4EC", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: "#F8BBD0", flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="heart" size={11} color="#E91E63" style={{ marginRight: 2 }} />
                <Text style={{ fontSize: 10, color: "#E91E63", fontWeight: "bold" }}>Favorite</Text>
              </View>
            )}
            {item.isReread && (
              <View style={{ backgroundColor: "#E8F5E9", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: "#C8E6C9", flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="repeat" size={11} color="#4CAF50" style={{ marginRight: 2 }} />
                <Text style={{ fontSize: 10, color: "#4CAF50", fontWeight: "bold" }}>Re-read</Text>
              </View>
            )}
            {item.format && (
              <View style={{ backgroundColor: colors.inputBackground, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: "500" }}>{item.format}</Text>
              </View>
            )}
            {item.tags && item.tags.map((tag, tIdx) => (
              <View key={tIdx} style={{ backgroundColor: colors.inputBackground, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 0.5, borderColor: colors.border }}>
                <Text style={{ fontSize: 10, color: colors.textSecondary }}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.caption, { fontSize: getFontSize(13) }]}>{item.caption}</Text>
        
        {/* Interaction Actions */}
        <View style={styles.cardActionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleLikePress(item._id)}>
            <Ionicons
              name={item.isLikedByMe ? "heart" : "heart-outline"}
              size={18}
              color={item.isLikedByMe ? "#E91E63" : colors.textSecondary}
            />
            <Text style={[styles.actionText, { fontSize: getFontSize(12) }, item.isLikedByMe && { color: "#E91E63" }]}>
              {item.likesCount || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenComments(item)}>
            <Ionicons name="chatbubble-outline" size={17} color={colors.textSecondary} />
            <Text style={[styles.actionText, { fontSize: getFontSize(12) }]}>{item.commentsCount || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => handleSavePress(item._id)}>
            <Ionicons
              name={item.isSavedByMe ? "bookmark" : "bookmark-outline"}
              size={17}
              color={item.isSavedByMe ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.actionText, { fontSize: getFontSize(12) }, item.isSavedByMe && { color: colors.primary }]}>
              {item.isSavedByMe ? "Saved" : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

  if (loading) return <Loader />;

  const nowReadingPercentage = Math.round((currentBook.currentPage / currentBook.totalPages) * 100);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      
      <BubbleBackground />

      {/* 2. FLATLIST FOR FEED */}
      <FlatList
        data={filteredBooks}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchBooks(1, true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={
          <View style={{ marginBottom: 12 }}>
            {/* Top Bar with Sidebar Trigger & Search Bar */}
            <View style={styles.headerTopBar}>
              <TouchableOpacity style={styles.sidebarToggleBtn} onPress={openSidebar}>
                <Ionicons name="menu-outline" size={26} color={colors.primary} />
              </TouchableOpacity>
              
              <View style={styles.searchBarContainer}>
                <Ionicons name="search-outline" size={16} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                  placeholder="Search titles, authors, or curators..."
                  placeholderTextColor={colors.placeholderText}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchTextInput}
                />
              </View>
            </View>

            {/* Welcome banner text */}
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome back, {dbUser?.username || "gayatri"}!</Text>
              <Text style={styles.subtext}>Discover great reads from the community 🔍</Text>
            </View>

            {/* Now Reading playback widget */}
            <View style={styles.nowReadingCard}>
              <View style={styles.nowReadingStatusBadge}>
                <View style={[styles.pulseDot, !currentBook.isPlaying && { backgroundColor: colors.textSecondary }]} />
                <Text style={styles.nowReadingStatusText}>{currentBook.isPlaying ? "NOW READING" : "PAUSED"}</Text>
              </View>
              
              <View style={styles.nowReadingLayout}>
                <Image
                  source="https://res.cloudinary.com/dftde80n7/image/upload/v1781860387/kyth84lmxljbygxtdpl2.jpg"
                  style={styles.nowReadingCover}
                />
                
                <View style={styles.nowReadingMainInfo}>
                  <View style={styles.nowReadingTextRow}>
                    <View>
                      <Text style={[styles.nowReadingTitle, { fontSize: getFontSize(15) }]}>{currentBook.title}</Text>
                      <Text style={[styles.nowReadingAuthor, { fontSize: getFontSize(12) }]}>{currentBook.author}</Text>
                    </View>
                    
                    <View style={styles.playbackControls}>
                      <TouchableOpacity style={styles.controlBtn} onPress={togglePlayPause}>
                        <Ionicons name={currentBook.isPlaying ? "pause" : "play"} size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.controlBtn, styles.accentControl]}
                        onPress={() => {
                          setPageLogInput(currentBook.currentPage.toString());
                          setIsProgressModalVisible(true);
                        }}
                      >
                        <Text style={styles.accentControlText}>Log Pages</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Progress Line */}
                  <View style={styles.playbackProgressContainer}>
                    <View style={styles.playbackProgressBarTrack}>
                      <View style={[styles.playbackProgressBarFill, { width: `${nowReadingPercentage}%` }]} />
                    </View>
                    <View style={styles.playbackProgressLabels}>
                      <Text style={styles.playbackProgressPages}>Page {currentBook.currentPage} of {currentBook.totalPages}</Text>
                      <Text style={styles.playbackProgressPercent}>{nowReadingPercentage}% Complete</Text>
                    </View>
                  </View>

                </View>
              </View>
            </View>
            
            <Text style={styles.feedTitle}>Community Recommendations</Text>
          </View>
        }
        ListFooterComponent={
          hasMore && filteredBooks.length > 0 ? (
            <ActivityIndicator style={styles.footerLoader} size="small" color={colors.primary} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={50} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No recommendations found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search query or refresh to pull new books.</Text>
          </View>
        }
      />

      {/* 3. CUSTOM SLIDE-OUT DRAWER SIDEBAR */}
      {isSidebarOpen && (
        <>
          {/* Backdrop Shadow Overlay */}
          <TouchableOpacity activeOpacity={1} style={[styles.sidebarBackdrop, { zIndex: 998 }]} onPress={closeSidebar}>
            <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'black', opacity: sidebarBackdropOpacity }]} />
          </TouchableOpacity>

          {/* Sidebar Panel */}
          <Animated.View style={[styles.sidebarPanel, { transform: [{ translateX: sidebarTranslateX }], zIndex: 999 }]}>
            <BubbleBackground />
            <View style={styles.sidebarContent}>
              <View style={styles.sidebarLogoRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Image 
                    source={require("../../assets/images/book-haul-logo.png")} 
                    style={{ width: 28, height: 28, borderRadius: 6 }} 
                  />
                  <Text style={styles.sidebarLogoText}>BookHaul</Text>
                </View>
                <TouchableOpacity onPress={closeSidebar}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.sidebarNavContainer}>
                <TouchableOpacity style={[styles.sidebarNavItem, styles.activeNavItem]} onPress={closeSidebar}>
                  <Text style={styles.sidebarNavItemText}>🏠  Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sidebarNavItem} onPress={() => { closeSidebar(); router.push("/browse"); }}>
                  <Text style={styles.sidebarNavItemText}>🔍  Browse & Discover</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sidebarNavItem} onPress={() => { closeSidebar(); router.push("/library"); }}>
                  <Text style={styles.sidebarNavItemText}>📚  My Library & Hauls</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sidebarNavItem} onPress={() => { closeSidebar(); router.push("/circles"); }}>
                  <Text style={styles.sidebarNavItemText}>💬  Reading Circles</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sidebarNavItem} onPress={() => { closeSidebar(); router.push("/analytics"); }}>
                  <Text style={styles.sidebarNavItemText}>📊  Reading Analytics</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sidebarNavItem} onPress={() => { closeSidebar(); setIsSettingsModalVisible(true); }}>
                  <Text style={styles.sidebarNavItemText}>⚙️  Settings</Text>
                </TouchableOpacity>
              </View>

              {/* Sidebar challenge widget */}
              <View style={styles.sidebarChallengeWidget}>
                <Text style={styles.sidebarWidgetTitle}>2026 Challenge</Text>
                <View style={styles.sidebarChallengeLayout}>
                  <View style={styles.challengeRingPlaceholder}>
                    <Text style={styles.challengePercentText}>
                      {Math.round((challengeCount / challengeGoal) * 100)}%
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.challengeCountText}>{challengeCount} / {challengeGoal}</Text>
                    <Text style={styles.challengeLabelText}>books completed</Text>
                  </View>
                </View>
              </View>

              {/* Profile Footer */}
              <View style={styles.sidebarProfileFooter}>
                <TouchableOpacity
                  style={styles.profileMeta}
                  onPress={() => {
                    closeSidebar();
                    router.push("/profile");
                  }}
                >
                  <View style={styles.profileAvatar}>
                    <Text style={styles.avatarChar}>
                      {(dbUser?.username || "gayatri")[0].toLowerCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.profileUser}>{dbUser?.username || "gayatri"}</Text>
                    <Text style={styles.profileBadge}>{dbUser?.membershipTier || "Premium Member"}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sidebarLogoutBtn} onPress={handleLogout}>
                  <Text style={styles.logoutBtnText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </>
      )}

      {/* 4. LOG PAGES MODAL OVERLAY */}
      <Modal
        visible={isProgressModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsProgressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Pages</Text>
              <TouchableOpacity onPress={() => setIsProgressModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSub}>Update current page for Normal People</Text>
            
            <View style={styles.modalInputWrapper}>
              <TextInput
                style={styles.modalTextInput}
                keyboardType="number-pad"
                value={pageLogInput}
                onChangeText={setPageLogInput}
                autoFocus={true}
              />
              <Text style={styles.modalInputTotal}>/ {currentBook.totalPages}</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => setIsProgressModalVisible(false)}
              >
                <Text style={styles.modalBtnTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={handleLogPagesSubmit}
              >
                <Text style={styles.modalBtnTextPrimary}>Save Progress</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 5. COMMENTS MODAL OVERLAY */}
      <Modal
        visible={isCommentsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCommentsModalVisible(false)}
      >
        <View style={styles.commentsModalOverlay}>
          <View style={styles.commentsModalContent}>
            {/* Header */}
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments ({commentsList.length})</Text>
              <TouchableOpacity onPress={() => setIsCommentsModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Comments List */}
            {commentsLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ flex: 1 }} />
            ) : (
              <FlatList
                data={commentsList}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                style={styles.commentListContainer}
                renderItem={({ item }) => (
                  <View style={styles.commentRow}>
                    <TouchableOpacity
                      onPress={() => {
                        if (item.user?._id) {
                          setIsCommentsModalVisible(false);
                          router.push({
                            pathname: "/publicProfile",
                            params: { userId: item.user._id }
                          });
                        }
                      }}
                    >
                      <Image
                        source={item.user?.profileImage ? { uri: item.user.profileImage } : require("../../../assets/images/icon.png")}
                        style={styles.commentAvatar}
                      />
                    </TouchableOpacity>
                    <View style={styles.commentContentContainer}>
                      <View style={styles.commentUserHeader}>
                        <TouchableOpacity
                          onPress={() => {
                            if (item.user?._id) {
                              setIsCommentsModalVisible(false);
                              router.push({
                                pathname: "/publicProfile",
                                params: { userId: item.user._id }
                              });
                            }
                          }}
                        >
                          <Text style={[styles.commentUserText, { fontSize: getFontSize(12) }]}>{item.user?.username || "Unknown"}</Text>
                        </TouchableOpacity>
                        <Text style={[styles.commentTimeText, { fontSize: getFontSize(9) }]}>
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <Text style={[styles.commentBodyText, { fontSize: getFontSize(13) }]}>{item.content}</Text>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.commentsEmpty}>
                    <Ionicons name="chatbubbles-outline" size={40} color={colors.primary} />
                    <Text style={styles.commentsEmptyText}>No comments yet. Share your thoughts!</Text>
                  </View>
                }
              />
            )}

            {/* Input Footer */}
            <View style={styles.commentInputRow}>
              <TextInput
                style={[styles.commentInput, { fontSize: getFontSize(13) }]}
                placeholder="Add a comment..."
                placeholderTextColor={colors.placeholderText}
                value={newCommentText}
                onChangeText={setNewCommentText}
              />
              <TouchableOpacity style={styles.commentSendBtn} onPress={handlePostComment}>
                <Ionicons name="send" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 6. SETTINGS MODAL OVERLAY */}
      <Modal
        visible={isSettingsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: 320, padding: 24 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚙️ Settings</Text>
              <TouchableOpacity onPress={() => setIsSettingsModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 10 }} showsVerticalScrollIndicator={false}>
              
              {/* APPEARANCE CONFIG */}
              <Text style={[styles.label, { fontSize: 13, textTransform: "uppercase", color: colors.textSecondary, marginBottom: 8 }]}>Appearance</Text>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                <TouchableOpacity 
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: theme === "light" ? colors.primary + "15" : colors.inputBackground,
                    borderWidth: 1,
                    borderColor: theme === "light" ? colors.primary : colors.border
                  }}
                  onPress={() => setTheme("light")}
                >
                  <Ionicons name="sunny-outline" size={16} color={theme === "light" ? colors.primary : colors.textSecondary} />
                  <Text style={{ fontWeight: theme === "light" ? "700" : "500", color: theme === "light" ? colors.primary : colors.textSecondary }}>Light</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: theme === "dark" ? colors.primary + "15" : colors.inputBackground,
                    borderWidth: 1,
                    borderColor: theme === "dark" ? colors.primary : colors.border
                  }}
                  onPress={() => setTheme("dark")}
                >
                  <Ionicons name="moon-outline" size={16} color={theme === "dark" ? colors.primary : colors.textSecondary} />
                  <Text style={{ fontWeight: theme === "dark" ? "700" : "500", color: theme === "dark" ? colors.primary : colors.textSecondary }}>Dark</Text>
                </TouchableOpacity>
              </View>

              {/* FONT SIZE CONFIG */}
              <Text style={[styles.label, { fontSize: 13, textTransform: "uppercase", color: colors.textSecondary, marginBottom: 8 }]}>Reading Font Size</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                {["small", "normal", "large", "extra-large"].map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={{
                      flex: 1,
                      minWidth: 60,
                      alignItems: "center",
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: fontSizeMode === mode ? colors.primary + "15" : colors.inputBackground,
                      borderWidth: 1,
                      borderColor: fontSizeMode === mode ? colors.primary : colors.border
                    }}
                    onPress={() => setFontSizeMode(mode)}
                  >
                    <Text style={{ 
                      fontSize: mode === "small" ? 11 : mode === "normal" ? 13 : mode === "large" ? 15 : 17,
                      fontWeight: fontSizeMode === mode ? "700" : "500",
                      color: fontSizeMode === mode ? colors.primary : colors.textSecondary
                    }}>
                      A
                    </Text>
                    <Text style={{ fontSize: 9, color: fontSizeMode === mode ? colors.primary : colors.textSecondary, textTransform: "capitalize", marginTop: 2 }}>
                      {mode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* YEARLY READING CHALLENGE GOAL CONFIG */}
              <Text style={[styles.label, { fontSize: 13, textTransform: "uppercase", color: colors.textSecondary, marginBottom: 8 }]}>2026 Challenge Goal</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <TextInput
                  style={{
                    flex: 1,
                    height: 44,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 10,
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: "700",
                    backgroundColor: colors.inputBackground,
                    color: colors.textDark,
                  }}
                  keyboardType="number-pad"
                  value={settingsGoalInput}
                  onChangeText={setSettingsGoalInput}
                />
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 10,
                    height: 44,
                    paddingHorizontal: 16,
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  onPress={handleSaveSettingsGoal}
                  disabled={savingSettingsGoal}
                >
                  {savingSettingsGoal ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}
