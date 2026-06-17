export type Role = 'director' | 'writer' | 'camera' | 'editor';

export interface Project {
  id: string;
  name: string;
  type: string;
  templateId?: string;
  coverGradient: string;
  createdAt: string;
  updatedAt: string;
  members: string[];
}

export interface Storyboard {
  id: string;
  projectId: string;
  order: number;
  visualDescription: string;
  dialogue: string;
  duration: number;
  musicSuggestion: string;
  shootingNotes: string;
  materialReady: boolean;
}

export interface Comment {
  id: string;
  storyboardId: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  content: string;
  mentionIds: string[];
  createdAt: string;
}

export interface Material {
  id: string;
  storyboardId: string;
  fileName: string;
  fileUrl: string;
  fileType: 'video' | 'image' | 'audio';
  uploadedAt: string;
  uploadedBy: string;
}

export interface VersionRecord {
  id: string;
  storyboardId: string;
  field: string;
  oldValue: string;
  newValue: string;
  operatorId: string;
  operatorName: string;
  timestamp: string;
}

export interface Member {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  color: string;
}

export interface NarrativeTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  storyboardStructure: Partial<Storyboard>[];
}

export interface LibraryScript {
  id: string;
  projectId: string;
  category: string;
  archivedAt: string;
}

export const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string }> = {
  director: { label: '编导', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  writer: { label: '文案', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  camera: { label: '拍摄', color: 'text-red-400', bg: 'bg-red-500/20' },
  editor: { label: '剪辑', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
};

export const PROJECT_TYPES = ['搞笑', '情感', '知识', '美食', '旅行', '时尚', '科技', '生活'] as const;

export const GRADIENTS = [
  'from-amber-600 to-orange-500',
  'from-purple-600 to-pink-500',
  'from-blue-600 to-cyan-500',
  'from-emerald-600 to-teal-500',
  'from-red-600 to-rose-500',
  'from-indigo-600 to-violet-500',
];
