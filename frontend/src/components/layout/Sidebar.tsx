import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, BookOpen, GitFork, FileText, Layers, 
  MessageSquare, Archive, Printer, BarChart3, ShieldCheck, 
  Users, HelpCircle, CalendarCheck, X
} from 'lucide-react';
import type { MenuItem } from '../../types';
import isotipoSistemas from '../../assets/branding/isotipo-sistemas.jpg';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  BookOpen,
  GitFork,
  FileText,
  Layers,
  MessageSquare,
  Archive,
  Printer,
  BarChart3,
  ShieldCheck,
  Users,
  CalendarCheck,
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { menuItems, user } = useAuth();

  const renderIcon = (iconName?: string) => {
    if (!iconName) return <HelpCircle className="w-4 h-4 shrink-0" />;
    const Component = ICON_MAP[iconName] || HelpCircle;
    return <Component className="w-4 h-4 shrink-0" />;
  };

  return (
    <>
      {/* Backdrop oscuro para móvil/tablet */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-auto w-64 border-r flex flex-col justify-between transition-transform duration-200 ease-in-out min-h-screen select-none shrink-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          color: 'var(--text-sidebar)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="flex flex-col">
          {/* Cabecera Institucional con Isotipo Oficial de Sistemas */}
          <div 
            className="h-16 flex items-center px-4 border-b gap-3"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-white/10 p-1 flex items-center justify-center shrink-0 border border-white/10 shadow-sm">
              <img 
                src={isotipoSistemas} 
                alt="Ingeniería en Sistemas - UAGRM" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs tracking-wide text-white truncate uppercase">
                Sistemas <span style={{ color: '#009fe3' }}>FICCT</span>
              </div>
              <div className="text-[10px] tracking-wider text-slate-400 font-medium truncate uppercase">
                UAGRM • Rediseño Curricular
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        {/* Ficha del Usuario y Rol */}
        <div className="px-3 pt-3 pb-2">
          <div 
            className="p-3 rounded-lg border text-xs relative overflow-hidden"
            style={{ 
              borderColor: 'rgba(255,255,255,0.08)', 
              backgroundColor: 'rgba(255,255,255,0.03)' 
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Rol Activo
              </span>
              <span 
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                style={{ 
                  backgroundColor: 'rgba(0, 159, 227, 0.15)',
                  borderColor: 'rgba(0, 159, 227, 0.35)',
                  color: '#38bdf8'
                }}
              >
                {user?.rol || 'Sin Rol'}
              </span>
            </div>
            <div className="font-semibold text-xs text-white truncate mt-1.5" title={user?.nombreCompleto}>
              {user?.nombreCompleto || 'Usuario del Sistema'}
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5" title={user?.email}>
              {user?.email}
            </div>
          </div>
        </div>

        {/* Navegación Dinámica según BD */}
        <nav className="px-3 py-2 space-y-1">
          <div className="px-2 pb-1 text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
            Módulos del Sistema
          </div>
          {menuItems.map((item: MenuItem) => (
            <NavLink
              key={item.id}
              to={item.ruta}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { 
                      backgroundColor: 'var(--sidebar-active-bg)', 
                      color: 'var(--sidebar-active-text)',
                      borderLeft: '3px solid #009fe3',
                      paddingLeft: '9px'
                    }
                  : {}
              }
            >
              <div className="flex items-center gap-2.5 truncate">
                {renderIcon(item.icono)}
                <span className="truncate">{item.titulo}</span>
              </div>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Pie del Sidebar */}
      <div 
        className="p-3 border-t text-[11px] flex items-center justify-between text-slate-400"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <span className="truncate">INF-513 • Tec. Web</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-slate-300">
          v2.0
        </span>
      </div>
    </aside>
    </>
  );
};
