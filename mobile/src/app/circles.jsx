import React, { useEffect, useState, useRef } from "react";
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
  KeyboardAvoidingView,
  Platform,
  RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { io } from "socket.io-client";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { API_URL } from "../constants/api";
import BubbleBackground from "../components/BubbleBackground";

export default function Circles() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const { colors, fontSizeMode } = useThemeStore();
  const styles = createStyles(colors);

  const [circles, setCircles] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active Chat Console State
  const [activeCircle, setActiveCircle] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [messageSpoilerPage, setMessageSpoilerPage] = useState("");
  const [isSpoilerChecked, setIsSpoilerChecked] = useState(false);
  const [userProgressPage, setUserProgressPage] = useState(0);

  const socketRef = useRef(null);

  // Modal forms
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newCircleName, setNewCircleName] = useState("");
  const [newCircleDesc, setNewCircleDesc] = useState("");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [milestonePage, setMilestonePage] = useState("");
  const [creatingCircle, setCreatingCircle] = useState(false);

  const flatListRef = useRef();

  // Fetch Circles and Catalog Books for Curation dropdown
  const fetchData = async () => {
    try {
      setLoading(true);
      const circleRes = await fetch(`${API_URL}/circles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const circleData = await circleRes.json();
      if (circleRes.ok) {
        setCircles(circleData);
      }

      const bookRes = await fetch(`${API_URL}/library/catalog`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const bookData = await bookRes.json();
      if (bookRes.ok) {
        setBooks(bookData);
      }
    } catch (error) {
      console.error("Fetch circles error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Create a new circle
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
        Alert.alert("Created! 💬", `Circle "${data.name}" is now live!`);
      } else {
        Alert.alert("Error", data.message || "Failed to create circle");
      }
    } catch (error) {
      console.error("Create circle error:", error);
    } finally {
      setCreatingCircle(false);
    }
  };

  // Join Circle
  const handleJoinCircle = async (circleId) => {
    try {
      const res = await fetch(`${API_URL}/circles/${circleId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setCircles(prev => prev.map(c => (c._id === circleId ? data : c)));
        Alert.alert("Joined!", "You are now a member of this reading circle.");
      } else {
        Alert.alert("Error", data.message || "Failed to join circle");
      }
    } catch (error) {
      console.error("Join circle error:", error);
    }
  };

  // Fetch chat messages of circle
  const handleOpenChat = async (circle) => {
    setActiveCircle(circle);
    setLoadingMessages(true);

    let currentProgress = 0;
    try {
      const libRes = await fetch(`${API_URL}/library`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const libData = await libRes.json();
      if (libRes.ok && circle.currentBook) {
        const currentBookId = circle.currentBook._id || circle.currentBook;
        const matchingBook = libData.find(item => item.book?._id === currentBookId);
        if (matchingBook) {
          currentProgress = matchingBook.currentPage || 0;
        }
      }
    } catch (error) {
      console.error("Fetch library progress error:", error);
    }
    setUserProgressPage(currentProgress);

    try {
      const res = await fetch(`${API_URL}/circles/${circle._id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(data);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error("Fetch messages error:", error);
    } finally {
      setLoadingMessages(false);
    }

    // Set up Socket.io connection
    try {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      const socketUrl = API_URL.replace("/api", "");
      const socket = io(socketUrl);
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("Connected to socket server");
        socket.emit("join_circle", circle._id);
      });

      socket.on("new_message", (newMsg) => {
        setMessages((prev) => {
          if (prev.some(m => m._id === newMsg._id)) {
            return prev;
          }
          return [...prev, newMsg];
        });
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });

      socket.on("disconnect", () => {
        console.log("Disconnected from socket server");
      });
    } catch (socketError) {
      console.error("Socket connection error:", socketError);
    }
  };

  // Send a chat message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeCircle) return;

    const spoilerVal = isSpoilerChecked && messageSpoilerPage ? parseInt(messageSpoilerPage) : 0;
    
    // Clear inputs immediately for responsive feedback
    const msgText = newMessage;
    setNewMessage("");
    setMessageSpoilerPage("");
    setIsSpoilerChecked(false);

    try {
      const res = await fetch(`${API_URL}/circles/${activeCircle._id}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: msgText,
          spoilerPage: spoilerVal,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(prev => {
          if (prev.some(m => m._id === data._id)) {
            return prev;
          }
          return [...prev, data];
        });
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error("Post message error:", error);
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (activeCircle) {
              if (socketRef.current) {
                socketRef.current.emit("leave_circle", activeCircle._id);
                socketRef.current.disconnect();
                socketRef.current = null;
              }
              setActiveCircle(null);
              setMessages([]);
            } else {
              router.back();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {activeCircle ? activeCircle.name : "Reading Circles"}
        </Text>
        <TouchableOpacity
          style={styles.rightHeaderButton}
          onPress={() => {
            if (!activeCircle) {
              setIsCreateModalVisible(true);
            } else {
              // Refresh active chat
              handleOpenChat(activeCircle);
            }
          }}
        >
          <Ionicons name={activeCircle ? "refresh" : "add"} size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {!activeCircle ? (
        // LIST OF READING CIRCLES
        loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
        ) : (
          <FlatList
            data={circles}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />
            }
            renderItem={({ item, index }) => {
              const isJoined = item.members?.some(m => m === user?._id || m._id === user?._id);
              const currentBookTitle = item.currentBook?.title || "No current book";
              const cardColors = ["#FFB74D", "#64B5F6", "#F06292", "#81C784"];
              const cardBg = cardColors[index % cardColors.length];
 
              return (
                <View style={[styles.circleCard, { borderLeftWidth: 5, borderLeftColor: cardBg, backgroundColor: colors.cardBackground }]}>
                  <View style={styles.circleHeader}>
                    <Text style={[styles.circleName, { fontSize: getFontSize(16) }]}>{item.name}</Text>
                    <View style={styles.memberBadge}>
                      <Ionicons name="people" size={12} color={colors.textSecondary} />
                      <Text style={styles.memberText}>{item.members?.length || 0}</Text>
                    </View>
                  </View>

                  <Text style={[styles.circleDesc, { fontSize: getFontSize(13) }]}>{item.description}</Text>

                  {/* Book details */}
                  <View style={styles.bookRow}>
                    <Ionicons name="book-outline" size={14} color={colors.textPrimary} />
                    <Text style={[styles.bookText, { fontSize: getFontSize(12) }]}>
                      Reading: <Text style={{ fontWeight: "bold" }}>{currentBookTitle}</Text>
                    </Text>
                  </View>

                  {item.milestonePage > 0 && (
                    <View style={styles.milestoneRow}>
                      <Ionicons name="warning-outline" size={14} color="#FF9800" />
                      <Text style={styles.milestoneText}>
                        Spoiler Milestone: Page {item.milestonePage}
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    {isJoined ? (
                      <TouchableOpacity style={styles.enterChatBtn} onPress={() => handleOpenChat(item)}>
                        <Ionicons name="chatbubbles-outline" size={14} color={colors.white} />
                        <Text style={styles.enterChatText}>Open Circle Chat</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.joinBtn} onPress={() => handleJoinCircle(item._id)}>
                        <Ionicons name="enter-outline" size={14} color={colors.primary} />
                        <Text style={styles.joinBtnText}>Join Circle</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={54} color={colors.textSecondary} />
                <Text style={styles.emptyText}>No reading circles found</Text>
                <Text style={styles.emptySubtext}>Create one with the + icon above to start discussing!</Text>
              </View>
            }
          />
        )
      ) : (
        // ACTIVE CIRCLE CHAT INTERFACE
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={80}
        >
          {loadingMessages ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item, index) => item._id || index.toString()}
              contentContainerStyle={styles.chatListContainer}
              renderItem={({ item }) => {
                const isMe = item.sender?._id === user?._id || item.sender === user?._id;
                const senderName = item.sender?.username || "Unknown";
                const isMsgLocked = item.isLocked || (item.spoilerPage > 0 && !isMe && userProgressPage < item.spoilerPage);

                return (
                  <View style={[styles.messageWrapper, isMe ? styles.myMessage : styles.theirMessage]}>
                    {!isMe && (
                      <TouchableOpacity
                        onPress={() => {
                          const sId = item.sender?._id || item.sender;
                          if (sId) {
                            router.push({
                              pathname: "/publicProfile",
                              params: { userId: sId }
                            });
                          }
                        }}
                      >
                        <Text style={[styles.senderLabel, { fontSize: getFontSize(10) }]}>{senderName}</Text>
                      </TouchableOpacity>
                    )}
                    
                    <View
                      style={[
                        styles.messageBubble,
                        isMe ? styles.myBubble : styles.theirBubble,
                        isMsgLocked && styles.lockedBubble
                      ]}
                    >
                      {isMsgLocked ? (
                        <View style={styles.lockedContent}>
                          <Ionicons name="lock-closed" size={18} color="#FF9800" style={{ marginBottom: 4 }} />
                          <Text style={styles.lockedText}>Spoiler Locked</Text>
                          <Text style={styles.lockedDesc}>
                            Update page progress in Library to read. (Milestone: Page {item.spoilerPage})
                          </Text>
                        </View>
                      ) : (
                        <>
                          <Text style={[styles.messageText, isMe ? styles.myMsgText : styles.theirMsgText, { fontSize: getFontSize(14) }]}>
                            {item.content}
                          </Text>
                          {item.spoilerPage > 0 && (
                            <View style={styles.spoilerBadge}>
                              <Text style={styles.spoilerBadgeText}>Spoiler (Pg {item.spoilerPage})</Text>
                            </View>
                          )}
                        </>
                      )}
                    </View>
                    <Text style={styles.messageTime}>
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.commentsEmpty}>
                  <Ionicons name="chatbubbles-outline" size={40} color={colors.textSecondary} />
                  <Text style={styles.commentsEmptyText}>No discussion yet. Break the ice!</Text>
                </View>
              }
            />
          )}

          {/* Spoiler control bar */}
          {isSpoilerChecked && (
            <View style={styles.spoilerInputBar}>
              <Ionicons name="eye-off" size={14} color="#FF9800" />
              <Text style={styles.spoilerBarText}>Hide content until reader reaches page:</Text>
              <TextInput
                style={styles.spoilerMiniInput}
                placeholder="e.g. 150"
                keyboardType="number-pad"
                value={messageSpoilerPage}
                onChangeText={setMessageSpoilerPage}
              />
            </View>
          )}

          {/* Chat Footer Box */}
          <View style={styles.chatFooter}>
            <TouchableOpacity
              style={[styles.spoilerToggle, isSpoilerChecked && styles.spoilerToggleActive]}
              onPress={() => setIsSpoilerChecked(!isSpoilerChecked)}
            >
              <Ionicons name="eye-off-outline" size={20} color={isSpoilerChecked ? "#FF9800" : colors.textSecondary} />
            </TouchableOpacity>

            <TextInput
              style={[styles.chatInput, { fontSize: getFontSize(14) }]}
              placeholder="Send message to circle..."
              placeholderTextColor={colors.placeholderText}
              value={newMessage}
              onChangeText={setNewMessage}
            />

            <TouchableOpacity style={styles.chatSendBtn} onPress={handleSendMessage}>
              <Ionicons name="send" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* MODAL: CREATE READING CIRCLE */}
      <Modal visible={isCreateModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Reading Circle</Text>
              <TouchableOpacity onPress={() => setIsCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Circle Name</Text>
              <TextInput style={styles.input} placeholder="e.g. Sally Rooney Fans" value={newCircleName} onChangeText={setNewCircleName} />

              <Text style={styles.label}>Description</Text>
              <TextInput style={styles.input} placeholder="e.g. Discussing all Sally Rooney works." value={newCircleDesc} onChangeText={setNewCircleDesc} />

              <Text style={styles.label}>Select Current Book (Optional)</Text>
              <View style={styles.pickerWrapper}>
                <ScrollView style={{ maxHeight: 120 }}>
                  {books.map(b => (
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

              <Text style={styles.label}>Spoiler Milestone Page (Optional)</Text>
              <TextInput style={styles.input} placeholder="e.g. 150" keyboardType="number-pad" value={milestonePage} onChangeText={setMilestonePage} />

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateCircle} disabled={creatingCircle}>
                {creatingCircle ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.submitBtnText}>Launch Curation Circle</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
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
  rightHeaderButton: {
    padding: 4,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  circleCard: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  circleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  circleName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  memberText: {
    fontSize: 10,
    color: colors.textPrimary,
    fontWeight: "bold",
    marginLeft: 4,
  },
  circleDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  bookRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  bookText: {
    fontSize: 12,
    color: colors.textDark,
    marginLeft: 6,
  },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  milestoneText: {
    fontSize: 11,
    color: "#FF9800",
    fontWeight: "600",
    marginLeft: 6,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  joinBtnText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    marginLeft: 4,
  },
  enterChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  enterChatText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: "600",
    marginLeft: 4,
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
  chatListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
  },
  messageWrapper: {
    marginBottom: 14,
    maxWidth: "80%",
  },
  myMessage: {
    alignSelf: "flex-end",
  },
  theirMessage: {
    alignSelf: "flex-start",
  },
  senderLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 4,
    marginLeft: 4,
  },
  messageBubble: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  myBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  lockedBubble: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  myMsgText: {
    color: colors.white,
  },
  theirMsgText: {
    color: colors.textDark,
  },
  spoilerBadge: {
    backgroundColor: "rgba(255, 90, 0, 0.08)",
    alignSelf: "flex-start",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginTop: 6,
  },
  spoilerBadgeText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "bold",
  },
  lockedContent: {
    alignItems: "center",
    paddingVertical: 6,
  },
  lockedText: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.primary,
  },
  lockedDesc: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  messageTime: {
    fontSize: 9,
    color: colors.placeholderText,
    marginTop: 2,
    alignSelf: "flex-end",
    marginRight: 4,
  },
  chatFooter: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: colors.cardBackground,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  spoilerToggle: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  spoilerToggleActive: {
    borderColor: "#FF9800",
    backgroundColor: "rgba(255, 152, 0, 0.1)",
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    height: 40,
    paddingHorizontal: 16,
    fontSize: 14,
    color: colors.textDark,
  },
  chatSendBtn: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  spoilerInputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 152, 0, 0.1)",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderColor: "rgba(255, 152, 0, 0.2)",
  },
  spoilerBarText: {
    fontSize: 11,
    color: "#E65100",
    marginLeft: 6,
    flex: 1,
  },
  spoilerMiniInput: {
    borderWidth: 1,
    borderColor: "#FFB74D",
    borderRadius: 6,
    backgroundColor: colors.cardBackground,
    width: 50,
    height: 28,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
    color: colors.textDark,
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
  pickerWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.inputBackground,
    padding: 6,
    marginBottom: 10,
  },
  pickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  pickerItemActive: {
    backgroundColor: colors.primary + "15",
  },
  pickerText: {
    fontSize: 12,
    color: colors.textDark,
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
  subtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginVertical: 10,
  },
  commentsEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  commentsEmptyText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
});
