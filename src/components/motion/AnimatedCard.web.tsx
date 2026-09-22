import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type AnimatedCardProps = {
  children: ReactNode;
  index?: number;
  className?: string;
  spring?: boolean;
  style?: StyleProp<ViewStyle>;
  pressFeedback?: boolean;
};

export default function AnimatedCard({ children, className, spring = false, index = 0, style, pressFeedback = false }: AnimatedCardProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      whileTap={pressFeedback ? { scale: 0.985 } : undefined}
      transition={spring ? { type: 'spring', damping: 25, stiffness: 300, delay: index * 0.07 } : { duration: 0.3, delay: index * 0.07, ease: [0.25, 1, 0.5, 1] }}
      style={{
        transformOrigin: 'center bottom',
        width: className?.includes('motion-card') ? '100%' : undefined,
        ...(style as object),
      }}
    >
      {children}
    </motion.div>
  );
}
