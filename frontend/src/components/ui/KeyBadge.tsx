import React from 'react';
import { clsx } from 'clsx';
import { type ShortcutDefinition, detectIsMac } from '../../lib/shortcuts/shortcutTypes';
import { ShortcutRegistry } from '../../lib/shortcuts/shortcutRegistry';
import styles from './KeyBadge.module.scss';

export interface KeyBadgeProps {
  keys?: string[];
  shortcut?: ShortcutDefinition;
  size?: 'sm' | 'md';
  className?: string;
  isMac?: boolean;
}

export const KeyBadge: React.FC<KeyBadgeProps> = ({
  keys,
  shortcut,
  size = 'md',
  className,
  isMac
}) => {
  const mac = isMac !== undefined ? isMac : detectIsMac();

  let displayKeys: string[] = [];
  let isSequence = false;

  if (shortcut) {
    displayKeys = ShortcutRegistry.getDisplayKeys(shortcut, mac);
    isSequence = !!shortcut.isSequence;
  } else if (keys) {
    displayKeys = keys;
  }

  if (displayKeys.length === 0) return null;

  return (
    <span className={clsx(styles.badgeContainer, className)}>
      {displayKeys.map((key, index) => (
        <React.Fragment key={`${key}-${index}`}>
          <kbd className={clsx(styles.keyCap, styles[size])}>
            {key}
          </kbd>
          {isSequence && index < displayKeys.length - 1 && (
            <span className={styles.separator}>then</span>
          )}
        </React.Fragment>
      ))}
    </span>
  );
};
