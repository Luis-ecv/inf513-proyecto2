import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeType = 'adultos' | 'jovenes' | 'ninos';
export type ModeType = 'light' | 'dark';
export type FontSize = 'normal' | 'large' | 'xlarge';
export type ContrastType = 'normal' | 'high';

interface ThemeContextProps {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  mode: ModeType;
  setMode: (mode: ModeType) => void;
  toggleMode: () => void;
  isAutoMode: boolean;
  setIsAutoMode: (auto: boolean) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  contrast: ContrastType;
  setContrast: (contrast: ContrastType) => void;
  toggleContrast: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Detección automática según el horario local del cliente (Req. 5)
  const getAutoMode = (): ModeType => {
    const hours = new Date().getHours();
    return (hours >= 19 || hours < 6) ? 'dark' : 'light';
  };

  const [theme, setThemeState] = useState<ThemeType>(() => {
    return (localStorage.getItem('theme_preference') as ThemeType) || 'adultos';
  });

  const [isAutoMode, setIsAutoModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme_auto_mode');
    return saved !== null ? saved === 'true' : true;
  });

  const [mode, setModeState] = useState<ModeType>(() => {
    const saved = localStorage.getItem('mode_preference') as ModeType;
    if (saved) return saved;
    return getAutoMode();
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem('font_size_preference') as FontSize) || 'normal';
  });

  const [contrast, setContrastState] = useState<ContrastType>(() => {
    return (localStorage.getItem('contrast_preference') as ContrastType) || 'normal';
  });

  // Aplicar atributos al elemento raíz <html>
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-mode', mode);
    root.setAttribute('data-font-size', fontSize);
    root.setAttribute('data-contrast', contrast);
  }, [theme, mode, fontSize, contrast]);

  // Si está activo el modo automático, sincronizar periódicamente según la hora local
  useEffect(() => {
    if (!isAutoMode) return;

    const syncAuto = () => {
      const autoM = getAutoMode();
      setModeState(autoM);
    };

    syncAuto();
    const interval = setInterval(syncAuto, 60000); // Revisar cada minuto
    return () => clearInterval(interval);
  }, [isAutoMode]);

  const setTheme = (t: ThemeType) => {
    setThemeState(t);
    localStorage.setItem('theme_preference', t);
  };

  const setMode = (m: ModeType) => {
    setModeState(m);
    setIsAutoModeState(false);
    localStorage.setItem('mode_preference', m);
    localStorage.setItem('theme_auto_mode', 'false');
  };

  const toggleMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  const setIsAutoMode = (auto: boolean) => {
    setIsAutoModeState(auto);
    localStorage.setItem('theme_auto_mode', auto ? 'true' : 'false');
    if (auto) {
      setModeState(getAutoMode());
    }
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem('font_size_preference', size);
  };

  const setContrast = (c: ContrastType) => {
    setContrastState(c);
    localStorage.setItem('contrast_preference', c);
  };

  const toggleContrast = () => {
    setContrast(contrast === 'normal' ? 'high' : 'normal');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        mode,
        setMode,
        toggleMode,
        isAutoMode,
        setIsAutoMode,
        fontSize,
        setFontSize,
        contrast,
        setContrast,
        toggleContrast,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser utilizado dentro de un ThemeProvider');
  }
  return context;
};

