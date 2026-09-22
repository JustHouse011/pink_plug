import type { ReactNode } from 'react';
import { Children } from 'react';
import AnimatedCard from './AnimatedCard';

type AnimatedListProps = {
  children: ReactNode;
  className?: string;
};

export default function AnimatedList({ children }: AnimatedListProps) {
  return (
    <>
      {Children.map(children, (child, index) => (
        <AnimatedCard key={index} index={index}>
          {child}
        </AnimatedCard>
      ))}
    </>
  );
}
