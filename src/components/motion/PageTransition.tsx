import type { ReactNode } from 'react';

type PageTransitionProps = {
  children: ReactNode;
  routeKey?: string;
};

export default function PageTransition({ children }: PageTransitionProps) {
  return children;
}
