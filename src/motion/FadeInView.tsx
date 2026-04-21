import { motion } from 'motion/react';
import React from 'react';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  delay = 0,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
