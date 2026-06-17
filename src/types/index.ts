export type Role = 'director' | 'writer' | 'camera' | 'editor';

export type MaterialStatus = 'not_shot' | 'uploaded' | 'reshoot' | 'ready';

export type ReviewStatus = 'pending' | 'pass' | 'reshoot' | 'revoice' | 'notes';

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
  materialStatus: MaterialStatus;
  reviewStatus: ReviewStatus;
  reviewNotes: string;
  reviewedAt?: string;
  reviewerId?: string;
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
  operatorRole: Role;
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

export const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string; dot: string }> = {
  director: { label: '编导', color: 'text-purple-400', bg: 'bg-purple-500/20', dot: 'bg-purple-400' },
  writer: { label: '文案', color: 'text-blue-400', bg: 'bg-blue-500/20', dot: 'bg-blue-400' },
  camera: { label: '拍摄', color: 'text-red-400', bg: 'bg-red-500/20', dot: 'bg-red-400' },
  editor: { label: '剪辑', color: 'text-emerald-400', bg: 'bg-emerald-500/20', dot: 'bg-emerald-400' },
};

export const MATERIAL_STATUS_CONFIG: Record<MaterialStatus, { label: string; color: string; bg: string; dot: string }> = {
  not_shot: { label: '未拍摄', color: 'text-slate-400', bg: 'bg-slate-500/20', dot: 'bg-slate-400' },
  uploaded: { label: '已上传', color: 'text-blue-400', bg: 'bg-blue-500/20', dot: 'bg-blue-400' },
  reshoot: { label: '待补拍', color: 'text-amber-400', bg: 'bg-amber-500/20', dot: 'bg-amber-400' },
  ready: { label: '已齐备', color: 'text-emerald-400', bg: 'bg-emerald-500/20', dot: 'bg-emerald-400' },
};

export const REVIEW_STATUS_CONFIG: Record<ReviewStatus, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: '待验收', color: 'text-slate-400', bg: 'bg-slate-500/20', dot: 'bg-slate-400' },
  pass: { label: '通过', color: 'text-emerald-400', bg: 'bg-emerald-500/20', dot: 'bg-emerald-400' },
  reshoot: { label: '需补镜', color: 'text-red-400', bg: 'bg-red-500/20', dot: 'bg-red-400' },
  revoice: { label: '需补音', color: 'text-purple-400', bg: 'bg-purple-500/20', dot: 'bg-purple-400' },
  notes: { label: '有备注', color: 'text-amber-400', bg: 'bg-amber-500/20', dot: 'bg-amber-400' },
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

export const FIELD_LABELS: Record<string, string> = {
  visualDescription: '画面描述',
  dialogue: '台词',
  duration: '时长',
  musicSuggestion: '配乐建议',
  shootingNotes: '拍摄备注',
  materialStatus: '素材状态',
  materialReady: '素材就绪',
  reviewStatus: '验收状态',
  reviewNotes: '验收备注',
};
