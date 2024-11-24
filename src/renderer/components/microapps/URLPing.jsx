import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Globe, ArrowRight, Clock, RefreshCw, RefreshCwOff, Trash2, View, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import Input from '../partials/Input';
import Button from '../partials/Button';
// Constants
const STORAGE_KEY = 'url_ping_history';
const MAX_HISTORY = 50;

// Helper to safely parse dates in stored data
const parsePingHistory = (stored) => {
  try {
    const parsed = JSON.parse(stored);
    return parsed.map(ping => ({
      ...ping,
      timestamp: new Date(ping.timestamp)
    }));
  } catch (error) {
    console.error('Error parsing stored ping history:', error);
    return [];
  }
};

// Helper to safely store data
const storePingHistory = (history) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error storing ping history:', error);
  }
};

const URLPing = ({ initialState }) => {
  const [url, setUrl] = useState(() => {
    try {
      return localStorage.getItem('url_ping_last_url') || '';
    } catch {
      return '';
    }
  });
  const [pingHistory, setPingHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? parsePingHistory(stored) : [];
    } catch {
      return [];
    }
  });
  const [isPinging, setIsPinging] = useState(false);
  const [pingInterval, setPingInterval] = useState(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('url_ping_last_url', url);
    } catch (error) {
      console.error('Error storing last URL:', error);
    }
  }, [url]);

  // Store ping history whenever it changes
  useEffect(() => {
    storePingHistory(pingHistory);
  }, [pingHistory]);

  const clearHistory = useCallback(() => {
    setPingHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }, []);

  const formatUrl = (inputUrl) => {
    if (!inputUrl) return '';
    const trimmed = inputUrl.trim().toLowerCase();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const ping = useCallback(async () => {
    if (!url) return;

    setIsPinging(true);
    setError(null);

    const formattedUrl = formatUrl(url);
    const start = performance.now();
    const pingResult = {
      timestamp: new Date(),
      url: formattedUrl,
      success: false,
      headers: {},
      error: null
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(formattedUrl, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors'
      }).catch(async () => {
        // If HEAD fails, try GET as fallback
        return await fetch(formattedUrl, {
          method: 'GET',
          signal: controller.signal,
          mode: 'no-cors'
        });
      });

      clearTimeout(timeoutId);
      const end = performance.now();

      pingResult.success = true;
      pingResult.status = response.status;
      pingResult.statusText = response.statusText;
      pingResult.responseTime = Math.round(end - start);

      try {
        response.headers.forEach((value, key) => {
          pingResult.headers[key] = value;
        });
      } catch (e) {
        pingResult.headers = { note: 'Headers unavailable due to CORS restrictions' };
      }

    } catch (error) {
      pingResult.success = false;
      pingResult.error = error.name === 'AbortError' ?
        'Request timed out (10s)' :
        error.message;
      setError(pingResult.error);
    }

    // Update history and store it
    const newHistory = [pingResult, ...pingHistory].slice(0, MAX_HISTORY);
    setPingHistory(newHistory);
    storePingHistory(newHistory);

    setIsPinging(false);
  }, [url, pingHistory]);

  useEffect(() => {
    if (pingInterval) {
      clearInterval(pingInterval);
      setPingInterval(null);
    }

    if (isAutoRefresh && url) {
      ping();
      const interval = setInterval(ping, 5000);
      setPingInterval(interval);
      return () => {
        clearInterval(interval);
        setPingInterval(null);
      };
    }
  }, [url, ping, isAutoRefresh]);

  const getStatusColor = (success, error) => {
    if (error) return 'text-red-500';
    if (success) return 'text-green-500';
    return 'text-gray-400';
  };

  const getStatusIcon = (pingResult) => {
    if (!pingResult) return null;
    if (pingResult.error) {
      return <AlertTriangle strokeWidth={2} className="w-5 h-5 text-red-500" />;
    }
    return pingResult.success ?
      <CheckCircle2 strokeWidth={2} className="w-5 h-5 text-gray-500" /> :
      <XCircle strokeWidth={2} className="w-5 h-5 text-red-500" />;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    ping();
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header Section */}
      <div className="p-4">
        <form onSubmit={handleSubmit} className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter domain (e.g., example.com)"
              className="w-full pl-10"
            />
          </div>

          <Button
            type="submit"
            disabled={!url || isPinging}
            className=" flex items-center gap-2"
          >
            <View className='size-5'/>
          </Button>

          <Button
            type="button"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={` ${isAutoRefresh ? 'text-white bg-red-600 hover:bg-red-600' : ''}`}
          >
            {isAutoRefresh ? <RefreshCwOff className='size-5' /> : <RefreshCw className='size-5' />}
          </Button>

          {/* Add Clear History button */}
          {pingHistory.length > 0 && (
            <Button
              type="button"
              onClick={clearHistory}
              className="text-red-500 hover:bg-red-50"
              title="Clear History"
            >
              <Trash2 className="size-5" />
            </Button>
          )}
        </form>
      </div>


      {/* Results Section */}
      <div className="flex-1 overflow-auto p-4 pt-0">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" strokeWidth={2}/>
            {error}
          </div>
        )}


        <div className="space-y-2">
          {pingHistory.map((ping, index) => (
            <div
              key={ping.timestamp.getTime()}
              className={`p-4 text-xs sm:text-base border-2 rounded-lg bg-white transition-colors ${index === 0 ? 'border-gray-300' : 'border'
                }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(ping)}
                  <span className="font-mono">{ping.url}</span>
                </div>
                <span className="text-xs sm:text-base text-gray-500">
                  {ping.timestamp.toLocaleTimeString()}
                </span>
              </div>

              <div className="flex item.center gap-4 text-sm">
                <div>
                  <span className="text-gray-500 text-xs "></span>
                  <span className={`uppercase font-mono text-xs ${ping.success ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'} border-2 px-2 rounded-full  ${getStatusColor(ping.success, ping.error)}`}>
                    {ping.error || (ping.success ? 'Connected' : 'Failed')}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 text-xs "></span>
                  <span className="font-mono text-xs px-2 border-2 rounded-full uppercase">
                    {ping.responseTime}ms
                  </span>
                </div>
              </div>

              {Object.keys(ping.headers).length > 0 && (
                <div className="mt-2 pt-2 border-t-2">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                      Response Details
                    </summary>
                    <div className="mt-2 pl-4 space-y-1 font-mono text-xs">
                      {Object.entries(ping.headers).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-gray-500">{key}:</span>{' '}
                          <span className="text-gray-700">{value}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>
          ))}

          {pingHistory.length === 0 && !isPinging && (
            <div className=" text-gray-500 pb-4">
              Enter a URL and click Ping to start monitoring
            </div>
          )}

          {isPinging && pingHistory.length === 0 && (
            <div className="text-center text-gray-500 py-8 animate-pulse">
              Pinging...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default URLPing;