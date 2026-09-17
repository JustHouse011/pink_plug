import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type AnimatedCardProps = {
  children: ReactNode;
  className?: string;
  spring?: boolean;
};

export default function AnimatedCard({ children, className, spring = false }: AnimatedCardProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      whileHover={{ scale: 1.02, boxShadow: '0 12px 24px rgba(31, 18, 48, 0.12)' }}
      whileTap={{ scale: 0.97 }}
      transition={spring ? { type: 'spring', damping: 25, stiffness: 300 } : { duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
      style={{
        transformOrigin: 'center bottom',
        width: className?.includes('motion-card') ? '100%' : undefined,
      }}
    >
      {children}
    </motion.div>
  );
}
