import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';

type PageTransitionProps = {
  children: ReactNode;
  routeKey?: string;
};

const transition = {
  duration: 0.25,
  ease: [0.25, 1, 0.5, 1] as const,
};

export default function PageTransition({ children, routeKey = 'app' }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        initial={false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.99 }}
        transition={transition}
        style={{ minHeight: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
