import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { UsuarioBackend, Rol } from '../types';
import { 
  Users, UserPlus, Shield, Mail, CheckCircle2, 
  AlertCircle, X, Camera, Lock, User as UserIcon, RefreshCw,
  KeyRound, Copy, Check
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioBackend[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  // Modal para nuevo usuario
  const [showModal, setShowModal] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [idRol, setIdRol] = useState<number>(2); // Delegado por defecto
  const [password, setPassword] = useState('');
  const [generarAutoPassword, setGenerarAutoPassword] = useState(true);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Modal para restablecer contraseña
  const [showResetModal, setShowResetModal] = useState(false);
  const [targetUser, setTargetUser] = useState<UsuarioBackend | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetSaving, setResetSaving] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  // Validación de contraseña temporal de reseteo
  const isResetLengthValid = resetPassword.length >= 8 && resetPassword.length <= 25;
  const isResetHasUpper = /[A-ZÑ]/.test(resetPassword);
  const isResetHasLower = /[a-zñ]/.test(resetPassword);
  const isResetHasNumber = /[0-9]/.test(resetPassword);
  const isResetHasSpecial = /[@$!%*#?&_\-.]/.test(resetPassword);
  const isResetHasOnlyAllowed = /^[a-zA-Z0-9ñÑ@$!%*#?&_\-.]+$/.test(resetPassword);
  const isResetValid = isResetLengthValid && isResetHasUpper && isResetHasLower && isResetHasNumber && isResetHasSpecial && isResetHasOnlyAllowed;

  // Validación de contraseña en tiempo real: 8-25 caracteres, mayúscula, minúscula, número y símbolo permitido
  const isPasswordLengthValid = password.length >= 8 && password.length <= 25;
  const hasUpperCase = /[A-ZÑ]/.test(password);
  const hasLowerCase = /[a-zñ]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[@$!%*#?&_\-.]/.test(password);
  const hasOnlyAllowedChars = /^[a-zA-Z0-9ñÑ@$!%*#?&_\-.]+$/.test(password);
  const isPasswordValid = isPasswordLengthValid && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && hasOnlyAllowedChars;

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resUsers, resRoles] = await Promise.all([
        api.get('/usuarios'),
        api.get('/roles'),
      ]);

      if (resUsers.data.success) {
        setUsuarios(resUsers.data.usuarios || []);
      }
      if (resRoles.data.success) {
        setRoles(resRoles.data.roles || []);
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!nombreCompleto.trim() || !email.trim() || !username.trim()) {
      setFormError('Todos los campos son obligatorios.');
      return;
    }

    if (!generarAutoPassword && !isPasswordValid) {
      setFormError('La contraseña manual no cumple con la política de seguridad (8-25 caracteres, mayúscula, minúscula, número y símbolo).');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('nombre_completo', nombreCompleto.trim());
      formData.append('email', email.trim());
      formData.append('username', username.trim());
      formData.append('id_rol', idRol.toString());
      if (!generarAutoPassword && password) {
        formData.append('password', password);
      }
      if (fotoFile) {
        formData.append('foto', fotoFile);
      }

      const res = await api.post('/usuarios', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        setFormSuccess(res.data.message || 'Usuario registrado exitosamente.');
        setNombreCompleto('');
        setEmail('');
        setUsername('');
        setPassword('');
        setGenerarAutoPassword(true);
        setFotoFile(null);
        setFotoPreview(null);
        await cargarDatos();
        setTimeout(() => {
          setShowModal(false);
          setFormSuccess('');
        }, 1600);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      if (error.response?.data?.errors) {
        const firstErr = Object.values(error.response.data.errors)[0][0];
        setFormError(firstErr);
      } else {
        setFormError(error.response?.data?.message || 'Error al crear usuario.');
      }
    } finally {
      setSaving(false);
    }
  };

  const getRolBadgeColor = (rolId: number) => {
    switch (rolId) {
      case 1: // Director
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30';
      case 2: // Delegado
        return 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30';
      case 3: // Invitado
      default:
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    }
  };

  const handleAbrirResetModal = (u: UsuarioBackend) => {
    setTargetUser(u);
    setResetPassword('');
    setResetError('');
    setResetSuccess('');
    setCopied(false);
    setShowResetModal(true);
  };

  const handleGenerarSugerencia = () => {
    setResetPassword('Uagrm2026ñ*');
    setResetError('');
  };

  const handleEjecutarReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser || !isResetValid) return;

    setResetSaving(true);
    setResetError('');
    setResetSuccess('');

    try {
      const res = await api.post(`/usuarios/${targetUser.id}/reset-password`, {
        password: resetPassword,
      });

      if (res.data.success) {
        setResetSuccess(res.data.message || 'Contraseña temporal asignada correctamente.');
        setUsuarios((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, debe_cambiar_password: true } : u))
        );
      } else {
        setResetError(res.data.message || 'No se pudo restablecer la contraseña.');
      }
    } catch (err: any) {
      setResetError(err.response?.data?.message || 'Error de comunicación al restablecer la contraseña.');
    } finally {
      setResetSaving(false);
    }
  };

  const handleCopiarClave = () => {
    if (resetPassword) {
      navigator.clipboard.writeText(resetPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Encabezado */}
      <div 
        className="p-5 rounded-xl border shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
              Módulo 5 • Administración y Seguridad
            </span>
            <span className="text-xs text-slate-400 font-medium">Control de Accesos RBAC</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-sistemas-cyan" />
            Gestión de Usuarios y Roles
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Administración del cuerpo docente, comisiones curriculares y restablecimiento de claves temporales (ADR-006).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={cargarDatos}
            className="p-2 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-slate-600 dark:text-slate-300"
            style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
            title="Recargar usuarios"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sistemas-cyan' : ''}`} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo Usuario
          </button>
        </div>
      </div>

      {/* 2. Grid de Usuarios Registrados */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 animate-pulse flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-sistemas-cyan" />
          Cargando catálogo institucional de usuarios...
        </div>
      ) : usuarios.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400">
          No hay usuarios registrados en el sistema.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {usuarios.map((u) => {
            const hasFoto = u.foto_ruta && !u.foto_ruta.includes('default.png') && !imageErrors[u.id];
            const fotoUrl = hasFoto ? `/storage/${u.foto_ruta}` : null;
            return (
              <div
                key={u.id}
                className="p-4 rounded-xl border shadow-xs flex items-start gap-3.5 transition-all hover:border-slate-400 dark:hover:border-slate-600"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
              >
                {/* Foto / Avatar */}
                <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {fotoUrl ? (
                    <img
                      src={fotoUrl}
                      alt={u.nombre_completo}
                      className="w-full h-full object-cover"
                      onError={() => {
                        setImageErrors((prev) => ({ ...prev, [u.id]: true }));
                      }}
                    />
                  ) : (
                    <UserIcon className="w-6 h-6 text-slate-400" />
                  )}
                </div>

                {/* Datos del Usuario */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate" title={u.nombre_completo}>
                      {u.nombre_completo}
                    </h3>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    <span>@{u.username}</span>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 flex-shrink-0 opacity-60" />
                    <span className="truncate">{u.email}</span>
                  </div>

                  <div className="pt-1.5 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getRolBadgeColor(u.id_rol)}`}>
                      <Shield className="w-3 h-3" />
                      {u.rol?.nombre || 'Usuario'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      #{u.id}
                    </span>
                  </div>

                  {/* Alerta de cambio obligatorio pendiente */}
                  {u.debe_cambiar_password && (
                    <div className="mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <KeyRound className="w-3 h-3 shrink-0" />
                      <span>Clave temporal pendiente</span>
                    </div>
                  )}

                  {/* Botón de acción para el Director */}
                  <div className="pt-2 mt-2 border-t flex items-center justify-end" style={{ borderColor: 'var(--border-color)' }}>
                    {u.id === currentUser?.id ? (
                      <span className="text-[10px] text-slate-400 italic">
                        Su cuenta
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAbrirResetModal(u)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold border flex items-center gap-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-300"
                        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
                        title={`Restablecer contraseña para ${u.nombre_completo}`}
                      >
                        <KeyRound className="w-3 h-3 text-amber-500" />
                        <span>Restablecer</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Modal para Crear Usuario */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-lg rounded-xl border shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sistemas-cyan" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Registrar Nuevo Usuario Académico</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCrearUsuario} className="space-y-3.5 text-xs">
              {/* Carga de Fotografía */}
              <div 
                className="flex items-center gap-3.5 p-3 rounded-lg border border-dashed"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
              >
                <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Fotografía de Perfil (Opcional)</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFotoChange}
                    className="block w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-sky-500 file:text-white hover:file:bg-sky-600 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 block">Formatos: JPG, PNG, WebP (máx. 2MB).</span>
                  {fotoPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setFotoFile(null);
                        setFotoPreview(null);
                      }}
                      className="text-[10px] text-rose-500 hover:underline block pt-0.5 cursor-pointer"
                    >
                      Quitar fotografía seleccionada
                    </button>
                  )}
                </div>
              </div>

              {/* Nombre Completo */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Nombre Completo *</label>
                <input
                  type="text"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Ej. Ing. Evans Balcázar Veizaga"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                  required
                />
              </div>

              {/* Correo y Nombre de Usuario */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Correo Electrónico *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@uagrm.edu.bo"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Nombre de Usuario (Username) *</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ebalcazar"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                    required
                  />
                </div>
              </div>

              {/* Rol Académico (CU1, Req. 2) */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Rol de Acceso al Negocio *</label>
                <select
                  value={idRol}
                  onChange={(e) => setIdRol(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre} {r.descripcion ? `— ${r.descripcion}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Opción de Contraseña Automática o Manual con Notificación por Correo (ADR-006) */}
              <div className="space-y-2 p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={generarAutoPassword}
                      onChange={(e) => setGenerarAutoPassword(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-sistemas-cyan" />
                      Generar contraseña temporal y notificar por correo
                    </span>
                  </label>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    ADR-006
                  </span>
                </div>

                {generarAutoPassword ? (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 pt-1">
                    <p>
                      El sistema generará una <strong>clave temporal segura</strong> y la enviará junto con la <strong>matriz de actividades permitidas</strong> al correo institucional indicado.
                    </p>
                    <p className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Se exigirá cambio obligatorio de contraseña en su primer inicio de sesión.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Contraseña Temporal Manual *
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="8 a 25 caracteres alfanuméricos"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 text-xs ${
                        password ? (isPasswordValid ? 'border-emerald-500 focus:ring-emerald-500' : 'border-rose-500 focus:ring-rose-500') : 'focus:ring-sky-500'
                      }`}
                      style={{ backgroundColor: 'var(--bg-card)', borderColor: password ? undefined : 'var(--border-color)' }}
                      required={!generarAutoPassword}
                    />

                    {/* Guía de validación en tiempo real */}
                    <div 
                      className="p-2 rounded-lg border space-y-1 text-[11px]"
                      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                    >
                      <div className={`flex items-center gap-1.5 ${isPasswordLengthValid ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                        <CheckCircle2 className="w-3 h-3" /> Longitud entre 8 y 25 caracteres ({password.length}/25)
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasUpperCase && hasLowerCase ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                        <CheckCircle2 className="w-3 h-3" /> Al menos una mayúscula (A-Z, Ñ) y una minúscula (a-z, ñ)
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                        <CheckCircle2 className="w-3 h-3" /> Al menos un dígito numérico (0-9)
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasSpecialChar ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                        <CheckCircle2 className="w-3 h-3" /> Al menos un símbolo permitido (@$!%*#?&_\-.)
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasOnlyAllowedChars && password.length > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                        <CheckCircle2 className="w-3 h-3" /> Sin espacios ni caracteres prohibidos
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-2.5 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                  style={{ borderColor: 'var(--border-color)' }}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !isPasswordValid}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold shadow-xs transition disabled:opacity-40 flex items-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Guardando...
                    </>
                  ) : (
                    'Registrar Usuario'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 4. Modal para Restablecer Contraseña por el Director (ADR-006) */}
      {showResetModal && targetUser && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-md rounded-xl border shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Restablecer Contraseña (ADR-006)</h3>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Información del usuario afectado */}
            <div 
              className="p-3 rounded-lg border space-y-1"
              style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
            >
              <div className="text-xs font-bold text-slate-900 dark:text-white">{targetUser.nombre_completo}</div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>@{targetUser.username} • {targetUser.email}</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">{targetUser.rol?.nombre}</span>
              </div>
            </div>

            {resetError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <div className="font-bold">Contraseña restablecida con éxito</div>
                    <div className="text-[11px] opacity-90">{resetSuccess}</div>
                  </div>
                </div>

                <div 
                  className="p-3.5 rounded-lg border space-y-2"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                >
                  <span className="text-[11px] text-slate-400 block font-semibold">Contraseña temporal asignada:</span>
                  <div 
                    className="flex items-center justify-between gap-2 p-2 rounded-lg border font-mono font-bold text-sm"
                    style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
                  >
                    <span className="text-sky-600 dark:text-sky-400 tracking-wider">{resetPassword}</span>
                    <button
                      type="button"
                      onClick={handleCopiarClave}
                      className="px-2.5 py-1 rounded border text-xs flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-slate-700 dark:text-slate-300"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    * El usuario deberá cambiar obligatoriamente esta contraseña en su próximo inicio de sesión.
                  </span>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold cursor-pointer"
                  >
                    Entendido / Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEjecutarReset} className="space-y-3.5 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Nueva Contraseña Temporal *</label>
                    <button
                      type="button"
                      onClick={handleGenerarSugerencia}
                      className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Usar sugerencia: Uagrm2026ñ*</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="ej: Uagrm2026ñ*"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                    style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                    required
                  />
                </div>

                {/* Guía de validación en tiempo real */}
                <div 
                  className="p-2.5 rounded-lg border space-y-1 text-[11px]"
                  style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-color)' }}
                >
                  <div className={`flex items-center gap-1.5 ${isResetLengthValid ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-3 h-3" /> Longitud entre 8 y 25 caracteres ({resetPassword.length}/25)
                  </div>
                  <div className={`flex items-center gap-1.5 ${isResetHasUpper && isResetHasLower ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-3 h-3" /> Al menos una mayúscula (A-Z, Ñ) y una minúscula (a-z, ñ)
                  </div>
                  <div className={`flex items-center gap-1.5 ${isResetHasNumber ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-3 h-3" /> Al menos un dígito numérico (0-9)
                  </div>
                  <div className={`flex items-center gap-1.5 ${isResetHasSpecial ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-3 h-3" /> Al menos un símbolo permitido (@$!%*#?&_\-.)
                  </div>
                  <div className={`flex items-center gap-1.5 ${isResetHasOnlyAllowed && resetPassword.length > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-3 h-3" /> Sin espacios ni caracteres prohibidos
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                    style={{ borderColor: 'var(--border-color)' }}
                    disabled={resetSaving}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={resetSaving || !isResetValid}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold shadow-xs transition disabled:opacity-40 flex items-center gap-2 cursor-pointer"
                  >
                    {resetSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Restableciendo...
                      </>
                    ) : (
                      'Restablecer Contraseña'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
