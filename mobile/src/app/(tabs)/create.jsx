import { useState, useRef } from "react";
import {
  View,
  Text,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  PanResponder,
} from "react-native";
import { useRouter } from "expo-router";
import createStyles from "../../assets/styles/create.styles";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import BubbleBackground from "../../components/BubbleBackground";

import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { API_URL } from "../../constants/api";

export default function Create() {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [rating, setRating] = useState(3);
  const [image, setImage] = useState(null); // to display the selected image
  const [imageBase64, setImageBase64] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isReread, setIsReread] = useState(false);
  const [format, setFormat] = useState("Physical Book");
  const [tagsInput, setTagsInput] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { token } = useAuthStore();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        return isHorizontal && Math.abs(gestureState.dx) > 15;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -100 || gestureState.vx < -0.4) {
          router.push("/profile");
        } else if (gestureState.dx > 100 || gestureState.vx > 0.4) {
          router.push("/");
        }
      },
    })
  ).current;

  console.log(token);

  const pickImage = async () => {
    try {
      // request permission if needed
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== "granted") {
          Alert.alert("Permission Denied", "We need camera roll permissions to upload an image");
          return;
        }
      }

      // launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5, // lower quality for smaller base64
        base64: true,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);

        // if base64 is provided, use it

        if (result.assets[0].base64) {
          setImageBase64(result.assets[0].base64);
        } else {
          // otherwise, convert to base64
          const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          setImageBase64(base64);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "There was a problem selecting your image");
    }
  };

  const handleSubmit = async () => {
    if (!title || !caption || !imageBase64 || !rating) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setLoading(true);

      // get file extension from URI or default to jpeg
      const uriParts = image.split(".");
      const fileType = uriParts[uriParts.length - 1];
      const imageType = fileType ? `image/${fileType.toLowerCase()}` : "image/jpeg";

      const imageDataUrl = `data:${imageType};base64,${imageBase64}`;

      const tags = tagsInput
        ? tagsInput.split(",").map((t) => t.trim()).filter((t) => t.length > 0)
        : [];

      const response = await fetch(`${API_URL}/books`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          caption,
          rating: rating.toString(),
          image: imageDataUrl,
          isFavorite,
          isReread,
          format,
          tags,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong");

      Alert.alert("Success", "Your book recommendation has been posted!");
      setTitle("");
      setCaption("");
      setRating(3);
      setImage(null);
      setImageBase64(null);
      setIsFavorite(false);
      setIsReread(false);
      setFormat("Physical Book");
      setTagsInput("");
      router.push("/");
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const renderRatingPicker = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)} style={styles.starButton}>
          <Ionicons
            name={i <= rating ? "star" : "star-outline"}
            size={32}
            color={i <= rating ? colors.accent : colors.textSecondary}
          />
        </TouchableOpacity>
      );
    }
    return <View style={styles.ratingContainer}>{stars}</View>;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} {...panResponder.panHandlers}>
      <BubbleBackground />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView 
          contentContainerStyle={[styles.container, { backgroundColor: "transparent" }]} 
          style={[styles.scrollViewStyle, { backgroundColor: "transparent" }]}
        >
          <View style={styles.card}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Book Recommendation</Text>
            <Text style={styles.subtitle}>Share your favorite reads with others</Text>
          </View>

          <View style={styles.form}>
            {/* BOOK TITLE */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Book Title</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="book-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter book title"
                  placeholderTextColor={colors.placeholderText}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>

            {/* RATING */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Your Rating</Text>
              {renderRatingPicker()}
            </View>

            {/* IMAGE */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Book Image</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.previewImage} />
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
                    <Text style={styles.placeholderText}>Tap to select image</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* REVIEW DETAILS (Favorite, Re-read) */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, isFavorite && styles.toggleBtnActive]}
                onPress={() => setIsFavorite(!isFavorite)}
              >
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={20}
                  color={isFavorite ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.toggleBtnText, isFavorite && styles.toggleBtnTextActive]}>
                  Favorite
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleBtn, isReread && styles.toggleBtnActive]}
                onPress={() => setIsReread(!isReread)}
              >
                <Ionicons
                  name={isReread ? "repeat" : "repeat-outline"}
                  size={20}
                  color={isReread ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.toggleBtnText, isReread && styles.toggleBtnTextActive]}>
                  Re-read
                </Text>
              </TouchableOpacity>
            </View>

            {/* FORMAT READ */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Reading Format</Text>
              <View style={styles.formatRow}>
                {["Physical Book", "E-Book", "Audiobook"].map((fmt) => (
                  <TouchableOpacity
                    key={fmt}
                    style={[styles.formatBtn, format === fmt && styles.formatBtnActive]}
                    onPress={() => setFormat(fmt)}
                  >
                    <Text style={[styles.formatBtnText, format === fmt && styles.formatBtnTextActive]}>
                      {fmt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* TAGS INPUT */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tags (comma separated)</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="pricetags-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. fantasy, romance, thriller"
                  placeholderTextColor={colors.placeholderText}
                  value={tagsInput}
                  onChangeText={setTagsInput}
                />
              </View>
            </View>

            {/* CAPTION */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Caption</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Write your review or thoughts about this book..."
                placeholderTextColor={colors.placeholderText}
                value={caption}
                onChangeText={setCaption}
                multiline
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={20}
                    color={colors.white}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>Share</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
