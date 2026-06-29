import React from 'react';
import { studentService } from '../../lib/services';
import { useQuery } from '@tanstack/react-query';
import { Input } from './Input';
import styles from './StudentSearch.module.scss';
import { Search } from 'lucide-react';

interface StudentSearchProps {
  label?: string;
  onSelect: (student: any) => void;
  placeholder?: string;
  size?: 'md' | 'lg';
  variant?: 'default' | 'cell';
  initialStudentId?: string;
  clearOnSelect?: boolean;
}

export const StudentSearch: React.FC<StudentSearchProps> = ({ 
  label, 
  onSelect, 
  placeholder, 
  size = 'md', 
  variant = 'default',
  initialStudentId,
  clearOnSelect = false
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);

  // Pre-fetch student if initialStudentId is provided
  const { data: initialStudent } = useQuery({
    queryKey: ['student', initialStudentId],
    queryFn: () => studentService.getById(initialStudentId!),
    enabled: !!initialStudentId
  });

  React.useEffect(() => {
    if (initialStudent) {
      onSelect(initialStudent);
      setSearchTerm(initialStudent.name);
    }
  }, [initialStudent, onSelect]);

  const { data: students } = useQuery({
    queryKey: ['studentsSummary', searchTerm],
    queryFn: () => studentService.getHealthSummary(),
    enabled: searchTerm.length > 0 && !initialStudentId
  });

  const filtered = students?.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.enrolment_no && s.enrolment_no.toLowerCase().includes(searchTerm.toLowerCase()))
  ).slice(0, 5) || [];

  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <Input 
        label={label}
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        icon={<Search size={18} className="text-primary" />}
        size={size}
        variant={variant}
      />
      {isOpen && searchTerm.length > 0 && (
        <div className={styles.dropdown}>
          {filtered.length > 0 ? (
            filtered.map(s => (
              <button 
              key={s.id} 
              type="button"
              className={styles.option}
              onClick={() => {
                onSelect(s);
                if (clearOnSelect) {
                  setSearchTerm('');
                } else {
                  setSearchTerm(s.name);
                }
                setIsOpen(false);
              }}
              >
                <div className={styles.avatar}>
                  {s.name.charAt(0)}
                </div>
                <div className={styles.info}>
                  <div className={styles.name}>{s.name}</div>
                  <div className={styles.enr}>{s.enrolment_no}</div>
                </div>
              </button>
            ))
          ) : (
            <div className={styles.noResults}>
              <div className="text-xs font-bold text-muted">No students matching your search</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
