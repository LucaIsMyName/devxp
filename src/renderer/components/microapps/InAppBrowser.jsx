import React, { useState, useEffect } from 'react';
import { Plus, X, Loader2, RefreshCw, ArrowLeft, ArrowRight, Search } from 'lucide-react';
import Button from '../partials/Button';
import Input from '../partials/Input';

const STORAGE_KEY = 'in_app_browser_tabs';

const InAppBrowser = () => {
  const webviewRef = React.useRef(null);

  const [tabs, setTabs] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [
        { id: '1', url: 'https://www.google.com', title: 'Google', isLoading: false }
      ];
    } catch {
      return [{ id: '1', url: 'https://www.google.com', title: 'Google', isLoading: false }];
    }
  });

  const [activeTabId, setActiveTabId] = useState(() => {
    try {
      return localStorage.getItem('in_app_browser_active_tab') || tabs[0]?.id;
    } catch {
      return tabs[0]?.id;
    }
  });

  const [urlInput, setUrlInput] = useState('');
  
  useEffect(() => {
    if (!webviewRef.current) return;

    const handleLoadStart = () => {
      setTabs(prev => prev.map(tab =>
        tab.id === activeTabId ? { ...tab, isLoading: true } : tab
      ));
    };

    const handleLoadStop = () => {
      if (!webviewRef.current) return;
      
      setTabs(prev => prev.map(tab =>
        tab.id === activeTabId ? { 
          ...tab, 
          isLoading: false,
          title: webviewRef.current.getTitle() || tab.url,
          url: webviewRef.current.getURL()
        } : tab
      ));
      setUrlInput(webviewRef.current.getURL());
    };

    const handleTitleUpdate = (e) => {
      updateTabTitle(activeTabId, e.title);
    };

    const handleNavigate = (e) => {
      updateTabUrl(activeTabId, e.url);
    };

    webviewRef.current.addEventListener('did-start-loading', handleLoadStart);
    webviewRef.current.addEventListener('did-stop-loading', handleLoadStop);
    webviewRef.current.addEventListener('page-title-updated', handleTitleUpdate);
    webviewRef.current.addEventListener('did-navigate', handleNavigate);

    return () => {
      if (webviewRef.current) {
        webviewRef.current.removeEventListener('did-start-loading', handleLoadStart);
        webviewRef.current.removeEventListener('did-stop-loading', handleLoadStop);
        webviewRef.current.removeEventListener('page-title-updated', handleTitleUpdate);
        webviewRef.current.removeEventListener('did-navigate', handleNavigate);
      }
    };
  }, [activeTabId]);
  
  useEffect(() => {
    // Update URL input when active tab changes
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (activeTab) {
      setUrlInput(activeTab.url);
    }
  }, [activeTabId, tabs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
  }, [tabs]);

  useEffect(() => {
    localStorage.setItem('in_app_browser_active_tab', activeTabId);
  }, [activeTabId]);

  const activeTab = tabs.find(tab => tab.id === activeTabId);
  const webview = React.useRef(null);
  
  const handleNewTab = () => {
    const newTab = {
      id: Date.now().toString(),
      url: 'https://www.google.com',
      title: 'New Tab',
      isLoading: false
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const formatUrl = (url) => {
    if (!url) return 'https://www.google.com';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.includes('.') && !url.includes(' ')) return `https://${url}`;
    return `https://www.google.com/search?q=${encodeURIComponent(url)}`;
  };

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!webviewRef.current) return;

    try {
      const formattedUrl = formatUrl(urlInput);
      setTabs(prev => prev.map(tab =>
        tab.id === activeTabId ? { ...tab, url: formattedUrl, isLoading: true } : tab
      ));

      webviewRef.current.src = formattedUrl;
    } catch (error) {
      console.error('Failed to load URL:', error);
      setTabs(prev => prev.map(tab =>
        tab.id === activeTabId ? { 
          ...tab, 
          isLoading: false,
          title: 'Failed to load'
        } : tab
      ));
    }
  };

  const TabItem = ({ tab }) => (
    <div data-component="InAppBrowser/TabItem" className={`
      group relative flex items-center gap-2 rounded
      ${activeTabId === tab.id ? 'bg-white' : 'bg-gray-50 hover:bg-gray-50'}
    `}>
      <Button
        onClick={() => handleTabClick(tab.id)}
        className="flex items-center gap-2 pr-8"
      >
        {tab.isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <img
            src={getFaviconUrl(tab.url)}
            className="w-5 h-5"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
        <span className="hidden md:block w-[20px] xl:max-w-[240px] xl:min-w-[120px] truncate text-sm">
          {tab.title || 'New Tab'}
        </span>
      </Button>
      <button
        onClick={() => handleCloseTab(tab.id)}
        className="absolute right-2 opacity-30 group-hover:opacity-100 hover:bg-gray-200 rounded p-1"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );

  const handleCloseTab = (tabId) => {
    setTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId);
      if (tabId === activeTabId && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
      return newTabs.length > 0 ? newTabs : [
        { id: Date.now().toString(), url: 'https://www.google.com', title: 'Google', isLoading: false }
      ];
    });
  };

  const handleTabClick = (tabId) => {
    setActiveTabId(tabId);
  };

  const updateTabTitle = (tabId, title) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, title: title || tab.url } : tab
    ));
  };

  const updateTabUrl = (tabId, url) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, url } : tab
    ));
    setUrlInput(url);
  };

  const handleGoBack = () => {
    if (webviewRef.current) {
      try {
        webviewRef.current.goBack();
      } catch (error) {
        console.error('Failed to go back:', error);
      }
    }
  };

  const handleGoForward = () => {
    if (webviewRef.current) {
      try {
        webviewRef.current.goForward();
      } catch (error) {
        console.error('Failed to go forward:', error);
      }
    }
  };

  const handleRefresh = () => {
    if (webviewRef.current) {
      try {
        webviewRef.current.reload();
      } catch (error) {
        console.error('Failed to reload:', error);
      }
    }
  };

  // Handle webview events
  useEffect(() => {
    if (!webview.current) return;

    const handleLoadStart = () => {
      setTabs(prev => prev.map(tab =>
        tab.id === activeTabId ? { ...tab, isLoading: true } : tab
      ));
    };

    const handleLoadStop = () => {
      setTabs(prev => prev.map(tab =>
        tab.id === activeTabId ? {
          ...tab,
          isLoading: false,
          title: webview.current.getTitle() || tab.url,
          url: webview.current.getURL()
        } : tab
      ));
      setUrlInput(webview.current.getURL());
    };

    webview.current.addEventListener('did-start-loading', handleLoadStart);
    webview.current.addEventListener('did-stop-loading', handleLoadStop);
    webview.current.addEventListener('page-title-updated', (e) => {
      updateTabTitle(activeTabId, e.title);
    });
    webview.current.addEventListener('did-navigate', (e) => {
      updateTabUrl(activeTabId, e.url);
    });

    return () => {
      if (webview.current) {
        webview.current.removeEventListener('did-start-loading', handleLoadStart);
        webview.current.removeEventListener('did-stop-loading', handleLoadStop);
      }
    };
  }, [activeTabId]);

  return (
    <div data-component="InAppBrowser" className="h-screen flex flex-col ">
      {/* Tab Bar */}
      <div className=" p-4 flex gap-2">
        {/* Navigation Controls and URL Bar */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              onClick={handleGoBack}
              className=""
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button
              onClick={handleGoForward}
              className=""
              title="Go Forward"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              onClick={handleRefresh}
              className=""
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>

          <form onSubmit={handleUrlSubmit} className="flex-1 flex">
            <div className="relative flex-1">
              <Input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Search or enter website name"
                className="w-full flex-1 lg:w-[360px] pl-10 pr-4 py-2 bg-white truncate"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </form>
        </div>

        {/* Tabs */}
        <div className="hidden sm:flex items-center space-x-1 overflow-x-auto">
        {tabs.map(tab => (
          <TabItem key={tab.id} tab={tab} />
        ))}
        <Button
          onClick={handleNewTab}
          className="p-1 hover:bg-gray-300 rounded"
          title="New Tab"
        >
          <Plus className="w-4 h-4" />
        </Button>
        </div>
      </div>

      {/* Browser Content */}
      {activeTab && (
        <div className="flex-1">
          <webview
            ref={webviewRef}
            src={activeTab.url}
            className="w-full h-full"
            webpreferences="nodeIntegration=false, contextIsolation=true"
            useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            allowpopups="true"
            partition="persist:main"
            style={{ width: '100%', height: '100%', display: 'flex' }}
          />
        </div>
      )}
    </div>
  );
};

const getFaviconUrl = (url) => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return null;
  }
};

export default InAppBrowser;