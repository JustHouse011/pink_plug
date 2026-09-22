import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import { glass } from '@/constants/glass';
import { useTheme } from '@/context/ThemeProvider';
import AnimatedGradientBorder from './AnimatedGradientBorder';

export type GlassCardProps = Omit<ViewProps, 'style'> & {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  level?: 'subtle' | 'standard' | 'hero' | 'raised' | 'strong';
  gradientBorder?: 'subtle' | 'emphasized';
  edge?: 'none' | 'subtle' | 'glow';
};

export default function GlassCard({ children, style, intensity, level = 'standard', gradientBorder, edge, ...props }: GlassCardProps) {
  const { isDark } = useTheme();

  const glassTheme = isDark ? glass.dark : glass.light;
  const normalizedLevel = level === 'raised' ? 'hero' : level === 'strong' ? 'hero' : level;
  const surface = glassTheme[normalizedLevel];
  const defaultEdge = edge === 'none'
    ? undefined
    : normalizedLevel === 'hero'
      ? 'emphasized'
      : 'subtle';
  const edgeVariant = gradientBorder ?? (edge === 'glow' ? 'emphasized' : edge === 'subtle' ? 'subtle' : defaultEdge);
  const edgeColors = isDark
    ? (edgeVariant ? glass.gradientBorder[edgeVariant] : undefined)
    : (edgeVariant === 'emphasized' ? glass.gradientBorder.lightEmphasized : edgeVariant ? glass.gradientBorder.light : undefined);
  const flattenedStyle = StyleSheet.flatten(style) ?? {};
  const radius = typeof flattenedStyle.borderRadius === 'number' ? flattenedStyle.borderRadius : glass.radius;
  const edgeThickness = isDark ? 1 : 1.5;
  const hasGlow = isDark && (edge === 'glow' || (!edge && normalizedLevel === 'hero'));
  const outerLayout = {
    position: flattenedStyle.position,
    top: flattenedStyle.top,
    right: flattenedStyle.right,
    bottom: flattenedStyle.bottom,
    left: flattenedStyle.left,
    zIndex: flattenedStyle.zIndex,
    width: flattenedStyle.width,
    height: flattenedStyle.height,
    minWidth: flattenedStyle.minWidth,
    minHeight: flattenedStyle.minHeight,
    maxWidth: flattenedStyle.maxWidth,
    maxHeight: flattenedStyle.maxHeight,
    margin: flattenedStyle.margin,
    marginTop: flattenedStyle.marginTop,
    marginRight: flattenedStyle.marginRight,
    marginBottom: flattenedStyle.marginBottom,
    marginLeft: flattenedStyle.marginLeft,
    marginHorizontal: flattenedStyle.marginHorizontal,
    marginVertical: flattenedStyle.marginVertical,
    alignSelf: flattenedStyle.alignSelf,
  };

  const contentStyle = {
    ...flattenedStyle,
    position: undefined,
    top: undefined,
    right: undefined,
    bottom: undefined,
    left: undefined,
    zIndex: undefined,
    width: undefined,
    height: undefined,
    minWidth: undefined,
    minHeight: undefined,
    maxWidth: undefined,
    maxHeight: undefined,
    margin: undefined,
    marginTop: undefined,
    marginRight: undefined,
    marginBottom: undefined,
    marginLeft: undefined,
    marginHorizontal: undefined,
    marginVertical: undefined,
    alignSelf: undefined,
  };

  const card = (
    <BlurView
      intensity={intensity ?? surface.blurIntensity}
      tint={isDark ? 'dark' : 'light'}
      style={[styles.card, { backgroundColor: surface.background, borderColor: surface.border, shadowColor: glassTheme.shadow }, edgeVariant && styles.gradientInner, edgeVariant ? contentStyle : style, edgeVariant && styles.innerNoMargin, edgeVariant && { borderRadius: Math.max(radius - edgeThickness, 0) }, edgeVariant && Platform.OS !== 'web' && styles.nativeInnerNoShadow]}
      {...props}
    >
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.surfaceFill, { backgroundColor: surface.background, borderRadius: Math.max(radius - edgeThickness, 0) }]} />
      <View pointerEvents="none" style={[styles.reflection, isDark && styles.darkReflection]} />
      {children}
    </BlurView>
  );

  if (!edgeVariant || !edgeColors) {
    return card;
  }

  return (
    <AnimatedGradientBorder
      borderRadius={radius}
      borderWidth={edgeThickness}
      colors={edgeColors}
      duration={hasGlow ? 4000 : 4600}
      intensity={hasGlow ? 1 : 0.82}
      style={[styles.gradientFrame, outerLayout, hasGlow && (Platform.OS === 'web' ? styles.gradientGlow : styles.nativeGradientGlow)]}
    >
      {card}
    </AnimatedGradientBorder>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: glass.radius,
    overflow: 'hidden',
    borderWidth: 1,
    padding: 16,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  gradientFrame: {
    borderRadius: glass.radius,
    overflow: 'hidden',
  },
  gradientGlow: {
    shadowColor: '#B96CFF',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  nativeGradientGlow: {
    // A border-box shadow has a fixed silhouette independent of gradient alpha.
    boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 8, color: 'rgba(185, 108, 255, 0.22)' }],
  },
  nativeInnerNoShadow: {
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    boxShadow: [],
  },
  gradientInner: {
    borderWidth: 0,
    shadowOpacity: 0.1,
  },
  innerNoMargin: {
    margin: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginHorizontal: 0,
    marginVertical: 0,
  },
  reflection: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  surfaceFill: {
    overflow: 'hidden',
  },
  darkReflection: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
