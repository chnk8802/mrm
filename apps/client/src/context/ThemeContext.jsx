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
    const APP_THEMES = ['default', 'indigo', 'workshop', 'ocean'];

    const [appTheme, setAppTheme] = useState(() => {
        const stored = localStorage.getItem('mrm-design-preset');
        return APP_THEMES.includes(stored) ? stored : 'default';
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