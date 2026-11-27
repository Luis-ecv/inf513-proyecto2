import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';

export const MainLayout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen transition-colors" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* Barra lateral con Menú Dinámico según Rol (Requisito 2 y Drawer móvil) */}
      <Sidebar 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
      />

      {/* Área Principal de Contenido */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        {/* Encabezado con Buscador del Negocio, Menú Hamburguesa y Selectores de Tema */}
        <Header onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)} />

        {/* Contenido de la Ruta */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto report-print-main">
          <Outlet />
        </main>

        {/* Pie de Página con Contador de Visitas Dinámico (Requisito 7) */}
        <Footer />
      </div>
    </div>
  );
};

