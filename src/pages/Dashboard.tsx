import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock, Film, Users, X, Sparkles, ChevronRight } from 'lucide-react';
import { useProjectStore } from '@/store/useProjectStore';
import type { Project, NarrativeTemplate } from '@/types';
import { ROLE_CONFIG, GRADIENTS, PROJECT_TYPES } from '@/types';

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  const months = Math.floor(days / 30);
  return `${months}个月前`;
}

export default function Dashboard() {
  const store = useProjectStore();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<string>(PROJECT_TYPES[0]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const project = store.addProject(newName.trim(), newType, selectedTemplateId);
    setShowModal(false);
    setNewName('');
    setNewType(PROJECT_TYPES[0]);
    setSelectedTemplateId(undefined);
    navigate(`/project/${project.id}`);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setNewName('');
    setNewType(PROJECT_TYPES[0]);
    setSelectedTemplateId(undefined);
  };

  return (
    <div className="min-h-screen bg-ink-900 p-6 md:p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">我的项目</h1>
          <p className="text-ink-500 mt-1 text-sm">管理你的视频脚本创作项目</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-ink-900 font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={18} />
          新建项目
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {store.projects.map((project, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            index={index}
            onClick={() => navigate(`/project/${project.id}`)}
            members={store.getProjectMembers(project.id)}
          />
        ))}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={handleCloseModal}
        >
          <div
            className="bg-ink-800 rounded-2xl w-full max-w-lg mx-4 p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-white">新建项目</h2>
              <button
                onClick={handleCloseModal}
                className="text-ink-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm text-ink-500 mb-1.5">项目名称</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="输入项目名称..."
                  className="w-full bg-ink-700 text-white border border-ink-600 rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 transition-colors placeholder:text-ink-500"
                />
              </div>

              <div>
                <label className="block text-sm text-ink-500 mb-1.5">项目类型</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-ink-700 text-white border border-ink-600 rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 transition-colors appearance-none cursor-pointer"
                >
                  {PROJECT_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-ink-500 mb-1.5">选择模板</label>
                <div className="grid grid-cols-2 gap-3">
                  {store.templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() =>
                        setSelectedTemplateId(
                          selectedTemplateId === template.id ? undefined : template.id
                        )
                      }
                      className={`text-left p-3 rounded-lg border transition-all ${
                        selectedTemplateId === template.id
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-ink-600 bg-ink-700 hover:border-ink-500'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{template.icon}</span>
                        <span className="text-sm font-medium text-white">{template.name}</span>
                      </div>
                      <p className="text-xs text-ink-500 line-clamp-2">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-ink-900 font-semibold py-2.5 rounded-lg transition-colors"
              >
                创建项目
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="mt-12">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-amber-500" />
            <h2 className="font-display text-xl font-bold text-white">叙事模板</h2>
          </div>
          <button className="flex items-center gap-1 text-sm text-ink-500 hover:text-amber-500 transition-colors">
            查看全部
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
          {store.templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ProjectCard({
  project,
  index,
  onClick,
  members,
}: {
  project: Project;
  index: number;
  onClick: () => void;
  members: ReturnType<typeof useProjectStore.getState>['members'];
}) {
  return (
    <div
      onClick={onClick}
      className="card-glow bg-ink-800 rounded-xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 animate-slide-in-up"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'backwards' }}
    >
      <div className={`h-28 bg-gradient-to-br ${project.coverGradient} relative`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute bottom-3 left-3">
          <span className="bg-black/40 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
            {project.type}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-display font-semibold text-white mb-3 truncate">{project.name}</h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Users size={14} className="text-ink-500" />
            <div className="flex -space-x-1.5">
              {members.slice(0, 4).map((member) => (
                <div
                  key={member.id}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 border-ink-800"
                  style={{ backgroundColor: member.color }}
                  title={member.name}
                >
                  {member.avatar}
                </div>
              ))}
              {members.length > 4 && (
                <div className="w-6 h-6 rounded-full bg-ink-600 flex items-center justify-center text-[10px] text-ink-500 border-2 border-ink-800">
                  +{members.length - 4}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 text-ink-500 text-xs">
            <Clock size={12} />
            {formatRelativeTime(project.updatedAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ template }: { template: NarrativeTemplate }) {
  return (
    <div className="flex-shrink-0 w-64 bg-ink-800 rounded-xl p-5 border border-ink-700 hover:border-ink-600 transition-all cursor-pointer group">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-ink-700 flex items-center justify-center text-xl group-hover:bg-amber-500/20 transition-colors">
          {template.icon}
        </div>
        <div>
          <h3 className="font-display font-semibold text-white text-sm">{template.name}</h3>
          <span className="text-xs text-ink-500">{template.category}</span>
        </div>
      </div>
      <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed">{template.description}</p>
      <div className="mt-3 flex items-center gap-1 text-xs text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
        <Film size={12} />
        {template.storyboardStructure.length} 个分镜
      </div>
    </div>
  );
}
