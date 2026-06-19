import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, Dimensions } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function BubbleBackground() {
  const bubbleAnims = [
    useRef(new Animated.ValueXY({ x: 40, y: 150 })).current,
    useRef(new Animated.ValueXY({ x: screenWidth/2 - 40, y: 280 })).current,
    useRef(new Animated.ValueXY({ x: 70, y: 340 })).current,
    useRef(new Animated.ValueXY({ x: screenWidth/2 + 20, y: 200 })).current,
    useRef(new Animated.ValueXY({ x: 90, y: 390 })).current,
  ];

  useEffect(() => {
    const startFloating = (anim, startX, startY, endX, endY, duration) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: { x: endX, y: endY },
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: { x: startX, y: startY },
            duration: duration,
            useNativeDriver: true,
          })
        ])
      ).start();
    };

    startFloating(bubbleAnims[0], 40, 150, 120, 230, 14000);
    startFloating(bubbleAnims[1], screenWidth/2 - 40, 280, screenWidth/2 + 30, 330, 16000);
    startFloating(bubbleAnims[2], 70, 340, 150, 420, 20000);
    startFloating(bubbleAnims[3], screenWidth/2 + 20, 200, screenWidth/2 - 50, 260, 12000);
    startFloating(bubbleAnims[4], 90, 390, 180, 460, 15000);
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Animated.View style={[styles.bubble, { transform: bubbleAnims[0].getTranslateTransform(), width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(163,209,165,0.08)' }]} />
      <Animated.View style={[styles.bubble, { transform: bubbleAnims[1].getTranslateTransform(), width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(254,235,176,0.09)' }]} />
      <Animated.View style={[styles.bubble, { transform: bubbleAnims[2].getTranslateTransform(), width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(186,220,240,0.09)' }]} />
      <Animated.View style={[styles.bubble, { transform: bubbleAnims[3].getTranslateTransform(), width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(253,203,212,0.09)' }]} />
      <Animated.View style={[styles.bubble, { transform: bubbleAnims[4].getTranslateTransform(), width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(230,205,245,0.08)' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: "absolute",
    opacity: 0.8,
  },
});
