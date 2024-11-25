import React, { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { EditorView } from '@codemirror/view'
import { lineNumbers } from '@codemirror/view'
import JsonView from '@uiw/react-json-view';
import Tooltip from '../partials/Tooltip';
import SelectMenu from '../partials/SelectMenu';
import useAppStore from '../../store/appStore';
import { lightTheme } from '../../../config';

const FORMAT_OPTIONS = [
  { value: 'json', label: 'JSON', views: ['pretty', 'tree'], extension: javascript },
  { value: 'html', label: 'HTML', views: ['pretty'], extension: html },
  { value: 'css', label: 'CSS', views: ['pretty'], extension: css },
  { value: 'javascript', label: 'JavaScript', views: ['pretty'], extension: javascript },
];

const VIEW_OPTIONS = [
  { value: 'pretty', label: 'Pretty View' },
  { value: 'tree', label: 'Tree View' }
];

// Improved formatters
const formatters = {
  json: (str, isTreeView) => {  // Add isTreeView parameter
    try {
      // First try to parse the string to an actual object/array
      let parsed;
      try {
        parsed = JSON.parse(str);
      } catch (e) {
        // If initial parse fails, try to clean the string
        const cleaned = str.replace(/\n/g, '').trim();
        parsed = JSON.parse(cleaned);
      }

      // For tree view, return the parsed object directly
      if (isTreeView) {
        return parsed;
      }

      // For pretty view, return formatted string
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      throw new Error('Invalid JSON: ' + error.message);
    }
  },
  javascript: (str) => {
    try {
      if (window.prettier) {
        return window.prettier.format(str, {
          parser: 'babel',
          plugins: window.prettierPlugins,
          printWidth: 80,
          tabWidth: 2,
          semi: true,
          singleQuote: true
        });
      }
      throw new Error('Prettier not loaded');
    } catch (error) {
      throw new Error('Invalid JavaScript: ' + error.message);
    }
  },

  html: (str) => {
    try {
      if (window.prettier) {
        return window.prettier.format(str, {
          parser: 'html',
          plugins: window.prettierPlugins,
          printWidth: 80,
          tabWidth: 2,
          htmlWhitespaceSensitivity: 'css'
        });
      }
      throw new Error('Prettier not loaded');
    } catch (error) {
      throw new Error('Invalid HTML: ' + error.message);
    }
  },

  css: (str) => {
    try {
      if (window.prettier) {
        return window.prettier.format(str, {
          parser: 'css',
          plugins: window.prettierPlugins,
          printWidth: 80,
          tabWidth: 2
        });
      }
      throw new Error('Prettier not loaded');
    } catch (error) {
      throw new Error('Invalid CSS: ' + error.message);
    }
  }
};

const Prettifier = ({ initialState }) => {
  // Get the persisted state from the store
  const updateMicroAppState = useAppStore(state => state.updateMicroAppState);
  const getMicroAppState = useAppStore(state => state.getMicroAppState);

  // Initialize state from store or defaults
  const savedState = getMicroAppState('Prettifier') || {};
  const [format, setFormat] = useState(FORMAT_OPTIONS.find(f => f.value === savedState.format) || FORMAT_OPTIONS[0]);
  const [view, setView] = useState(savedState.view || 'pretty');
  const [input, setInput] = useState(savedState.input || '');
  const [output, setOutput] = useState(savedState.output || '');
  const [isLineWrapped, setIsLineWrapped] = useState(savedState.isLineWrapped ?? true);

  const [error, setError] = useState(null);

  // useEffect(() => {
  //   const loadPrettier = async () => {
  //     const prettierScript = document.createElement('script');
  //     prettierScript.src = 'https://unpkg.com/prettier@2.8.8/standalone.js';
  //     document.head.appendChild(prettierScript);

  //     const parserBabel = document.createElement('script');
  //     parserBabel.src = 'https://unpkg.com/prettier@2.8.8/parser-babel.js';
  //     document.head.appendChild(parserBabel);

  //     const parserHtml = document.createElement('script');
  //     parserHtml.src = 'https://unpkg.com/prettier@2.8.8/parser-html.js';
  //     document.head.appendChild(parserHtml);

  //     const parserPostcss = document.createElement('script');
  //     parserPostcss.src = 'https://unpkg.com/prettier@2.8.8/parser-postcss.js';
  //     document.head.appendChild(parserPostcss);
  //   };

  //   loadPrettier();
  // }, []);

  // Save state to store whenever it changes
  useEffect(() => {
    updateMicroAppState('Prettifier', {
      format: format.value,
      view,
      input,
      output,
      isLineWrapped
    });
  }, [format, view, input, output, isLineWrapped, updateMicroAppState]);

  useEffect(() => {
    // Revalidate input when format changes if there's input
    if (input.trim()) {
      debouncedFormat(input);
    }
  }, [format.value]);

  const renderOutput = () => {
    if (error) {
      return (
        <div className="text-red-500 p-4 bg-red-50 rounded">
          {error}
        </div>
      );
    }

    if (!output) {
      return (
        <div className="text-gray-400 p-4">
          Enter some code to see the formatted output
        </div>
      );
    }

    if (format.value === 'json' && view === 'tree') {
      let parsedOutput;
      try {
        // If output is a string, parse it; otherwise use it directly
        parsedOutput = typeof output === 'string' ? JSON.parse(output) : output;
        return (
          <JsonView
            value={parsedOutput}
            style={{
              padding: '1rem',
              backgroundColor: 'transparent',
              fontSize: '14px'
            }}
            collapsed={1}
            enableClipboard={false}
            displayObjectSize={true}
            displayDataTypes={false}
            theme={{
              base00: 'white',
              base01: '#eee',
              base02: '#ddd',
              base03: '#ccc',
              base04: '#444',
              base05: '#333',
              base06: '#222',
              base07: '#111',
              base08: '#795da3', // value
              base09: '#183691', // number
              base0A: '#183691', // boolean
              base0B: '#183691', // string
              base0C: '#183691', // date
              base0D: '#795da3', // property
              base0E: '#795da3', // regex
              base0F: '#183691'  // undefined
            }}
          />
        );
      } catch (err) {
        console.error('JSON View error:', err);
        return (
          <div className="text-red-500 p-4 bg-red-50 rounded">
            Error displaying JSON tree view
          </div>
        );
      }
    }

    return (
      <CodeMirror
        value={typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
        height="100%"
        {...editorConfig}
        editable={false}
      />
    );
  };

  // Handle input changes
  const handleInputChange = (value) => {
    setInput(value);
    debouncedFormat(value);
  };

  // Copy to clipboard function
  const copyToClipboard = async () => {
    const textToCopy = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
    await navigator.clipboard.writeText(textToCopy);
  };

  const editorConfig = {
    theme: lightTheme,
    height: "100%",
    extensions: [
      format.extension(),
      lineNumbers(),
      isLineWrapped ? EditorView.lineWrapping : [],
      EditorView.theme({
        "&": {
          height: "100%"
        }
      })
    ]
  };


  const isValidInput = (str, format) => {
    try {
      switch (format) {
        case 'json':
          JSON.parse(str);
          return true;
        case 'javascript':
          // Basic JS validation - could be enhanced
          new Function(str);
          return true;
        case 'html':
          // Basic HTML validation - could be enhanced
          const parser = new DOMParser();
          const doc = parser.parseFromString(str, 'text/html');
          return !doc.querySelector('parsererror');
        case 'css':
          // Basic CSS validation - could be enhanced
          const style = document.createElement('style');
          style.textContent = str;
          document.head.appendChild(style);
          document.head.removeChild(style);
          return true;
        default:
          return true;
      }
    } catch (error) {
      return false;
    }
  };

  // Update the debouncedFormat function to include format validation
  const debouncedFormat = useCallback(
    debounce(async (value) => {
      if (!value.trim()) {
        setOutput('');
        setError(null);
        return;
      }

      try {
        // First check if the input is valid for the selected format
        if (!isValidInput(value, format.value)) {
          throw new Error(`Invalid ${format.value.toUpperCase()} format`);
        }

        if (format.value === 'json') {
          const formatted = formatters.json(value, view === 'tree');
          setOutput(formatted);
        } else {
          const formatted = formatters[format.value](value);
          setOutput(formatted);
        }
        setError(null);
      } catch (err) {
        console.error('Formatting error:', err);
        setError(err.message);
        // Still show the input in the output area when there's an error
        setOutput(value);
      }
    }, 1000),
    [format, view]
  );

  return (
    <div data-component="Prettifier" className="h-screen flex flex-col">
      {/* Header with controls */} 
      <div className="flex flex-wrap items-center gap-4 p-4 pb-0">
        <div className="flex flex-wrap items-center gap-4">
          <SelectMenu
            options={FORMAT_OPTIONS}
            value={format.value}
            className={`min-w-[180px]`}
            onChange={(newFormat) => {
              setFormat(newFormat);
              setView(newFormat.views[0]);
              // No need to manually trigger debouncedFormat here anymore
              // as the useEffect will handle it
            }}
            tooltip="Select format"
          />

          {format.value === 'json' && (
            <SelectMenu
              options={VIEW_OPTIONS}
              className={`min-w-[180px]`}
              value={view}
              onChange={(option) => {
                setView(option.value);
                if (input.trim()) {
                  debouncedFormat(input);
                }
              }}
              tooltip="Select view type"
            />
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 min-h-0">
        {/* Input panel */}
        <div className="h-[50vh] lg:h-full overflow-y-scroll flex flex-col">
          <div className="py-3 pl-4 border-b-2 border-r-2 flex gap-3 justify-start items-center sticky top-0 z-0">
            <h3 className="font-medium text-gray-700">Input</h3>
            <Tooltip content="Clear input" placement="top" theme="light">
              <button
                onClick={() => {
                  setInput('');
                  setOutput('');
                  setError(null);
                }}
                className="px-[0.3em] py-[0em] rounded border-2 text-[11px] text-gray-600 hover:text-gray-900">
                Clear
              </button>
            </Tooltip>
          </div>
          <div className="flex-1 min-h-0 overflow-auto border-r-2 select-text">
            <CodeMirror
              value={input}
              height="100%"
              {...editorConfig}
              onChange={handleInputChange}
              className='select-text'
            />
          </div>
        </div>

        {/* Output panel */}
        <div className="h-[50vh] lg:h-full overflow-y-scroll flex flex-col ">
          <div className="py-3 px-4 border-b-2 border-b-2 flex gap-3 items-center sticky top-0 z-0">
            <h3 className="font-medium text-gray-700">Output</h3>
            {output && (
              <Tooltip content="Copy to clipboard" placement="top" theme="light">
                <button
                  className="px-[0.3em] py-[0em] text-[11px] text-black rounded border-2 hover:bg-blue-100"
                  onClick={copyToClipboard}>
                  Copy
                </button>
              </Tooltip>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-auto select-text">
            {renderOutput()}
          </div>
        </div>
      </div>
    </div>
  );

};

export default Prettifier;