import React, { useState, useEffect } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import Button from '../partials/Button';
import { javascript } from '@codemirror/lang-javascript';
import { yaml } from '@codemirror/lang-yaml';
import YAML from 'yaml';
import CodeEditorLayout from '../partials/CodeEditorLayout';

const STORAGE_KEY = 'json-yaml-converter-state';

const ConvertJsonYaml = () => {
  const [direction, setDirection] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).direction : 'json-to-yaml';
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
      if (direction === 'json-to-yaml') {
        const parsed = JSON.parse(value);
        setOutput(YAML.stringify(parsed));
      } else {
        const parsed = YAML.parse(value);
        setOutput(JSON.stringify(parsed, null, 2));
      }
      setError(null);
    } catch (err) {
      setError(`Invalid ${direction === 'json-to-yaml' ? 'JSON' : 'YAML'}: ${err.message}`);
      setOutput('');
    }
  };

  const handleSwitch = () => {
    const newDirection = direction === 'json-to-yaml' ? 'yaml-to-json' : 'json-to-yaml';
    setDirection(newDirection);
    setInput(output);
    setOutput(input);
    setError(null);
  };

  useEffect(() => {
    handleConvert(input);
  }, []);

  return (
    <div data-component="ConvertJsonYaml" className="h-screen flex flex-col">
      <div className="flex items-center gap-4 p-4 pb-0">
        <Button 
          onClick={handleSwitch}
          className="flex items-center gap-2 px-4"
        >
          <span>{direction === 'json-to-yaml' ? 'JSON → YAML' : 'YAML → JSON'}</span>
          <ArrowRightLeft className="h-4 w-4" />
        </Button>
      </div>

      <CodeEditorLayout
        leftTitle={direction === 'json-to-yaml' ? 'JSON' : 'YAML'}
        rightTitle={direction === 'json-to-yaml' ? 'YAML' : 'JSON'}
        leftValue={input}
        rightValue={output}
        onLeftChange={(value) => {
          setInput(value);
          handleConvert(value);
        }}
        leftExtensions={[direction === 'json-to-yaml' ? javascript() : yaml()]}
        rightExtensions={[direction === 'json-to-yaml' ? yaml() : javascript()]}
        error={error}
      />
    </div>
  );
};

export default ConvertJsonYaml;