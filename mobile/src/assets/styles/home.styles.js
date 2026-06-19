// styles/home.styles.js
import { StyleSheet, Dimensions } from "react-native";
import COLORS from "../../constants/colors";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export const createStyles = (colors = COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  
  // Floating Bubble particles
  bubble: {
    position: "absolute",
    opacity: 0.8,
  },

  // Top header bar
  headerTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 16,
    gap: 12,
  },
  sidebarToggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 22,
    paddingHorizontal: 16,
    height: 44,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textDark,
    fontFamily: "Inter",
  },

  // Welcome section
  welcomeContainer: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primary, // periwinkle slate blue
    marginBottom: 2,
  },
  subtext: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Now Reading Card (Now Playing style)
  nowReadingCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  nowReadingStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent, // warm terracotta peach
    marginRight: 6,
  },
  nowReadingStatusText: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  nowReadingLayout: {
    flexDirection: "row",
    gap: 16,
  },
  nowReadingCover: {
    width: 60,
    height: 90,
    borderRadius: 6,
  },
  nowReadingMainInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  nowReadingTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  nowReadingTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  nowReadingAuthor: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  playbackControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  controlBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.inputBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  accentControl: {
    width: "auto",
    height: "auto",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  accentControlText: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.white,
  },
  playbackProgressContainer: {
    marginTop: 10,
  },
  playbackProgressBarTrack: {
    height: 4,
    backgroundColor: colors.inputBackground,
    borderRadius: 2,
    width: "100%",
  },
  playbackProgressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  playbackProgressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  playbackProgressPages: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  playbackProgressPercent: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.primary,
  },

  // Feed section titles
  feedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },

  // Feed recommendation card
  bookCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  username: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  bookImageContainer: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 10,
    backgroundColor: colors.border,
  },
  bookImage: {
    width: "100%",
    height: "100%",
  },
  bookDetails: {
    padding: 2,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    marginBottom: 6,
  },
  caption: {
    fontSize: 13,
    color: colors.textDark,
    marginBottom: 12,
    lineHeight: 18,
  },

  // Card interaction actions container
  cardActionsContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginTop: 4,
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Sidebar Drawer Drawer Styles
  sidebarBackdrop: {
    position: "absolute",
    width: screenWidth,
    height: screenHeight,
  },
  sidebarPanel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 260,
    backgroundColor: colors.white,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    overflow: "hidden",
  },
  sidebarContent: {
    flex: 1,
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  sidebarLogoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  sidebarLogoText: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primary,
  },
  sidebarNavContainer: {
    flex: 1,
    gap: 6,
  },
  sidebarNavItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  activeNavItem: {
    backgroundColor: colors.inputBackground,
  },
  sidebarNavItemText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  
  // Challenge Widget in Sidebar
  sidebarChallengeWidget: {
    marginVertical: 20,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sidebarWidgetTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  sidebarChallengeLayout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  challengeRingPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  challengePercentText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
  },
  challengeCountText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  challengeLabelText: {
    fontSize: 10,
    color: colors.textSecondary,
  },

  // Profile footer in Sidebar
  sidebarProfileFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  profileMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarChar: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
  profileUser: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  profileBadge: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  sidebarLogoutBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutBtnText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  // Modal Overlays
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(30, 42, 56, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: 300,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  modalInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  modalTextInput: {
    width: 70,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    backgroundColor: colors.inputBackground,
    color: colors.textDark,
  },
  modalInputTotal: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  modalBtnSecondary: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalBtnPrimary: {
    backgroundColor: colors.primary,
  },
  modalBtnTextSecondary: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  modalBtnTextPrimary: {
    fontSize: 12,
    color: colors.white,
    fontWeight: "600",
  },

  // Default Loader and Lists
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 10,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
  },
  footerLoader: {
    marginVertical: 16,
  },

  // --- COMMENTS MODAL STYLES ---
  commentsModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  commentsModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: screenHeight * 0.75,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
    marginBottom: 12,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  commentListContainer: {
    flex: 1,
  },
  commentRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentContentContainer: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentUserHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  commentUserText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  commentTimeText: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  commentBodyText: {
    fontSize: 13,
    color: colors.textDark,
    lineHeight: 17,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    gap: 10,
  },
  commentInput: {
    flex: 1,
    height: 40,
    backgroundColor: colors.inputBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 13,
    color: colors.textDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  commentsEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  commentsEmptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
});

export default createStyles;
