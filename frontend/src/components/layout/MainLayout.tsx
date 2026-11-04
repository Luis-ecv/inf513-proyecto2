import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen transition-colors" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* Barra lateral con Menú Dinámico según Rol (Requisito 2) */}
      <Sidebar />

      {/* Área Principal de Contenido */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Encabezado con Buscador del Negocio y Selectores de Tema (Requisitos 5 y 9) */}
        <Header />

        {/* Contenido de la Ruta */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>

        {/* Pie de Página con Contador de Visitas Dinámico (Requisito 7) */}
        <Footer />
      </div>
    </div>
  );
};

