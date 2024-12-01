import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SketchPicker } from 'react-color';
import { Trash2, Plus, Copy, Columns, Type, MousePointer } from 'lucide-react';
import Button from '../partials/Button';
import Input from '../partials/Input';
import Textarea from '../partials/Textarea';

// Component Types and their default props
const COMPONENT_TYPES = {
  TEXT: 'text',
  HEADLINE: 'headline',
  BUTTON: 'button',
  TWO_COLUMNS: 'twoColumns'
};

const DEFAULT_PROPS = {
  [COMPONENT_TYPES.TEXT]: {
    type: COMPONENT_TYPES.TEXT,
    text: 'Enter your text here',
    color: '#000000'
  },
  [COMPONENT_TYPES.HEADLINE]: {
    type: COMPONENT_TYPES.HEADLINE,
    text: 'Enter headline',
    level: 'h2',
    color: '#000000'
  },
  [COMPONENT_TYPES.BUTTON]: {
    type: COMPONENT_TYPES.BUTTON,
    text: 'Click me',
    backgroundColor: '#007bff',
    color: '#ffffff',
    link: '#'
  },
  [COMPONENT_TYPES.TWO_COLUMNS]: {
    type: COMPONENT_TYPES.TWO_COLUMNS,
    backgroundColor1: '#ffffff',
    backgroundColor2: '#ffffff',
    components1: [],
    components2: []
  }
};

// Sortable Component Wrapper
const SortableComponent = ({ id, data, onUpdate, onDelete, parentId = null }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const handleUpdate = (newProps) => {
    onUpdate(id, { ...data, ...newProps }, parentId);
  };

  const renderComponent = () => {
    switch (data.type) {
      case COMPONENT_TYPES.TEXT:
        return (
          <TextComponent
            data={data}
            onChange={handleUpdate}
            onDelete={() => onDelete(id, parentId)}
          />
        );
      case COMPONENT_TYPES.HEADLINE:
        return (
          <HeadlineComponent
            data={data}
            onChange={handleUpdate}
            onDelete={() => onDelete(id, parentId)}
          />
        );
      case COMPONENT_TYPES.BUTTON:
        return (
          <ButtonComponent
            data={data}
            onChange={handleUpdate}
            onDelete={() => onDelete(id, parentId)}
          />
        );
      case COMPONENT_TYPES.TWO_COLUMNS:
        return (
          <TwoColumnsComponent
            data={data}
            onChange={handleUpdate}
            onDelete={() => onDelete(id, parentId)}
            parentId={id}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {renderComponent()}
    </div>
  );
};

// Individual Components
const TextComponent = ({ data, onChange, onDelete }) => (
  <div className="border p-4 mb-4 bg-white dark:bg-black rounded-lg shadow">
    <div className="flex justify-between mb-2">
      <span className="text-sm font-semibold">Text Block</span>
      <Button onClick={onDelete} className="text-red-500">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
    <Textarea
      value={data.text}
      onChange={(e) => onChange({ text: e.target.value })}
      className="w-full p-2 border rounded mb-2"
    />
    <div className="flex items-center gap-2">
      <span className="text-sm">Color:</span>
      <Input
        type="color"
        value={data.color}
        onChange={(e) => onChange({ color: e.target.value })}
        className="w-8 h-8"
      />
    </div>
  </div>
);

const HeadlineComponent = ({ data, onChange, onDelete }) => (
  <div className="border p-4 mb-4 bg-white dark:bg-black rounded-lg shadow">
    <div className="flex justify-between mb-2">
      <span className="text-sm font-semibold">Headline</span>
      <Button onClick={onDelete} className="text-red-500">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
    <Input
      value={data.text}
      onChange={(e) => onChange({ text: e.target.value })}
      className="w-full p-2 border rounded mb-2"
    />
    <div className="flex items-center gap-4">
      <select
        value={data.level}
        onChange={(e) => onChange({ level: e.target.value })}
        className="border rounded p-1"
      >
        {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(level => (
          <option key={level} value={level}>
            {level.toUpperCase()}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-2">
        <span className="text-sm">Color:</span>
        <Input
          type="color"
          value={data.color}
          onChange={(e) => onChange({ color: e.target.value })}
          className="w-8 h-8"
        />
      </div>
    </div>
  </div>
);

const ButtonComponent = ({ data, onChange, onDelete }) => (
  <div className="border p-4 mb-4 bg-white dark:bg-black dark:bg-black rounded-lg shadow">
    <div className="flex justify-between mb-2">
      <span className="text-sm font-semibold">Button</span>
      <Button onClick={onDelete} className="text-red-500">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
    <Input
      value={data.text}
      onChange={(e) => onChange({ text: e.target.value })}
      placeholder="Button text"
      className="w-full p-2 border rounded mb-2"
    />
    <Input
      value={data.link}
      onChange={(e) => onChange({ link: e.target.value })}
      placeholder="Button link"
      className="w-full p-2 border rounded mb-2"
    />
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm">Text:</span>
        <Input
          type="color"
          value={data.color}
          onChange={(e) => onChange({ color: e.target.value })}
          className="w-8 h-8"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm">Background:</span>
        <Input
          type="color"
          value={data.backgroundColor}
          onChange={(e) => onChange({ backgroundColor: e.target.value })}
          className="w-8 h-8"
        />
      </div>
    </div>
  </div>
);

const TwoColumnsComponent = ({ data, onChange, onDelete, parentId }) => (
  <div className="border p-4 mb-4 bg-white dark:bg-black rounded-lg shadow">
    <div className="flex justify-between mb-2">
      <span className="text-sm font-semibold">Two Columns</span>
      <Button onClick={onDelete} className="text-red-500">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
    <div className="grid grid-cols-2 gap-4">
      {[1, 2].map(colNum => (
        <div key={colNum} className="border p-2 rounded">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">Background:</span>
            <Input
              type="color"
              value={data[`backgroundColor${colNum}`]}
              onChange={(e) => onChange({ [`backgroundColor${colNum}`]: e.target.value })}
              className="w-8 h-8"
            />
          </div>
          <div className="min-h-[100px] border-dashed border-2 border-gray-300 rounded p-2">
            {/* Nested components would go here */}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Main EmailBuilder Component
const EmailBuilder = () => {
  const [components, setComponents] = useState([]);
  const [globalSettings, setGlobalSettings] = useState({
    maxWidth: '600px',
    backgroundColor: '#f4f4f4'
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setComponents((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addComponent = (type) => {
    const newComponent = {
      id: `${type}-${Date.now()}`,
      ...DEFAULT_PROPS[type]
    };
    setComponents([...components, newComponent]);
  };

  const updateComponent = (id, newProps, parentId = null) => {
    if (!parentId) {
      setComponents(components.map(comp =>
        comp.id === id ? { ...comp, ...newProps } : comp
      ));
    } else {
      // Handle nested components update
      setComponents(components.map(comp => {
        if (comp.id === parentId) {
          return {
            ...comp,
            components1: comp.components1.map(c =>
              c.id === id ? { ...c, ...newProps } : c
            ),
            components2: comp.components2.map(c =>
              c.id === id ? { ...c, ...newProps } : c
            )
          };
        }
        return comp;
      }));
    }
  };

  const deleteComponent = (id, parentId = null) => {
    if (!parentId) {
      setComponents(components.filter(comp => comp.id !== id));
    } else {
      // Handle nested component deletion
      setComponents(components.map(comp => {
        if (comp.id === parentId) {
          return {
            ...comp,
            components1: comp.components1.filter(c => c.id !== id),
            components2: comp.components2.filter(c => c.id !== id)
          };
        }
        return comp;
      }));
    }
  };

  const generateEmailHtml = () => {
    // Generate email-safe HTML output
    let html = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${globalSettings.backgroundColor};">
        <tr>
          <td align="center">
            <table width="${globalSettings.maxWidth}" cellpadding="0" cellspacing="0">
    `;

    components.forEach(component => {
      switch (component.type) {
        case COMPONENT_TYPES.TEXT:
          html += `
            <tr>
              <td style="color: ${component.color}; padding: 10px;">
                ${component.text}
              </td>
            </tr>
          `;
          break;
        case COMPONENT_TYPES.HEADLINE:
          html += `
            <tr>
              <td style="color: ${component.color}; padding: 10px;">
                <${component.level}>${component.text}</${component.level}>
              </td>
            </tr>
          `;
          break;
        case COMPONENT_TYPES.BUTTON:
          html += `
            <tr>
              <td align="center" style="padding: 10px;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color: ${component.backgroundColor}; border-radius: 4px; padding: 12px 24px;">
                      <a href="${component.link}" style="color: ${component.color}; text-decoration: none;">
                        ${component.text}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          `;
          break;
        case COMPONENT_TYPES.TWO_COLUMNS:
          html += `
            <tr>
              <td>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50%" style="background-color: ${component.backgroundColor1}; padding: 10px;">
                      <!-- Column 1 content -->
                    </td>
                    <td width="50%" style="background-color: ${component.backgroundColor2}; padding: 10px;">
                      <!-- Column 2 content -->
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          `;
          break;
      }
    });

    html += `
            </table>
          </td>
        </tr>
      </table>
    `;

    return html;
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 border-r-2 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-900">
        <h2 className="text-lg font-semibold mb-4">Components</h2>
        <div className="space-y-2">
          <Button
            onClick={() => addComponent(COMPONENT_TYPES.TEXT)}
            className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-200"
          >
            <Type className="h-4 w-4" />
            <span>Add Text</span>
          </Button>
          <Button
            onClick={() => addComponent(COMPONENT_TYPES.HEADLINE)}
            className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-200"
          >
            <Type className="h-4 w-4" />
            <span>Add Headline</span>
          </Button>
          <Button
            onClick={() => addComponent(COMPONENT_TYPES.BUTTON)}
            className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-200"
          >
            <MousePointer className="h-4 w-4" />
            <span>Add Button</span>
          </Button>
          <Button
            onClick={() => addComponent(COMPONENT_TYPES.TWO_COLUMNS)}
            className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-200"
          >
            <Columns className="h-4 w-4" />
            <span>Add Two Columns</span>
          </Button>
        </div>

        {/* Global Settings */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Global Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Max Width</label>
              <Input
                type="text"
                value={globalSettings.maxWidth}
                onChange={(e) => setGlobalSettings({
                  ...globalSettings,
                  maxWidth: e.target.value
                })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Background Color</label>
              <Input
                type="color"
                value={globalSettings.backgroundColor}
                onChange={(e) => setGlobalSettings({
                  ...globalSettings,
                  backgroundColor: e.target.value
                })}
                className="w-full h-8"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Preview Area */}
        <div className="flex-1 p-8 bg-gray-100 dark:bg-gray-900 overflow-y-auto">
          <div
            className="mx-auto"
            style={{
              maxWidth: globalSettings.maxWidth,
              backgroundColor: globalSettings.backgroundColor,
              padding: '20px'
            }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={components.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {components.map((component) => (
                  <SortableComponent
                    key={component.id}
                    id={component.id}
                    data={component}
                    onUpdate={updateComponent}
                    onDelete={deleteComponent}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* HTML Output */}
        <div className="h-64 border-t-2 dark:border-gray-800">
          <div className="flex justify-between items-center px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b-2 dark:border-gray-800">
            <span className="font-semibold">Generated HTML</span>
            <Button
              onClick={() => navigator.clipboard.writeText(generateEmailHtml())}
              className=" bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Copy className='size-4' />
            </Button>
          </div>
          <pre className="p-4 overflow-auto h-[calc(100%-44px)] text-sm">
            {generateEmailHtml()}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default EmailBuilder;