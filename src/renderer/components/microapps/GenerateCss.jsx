
import React, { useState, useEffect } from 'react';
import { Code, Copy } from 'lucide-react';
import Button from '../partials/Button';
import Input from '../partials/Input';
import SelectMenu from '../partials/SelectMenu';
import Modal from '../partials/Modal';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';

const STORAGE_KEY = 'css-generator-state';

const LIBRARY_OPTIONS = [
  { value: 'vanilla', label: 'Vanilla CSS' },
  { value: 'tailwind', label: 'Tailwind CSS' },
  { value: 'styled', label: 'styled-components' },
  { value: 'emotion', label: 'Emotion' },
  { value: 'css-in-js', label: 'CSS-in-JS' },
  { value: 'css-modules', label: 'CSS Modules' }
];

const COLOR_FIELDS = [
  { id: 'primary', label: 'Primary Color' },
  { id: 'secondary', label: 'Secondary Color' },
  { id: 'accent', label: 'Accent Color' },
  { id: 'text', label: 'Text Color' },
  { id: 'background', label: 'Background Color' }
];

const SPACING_FIELDS = [
  { id: 'xs', label: 'Extra Small' },
  { id: 'sm', label: 'Small' },
  { id: 'md', label: 'Medium' },
  { id: 'lg', label: 'Large' },
  { id: 'xl', label: 'Extra Large' }
];

const TYPOGRAPHY_FIELDS = [
  { id: 'fontPrimary', label: 'Primary Font', type: 'text' },
  { id: 'fontSecondary', label: 'Secondary Font', type: 'text' },
  { id: 'fontSizeBase', label: 'Base Font Size', type: 'text' },
  { id: 'lineHeightBase', label: 'Base Line Height', type: 'text' }
];

const WIDTH_FIELDS = [
  { id: 'containerSm', label: 'Small Container' },
  { id: 'containerMd', label: 'Medium Container' },
  { id: 'containerLg', label: 'Large Container' },
  { id: 'containerXl', label: 'Extra Large Container' }
];

const generateTheme = (values, library, minified = false) => {
  const themeContent = {
    vanilla: () => `:root {
  ${Object.entries(values).map(([key, value]) => `  --${key}: ${value};`).join('\n')}
}`,
    tailwind: () => `module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '${values.primary || '#000000'}',
        secondary: '${values.secondary || '#000000'}',
        accent: '${values.accent || '#000000'}',
      },
      spacing: {
        xs: '${values.xs || '0.25rem'}',
        sm: '${values.sm || '0.5rem'}',
        md: '${values.md || '1rem'}',
        lg: '${values.lg || '2rem'}',
        xl: '${values.xl || '4rem'}',
      },
      fontFamily: {
        primary: ['${values.fontPrimary || 'sans-serif'}'],
        secondary: ['${values.fontSecondary || 'serif'}'],
      },
      fontSize: {
        base: '${values.fontSizeBase || '1rem'}',
      },
      lineHeight: {
        base: '${values.lineHeightBase || '1.5'}',
      },
      container: {
        padding: {
          DEFAULT: '1rem',
          sm: '${values.containerSm || '640px'}',
          lg: '${values.containerLg || '1024px'}',
          xl: '${values.containerXl || '1280px'}',
        },
      },
    },
  },
}`,
    styled: () => `export const theme = ${JSON.stringify({
      colors: {
        primary: values.primary,
        secondary: values.secondary,
        accent: values.accent,
      },
      spacing: {
        xs: values.xs,
        sm: values.sm,
        md: values.md,
        lg: values.lg,
        xl: values.xl,
      },
      fonts: {
        primary: values.fontPrimary,
        secondary: values.fontSecondary,
      },
    }, null, 2)}`,
    emotion: () => `export const theme = ${JSON.stringify({
      colors: {
        primary: values.primary,
        secondary: values.secondary,
        accent: values.accent,
      },
      space: {
        xs: values.xs,
        sm: values.sm,
        md: values.md,
        lg: values.lg,
        xl: values.xl,
      },
      fonts: {
        primary: values.fontPrimary,
        secondary: values.fontSecondary,
      },
    }, null, 2)}`,
  };

  const generator = themeContent[library];
  if (!generator) return '// Format not implemented yet';
  
  const output = generator();
  return minified ? output.replace(/\s+/g, ' ').trim() : output;
};

const GenerateCss = () => {
  const [showModal, setShowModal] = useState(false);
  const [values, setValues] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).values : {};
  });
  const [minified, setMinified] = useState(false);
  
  const [selectedLibrary, setSelectedLibrary] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedLibrary = saved ? JSON.parse(saved).selectedLibrary : 'vanilla';
    return LIBRARY_OPTIONS.find(opt => opt.value === savedLibrary) || LIBRARY_OPTIONS[0];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      selectedLibrary: selectedLibrary.value,
      values
    }));
  }, [selectedLibrary, values]);

  const handleLibraryChange = (option) => {
    setSelectedLibrary(option);
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      selectedLibrary,
      values
    }));
  }, [selectedLibrary, values]);

  const handleInputChange = (id, value) => {
    setValues(prev => ({
      ...prev,
      [id]: value
    }));
  };

  return (
    <div data-component="GenerateCss" className="h-screen flex flex-col">
      <div className="flex items-center gap-4 p-4 pb-0">
        <SelectMenu
          options={LIBRARY_OPTIONS}
          value={selectedLibrary.value}
          onChange={handleLibraryChange}
          className="min-w-[220px]"
        />
        <Button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2"
        >
          <Code className="w-4 h-4" />
          <span>Generate Theme</span>
        </Button>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Colors */}
          <div className="space-y-4">
            <h2 className="font-medium text-lg">Colors</h2>
            {COLOR_FIELDS.map(field => (
              <div key={field.id} className="space-y-2">
                <label className="text-sm text-gray-600">{field.label}</label>
                <Input
                  type="color"
                  value={values[field.id] || '#000000'}
                  onChange={e => handleInputChange(field.id, e.target.value)}
                  className="w-full h-10"
                />
              </div>
            ))}
          </div>

          {/* Spacing */}
          <div className="space-y-4">
            <h2 className="font-medium text-lg">Spacing</h2>
            {SPACING_FIELDS.map(field => (
              <div key={field.id} className="space-y-2">
                <label className="text-sm text-gray-600">{field.label}</label>
                <Input
                  type="text"
                  value={values[field.id] || ''}
                  onChange={e => handleInputChange(field.id, e.target.value)}
                  placeholder="e.g. 1rem"
                  className="w-full px-3 py-2"
                />
              </div>
            ))}
          </div>

          {/* Typography */}
          <div className="space-y-4">
            <h2 className="font-medium text-lg">Typography</h2>
            {TYPOGRAPHY_FIELDS.map(field => (
              <div key={field.id} className="space-y-2">
                <label className="text-sm text-gray-600">{field.label}</label>
                <Input
                  type={field.type || 'text'}
                  value={values[field.id] || ''}
                  onChange={e => handleInputChange(field.id, e.target.value)}
                  className="w-full px-3 py-2"
                />
              </div>
            ))}
          </div>

          {/* Container Widths */}
          <div className="space-y-4">
            <h2 className="font-medium text-lg">Container Widths</h2>
            {WIDTH_FIELDS.map(field => (
              <div key={field.id} className="space-y-2">
                <label className="text-sm text-gray-600">{field.label}</label>
                <Input
                  type="text"
                  value={values[field.id] || ''}
                  onChange={e => handleInputChange(field.id, e.target.value)}
                  placeholder="e.g. 1200px"
                  className="w-full px-3 py-2"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Generated Theme"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SelectMenu
              options={LIBRARY_OPTIONS}
              value={selectedLibrary.value}
              onChange={handleLibraryChange}
              className="min-w-[220px]"
            />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={minified}
                  onChange={e => setMinified(e.target.checked)}
                />
                <span>Minified</span>
              </label>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(generateTheme(values, selectedLibrary, minified));
                }}
              >
                <Copy className='size-4 text-gray-500' />
              </Button>
            </div>
          </div>
          
          <CodeMirror
            value={generateTheme(values, selectedLibrary.value, minified)}
            height="400px"
            extensions={[selectedLibrary.value === 'vanilla' ? css() : javascript()]}
            editable={false}
          />
        </div>
      </Modal>
    </div>
  );
};

export default GenerateCss;
