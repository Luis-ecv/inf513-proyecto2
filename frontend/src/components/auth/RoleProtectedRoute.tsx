import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  const hasAccess = Boolean(
    user && allowedRoles.some((r) => r.toLowerCase() === user.rol?.toLowerCase())
  );

  useEffect(() => {
    if (!loading && user && !hasAccess) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            navigate('/dashboard', { replace: true });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [loading, user, hasAccess, navigate]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm opacity-60">
        Verificando permisos de acceso...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!hasAccess) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-5 rounded-3xl mb-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-lg">
          <ShieldAlert className="w-16 h-16 animate-pulse" />
        </div>
        <h1 className="text-2xl font-black text-rose-600 dark:text-rose-400 mb-2">
          403 - Acceso Denegado
        </h1>
        <p className="text-sm max-w-md opacity-80 mb-4" style={{ color: 'var(--text-main)' }}>
          Su rol actual <strong>({user.rol || 'Sin Rol'})</strong> no cuenta con privilegios administrativos para acceder a esta sección.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 mb-6">
          <span>Redirigiendo automáticamente a su Tablero Principal en</span>
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs">
            {countdown}
          </span>
          <span>segundo{countdown !== 1 ? 's' : ''}...</span>
        </div>
        <button
          onClick={() => navigate('/dashboard', { replace: true })}
          className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition hover:opacity-80"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio Ahora
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
