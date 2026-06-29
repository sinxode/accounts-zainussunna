import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500); // Small buffer after 100%
          return 100;
        }
        return prev + 2;
      });
    }, 25);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#111111] z-50 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-xs px-4">
        {/* Logo/Name Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8"
        >
          <h2 className="text-[#FAFAFA] text-3xl font-light tracking-widest font-heading mb-1">
            PROF. NAFIH
          </h2>
          <p className="text-gray-400 text-xs tracking-widest uppercase font-sans">
            Academic Portfolio
          </p>
        </motion.div>

        {/* Progress Bar Container */}
        <div className="h-[2px] w-full bg-gray-800 rounded-full overflow-hidden relative">
          <motion.div
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut' }}
          />
        </div>

        {/* Progress percentage */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          className="mt-3 text-right text-gray-500 text-xs font-mono"
        >
          {progress}%
        </motion.div>
      </div>
    </div>
  );
};
