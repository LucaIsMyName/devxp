import React, { useState, useEffect } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import Button from '../partials/Button';
import { javascript } from '@codemirror/lang-javascript';
import CodeEditorLayout from '../partials/CodeEditorLayout';

const STORAGE_KEY = 'base64-converter-state';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

const ConvertBase64 = () => {
  const [direction, setDirection] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).direction : 'text-to-base64';
  });
  
  const [input, setInput] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).input : '';
  });
  
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ direction, input }));
  }, [direction, input]);

  const handleConvert = (value) => {
    if (!value.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      if (direction === 'text-to-base64') {
        const encoded = btoa(unescape(encodeURIComponent(value)));
        setOutput(encoded);
      } else {
        if (!value.match(/^[A-Za-z0-9+/=]*$/)) {
          throw new Error('Invalid Base64 characters detected');
        }
        const decoded = decodeURIComponent(escape(atob(value)));
        setOutput(decoded);
      }
      setError(null);
    } catch (err) {
      let errorMsg;
      if (direction === 'base64-to-text') {
        errorMsg = 'Invalid Base64: The input contains invalid characters or is malformed';
      } else {
        errorMsg = 'Error encoding text to Base64: ' + err.message;
      }
      setError(errorMsg);
      setOutput('');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }

    try {
      if (direction === 'text-to-base64') {
        // For text-to-base64, read as text
        const text = await file.text();
        setInput(text);
        handleConvert(text);
      } else {
        // For base64-to-text, read as base64
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target.result.split(',')[1]; // Remove data URL prefix
          setInput(base64);
          handleConvert(base64);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      setError(`Error reading file: ${err.message}`);
    }
    
    // Reset file input
    event.target.value = '';
  };

  const handleSwitch = () => {
    const newDirection = direction === 'text-to-base64' ? 'base64-to-text' : 'text-to-base64';
    setDirection(newDirection);
    setInput(output);
    setOutput(input);
    setError(null);
  };

  useEffect(() => {
    handleConvert(input);
  }, []);

  return (
    <div data-component="ConvertBase64" className="h-screen flex flex-col">
      <div className="flex items-center gap-4 p-4 pb-0">
        <Button 
          variant="outline" 
          onClick={handleSwitch}
          className="flex items-center gap-2"
        >
          <span>
            {direction === 'text-to-base64' ? 'Text → Base64' : 'Base64 → Text'}
          </span>
          <ArrowRightLeft className="h-4 w-4" />
        </Button>
      </div>

      <CodeEditorLayout
        leftTitle={direction === 'text-to-base64' ? 'Text' : 'Base64'}
        rightTitle={direction === 'text-to-base64' ? 'Base64' : 'Text'}
        leftValue={input}
        rightValue={output}
        onLeftChange={(value) => {
          setInput(value);
          handleConvert(value);
        }}
        leftExtensions={[javascript()]}
        rightExtensions={[javascript()]}
        error={error}
        onFileUpload={handleFileUpload}
      />
    </div>
  );
};

export default ConvertBase64;