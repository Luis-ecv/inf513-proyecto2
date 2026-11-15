import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme, type FontSize } from '../../context/ThemeContext';
import { 
  Search, Sun, Moon, Sparkles, Type, Eye, LogOut, 
  BookOpen, Layers, Archive, FileText, X, User as UserIcon
} from 'lucide-react';
import api from '../../services/api';
import type { SearchResults } from '../../types';
import { useNavigate } from 'react-router-dom';
import { EditProfileModal } from '../profile/EditProfileModal';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { 
    theme, setTheme, mode, toggleMode, isAutoMode, setIsAutoMode,
    fontSize, setFontSize, contrast, toggleContrast 
  } = useTheme();

  const navigate = useNavigate();

  // Estado del buscador global (Requisito 9)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Selector de accesibilidad desplegable
  const [showAccessMenu, setShowAccessMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.fotoRuta]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get('/site/busqueda', { params: { q: searchQuery } });
        if (res.data.success) {
          setSearchResults(res.data.resultados);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error('Error en búsqueda global:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 h-16 border-b px-4 lg:px-6 flex items-center justify-between transition-colors backdrop-blur-md"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-main)',
      }}
    >
      {/* 1. Buscador Global del Negocio en Encabezado (Requisito 9) */}
      <div className="relative w-72 sm:w-96" ref={searchRef}>
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 opacity-50" />
          <input
            type="text"
            placeholder="Buscar materia, capítulo, norma o plan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowSearchDropdown(true)}
            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border focus:outline-none transition-all"
            style={{
              backgroundColor: 'var(--bg-app)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)',
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}
              className="absolute right-2 text-xs opacity-50 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown de Resultados de Búsqueda */}
        {showSearchDropdown && searchResults && (
          <div 
            className="absolute left-0 right-0 mt-2 rounded-xl shadow-2xl border p-3 max-h-96 overflow-y-auto z-50 text-sm"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
            }}
          >
            {isSearching && (
              <div className="p-2 text-center text-xs opacity-60">Buscando en la base de datos...</div>
            )}

            {/* Asignaturas */}
            {searchResults.asignaturas.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--primary)' }}>
                  <BookOpen className="w-3.5 h-3.5" /> Asignaturas
                </div>
                {searchResults.asignaturas.map((asig) => (
                  <div
                    key={asig.id}
                    onClick={() => { navigate('/malla'); setShowSearchDropdown(false); }}
                    className="p-1.5 rounded cursor-pointer hover:opacity-80 flex justify-between items-center transition"
                  >
                    <span className="font-medium">{asig.sigla} - {asig.nombre}</span>
                    <span className="text-xs opacity-60">Semestre {asig.semestre} ({asig.creditos} cr)</span>
                  </div>
                ))}
              </div>
            )}

            {/* Capítulos */}
            {searchResults.capitulos.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--primary)' }}>
                  <Layers className="w-3.5 h-3.5" /> Capítulos del Rediseño
                </div>
                {searchResults.capitulos.map((cap) => (
                  <div
                    key={cap.id}
                    onClick={() => { navigate(`/capitulos/${cap.id}`); setShowSearchDropdown(false); }}
                    className="p-1.5 rounded cursor-pointer hover:opacity-80 flex justify-between items-center transition"
                  >
                    <span>Capítulo {cap.numero}: {cap.titulo}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded border text-xs" style={{ borderColor: 'var(--border-color)' }}>
                      {cap.estado?.nombre}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Evidencias */}
            {searchResults.evidencias.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--primary)' }}>
                  <Archive className="w-3.5 h-3.5" /> Documentos y Resoluciones
                </div>
                {searchResults.evidencias.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => { navigate('/evidencias'); setShowSearchDropdown(false); }}
                    className="p-1.5 rounded cursor-pointer hover:opacity-80 flex justify-between items-center transition"
                  >
                    <span className="truncate">{doc.codigo_norma}: {doc.titulo}</span>
                    <span className="text-xs opacity-60 whitespace-nowrap ml-2">{doc.organo_emisor}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Planes */}
            {searchResults.planes.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--primary)' }}>
                  <FileText className="w-3.5 h-3.5" /> Planes Curriculares
                </div>
                {searchResults.planes.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => { navigate('/malla'); setShowSearchDropdown(false); }}
                    className="p-1.5 rounded cursor-pointer hover:opacity-80 flex justify-between items-center transition"
                  >
                    <span>{p.codigo} - {p.carrera} ({p.anio_vigencia})</span>
                    <span className="text-xs opacity-60">{p.estado}</span>
                  </div>
                ))}
              </div>
            )}

            {searchResults.asignaturas.length === 0 && searchResults.capitulos.length === 0 && searchResults.evidencias.length === 0 && searchResults.planes.length === 0 && (
              <div className="text-center py-4 opacity-50 text-xs">
                No se encontraron resultados para "{searchQuery}".
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Controles de Tema, Día/Noche y Accesibilidad (Requisito 5) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Selector de los 3 Temas */}
        <div className="flex items-center border rounded-lg p-0.5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}>
          <button
            onClick={() => setTheme('ninos')}
            title="Tema Niños (Colorido y amigable)"
            className={`px-2 py-1 text-xs rounded-md transition font-medium ${theme === 'ninos' ? 'shadow-sm font-bold' : 'opacity-70'}`}
            style={theme === 'ninos' ? { backgroundColor: 'var(--primary)', color: 'var(--primary-text)' } : {}}
          >
            🎨 Niños
          </button>
          <button
            onClick={() => setTheme('jovenes')}
            title="Tema Jóvenes (Moderno y tecnológico)"
            className={`px-2 py-1 text-xs rounded-md transition font-medium ${theme === 'jovenes' ? 'shadow-sm font-bold' : 'opacity-70'}`}
            style={theme === 'jovenes' ? { backgroundColor: 'var(--primary)', color: 'var(--primary-text)' } : {}}
          >
            ⚡ Jóvenes
          </button>
          <button
            onClick={() => setTheme('adultos')}
            title="Tema Adultos (Formal e institucional)"
            className={`px-2 py-1 text-xs rounded-md transition font-medium ${theme === 'adultos' ? 'shadow-sm font-bold' : 'opacity-70'}`}
            style={theme === 'adultos' ? { backgroundColor: 'var(--primary)', color: 'var(--primary-text)' } : {}}
          >
            👔 Adultos
          </button>
        </div>

        {/* Modo Día / Noche (con detección automática por horario del cliente) */}
        <button
          onClick={toggleMode}
          title={isAutoMode ? `Modo ${mode === 'dark' ? 'Noche' : 'Día'} (Automático según tu hora local)` : `Modo ${mode === 'dark' ? 'Noche' : 'Día'} (Manual)`}
          className="p-2 rounded-lg border hover:opacity-80 transition relative flex items-center justify-center"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
        >
          {mode === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
          {isAutoMode && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" title="Sincronizado con horario local" />
          )}
        </button>

        {/* Menú de Accesibilidad (Tamaño de Letra y Alto Contraste) */}
        <div className="relative">
          <button
            onClick={() => setShowAccessMenu(!showAccessMenu)}
            title="Opciones de Accesibilidad"
            className="p-2 rounded-lg border hover:opacity-80 transition flex items-center gap-1"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
          >
            <Type className="w-4 h-4" />
          </button>

          {showAccessMenu && (
            <div 
              className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl border p-3 z-50 text-xs"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <div className="font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--primary)' }}>
                <Eye className="w-3.5 h-3.5" /> Accesibilidad Visual
              </div>

              {/* Tamaño de fuente */}
              <div className="mb-3">
                <label className="block mb-1 opacity-70">Tamaño de Fuente:</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['normal', 'large', 'xlarge'] as FontSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={`py-1 border rounded capitalize transition ${fontSize === size ? 'font-bold' : 'opacity-60'}`}
                      style={fontSize === size ? { borderColor: 'var(--primary)', color: 'var(--primary)' } : { borderColor: 'var(--border-color)' }}
                    >
                      {size === 'normal' ? 'Normal' : size === 'large' ? 'Grande' : 'Extra'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alto Contraste */}
              <div className="pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  onClick={toggleContrast}
                  className="w-full py-1.5 px-2 border rounded flex justify-between items-center transition"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <span>Alto Contraste:</span>
                  <span className="font-bold uppercase text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-app)' }}>
                    {contrast === 'high' ? 'Activado' : 'Normal'}
                  </span>
                </button>
              </div>

              {/* Restaurar sincronización horaria automática */}
              <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  onClick={() => setIsAutoMode(true)}
                  className="w-full text-left py-1 opacity-70 hover:opacity-100 flex items-center gap-1 text-[11px]"
                >
                  <Sparkles className="w-3 h-3 text-emerald-500" /> Horario automático (Día/Noche)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Perfil de Usuario y Logout */}
        {user && (
          <>
            <div className="flex items-center gap-2 pl-2 border-l" style={{ borderColor: 'var(--border-color)' }}>
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-2 p-1.5 rounded-lg border hover:opacity-80 transition text-left"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
                title="Editar mi perfil"
              >
                <div className="w-7 h-7 rounded-full border flex items-center justify-center overflow-hidden shrink-0" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                  {user.fotoRuta && !user.fotoRuta.includes('default.png') && !avatarError ? (
                    <img 
                      src={`/storage/${user.fotoRuta}`} 
                      alt="Avatar" 
                      className="w-full h-full object-cover" 
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <UserIcon className="w-4 h-4 opacity-60" />
                  )}
                </div>
                <div className="hidden sm:block pr-1">
                  <div className="text-xs font-semibold leading-tight">{user.nombreCompleto}</div>
                  <div className="text-[10px] opacity-60 leading-tight capitalize">{user.rol}</div>
                </div>
              </button>
              <button
                onClick={logout}
                title="Cerrar Sesión"
                className="p-2 rounded-lg border text-rose-500 hover:bg-rose-500/10 transition"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            <EditProfileModal 
              isOpen={showProfileModal} 
              onClose={() => setShowProfileModal(false)} 
            />
          </>
        )}
      </div>
    </header>
  );
};
