import React, { useState } from 'react';
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

  if (!isOpen || !user) return null;

  // Validación preventiva de la política estricta de la UAGRM
  const isPasswordLengthValid = password.length === 0 || (password.length >= 8 && password.length <= 25);
  const isPasswordRegexValid = password.length === 0 || /^[a-zA-Z0-9ñÑ]+$/.test(password);
  const isPasswordValid = isPasswordLengthValid && isPasswordRegexValid;

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
      setFormError('La nueva contraseña no cumple con la política de seguridad (8-25 caracteres alfanuméricos, sin símbolos).');
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
    if (user.fotoRuta && !user.fotoRuta.includes('default.png')) {
      return `/storage/${user.fotoRuta}`;
    }
    return null;
  };

  const currentFoto = getFotoUrl();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-lg rounded-2xl border shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
      >
        {/* Cabecera */}
        <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base">Editar Mi Perfil</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensajes */}
        {formError && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {formSuccess && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{formSuccess}</span>
          </div>
        )}

        {/* Tarjeta de información de la cuenta (Solo lectura) */}
        <div className="p-3 rounded-xl border flex items-center gap-3 text-xs" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}>
          <div className="w-12 h-12 rounded-full border flex items-center justify-center overflow-hidden shrink-0" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
            {currentFoto ? (
              <img src={currentFoto} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-6 h-6 opacity-40" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold">@{user.username}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-500/40 text-amber-500 flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" />
                {user.rol}
              </span>
            </div>
            <div className="text-[11px] opacity-70 flex items-center gap-1 mt-0.5 truncate">
              <Mail className="w-3 h-3 opacity-50 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="text-[10px] opacity-50 mt-0.5">
              * El correo y el rol solo pueden ser modificados por la Dirección de Carrera.
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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
                  <AlertTriangle className="w-3.5 h-3.5" /> Política de Seguridad UAGRM:
                </div>
                <div className={`flex items-center gap-1.5 ${isPasswordLengthValid ? 'text-emerald-500 font-medium' : 'opacity-60'}`}>
                  {isPasswordLengthValid ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 inline-block">•</span>}
                  <span>Longitud entre 8 y 25 caracteres ({password.length}/25)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${isPasswordRegexValid ? 'text-emerald-500 font-medium' : 'opacity-60'}`}>
                  {isPasswordRegexValid ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 inline-block">•</span>}
                  <span>Solo letras (incluye ñ/Ñ) y números (sin caracteres especiales)</span>
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="py-2 px-4 rounded-lg border font-semibold hover:opacity-80 transition"
              style={{ borderColor: 'var(--border-color)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || (password.length > 0 && !isPasswordValid)}
              className="py-2 px-5 rounded-lg font-semibold shadow-md transition disabled:opacity-50"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-text)' }}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

