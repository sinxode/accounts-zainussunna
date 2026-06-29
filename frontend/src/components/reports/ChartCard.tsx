import React from 'react';
import { Card } from '../ui/Card';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  LineChart, 
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import styles from './ChartCard.module.scss';

interface ChartCardProps {
  title: React.ReactNode;
  type: 'bar' | 'line' | 'pie';
  data: Record<string, unknown>[];
  dataKeys: string[];
  colors?: string[];
  height?: number;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  type,
  data,
  dataKeys,
  colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'],
  height = 300
}) => {
  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ 
                background: 'var(--bg-primary)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '12px',
                boxShadow: 'var(--shadow-soft)'
              }}
              itemStyle={{ color: 'var(--text-primary)' }}
              labelStyle={{ color: 'var(--text-secondary)', fontWeight: 600 }}
            />
            {dataKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ 
                background: 'var(--bg-primary)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '12px',
                boxShadow: 'var(--shadow-soft)'
              }}
              itemStyle={{ color: 'var(--text-primary)' }}
              labelStyle={{ color: 'var(--text-secondary)', fontWeight: 600 }}
            />
            {dataKeys.map((key, i) => (
              <Line 
                key={key} 
                type="monotone" 
                dataKey={key} 
                stroke={colors[i % colors.length]} 
                strokeWidth={2} 
                dot={{ r: 4, fill: colors[i % colors.length], strokeWidth: 0 }} 
              />
            ))}
          </LineChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                background: 'var(--bg-primary)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '12px',
                boxShadow: 'var(--shadow-soft)'
              }}
              itemStyle={{ color: 'var(--text-primary)' }}
              labelStyle={{ color: 'var(--text-secondary)', fontWeight: 600 }}
            />
          </PieChart>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={styles.container}>
      <h3 className={styles.title}>{title}</h3>
      <div style={{ width: '100%', height, minWidth: 0, position: 'relative' }}>
        <ResponsiveContainer width="99%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
