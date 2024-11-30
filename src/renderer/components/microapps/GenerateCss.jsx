
import React, { useState, useEffect } from "react";
import { Code, Copy, Plus, Edit2, Save, X, Rocket } from "lucide-react";
import Button from "../partials/Button";
import Input from "../partials/Input";
import SelectMenu from "../partials/SelectMenu";
import Modal from "../partials/Modal";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { css } from "@codemirror/lang-css";
import { caseConverters } from "../../functions/strings";

const STORAGE_KEY = "css-generator-state";

const LIBRARY_OPTIONS = [
  { value: "vanilla", label: "Vanilla CSS" },
  { value: "tailwind", label: "Tailwind CSS" },
  { value: "styled", label: "styled-components" },
  { value: "emotion", label: "Emotion" },
  { value: "css-in-js", label: "CSS-in-JS" },
  { value: "css-modules", label: "CSS Modules" },
];

const DEFAULT_FIELDS = {
  colors: [
    { id: "primary", label: "Primary Color", type: "color" },
    { id: "secondary", label: "Secondary Color", type: "color" },
    { id: "accent", label: "Accent Color", type: "color" },
    { id: "text", label: "Text Color", type: "color" },
    { id: "background", label: "Background Color", type: "color" },
  ],
  spacing: [
    { id: "xs", label: "Extra Small", type: "text" },
    { id: "sm", label: "Small", type: "text" },
    { id: "md", label: "Medium", type: "text" },
    { id: "lg", label: "Large", type: "text" },
    { id: "xl", label: "Extra Large", type: "text" },
  ],
  typography: [
    { id: "fontPrimary", label: "Primary Font", type: "text" },
    { id: "fontSecondary", label: "Secondary Font", type: "text" },
    { id: "fontSizeBase", label: "Base Font Size", type: "text" },
    { id: "lineHeightBase", label: "Base Line Height", type: "text" },
  ],
  containers: [
    { id: "containerSm", label: "Small Container", type: "text" },
    { id: "containerMd", label: "Medium Container", type: "text" },
    { id: "containerLg", label: "Large Container", type: "text" },
    { id: "containerXl", label: "Extra Large Container", type: "text" },
  ],
};

const generateTheme = (values, fields, library, minified = false) => {
  const convertToKebabCase = (str) => {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  };

  const convertToCamelCase = (str) => {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
        index === 0 ? word.toLowerCase() : word.toUpperCase()
      )
      .replace(/\s+/g, '');
  };

  const buildThemeObject = () => {
    const theme = {};

    // Handle colors
    if (fields.colors) {
      theme.colors = {};
      fields.colors.forEach(field => {
        theme.colors[convertToCamelCase(field.label)] = values[field.id] || '#000000';
      });
    }

    // Handle spacing
    if (fields.spacing) {
      theme.spacing = {};
      fields.spacing.forEach(field => {
        theme.spacing[convertToCamelCase(field.label)] = values[field.id] || '0.25rem';
      });
    }

    // Handle typography
    if (fields.typography) {
      theme.typography = {};
      fields.typography.forEach(field => {
        theme.typography[convertToCamelCase(field.label)] = values[field.id] || '';
      });
    }

    // Handle containers
    if (fields.containers) {
      theme.containers = {};
      fields.containers.forEach(field => {
        theme.containers[convertToCamelCase(field.label)] = values[field.id] || '';
      });
    }

    return theme;
  };

  const themeContent = {
    vanilla: () => {
      let cssVars = ':root {\n';
      Object.entries(fields).forEach(([section, sectionFields]) => {
        sectionFields.forEach(field => {
          const value = values[field.id] || (field.type === 'color' ? '#000000' : '0');
          cssVars += `  --${convertToKebabCase(field.label)}: ${value};\n`;
        });
      });
      cssVars += '}';
      return cssVars;
    },

    tailwind: () => {
      const theme = buildThemeObject();
      const config = {
        theme: {
          extend: {
            colors: theme.colors || {},
            spacing: theme.spacing || {},
            fontFamily: {
              ...Object.entries(theme.typography || {})
                .filter(([key]) => key.toLowerCase().includes('font'))
                .reduce((acc, [key, value]) => ({ ...acc, [key]: [value] }), {})
            },
            fontSize: {
              ...Object.entries(theme.typography || {})
                .filter(([key]) => key.toLowerCase().includes('size'))
                .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
            },
            lineHeight: {
              ...Object.entries(theme.typography || {})
                .filter(([key]) => key.toLowerCase().includes('lineheight'))
                .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
            },
            container: {
              padding: {
                DEFAULT: '1rem',
                ...Object.entries(theme.containers || {}).reduce((acc, [key, value]) => ({
                  ...acc,
                  [key.replace('container', '').toLowerCase()]: value
                }), {})
              }
            }
          }
        }
      };

      return `module.exports = ${JSON.stringify(config, null, 2)}`;
    },

    "styled": () => {
      const theme = buildThemeObject();
      return `export const theme = ${JSON.stringify(theme, null, 2)}`;
    },

    "emotion": () => {
      const theme = buildThemeObject();
      // Emotion uses 'space' instead of 'spacing'
      if (theme.spacing) {
        theme.space = theme.spacing;
        delete theme.spacing;
      }
      return `export const theme = ${JSON.stringify(theme, null, 2)}`;
    },

    "css-in-js": () => {
      const theme = buildThemeObject();
      return `export const theme = ${JSON.stringify(theme, null, 2)}`;
    },

    "css-modules": () => {
      let cssVars = ':export {\n';
      Object.entries(fields).forEach(([section, sectionFields]) => {
        sectionFields.forEach(field => {
          const value = values[field.id] || (field.type === 'color' ? '#000000' : '0');
          cssVars += `  --${convertToKebabCase(field.label)}: ${value};\n`;
        });
      });
      cssVars += '}';
      return cssVars;
    }
  };

  const generator = themeContent[library];
  if (!generator) return "// Format not implemented yet";

  const output = generator();
  return minified ? output.replace(/\s+/g, " ").trim() : output;
};

const FieldSection = ({ title, fields, values, onValueChange, onLabelChange, onAddField, onRemoveField }) => {
  const [editingLabel, setEditingLabel] = useState(null);
  const [newLabel, setNewLabel] = useState("");

  const handleAddField = () => {
    const newId = `custom_${Date.now()}`;
    onAddField({
      id: newId,
      label:title,
      type: fields[0].type === 'color' ? 'color' : 'text'
    });
  };

  return (
    <section className="space-y-4 border-2 dark:border-gray-800 p-4 rounded-lg bg-white dark:bg-gray-900">
      <div className="flex justify-between items-center">
        <h2 className="font-medium text-lg">{title}</h2>
        <Button onClick={handleAddField} className="flex items-center gap-2">
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <div className="flex items-center gap-2">
            {editingLabel === field.id ? (
              <div className="flex items-center justify-between w-full gap-2">
                <Input
                  type="text"
                  autoFocus
                  value={newLabel}
                  onEnter={() => {
                    onLabelChange(field.id, newLabel);
                    setEditingLabel(null);
                  }}
                  onBlur={
                    () => {
                      onLabelChange(field.id, newLabel);
                      setEditingLabel(null);
                    }
                  }
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="rounded-sm px-0 py-0 text-xs border-transparent bg-transparent w-full"
                />
                <section className="flex gap-2">
                  {/* <Button
                    className="px-0 py-0 border-transparent bg-transparent"
                    onClick={() => {
                      onLabelChange(field.id, newLabel);
                      setEditingLabel(null);
                    }}
                  >
                    <Save className="w-3 h-3" />
                  </Button> */}
                  <Button className="px-0 py-0 shadow-none border-transparent bg-transparent" onClick={() => setEditingLabel(null)}>
                    <X className="w-3 h-3" />
                  </Button>
                </section>
              </div>
            ) : (
              <div className="flex justify-between items-center w-full">
                <label 
                onClick={() => {
                  setEditingLabel(field.id);
                  setNewLabel(field.label);
                }}
                className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer">{field.label}</label>
                <section className="flex gap-2">
                  <Button
                    className="px-0 py-0 shadow-none border-transparent bg-transparent"
                    onClick={() => {
                      setEditingLabel(field.id);
                      setNewLabel(field.label);
                    }}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  {field.id.startsWith('custom_') && (
                    <Button
                      onClick={() => onRemoveField(field.id)}
                      className="px-0 py-0  shadow-none border-transparent bg-transparent">
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </section>
              </div>
            )}
          </div>
          {field.type === 'color' && (
            <div className="flex items-center gap-2">
              <div className="w-full h-12 relative flex-1">
                <Input
                  type={field.type}
                  value={values[field.id] || ""}
                  onChange={(e) => onValueChange(field.id, e.target.value)}
                  placeholder={field.type === 'color' ? '#000000' : 'Enter value'}
                  className={`absolute -inset-0 h-full py-0 px-0 border-transparent bg-transparent w-full text-sm border-0 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
            </div>
          )
          }
          {field.type !== 'color' && (
            <Input
              type={field.type}
              value={values[field.id] || ""}
              onChange={(e) => onValueChange(field.id, e.target.value)}
              placeholder={field.type === 'color' ? '#000000' : 'Enter value'}
              className={`w-full text-sm ${field.type === 'color'
                ? 'border-2 dark:border-gray-800 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                : ''
                }`}
            />
          )}
        </div>
      ))}
    </section>
  );
};

const GenerateCss = () => {
  const [showModal, setShowModal] = useState(false);
  const [minified, setMinified] = useState(false);

  // Initialize state with default fields
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedState = JSON.parse(saved);
        return {
          selectedLibrary: typeof parsedState.selectedLibrary === 'string'
            ? LIBRARY_OPTIONS.find(opt => opt.value === parsedState.selectedLibrary) || LIBRARY_OPTIONS[0]
            : parsedState.selectedLibrary || LIBRARY_OPTIONS[0],
          values: parsedState.values || {},
          fields: parsedState.fields || DEFAULT_FIELDS
        };
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }

    return {
      selectedLibrary: LIBRARY_OPTIONS[0],
      values: {},
      fields: DEFAULT_FIELDS
    };
  });

  const { selectedLibrary, values, fields } = state;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const handleLibraryChange = (optionValue) => {
    // Find the library option that matches the selected value
    const selectedOption = LIBRARY_OPTIONS.find(opt => opt.value === optionValue);
    setState(prev => ({
      ...prev,
      selectedLibrary: selectedOption || LIBRARY_OPTIONS[0]
    }));
  };


  const handleValueChange = (id, value) => {
    setState(prev => ({
      ...prev,
      values: {
        ...prev.values,
        [id]: value
      }
    }));
  };

  const handleLabelChange = (section, id, newLabel) => {
    setState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [section]: prev.fields[section].map(field =>
          field.id === id ? { ...field, label: newLabel } : field
        )
      }
    }));
  };

  const handleAddField = (section, newField) => {
    setState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [section]: [...prev.fields[section], newField]
      }
    }));
  };

  const handleRemoveField = (section, fieldId) => {
    setState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [section]: prev.fields[section].filter(field => field.id !== fieldId)
      }
    }));
  };

  return (
    <div data-component="GenerateCss" className=" flex flex-col">
      <div className="flex items-center gap-4 p-4 pb-0">
        <SelectMenu
          options={LIBRARY_OPTIONS}
          value={selectedLibrary?.value || 'vanilla'}
          onChange={handleLibraryChange}
          className="min-w-[220px]"
        />
        <Button onClick={() => setShowModal(true)} className="flex p-3 items-center gap-2 !border-black/30 !bg-blue-600 dark:bg-blue-400 !text-white">
          <Rocket className="w-4 h-4" />
          <span className="hidden">Generate Theme</span>
        </Button>
      </div>

      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(fields || DEFAULT_FIELDS).map(([section, sectionFields]) => (
            <FieldSection
              key={section}
              title={section.charAt(0).toUpperCase() + section.slice(1)}
              fields={sectionFields}
              values={values}
              onValueChange={handleValueChange}
              onLabelChange={(id, newLabel) => handleLabelChange(section, id, newLabel)}
              onAddField={(newField) => handleAddField(section, newField)}
              onRemoveField={(fieldId) => handleRemoveField(section, fieldId)}
            />
          ))}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Generated Theme">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SelectMenu
              options={LIBRARY_OPTIONS}
              value={selectedLibrary?.value || 'vanilla'}
              onChange={handleLibraryChange}
              className="min-w-[220px]"
            />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={minified}
                  onChange={(e) => setMinified(e.target.checked)}
                />
                <span>Minified</span>
              </label>
              <Button onClick={() => {
                navigator.clipboard.writeText(generateTheme(values, fields, selectedLibrary?.value || LIBRARY_OPTIONS[0].value, minified));
              }}>
                <Copy className="size-4 text-gray-50 dark:text-gray-black0 dark:text-gray-200" />
              </Button>
            </div>
          </div>

          <CodeMirror
            value={generateTheme(values, fields, selectedLibrary?.value || LIBRARY_OPTIONS[0].value, minified)}
            height="400px"
            extensions={[selectedLibrary?.value === "vanilla" ? css() : javascript()]}
            editable={false}
          />
        </div>
      </Modal>
    </div>
  );
};

export default GenerateCss;