import { scan } from 'react-scan';
import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { MICRO_APPS } from '../config'

import Sidebar from './components/layout/Sidebar'
import Main from './components/layout/Main'
import SideDrawer from './components/layout/SideDrawer'

import MdToHtml from './components/partials/MdToHtml'
import AppInfo from './components/partials/AppInfo'

import useAppStore from './store/appStore'

// Import all micro apps
import Prettifier from './components/microapps/Prettifier'
import DNSChecker from './components/microapps/DNSChecker'
import WebsiteMonitor from './components/microapps/WebsiteMonitor'
import URLPing from './components/microapps/URLPing'
import DBViewer from './components/microapps/DBViewer'
import WebReader from './components/microapps/WebReader'
// import Converter from './components/microapps/Converter'
import InAppBrowser from './components/microapps/InAppBrowser'
import ConvertString from './components/microapps/ConvertString'
import HashGenerator from './components/microapps/HashGenerator'
import ConvertJsonYaml from './components/microapps/ConvertJsonYaml'
import ConvertHtmlJsx from './components/microapps/ConvertHtmlJsx'
import ConvertBase64 from './components/microapps/ConvertBase64'
import ConvertSvgCss from './components/microapps/ConvertSvgCss'
import GenerateCss from './components/microapps/GenerateCss'

import initSqlJs from 'sql.js';


scan({
  enabled: true,
  log: true, // logs render info to console (default: false)
});


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
  HashGenerator: HashGenerator,
  InAppBrowser: InAppBrowser,
  ConvertString: ConvertString,
  ConvertJsonYaml: ConvertJsonYaml,
  ConvertHtmlJsx: ConvertHtmlJsx,
  ConvertSvgCss: ConvertSvgCss,
  ConvertBase64: ConvertBase64,
  GenerateCss: GenerateCss
}


// This component syncs the route with the active app state
const AppContent = () => {
  const location = useLocation()
  const { setActiveApp } = useAppStore()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [markdownUrl, setMarkdownUrl] = useState(null);

  useEffect(() => {
    const currentPath = location.pathname.split('/').pop()
    const currentApp = MICRO_APPS.find(
      app => app.component.toLowerCase() === currentPath
    )
    if (currentApp) {
      setActiveApp(currentApp.component)
    }
  }, [location, setActiveApp])

  useEffect(() => {
    if (isDrawerOpen && !markdownUrl) {
      setMarkdownUrl('https://raw.githubusercontent.com/LucaIsMyName/devxp/refs/heads/main/readme.md');
    }
  }, [isDrawerOpen]);

  return (
    <div className="relative flex h-screen bg-gray-50 dark:bg-gray-black/50 dark:bg-gray-950 dark:text-white overflow-hidden select-none">

      <Sidebar
        className="w-full sm:max-w-lg h-screen"
        activeApps={MICRO_APPS}
        onAppSelect={(app) => setActiveApp(app.component)}
        onDevXPClick={() => setIsDrawerOpen(true)}
      />
      <Main className="flex-1 md:ml-[72px] lg:ml-0">
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/app/dnschecker" replace />}
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
        title={<div>DevXp Info</div>}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      >
        <AppInfo />
        {markdownUrl && (
          <MdToHtml
            url={markdownUrl}
            className="w-full overflow-y-auto"
          />
        )}
      </SideDrawer>
    </div>
  );
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