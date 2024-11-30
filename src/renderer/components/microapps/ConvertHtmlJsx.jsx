import React, { useState, useEffect } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import Button from '../partials/Button';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import CodeEditorLayout from '../partials/CodeEditorLayout';

const STORAGE_KEY = 'html-jsx-converter-state';

const ConvertHtmlJsx = () => {
  const [direction, setDirection] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).direction : 'html-to-jsx';
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


  const toKebabCase = str => str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

  const convertJsxToHtml = (jsx) => {
    try {
      // First handle the component/element names
      let result = jsx.replace(/<([A-Z][a-zA-Z0-9]*)/g, (match, componentName) => {
        return `<${toKebabCase(componentName).substring(1)}`;
      }).replace(/<\/([A-Z][a-zA-Z0-9]*)/g, (match, componentName) => {
        return `</${toKebabCase(componentName).substring(1)}`;
      });

      // Handle closing tags of components
      result = result.replace(/\/>/, '>');

      // Convert camelCase attributes to kebab-case
      result = result.replace(/([a-z][A-Z])/g, m => `${m[0]}-${m[1].toLowerCase()}`);

      // Handle JSX expressions in attributes, preserving their content
      result = result.replace(/=\{([^}]+)\}/g, (match, expr) => {
        return `="{${expr}}"`;
      });

      return result;
    } catch (err) {
      throw new Error('Invalid JSX: ' + err.message);
    }
  };

  const convertHtmlToJsx = (html) => {
    try {
      return html
        .replace(/class=/g, 'className=')
        .replace(/for=/g, 'htmlFor=')
        // Convert kebab-case attributes to camelCase
        .replace(/([a-z])-([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase())
        // Convert kebab-case elements to PascalCase
        .replace(/<([a-z]+-[a-z-]+)/g, (_, tag) => 
          '<' + tag.split('-').map(part => 
            part.charAt(0).toUpperCase() + part.slice(1)
          ).join('')
        )
        .replace(/<\/([a-z]+-[a-z-]+)/g, (_, tag) =>
          '</' + tag.split('-').map(part =>
            part.charAt(0).toUpperCase() + part.slice(1)
          ).join('')
        )
        // Convert string expressions to JSX expressions
        .replace(/="(\{[^}]+\})"/g, '=$1');
    } catch (err) {
      throw new Error('Invalid HTML: ' + err.message);
    }
  };

  const handleConvert = (value) => {
    if (!value.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      const result = direction === 'html-to-jsx'
        ? convertHtmlToJsx(value)
        : convertJsxToHtml(value);
      setOutput(result);
      setError(null);
    } catch (err) {
      setError(err.message);
      setOutput('');
    }
  };

  const handleSwitch = () => {
    const newDirection = direction === 'html-to-jsx' ? 'jsx-to-html' : 'html-to-jsx';
    setDirection(newDirection);
    setInput(output);
    setOutput(input);
    setError(null);
  };

  useEffect(() => {
    handleConvert(input);
  }, []);

  const jsxExtension = () => javascript({ jsx: true });

  return (
    <div data-component="ConvertHtmlJsx" className="h-screen flex flex-col ">
      <div className="flex items-center gap-4 p-4 pb-0">
        <Button
          onClick={handleSwitch}
          className="flex items-center gap-2 px-4"
        >
          <span>{direction === 'html-to-jsx' ? 'HTML → JSX' : 'JSX → HTML'}</span>
          <ArrowRightLeft className="h-4 w-4" />
        </Button>
      </div>

      <CodeEditorLayout
        leftTitle={direction === 'html-to-jsx' ? 'HTML' : 'JSX'}
        rightTitle={direction === 'html-to-jsx' ? 'JSX' : 'HTML'}
        leftValue={input}
        rightValue={output}
        onLeftChange={(value) => {
          setInput(value);
          handleConvert(value);
        }}
        leftExtensions={[direction === 'html-to-jsx' ? html() : jsxExtension()]}
        rightExtensions={[direction === 'html-to-jsx' ? jsxExtension() : html()]}
        error={error}
      />
    </div>
  );
};

export default ConvertHtmlJsx;