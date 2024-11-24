import { Code2, Network, Activity,CaseSensitive, SquareMousePointer, Zap, Database, Notebook, ChevronsLeftRightEllipsis } from 'lucide-react';
import { EditorView } from '@codemirror/view';



export const MICRO_APPS = [
  {
    name: 'Prettifier',
    description: 'Format and validate JSON data',
    component: 'Prettifier',
    icon: Code2,
    isActive: true
  },
  {
    name: 'Converter',
    description: 'Convert between different data formats like, JSON, XML, CSV, etc.',
    component: 'Converter',
    icon: ChevronsLeftRightEllipsis,
    isActive: true
  },
  {
    name: 'DNS Checker',
    description: 'Check website DNS Settings',
    component: 'DNSChecker',
    icon: Network,
    isActive: true
  },
  {
    name: 'URL Ping',
    description: 'Ping any Website or IP Address',
    component: 'URLPing',
    icon: Zap,
    isActive: true
  },
  {
    name: 'Web Reader',
    description: 'Read the contents of any website without distractions',
    component: 'WebReader',
    icon: Notebook,
    isActive: true
  },
  {
    name: 'Hash Generator',
    description: 'Generate Hash based on an Input String',
    component: 'HashGenerator',
    icon: Notebook,
    isActive: true
  },
  {
    name: 'Browser',
    description: 'In-App Browser',
    component: 'InAppBrowser',
    icon: SquareMousePointer,
    isActive: true
  },
  {
    name: 'String Converter',
    description: 'Convert String from camelCase to snake_case, ... and vice versa',
    component: 'StringConverter',
    icon: CaseSensitive,
    isActive: true
  },
  {
    name: 'Website Monitor',
    description: 'Track website uptime and performance',
    component: 'WebsiteMonitor',
    icon: Activity,
    isActive: false
  },
  {
    name: 'DB Viewer',
    description: 'View Databases in a tree view or a table view',
    component: 'DBViewer',
    icon: Database,
    isActive: false
  },
  
];

export const UI_CONFIG = {
  sidebar: {
    width: 300,
    isOpen: true
  }
}

export const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: 'transparent',
    height: '100%'
  },
  '.cm-gutters': {
    backgroundColor: '#f8f9fa',
    color: '#6b7280',
    border: 'none',
    borderRight: '1px solid #e5e7eb'
  },
  '.cm-line': {
    padding: '0 4px 0 8px'
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#f3f4f6'
  },
  '.cm-activeLine': {
    backgroundColor: '#f9fafb'
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#3b82f6'
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: '#dbeafe'
  },
  '.cm-content': {
    caretColor: '#3b82f6',
    fontFamily: '"Geist Mono", Menlo, Monaco, "Courier New", monospace'
  }
});