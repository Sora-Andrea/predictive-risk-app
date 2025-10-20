import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import { useIsFocused } from "@react-navigation/native";

type ScreenTransitionViewProps = {
  children: React.ReactNode;
};

export default function ScreenTransitionView({ children }: ScreenTransitionViewProps) {
  const isFocused = useIsFocused();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    const durationIn = 320;
    const durationOut = 200;
    const easing = Easing.out(Easing.cubic);

    const toValue = (value: number) =>
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: value,
          duration: value === 1 ? durationIn : durationOut,
          easing,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: value === 1 ? 0 : 24,
          duration: value === 1 ? durationIn : durationOut,
          easing,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: value === 1 ? 1 : 0.96,
          duration: value === 1 ? durationIn : durationOut,
          easing,
          useNativeDriver: true,
        }),
      ]);

    toValue(isFocused ? 1 : 0).start();
  }, [isFocused, opacity, scale, translateY]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
