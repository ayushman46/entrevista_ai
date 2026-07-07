import React from 'react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const WaveformIndicator = ({ isActive, colorClass = "bg-forest" }: { isActive: boolean, colorClass?: string }) => {
  return (
    <div className="flex items-center justify-center gap-1 h-8 px-4 rounded-full border-2 border-vast bg-cream w-fit">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className={cn("w-1 rounded-full", colorClass)}
          initial={{ height: 4 }}
          animate={{ height: isActive ? [4, 16, 4, 20, 8, 4] : 4 }}
          transition={{
            repeat: Infinity,
            duration: 1 + Math.random(),
            delay: i * 0.1,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};
