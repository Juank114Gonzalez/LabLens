'use client';

import { motion } from 'motion/react';

export function TypingIndicator() {
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-2xl border border-border/60 bg-card px-4 py-3"
      aria-label="El Lente de Innovación está escribiendo"
      role="status"
    >
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="size-1.5 rounded-full bg-primary"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: index * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
