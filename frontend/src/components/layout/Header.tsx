import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme, type FontSize } from '../../context/ThemeContext';
import { 
  Search, Sun, Moon, Sparkles, Type, Eye, LogOut, 
  BookOpen, Layers, Archive, FileText, X, User as UserIcon, Menu
} from 'lucide-react';
import api from '../../services/api';
import type { SearchResults } from '../../types';
import { useNavigate } from 'react-router-dom';
import { EditProfileModal } from '../profile/EditProfileModal';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Selector de accesibilidad desplegable
  const [showAccessMenu, setShowAccessMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Atajo de teclado global Ctrl+K / Cmd+K para enfocar búsqueda
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        if (searchQuery.trim().length >= 2) {
          setShowSearchDropdown(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
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

  // Manejar cambio de texto en buscador
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length < 2) {
      setSearchResults(null);
      setShowSearchDropdown(false);
    }
  };

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
    <header 
      className="sticky top-0 z-40 h-16 border-b px-3 sm:px-4 lg:px-6 flex items-center justify-between transition-colors backdrop-blur-md shrink-0 gap-2"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-main)',
      }}
    >
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-1 sm:mr-3">
        {/* Botón Hamburguesa para Móvil y Tablet */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300 shrink-0 cursor-pointer"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
          title="Abrir menú de navegación"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* 1. Buscador Global del Negocio tipo Command-Bar (Requisito 9) */}
        <div className="relative w-full max-w-xs sm:max-w-sm" ref={searchRef}>
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar materia, capítulo, norma... (Ctrl+K)"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery.length >= 2 && setShowSearchDropdown(true)}
            className="w-full pl-9 pr-14 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all font-medium"
            style={{
              backgroundColor: 'var(--bg-app)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)',
            }}
          />
          {searchQuery ? (
            <button 
              onClick={() => { setSearchQuery(''); setSearchResults(null); setShowSearchDropdown(false); }}
              className="absolute right-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              title="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-2.5 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded border border-slate-300 dark:border-slate-700 text-slate-400 bg-slate-100 dark:bg-slate-800">
              ⌘K
            </kbd>
          )}
        </div>

        {/* Dropdown de Resultados de Búsqueda */}
        {showSearchDropdown && searchResults && (
          <div 
            className="absolute left-0 right-0 mt-2 rounded-xl shadow-xl border p-3 max-h-96 overflow-y-auto z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
            }}
          >
            {isSearching && (
              <div className="p-2 text-center text-xs text-slate-400">
                Buscando en la base de datos curricular...
              </div>
            )}

            {/* Asignaturas */}
            {searchResults.asignaturas.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-1 text-sistemas-cyan">
                  <BookOpen className="w-3.5 h-3.5" /> Asignaturas
                </div>
                {searchResults.asignaturas.map((asig) => (
                  <div
                    key={asig.id}
                    onClick={() => { navigate('/malla'); setShowSearchDropdown(false); }}
                    className="p-2 rounded-lg cursor-pointer hover:bg-sky-500/10 flex justify-between items-center transition"
                  >
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {asig.sigla} - {asig.nombre}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Semestre {asig.semestre} ({asig.creditos} cr)
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Capítulos */}
            {searchResults.capitulos.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-1 text-sistemas-green">
                  <Layers className="w-3.5 h-3.5" /> Capítulos del Rediseño
                </div>
                {searchResults.capitulos.map((cap) => (
                  <div
                    key={cap.id}
                    onClick={() => { navigate(`/capitulos/${cap.id}`); setShowSearchDropdown(false); }}
                    className="p-2 rounded-lg cursor-pointer hover:bg-emerald-500/10 flex justify-between items-center transition"
                  >
                    <span className="font-semibold text-slate-700 dark:text-slate-200 truncate pr-2">
                      Cap. {cap.numero}: {cap.titulo}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded border text-slate-500 shrink-0" style={{ borderColor: 'var(--border-color)' }}>
                      {cap.estado?.nombre}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Evidencias */}
            {searchResults.evidencias.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-1 text-sky-600 dark:text-sky-400">
                  <Archive className="w-3.5 h-3.5" /> Resoluciones y Evidencias
                </div>
                {searchResults.evidencias.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => { navigate('/evidencias'); setShowSearchDropdown(false); }}
                    className="p-2 rounded-lg cursor-pointer hover:bg-sky-500/10 flex justify-between items-center transition"
                  >
                    <span className="truncate text-slate-700 dark:text-slate-200">
                      <span className="font-bold">{doc.codigo_norma}:</span> {doc.titulo}
                    </span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2 shrink-0">
                      {doc.organo_emisor}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Planes */}
            {searchResults.planes.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-1 text-amber-500">
                  <FileText className="w-3.5 h-3.5" /> Planes Curriculares
                </div>
                {searchResults.planes.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => { navigate('/malla'); setShowSearchDropdown(false); }}
                    className="p-2 rounded-lg cursor-pointer hover:bg-amber-500/10 flex justify-between items-center transition"
                  >
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {p.codigo} - {p.carrera} ({p.anio_vigencia})
                    </span>
                    <span className="text-[10px] text-amber-500 font-medium">{p.estado}</span>
                  </div>
                ))}
              </div>
            )}

            {searchResults.asignaturas.length === 0 && searchResults.capitulos.length === 0 && searchResults.evidencias.length === 0 && searchResults.planes.length === 0 && (
              <div className="text-center py-4 text-slate-400 text-xs">
                No se encontraron resultados para "{searchQuery}".
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {/* 2. Controles de Tema, Día/Noche y Accesibilidad (Requisito 5) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Selector Segmentado de Temas */}
        <div 
          className="hidden md:flex items-center border rounded-lg p-0.5 text-xs shadow-xs"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
        >
          <button
            onClick={() => setTheme('adultos')}
            title="Tema Adultos (Institucional Sistemas FICCT)"
            className={`px-2.5 py-1 text-[11px] rounded-md transition font-semibold ${
              theme === 'adultos' 
                ? 'shadow-xs bg-sky-500 text-white dark:bg-sky-500 dark:text-slate-950' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
             Adultos
          </button>
          <button
            onClick={() => setTheme('jovenes')}
            title="Tema Jóvenes (Moderno y tecnológico)"
            className={`px-2.5 py-1 text-[11px] rounded-md transition font-semibold ${
              theme === 'jovenes' 
                ? 'shadow-xs bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
             Jóvenes
          </button>
          <button
            onClick={() => setTheme('ninos')}
            title="Tema Niños (Colorido y lúdico)"
            className={`px-2.5 py-1 text-[11px] rounded-md transition font-semibold ${
              theme === 'ninos' 
                ? 'shadow-xs bg-amber-500 text-white dark:bg-amber-400 dark:text-slate-950' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
             Niños
          </button>
        </div>

        {/* Modo Día / Noche */}
        <button
          onClick={toggleMode}
          title={isAutoMode ? `Modo ${mode === 'dark' ? 'Noche' : 'Día'} (Sincronizado con tu hora local)` : `Modo ${mode === 'dark' ? 'Noche' : 'Día'} (Manual)`}
          className="p-2 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition relative flex items-center justify-center text-slate-700 dark:text-slate-300"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
        >
          {mode === 'dark' ? <Moon className="w-4 h-4 text-sky-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
          {isAutoMode && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" title="Sincronizado con horario local" />
          )}
        </button>

        {/* Menú de Accesibilidad */}
        <div className="relative">
          <button
            onClick={() => setShowAccessMenu(!showAccessMenu)}
            title="Opciones de Accesibilidad Visual"
            className="p-2 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center text-slate-700 dark:text-slate-300"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
          >
            <Type className="w-4 h-4" />
          </button>

          {showAccessMenu && (
            <div 
              className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl border p-3 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <div className="font-bold mb-2 flex items-center gap-1.5 text-sistemas-cyan">
                <Eye className="w-3.5 h-3.5" /> Accesibilidad Visual
              </div>

              {/* Tamaño de fuente */}
              <div className="mb-3">
                <label className="block mb-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">Tamaño de Fuente:</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['normal', 'large', 'xlarge'] as FontSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={`py-1 border rounded capitalize transition text-[11px] ${
                        fontSize === size 
                          ? 'font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      style={{ borderColor: fontSize === size ? '#009fe3' : 'var(--border-color)' }}
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
                  className="w-full py-1.5 px-2 border rounded-lg flex justify-between items-center transition hover:bg-slate-100 dark:hover:bg-slate-800"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <span className="font-medium text-slate-700 dark:text-slate-300">Alto Contraste:</span>
                  <span className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded border ${
                    contrast === 'high' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {contrast === 'high' ? 'Activado' : 'Normal'}
                  </span>
                </button>
              </div>

              {/* Horario Automático */}
              <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  onClick={() => setIsAutoMode(true)}
                  className="w-full text-left py-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1.5 text-[11px] font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Sincronizar horario (Día/Noche)
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
                className="flex items-center gap-2 p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-left"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-app)' }}
                title="Editar mi perfil"
              >
                <div 
                  className="w-7 h-7 rounded-full border flex items-center justify-center overflow-hidden shrink-0" 
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
                >
                  {user.fotoRuta && !user.fotoRuta.includes('default.png') && !avatarError ? (
                    <img 
                      key={user.fotoRuta}
                      src={`/storage/${user.fotoRuta}`} 
                      alt="Avatar" 
                      className="w-full h-full object-cover" 
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <UserIcon className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="hidden sm:block pr-1">
                  <div className="text-xs font-bold leading-tight truncate max-w-[120px]">{user.nombreCompleto}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight capitalize">{user.rol}</div>
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
