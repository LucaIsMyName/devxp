import { Code2, GitBranch, Activity } from 'lucide-react';

export const MICRO_APPS = [
  {
    name: 'Prettifier',
    description: 'Format and validate JSON data',
    component: 'Prettifier',
    icon: Code2,
    isActive: true
  },
  {
    name: 'URL Ping',
    description: 'Check website availability',
    component: 'URLPing',
    icon: GitBranch,
    isActive: true
  },
  {
    name: 'Website Monitor',
    description: 'Track website uptime and performance',
    component: 'WebsiteMonitor',
    icon: Activity,
    isActive: true
  }
];

export const UI_CONFIG = {
  sidebar: {
    width: 300,
    isOpen: true
  }
}