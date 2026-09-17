import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, SafeAreaView, Text, View, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/context/ThemeProvider';

const slides = [
  {
    title: 'Welcome to\nYour Queer\nWorld',
    subtitle:
      'Discover LGBTQIA+ friendly spaces, vibrant events, and local communities right where you are or wherever you travel.',
    image: require('@/imports/Welcome.jpg'),
  },
  {
    title: 'Connect,\nBelong,\n& Stay Safe',
    subtitle:
      'Set your safety preferences, join local interest groups, and access essential resources with complete peace of mind.',
    image: require('@/imports/1.jpg'),
  },
  {
    title: 'Explore with\nPink Routes',
    subtitle:
      'Build custom itineraries, find verified queer-owned spots, and map out your ultimate day or night out.',
    image: require('@/imports/Routes.jpg'),
  },
] as const;

export default function Onboarding() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isCompact = height < 720;
  const complete = useAppStore((state) => state.completeOnboarding);
  const [step, setStep] = useState(0);
  const slideOpacity = useRef(new Animated.Value(1)).current;
  const slideOffset = useRef(new Animated.Value(0)).current;

  const advance = () => {
    if (step < slides.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    complete();
    router.replace('/login');
  };

  const goBack = () => {
    if (step > 0) setStep((current) => current - 1);
  };

  const skip = () => {
    complete();
    router.replace('/login');
  };

  useEffect(() => {
    slideOpacity.setValue(0);
    slideOffset.setValue(18);

    const transition = Animated.parallel([
      Animated.timing(slideOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(slideOffset, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]);

    transition.start();
    return () => transition.stop();
  }, [slideOffset, slideOpacity, step]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 12,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) advance();
        if (gestureState.dx > 50) goBack();
      },
    }),
  ).current;

  const activeStep = Math.min(Math.max(step, 0), slides.length - 1);
  const activeSlide = slides[activeStep];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? '#050812' : '#1f0f25' }]}>
      <View style={styles.stage} {...panResponder.panHandlers}>
        <Animated.View style={[styles.slide, { opacity: slideOpacity, transform: [{ translateX: slideOffset }] }]}>
          <Image
            source={activeSlide.image}
            style={[StyleSheet.absoluteFill, styles.backgroundImage]}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
          <LinearGradient
            colors={isDark
              ? ['rgba(5, 8, 18, 0.9)', 'rgba(37, 14, 54, 0.78)', 'rgba(74, 36, 91, 0.62)']
              : ['rgba(55, 12, 52, 0.82)', 'rgba(119, 45, 110, 0.68)', 'rgba(158, 90, 166, 0.52)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View
            style={[
              styles.content,
              isCompact && styles.contentCompact,
              { paddingBottom: (isCompact ? 72 : 112) + insets.bottom },
            ]}
          >
            <Text accessibilityRole="header" style={[styles.title, isCompact && styles.titleCompact]}>{activeSlide.title}</Text>
            <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>{activeSlide.subtitle}</Text>

            <View style={[styles.pagination, isCompact && styles.paginationCompact]}>
              {slides.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, index === activeStep && styles.activeDot]}
                />
              ))}
            </View>

            <Pressable onPress={advance} style={[styles.primaryButton, isCompact && styles.primaryButtonCompact]} accessibilityRole="button">
              <LinearGradient
                colors={[colors.primary, '#C432D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.buttonGradient, isCompact && styles.buttonGradientCompact]}
              >
                <Text style={styles.buttonText}>{activeStep === slides.length - 1 ? 'Get Started' : 'NEXT'}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>

        <View style={styles.preload} pointerEvents="none">
          {slides.map((slide) => (
            <Image
              key={slide.title}
              source={slide.image}
              style={styles.preloadImage}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ))}
        </View>

        <Pressable onPress={skip} style={styles.skipButton} accessibilityRole="button" accessibilityLabel="Skip onboarding">
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1f0f25',
  },
  stage: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  slide: {
    ...StyleSheet.absoluteFill,
  },
  backgroundImage: {
    transform: [{ translateY: -56 }, { scale: 1.08 }],
  },
  preload: {
    ...StyleSheet.absoluteFill,
    opacity: 0,
  },
  preloadImage: {
    width: 1,
    height: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 28,
    paddingBottom: 32,
    paddingTop: 28,
  },
  contentCompact: {
    paddingHorizontal: 22,
    paddingBottom: 20,
    paddingTop: 18,
  },
  title: {
    color: '#fff',
    fontSize: 58,
    lineHeight: 58,
    letterSpacing: -2,
    fontWeight: '700',
    maxWidth: 360,
  },
  titleCompact: {
    fontSize: 44,
    lineHeight: 45,
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: 20,
    maxWidth: 392,
    color: 'rgba(255,255,255,0.93)',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '500',
  },
  subtitleCompact: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 23,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 28,
    gap: 10,
  },
  paginationCompact: {
    marginTop: 12,
    marginBottom: 18,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  activeDot: {
    width: 30,
    borderRadius: 999,
    backgroundColor: '#E94DCA',
  },
  primaryButton: {
    borderRadius: 30,
    overflow: 'hidden',
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  primaryButtonCompact: {
    minHeight: 56,
  },
  buttonGradient: {
    minHeight: 72,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonGradientCompact: {
    minHeight: 56,
  },
  buttonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  skipButton: {
    position: 'absolute',
    top: 18,
    right: 22,
    zIndex: 2,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
  },
});

