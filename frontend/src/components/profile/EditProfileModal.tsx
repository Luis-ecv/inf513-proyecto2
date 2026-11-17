import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  X, Camera, Lock, User as UserIcon, CheckCircle2, 
  AlertCircle, Shield, Mail, Check, AlertTriangle 
} from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();

  const [nombreCompleto, setNombreCompleto] = useState(user?.nombreCompleto || '');
  const [password, setPassword] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [modalAvatarError, setModalAvatarError] = useState(false);

  if (!isOpen || !user) return null;

  // Validación preventiva de la política institucional de seguridad
  const isPasswordLengthValid = password.length === 0 || (password.length >= 8 && password.length <= 25);
  const hasUpperCase = password.length === 0 || /[A-ZÑ]/.test(password);
  const hasLowerCase = password.length === 0 || /[a-zñ]/.test(password);
  const hasNumber = password.length === 0 || /[0-9]/.test(password);
  const hasSpecialChar = password.length === 0 || /[@$!%*#?&_\-.]/.test(password);
  const hasOnlyAllowedChars = password.length === 0 || /^[a-zA-Z0-9ñÑ@$!%*#?&_\-.]+$/.test(password);
  const isPasswordValid = isPasswordLengthValid && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && hasOnlyAllowedChars;

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (password && !isPasswordValid) {
      setFormError('La nueva contraseña no cumple con la política de seguridad (8-25 caracteres, al menos una mayúscula, una minúscula, un número y un símbolo permitido).');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      if (nombreCompleto.trim() && nombreCompleto.trim() !== user.nombreCompleto) {
        formData.append('nombre_completo', nombreCompleto.trim());
      }
      if (password.trim()) {
        formData.append('password', password.trim());
      }
      if (fotoFile) {
        formData.append('foto', fotoFile);
      }

      const res = await api.post('/auth/perfil', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        setFormSuccess(res.data.message || 'Perfil actualizado exitosamente.');
        updateUser(res.data.user);
        setPassword('');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setFormError(res.data.message || 'No se pudo actualizar el perfil.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error de comunicación al actualizar perfil.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const getFotoUrl = () => {
    if (fotoPreview) return fotoPreview;
    if (user.fotoRuta && !user.fotoRuta.includes('default.png') && !modalAvatarError) {
      return `/storage/${user.fotoRuta}`;
    }
    return null;
  };

  const currentFoto = getFotoUrl();

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div
        className="flex min-h-full items-center justify-center p-4 sm:p-6"
      >
        <div
          className="flex w-full max-w-xl max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border shadow-2xl sm:max-h-[calc(100vh-3rem)]"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
        >
          {/* Cabecera */}
          <div className="flex shrink-0 items-center justify-between border-b px-5 py-4 sm:px-6" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <UserIcon className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-base">Editar Mi Perfil</h3>
                <p className="text-[11px] opacity-60">Actualiza tu información personal</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 opacity-60 transition hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10"
              aria-label="Cerrar edición de perfil"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-y-auto px-5 py-4 sm:px-6">
            {/* Mensajes */}
            {formError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-500">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-500">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* Tarjeta de información de la cuenta (Solo lectura) */}
            <div className="flex items-center gap-3 rounded-xl border p-3 text-xs" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                {currentFoto ? (
                  <img 
                    src={currentFoto} 
                    alt="Avatar" 
                    className="h-full w-full object-cover" 
                    onError={() => setModalAvatarError(true)}
                  />
                ) : (
                  <UserIcon className="h-6 w-6 opacity-40" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-semibold">@{user.username}</span>
                  <span className="flex items-center gap-1 rounded-full border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                    <Shield className="h-2.5 w-2.5" />
                    {user.rol}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1 truncate text-[11px] opacity-70">
                  <Mail className="h-3 w-3 shrink-0 opacity-50" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="mt-0.5 text-[10px] opacity-50">
                  * El correo y el rol solo pueden ser modificados por la Dirección de Carrera.
                </div>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Nombre Completo */}
          <div>
            <label className="block font-semibold mb-1">Nombre Completo</label>
            <input
              type="text"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              className="w-full p-2.5 rounded-lg border focus:outline-none transition"
              style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
              required
            />
          </div>

          {/* Subir Nueva Foto */}
          <div>
            <label className="block font-semibold mb-1">Cambiar Foto de Perfil</label>
            <div className="flex items-center gap-3">
              <label 
                className="cursor-pointer py-2 px-3 rounded-lg border flex items-center gap-2 hover:opacity-80 transition"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
              >
                <Camera className="w-4 h-4 text-amber-500" />
                <span>{fotoFile ? fotoFile.name : 'Seleccionar imagen...'}</span>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp" 
                  onChange={handleFotoChange}
                  className="hidden" 
                />
              </label>
              {fotoFile && (
                <button
                  type="button"
                  onClick={() => { setFotoFile(null); setFotoPreview(null); }}
                  className="text-xs text-rose-500 hover:underline"
                >
                  Quitar
                </button>
              )}
            </div>
          </div>

          {/* Cambiar Contraseña */}
          <div className="pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <label className="block font-semibold mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              Cambiar Contraseña (Opcional)
            </label>
            <input
              type="password"
              placeholder="Dejar en blanco para mantener la actual"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 rounded-lg border focus:outline-none transition"
              style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
            />

            {/* Validador de política UAGRM */}
            {password.length > 0 && (
              <div className="mt-2 p-2.5 rounded-lg border space-y-1 text-[11px]" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}>
                <div className="font-semibold text-amber-500 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Política de Seguridad Institucional:
                </div>
                <div className={`flex items-center gap-1.5 ${isPasswordLengthValid ? 'text-emerald-500 font-medium' : 'opacity-60'}`}>
                  {isPasswordLengthValid ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 inline-block">•</span>}
                  <span>Longitud entre 8 y 25 caracteres ({password.length}/25)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpperCase && hasLowerCase ? 'text-emerald-500 font-medium' : 'opacity-60'}`}>
                  {hasUpperCase && hasLowerCase ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 inline-block">•</span>}
                  <span>Al menos una mayúscula (A-Z/Ñ) y una minúscula (a-z/ñ)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-500 font-medium' : 'opacity-60'}`}>
                  {hasNumber ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 inline-block">•</span>}
                  <span>Al menos un número (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecialChar ? 'text-emerald-500 font-medium' : 'opacity-60'}`}>
                  {hasSpecialChar ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 inline-block">•</span>}
                  <span>Al menos un carácter especial (@$!%*#?&_\-.)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasOnlyAllowedChars ? 'text-emerald-500 font-medium' : 'opacity-60'}`}>
                  {hasOnlyAllowedChars ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 inline-block">•</span>}
                  <span>Sin espacios ni caracteres prohibidos</span>
                </div>
              </div>
            )}
          </div>

              {/* Botones de acción */}
              <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="rounded-lg border px-4 py-2 font-semibold transition hover:opacity-80"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || (password.length > 0 && !isPasswordValid)}
                  className="rounded-lg px-5 py-2 font-semibold shadow-md transition disabled:opacity-50"
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-text)' }}
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
