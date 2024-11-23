import React, { useState, useEffect, useCallback } from 'react';
import Placeholder from '../partials/Placeholder';

const URLPing = ({ initialState = { url: '', status: '', responseTime: 0 } }) => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('');
  const [responseTime, setResponseTime] = useState('');
  const [isPinging, setIsPinging] = useState(false);
  const [pingInterval, setPingInterval] = useState(null);

  const ping = useCallback(async () => {
    if (!url) return; // Prevent pinging if the URL is empty
    setIsPinging(true);
    const start = performance.now();
    try {
      const response = await fetch(url);
      setStatus(response.status);
    } catch (error) {
      setStatus('Error');
    }
    const end = performance.now();
    setResponseTime(Math.round(end - start));
    setIsPinging(false);
  }, [url]);

  useEffect(() => {
    if (pingInterval) {
      clearInterval(pingInterval);
    }
    if (url && url.startsWith('http')) {
      ping(); // Initial ping
      const interval = setInterval(ping, 5000); // Ping every 5 seconds
      setPingInterval(interval);
      return () => clearInterval(interval); // Cleanup on unmount or URL change
    }
  }, [url, ping]);

  return (
    <div className="">
      <div className="border-b-2 pb-4 p-4">
        <form className='flex gap-4'>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL (e.g., https://example.com)"
            className="py-[0.1em] px-2 border-2  border-black/10 rounded w-full"
          />
          <button
            type="submit"
            onClick={ping}
            disabled={!url || isPinging}
            className="px-3 py-[0.3em] font-semibold border-[rgba(0,0,0,0.2)] border-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >

            Ping
          </button>
        </form>
      </div>
      {isPinging && <p className="mt-2 text-gray-500 mx-4">Pinging...</p>}
      <div className="mt-4 flex mx-4">
        <div className='flex-1'><p>Status:</p><p className='font-semibold'> {status || <Placeholder width="sm" />}</p></div>
        <div className='flex-1'><p>Response Time:</p><p className='font-semibold'> {responseTime ? `${responseTime}ms` : <Placeholder width="sm" />}</p></div>
      </div>
    </div>
  );
};

export default URLPing;
