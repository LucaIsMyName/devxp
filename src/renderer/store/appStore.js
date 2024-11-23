import { create } from 'zustand'

const STORAGE_KEY = 'devxp-state';

// Load initial state from localStorage
const loadState = () => {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    return savedState ? JSON.parse(savedState) : {};
  } catch (error) {
    console.error('Error loading state:', error);
    return {};
  }
};

const useAppStore = create((set, get) => ({
  // Current active app
  activeApp: null,
  
  // Store for each micro app's state
  microAppStates: loadState(),
  
  // Set the active app
  setActiveApp: (appComponent) => {
    set({ activeApp: appComponent });
  },
  
  // Update a micro app's state and save to localStorage
  updateMicroAppState: (appComponent, newState) => {
    set((state) => {
      const updatedStates = {
        ...state.microAppStates,
        [appComponent]: newState
      };
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStates));
      } catch (error) {
        console.error('Error saving state:', error);
      }
      
      return { microAppStates: updatedStates };
    });
  },
  
  // Get a micro app's state
  getMicroAppState: (appComponent) => {
    const state = get().microAppStates;
    return state[appComponent] || null;
  }
}));

export default useAppStore;