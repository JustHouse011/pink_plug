import type { ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';
import Animated, { Easing, Extrapolation, FadeIn, FadeInDown, FadeOut, FadeOutUp, interpolate, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { motion } from '@/constants/motion';

type AnimatedCardProps = {
  children: ReactNode;
  index?: number;
  className?: string;
  spring?: boolean;
  style?: StyleProp<ViewStyle>;
  scrollY?: SharedValue<number>;
  viewportHeight?: number;
  scrollEffectEnabled?: boolean;
  pressFeedback?: boolean;
};

export default function AnimatedCard({ children, index = 0, style, scrollY, viewportHeight = 800, scrollEffectEnabled = false, pressFeedback = false }: AnimatedCardProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const cardY = useSharedValue(0);
  const hasMeasured = useSharedValue(false);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    let isActive = true;

    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (isActive) setReducedMotion(value);
    });

    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => {
      isActive = false;
      listener.remove();
    };
  }, []);

  const scrollStyle = useAnimatedStyle(() => {
    if (!scrollEffectEnabled || !scrollY || reducedMotion || !hasMeasured.value) {
      return { transform: [{ scale: pressScale.value }] };
    }

    const position = cardY.value - scrollY.value;
    const topFade = Math.min(viewportHeight * 0.22, 180);
    const bottomFade = Math.min(viewportHeight * 0.76, viewportHeight - 40);

    return {
      opacity: interpolate(
        position,
        [-120, 0, topFade, bottomFade, viewportHeight + 120],
        [0.78, 0.9, 1, 1, 0.76],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateY: interpolate(
            position,
            [-120, 0, topFade, bottomFade, viewportHeight + 120],
            [-8, -4, 0, 0, 12],
            Extrapolation.CLAMP,
          ),
        },
        {
          scale: interpolate(
            position,
            [-120, 0, topFade, bottomFade, viewportHeight + 120],
            [0.975, 0.985, 1, 1, 0.975],
            Extrapolation.CLAMP,
          ) * pressScale.value,
        },
      ],
    };
  }, [hasMeasured, pressScale, reducedMotion, scrollEffectEnabled, scrollY, viewportHeight]);

  return (
    <Animated.View
      entering={reducedMotion
        ? FadeIn.delay(Math.min(index * motion.stagger.card, 180)).duration(motion.duration.fast).easing(Easing.out(Easing.quad))
        : FadeInDown
            .delay(Math.min(index * motion.stagger.card, 220))
            .duration(motion.duration.card)
            .easing(motion.easing.standard)
            .withInitialValues({
              opacity: 0,
              transform: [{ translateY: motion.distance.card }],
            })}
      exiting={reducedMotion ? FadeOut.duration(motion.duration.fast) : FadeOutUp.duration(210).easing(Easing.in(Easing.quad))}
      onLayout={(event) => {
        cardY.value = event.nativeEvent.layout.y;
        hasMeasured.value = true;
      }}
      onTouchStart={() => {
        if (pressFeedback) {
          pressScale.value = withTiming(0.985, { duration: 110, easing: Easing.out(Easing.quad) });
        }
      }}
      onTouchEnd={() => {
        if (pressFeedback) {
          pressScale.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) });
        }
      }}
      onTouchCancel={() => {
        if (pressFeedback) {
          pressScale.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) });
        }
      }}
      style={style}
    >
      <Animated.View style={scrollStyle}>
        {children}
      </Animated.View>
    </Animated.View>
  );
}
