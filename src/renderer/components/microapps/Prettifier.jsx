import React, { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';
import CodeMirror from '@uiw/react-codemirror';
import Button from '../partials/Button';
import { RotateCcw, Copy } from 'lucide-react';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { EditorView } from '@codemirror/view';
import { lineNumbers } from '@codemirror/view';
import { lightTheme } from '../../../config';
import JsonView from '@uiw/react-json-view';
import Tooltip from '../partials/Tooltip';
import Toast from '../partials/Toast';
import Alert from '../partials/Alert';
import SelectMenu from '../partials/SelectMenu';
import useAppStore from '../../store/appStore';
import prettier from 'prettier/standalone';
import babelParser from 'prettier/parser-babel';
import htmlParser from 'prettier/parser-html';
import cssParser from 'prettier/parser-postcss';
import { use } from 'marked';

const FORMAT_OPTIONS = [
  { value: 'json', label: 'JSON', views: ['pretty', 'tree'], extension: () => javascript() },
  { value: 'html', label: 'HTML', views: ['pretty'], extension: () => html() },
  { value: 'css', label: 'CSS', views: ['pretty'], extension: () => css() },
  { value: 'javascript', label: 'JavaScript', views: ['pretty'], extension: () => javascript() },
];

const VIEW_OPTIONS = [
  { value: 'pretty', label: 'Pretty View' },
  { value: 'tree', label: 'Tree View' }
];

const formatters = {
  json: (str, isTreeView) => {
    try {
      const parsed = JSON.parse(str.trim());
      return isTreeView ? parsed : JSON.stringify(parsed, null, 2);
    } catch (error) {
      throw new Error('Invalid JSON: ' + error.message);
    }
  },

  javascript: (str) => {
    try {
      return prettier.format(str, {
        parser: 'babel',
        plugins: [babelParser],
        printWidth: 80,
        tabWidth: 2,
        semi: true,
        singleQuote: true,
        trailingComma: 'es5'
      });
    } catch (error) {
      throw new Error('Invalid JavaScript: ' + error.message);
    }
  },

  html: (str) => {
    try {
      return prettier.format(str.trim(), {
        parser: 'html',
        plugins: [htmlParser],
        printWidth: 80,
        tabWidth: 2,
        useTabs: false,
        htmlWhitespaceSensitivity: 'css',
        bracketSameLine: true,
        singleAttributePerLine: false,
        bracketSpacing: true,
        // These options help prevent the weird newline issues
        proseWrap: 'never',
        endOfLine: 'lf'
      });
    } catch (error) {
      throw new Error('Invalid HTML: ' + error.message);
    }
  },

  css: (str) => {
    try {
      return prettier.format(str, {
        parser: 'css',
        plugins: [cssParser],
        printWidth: 80,
        tabWidth: 2,
        useTabs: false,
        singleQuote: false
      });
    } catch (error) {
      throw new Error('Invalid CSS: ' + error.message);
    }
  }
};

const isValidInput = (str, format) => {
  if (!str.trim()) return true;

  try {
    switch (format) {
      case 'json':
        JSON.parse(str);
        return true;

      case 'javascript':
        // More lenient JS validation that allows declarations and expressions
        prettier.format(str, {
          parser: 'babel',
          plugins: [babelParser]
        });
        return true;

      case 'html':
        prettier.format(str, {
          parser: 'html',
          plugins: [htmlParser]
        });
        return true;

      case 'css':
        prettier.format(str, {
          parser: 'css',
          plugins: [cssParser]
        });
        return true;

      default:
        return true;
    }
  } catch (error) {
    return false;
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
  const [isLineWrapped, setIsLineWrapped] = useState(savedState.isLineWrapped ?? false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [error, setError] = useState(null);

   useEffect(() => {
    // setCopiedToClipboard(true);
    setTimeout(() => {
      setCopiedToClipboard(false);
    }, 2000);
  }, [copiedToClipboard]);

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
        <div className="text-gray-400 dark:text-gray-700 dark:text-gray-200 p-4">
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
        
        setIsLineWrapped={false}
        editable={true}
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
    setCopiedToClipboard(true);
    const textToCopy = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
    await navigator.clipboard.writeText(textToCopy);
  };

  const editorConfig = {
    theme: lightTheme,
    height: "100%",
    extensions: [
      format.extension(),
      lineNumbers(),
      ...(isLineWrapped ? [EditorView.lineWrapping] : []),
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
    }, 100),
    [format, view]
  );

  return (
    <div data-component="Prettifier" className="h-screen flex flex-col">
      {
        copiedToClipboard && (
          <Toast duration={4000}>
            <Alert className="py-2" title="Copied" />
          </Toast>
        )
      }
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
          <div className="py-3 px-4 border-b-2 dark:border-gray-800 border-r-2 dark:border-gray-800 flex gap-3 justify-between items-center sticky top-0 z-0">
            <h3 className="font-medium text-gray-700 dark:text-gray-200">Input</h3>
            <div>
              <Tooltip content="Clear input" placement="top" theme="light">
                <Button
                  onClick={() => {
                    setInput('');
                    setOutput('');
                    setError(null);
                  }}
                  className=" rounded text-gray-600 dark:text-gray-300 hover:text-gray-900">
                  <RotateCcw className='size-4' />
                </Button>
              </Tooltip>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-auto border-r-2 dark:border-gray-800 select-text">
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
          <div className="py-3 px-4 border-b-2 dark:border-gray-800 border-b-2 dark:border-gray-800 flex gap-3 items-center justify-between">
            <h3 className="font-medium text-gray-700 dark:text-gray-200">Output</h3>
            {output && (
              <div>
              <Tooltip content="Copy to Clipboard" placement="top" theme="light">
                <Button
                  onClick={() => {
                    copyToClipboard();
                  }}
                  className=" bg-[rgba(0,0,0,0)] shadow-none text-[11px] text-gray-600 dark:text-gray-300 hover:text-gray-900">
                  <Copy className='size-4' />
                </Button>
              </Tooltip>
            </div>
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