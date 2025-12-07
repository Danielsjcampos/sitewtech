
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface SettingsContextType {
    settings: any;
    loading: boolean;
    get: (key: string, defaultValue?: string) => string;
}

const SettingsContext = createContext<SettingsContextType>({
    settings: {},
    loading: true,
    get: () => ''
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await supabase.from('SITE_SystemSettings').select('*');
            if (data) {
                const config: any = {};
                data.forEach((item: any) => config[item.key] = item.value);
                setSettings(config);
                
                // Apply Global Styles/Meta
                if (config.site_title) document.title = config.site_title;
                const root = document.documentElement;
                if (config.primary_color) root.style.setProperty('--color-primary', config.primary_color);
                if (config.secondary_color) root.style.setProperty('--color-secondary', config.secondary_color);
                
                // Set Icon
                if (config.logo_url) {
                    const link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
                    if (link) link.href = config.logo_url;
                }
            }
        } catch (e) {
            console.error("Error loading settings:", e);
        } finally {
            setLoading(false);
        }
    };

    const get = (key: string, defaultValue = '') => {
        // Return blank string if key doesn't exist to prevent undefined issues
        return settings[key] || defaultValue;
    };

    return (
        <SettingsContext.Provider value={{ settings, loading, get }}>
            {children}
        </SettingsContext.Provider>
    );
};
