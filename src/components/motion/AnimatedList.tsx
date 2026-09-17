import type { ReactNode } from 'react';
import { View } from 'react-native';

type AnimatedListProps = {
  children: ReactNode;
  className?: string;
};

export default function AnimatedList({ children }: AnimatedListProps) {
  return <View>{children}</View>;
}
