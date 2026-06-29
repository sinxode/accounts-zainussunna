import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Trash2, 
  Plus, 
  Check,
  ChevronRight
} from 'lucide-react';
import styles from '../../pages/operations/OperationsCenter.module.scss';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { clsx } from 'clsx';

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'urgent' | 'warning' | 'info' | 'normal';
  completed: boolean;
}

export const TodayTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('zls-today-tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing tasks:', e);
      }
    }
    return [
      {
        id: 1,
        title: 'Monthly Zakaath Due',
        description: 'Process the B-101 batch for this month.',
        status: 'urgent',
        completed: false
      },
      {
        id: 2,
        title: 'Pending Recovery',
        description: 'Ahmed Hassan owes ₹1,500.',
        status: 'warning',
        completed: false
      },
      {
        id: 3,
        title: 'Low Balance Alert',
        description: '3 students are below ₹500 minimum.',
        status: 'info',
        completed: false
      }
    ];
  });

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Task['status']>('normal');

  useEffect(() => {
    localStorage.setItem('zls-today-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleToggleComplete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleAddNew = () => {
    if (!title.trim()) return;
    const newTask: Task = {
      id: Date.now(),
      title,
      description,
      status,
      completed: false
    };
    setTasks(prev => [...prev, newTask]);
    resetForm();
  };

  const handleStartEdit = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setStatus(task.status);
    setIsAdding(false);
  };

  const handleSaveEdit = (id: number) => {
    if (!title.trim()) return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, title, description, status } : t));
    resetForm();
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(prev => prev.filter(t => t.id !== id));
    if (editingId === id) resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus('normal');
    setIsAdding(false);
    setEditingId(null);
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <Card padding="none">
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <CheckSquare size={20} className="text-primary" />
          Today's Tasks
          {activeTasks.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-primary-soft text-primary rounded-full">
              {activeTasks.length}
            </span>
          )}
        </div>
      </div>
      
      <div className={styles.taskList}>
        {activeTasks.map(task => {
          if (editingId === task.id) {
            return (
              <div key={task.id} className={styles.taskForm} onClick={e => e.stopPropagation()}>
                <input 
                  type="text" 
                  placeholder="Task Title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="font-semibold"
                />
                <textarea 
                  placeholder="Notes / Description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
                <select 
                  value={status} 
                  onChange={e => setStatus(e.target.value as Task['status'])}
                >
                  <option value="normal">Normal Priority</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="urgent">Urgent</option>
                </select>
                <div className={styles.formActions}>
                  <Button variant="soft" size="sm" onClick={resetForm}>Cancel</Button>
                  <Button size="sm" onClick={() => handleSaveEdit(task.id)}>Save</Button>
                </div>
              </div>
            );
          }

          return (
            <div 
              key={task.id} 
              className={clsx(styles.taskItem, styles[`${task.status}Item`])}
              onClick={(e) => handleStartEdit(task, e)}
            >
              <div 
                className={clsx(styles.taskCheckbox, styles[task.status], task.completed && styles.completed)}
                onClick={(e) => handleToggleComplete(task.id, e)}
              >
                {task.completed && <Check size={12} />}
              </div>
              <div className={styles.taskContent}>
                <span className={styles.taskTitle}>
                  {task.title}
                </span>
                <span className={styles.taskDesc}>
                  {task.description}
                </span>
              </div>
              <div className={styles.taskHeaderActions}>
                <button 
                  className={clsx(styles.actionBtn, styles.deleteBtn)}
                  onClick={(e) => handleDelete(task.id, e)}
                  title="Delete task"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}

        {activeTasks.length === 0 && !isAdding && (
          <div className="text-center text-muted p-8 text-sm">
            No active tasks left for today!
          </div>
        )}
      </div>

      {completedTasks.length > 0 && (
        <>
          <div 
            className={styles.completedSectionHeader}
            onClick={() => setShowCompleted(!showCompleted)}
          >
            <ChevronRight size={14} className={clsx(showCompleted && styles.expanded)} />
            <span>Completed ({completedTasks.length})</span>
          </div>
          {showCompleted && (
            <div className={styles.completedList}>
              {completedTasks.map(task => (
                <div 
                  key={task.id} 
                  className={clsx(styles.taskItem, styles[`${task.status}Item`])}
                  onClick={(e) => handleStartEdit(task, e)}
                >
                  <div 
                    className={clsx(styles.taskCheckbox, styles[task.status], styles.completed)}
                    onClick={(e) => handleToggleComplete(task.id, e)}
                  >
                    <Check size={12} />
                  </div>
                  <div className={styles.taskContent}>
                    <span className={clsx(styles.taskTitle, styles.completedText)}>
                      {task.title}
                    </span>
                    <span className={clsx(styles.taskDesc, styles.completedText)}>
                      {task.description}
                    </span>
                  </div>
                  <div className={styles.taskHeaderActions}>
                    <button 
                      className={clsx(styles.actionBtn, styles.deleteBtn)}
                      onClick={(e) => handleDelete(task.id, e)}
                      title="Delete task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className={styles.addTaskSection}>
        {isAdding ? (
          <div className={styles.taskForm}>
            <input 
              type="text" 
              placeholder="New Reminder"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="font-semibold"
              autoFocus
            />
            <textarea 
              placeholder="Notes"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <select 
              value={status} 
              onChange={e => setStatus(e.target.value as Task['status'])}
            >
              <option value="normal">Normal Priority</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="urgent">Urgent</option>
            </select>
            <div className={styles.formActions}>
              <Button variant="soft" size="sm" onClick={resetForm}>Cancel</Button>
              <Button size="sm" onClick={handleAddNew}>Add</Button>
            </div>
          </div>
        ) : (
          <div className={styles.addBtnWrapper} onClick={() => setIsAdding(true)}>
            <Plus size={18} />
            <span>New Reminder</span>
          </div>
        )}
      </div>
    </Card>
  );
};
