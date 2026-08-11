import { useCallback, useState } from 'react';
import { Language } from '../constants/language';
import { ThemeMode } from '../types/game';

const readTheme = (): ThemeMode => {
  const savedTheme = localStorage.getItem('rummikub_theme');
  return savedTheme === 'dark' ? 'dark' : 'default';
};

const readLanguage = (): Language => {
  return localStorage.getItem('rummikub_language') === 'en' ? 'en' : 'ko';
};

const createDefaultNickname = () => `Player${Math.floor(100 + Math.random() * 900)}`;

export const usePersistentPreferences = () => {
  const [theme, setTheme] = useState<ThemeMode>(readTheme);
  const [language, setLanguage] = useState<Language>(readLanguage);
  const [nickname, setNickname] = useState(() => localStorage.getItem('rummikub_nickname') || createDefaultNickname());

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => {
      const nextTheme: ThemeMode = currentTheme === 'default' ? 'dark' : 'default';
      localStorage.setItem('rummikub_theme', nextTheme);
      return nextTheme;
    });
  }, []);

  const changeLanguage = useCallback((nextLanguage: Language) => {
    setLanguage(nextLanguage);
    localStorage.setItem('rummikub_language', nextLanguage);
  }, []);

  const saveNickname = useCallback((nextNickname: string) => {
    const trimmedNickname = nextNickname.trim();
    if (!trimmedNickname) return false;
    setNickname(trimmedNickname);
    localStorage.setItem('rummikub_nickname', trimmedNickname);
    return true;
  }, []);

  return { theme, language, nickname, toggleTheme, changeLanguage, saveNickname };
};
