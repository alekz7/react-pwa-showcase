import React, { createContext, useContext, useReducer, useEffect } from "react";
import type { AppState, AppAction, UserPreferences } from "./types";

// Initial state
const initialUserPreferences: UserPreferences = {
  language: "en",
  notifications: true,
  analytics: false,
};

const initialState: AppState = {
  theme: {
    mode: "light",
    primaryColor: "#1976d2",
  },
  ui: {
    sidebarOpen: false,
    loading: false,
    notifications: [],
  },
  user: {
    preferences: initialUserPreferences,
  },
};

// Reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "SET_THEME_MODE":
      return {
        ...state,
        theme: {
          ...state.theme,
          mode: action.payload,
        },
      };

    case "SET_PRIMARY_COLOR":
      return {
        ...state,
        theme: {
          ...state.theme,
          primaryColor: action.payload,
        },
      };

    case "TOGGLE_SIDEBAR":
      return {
        ...state,
        ui: {
          ...state.ui,
          sidebarOpen: !state.ui.sidebarOpen,
        },
      };

    case "SET_LOADING":
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: action.payload,
        },
      };

    case "ADD_NOTIFICATION":
      const newNotification = {
        ...action.payload,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
      };
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [...state.ui.notifications, newNotification],
        },
      };

    case "REMOVE_NOTIFICATION":
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter(
            (notification) => notification.id !== action.payload
          ),
        },
      };

    case "CLEAR_NOTIFICATIONS":
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [],
        },
      };

    case "UPDATE_USER_PREFERENCES":
      return {
        ...state,
        user: {
          ...state.user,
          preferences: {
            ...state.user.preferences,
            ...action.payload,
          },
        },
      };

    case "RESET_STATE":
      return initialState;

    default:
      return state;
  }
};

// Context interface
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Helper functions
  setThemeMode: (mode: "light" | "dark") => void;
  setPrimaryColor: (color: string) => void;
  toggleSidebar: () => void;
  setLoading: (loading: boolean) => void;
  addNotification: (
    notification: Omit<AppState["ui"]["notifications"][0], "id" | "timestamp">
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  resetState: () => void;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem("pwa-app-state");
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Only restore certain parts of the state
        if (parsedState.theme) {
          dispatch({ type: "SET_THEME_MODE", payload: parsedState.theme.mode });
          dispatch({
            type: "SET_PRIMARY_COLOR",
            payload: parsedState.theme.primaryColor,
          });
        }
        if (parsedState.user?.preferences) {
          dispatch({
            type: "UPDATE_USER_PREFERENCES",
            payload: parsedState.user.preferences,
          });
        }
      }
    } catch (error) {
      console.warn("Failed to load app state from localStorage:", error);
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    try {
      const stateToSave = {
        theme: state.theme,
        user: state.user,
      };
      localStorage.setItem("pwa-app-state", JSON.stringify(stateToSave));
    } catch (error) {
      console.warn("Failed to save app state to localStorage:", error);
    }
  }, [state.theme, state.user]);

  // Auto-remove notifications after 5 seconds
  useEffect(() => {
    const autoHideNotifications = state.ui.notifications.filter(
      (notification) => notification.autoHide !== false
    );

    if (autoHideNotifications.length > 0) {
      const timeouts = autoHideNotifications.map((notification) =>
        setTimeout(() => {
          dispatch({ type: "REMOVE_NOTIFICATION", payload: notification.id });
        }, 5000)
      );

      return () => {
        timeouts.forEach(clearTimeout);
      };
    }
  }, [state.ui.notifications]);

  // Helper functions
  const setThemeMode = (mode: "light" | "dark") => {
    dispatch({ type: "SET_THEME_MODE", payload: mode });
  };

  const setPrimaryColor = (color: string) => {
    dispatch({ type: "SET_PRIMARY_COLOR", payload: color });
  };

  const toggleSidebar = () => {
    dispatch({ type: "TOGGLE_SIDEBAR" });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  };

  const addNotification = (
    notification: Omit<AppState["ui"]["notifications"][0], "id" | "timestamp">
  ) => {
    dispatch({ type: "ADD_NOTIFICATION", payload: notification });
  };

  const removeNotification = (id: string) => {
    dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
  };

  const clearNotifications = () => {
    dispatch({ type: "CLEAR_NOTIFICATIONS" });
  };

  const updateUserPreferences = (preferences: Partial<UserPreferences>) => {
    dispatch({ type: "UPDATE_USER_PREFERENCES", payload: preferences });
  };

  const resetState = () => {
    dispatch({ type: "RESET_STATE" });
  };

  const contextValue: AppContextType = {
    state,
    dispatch,
    setThemeMode,
    setPrimaryColor,
    toggleSidebar,
    setLoading,
    addNotification,
    removeNotification,
    clearNotifications,
    updateUserPreferences,
    resetState,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

// Custom hook to use the AppContext
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

export default AppContext;
