import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { MICRO_APPS } from '../config'
import Sidebar from './components/layout/Sidebar'
import Main from './components/layout/Main'
import useAppStore from './store/appStore'

// Import all micro apps
import Prettifier from './components/microapps/Prettifier'
import URLPing from './components/microapps/URLPing'
import WebsiteMonitor from './components/microapps/WebsiteMonitor'

// Map of component names to actual components
const COMPONENT_MAP = {
  Prettifier: Prettifier,
  URLPing: URLPing,
  WebsiteMonitor: WebsiteMonitor
}

// This component syncs the route with the active app state
const AppContent = () => {
  const location = useLocation()
  const { setActiveApp } = useAppStore()

  useEffect(() => {
    const currentPath = location.pathname.split('/').pop()
    const currentApp = MICRO_APPS.find(
      app => app.component.toLowerCase() === currentPath
    )
    if (currentApp) {
      setActiveApp(currentApp.component)
    }
  }, [location, setActiveApp])

  return (
    <div className="flex min-h-screen bg-gray-50/50 overflow-hidden">
      <Sidebar 
        className="w-full sm:max-w-lg" 
        activeApps={MICRO_APPS}
        onAppSelect={(app) => setActiveApp(app.component)}
      />
      <main className="flex-1 relative ml-[60px] lg:ml-0">
        <Routes>
          <Route 
            path="/" 
            element={<Navigate to="/app/prettifier" replace />} 
          />
          {MICRO_APPS.map((app) => (
            <Route
              key={app.component}
              path={`/app/${app.component.toLowerCase()}`}
              element={
                React.createElement(COMPONENT_MAP[app.component], {
                  initialState: useAppStore.getState().getMicroAppState(app.component)
                })
              }
            />
          ))}
        </Routes>
      </main>
    </div>
  )
}

// Main App component
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App