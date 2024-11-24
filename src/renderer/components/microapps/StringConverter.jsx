import React, { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';
import { lineNumbers } from '@codemirror/view';
import SelectMenu from '../partials/SelectMenu';
import Button from '../partials/Button';
import Tooltip from '../partials/Tooltip';
import useAppStore from '../../store/appStore';
import { lightTheme } from '../../../config';
// Light theme configuration
// const lightTheme = EditorView.theme({
//   '&': {
//     backgroundColor: 'transparent',
//     height: '100%'
//   },
//   '.cm-gutters': {
//     backgroundColor: '#f8f9fa',
//     color: '#6b7280',
//     border: 'none',
//     borderRight: '1px solid #e5e7eb'
//   },
//   '.cm-line': {
//     padding: '0 4px 0 8px'
//   },
//   '.cm-activeLineGutter': {
//     backgroundColor: '#f3f4f6'
//   },
//   '.cm-activeLine': {
//     backgroundColor: '#f9fafb'
//   },
//   '&.cm-focused .cm-cursor': {
//     borderLeftColor: '#3b82f6'
//   },
//   '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
//     backgroundColor: '#dbeafe'
//   },
//   '.cm-content': {
//     caretColor: '#3b82f6',
//     fontFamily: '"Geist Mono", Menlo, Monaco, "Courier New", monospace'
//   }
// });

// Conversion map showing valid conversions
const CONVERSION_MAP = {
  camelCase: ['snake_case', 'kebab-case', 'PascalCase'],
  snake_case: ['camelCase', 'kebab-case', 'PascalCase'],
  'kebab-case': ['camelCase', 'snake_case', 'PascalCase'],
  PascalCase: ['camelCase', 'snake_case', 'kebab-case'],
  Base64: ['ASCII', 'Hex', 'Binary'],
  ASCII: ['Base64', 'Hex', 'Binary'],
  Hex: ['Base64', 'ASCII', 'Binary'],
  Binary: ['Base64', 'ASCII', 'Hex']
};

// Available format options
const FORMAT_OPTIONS = [
  { value: 'camelCase', label: 'camelCase', extension: () => javascript() },
  { value: 'snake_case', label: 'snake_case', extension: () => javascript() },
  { value: 'kebab-case', label: 'kebab-case', extension: () => javascript() },
  { value: 'PascalCase', label: 'PascalCase', extension: () => javascript() },
  { value: 'Base64', label: 'Base64', extension: () => javascript() },
  { value: 'ASCII', label: 'ASCII', extension: () => javascript() },
  { value: 'Hex', label: 'Hex', extension: () => javascript() },
  { value: 'Binary', label: 'Binary', extension: () => javascript() }
];

Object.entries(CONVERSION_MAP).forEach(([from, targets]) => {
  targets.forEach(to => {
    if (!CONVERSION_MAP[to]) {
      CONVERSION_MAP[to] = [];
    }
    if (!CONVERSION_MAP[to].includes(from)) {
      CONVERSION_MAP[to].push(from);
    }
  });
});

// String conversion functions
const stringConverters = {
  // Case converters
  'camelCase-to-snake_case': (str) =>
    str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`),

  'camelCase-to-kebab-case': (str) =>
    str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`),

  'camelCase-to-PascalCase': (str) =>
    str.charAt(0).toUpperCase() + str.slice(1),

  'snake_case-to-camelCase': (str) =>
    str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()),

  'snake_case-to-kebab-case': (str) =>
    str.replace(/_/g, '-'),

  'snake_case-to-PascalCase': (str) =>
    str.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(''),

  'kebab-case-to-camelCase': (str) =>
    str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()),

  'kebab-case-to-snake_case': (str) =>
    str.replace(/-/g, '_'),

  'kebab-case-to-PascalCase': (str) =>
    str.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(''),

  'PascalCase-to-camelCase': (str) =>
    str.charAt(0).toLowerCase() + str.slice(1),

  'PascalCase-to-snake_case': (str) =>
    str.split(/(?=[A-Z])/).join('_').toLowerCase(),

  'PascalCase-to-kebab-case': (str) =>
    str.split(/(?=[A-Z])/).join('-').toLowerCase(),

  // Encoding converters
  'ASCII-to-Base64': (str) =>
    btoa(str),

  'Base64-to-ASCII': (str) =>
    atob(str),

  'ASCII-to-Hex': (str) =>
    Array.from(str)
      .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join(''),

  'Hex-to-ASCII': (str) =>
    str.match(/.{1,2}/g)
      ?.map(byte => String.fromCharCode(parseInt(byte, 16)))
      .join('') || '',

  'ASCII-to-Binary': (str) =>
    Array.from(str)
      .map(c => c.charCodeAt(0).toString(2).padStart(8, '0'))
      .join(' '),

  'Binary-to-ASCII': (str) =>
    str.split(' ')
      .map(bin => String.fromCharCode(parseInt(bin, 2)))
      .join(''),

  'Base64-to-Hex': (str) =>
    stringConverters['ASCII-to-Hex'](atob(str)),

  'Hex-to-Base64': (str) =>
    btoa(stringConverters['Hex-to-ASCII'](str)),

  'Base64-to-Binary': (str) =>
    stringConverters['ASCII-to-Binary'](atob(str)),

  'Binary-to-Base64': (str) =>
    btoa(stringConverters['Binary-to-ASCII'](str)),

  'Hex-to-Binary': (str) =>
    str.match(/.{1,2}/g)
      ?.map(byte => parseInt(byte, 16).toString(2).padStart(8, '0'))
      .join(' ') || '',

  'Binary-to-Hex': (str) =>
    str.split(' ')
      .map(bin => parseInt(bin, 2).toString(16).padStart(2, '0'))
      .join('')
};

const StringConverter = ({ initialState }) => {
  const updateMicroAppState = useAppStore(state => state.updateMicroAppState);
  const getMicroAppState = useAppStore(state => state.getMicroAppState);
  const savedState = getMicroAppState('StringConverter') || {};

  const [fromFormat, setFromFormat] = useState(() => {
    const saved = FORMAT_OPTIONS.find(f => f.value === savedState.fromFormat);
    return saved || FORMAT_OPTIONS[0];
  });

  const [toFormat, setToFormat] = useState(() => {
    const validTargets = CONVERSION_MAP[fromFormat.value] || [];
    const saved = FORMAT_OPTIONS.find(f =>
      f.value === savedState.toFormat &&
      validTargets.includes(f.value)
    );
    return saved || FORMAT_OPTIONS.find(f => validTargets.includes(f.value));
  });

  const [input, setInput] = useState(savedState.input || '');
  const [output, setOutput] = useState(savedState.output || '');
  const [error, setError] = useState(null);

  // Save state
  useEffect(() => {
    updateMicroAppState('StringConverter', {
      fromFormat: fromFormat.value,
      toFormat: toFormat.value,
      input,
      output
    });
  }, [fromFormat, toFormat, input, output, updateMicroAppState]);

  const convertContent = useCallback(
    debounce(async (value) => {
      if (!value.trim()) {
        setOutput('');
        setError(null);
        return;
      }
  
      try {
        const converterKey = `${fromFormat.value}-to-${toFormat.value}`;
        if (!converters[converterKey]) { // or stringConverters for StringConverter
          throw new Error(`Cannot convert from ${fromFormat.label} to ${toFormat.label}`);
        }
  
        const result = await converters[converterKey](value); // or stringConverters
        setOutput(result);
        setError(null);
      } catch (err) {
        console.error('Conversion error:', err);
        setError(err.message);
        setOutput('');
      }
    }, 500),
    [fromFormat, toFormat]
  );

  const getValidTargetFormats = useCallback((sourceFormat) => {
    const validTargets = CONVERSION_MAP[sourceFormat.value] || [];
    return FORMAT_OPTIONS.filter(format => validTargets.includes(format.value));
  }, []);

  const validateInput = (value, format) => {
    switch (format) {
      case 'camelCase':
        return /^[a-z][a-zA-Z0-9]*$/.test(value);
      case 'snake_case':
        return /^[a-z][a-z0-9_]*$/.test(value);
      case 'kebab-case':
        return /^[a-z][a-z0-9-]*$/.test(value);
      case 'PascalCase':
        return /^[A-Z][a-zA-Z0-9]*$/.test(value);
      case 'Base64':
        return /^[A-Za-z0-9+/=]*$/.test(value);
      case 'Hex':
        return /^[0-9A-Fa-f\s]*$/.test(value);
      case 'Binary':
        return /^[01\s]*$/.test(value);
      case 'ASCII':
      default:
        return true;
    }
  };
  
  const handleInputChange = (value) => {
    setInput(value);
    
    if (!validateInput(value, fromFormat.value)) {
      setError(`Invalid ${fromFormat.label} format`);
      setOutput('');
      return;
    }
    
    convertContent(value);
  };
  const handleFromFormatChange = (newValue) => {
    // Get the full format object
    const format = FORMAT_OPTIONS.find(f => f.value === newValue);
    if (!format) return;
  
    // Get valid targets for new source format
    const validTargets = CONVERSION_MAP[newValue] || [];
  
    // Update source format
    setFromFormat(format);
  
    // If current target is not valid for new source, use first valid target
    if (!validTargets.includes(toFormat.value)) {
      const firstValidTarget = FORMAT_OPTIONS.find(f => validTargets.includes(f.value));
      setToFormat(firstValidTarget);
    }
  
    // Convert content if exists after a short delay
    if (input.trim()) {
      setTimeout(() => {
        const converterKey = `${newValue}-to-${toFormat.value}`;
        if (stringConverters[converterKey]) {
          convertContent(input);
        }
      }, 0);
    }
  };
  
  const handleToFormatChange = (newValue) => {
    // Get the full format object
    const format = FORMAT_OPTIONS.find(f => f.value === newValue);
    if (!format) return;
  
    // Verify it's a valid target for current source
    const validTargets = CONVERSION_MAP[fromFormat.value] || [];
    if (validTargets.includes(newValue)) {
      setToFormat(format);
  
      // Convert content if exists after a short delay
      if (input.trim()) {
        setTimeout(() => {
          const converterKey = `${fromFormat.value}-to-${newValue}`;
          if (stringConverters[converterKey]) {
            convertContent(input);
          }
        }, 0);
      }
    }
  };

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
  };

  const editorConfig = {
    theme: lightTheme,
    height: "100%",
    extensions: [
      lineNumbers(),
      EditorView.lineWrapping,
      EditorView.theme({
        "&": { height: "100%" }
      })
    ]
  };

  return (
    <div data-component="StringConverter" className="h-screen flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <SelectMenu
            options={FORMAT_OPTIONS}
            value={fromFormat.value}
            className="min-w-[180px]"
            onChange={(value) => handleFromFormatChange(value)}
            tooltip="Convert from"
          />

          <span className="text-gray-400">→</span>

          <SelectMenu
            options={FORMAT_OPTIONS.filter(format =>
              CONVERSION_MAP[fromFormat.value]?.includes(format.value)
            )}
            value={toFormat.value}
            className="min-w-[180px]"
            onChange={(value) => handleToFormatChange(value)}
            tooltip="Convert to"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 min-h-0">
        {/* Input panel */}
        <div className="h-[50vh] lg:h-full flex flex-col lg:border-r-2">
          <div className="py-3 px-4 border-b-2 flex items-center justify-between">
            <h3 className="font-medium text-gray-700 font-mono font-semibold">`{fromFormat.label}`</h3>
            <Tooltip content="Copy input" placement="top">
              <Button
                onClick={() => copyToClipboard(input)}
                className="py-1 uppercase text-xs rounded"
              >
                Copy
              </Button>
            </Tooltip>
          </div>
          <div className="flex-1 min-h-0">
            <CodeMirror
              value={input}
              height="100%"
              {...editorConfig}
              extensions={[fromFormat.extension(), ...editorConfig.extensions]}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Output panel */}
        <div className="h-[50vh] lg:h-full flex flex-col">
          <div className="py-3 px-4 border-b-2 flex items-center justify-between">
            <h3 className="font-medium text-gray-700 font-mono font-semibold">`{toFormat.label}`</h3>
            <Tooltip content="Copy output" placement="top">
              <Button
                onClick={() => copyToClipboard(output)}
                className="py-1 uppercase text-xs rounded"
              >
                Copy
              </Button>
            </Tooltip>
          </div>
          <div className="flex-1 min-h-0">
            {error ? (
              <div className="p-4 text-red-500 bg-red-50">{error}</div>
            ) : (
              <CodeMirror
                value={output}
                height="100%"
                {...editorConfig}
                extensions={[toFormat.extension(), ...editorConfig.extensions]}
                editable={false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StringConverter;