import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, Mail, AlertCircle, ArrowRight, Sun, Moon } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { mode, toggleMode, theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    }
  };

  const setTestAccount = (user: string, pass: string) => {
    setLoginInput(user);
    setPassword(pass);
    setErrorMsg('');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 transition-colors relative"
      style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}
    >
      {/* Botones flotantes de tema y modo en la esquina */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className="flex border rounded-lg p-0.5 text-xs" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
          <button onClick={() => setTheme('ninos')} className={`px-2 py-1 rounded ${theme === 'ninos' ? 'font-bold underline' : 'opacity-70'}`}>🎨 Niños</button>
          <button onClick={() => setTheme('jovenes')} className={`px-2 py-1 rounded ${theme === 'jovenes' ? 'font-bold underline' : 'opacity-70'}`}>⚡ Jóvenes</button>
          <button onClick={() => setTheme('adultos')} className={`px-2 py-1 rounded ${theme === 'adultos' ? 'font-bold underline' : 'opacity-70'}`}>👔 Adultos</button>
        </div>
        <button
          onClick={toggleMode}
          className="p-2 border rounded-lg hover:opacity-80 transition"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}
        >
          {mode === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
        </button>
      </div>

      <div
        className="w-full max-w-md p-8 rounded-2xl border shadow-xl transition-all"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
        }}
      >
        {/* Encabezado del Formulario */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl mb-3 shadow-inner" style={{ backgroundColor: 'var(--bg-app)' }}>
            <GraduationCap className="w-10 h-10" style={{ color: 'var(--primary)' }} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Seguimiento al Diseño Curricular</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Ingeniería en Sistemas • INF-513 Tecnología Web
          </p>
        </div>

        {/* Mensaje de Error en Español */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-main)' }}>
              Correo electrónico o Nombre de usuario
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 opacity-50" />
              <input
                type="text"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="ej: director o usuario@uagrm.edu.bo"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border focus:outline-none transition"
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
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-main)' }}>
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 opacity-50" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border focus:outline-none transition"
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
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg font-semibold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-text)',
            }}
          >
            {loading ? 'Validando credenciales...' : 'Iniciar Sesión'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Cuentas de Acceso Rápido para Pruebas y Evaluación */}
        <div className="mt-6 pt-5 border-t text-xs" style={{ borderColor: 'var(--border-color)' }}>
          <div className="font-semibold mb-2 text-center opacity-70">
            Cuentas precargadas para evaluación:
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => setTestAccount('director', 'admin123')}
              className="p-1.5 border rounded hover:opacity-80 transition text-left"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
            >
              <div className="font-bold text-amber-500">Director / Evans</div>
              <div className="opacity-60 text-[10px]">director / admin123</div>
            </button>
            <button
              type="button"
              onClick={() => setTestAccount('cmarca', 'carlos123')}
              className="p-1.5 border rounded hover:opacity-80 transition text-left"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
            >
              <div className="font-bold text-blue-500">Carlos Marca</div>
              <div className="opacity-60 text-[10px]">cmarca / carlos123</div>
            </button>
            <button
              type="button"
              onClick={() => setTestAccount('luisecv', 'Admin2026ñ')}
              className="p-1.5 border rounded hover:opacity-80 transition text-left"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
            >
              <div className="font-bold text-purple-500">Luis Fernando</div>
              <div className="opacity-60 text-[10px]">luisecv / Admin2026ñ</div>
            </button>
            <button
              type="button"
              onClick={() => setTestAccount('tvalda', 'Admin2026ñ')}
              className="p-1.5 border rounded hover:opacity-80 transition text-left"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
            >
              <div className="font-bold text-emerald-500">Tania Valda</div>
              <div className="opacity-60 text-[10px]">tvalda / Admin2026ñ</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

