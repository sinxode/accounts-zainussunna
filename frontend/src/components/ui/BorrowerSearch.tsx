import React, { useState, useEffect, useRef } from 'react';
import { borrowerService } from '../../lib/services';
import { useQuery } from '@tanstack/react-query';
import { Input } from './Input';
import styles from './StudentSearch.module.scss';
import { Search, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BorrowerSearchProps {
  onSelect: (borrower: any) => void;
  label?: string;
  placeholder?: string;
  initialBorrowerId?: string;
  clearOnSelect?: boolean;
}

export const BorrowerSearch: React.FC<BorrowerSearchProps> = ({ 
  onSelect, 
  label = "Search Borrower", 
  placeholder = "Search by name...",
  initialBorrowerId,
  clearOnSelect = false
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pre-fetch borrower if initialBorrowerId is provided
  const { data: initialBorrower } = useQuery({
    queryKey: ['borrower', initialBorrowerId],
    queryFn: () => borrowerService.getById(initialBorrowerId!),
    enabled: !!initialBorrowerId
  });

  useEffect(() => {
    if (initialBorrower) {
      onSelect(initialBorrower);
      setQuery(initialBorrower.name);
    }
  }, [initialBorrower, onSelect]);

  const { data: borrowers = [], isLoading } = useQuery({
    queryKey: ['borrowers-search'],
    queryFn: borrowerService.list
  });

  const filtered = query.length > 0 
    ? borrowers.filter((b: any) => 
        b.name.toLowerCase().includes(query.toLowerCase()) ||
        (b.phone && b.phone.includes(query))
      ).slice(0, 5)
    : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (borrower: any) => {
    onSelect(borrower);
    if (clearOnSelect) {
      setQuery('');
    } else {
      setQuery(borrower.name);
    }
    setIsOpen(false);
  };

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <Input
        label={label}
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        icon={<Search size={18} />}
        autoComplete="off"
      />

      <AnimatePresence>
        {isOpen && query.length > 0 && (
          <motion.div 
            className={styles.dropdown}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {isLoading ? (
              <div className={styles.loading}>Searching...</div>
            ) : filtered.length > 0 ? (
              filtered.map((b: any) => (
                <button
                  key={b.id}
                  className={styles.option}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(b);
                  }}
                  type="button"
                >
                  <div className={styles.avatar}>
                    {b.name.charAt(0)}
                  </div>
                  <div className={styles.info}>
                    <span className={styles.name}>{b.name}</span>
                    <span className={styles.enr}>
                      {b.phone || 'No phone'}
                    </span>
                  </div>
                  {query === b.name && <Check size={14} className="ml-auto text-primary" />}
                </button>
              ))
            ) : (
              <div className={styles.noResults}>No borrowers found</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
