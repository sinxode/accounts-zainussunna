import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { OperationsDrawerProvider } from './components/operations/drawers/OperationsDrawerContext';
import { AuthGuard } from './components/auth/AuthGuard';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { AllStudents } from './pages/students/AllStudents';
import { StudentProfile } from './pages/students/StudentProfile';
import { ReportsHub } from './pages/reports/ReportsHub';
import { StudentReports } from './pages/reports/StudentReports';
import { StudentBalanceSummaryReport } from './pages/reports/StudentBalanceSummaryReport';
import { MonthlyReports } from './pages/reports/MonthlyReports';
import { BorrowerReports } from './pages/reports/BorrowerReports';
import { BorrowerAgingReport } from './pages/reports/BorrowerAgingReport';
import { FinancialSummary } from './pages/reports/FinancialSummary';
import { CashbookReconciliationReport } from './pages/reports/CashbookReconciliationReport';
import { AuditActivityReport } from './pages/reports/AuditActivityReport';
import { TransactionTypesReport } from './pages/reports/TransactionTypesReport';
import { ReconciliationExceptionsReport } from './pages/reports/ReconciliationExceptionsReport';
import { Analytics } from './pages/reports/Analytics';
import { AdministrationDashboard } from './pages/settings/AdministrationDashboard';
import { UserManagement } from './pages/settings/UserManagement';
import { GlobalSettings } from './pages/settings/GlobalSettings';
import { AccountingPeriods } from './pages/settings/AccountingPeriods';
import { AuditCenter } from './pages/settings/AuditCenter';
import { NotificationManagement } from './pages/settings/NotificationManagement';
import { SystemHealth } from './pages/settings/SystemHealth';
import { DataHealth } from './pages/settings/DataHealth';
import { ImportCenter } from './pages/setup/ImportCenter';
import { Onboarding } from './pages/setup/Onboarding';
import { LoginV2 } from './pages/auth/v2/Login';
import { ForgotPasswordV2 } from './pages/auth/v2/ForgotPassword';
import { ResetPasswordV2 } from './pages/auth/v2/ResetPassword';
import { AccessDeniedV2 } from './pages/auth/v2/AccessDenied';
import { NotFoundV2 } from './pages/auth/v2/NotFound';
import { UserProfile } from './pages/settings/UserProfile';
import { BorrowerDashboard } from './pages/borrowers/BorrowerDashboard';
import { BorrowerProfile } from './pages/borrowers/BorrowerProfile';
import { TransactionExplorer } from './pages/transactions/TransactionExplorer';
import { TransactionDetails } from './pages/transactions/TransactionDetails';
import { EntryPresets } from './pages/presets/EntryPresets';
import { BatchManagement } from './pages/batches/BatchManagement';
import { InternalTransfers } from './pages/transfers/InternalTransfers';
import { OperationsCenter } from './pages/operations/OperationsCenter';
import { Portfolio } from './pages/portfolio/Portfolio';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OperationsDrawerProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public Portfolio Route */}
              <Route path="/portfolio" element={<Portfolio />} />

              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginV2 />} />
              <Route path="/forgot-password" element={<ForgotPasswordV2 />} />
              <Route path="/reset-password" element={<ResetPasswordV2 />} />
              <Route path="/access-denied" element={<AccessDeniedV2 />} />

              {/* Authenticated Application Skeleton */}
              <Route element={<AuthGuard />}>
                <Route element={<AppLayout />}>
                  {/* Dashboard - All Authenticated Staff */}
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/profile" element={<UserProfile />} />

                  {/* Student Ledger Explorer */}
                  <Route path="students" element={<AllStudents />} />
                  <Route path="students/:id" element={<StudentProfile />} />

                  {/* Transaction History & Audit Details */}
                  <Route path="transactions" element={<TransactionExplorer />} />
                  <Route path="transactions/:id" element={<TransactionDetails />} />

                  {/* Operations & Money Movement (Restricted to Money Managers) */}
                  <Route element={<AuthGuard allowedRoles={['super_admin', 'admin', 'owner', 'manager']} />}>
                    <Route path="operations" element={<OperationsCenter />} />
                    <Route path="internal-transfers" element={<InternalTransfers />} />
                    <Route path="borrowers" element={<BorrowerDashboard />} />
                    <Route path="borrowers/:id" element={<BorrowerProfile />} />
                    <Route path="presets" element={<EntryPresets />} />
                    <Route path="batches" element={<BatchManagement />} />
                    <Route path="settings" element={<GlobalSettings />} />
                  </Route>

                  {/* Institutional Reports Hub & Reports (Admins, Faculty, Staff) */}
                  <Route element={<AuthGuard allowedRoles={['super_admin', 'admin', 'faculty', 'owner', 'manager', 'staff']} />}>
                    <Route path="reports">
                      <Route index element={<ReportsHub />} />
                      <Route path="student-statement" element={<StudentReports />} />
                      <Route path="students" element={<StudentBalanceSummaryReport />} />
                      <Route path="monthly" element={<MonthlyReports />} />
                      <Route path="summary" element={<FinancialSummary />} />
                      <Route path="cashbook" element={<CashbookReconciliationReport />} />
                      <Route path="borrowers" element={<BorrowerReports />} />
                      <Route path="borrower-aging" element={<BorrowerAgingReport />} />
                      <Route path="audit" element={<AuditActivityReport />} />
                      <Route path="transaction-types" element={<TransactionTypesReport />} />
                      <Route path="reconciliation-exceptions" element={<ReconciliationExceptionsReport />} />
                      <Route path="analytics" element={<Analytics />} />
                    </Route>
                  </Route>

                  {/* System Administration (Super Admin only) */}
                  <Route element={<AuthGuard allowedRoles={['super_admin', 'owner']} />}>
                    <Route path="administration">
                      <Route index element={<AdministrationDashboard />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="global" element={<GlobalSettings />} />
                      <Route path="periods" element={<AccountingPeriods />} />
                      <Route path="audit" element={<AuditCenter />} />
                      <Route path="notifications" element={<NotificationManagement />} />
                      <Route path="health" element={<SystemHealth />} />
                      <Route path="data-health" element={<DataHealth />} />
                      <Route path="import" element={<ImportCenter />} />
                    </Route>
                  </Route>

                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Route>
              </Route>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/404" element={<NotFoundV2 />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" />
        </OperationsDrawerProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
