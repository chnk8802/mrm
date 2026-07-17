import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    // Get Initial Theme mode based on OS theme
    const [theme, setTheme] = useState(() => {
        const stored = localStorage.getItem('theme');
        if (stored) return stored;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    // Get Initial Theme design
    const [appTheme, setAppTheme] = useState(() => {
        return localStorage.getItem('mrm-design-preset') || 'default';
    });

    // Set Theme mode and design whenever any of them updates
    useEffect(() => {
        localStorage.setItem('theme', theme);
        localStorage.setItem('mrm-design-preset', appTheme);
    }, [theme, appTheme]);


    const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

    return (
        <ThemeContext.Provider value={{ theme, setTheme, appTheme, setAppTheme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);