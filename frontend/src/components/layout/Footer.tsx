import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import { Eye } from 'lucide-react';

export const Footer: React.FC = () => {
  const location = useLocation();
  const [visitas, setVisitas] = useState<number | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  // Registro dinámico del contador de visitas por página (Requisito 7)
  useEffect(() => {
    let isMounted = true;
    setCargando(true);

    const registrarVisitaPagina = async () => {
      try {
        const res = await api.post('/site/visita', {
          ruta_pagina: location.pathname,
        });

        if (res.data.success && isMounted) {
          setVisitas(res.data.visitas);
        }
      } catch (err) {
        console.error('Error al registrar contador de visitas:', err);
      } finally {
        if (isMounted) setCargando(false);
      }
    };

    registrarVisitaPagina();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  return (
    <footer
      className="border-t py-4 px-6 flex flex-col sm:flex-row items-center justify-between text-xs gap-3 transition-colors"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-muted)',
      }}
    >
      {/* Información Institucional */}
      <div className="flex items-center gap-2">
        <span className="font-semibold" style={{ color: 'var(--text-main)' }}>
          INF-513 Tecnología Web
        </span>
        <span>•</span>
        <span>Seguimiento al Diseño Curricular - Ingeniería en Sistemas (UAGRM)</span>
      </div>

      {/* Contador de Visitas por Página (Requisito 7) */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm font-medium transition"
        style={{
          backgroundColor: 'var(--bg-app)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-main)',
        }}
      >
        <Eye className="w-3.5 h-3.5 text-blue-500" />
        <span>Visitas en esta página:</span>
        <span className="font-bold text-amber-500">
          {cargando ? '...' : visitas !== null ? visitas.toLocaleString() : '1'}
        </span>
      </div>
    </footer>
  );
};
