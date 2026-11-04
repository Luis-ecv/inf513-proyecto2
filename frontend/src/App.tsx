import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CurriculumGrid } from './pages/CurriculumGrid';
import { PrerequisiteGraph } from './pages/PrerequisiteGraph';
import { RedesignOverview } from './pages/RedesignOverview';
import { ChapterDetail } from './pages/ChapterDetail';
import { EvidenceRepository } from './pages/EvidenceRepository';
import { FinalReportCompiler } from './pages/FinalReportCompiler';
import { BusinessStats } from './pages/BusinessStats';
import { AccessAuditBitacora } from './pages/AccessAuditBitacora';
import { UserManagement } from './pages/UserManagement';

// Componente para proteger rutas privadas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm opacity-60">
        Verificando sesión...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="malla" element={<CurriculumGrid />} />
        <Route path="grafo" element={<PrerequisiteGraph />} />
        <Route path="redisenio" element={<RedesignOverview />} />
        <Route path="capitulos" element={<RedesignOverview />} />
        <Route path="capitulos/:id" element={<ChapterDetail />} />
        <Route path="observaciones" element={<RedesignOverview />} />
        <Route path="evidencias" element={<EvidenceRepository />} />
        <Route path="reporte-final" element={<FinalReportCompiler />} />
        <Route path="estadisticas" element={<BusinessStats />} />
        <Route path="bitacora" element={<AccessAuditBitacora />} />
        <Route path="usuarios" element={<UserManagement />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
