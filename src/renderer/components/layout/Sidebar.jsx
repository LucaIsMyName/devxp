import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../partials/Button';
import useAppStore from '../../store/appStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MIN_SIDEBAR_WIDTH = 280;
const MAX_SIDEBAR_WIDTH = 600;
const CLOSED_WIDTH = 60;

const Sidebar = ({ className, activeApps, onAppSelect }) => {
  const navigate = useNavigate();
  const activeApp = useAppStore(state => state.activeApp);
  const resizeRef = useRef(null);
  const sidebarRef = useRef(null);

  // Get stored values from localStorage or use defaults
  const [isOpen, setIsOpen] = useState(() => {
    const stored = localStorage.getItem('sidebarState');
    if (stored) {
      const { isOpen } = JSON.parse(stored);
      // On desktop, default to open even if it was closed last time
      return window.innerWidth >= 1024 ? true : isOpen;
    }
    return window.innerWidth >= 1024; // Default open on desktop
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

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarState', JSON.stringify({ isOpen, width }));
  }, [isOpen, width]);

  // Handle resize events and mobile detection
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
    <>
      {/* Mobile Overlay */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        ref={sidebarRef}
        style={{
          width: isOpen ? width : CLOSED_WIDTH,
          minWidth: CLOSED_WIDTH,
          maxWidth: isMobile ? '100%' : MAX_SIDEBAR_WIDTH
        }}
        className={`
          fixed lg:relative
          z-50
          h-screen
          transition-width duration-300
          ${isMobile && isOpen ? 'w-full' : ''}
          translate-x-0
          ${className}
        `}
      >
        <div className="h-full bg-white border-r-2 flex flex-col">
          {/* Collapsed Sidebar Header */}
          {!isOpen && (
            <div className="flex-shrink-0 h-16 flex items-center justify-center border-b-2 bg-white">
              <Button
                onClick={() => setIsOpen(true)}
                className="mx-auto hover:bg-gray-100 p-2 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Expanded Sidebar Content */}
          {isOpen ? (
            <>
              <div className="flex-shrink-0 bg-white z-10 px-4 py-4 border-b-2">
                <div className='flex gap-4 items-center justify-between w-full'>
                  <h1 className="font-bold text-gray-900 text-uppercase select-none">DevXP</h1>
                  <Button
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-gray-100 p-2 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
                {activeApps.map((app, index) => (
                  <Button
                    key={index}
                    title={`Open ${app.name} App`}
                    className={`w-full ${app.isActive === false ? 'opacity-50':''} ${activeApp === app.component ? 'bg-blue-50 border-blue-500' : ''}`}
                    onClick={() => handleAppClick(app)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="flex-shrink-0 mt-1">
                        {React.createElement(app.icon, {
                          className: 'h-5 w-5 text-gray-500',
                          'aria-hidden': 'true'
                        })}
                      </div>
                      <div className="flex-1 min-w-0 truncate">
                        <h2 className="font-semibold truncate">
                          <span className='truncate'>{app.name}</span>
                        </h2>
                        <p className='font-normal text-black/60 text-xs truncate'>
                          <span className='truncate'>{app.description}</span>
                        </p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </>
          ) : (
            // Collapsed Sidebar Apps List
            <div className="flex-1 px-2 py-4 space-y-4 overflow-y-auto">
              {activeApps.map((app, index) => (
                <Button
                  key={index}
                  title={`Open ${app.name} App`}
                  className={`w-full p-2 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors ${activeApp === app.component ? 'bg-blue-50 border-blue-500' : ''
                    }`}
                  onClick={() => handleAppClick(app)}
                >
                  {React.createElement(app.icon, {
                    className: 'h-5 w-5 text-gray-500',
                    'aria-hidden': 'true'
                  })}
                </Button>
              ))}
            </div>
          )}

          {/* Resize Handle */}
          {isOpen && !isMobile && (
            <div
              ref={resizeRef}
              className="absolute top-0 right-0 w-1 h-full cursor-col-resize transition-colors"
              onMouseDown={() => setIsResizing(true)}
            />
          )}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;