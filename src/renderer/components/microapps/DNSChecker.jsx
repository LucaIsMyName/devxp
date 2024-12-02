import React, { useState, useCallback , useEffect} from 'react';
import { debounce } from 'lodash';
import { Download,View, Globe, FileJson, FileText, Sheet } from 'lucide-react';

import Tooltip from '../partials/Tooltip';
import SelectMenu from '../partials/SelectMenu';
import Button from '../partials/Button';
import Input from '../partials/Input';

import useAppStore from '../../store/appStore';

const STORAGE_KEY = 'dns_checker_state';


const DNS_RECORD_TYPES = [
  { value: 'A', label: 'A (IPv4 Address)' },
  { value: 'AAAA', label: 'AAAA (IPv6 Address)' },
  { value: 'CNAME', label: 'CNAME (Canonical Name)' },
  { value: 'MX', label: 'MX (Mail Exchange)' },
  { value: 'TXT', label: 'TXT (Text Record)' },
  { value: 'NS', label: 'NS (Name Server)' },
  { value: 'SOA', label: 'SOA (Start of Authority)' },
  { value: 'PTR', label: 'PTR (Pointer)' },
];

const EXPORT_FORMATS = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
  { value: 'txt', label: 'Text' },
];

const DNSChecker = ({ initialState }) => {
  const [url, setUrl] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.url || '';
      }
      return '';
    } catch {
      return '';
    }
  });
  const [selectedRecordType, setSelectedRecordType] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const savedType = DNS_RECORD_TYPES.find(t => t.value === parsed.recordType);
        return savedType || DNS_RECORD_TYPES[0];
      }
      return DNS_RECORD_TYPES[0];
    } catch {
      return DNS_RECORD_TYPES[0];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.results || null;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [error, setError] = useState(null);
  useEffect(() => {
    try {
      const stateToStore = {
        url,
        recordType: selectedRecordType.value,
        results,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [url, selectedRecordType, results]);

  // Function to check DNS records
  const checkDNS = async (domain, recordType) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=${recordType.value}`);
      const data = await response.json();

      if (data.Status === 0) {
        const newResults = {
          timestamp: new Date().toISOString(),
          domain,
          recordType: recordType.value,
          records: data.Answer || [],
          status: 'success'
        };
        setResults(newResults);

        // Store the results immediately
        try {
          const stateToStore = {
            url: domain,
            recordType: recordType.value,
            results: newResults,
            lastUpdated: new Date().toISOString()
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToStore));
        } catch (error) {
          console.error('Error saving results to localStorage:', error);
        }
      } else {
        throw new Error('DNS query failed');
      }
    } catch (err) {
      setError(err.message);
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };


  // Handle URL submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (url) {
      const domain = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      checkDNS(domain, selectedRecordType);
    }
  };

  // Export functions
  const exportData = (format) => {
    if (!results) return;

    let content = '';
    let filename = `dns_${results.domain}_${results.recordType}_${new Date().toISOString()}`;

    switch (format) {
      case 'json':
        content = JSON.stringify(results, null, 2);
        filename += '.json';
        break;
      case 'csv':
        const headers = ['Name', 'Type', 'TTL', 'Data'].join(',');
        const rows = results.records.map(record =>
          [record.name, record.type, record.TTL, record.data].join(',')
        );
        content = [headers, ...rows].join('\n');
        filename += '.csv';
        break;
      case 'txt':
        content = `
Domain: ${results.domain}
Record Type: ${results.recordType}
Timestamp: ${results.timestamp}
Records:
${results.records.map(record => `- ${record.data} (TTL: ${record.TTL})`).join('\n')}`;
        filename += '.txt';
        break;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  const handleRecordTypeChange = (newType) => {
    setSelectedRecordType(newType);
    
    // If there's a URL, automatically do a new DNS check with the new record type
    if (url) {
      const domain = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      checkDNS(domain, newType);
    }
  };

  return (
    <div data-component="DNSChecker" className="flex flex-col">
      {/* Header with controls */}
      <div className="p-4 pb-0">
        <form onSubmit={handleSubmit} className="lg:flex space-y-4 lg:space-y-0 gap-4 items-center">
          <div className="flex-1 relative">
          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-700 dark:text-gray-200 w-4 h-4" />
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter domain (e.g., example.com)"
              className="w-full pl-10"
            />
          </div>

          <SelectMenu
            options={DNS_RECORD_TYPES}
            value={selectedRecordType.value}
            onChange={handleRecordTypeChange}
            tooltip="Select DNS record type"
            className="w-full lg:w-48 min-w-[160px] lg:min-w-[260px]"
          />

          <Button
            type="submit"
            disabled={isLoading || !url}
            className="w-full lg:w-auto px-3 font-semibold border-[rgba(0,0,0,0.2)] bg-blue-600 dark:bg-blue-700 rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? <View /> : <View />}
          </Button>
        </form>

        {/* {results && (
          <div className="mt-4 text-xs text-gray-50 dark:text-gray-black0 dark:text-gray-200">
            Last checked: {new Date(results.timestamp).toLocaleString()}
          </div>
        )} */}
      </div>

      {/* Results area */}
      <div className="flex-1">
        {error ? (
          <div className="mx-4 mt-4 rounded border-red-300 dark:border-red-800 border-2 dark:border-gray-800 dark:bg-red-900 dark:text-red-300 p-4 bg-red-50 text-red-500">
            Error: {error}
          </div>
        ) : results ? (
          <div className="p-4">
            <div className="sm:flex justify-between items-center mb-4">
              {/* <h3 className="font-semibold text-lg truncate">Results for {results.domain}</h3> */}
              <div className="flex gap-2">
                {EXPORT_FORMATS.map(format => (
                  <Tooltip
                    key={format.value}
                    content={`Export as ${format.label}`}
                    placement="top"
                    theme="light"
                  >
                    <Button
                      onClick={() => exportData(format.value)}
                      className="pr-4 font-normal font-mono text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-black flex items-center border-2 dark:border-gray-800 "
                    >
                      {
                        format.value === 'json' ? <FileJson className="h-5 w-5" /> :
                        format.value === 'csv' ? <Sheet className="h-5 w-5" /> :
                        <FileText className="h-5 w-5" />
                      }
                      <span className="ml-1 text-sm leading-tight">{format.label}</span>
                    </Button>
                  </Tooltip>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {results.records.map((record, index) => (
                <div
                  key={index}
                  className="p-4 border-2 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-lg transition-colors"
                >
                  <div className="sm:flex space-y-1 sm:space-y-0 gap-3 gap-4">
                    <div className="flex-1  text-xs sm:text-base">
                      <p className="text-gray-50 dark:text-gray-300">Name:</p>
                      <p className="font-mono font-semibold">{record.name}</p>
                    </div>
                    <div className="flex-1 text-xs sm:text-base max-w-64">
                      <p className="text-gray-50 dark:text-gray-black0 dark:text-gray-200">TTL:</p>
                      <p className="font-mono">{record.TTL}s</p>
                    </div>
                    <div className="flex-1  text-xs sm:text-base">
                      <p className="text-gray-50 dark:text-gray-black0 dark:text-gray-200">Data:</p>
                      <p className="font-mono break-all">{record.data}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-4 text-gray-50 dark:text-gray-black0 dark:text-gray-200 mt-4">
            Enter a domain and select a record type to check DNS records
          </div>
        )}
      </div>
    </div>
  );
};

export default DNSChecker;
