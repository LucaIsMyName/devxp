import React, { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { yaml } from '@codemirror/lang-yaml';
import { EditorView } from '@codemirror/view';
import { lineNumbers } from '@codemirror/view';
import SelectMenu from '../partials/SelectMenu';
import Tooltip from '../partials/Tooltip';
import useAppStore from '../../store/appStore';
import YAML from 'yaml';
import { lightTheme } from '../../../config';

// Light theme configuration (same as Prettifier)

const CONVERSION_MAP = {
  json: ['yaml', 'php'],
  yaml: ['json', 'php'],
  php: ['json', 'yaml'],
  jsx: ['html'],
  html: ['jsx']
  // Remove xml until implemented
};

const FORMAT_OPTIONS = [
  { value: 'json', label: 'JSON', extension: () => javascript() },
  { value: 'yaml', label: 'YAML', extension: () => yaml() },
  { value: 'php', label: 'PHP Array', extension: () => javascript() },
  { value: 'jsx', label: 'JSX', extension: () => javascript() },
  { value: 'html', label: 'HTML', extension: () => html() }
  // Remove xml until implemented
];

const getDefaultFormats = () => {
  const defaultFrom = FORMAT_OPTIONS[0]; // json
  const defaultTo = FORMAT_OPTIONS.find(f =>
    CONVERSION_MAP[defaultFrom.value]?.includes(f.value)
  ); // yaml
  return { defaultFrom, defaultTo };
};

// Browser-compatible XML parser helper
const parseXML = (xmlString) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

  // Check for parsing errors
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Invalid XML format');
  }

  // Helper function to convert XML nodes to JSON
  const xmlToObj = (node) => {
    const obj = {};

    // Handle attributes
    if (node.attributes) {
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        obj[`@${attr.nodeName}`] = attr.nodeValue;
      }
    }

    // Handle child nodes
    if (node.hasChildNodes()) {
      const children = {};
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        if (child.nodeType === 1) { // Element node
          const childObj = xmlToObj(child);
          if (children[child.nodeName]) {
            if (!Array.isArray(children[child.nodeName])) {
              children[child.nodeName] = [children[child.nodeName]];
            }
            children[child.nodeName].push(childObj);
          } else {
            children[child.nodeName] = childObj;
          }
        } else if (child.nodeType === 3 && child.nodeValue.trim()) { // Text node
          return child.nodeValue.trim();
        }
      }
      Object.assign(obj, children);
    }

    return obj;
  };

  return xmlToObj(xmlDoc.documentElement);
};

// Browser-compatible XML builder helper
const jsonToXML = (obj, nodeName = 'root') => {
  const xmlDoc = document.implementation.createDocument(null, nodeName);

  const createNode = (parent, key, value) => {
    if (key.startsWith('@')) {
      parent.setAttribute(key.slice(1), value);
      return;
    }

    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(item => createNode(parent, key, item));
      } else {
        const element = xmlDoc.createElement(key);
        Object.entries(value).forEach(([k, v]) => createNode(element, k, v));
        parent.appendChild(element);
      }
    } else {
      const element = xmlDoc.createElement(key);
      element.textContent = value;
      parent.appendChild(element);
    }
  };

  Object.entries(obj).forEach(([key, value]) => {
    createNode(xmlDoc.documentElement, key, value);
  });

  return new XMLSerializer().serializeToString(xmlDoc);
};

const converters = {
  // JSON converters
  'json-to-yaml': (input) => {
    try {
      // Validate JSON first
      const parsed = JSON.parse(input);
      return YAML.stringify(parsed);
    } catch (err) {
      throw new Error('Invalid JSON: ' + err.message);
    }
  },
  'json-to-php': (input) => {
    try {
      const obj = JSON.parse(input);
      return `<?php\n\nreturn ${JSON.stringify(obj, null, 2)
        .replace(/"/g, "'")
        .replace(/\[/g, 'array(')
        .replace(/\]/g, ')')};`;
    } catch (err) {
      throw new Error('Invalid JSON: ' + err.message);
    }
  },

  // YAML converters
  'yaml-to-json': (input) => {
    try {
      const parsed = YAML.parse(input);
      return JSON.stringify(parsed, null, 2);
    } catch (err) {
      throw new Error('Invalid YAML: ' + err.message);
    }
  },
  'yaml-to-php': (input) => {
    try {
      const obj = YAML.parse(input);
      return `<?php\n\nreturn ${JSON.stringify(obj, null, 2)
        .replace(/"/g, "'")
        .replace(/\[/g, 'array(')
        .replace(/\]/g, ')')};`;
    } catch (err) {
      throw new Error('Invalid YAML: ' + err.message);
    }
  },

  // PHP Array converters
  'php-to-json': (input) => {
    try {
      const cleaned = input
        .replace(/^<\?php/, '')
        .replace(/\?>$/, '')
        .replace(/return\s+/, '')
        .replace(/;$/, '')
        .replace(/array\(/g, '[')
        .replace(/\)/g, ']')
        .replace(/=>/g, ':')
        .replace(/'/g, '"');
      return JSON.stringify(JSON.parse(cleaned), null, 2);
    } catch (err) {
      throw new Error('Invalid PHP Array: ' + err.message);
    }
  },
  'php-to-yaml': (input) => {
    try {
      const jsonStr = converters['php-to-json'](input);
      return converters['json-to-yaml'](jsonStr);
    } catch (err) {
      throw new Error('Invalid PHP Array: ' + err.message);
    }
  },

  // JSX/HTML converters
  'jsx-to-html': (input) => {
    try {
      return input
        .replace(/className=/g, 'class=')
        .replace(/{(['"].*?['"])}/g, '$1')
        .replace(/{`(.*?)`}/g, '$1')
        .replace(/\{true\}/g, '')
        .replace(/\{false\}/g, '')
        .replace(/(\s)\/>/g, '$1>')
        .replace(/([A-Z][a-z]+)/g, match => match.toLowerCase());
    } catch (err) {
      throw new Error('Invalid JSX: ' + err.message);
    }
  },
  'html-to-jsx': (input) => {
    try {
      return input
        .replace(/class=/g, 'className=')
        .replace(/for=/g, 'htmlFor=')
        .replace(/(\w+)=["']([^"']*)["']/g, (match, attr, value) => {
          const camelCased = attr.replace(/-([a-z])/g, g => g[1].toUpperCase());
          return `${camelCased}="${value}"`;
        })
        .replace(/<(\w+)([^>]*)>/g, (match, tag, attrs) => {
          if (tag.toLowerCase() === tag) return match;
          return `<${tag.charAt(0).toUpperCase() + tag.slice(1)}${attrs}>`;
        });
    } catch (err) {
      throw new Error('Invalid HTML: ' + err.message);
    }
  }
};

const Converter = ({ initialState }) => {
  const updateMicroAppState = useAppStore(state => state.updateMicroAppState);
  const getMicroAppState = useAppStore(state => state.getMicroAppState);
  // Get format option helper with validation
  const getFormatOption = useCallback((value, isSource = true) => {
    const format = FORMAT_OPTIONS.find(f => f.value === value);
    if (!format) return isSource ? getDefaultFormats().defaultFrom : getDefaultFormats().defaultTo;
    return format;
  }, []);
  // Get valid target formats based on source format
  const getValidTargetFormats = useCallback((sourceFormat) => {
    const validTargets = CONVERSION_MAP[sourceFormat.value] || [];
    return FORMAT_OPTIONS.filter(format => validTargets.includes(format.value));
  }, []);
  // Initialize state with proper validation
  const [fromFormat, setFromFormat] = useState(() => {
    const savedState = getMicroAppState('Converter') || {};
    const savedFormat = getFormatOption(savedState.fromFormat, true);
    return savedFormat;
  });
  const [toFormat, setToFormat] = useState(() => {
    const savedState = getMicroAppState('Converter') || {};
    const currentFrom = getFormatOption(savedState.fromFormat, true);
    const validTargets = CONVERSION_MAP[currentFrom.value] || [];

    // If saved target is valid for current source, use it
    if (savedState.toFormat && validTargets.includes(savedState.toFormat)) {
      return getFormatOption(savedState.toFormat, false);
    }
    // Otherwise use first valid target
    return getFormatOption(validTargets[0], false);
  });
  const savedState = getMicroAppState('Converter') || {};
  const [input, setInput] = useState(savedState.input || '');
  const [output, setOutput] = useState(savedState.output || '');
  const [error, setError] = useState(null);


  useEffect(() => {
    updateMicroAppState('Converter', {
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

  const handleInputChange = (value) => {
    setInput(value);
    convertContent(value);
  };

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
  };

  const handleFromFormatChange = (newValue) => {
    // Get the full format object
    const newFormat = FORMAT_OPTIONS.find(f => f.value === newValue);
    if (!newFormat) return;

    // Get valid targets for new source format
    const validTargets = CONVERSION_MAP[newValue] || [];

    // If current target is not valid for new source, use first valid target
    if (!validTargets.includes(toFormat.value)) {
      const firstValidTarget = FORMAT_OPTIONS.find(f => validTargets.includes(f.value));
      setToFormat(firstValidTarget);
    }

    setFromFormat(newFormat);

    // Convert content if exists after a short delay to ensure state updates
    if (input.trim()) {
      setTimeout(() => {
        const converterKey = `${newValue}-to-${toFormat.value}`;
        if (converters[converterKey]) {
          convertContent(input);
        }
      }, 0);
    }
  };

  const handleToFormatChange = (newValue) => {
    // Get the full format object
    const newFormat = FORMAT_OPTIONS.find(f => f.value === newValue);
    if (!newFormat) return;

    // Verify it's a valid target for current source
    const validTargets = CONVERSION_MAP[fromFormat.value] || [];
    if (validTargets.includes(newValue)) {
      setToFormat(newFormat);

      // Convert content if exists after a short delay
      if (input.trim()) {
        setTimeout(() => {
          const converterKey = `${fromFormat.value}-to-${newValue}`;
          if (converters[converterKey]) {
            convertContent(input);
          }
        }, 0);
      }
    }
  };

  const editorConfig = {
    theme: lightTheme,
    height: "100%",
    extensions: [
      lineNumbers(),
      EditorView.lineWrapping,
      EditorView.theme({
        "&": {
          height: "100%"
        }
      })
    ]
  };

  return (
    <div data-component="Converter" className="h-screen flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4 p-4 pb-0">
        <div className="flex flex-wrap items-center gap-4">
          {/* Source format selector */}
          <SelectMenu
            options={FORMAT_OPTIONS}
            value={fromFormat.value}
            className="min-w-[180px]"
            onChange={(newValue) => handleFromFormatChange(newValue)}
            tooltip="Convert from"
          />

          <span className="text-gray-400">→</span>

          {/* Target format selector - only show valid targets */}
          <SelectMenu
            options={getValidTargetFormats(fromFormat)}
            value={toFormat.value}
            className="min-w-[180px]"
            onChange={(newValue) => handleToFormatChange(newValue)}
            tooltip="Convert to"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 min-h-0">
        {/* Input panel */}
        <div className="h-[50vh] lg:h-full overflow-y-scroll flex flex-col">
          <div className="py-3 pl-4 border-b-2 border-r-2 flex gap-3 justify-start items-center sticky top-0 z-0">
            <h3 className="font-medium text-gray-700">{fromFormat.label}</h3>
            {/* ... buttons remain the same ... */}
          </div>
          <div className="flex-1 min-h-0 overflow-auto border-r-2">
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
        <div className="h-[50vh] lg:h-full overflow-y-scroll flex flex-col">
          <div className="py-3 px-4 border-b-2 flex gap-3 items-center sticky top-0 z-0">
            <h3 className="font-medium text-gray-700">{toFormat.label}</h3>
            {/* ... buttons remain the same ... */}
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            {error ? (
              <div className="text-red-500 p-4 bg-red-50 rounded m-4">
                {error}
              </div>
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

export default Converter;