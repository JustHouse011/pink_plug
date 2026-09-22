import { Easing } from 'react-native-reanimated';

export const motion = {
  duration: {
    fast: 160,
    tab: 220,
    screen: 280,
    card: 360,
    hero: 420,
  },
  stagger: {
    card: 50,
  },
  distance: {
    title: 10,
    card: 22,
    hero: 30,
  },
  scale: {
    card: 0.98,
    hero: 0.97,
  },
  easing: {
    standard: Easing.out(Easing.cubic),
  },
} as const;