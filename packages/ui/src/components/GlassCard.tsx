'use client';

import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className, hover, onClick }: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -4 } : undefined}
      onClick={onClick}
      className={cn(
        'backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6',
        hover && 'cursor-pointer hover:bg-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.08)] transition-all duration-300',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
