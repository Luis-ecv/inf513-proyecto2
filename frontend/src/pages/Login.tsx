import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, Mail, AlertCircle, ArrowRight, 
  Sun, Moon, ShieldAlert, Clock, X, ShieldCheck
} from 'lucide-react';
import isotipoSistemas from '../assets/branding/isotipo-sistemas.jpg';
import logoSistemas from '../assets/branding/logo-sistemas.jpg';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { mode, toggleMode, theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Estados de control para protección anti fuerza bruta
  const [isLocked, setIsLocked] = useState(false);
  const [lockSeconds, setLockSeconds] = useState(0);
  const [showLockModal, setShowLockModal] = useState(false);
  const [intentosRestantes, setIntentosRestantes] = useState<number | null>(null);

  // Temporizador en vivo para cuenta regresiva del bloqueo
  useEffect(() => {
    if (lockSeconds <= 0) {
      if (isLocked) {
        setIsLocked(false);
        setErrorMsg('');
      }
      return;
    }

    const interval = setInterval(() => {
      setLockSeconds((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          setErrorMsg('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lockSeconds, isLocked]);

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    setErrorMsg('');

    if (!loginInput.trim() || !password.trim()) {
      setErrorMsg('Por favor complete todos los campos obligatorios.');
      return;
    }

    setLoading(true);
    const res = await login(loginInput, password);
    setLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg(res.message);
      if (res.bloqueado) {
        const remaining = res.segundosRestantes && res.segundosRestantes > 0 ? res.segundosRestantes : 300;
        setIsLocked(true);
        setLockSeconds(remaining);
        setShowLockModal(true);
        setIntentosRestantes(0);
      } else if (res.intentosRestantes !== undefined) {
        setIntentosRestantes(res.intentosRestantes);
      }
    }
  };

  const setTestAccount = (user: string, pass: string) => {
    setLoginInput(user);
    setPassword(pass);
    setErrorMsg('');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 transition-colors relative select-none"
      style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}
    >
      {/* Botones de tema y modo en esquina superior */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div 
          className="flex border rounded-lg p-0.5 text-xs shadow-xs" 
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}
        >
          <button 
            onClick={() => setTheme('adultos')} 
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
              theme === 'adultos' ? 'bg-sky-500 text-white dark:text-slate-950 font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            👔 Adultos
          </button>
          <button 
            onClick={() => setTheme('jovenes')} 
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
              theme === 'jovenes' ? 'bg-emerald-600 text-white dark:text-slate-950 font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            ⚡ Jóvenes
          </button>
          <button 
            onClick={() => setTheme('ninos')} 
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
              theme === 'ninos' ? 'bg-amber-500 text-white dark:text-slate-950 font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            🎨 Niños
          </button>
        </div>
        <button
          onClick={toggleMode}
          className="p-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}
          title="Alternar Modo Día / Noche"
        >
          {mode === 'dark' ? <Moon className="w-4 h-4 text-sky-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
        </button>
      </div>

      <div
        className="w-full max-w-md p-6 sm:p-8 rounded-xl border shadow-xl transition-all"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
        }}
      >
        {/* Encabezado Institucional Oficial FICCT - UAGRM */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden border p-1.5 flex items-center justify-center shadow-xs bg-white dark:bg-slate-900" style={{ borderColor: 'var(--border-color)' }}>
              <img 
                src={isotipoSistemas} 
                alt="Isotipo Ingeniería en Sistemas" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="h-10 flex items-center">
              <img 
                src={logoSistemas} 
                alt="Ingeniería en Sistemas FICCT UAGRM" 
                className="h-full object-contain max-w-[200px]"
              />
            </div>
          </div>
          <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white uppercase">
            Rediseño Curricular
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Facultad de Ingeniería en Ciencias de la Computación y Telecomunicaciones
          </p>
        </div>

        {/* Mensaje de Bloqueo Temporal (Fuerza Bruta) */}
        {isLocked && (
          <div className="mb-4 p-3 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 shrink-0 animate-pulse text-rose-500" />
              <div>
                <div className="font-bold">Acceso Temporalmente Bloqueado</div>
                <div className="text-[11px] opacity-90">Espere a que finalice el temporizador de seguridad.</div>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-md font-mono font-bold bg-rose-600 text-white text-xs shrink-0">
              {formatSeconds(lockSeconds)}
            </div>
          </div>
        )}

        {/* Mensaje de Error / Alerta de intentos restantes */}
        {!isLocked && errorMsg && (
          <div className="mb-4 p-3 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            {intentosRestantes !== null && intentosRestantes > 0 && (
              <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                {intentosRestantes} {intentosRestantes === 1 ? 'intento' : 'intentos'}
              </span>
            )}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Usuario o Correo Institucional
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 absolute left-3 text-slate-400" />
              <input
                type="text"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="ej: director o usuario@uagrm.edu.bo"
                disabled={isLocked}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-sky-500 transition disabled:opacity-50 font-medium"
                style={{
                  backgroundColor: 'var(--bg-app)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-main)',
                }}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Contraseña
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 absolute left-3 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLocked}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-sky-500 transition disabled:opacity-50 font-medium"
                style={{
                  backgroundColor: 'var(--bg-app)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-main)',
                }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || isLocked}
            className="w-full py-2.5 px-4 rounded-lg font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed bg-sky-500 hover:bg-sky-600 text-white"
          >
            {isLocked ? (
              <>
                <Clock className="w-4 h-4 animate-spin text-white" />
                <span>Bloqueado ({formatSeconds(lockSeconds)})</span>
              </>
            ) : loading ? (
              'Validando credenciales...'
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Cuentas de Acceso Rápido para Demostración */}
        <div className="mt-6 pt-4 border-t text-xs" style={{ borderColor: 'var(--border-color)' }}>
          <div className="font-semibold text-[11px] mb-2 text-center text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Cuentas precargadas para evaluación:
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => setTestAccount('director', 'Director123!')}
              disabled={isLocked}
              className="p-1.5 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left disabled:opacity-40"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
            >
              <div className="font-bold text-amber-500">Director (Evans)</div>
              <div className="text-slate-400 text-[10px]">director / Director123!</div>
            </button>
            <button
              type="button"
              onClick={() => setTestAccount('cmarca', 'Carlos123#')}
              disabled={isLocked}
              className="p-1.5 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left disabled:opacity-40"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
            >
              <div className="font-bold text-sky-500">Carlos Marca</div>
              <div className="text-slate-400 text-[10px]">cmarca / Carlos123#</div>
            </button>
            <button
              type="button"
              onClick={() => setTestAccount('croca', 'Delegado2026ñ$')}
              disabled={isLocked}
              className="p-1.5 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left disabled:opacity-40"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
            >
              <div className="font-bold text-emerald-500">Delegado (Roca)</div>
              <div className="text-slate-400 text-[10px]">croca / Delegado2026ñ$</div>
            </button>
            <button
              type="button"
              onClick={() => setTestAccount('mmendoza', 'Invitado2026ñ*')}
              disabled={isLocked}
              className="p-1.5 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left disabled:opacity-40"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
            >
              <div className="font-bold text-slate-500">Invitado (Mendoza)</div>
              <div className="text-slate-400 text-[10px]">mmendoza / Invitado2026ñ*</div>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Emergente de Alerta de Bloqueo (Fuerza Bruta) */}
      {showLockModal && createPortal(
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className="w-full max-w-md rounded-xl border shadow-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          >
            <div className="flex justify-end">
              <button
                onClick={() => setShowLockModal(false)}
                className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 opacity-70"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="inline-flex p-4 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <ShieldAlert className="w-12 h-12 animate-pulse" />
            </div>

            <h2 className="text-lg font-black text-rose-600 dark:text-rose-400">
              Acceso Bloqueado por Seguridad
            </h2>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Se ha detectado un número excesivo de intentos fallidos (límite de <strong>5 intentos</strong> superado).
              Por directrices de protección contra ataques de fuerza bruta, el acceso para esta cuenta e IP ha sido <strong>bloqueado por 5 minutos</strong>.
            </p>

            <div 
              className="p-3 rounded-lg border flex items-center justify-center gap-3"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
            >
              <Clock className="w-5 h-5 text-amber-500" />
              <div className="text-xs">
                <span className="text-slate-500">Tiempo restante de espera: </span>
                <span className="font-mono font-bold text-base text-rose-500 ml-1">
                  {formatSeconds(lockSeconds)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowLockModal(false)}
              className="w-full py-2.5 px-4 rounded-lg font-semibold text-xs border transition hover:opacity-80"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}
            >
              Entendido (Aguardar temporizador)
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
