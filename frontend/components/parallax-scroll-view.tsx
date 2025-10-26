import React, { forwardRef, useImperativeHandle } from 'react';
import type { PropsWithChildren, ReactElement } from 'react';
import type { ColorValue } from 'react-native';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

const HEADER_HEIGHT = 250;

type ColorStops = readonly [ColorValue, ColorValue, ...ColorValue[]];
type LocationStops = readonly [number, number, ...number[]];

type HeaderGradientConfig = {
  light: ColorStops;
  dark?: ColorStops;
  locations?: LocationStops;
};

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor?: { dark: string; light: string };
  headerBackgroundGradient?: HeaderGradientConfig;
}>;

const ParallaxScrollView = forwardRef<Animated.ScrollView, Props>(function ParallaxScrollView(
  {
    children,
    headerImage,
    headerBackgroundColor,
    headerBackgroundGradient,
  },
  ref
) {
  const backgroundColor = useThemeColor({}, 'background');
  const colorScheme = useColorScheme() ?? 'light';
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);
  useImperativeHandle(ref, () => scrollRef.current!);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(scrollOffset.value, [-HEADER_HEIGHT, 0, HEADER_HEIGHT], [2, 1, 1]),
        },
      ],
    };
  });

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={{ backgroundColor, flex: 1 }}
      scrollEventThrottle={16}>
      <Animated.View
        style={[
          styles.header,
          headerAnimatedStyle,
        ]}>
        {headerBackgroundGradient ? (
          <LinearGradient
            colors={
              headerBackgroundGradient.dark && colorScheme === 'dark'
                ? headerBackgroundGradient.dark
                : headerBackgroundGradient.light
            }
            locations={headerBackgroundGradient.locations}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor:
                  headerBackgroundColor?.[colorScheme] ?? 'transparent',
              },
            ]}
          />
        )}
        {headerImage}
      </Animated.View>
      <ThemedView style={styles.content}>{children}</ThemedView>
    </Animated.ScrollView>
  );
});

export default ParallaxScrollView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: 'hidden',
  },
});
