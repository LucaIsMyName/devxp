import { Code2, Network, Activity, Zap, Database, Notebook } from 'lucide-react';

export const MICRO_APPS = [
  {
    name: 'Prettifier',
    description: 'Format and validate JSON data',
    component: 'Prettifier',
    icon: Code2,
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
  {
    name: 'Web Reader',
    description: 'Read the contents of any website without distractions',
    component: 'WebReader',
    icon: Notebook,
    isActive: false
  }
];

export const UI_CONFIG = {
  sidebar: {
    width: 300,
    isOpen: true
  }
}