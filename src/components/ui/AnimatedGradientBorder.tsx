import { LinearGradient } from 'expo-linear-gradient';
import { AccessibilityInfo, Platform, processColor, StyleSheet, View } from 'react-native';
import { useEffect, useId, useState, type ReactNode } from 'react';
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';
import type { StyleProp, ViewStyle } from 'react-native';

type AnimatedGradientBorderProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius: number;
  borderWidth?: number;
  colors: readonly [string, string, ...string[]];
  duration?: number;
  intensity?: number;
};

const AnimatedSvgGradient = Animated.createAnimatedComponent(SvgLinearGradient);

export default function AnimatedGradientBorder({
  children,
  style,
  borderRadius,
  borderWidth = 1.5,
  colors,
  duration = 4600,
  intensity = 1,
}: AnimatedGradientBorderProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const rotation = useSharedValue(0);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const gradientId = `border-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  useEffect(() => {
    let isActive = true;

    const updateMotionPreference = async () => {
      const prefersReducedMotion = await AccessibilityInfo.isReduceMotionEnabled();
      if (isActive) {
        setReducedMotion(prefersReducedMotion);
      }
    };

    updateMotionPreference();

    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      if (isActive) {
        setReducedMotion(value);
      }
    });

    return () => {
      isActive = false;
      listener.remove();
    };
  }, []);

  useEffect(() => {
    rotation.value = reducedMotion
      ? withTiming(0, { duration: 180, easing: Easing.out(Easing.quad) })
      : withRepeat(
          withTiming(360, { duration, easing: Easing.linear }),
          -1,
          false,
        );
  }, [duration, reducedMotion, rotation]);

  const rotatingGradientStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const innerRadius = Math.max(borderRadius - borderWidth, 0);

  // Rotate the paint coordinates, never the rounded outline, glass, or glow.
  const gradientProps = useAnimatedProps(() => {
    const angle = rotation.value * Math.PI / 180;
    const x = Math.cos(angle) / 2;
    const y = Math.sin(angle) / 2;
    return { x1: 0.5 - x, y1: 0.5 - y, x2: 0.5 + x, y2: 0.5 + y };
  });

  if (Platform.OS !== 'web') {
    const strokeRadius = Math.max(0, Math.min(borderRadius, size.width / 2, size.height / 2) - borderWidth / 2);

    return (
      <View
        pointerEvents="box-none"
        style={[{ borderRadius }, style, styles.nativeWrapper]}
        onLayout={({ nativeEvent: { layout } }) => {
          setSize((current) => current.width === layout.width && current.height === layout.height
            ? current
            : { width: layout.width, height: layout.height });
        }}
      >
        <View style={[styles.staticInner, { margin: borderWidth, borderRadius: innerRadius }]}>
          {children}
        </View>
        {size.width > borderWidth && size.height > borderWidth && (
          <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={size.width} height={size.height}>
            <Defs>
              <AnimatedSvgGradient id={gradientId} gradientUnits="objectBoundingBox" animatedProps={gradientProps}>
                {colors.map((color, index) => {
                  // SVG stops need explicit opacity to preserve the RGBA palette.
                  const argb = processColor(color);
                  const alpha = typeof argb === 'number' ? (argb >>> 24) / 255 : 1;
                  const isPearl = typeof argb === 'number' && (argb & 0xffffff) === 0xffffff;
                  return <Stop key={index} offset={index / (colors.length - 1)} stopColor={color} stopOpacity={isPearl ? Math.max(alpha, 0.85) : alpha} />;
                })}
              </AnimatedSvgGradient>
            </Defs>
            <Rect
              x={borderWidth / 2}
              y={borderWidth / 2}
              width={size.width - borderWidth}
              height={size.height - borderWidth}
              rx={strokeRadius}
              ry={strokeRadius}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={borderWidth}
              opacity={intensity}
            />
          </Svg>
        )}
      </View>
    );
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { borderRadius }, style]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.rotatingGradientLayer,
          {
            borderRadius: borderRadius * 1.8,
            opacity: intensity,
          },
          rotatingGradientStyle,
        ]}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0.02, y: 0.15 }}
          end={{ x: 0.94, y: 0.82 }}
          style={styles.gradient}
        />
      </Animated.View>

      <View
        style={[
          styles.staticInner,
          {
            margin: borderWidth,
            borderRadius: innerRadius,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nativeWrapper: {
    // Only the inner glass clips content; the stationary outer glow stays visible.
    overflow: 'visible',
  },
  wrapper: {
    overflow: 'hidden',
  },
  rotatingGradientLayer: {
    position: 'absolute',
    width: '180%',
    height: '180%',
    left: '-40%',
    top: '-40%',
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  staticInner: {
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
});
