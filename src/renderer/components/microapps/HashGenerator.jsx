import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import CryptoJS from 'crypto-js';
import Input from '../partials/Input';

const HashGenerator = () => {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState({});
  const [copiedStates, setCopiedStates] = useState({});

  // Hash configurations using only CryptoJS
  const hashTypes = [
    { name: 'MD5', fn: text => CryptoJS.MD5(text).toString() },
    { name: 'SHA1', fn: text => CryptoJS.SHA1(text).toString() },
    { name: 'SHA224', fn: text => CryptoJS.SHA224(text).toString() },
    { name: 'SHA256', fn: text => CryptoJS.SHA256(text).toString() },
    { name: 'SHA384', fn: text => CryptoJS.SHA384(text).toString() },
    { name: 'SHA512', fn: text => CryptoJS.SHA512(text).toString() },
    { name: 'RIPEMD160', fn: text => CryptoJS.RIPEMD160(text).toString() }
  ];

  // Generate hashes whenever input changes
  useEffect(() => {
    if (!input) {
      setHashes({});
      return;
    }

    const newHashes = {};
    hashTypes.forEach(({ name, fn }) => {
      try {
        newHashes[name] = fn(input);
      } catch (error) {
        // console.error(`Error generating ${name} hash:`, error);
        newHashes[name] = 'Error generating hash';
      }
    });
    setHashes(newHashes);
  }, [input]);

  // Copy hash to clipboard
  const copyToClipboard = async (hashType, hash) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedStates(prev => ({ ...prev, [hashType]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [hashType]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div data-component="HashGenerator" className="mx-auto p-6 space-y-6 ">
      {/* Input field */}
      <div className="space-y-2">
        <label htmlFor="input" className="block text-sm font-medium text-gray-700">
          Text to hash
        </label>
        <textarea
          id="input"
          type="text"
          rows={6}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter text to generate hashes..."
          className="w-full border-2 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {/* Input length indicator */}
        <div className="text-sm text-gray-500">
          Input length: {input.length} characters
        </div>
      </div>

      {/* Hash outputs */}
      <div className="space-y-4">
        {hashTypes.map(({ name }) => (
          <div
            key={name}
            className="bg-white border-2 shadow-xs p-4 rounded-lg space-y-1"
          >
            <div className="flex justify-between items-center">
              <div className='flex items-center w-full justify-between'>
                <label className="text-sm font-medium text-gray-700">
                  {name}
                </label>
                <p className="text-xs text-gray-500">
                  {getHashLength(name)} characters
                </p>
              </div>

            </div>
            <div className="relative p-1 px-2 text-green-300 bg-black/90 border-2 border-black font-semibold rounded-lg shadow-sm rounded-lg border-black/10 border-2 w-full ">
              <span className='font-mono text-xs break-all'>{hashes[name] || 'No hash generated yet'}</span>
              <button
                onClick={() => copyToClipboard(name, hashes[name])}
                className="size-5 absolute top-[calc(50%-(theme(spacing.5)/2)] right-1 rounded transition-colors"
                title="Copy to clipboard"
                disabled={!hashes[name]}
              >
                {copiedStates[name] ? (
                  <Check strokeWidth={2} className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy strokeWidth={2} className="h-4 w-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>


    </div>
  );
};

// Helper function to get hash length information
const getHashLength = (hashType) => {
  const lengths = {
    'MD5': 32,
    'SHA1': 40,
    'SHA224': 56,
    'SHA256': 64,
    'SHA384': 96,
    'SHA512': 128,
    'RIPEMD160': 40
  };
  return lengths[hashType] || '';
};

export default HashGenerator;