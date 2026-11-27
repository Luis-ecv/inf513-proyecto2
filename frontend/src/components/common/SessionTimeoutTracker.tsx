import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Clock, ShieldAlert, LogOut, CheckCircle2 } from 'lucide-react';

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutos
const WARNING_WINDOW_MS = 60 * 1000;         // 60 segundos antes (al minuto 29)
const THROTTLE_ACTIVITY_MS = 2000;           // Registrar actividad como máximo cada 2s

export const SessionTimeoutTracker: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  const lastActivityRef = useRef<number>(Date.now());
  const timerCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reiniciar contador de actividad
  const registrarActividad = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityRef.current > THROTTLE_ACTIVITY_MS) {
      lastActivityRef.current = now;
      if (showWarning) {
        setShowWarning(false);
      }
    }
  }, [showWarning]);

  // Cierre de sesión definitivo por inactividad
  const forzarCierreSesion = useCallback(async () => {
    setShowWarning(false);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (timerCheckRef.current) clearInterval(timerCheckRef.current);

    await logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  // Continuar trabajando (reactivar sesión desde el modal)
  const handleContinuarSesion = () => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    setSecondsRemaining(60);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  // Escuchar eventos globales de interacción del usuario
  useEffect(() => {
    if (!user) return;

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleEvent = () => registrarActividad();

    events.forEach((ev) => window.addEventListener(ev, handleEvent, { passive: true }));

    // Verificador periódico cada 1 segundo
    timerCheckRef.current = setInterval(() => {
      const now = Date.now();
      const tiempoInactivo = now - lastActivityRef.current;
      const tiempoParaExpirar = INACTIVITY_LIMIT_MS - tiempoInactivo;

      if (tiempoParaExpirar <= 0) {
        // Tiempo totalmente agotado: forzar logout
        forzarCierreSesion();
      } else if (tiempoParaExpirar <= WARNING_WINDOW_MS) {
        // En el rango de los últimos 60 segundos: activar modal
        const segs = Math.max(1, Math.ceil(tiempoParaExpirar / 1000));
        setSecondsRemaining(segs);
        setShowWarning(true);
      } else {
        if (showWarning) {
          setShowWarning(false);
        }
      }
    }, 1000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleEvent));
      if (timerCheckRef.current) clearInterval(timerCheckRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [user, registrarActividad, forzarCierreSesion, showWarning]);

  if (!showWarning || !user) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="timeout-title"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 id="timeout-title" className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Aviso de Inactividad de Sesión
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Seguridad del Sistema Curricular FICCT
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs font-medium text-amber-900 dark:text-amber-200">
              Su sesión se cerrará automáticamente en:
            </span>
          </div>
          <span className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30">
            {secondsRemaining}s
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          No se ha detectado interacción en los últimos <strong>29 minutos</strong>. Para resguardar la seguridad e integridad de la información académica, la sesión se cerrará de forma preventiva.
        </p>

        <div className="flex items-center justify-between gap-3 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <button
            type="button"
            onClick={forzarCierreSesion}
            className="px-3.5 py-2 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión Ahora
          </button>

          <button
            type="button"
            onClick={handleContinuarSesion}
            className="px-5 py-2 rounded-xl bg-primary text-white hover:opacity-90 shadow-md transition text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mantener Sesión Activa
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
