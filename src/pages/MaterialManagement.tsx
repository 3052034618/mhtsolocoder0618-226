import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Film, Image, Music, X, ChevronDown } from 'lucide-react';
import { MATERIAL_STATUS_CONFIG, type MaterialStatus } from '@/types';

type MaterialType = 'video' | 'image' | 'audio';

function getFileType(fileName: string): MaterialType {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
  if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext)) return 'audio';
  return 'video';
}

function MaterialIcon({ type }: { type: MaterialType }) {
  switch (type) {
    case 'video':
      return <Film size={16} className="text-blue-400" />;
    case 'image':
      return <Image size={16} className="text-emerald-400" />;
    case 'audio':
      return <Music size={16} className="text-purple-400" />;
  }
}

const STATUS_OPTIONS: MaterialStatus[] = ['not_shot', 'uploaded', 'reshoot', 'ready'];

export default function MaterialManagement() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const store = useProjectStore();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [openStatusMenu, setOpenStatusMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const project = store.projects.find(p => p.id === projectId);
  const allStoryboards = store.getProjectStoryboards(projectId!);

  const statusCounts = {
    not_shot: allStoryboards.filter(sb => sb.materialStatus === 'not_shot').length,
    uploaded: allStoryboards.filter(sb => sb.materialStatus === 'uploaded').length,
    reshoot: allStoryboards.filter(sb => sb.materialStatus === 'reshoot').length,
    ready: allStoryboards.filter(sb => sb.materialStatus === 'ready').length,
  };

  const storyboards = statusFilter === 'all'
    ? allStoryboards
    : allStoryboards.filter(sb => sb.materialStatus === statusFilter);

  const allMaterials = allStoryboards.flatMap(sb => store.getStoryboardMaterials(sb.id));
  const readyCount = allStoryboards.filter(sb => sb.materialReady).length;
  const totalStoryboards = allStoryboards.length;
  const progressPercent = totalStoryboards > 0 ? Math.round((readyCount / totalStoryboards) * 100) : 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenStatusMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpload = (storyboardId: string) => {
    const fileName = window.prompt('请输入素材文件名（含扩展名，如 clip.mp4）：');
    if (!fileName?.trim()) return;
    const fileType = getFileType(fileName.trim());
    store.addMaterial(storyboardId, fileName.trim(), fileType);
  };

  const handleDelete = (materialId: string) => {
    store.deleteMaterial(materialId);
  };

  const handleStatusChange = (storyboardId: string, newStatus: MaterialStatus) => {
    store.updateStoryboard(storyboardId, { materialStatus: newStatus });
    setOpenStatusMenu(null);
  };

  const filterTabs: { key: string; label: string; status?: MaterialStatus }[] = [
    { key: 'all', label: '全部' },
    { key: 'not_shot', label: '未拍摄', status: 'not_shot' },
    { key: 'uploaded', label: '已上传', status: 'uploaded' },
    { key: 'reshoot', label: '待补拍', status: 'reshoot' },
    { key: 'ready', label: '已齐备', status: 'ready' },
  ];

  if (!project) {
    return (
      <div className="min-h-screen bg-ink-900 flex items-center justify-center text-gray-400">
        <ArrowLeft size={48} className="mb-4 opacity-40" />
        <p>项目未找到</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-900 text-gray-100 flex flex-col">
      <header className="flex items-center gap-4 px-6 py-4 bg-ink-800 border-b border-ink-700 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-ink-700 transition-colors text-gray-400 hover:text-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold truncate">{project.name}</h1>
        <span className="ml-auto text-sm text-gray-400 shrink-0">
          素材齐备 {readyCount}/{totalStoryboards}
        </span>
      </header>

      <div className="px-6 py-3 bg-ink-800/50 border-b border-ink-700 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 shrink-0">整体进度</span>
          <div className="flex-1 h-2 bg-ink-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-amber-400 font-medium shrink-0">{progressPercent}%</span>
        </div>
      </div>

      <div className="px-6 py-3 bg-ink-800/30 border-b border-ink-700 shrink-0">
        <div className="flex items-center gap-2">
          {filterTabs.map(tab => {
            const isActive = statusFilter === tab.key;
            const config = tab.status ? MATERIAL_STATUS_CONFIG[tab.status] : null;
            const count = tab.key === 'all' ? totalStoryboards : (tab.status ? statusCounts[tab.status] : 0);

            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? config
                      ? `${config.bg} ${config.color}`
                      : 'bg-amber-500/20 text-amber-400'
                    : 'bg-ink-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.label}
                <span className={`text-[10px] ${isActive ? 'opacity-80' : 'opacity-50'}`}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6" ref={menuRef}>
        <div className="flex gap-4 h-full" style={{ minWidth: 'max-content' }}>
          {storyboards.map((sb, index) => {
            const materials = store.getStoryboardMaterials(sb.id);
            const statusConfig = MATERIAL_STATUS_CONFIG[sb.materialStatus];
            const isMenuOpen = openStatusMenu === sb.id;

            return (
              <div
                key={sb.id}
                className="w-[280px] bg-ink-800 rounded-xl border border-ink-700 flex flex-col shrink-0 max-h-full"
              >
                <div className="px-4 pt-4 pb-3 border-b border-ink-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-amber-400">#{index + 1}</span>
                    <div className="relative">
                      <button
                        onClick={() => setOpenStatusMenu(isMenuOpen ? null : sb.id)}
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${statusConfig.bg} ${statusConfig.color} hover:opacity-80 transition-opacity`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                        {statusConfig.label}
                        <ChevronDown size={12} className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 z-50 bg-ink-700 border border-ink-600 rounded-lg py-1 shadow-xl min-w-[120px]">
                          {STATUS_OPTIONS.map(status => {
                            const opt = MATERIAL_STATUS_CONFIG[status];
                            const isSelected = status === sb.materialStatus;
                            return (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(sb.id, status)}
                                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-ink-600 transition-colors ${
                                  isSelected ? opt.color : 'text-gray-300'
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${opt.dot} shrink-0`} />
                                {opt.label}
                                {isSelected && <span className="ml-auto text-[10px] opacity-60">✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2">{sb.visualDescription}</p>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                  {materials.length === 0 && (
                    <p className="text-xs text-gray-600 text-center py-4">暂无素材</p>
                  )}
                  {materials.map(mat => (
                    <div
                      key={mat.id}
                      className="flex items-center gap-2 bg-ink-700/50 rounded-lg px-3 py-2 group"
                    >
                      <MaterialIcon type={mat.fileType as MaterialType} />
                      <span className="text-xs text-gray-300 truncate flex-1">{mat.fileName}</span>
                      <button
                        onClick={() => handleDelete(mat.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="px-4 pb-4 pt-2 border-t border-ink-700">
                  <button
                    onClick={() => handleUpload(sb.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500/10 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors"
                  >
                    <Upload size={14} />
                    上传素材
                  </button>
                </div>
              </div>
            );
          })}

          {storyboards.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <ArrowLeft size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">当前筛选条件下无分镜</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
