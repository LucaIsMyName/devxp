import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../partials/Button';
import Logo from '../partials/Logo';
import useAppStore from '../../store/appStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MIN_SIDEBAR_WIDTH = 280;
const MAX_SIDEBAR_WIDTH = 600;
const CLOSED_WIDTH = 64;

const Sidebar = ({ className, activeApps, onAppSelect, onDevXPClick }) => {
  const navigate = useNavigate();
  const activeApp = useAppStore(state => state.activeApp);
  const resizeRef = useRef(null);
  const sidebarRef = useRef(null);

  const [isOpen, setIsOpen] = useState(() => {
    const stored = localStorage.getItem('sidebarState');
    if (stored) {
      const { isOpen } = JSON.parse(stored);
      return window.innerWidth >= 1024 ? true : isOpen;
    }
    return window.innerWidth >= 1024;
  });

  const [width, setWidth] = useState(() => {
    const stored = localStorage.getItem('sidebarState');
    if (stored) {
      const { width } = JSON.parse(stored);
      return width;
    }
    return MIN_SIDEBAR_WIDTH;
  });

  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    localStorage.setItem('sidebarState', JSON.stringify({ isOpen, width }));
  }, [isOpen, width]);

  useEffect(() => {
    const handleResize = () => {
      const isNowMobile = window.innerWidth < 1024;
      setIsMobile(isNowMobile);
      if (!isNowMobile && !isOpen) {
        setIsOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleAppClick = (app) => {
    onAppSelect(app);
    navigate(`/app/${app.component.toLowerCase()}`);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <div className="h-full relative">
      {/* Mobile Overlay */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        ref={sidebarRef}
        style={{
          width: isOpen ? width : CLOSED_WIDTH,
          minWidth: CLOSED_WIDTH,
          maxWidth: isMobile ? '100%' : MAX_SIDEBAR_WIDTH
        }}
        className={`
          ${isMobile ? 'fixed' : 'sticky'}
          z-50 h-screen
         
          left-0 top-0
          flex-shrink-0
          transition-width duration-300
          ${className}
        `}
      >
        {/* Sidebar Content */}
        <div className="h-full bg-white dark:bg-gray-900 dark:bg-gray-900 border-r-2 dark:border-gray-800 flex flex-col">
          {/* Collapsed Header */}
          {!isOpen && (
            <div className="flex-shrink-0 h-[64px] flex items-center justify-center border-b-2 dark:border-gray-800 bg-white dark:bg-gray-900 dark:bg-black">
              <Button
                onClick={() => setIsOpen(true)}
                className="mx-auto p-0 border-0 rounded-lg"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Expanded Content */}
          {isOpen && (
            <>
              <div className="flex-shrink-0 bg-white dark:bg-gray-900 dark:bg-black z-10 px-4 py-4 border-b-2 dark:border-gray-800">
                <div className="flex gap-4 items-center justify-between w-full">
                  <Button
                    onClick={onDevXPClick} // Add the click handler here
                    className="px-4 dark:text-white"
                  >
                    <Logo />
                  </Button>
                  <Button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg dark:bg-black transition-colors hover:bg-transparent"
                  >
                    <ChevronLeft className="h-5 w-5 dark:text-white transition-colors" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {activeApps.map((app, index) => (
                  <Button
                    key={index}
                    title={`Open ${app.name} App`}
                    className={`w-full ${app.isActive === false ? 'opacity-50' : ''} ${activeApp === app.component ? 'bg-blue-50 border-blue-500' : ''}`}
                    onClick={() => handleAppClick(app)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="flex-shrink-0 shadow-sm shadow-inner mt-0.5 p-1 rounded border-2 dark:border-gray-800">
                        {React.createElement(app.icon, {
                          className: 'h-5 w-5 text-black dark:text-white',
                          'aria-hidden': 'true'
                        })}
                      </div>
                      <div className="flex-1 min-w-0 truncate">
                        <h2 className="font-semibold text-sm tracking-wide truncate relative">
                          <span className="truncate">{app.name}</span>
                          {app.isActive === false && (
                            <span className=" absolute right-0 top-0 rounded-full bg-yellow-900 text-yellow-700 dark:text-yellow-400 border-yellow-500 dark:border-yellow-500 inline-block px-[0.6em] py-[0.1em] pt-[0.2em] uppercase leading-tight border-2 dark:border-gray-800 text-[8px] tracking-wide ml-1">Dev</span>
                          )}
                          {app.isActive === true && (
                            <span className=" absolute right-0 top-0 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 border-green-500 dark:border-green-700 inline-block px-[0.6em] py-[0.1em] pt-[0.2em] uppercase leading-tight border-2 dark:border-gray-800 text-[8px] tracking-wide ml-1">Prod</span>
                          )}
                        </h2>
                        <p className="font-normal text-black dark:text-white/60 text-xs truncate">
                          <span className="truncate">{app.description}</span>
                        </p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </>
          )}

          {/* Collapsed Content */}
          {!isOpen && (
            <div className="flex-1 overflow-y-auto">
              {activeApps.map((app, index) => (
                <Button
                  key={index}
                  title={`Open ${app.name} App`}
                  className={`w-full relative !shadow-none !border-0 !border-transparent rounded-none p-2 py-4 flex items-center justify-center transition-colors ${activeApp === app.component ? '' : ''
                    }`}
                  onClick={() => handleAppClick(app)}
                >
                  {React.createElement(app.icon, {
                    className: 'h-5 w-5 text-gray-600 dark:text-gray-300',
                    'aria-hidden': 'true'
                  })}
                  {app.isActive === false && (
                            <span className=" absolute right-2 bottom-2 rounded-full bg-yellow-900 text-yellow-700 dark:text-yellow-400 border-yellow-500 dark:border-yellow-500 block border-2 dark:border-gray-800 size-3"></span>
                          )}
                          {app.isActive === true && (
                            <span className=" absolute right-2 bottom-2 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 border-green-500 dark:border-green-700 block border-2 dark:border-gray-800 size-3"></span>
                          )}
                </Button>
              ))}
            </div>
          )}

          {/* Resize Handle */}
          {isOpen && !isMobile && (
            <div
              ref={resizeRef}
              className="absolute top-0 right-0 w-1 h-full cursor-col-resize transition-colors hover:bg-blue-500/70 z-50"
              onMouseDown={() => setIsResizing(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;