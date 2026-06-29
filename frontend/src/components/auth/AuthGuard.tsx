import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../types/database';

import styles from './AuthGuard.module.scss';

type Role = Database['public']['Tables']['profiles']['Row']['role'];

interface AuthGuardProps {
  allowedRoles?: Role[];
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ allowedRoles }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <div className={`glass-effect ${styles.loaderBox}`}>Loading ZLS...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
