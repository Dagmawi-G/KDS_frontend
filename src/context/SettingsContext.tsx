import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SystemSettings,
  OperatingPreset,
  ModuleSettings,
  WorkflowCapabilities,
  RestaurantBranding,
} from '../types';
import { apiUrl } from '../utils/api';
import { useSocket } from './SocketContext';

export const PRESET_CONFIGS: Record<
  OperatingPreset,
  {
    name: string;
    description: string;
    modules: ModuleSettings;
    workflow: WorkflowCapabilities;
  }
> = {
  FULL_SERVICE: {
    name: 'Full-Service Dine-In',
    description: 'Dedicated stations for Kitchen Chefs, Waiter Service, Cashier POS, and Customer QR Table Ordering.',
    modules: {
      kds: true,
      waiter: true,
      cashier: true,
      customerMenu: true,
      qrPrint: true,
    },
    workflow: {
      mergeKitchenIntoWaiter: false,
      cashierCanTakeOrders: true,
      waiterCanSettleBills: false,
      soundAlerts: true,
    },
  },
  CAFE_MERGED: {
    name: 'Cafe & Bistro (Merged KDS & Waiter)',
    description: 'Kitchen KDS tab is hidden; Waiter Dispatch embeds a live kitchen ticket board so servers fulfill orders directly.',
    modules: {
      kds: false,
      waiter: true,
      cashier: true,
      customerMenu: true,
      qrPrint: true,
    },
    workflow: {
      mergeKitchenIntoWaiter: true,
      cashierCanTakeOrders: true,
      waiterCanSettleBills: true,
      soundAlerts: true,
    },
  },
  QUICK_SERVICE: {
    name: 'Quick-Service / Bar / Food Truck',
    description: 'No table waiters. Orders placed at Cashier POS or Kiosk, sent directly to Kitchen KDS for counter pickup.',
    modules: {
      kds: true,
      waiter: false,
      cashier: true,
      customerMenu: false,
      qrPrint: false,
    },
    workflow: {
      mergeKitchenIntoWaiter: false,
      cashierCanTakeOrders: true,
      waiterCanSettleBills: false,
      soundAlerts: true,
    },
  },
  SELF_SERVICE: {
    name: 'Self-Service Kiosk & Ghost Kitchen',
    description: 'Customers scan QR or order via screen, Kitchen KDS prepares orders, status tracked online with no POS register.',
    modules: {
      kds: true,
      waiter: false,
      cashier: false,
      customerMenu: true,
      qrPrint: true,
    },
    workflow: {
      mergeKitchenIntoWaiter: false,
      cashierCanTakeOrders: false,
      waiterCanSettleBills: false,
      soundAlerts: true,
    },
  },
  CUSTOM: {
    name: 'Custom Configuration',
    description: 'Individually tailor every station, role capability, and workflow rule for your unique concept.',
    modules: {
      kds: true,
      waiter: true,
      cashier: true,
      customerMenu: true,
      qrPrint: true,
    },
    workflow: {
      mergeKitchenIntoWaiter: false,
      cashierCanTakeOrders: true,
      waiterCanSettleBills: false,
      soundAlerts: true,
    },
  },
};

export const DEFAULT_SETTINGS: SystemSettings = {
  preset: 'FULL_SERVICE',
  modules: PRESET_CONFIGS.FULL_SERVICE.modules,
  workflow: PRESET_CONFIGS.FULL_SERVICE.workflow,
  branding: {
    name: 'Dine OS',
    tagline: 'Smart POS & Kitchen Display System',
    currencySymbol: 'ETB',
    taxRate: 10,
    serviceCharge: 0,
  },
};

interface SettingsContextType {
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  updateModules: (newModules: Partial<ModuleSettings>) => Promise<void>;
  updateWorkflow: (newWorkflow: Partial<WorkflowCapabilities>) => Promise<void>;
  updateBranding: (newBranding: Partial<RestaurantBranding>) => Promise<void>;
  applyPreset: (preset: OperatingPreset) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  isModuleEnabled: (module: keyof ModuleSettings) => boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: async () => {},
  updateModules: async () => {},
  updateWorkflow: async () => {},
  updateBranding: async () => {},
  applyPreset: async () => {},
  resetToDefaults: async () => {},
  isModuleEnabled: () => true,
});

const STORAGE_KEY = 'dine_os_system_settings_v2';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket } = useSocket();
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('dine_os_system_settings_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure default currency is ETB if it was previous default '$'
        if (parsed.branding?.currencySymbol === '$') {
          parsed.branding.currencySymbol = 'ETB';
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.error('Failed to parse cached settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Sync settings with backend on mount
  useEffect(() => {
    fetch(apiUrl('/api/settings'))
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data && data.modules) {
          if (data.branding && data.branding.currencySymbol === '$') {
            data.branding.currencySymbol = 'ETB';
          }
          setSettings((prev) => {
            const merged = { ...prev, ...data };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            return merged;
          });
        }
      })
      .catch((err) => console.log('Using local cached settings (backend offline):', err.message));
  }, []);

  // Listen to real-time settings broadcast from any device/admin
  useEffect(() => {
    if (!socket) return;
    const handleSettingsUpdated = (newSettings: SystemSettings) => {
      setSettings(newSettings);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    };

    socket.on('settings:updated', handleSettingsUpdated);
    return () => {
      socket.off('settings:updated', handleSettingsUpdated);
    };
  }, [socket]);

  const saveSettings = async (updated: SystemSettings) => {
    setSettings(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to write settings to localStorage:', e);
    }

    try {
      await fetch(apiUrl('/api/settings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      // Backend sync error is non-fatal; local state remains responsive
      console.warn('Backend sync failed, saved locally:', e);
    }
  };

  const updateSettings = async (partial: Partial<SystemSettings>) => {
    const updated: SystemSettings = {
      ...settings,
      ...partial,
      modules: { ...settings.modules, ...(partial.modules || {}) },
      workflow: { ...settings.workflow, ...(partial.workflow || {}) },
      branding: { ...settings.branding, ...(partial.branding || {}) },
    };
    await saveSettings(updated);
  };

  const updateModules = async (newModules: Partial<ModuleSettings>) => {
    const updated: SystemSettings = {
      ...settings,
      preset: 'CUSTOM',
      modules: { ...settings.modules, ...newModules },
    };
    await saveSettings(updated);
  };

  const updateWorkflow = async (newWorkflow: Partial<WorkflowCapabilities>) => {
    const updated: SystemSettings = {
      ...settings,
      preset: 'CUSTOM',
      workflow: { ...settings.workflow, ...newWorkflow },
    };
    await saveSettings(updated);
  };

  const updateBranding = async (newBranding: Partial<RestaurantBranding>) => {
    const updated: SystemSettings = {
      ...settings,
      branding: { ...settings.branding, ...newBranding },
    };
    await saveSettings(updated);
  };

  const applyPreset = async (preset: OperatingPreset) => {
    const presetConfig = PRESET_CONFIGS[preset] || PRESET_CONFIGS.FULL_SERVICE;
    const updated: SystemSettings = {
      ...settings,
      preset,
      modules: { ...presetConfig.modules },
      workflow: { ...presetConfig.workflow },
    };
    await saveSettings(updated);
  };

  const resetToDefaults = async () => {
    await saveSettings(DEFAULT_SETTINGS);
  };

  const isModuleEnabled = (module: keyof ModuleSettings): boolean => {
    return Boolean(settings.modules[module]);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        updateModules,
        updateWorkflow,
        updateBranding,
        applyPreset,
        resetToDefaults,
        isModuleEnabled,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
