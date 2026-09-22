import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeProvider';
import { colors, prideSpectrum } from '@/constants/colors';

type AmbientPillConfig = {
  style: object;
  duration: number;
  driftX: number;
  driftY: number;
  rotation: number;
  scaleRange: number[];
  delay: number;
  gradientColors: readonly [string, string, ...string[]];
};

function AmbientPill({ config, reducedMotion, isDark }: { config: AmbientPillConfig; reducedMotion: boolean; isDark: boolean }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      translateX.value = 0;
      translateY.value = 0;
      rotation.value = 0;
      scale.value = 1;
      return;
    }

    const driftSequenceX = withSequence(
      withTiming(config.driftX * 1.15, { duration: config.duration * 0.42, easing: Easing.inOut(Easing.sin) }),
      withTiming(-config.driftX * 0.8, { duration: config.duration * 0.58, easing: Easing.inOut(Easing.sin) }),
      withTiming(config.driftX * 0.5, { duration: config.duration * 0.5, easing: Easing.inOut(Easing.sin) }),
      withTiming(0, { duration: config.duration * 0.5, easing: Easing.inOut(Easing.sin) }),
    );

    const driftSequenceY = withSequence(
      withTiming(-config.driftY * 0.9, { duration: config.duration * 0.55, easing: Easing.inOut(Easing.sin) }),
      withTiming(config.driftY * 1.2, { duration: config.duration * 0.72, easing: Easing.inOut(Easing.sin) }),
      withTiming(-config.driftY * 0.4, { duration: config.duration * 0.46, easing: Easing.inOut(Easing.sin) }),
      withTiming(0, { duration: config.duration * 0.47, easing: Easing.inOut(Easing.sin) }),
    );

    const rotationSequence = withSequence(
      withTiming(config.rotation * 1.2, { duration: config.duration * 0.65, easing: Easing.inOut(Easing.sin) }),
      withTiming(-config.rotation * 0.9, { duration: config.duration * 0.8, easing: Easing.inOut(Easing.sin) }),
      withTiming(config.rotation * 0.55, { duration: config.duration * 0.5, easing: Easing.inOut(Easing.sin) }),
      withTiming(0, { duration: config.duration * 0.75, easing: Easing.inOut(Easing.sin) }),
    );

    const scaleSequence = withSequence(
      withTiming(config.scaleRange[1], { duration: config.duration * 0.74, easing: Easing.inOut(Easing.sin) }),
      withTiming(config.scaleRange[0], { duration: config.duration * 0.82, easing: Easing.inOut(Easing.sin) }),
      withTiming(1.01, { duration: config.duration * 0.7, easing: Easing.inOut(Easing.sin) }),
      withTiming(1, { duration: config.duration * 0.74, easing: Easing.inOut(Easing.sin) }),
    );

    translateX.value = withDelay(config.delay, withRepeat(driftSequenceX, -1, false));
    translateY.value = withDelay(config.delay, withRepeat(driftSequenceY, -1, false));
    rotation.value = withDelay(config.delay, withRepeat(rotationSequence, -1, false));
    scale.value = withDelay(config.delay, withRepeat(scaleSequence, -1, false));
  }, [config, reducedMotion, translateX, translateY, rotation, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.field, config.style, animatedStyle]}>
      <BlurView intensity={isDark ? 18 : 16} tint={isDark ? 'dark' : 'light'} style={styles.blurLayer}>
        <LinearGradient colors={config.gradientColors} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.capsule} />
      </BlurView>
    </Animated.View>
  );
}

export default function AmbientBackground() {
  const { isDark } = useTheme();
  const [reducedMotion, setReducedMotion] = useState(false);
  const spectrum = isDark ? prideSpectrum.dark : prideSpectrum.light;

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

  const makeGradient = (colors: readonly string[]) => [...colors] as [string, string, ...string[]];

  const pillConfigs = useMemo<AmbientPillConfig[]>(() => [
    {
      style: styles.fieldTopLeft,
      duration: 12500,
      driftX: 24,
      driftY: 26,
      rotation: 4.5,
      scaleRange: [0.97, 1.05],
      delay: 0,
      gradientColors: makeGradient(spectrum),
    },
    {
      style: styles.fieldTopRight,
      duration: 11000,
      driftX: 28,
      driftY: 22,
      rotation: 5,
      scaleRange: [0.96, 1.06],
      delay: 900,
      gradientColors: makeGradient(spectrum.slice(3)),
    },
    {
      style: styles.fieldBottomRight,
      duration: 14000,
      driftX: 32,
      driftY: 30,
      rotation: 5.5,
      scaleRange: [0.96, 1.07],
      delay: 3200,
      gradientColors: makeGradient(spectrum.slice(1, 5)),
    },
    {
      style: styles.fieldMiddle,
      duration: 12000,
      driftX: 20,
      driftY: 24,
      rotation: 4,
      scaleRange: [0.97, 1.04],
      delay: 1800,
      gradientColors: makeGradient(spectrum.slice(0, 4)),
    },
  ], [spectrum]);

  return (
    <View pointerEvents="none" style={[styles.container, isDark && styles.containerDark]}>
      {pillConfigs.map((config, index) => (
        <AmbientPill key={index} config={config} reducedMotion={reducedMotion} isDark={isDark} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  containerDark: {
    backgroundColor: '#090812',
  },
  field: { position: 'absolute', borderRadius: 999, overflow: 'hidden' },
  blurLayer: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  capsule: { position: 'absolute', width: '145%', height: '100%', borderRadius: 999, opacity: 0.9 },
  fieldTopLeft: {
    width: '78%',
    height: 300,
    top: -150,
    left: -150,
    transform: [{ rotate: '-18deg' }],
  },
  fieldTopRight: {
    width: '72%',
    height: 280,
    top: -130,
    right: -150,
    transform: [{ rotate: '22deg' }],
  },
  fieldBottomRight: {
    width: '86%',
    height: 360,
    right: -220,
    bottom: -180,
    transform: [{ rotate: '-24deg' }],
  },
  fieldMiddle: {
    width: '70%',
    height: 260,
    top: '38%',
    left: '18%',
    transform: [{ rotate: '13deg' }],
  },
});
