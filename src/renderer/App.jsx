import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { MICRO_APPS } from '../config'

import Sidebar from './components/layout/Sidebar'
import Main from './components/layout/Main'
import SideDrawer from './components/layout/SideDrawer'

import useAppStore from './store/appStore'

// Import all micro apps
import Prettifier from './components/microapps/Prettifier'
import DNSChecker from './components/microapps/DNSChecker'
import WebsiteMonitor from './components/microapps/WebsiteMonitor'
import URLPing from './components/microapps/URLPing'
import DBViewer from './components/microapps/DBViewer'
import WebReader from './components/microapps/WebReader'
import Converter from './components/microapps/Converter'
import InAppBrowser from './components/microapps/InAppBrowser'
import StringConverter from './components/microapps/StringConverter'

import initSqlJs from 'sql.js';

// In your main app initialization
// await initSqlJs({
//   locateFile: file => `https://sql.js.org/dist/${file}`
// });
// Map of component names to actual components
const COMPONENT_MAP = {
  Prettifier: Prettifier,
  DNSChecker: DNSChecker,
  WebsiteMonitor: WebsiteMonitor,
  URLPing: URLPing,
  DBViewer: DBViewer,
  WebReader: WebReader,
  Converter: Converter,
  InAppBrowser: InAppBrowser,
  StringConverter: StringConverter
}


// This component syncs the route with the active app state
const AppContent = () => {
  const location = useLocation()
  const { setActiveApp } = useAppStore()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
    <div className="relative flex min-h-screen bg-gray-50/50 overflow-y-scroll h-screen select-none">
      <Sidebar 
        className="w-full sm:max-w-lg " 
        activeApps={MICRO_APPS}
        onAppSelect={(app) => setActiveApp(app.component)}
        onDevXPClick={() => setIsDrawerOpen(true)}

      />
      <Main className="flex-1 relative ml-[72px] lg:ml-0">
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
      </Main>
      <SideDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
      >
        hi!
      </SideDrawer>
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