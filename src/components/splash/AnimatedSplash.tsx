import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const spiralAsset = require('@/imports/spirals-rendered.png');
const fingerprintAsset = require('@/imports/fingerprint-rendered.png');

type AnimatedSplashProps = {
  ready: boolean;
  onAnimationComplete?: () => void;
};

export default function AnimatedSplash({ ready, onAnimationComplete }: AnimatedSplashProps) {
  const minimumVisibleDuration = 2000;
  const { width, height } = useWindowDimensions();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [minimumDurationElapsed, setMinimumDurationElapsed] = useState(false);

  const spiralOpacity = useSharedValue(0);
  const spiralY = useSharedValue(0);
  const spiralScale = useSharedValue(1);
  const spiralRotation = useSharedValue(0);

  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.8);

  const fingerprintOpacity = useSharedValue(0);
  const fingerprintScale = useSharedValue(0.8);
  const fingerprintHalo = useSharedValue(0);

  const exitProgress = useSharedValue(0);
  const splashOpacity = useSharedValue(1);

  const circleSize = useMemo(() => Math.min(width * 0.82, 330), [width]);
  const leafSize = useMemo(() => Math.min(width * 0.66, 270), [width]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinimumDurationElapsed(true);
    }, minimumVisibleDuration);

    return () => clearTimeout(timer);
  }, []);

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
    if (!hasStarted) {
      setHasStarted(true);

      spiralOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) });
      glowOpacity.value = withDelay(250, withTiming(1, { duration: 550, easing: Easing.out(Easing.quad) }));
      fingerprintOpacity.value = withDelay(400, withTiming(1, { duration: 650, easing: Easing.out(Easing.quad) }));
      fingerprintScale.value = withDelay(
        400,
        withSequence(
          withTiming(0.8, { duration: 140, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 580, easing: Easing.out(Easing.cubic) })
        )
      );

      if (!reducedMotion) {
        spiralY.value = withRepeat(
          withSequence(
            withTiming(-18, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
            withTiming(16, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
            withTiming(-18, { duration: 2600, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          false
        );

        spiralScale.value = withRepeat(
          withSequence(
            withTiming(1.03, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
            withTiming(1.07, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
            withTiming(1.03, { duration: 3000, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          false
        );

        spiralRotation.value = withRepeat(
          withSequence(
            withTiming(-0.4, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
            withTiming(0.4, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
            withTiming(-0.4, { duration: 4000, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          false
        );
      }

      fingerprintHalo.value = withRepeat(
        withSequence(
          withTiming(0.24, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.4, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.24, { duration: 1000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );

      fingerprintScale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.96, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.03, { duration: 1000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
    }
  }, [hasStarted, reducedMotion]);

  useEffect(() => {
    if (!ready || !minimumDurationElapsed) {
      return;
    }

    splashScreenExit();
  }, [minimumDurationElapsed, ready]);

  const splashScreenExit = () => {
    splashOpacity.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.quad) });

    if (reducedMotion) {
      spiralOpacity.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.quad) });
      glowOpacity.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.quad) });
      fingerprintOpacity.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) });
      fingerprintScale.value = withTiming(7, { duration: 350, easing: Easing.in(Easing.cubic) });
      exitProgress.value = withTiming(1, { duration: 420, easing: Easing.in(Easing.cubic) });
      requestAnimationFrame(() => {
        onAnimationComplete?.();
      });
      return;
    }

    spiralOpacity.value = withTiming(0, { duration: 420, easing: Easing.out(Easing.quad) });
    glowOpacity.value = withTiming(0, { duration: 430, easing: Easing.out(Easing.quad) });
    fingerprintOpacity.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) });
    fingerprintScale.value = withSequence(
      withTiming(1.14, { duration: 140, easing: Easing.out(Easing.cubic) }),
      withTiming(8, { duration: 720, easing: Easing.in(Easing.cubic) })
    );
    exitProgress.value = withTiming(1, { duration: 780, easing: Easing.in(Easing.cubic) });

    const timer = setTimeout(() => {
      onAnimationComplete?.();
    }, 850);

    return () => clearTimeout(timer);
  };

  const spiralAnimatedStyle = useAnimatedStyle(() => ({
    opacity: spiralOpacity.value,
    transform: [
      { translateY: spiralY.value },
      { scale: spiralScale.value },
      { rotate: `${spiralRotation.value}deg` },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: interpolate(glowScale.value, [0.8, 1], [0.8, 1], Extrapolation.CLAMP) }],
  }));

  const fingerprintAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fingerprintOpacity.value,
    transform: [{ scale: fingerprintScale.value }],
  }));

  const haloAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fingerprintHalo.value,
    transform: [{ scale: 1 + fingerprintHalo.value * 0.55 }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(exitProgress.value, [0, 1], [0.8, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(exitProgress.value, [0, 1], [1, 3.2], Extrapolation.CLAMP) }],
  }));

  const splashOpacityStyle = useAnimatedStyle(() => ({
    opacity: splashOpacity.value,
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.container, splashOpacityStyle]}>
      <Animated.View style={[styles.backgroundLayer, spiralAnimatedStyle]}>
        <Image
          source={spiralAsset}
          resizeMode="cover"
          style={[styles.spiralImage, { width: width + 140, height: height * 1.48 }]}
        />
      </Animated.View>

      <Animated.View style={[styles.centerGlow, ringStyle]} />

      <View style={[styles.frostLens, { width: circleSize, height: circleSize }]}>
        <Animated.View style={[styles.frostCore, haloAnimatedStyle, { width: circleSize, height: circleSize }]} />
        <Animated.View style={[styles.frostInner, glowAnimatedStyle, { width: circleSize * 0.9, height: circleSize * 0.9 }]} />
      </View>

      <Animated.View style={[styles.fingerprintWrap, fingerprintAnimatedStyle, { width: leafSize, height: leafSize }]}>
        <Image source={fingerprintAsset} resizeMode="contain" style={styles.fingerprintImage} />
      </Animated.View>

      <View style={styles.guideTextContainer} pointerEvents="none">
        <Text style={styles.logoText}>The Pink Plug</Text>
        <Text style={styles.subText}>BELONG • EXPLORE • CONNECT</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FBF8F4',
    overflow: 'hidden',
    zIndex: 100,
    elevation: 100,
  },
  backgroundLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -80,
    bottom: -60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spiralImage: {
    alignSelf: 'center',
    opacity: 1,
  },
  centerGlow: {
    position: 'absolute',
    alignSelf: 'center',
    top: '30%',
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.36)',
    shadowColor: '#fff',
    shadowOpacity: 0.2,
    shadowRadius: 30,
  },
  frostLens: {
    position: 'absolute',
    alignSelf: 'center',
    top: '32%',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fff',
    shadowOpacity: 0.12,
    shadowRadius: 32,
  },
  frostCore: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.34)',
  },
  frostInner: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.82)',
  },
  fingerprintWrap: {
    position: 'absolute',
    alignSelf: 'center',
    top: '34%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  fingerprintImage: {
    width: '100%',
    height: '100%',
  },
  guideTextContainer: {
    position: 'absolute',
    bottom: 96,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: '#1d1a2b',
    letterSpacing: -0.8,
  },
  subText: {
    marginTop: 8,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 3,
    fontWeight: '700',
    color: '#6B7280',
  },
});
