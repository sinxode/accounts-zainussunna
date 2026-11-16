import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/useUIStore';
import styles from './SequenceIndicator.module.scss';

export const SequenceIndicator: React.FC = () => {
  const { pendingSequence } = useUIStore();

  return (
    <AnimatePresence>
      {pendingSequence && (
        <motion.div
          className={styles.indicatorWrapper}
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          <div className={styles.indicatorPill}>
            <span className={styles.sequenceTag}>
              {pendingSequence.toUpperCase()} → ...
            </span>
            <div className={styles.targetsList}>
              <span><strong>D</strong>ashboard</span>
              <span>·</span>
              <span><strong>S</strong>tudents</span>
              <span>·</span>
              <span><strong>T</strong>ransactions</span>
              <span>·</span>
              <span><strong>R</strong>eports</span>
              <span>·</span>
              <span><strong>O</strong>perations</span>
              <span>·</span>
              <span><strong>A</strong>udit</span>
            </div>
            <span className={styles.cancelNote}>Esc to cancel</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
