import React, { useState, useEffect } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import Button from '../partials/Button';
import SelectMenu from '../partials/SelectMenu';
import { javascript } from '@codemirror/lang-javascript';
import CodeEditorLayout from '../partials/CodeEditorLayout';

const STORAGE_KEY = 'string-converter-state';

const CONVERSION_OPTIONS = [
  { value: 'kebab-to-camel', label: 'kebab-case → camelCase' },
  { value: 'camel-to-kebab', label: 'camelCase → kebab-case' },
  { value: 'pascal-to-camel', label: 'PascalCase → camelCase' },
  { value: 'camel-to-pascal', label: 'camelCase → PascalCase' },
  { value: 'kebab-to-pascal', label: 'kebab-case → PascalCase' },
  { value: 'pascal-to-kebab', label: 'PascalCase → kebab-case' },
];

const ConvertString = () => {
  // Load initial conversion type from storage
  const [conversionType, setConversionType] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.conversionType || 'kebab-to-camel';
      }
    } catch (e) {
      console.error('Error loading saved state:', e);
    }
    return 'kebab-to-camel';
  });

  // Load initial input from storage
  const [input, setInput] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.input || '';
      }
    } catch (e) {
      console.error('Error loading saved state:', e);
    }
    return '';
  });

  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      conversionType,
      input
    }));
  }, [conversionType, input]);
  // Case conversion functions
  const kebabToCamel = (str) =>
    str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

  const camelToKebab = (str) =>
    str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

  const camelToPascal = (str) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  const pascalToCamel = (str) =>
    str.charAt(0).toLowerCase() + str.slice(1);

  const kebabToPascal = (str) =>
    str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

  const pascalToKebab = (str) =>
    str
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .substring(1);


  const convertLine = (line) => {
    if (!line?.trim()) return '';

    try {
      switch (conversionType) {
        case 'kebab-to-camel':
          return kebabToCamel(line);
        case 'camel-to-kebab':
          return camelToKebab(line);
        case 'pascal-to-camel':
          return pascalToCamel(line);
        case 'camel-to-pascal':
          return camelToPascal(line);
        case 'kebab-to-pascal':
          return kebabToPascal(line);
        case 'pascal-to-kebab':
          return pascalToKebab(line);
        default:
          return line;
      }
    } catch (err) {
      throw new Error(`Failed to convert line: ${line}`);
    }
  };

  const handleConvert = (value) => {
    if (!value?.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      const converted = value
        .split('\n')
        .map(line => convertLine(line))
        .join('\n');

      setOutput(converted);
      setError(null);
    } catch (err) {
      setError(err.message);
      setOutput('');
    }
  };

  // Convert when conversion type changes
  useEffect(() => {
    if (input) {
      handleConvert(input);
    }
  }, [conversionType]);

  // Get current conversion option for display
  const currentOption = CONVERSION_OPTIONS.find(opt => opt.value === conversionType) || CONVERSION_OPTIONS[0];

  return (
    <div data-component="ConvertString" className="h-screen flex flex-col">
      <div className="flex items-center gap-4 p-4 pb-0">
        <SelectMenu
          options={CONVERSION_OPTIONS}
          value={conversionType}  // Just pass the value string
          onChange={setConversionType}  // Directly update the value
          className="min-w-[220px]"
        />
      </div>

      <CodeEditorLayout
        leftTitle={currentOption.label.split(' → ')[0]}
        rightTitle={currentOption.label.split(' → ')[1]}
        leftValue={input}
        rightValue={output}
        onLeftChange={(value) => {
          setInput(value);
          handleConvert(value);
        }}
        leftExtensions={[javascript()]}
        rightExtensions={[javascript()]}
        error={error}
      />
    </div>
  );
};

export default ConvertString;