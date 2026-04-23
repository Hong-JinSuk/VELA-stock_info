'use client';

import { motion, Variants } from 'motion/react';
import React from 'react';

interface StaggerContainerProps {
  children: React.ReactNode;
  staggerStep?: number; // 자식 간의 간격
  delay?: number; // 전체 시작 전 대기 시간
  className?: string;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  staggerStep = 0.15,
  delay = 0,
  className = '',
}) => {
  // 부모 설정
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerStep,
        delayChildren: delay,
      },
    },
  };

  // 자식 설정 (더 부드러운 애니메이션)
  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
      filter: 'blur(4px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 1.2,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      className={className}
    >
      {/* children을 순회하며 motion 요소로 래핑하거나, 
        자식 컴포넌트 내부에서 variants를 상속받게 함 
      */}
      {React.Children.map(children, (child) => (
        <motion.div variants={itemVariants}>{child}</motion.div>
      ))}
    </motion.div>
  );
};
