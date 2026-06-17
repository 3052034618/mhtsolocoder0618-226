import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Copy, Clock, Film, BookOpen, X } from 'lucide-react';
import { useProjectStore } from '@/store/useProjectStore';

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

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}分${s}秒` : `${m}分`;
}

export default function Library() {
  const store = useProjectStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');

  const categories = useMemo(() => {
    const cats = Array.from(new Set(store.library.map(l => l.category)));
    return ['全部', ...cats];
  }, [store.library]);

  const filtered = useMemo(() => {
    return store.library.filter(l => {
      const project = store.projects.find(p => p.id === l.projectId);
      if (!project) return false;
      if (activeCategory !== '全部' && l.category !== activeCategory) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          project.name.toLowerCase().includes(q) ||
          project.type.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [store.library, store.projects, activeCategory, search]);

  const handleCopyAsNew = (projectId: string) => {
    const project = store.projects.find(p => p.id === projectId);
    if (!project) return;
    const storyboards = store.getProjectStoryboards(projectId);
    const newProject = store.addProject(`${project.name} (副本)`, project.type);
    if (storyboards.length > 0) {
      const newStoryboards = store.getProjectStoryboards(newProject.id);
      if (newStoryboards.length > 0) {
        store.updateStoryboard(newStoryboards[0].id, {
          visualDescription: storyboards[0].visualDescription,
          dialogue: storyboards[0].dialogue,
          duration: storyboards[0].duration,
          musicSuggestion: storyboards[0].musicSuggestion,
          shootingNotes: storyboards[0].shootingNotes,
        });
      }
      for (let i = 1; i < storyboards.length; i++) {
        const sb = store.addStoryboard(newProject.id);
        store.updateStoryboard(sb.id, {
          visualDescription: storyboards[i].visualDescription,
          dialogue: storyboards[i].dialogue,
          duration: storyboards[i].duration,
          musicSuggestion: storyboards[i].musicSuggestion,
          shootingNotes: storyboards[i].shootingNotes,
        });
      }
    }
    navigate(`/project/${newProject.id}`);
  };

  return (
    <div className="min-h-screen bg-ink-900 p-6 md:p-8">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <BookOpen size={28} className="text-amber-500" />
          <div>
            <h1 className="font-display text-3xl font-bold text-white">脚本收藏库</h1>
            <p className="text-ink-500 mt-1 text-sm">浏览和管理你的爆款脚本归档</p>
          </div>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索脚本..."
            className="w-full bg-ink-800 text-white border border-ink-700 rounded-lg pl-9 pr-9 py-2.5 focus:outline-none focus:border-amber-500 transition-colors placeholder:text-ink-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </header>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-amber-500 text-ink-900'
                : 'bg-ink-800 text-ink-500 hover:text-white hover:bg-ink-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-ink-500">
          <BookOpen size={48} className="mb-4 opacity-30" />
          <p className="text-lg">暂无收藏脚本</p>
          <p className="text-sm mt-1">将项目归档到收藏库后会在这里显示</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item, index) => {
            const project = store.projects.find(p => p.id === item.projectId);
            if (!project) return null;
            const storyboards = store.getProjectStoryboards(item.projectId);
            const totalDuration = storyboards.reduce((sum, s) => sum + s.duration, 0);

            return (
              <div
                key={item.id}
                className="card-glow bg-ink-800 rounded-xl overflow-hidden transition-all hover:-translate-y-1 animate-slide-in-up"
                style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'backwards' }}
              >
                <div className={`h-24 bg-gradient-to-br ${project.coverGradient} relative`}>
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => store.removeFromLibrary(item.projectId)}
                      className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
                      title="取消收藏"
                    >
                      <Star size={16} className="text-amber-400 fill-amber-400" />
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span className="bg-amber-500/90 text-ink-900 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {item.category}
                    </span>
                    <span className="bg-black/40 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                      {project.type}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-display font-semibold text-white mb-3 truncate">
                    {project.name}
                  </h3>

                  <div className="flex items-center gap-4 mb-4 text-sm text-ink-500">
                    <div className="flex items-center gap-1.5">
                      <Film size={14} />
                      <span>{storyboards.length} 个分镜</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      <span>{formatDuration(totalDuration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-ink-500">
                      收藏于 {formatRelativeTime(item.archivedAt)}
                    </span>
                    <button
                      onClick={() => handleCopyAsNew(item.projectId)}
                      className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Copy size={14} />
                      复制为新项目
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
