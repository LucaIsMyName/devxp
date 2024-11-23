import React, { useState, useCallback } from 'react';
import { debounce } from 'lodash';
import { Download } from 'lucide-react';
import Tooltip from '../partials/Tooltip';
import SelectMenu from '../partials/SelectMenu';
import useAppStore from '../../store/appStore';

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
  const [url, setUrl] = useState('');
  const [selectedRecordType, setSelectedRecordType] = useState(DNS_RECORD_TYPES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Function to check DNS records
  const checkDNS = async (domain, recordType) => {
    setIsLoading(true);
    setError(null);

    try {
      // Using Google's DNS API
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=${recordType.value}`);
      const data = await response.json();

      if (data.Status === 0) { // 0 means success in DNS
        setResults({
          timestamp: new Date().toISOString(),
          domain,
          recordType: recordType.value,
          records: data.Answer || [],
          status: 'success'
        });
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

  return (
    <div data-component="DNSChecker" className="h-screen overflow-y-scroll flex flex-col gap-4 ">
      {/* Header with controls */}
      <div className="p-4 border-b-2">
        <form onSubmit={handleSubmit} className="lg:flex space-y-4 lg:space-y-0 gap-4 items-center ">
          <div className="flex-1">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter domain (e.g., example.com)"
              className="w-full px-2 py-1 border-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <SelectMenu
            options={DNS_RECORD_TYPES}
            value={selectedRecordType.value}
            onChange={setSelectedRecordType}
            tooltip="Select DNS record type"
            className="w-full lg:w-48 min-w-[160px] "
          />

          <button
            type="submit"
            disabled={isLoading || !url}
            className="px-3 py-[0.3em] font-semibold border-[rgba(0,0,0,0.2)] border-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Checking...' : 'Check DNS'}
          </button>
        </form>
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-auto">
        {error ? (
          <div className="mx-4 rounded border-red-300 border-2 p-4 bg-red-50 text-red-500">
            Error: {error}
          </div>
        ) : results ? (
          <div className="p-4">
            <div className="sm:flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg truncate">Results for {results.domain}</h3>
              <div className="flex gap-2">
                {EXPORT_FORMATS.map(format => (
                  <Tooltip
                    key={format.value}
                    content={`Export as ${format.label}`}
                    placement="top"
                    theme="light"
                  >
                    <button
                      onClick={() => exportData(format.value)}
                      className="p-2 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center text-xs border-2 px-[0.6em] py-[0.3em]"
                    >
                      <Download className="h-4 w-4" />
                      <span className="ml-1">{format.label}</span>
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {results.records.map((record, index) => (
                <div
                  key={index}
                  className="p-4 border-2 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="sm:flex space-y-1 sm:space-y-0 gap-3 gap-4">
                    <div className="flex-1  text-xs">
                      <p className="text-gray-500">Name:</p>
                      <p className="font-mono">{record.name}</p>
                    </div>
                    <div className="flex-1 text-xs max-w-64">
                      <p className="text-gray-500">TTL:</p>
                      <p className="font-mono">{record.TTL}s</p>
                    </div>
                    <div className="flex-1  text-xs">
                      <p className="text-gray-500">Data:</p>
                      <p className="font-mono break-all">{record.data}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-4 text-gray-500 ">
            Enter a domain and select a record type to check DNS records
          </div>
        )}
      </div>
    </div>
  );
};

export default DNSChecker;
