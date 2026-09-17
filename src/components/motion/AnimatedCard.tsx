import type { ReactNode } from 'react';
import { View } from 'react-native';

type AnimatedCardProps = {
  children: ReactNode;
  className?: string;
  spring?: boolean;
};

export default function AnimatedCard({ children }: AnimatedCardProps) {
  return <View>{children}</View>;
}
