import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, Storyboard, Comment, Material, VersionRecord, Member, NarrativeTemplate, LibraryScript, ReviewStatus, DeliverySignOff, DeliveryStatus, Role } from '@/types';
import { GRADIENTS } from '@/types';
import {
  MOCK_PROJECTS, MOCK_STORYBOARDS, MOCK_COMMENTS, MOCK_MATERIALS,
  MOCK_VERSIONS, MOCK_MEMBERS, MOCK_TEMPLATES, MOCK_LIBRARY,
} from '@/data/mockData';

interface ProjectStore {
  projects: Project[];
  storyboards: Storyboard[];
  comments: Comment[];
  materials: Material[];
  versions: VersionRecord[];
  members: Member[];
  templates: NarrativeTemplate[];
  library: LibraryScript[];
  currentUserId: string;

  addProject: (name: string, type: string, templateId?: string, memberIds?: string[]) => Project;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  addStoryboard: (projectId: string, afterOrder?: number) => Storyboard;
  updateStoryboard: (id: string, data: Partial<Storyboard>, operatorId?: string) => void;
  deleteStoryboard: (id: string) => void;
  reorderStoryboards: (projectId: string, orderedIds: string[]) => void;
  getProjectStoryboards: (projectId: string) => Storyboard[];

  addComment: (storyboardId: string, content: string, mentionIds: string[]) => void;
  getStoryboardComments: (storyboardId: string) => Comment[];
  getStoryboardCommentsByRole: (storyboardId: string) => Record<string, Comment[]>;

  addMaterial: (storyboardId: string, fileName: string, fileType: 'video' | 'image' | 'audio') => void;
  deleteMaterial: (id: string) => void;
  getStoryboardMaterials: (storyboardId: string) => Material[];

  getStoryboardVersions: (storyboardId: string) => VersionRecord[];

  addToLibrary: (projectId: string, category: string) => void;
  removeFromLibrary: (projectId: string) => void;

  getProjectMembers: (projectId: string) => Member[];
  getMemberById: (id: string) => Member | undefined;
  getCurrentUser: () => Member;
 updateStoryboardReview: (id: string, status: ReviewStatus, notes?: string) => void;

  deliverySignOffs: DeliverySignOff[];
  addDeliverySignOff(projectId: string, status: DeliveryStatus, signerName: string, signerRole: Role, notes: string, rejectedStoryboardIds: string[]): void;
  getProjectDeliverySignOffs(projectId: string): DeliverySignOff[];
  getLatestDeliveryStatus(projectId: string): DeliveryStatus;
}

let idCounter = 100;
const genId = () => `id_${Date.now()}_${++idCounter}`;

const persistOptions = {
  name: 'scriptcraft-storage',
  onRehydrate: (state: unknown) => {
    if (!state) return;
    const s = state as ProjectStore;
    s.storyboards = s.storyboards?.map(sb => ({
      ...sb,
      materialStatus: sb.materialStatus || 'not_shot',
      materialReady: sb.materialReady ?? false,
      reviewStatus: sb.reviewStatus || 'pending',
      reviewNotes: sb.reviewNotes || '',
      reviewedAt: sb.reviewedAt ?? undefined,
      reviewerId: sb.reviewerId ?? undefined,
    })) || [];
    s.projects = s.projects?.map(p => ({
      ...p,
      members: p.members || ['m1'],
    })) || [];
    s.comments = s.comments?.map(c => ({
      ...c,
      authorRole: c.authorRole || 'director',
      mentionIds: c.mentionIds || [],
    })) || [];
    s.versions = s.versions?.map(v => ({
      ...v,
      operatorRole: v.operatorRole || 'director',
    })) || [];
    s.deliverySignOffs = s.deliverySignOffs || [];
  },
  partialize: (state: ProjectStore) => ({
    projects: state.projects,
    storyboards: state.storyboards,
    comments: state.comments,
    materials: state.materials,
    versions: state.versions,
    members: state.members,
    templates: state.templates,
    library: state.library,
    currentUserId: state.currentUserId,
    deliverySignOffs: state.deliverySignOffs,
  }),
};

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: MOCK_PROJECTS,
      storyboards: MOCK_STORYBOARDS,
      comments: MOCK_COMMENTS,
      materials: MOCK_MATERIALS,
      versions: MOCK_VERSIONS,
      members: MOCK_MEMBERS,
      templates: MOCK_TEMPLATES,
      library: MOCK_LIBRARY,
      deliverySignOffs: [],
      currentUserId: 'm4',

      addProject: (name, type, templateId, memberIds) => {
        const project: Project = {
          id: genId(),
          name,
          type,
          templateId,
          coverGradient: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          members: memberIds || ['m1'],
        };
        const storyboards: Storyboard[] = [];
        if (templateId) {
          const template = get().templates.find(t => t.id === templateId);
          if (template) {
            template.storyboardStructure.forEach((s, i) => {
              storyboards.push({
                id: genId(),
                projectId: project.id,
                order: i + 1,
                visualDescription: s.visualDescription || '',
                dialogue: s.dialogue || '',
                duration: s.duration || 5,
                musicSuggestion: s.musicSuggestion || '',
                shootingNotes: '',
                materialReady: false,
                materialStatus: 'not_shot',
                reviewStatus: 'pending',
                reviewNotes: '',
              });
            });
          }
        }
        if (storyboards.length === 0) {
          storyboards.push({
            id: genId(),
            projectId: project.id,
            order: 1,
            visualDescription: '',
            dialogue: '',
            duration: 5,
            musicSuggestion: '',
            shootingNotes: '',
            materialReady: false,
            materialStatus: 'not_shot',
            reviewStatus: 'pending',
            reviewNotes: '',
          });
        }
        set(state => ({
          projects: [...state.projects, project],
          storyboards: [...state.storyboards, ...storyboards],
        }));
        return project;
      },

      updateProject: (id, data) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      deleteProject: (id) => {
        set(state => ({
          projects: state.projects.filter(p => p.id !== id),
          storyboards: state.storyboards.filter(s => s.projectId !== id),
          comments: state.comments.filter(c => {
            const sb = state.storyboards.find(s => s.id === c.storyboardId);
            return sb && sb.projectId !== id;
          }),
          materials: state.materials.filter(m => {
            const sb = state.storyboards.find(s => s.id === m.storyboardId);
            return sb && sb.projectId !== id;
          }),
        }));
      },

      addStoryboard: (projectId, afterOrder) => {
        const sbs = get().storyboards.filter(s => s.projectId === projectId);
        const maxOrder = sbs.length > 0 ? Math.max(...sbs.map(s => s.order)) : 0;
        const newOrder = afterOrder != null ? afterOrder + 1 : maxOrder + 1;

        if (afterOrder != null) {
          set(state => ({
            storyboards: state.storyboards.map(s =>
              s.projectId === projectId && s.order > afterOrder
                ? { ...s, order: s.order + 1 }
                : s
            ),
          }));
        }

        const sb: Storyboard = {
          id: genId(),
          projectId,
          order: newOrder,
          visualDescription: '',
          dialogue: '',
          duration: 5,
          musicSuggestion: '',
          shootingNotes: '',
          materialReady: false,
          materialStatus: 'not_shot',
          reviewStatus: 'pending',
          reviewNotes: '',
        };
        set(state => ({ storyboards: [...state.storyboards, sb] }));
        return sb;
      },

      updateStoryboard: (id, data, operatorId) => {
        const old = get().storyboards.find(s => s.id === id);
        if (!old) return;

        const versionRecords: VersionRecord[] = [];
        const currentUser = get().getCurrentUser();

        (Object.keys(data) as (keyof Storyboard)[]).forEach(key => {
          if (data[key] !== undefined && data[key] !== old[key]) {
            versionRecords.push({
              id: genId(),
              storyboardId: id,
              field: key,
              oldValue: String(old[key]),
              newValue: String(data[key]),
              operatorId: operatorId || get().currentUserId,
              operatorName: currentUser.name,
              operatorRole: currentUser.role,
              timestamp: new Date().toISOString(),
            });
          }
        });

        const syncData: Partial<Storyboard> & Record<string, unknown> = { ...data };
        if (data.materialStatus !== undefined) {
          syncData.materialReady = data.materialStatus === 'ready';
        }
        if (data.materialReady !== undefined) {
          if (data.materialReady === true) {
            syncData.materialStatus = 'ready';
          } else if (old.materialStatus === 'ready') {
            syncData.materialStatus = 'uploaded';
          }
        }

        set(state => ({
          storyboards: state.storyboards.map(s =>
            s.id === id ? { ...s, ...syncData } : s
          ),
          versions: [...state.versions, ...versionRecords],
          projects: state.projects.map(p =>
            p.id === old.projectId ? { ...p, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      updateStoryboardReview: (id, status, notes = '') => {
        const old = get().storyboards.find(s => s.id === id);
        if (!old) return;

        const now = new Date().toISOString();
        const currentUser = get().getCurrentUser();

        const versionRecords: VersionRecord[] = [];
        if (old.reviewStatus !== status) {
          versionRecords.push({
            id: genId(),
            storyboardId: id,
            field: 'reviewStatus',
            oldValue: String(old.reviewStatus),
            newValue: String(status),
            operatorId: get().currentUserId,
            operatorName: currentUser.name,
            operatorRole: 'editor',
            timestamp: now,
          });
        }
        if (old.reviewNotes !== notes) {
          versionRecords.push({
            id: genId(),
            storyboardId: id,
            field: 'reviewNotes',
            oldValue: String(old.reviewNotes),
            newValue: String(notes),
            operatorId: get().currentUserId,
            operatorName: currentUser.name,
            operatorRole: 'editor',
            timestamp: now,
          });
        }

        set(state => ({
          storyboards: state.storyboards.map(s =>
            s.id === id
              ? {
                  ...s,
                  reviewStatus: status,
                  reviewNotes: notes,
                  reviewedAt: now,
                  reviewerId: get().currentUserId,
                }
              : s
          ),
          versions: [...state.versions, ...versionRecords],
          projects: state.projects.map(p =>
            p.id === old.projectId ? { ...p, updatedAt: now } : p
          ),
        }));
      },

      deleteStoryboard: (id) => {
        const sb = get().storyboards.find(s => s.id === id);
        if (!sb) return;
        set(state => ({
          storyboards: state.storyboards
            .filter(s => s.id !== id)
            .map(s => s.projectId === sb.projectId && s.order > sb.order
              ? { ...s, order: s.order - 1 }
              : s
            ),
          comments: state.comments.filter(c => c.storyboardId !== id),
          materials: state.materials.filter(m => m.storyboardId !== id),
        }));
      },

      reorderStoryboards: (projectId, orderedIds) => {
        set(state => ({
          storyboards: state.storyboards.map(s => {
            if (s.projectId !== projectId) return s;
            const newOrder = orderedIds.indexOf(s.id);
            return newOrder >= 0 ? { ...s, order: newOrder + 1 } : s;
          }),
        }));
      },

      getProjectStoryboards: (projectId) => {
        return get().storyboards
          .filter(s => s.projectId === projectId)
          .sort((a, b) => a.order - b.order);
      },

      addComment: (storyboardId, content, mentionIds) => {
        const user = get().getCurrentUser();
        const comment: Comment = {
          id: genId(),
          storyboardId,
          authorId: user.id,
          authorName: user.name,
          authorRole: user.role,
          content,
          mentionIds,
          createdAt: new Date().toISOString(),
        };
        set(state => ({ comments: [...state.comments, comment] }));
      },

      getStoryboardComments: (storyboardId) => {
        return get().comments
          .filter(c => c.storyboardId === storyboardId)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      },

      getStoryboardCommentsByRole: (storyboardId) => {
        const comments = get().comments
          .filter(c => c.storyboardId === storyboardId)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const grouped: Record<string, Comment[]> = {};
        comments.forEach(c => {
          if (!grouped[c.authorRole]) grouped[c.authorRole] = [];
          grouped[c.authorRole].push(c);
        });
        return grouped;
      },

      addMaterial: (storyboardId, fileName, fileType) => {
        const user = get().getCurrentUser();
        const material: Material = {
          id: genId(),
          storyboardId,
          fileName,
          fileUrl: '#',
          fileType,
          uploadedAt: new Date().toISOString(),
          uploadedBy: user.id,
        };
        const sb = get().storyboards.find(s => s.id === storyboardId);
        const statusUpdate = sb?.materialStatus === 'not_shot' ? { materialStatus: 'uploaded' as const, materialReady: false } : {};
        set(state => ({
          materials: [...state.materials, material],
          storyboards: state.storyboards.map(s =>
            s.id === storyboardId ? { ...s, ...statusUpdate } : s
          ),
        }));
      },

      deleteMaterial: (id) => {
        const material = get().materials.find(m => m.id === id);
        if (!material) return;
        const storyboardId = material.storyboardId;
        set(state => {
          const newMaterials = state.materials.filter(m => m.id !== id);
          const remainingMaterials = newMaterials.filter(m => m.storyboardId === storyboardId);
          let newStoryboards = state.storyboards;
          if (remainingMaterials.length === 0) {
            newStoryboards = state.storyboards.map(s =>
              s.id === storyboardId
                ? { ...s, materialStatus: 'not_shot', materialReady: false }
                : s
            );
          }
          return {
            materials: newMaterials,
            storyboards: newStoryboards,
          };
        });
      },

      getStoryboardMaterials: (storyboardId) => {
        return get().materials.filter(m => m.storyboardId === storyboardId);
      },

      getStoryboardVersions: (storyboardId) => {
        return get().versions
          .filter(v => v.storyboardId === storyboardId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      },

      addToLibrary: (projectId, category) => {
        const existing = get().library.find(l => l.projectId === projectId);
        if (existing) return;
        const entry: LibraryScript = {
          id: genId(),
          projectId,
          category,
          archivedAt: new Date().toISOString(),
        };
        set(state => ({ library: [...state.library, entry] }));
      },

      removeFromLibrary: (projectId) => {
        set(state => ({ library: state.library.filter(l => l.projectId !== projectId) }));
      },

      getProjectMembers: (projectId) => {
        const project = get().projects.find(p => p.id === projectId);
        if (!project) return [];
        return project.members.map(mId => get().members.find(m => m.id === mId)).filter(Boolean) as Member[];
      },

      getMemberById: (id) => {
        return get().members.find(m => m.id === id);
      },

      getCurrentUser: () => {
        const id = get().currentUserId;
        return get().members.find(m => m.id === id) || MOCK_MEMBERS[0];
      },

      addDeliverySignOff: (projectId, status, signerName, signerRole, notes, rejectedStoryboardIds) => {
        const signOff: DeliverySignOff = {
          id: genId(),
          projectId,
          status,
          signerName,
          signerRole,
          notes,
          rejectedStoryboardIds,
          createdAt: new Date().toISOString(),
        };
        set(state => ({ deliverySignOffs: [...state.deliverySignOffs, signOff] }));
        if (status === 'rejected') {
          const ids = rejectedStoryboardIds.length > 0
            ? rejectedStoryboardIds
            : get().storyboards.filter(s => s.projectId === projectId).map(s => s.id);
          ids.forEach(id => {
            get().updateStoryboardReview(id, 'reshoot', notes);
          });
        }
      },

      getProjectDeliverySignOffs: (projectId) => {
        return get().deliverySignOffs
          .filter(s => s.projectId === projectId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getLatestDeliveryStatus: (projectId) => {
        const signOffs = get().deliverySignOffs
          .filter(s => s.projectId === projectId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return signOffs.length > 0 ? signOffs[0].status : 'pending';
      },
    }),
    persistOptions satisfies Record<string, unknown>
  )
);
