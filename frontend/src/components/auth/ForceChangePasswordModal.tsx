import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  KeyRound, Lock, CheckCircle2, AlertCircle, 
  LogOut, ShieldAlert, Eye, EyeOff, RefreshCw 
} from 'lucide-react';

export const ForceChangePasswordModal: React.FC = () => {
  const { user, updateUser, logout } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!user || !user.debeCambiarPassword) {
    return null;
  }

  // Validación de requisitos de seguridad en tiempo real
  const isLengthValid = password.length >= 8 && password.length <= 25;
  const hasUpperCase = /[A-ZÑ]/.test(password);
  const hasLowerCase = /[a-zñ]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[@$!%*#?&_\-.]/.test(password);
  const hasOnlyAllowed = /^[a-zA-Z0-9ñÑ@$!%*#?&_\-.]+$/.test(password);
  const isMatch = password.length > 0 && password === confirmPassword;

  const isFormValid = isLengthValid && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && hasOnlyAllowed && isMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isFormValid) {
      setErrorMsg('La nueva contraseña no cumple con todas las directrices institucionales de seguridad.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/auth/cambiar-password-obligatorio', {
        password: password,
      });

      if (res.data.success) {
        updateUser(res.data.user);
      } else {
        setErrorMsg(res.data.message || 'No se pudo actualizar la contraseña.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error de comunicación al actualizar la contraseña.');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl border shadow-2xl p-6 space-y-4"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-main)',
        }}
      >
        {/* Cabecera */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/25">
            <KeyRound className="w-10 h-10 animate-bounce" />
          </div>
          <h2 className="text-xl font-black">Actualización Obligatoria de Contraseña</h2>
          <p className="text-xs opacity-75 max-w-md mx-auto">
            Estimado(a) <strong>{user.nombreCompleto}</strong>: Su contraseña ha sido restablecida temporalmente por la Dirección de Carrera. Por políticas de seguridad, es indispensable que defina su contraseña personal definitiva para desbloquear el acceso al sistema.
          </p>
        </div>

        {/* Mensaje de error */}
        {errorMsg && (
          <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Campo Contraseña Nueva */}
          <div>
            <label className="block font-semibold mb-1">Nueva Contraseña Definitiva *</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 opacity-40" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres alfanuméricos y especiales"
                className="w-full pl-9 pr-10 py-2.5 rounded-lg border focus:outline-none transition"
                style={{
                  backgroundColor: 'var(--bg-app)',
                  borderColor: 'var(--border-color)',
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 opacity-50 hover:opacity-100"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Campo Confirmar Contraseña */}
          <div>
            <label className="block font-semibold mb-1">Confirmar Contraseña *</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 opacity-40" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Reingrese exactamente la misma contraseña"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border focus:outline-none transition"
                style={{
                  backgroundColor: 'var(--bg-app)',
                  borderColor: 'var(--border-color)',
                }}
                required
              />
            </div>
          </div>

          {/* Lista de validación en tiempo real */}
          <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 space-y-1.5 text-[11px] border" style={{ borderColor: 'var(--border-color)' }}>
            <div className="font-semibold text-amber-500 flex items-center gap-1 mb-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Requisitos Institucionales:
            </div>
            <div className={`flex items-center gap-1.5 ${isLengthValid ? 'text-emerald-500 font-semibold' : 'opacity-60'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Longitud entre 8 y 25 caracteres ({password.length}/25)
            </div>
            <div className={`flex items-center gap-1.5 ${hasUpperCase && hasLowerCase ? 'text-emerald-500 font-semibold' : 'opacity-60'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Al menos una mayúscula (A-Z/Ñ) y una minúscula (a-z/ñ)
            </div>
            <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-500 font-semibold' : 'opacity-60'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Al menos un dígito numérico (0-9)
            </div>
            <div className={`flex items-center gap-1.5 ${hasSpecialChar ? 'text-emerald-500 font-semibold' : 'opacity-60'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Al menos un símbolo permitido (@, $, !, %, *, #, ?, &, _, -, .)
            </div>
            <div className={`flex items-center gap-1.5 ${hasOnlyAllowed && password.length > 0 ? 'text-emerald-500 font-semibold' : 'opacity-60'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Sin espacios ni caracteres prohibidos
            </div>
            <div className={`flex items-center gap-1.5 ${isMatch ? 'text-emerald-500 font-semibold' : 'opacity-60'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Las contraseñas coinciden
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <button
              type="button"
              onClick={logout}
              className="px-3 py-2 rounded-lg border text-rose-500 border-rose-500/30 hover:bg-rose-500/10 transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Cerrar Sesión
            </button>

            <button
              type="submit"
              disabled={saving || !isFormValid}
              className="px-5 py-2.5 rounded-lg font-semibold text-white bg-primary hover:opacity-90 disabled:opacity-40 transition flex items-center gap-2 shadow-md cursor-pointer disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Guardando...
                </>
              ) : (
                'Establecer Mi Contraseña Definitiva'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
