import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, BookOpen, GitFork, FileText, Layers, 
  MessageSquare, Archive, Printer, BarChart3, ShieldCheck, 
  Users, HelpCircle, GraduationCap, CalendarCheck
} from 'lucide-react';
import type { MenuItem } from '../../types';

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

export const Sidebar: React.FC = () => {
  const { menuItems, user } = useAuth();

  const renderIcon = (iconName?: string) => {
    if (!iconName) return <HelpCircle className="w-5 h-5" />;
    const Component = ICON_MAP[iconName] || HelpCircle;
    return <Component className="w-5 h-5" />;
  };

  return (
    <aside
      className="w-64 border-r flex flex-col justify-between transition-colors min-h-screen"
      style={{
        backgroundColor: 'var(--bg-sidebar)',
        color: 'var(--text-sidebar)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div>
        {/* Cabecera del Sidebar */}
        <div className="h-16 flex items-center px-6 border-b gap-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <GraduationCap className="w-7 h-7 text-amber-400" />
          <div>
            <div className="font-bold text-sm leading-tight tracking-wide">DISEÑO CURRICULAR</div>
            <div className="text-[10px] opacity-70 tracking-widest uppercase">UAGRM - FICCT</div>
          </div>
        </div>

        {/* Rol y Usuario Activo */}
        <div className="p-4 mx-3 my-3 rounded-lg border text-xs" style={{ borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <div className="opacity-60 text-[10px] uppercase font-semibold">Rol del Sistema</div>
          <div className="font-bold text-amber-300 text-sm">{user?.rol || 'Sin Rol'}</div>
          <div className="text-[11px] opacity-80 truncate mt-0.5">{user?.nombreCompleto}</div>
        </div>

        {/* Listado del Menú Dinámico según BD (Requisito 2) */}
        <nav className="px-3 space-y-1">
          {menuItems.map((item: MenuItem) => (
            <NavLink
              key={item.id}
              to={item.ruta}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'font-bold shadow-md'
                    : 'opacity-80 hover:opacity-100 hover:bg-white/10'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { backgroundColor: 'var(--primary)', color: 'var(--primary-text)' }
                  : {}
              }
            >
              {renderIcon(item.icono)}
              <span>{item.titulo}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Pie del Sidebar */}
      <div className="p-4 border-t text-[11px] opacity-60 text-center" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        INF-513 Tecnología Web
      </div>
    </aside>
  );
};
