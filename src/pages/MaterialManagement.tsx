import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Film, Image, Music, X, ChevronDown, Check, Camera, Mic, FileText, LayoutGrid, List, Eye } from 'lucide-react';
import { MATERIAL_STATUS_CONFIG, REVIEW_STATUS_CONFIG, DELIVERY_STATUS_CONFIG, ROLE_CONFIG, type MaterialStatus, type ReviewStatus } from '@/types';

type MaterialType = 'video' | 'image' | 'audio';
type ViewMode = 'list' | 'kanban';

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

const KANBAN_COLUMNS: { key: ReviewStatus; label: string; titleColor: string; titleBg: string }[] = [
  { key: 'pending', label: '待验收', titleColor: 'text-slate-400', titleBg: 'bg-slate-500/20' },
  { key: 'reshoot', label: '需补镜', titleColor: 'text-red-400', titleBg: 'bg-red-500/20' },
  { key: 'revoice', label: '需补音', titleColor: 'text-purple-400', titleBg: 'bg-purple-500/20' },
  { key: 'notes', label: '有备注', titleColor: 'text-amber-400', titleBg: 'bg-amber-500/20' },
  { key: 'pass', label: '已通过', titleColor: 'text-emerald-400', titleBg: 'bg-emerald-500/20' },
];

export default function MaterialManagement() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const store = useProjectStore();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [detailStoryboardId, setDetailStoryboardId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reviewFilter, setReviewFilter] = useState<string>('all');
  const [openStatusMenu, setOpenStatusMenu] = useState<string | null>(null);
  const [openNotesMenu, setOpenNotesMenu] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState<string>('');
  const [detailNotesOpen, setDetailNotesOpen] = useState(false);
  const [detailNotesInput, setDetailNotesInput] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);

  const project = store.projects.find(p => p.id === projectId);
  const allStoryboards = store.getProjectStoryboards(projectId!);

  const statusCounts = {
    not_shot: allStoryboards.filter(sb => sb.materialStatus === 'not_shot').length,
    uploaded: allStoryboards.filter(sb => sb.materialStatus === 'uploaded').length,
    reshoot: allStoryboards.filter(sb => sb.materialStatus === 'reshoot').length,
    ready: allStoryboards.filter(sb => sb.materialStatus === 'ready').length,
  };

  const reviewCounts = {
    pending: allStoryboards.filter(sb => sb.reviewStatus === 'pending').length,
    pass: allStoryboards.filter(sb => sb.reviewStatus === 'pass').length,
    reshoot: allStoryboards.filter(sb => sb.reviewStatus === 'reshoot').length,
    revoice: allStoryboards.filter(sb => sb.reviewStatus === 'revoice').length,
    notes: allStoryboards.filter(sb => sb.reviewStatus === 'notes').length,
  };

  const storyboards = allStoryboards.filter(sb => {
    const matchStatus = statusFilter === 'all' || sb.materialStatus === statusFilter;
    const matchReview = reviewFilter === 'all' || sb.reviewStatus === reviewFilter;
    return matchStatus && matchReview;
  });

  const readyCount = allStoryboards.filter(sb => sb.materialReady).length;
  const totalStoryboards = allStoryboards.length;
  const progressPercent = totalStoryboards > 0 ? Math.round((readyCount / totalStoryboards) * 100) : 0;

  const reviewPassCount = allStoryboards.filter(sb => sb.reviewStatus === 'pass').length;
  const reviewPercent = totalStoryboards > 0 ? Math.round((reviewPassCount / totalStoryboards) * 100) : 0;

  const deliverySignOffs = store.getProjectDeliverySignOffs(projectId!);
  const latestRejection = deliverySignOffs.find(s => s.status === 'rejected');
  const isStoryboardRejectedByDelivery = (sbId: string) => {
    if (!latestRejection) return false;
    return latestRejection.rejectedStoryboardIds.length === 0 || latestRejection.rejectedStoryboardIds.includes(sbId);
  };

  const detailRejection = detailStoryboardId && isStoryboardRejectedByDelivery(detailStoryboardId)
    ? latestRejection
    : null;

  const detailStoryboard = detailStoryboardId
    ? allStoryboards.find(sb => sb.id === detailStoryboardId) ?? null
    : null;
  const detailMaterials = detailStoryboardId ? store.getStoryboardMaterials(detailStoryboardId) : [];
  const detailCommentsByRole = detailStoryboardId ? store.getStoryboardCommentsByRole(detailStoryboardId) : {};

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenStatusMenu(null);
      }
      if (notesRef.current && !notesRef.current.contains(e.target as Node)) {
        setOpenNotesMenu(null);
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

  const handleReview = (storyboardId: string, status: ReviewStatus) => {
    store.updateStoryboardReview(storyboardId, status, '');
  };

  const handleOpenNotes = (storyboardId: string, currentNotes: string) => {
    setOpenNotesMenu(storyboardId);
    setNotesInput(currentNotes);
  };

  const handleSaveNotes = (storyboardId: string) => {
    store.updateStoryboardReview(storyboardId, 'notes', notesInput.trim());
    setOpenNotesMenu(null);
    setNotesInput('');
  };

  const filterTabs: { key: string; label: string; status?: MaterialStatus }[] = [
    { key: 'all', label: '全部' },
    { key: 'not_shot', label: '未拍摄', status: 'not_shot' },
    { key: 'uploaded', label: '已上传', status: 'uploaded' },
    { key: 'reshoot', label: '待补拍', status: 'reshoot' },
    { key: 'ready', label: '已齐备', status: 'ready' },
  ];

  const reviewFilterTabs: { key: string; label: string; status?: ReviewStatus }[] = [
    { key: 'all', label: '全部验收' },
    { key: 'pending', label: '待验收', status: 'pending' },
    { key: 'pass', label: '通过', status: 'pass' },
    { key: 'reshoot', label: '需补镜', status: 'reshoot' },
    { key: 'revoice', label: '需补音', status: 'revoice' },
    { key: 'notes', label: '有备注', status: 'notes' },
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
        <div className="ml-4 flex items-center bg-ink-700 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'list' ? 'bg-ink-600 text-gray-100' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <List size={14} />
            列表视图
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'kanban' ? 'bg-ink-600 text-gray-100' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <LayoutGrid size={14} />
            看板视图
          </button>
        </div>
        <div className="ml-auto flex items-center gap-6 text-sm shrink-0">
          <span className="text-gray-400">
            素材齐备 {readyCount}/{totalStoryboards}
          </span>
          <span className="text-emerald-400">
            验收通过 {reviewPassCount}/{totalStoryboards}
          </span>
        </div>
      </header>

      <div className="px-6 py-3 bg-ink-800/50 border-b border-ink-700 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-gray-400 shrink-0">整体进度</span>
          <div className="flex-1 h-2 bg-ink-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-amber-400 font-medium shrink-0">{progressPercent}%</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 shrink-0">验收进度</span>
          <div className="flex-1 h-2 bg-ink-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${reviewPercent}%` }}
            />
          </div>
          <span className="text-xs text-emerald-400 font-medium shrink-0">{reviewPercent}%</span>
        </div>
      </div>

      <div className="px-6 py-3 bg-ink-800/30 border-b border-ink-700 shrink-0">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 shrink-0">素材状态：</span>
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
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 shrink-0">验收状态：</span>
            {reviewFilterTabs.map(tab => {
              const isActive = reviewFilter === tab.key;
              const config = tab.status ? REVIEW_STATUS_CONFIG[tab.status] : null;
              let count = 0;
              if (tab.key === 'all') {
                count = totalStoryboards;
              } else if (tab.status && tab.status in reviewCounts) {
                count = reviewCounts[tab.status as keyof typeof reviewCounts];
              }

              return (
                <button
                  key={tab.key}
                  onClick={() => setReviewFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isActive
                      ? config
                        ? `${config.bg} ${config.color}`
                        : 'bg-emerald-500/20 text-emerald-400'
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
      </div>

      {viewMode === 'list' && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6" ref={menuRef}>
          <div className="flex gap-4 h-full" style={{ minWidth: 'max-content' }}>
            {storyboards.map((sb, index) => {
              const materials = store.getStoryboardMaterials(sb.id);
              const statusConfig = MATERIAL_STATUS_CONFIG[sb.materialStatus];
              const reviewConfig = REVIEW_STATUS_CONFIG[sb.reviewStatus];
              const isMenuOpen = openStatusMenu === sb.id;
              const isNotesOpen = openNotesMenu === sb.id;
              const reviewer = sb.reviewerId ? store.getMemberById(sb.reviewerId) : null;
              const reviewDate = sb.reviewedAt ? new Date(sb.reviewedAt) : null;
              const reviewTimeStr = reviewDate
                ? `${reviewDate.getMonth() + 1}/${reviewDate.getDate()} ${reviewDate.getHours().toString().padStart(2, '0')}:${reviewDate.getMinutes().toString().padStart(2, '0')}`
                : '';

              return (
                <div
                  key={sb.id}
                  className="w-[280px] bg-ink-800 rounded-xl border border-ink-700 flex flex-col shrink-0 max-h-full"
                >
                  <div className="px-4 pt-4 pb-2 border-b border-ink-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-amber-400">#{index + 1}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${reviewConfig.bg} ${reviewConfig.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${reviewConfig.dot}`} />
                          {reviewConfig.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-1">
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
                          <div className="absolute left-0 top-full mt-1 z-50 bg-ink-700 border border-ink-600 rounded-lg py-1 shadow-xl min-w-[120px]">
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

                  <div className="px-4 pt-3 border-t border-ink-700" ref={isNotesOpen ? notesRef : null}>
                    {sb.reviewNotes && sb.reviewStatus === 'notes' && (
                      <div className="mb-3 p-2 bg-amber-500/10 rounded-lg">
                        <p className="text-[11px] text-amber-400 mb-1">验收备注：</p>
                        <p className="text-xs text-gray-300">{sb.reviewNotes}</p>
                      </div>
                    )}
                    {sb.reviewStatus === 'reshoot' && sb.reviewNotes && (
                      <div className="mb-3 p-2 bg-red-500/10 rounded-lg">
                        <p className="text-[11px] text-red-400 mb-1">补镜原因：</p>
                        <p className="text-xs text-gray-300">{sb.reviewNotes}</p>
                      </div>
                    )}
                    {sb.reviewStatus === 'revoice' && sb.reviewNotes && (
                      <div className="mb-3 p-2 bg-purple-500/10 rounded-lg">
                        <p className="text-[11px] text-purple-400 mb-1">补音原因：</p>
                        <p className="text-xs text-gray-300">{sb.reviewNotes}</p>
                      </div>
                    )}
                    {reviewer && (
                      <div className="mb-3 flex items-center justify-between text-[10px] text-gray-500">
                        <span>验收人：{reviewer.name}</span>
                        <span>{reviewTimeStr}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-4 gap-1.5 mb-3">
                      <button
                        onClick={() => handleReview(sb.id, 'pass')}
                        className="flex flex-col items-center gap-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        <Check size={14} />
                        <span className="text-[10px]">通过</span>
                      </button>
                      <button
                        onClick={() => handleReview(sb.id, 'reshoot')}
                        className="flex flex-col items-center gap-1 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        <Camera size={14} />
                        <span className="text-[10px]">需补镜</span>
                      </button>
                      <button
                        onClick={() => handleReview(sb.id, 'revoice')}
                        className="flex flex-col items-center gap-1 py-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
                      >
                        <Mic size={14} />
                        <span className="text-[10px]">需补音</span>
                      </button>
                      <button
                        onClick={() => handleOpenNotes(sb.id, sb.reviewNotes)}
                        className="flex flex-col items-center gap-1 py-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                      >
                        <FileText size={14} />
                        <span className="text-[10px]">备注</span>
                      </button>
                    </div>
                    {isNotesOpen && (
                      <div className="mb-3">
                        <textarea
                          value={notesInput}
                          onChange={(e) => setNotesInput(e.target.value)}
                          placeholder="请输入验收备注..."
                          className="w-full px-3 py-2 bg-ink-700 border border-ink-600 rounded-lg text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleSaveNotes(sb.id)}
                            className="flex-1 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-colors"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => { setOpenNotesMenu(null); setNotesInput(''); }}
                            className="flex-1 py-1.5 rounded-lg bg-ink-700 text-gray-400 text-xs font-medium hover:bg-ink-600 transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => handleUpload(sb.id)}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500/10 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors mb-4"
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
      )}

      {viewMode === 'kanban' && (
        <div className="flex-1 overflow-hidden p-6">
          <div className="flex gap-4 h-full">
            {KANBAN_COLUMNS.map(col => {
              const colStoryboards = allStoryboards.filter(sb => sb.reviewStatus === col.key);
              return (
                <div key={col.key} className="flex-1 flex flex-col min-w-0">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-t-lg ${col.titleBg}`}>
                    <span className={`text-sm font-semibold ${col.titleColor}`}>{col.label}</span>
                    <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${col.titleBg} ${col.titleColor}`}>
                      {colStoryboards.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pt-2 pr-1">
                    {colStoryboards.map(sb => {
                      const statusConfig = MATERIAL_STATUS_CONFIG[sb.materialStatus];
                      const reviewConfig = REVIEW_STATUS_CONFIG[sb.reviewStatus];
                      return (
                        <button
                          key={sb.id}
                          onClick={() => setDetailStoryboardId(sb.id)}
                          className="w-full text-left bg-ink-800 rounded-lg border border-ink-700 p-3 hover:border-ink-600 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-amber-400">#{sb.order}</span>
                            <div className="flex items-center gap-1">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                                {statusConfig.label}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${reviewConfig.bg} ${reviewConfig.color}`}>
                                <Eye size={10} />
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-300 line-clamp-2 mb-2">{sb.visualDescription || '无画面描述'}</p>
                          {sb.reviewNotes && (
                            <p className="text-[11px] text-gray-500 truncate">📝 {sb.reviewNotes}</p>
                          )}
                          {isStoryboardRejectedByDelivery(sb.id) && (
                            <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">退回</span>
                          )}
                        </button>
                      );
                    })}
                    {colStoryboards.length === 0 && (
                      <p className="text-xs text-gray-600 text-center py-8">暂无分镜</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={`fixed top-0 right-0 h-full w-[400px] bg-ink-800 panel-shadow z-30 flex flex-col transition-transform duration-300 ease-out ${
        detailStoryboard ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {detailStoryboard && (
          <>
            <div className="flex items-center justify-between px-4 h-12 border-b border-ink-700 shrink-0">
              <span className="font-semibold text-sm">分镜 #{detailStoryboard.order}</span>
              <button onClick={() => { setDetailStoryboardId(null); setDetailNotesOpen(false); }} className="p-1 rounded hover:bg-ink-700 text-gray-400"><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-3">
                <div>
                  <span className="text-[11px] text-gray-500 block mb-1">画面描述</span>
                  <p className="text-sm text-gray-200 bg-ink-700/50 rounded-lg px-3 py-2">{detailStoryboard.visualDescription || '—'}</p>
                </div>
                <div>
                  <span className="text-[11px] text-gray-500 block mb-1">台词</span>
                  <p className="text-sm text-gray-200 bg-ink-700/50 rounded-lg px-3 py-2">{detailStoryboard.dialogue || '—'}</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <span className="text-[11px] text-gray-500 block mb-1">时长</span>
                    <p className="text-sm text-gray-200 bg-ink-700/50 rounded-lg px-3 py-2">{detailStoryboard.duration}s</p>
                  </div>
                  <div className="flex-1">
                    <span className="text-[11px] text-gray-500 block mb-1">配乐</span>
                    <p className="text-sm text-gray-200 bg-ink-700/50 rounded-lg px-3 py-2">{detailStoryboard.musicSuggestion || '—'}</p>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-gray-500 block mb-1">拍摄备注</span>
                  <p className="text-sm text-gray-200 bg-ink-700/50 rounded-lg px-3 py-2">{detailStoryboard.shootingNotes || '—'}</p>
                </div>
              </div>

              <div className="border-t border-ink-700 pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] text-gray-500">素材状态</span>
                  {(() => {
                    const sc = MATERIAL_STATUS_CONFIG[detailStoryboard.materialStatus];
                    return (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${sc.bg} ${sc.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="space-y-1.5 mb-2">
                  {detailMaterials.length === 0 && (
                    <p className="text-xs text-gray-600 text-center py-2">暂无素材</p>
                  )}
                  {detailMaterials.map(mat => (
                    <div key={mat.id} className="flex items-center gap-2 bg-ink-700/50 rounded-lg px-3 py-1.5 group">
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
                <button
                  onClick={() => handleUpload(detailStoryboard.id)}
                  className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors"
                >
                  <Upload size={12} />
                  上传素材
                </button>
              </div>

              <div className="border-t border-ink-700 pt-3">
                <span className="text-[11px] text-gray-500 block mb-2">验收操作</span>
                {(() => {
                  const rc = REVIEW_STATUS_CONFIG[detailStoryboard.reviewStatus];
                  const reviewer = detailStoryboard.reviewerId ? store.getMemberById(detailStoryboard.reviewerId) : null;
                  const reviewDate = detailStoryboard.reviewedAt ? new Date(detailStoryboard.reviewedAt) : null;
                  const reviewTimeStr = reviewDate
                    ? `${reviewDate.getMonth() + 1}/${reviewDate.getDate()} ${reviewDate.getHours().toString().padStart(2, '0')}:${reviewDate.getMinutes().toString().padStart(2, '0')}`
                    : '';
                  return (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] text-gray-500">当前状态：</span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${rc.bg} ${rc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
                          {rc.label}
                        </span>
                        {reviewer && <span className="text-[10px] text-gray-500 ml-auto">{reviewer.name} {reviewTimeStr}</span>}
                      </div>
                      {detailStoryboard.reviewNotes && (
                        <div className="mb-2 p-2 bg-ink-700/50 rounded-lg">
                          <p className="text-[11px] text-gray-400">验收备注：{detailStoryboard.reviewNotes}</p>
                        </div>
                      )}
                    </>
                  );
                })()}
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  <button
                    onClick={() => handleReview(detailStoryboard.id, 'pass')}
                    className="flex flex-col items-center gap-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    <Check size={14} />
                    <span className="text-[10px]">通过</span>
                  </button>
                  <button
                    onClick={() => handleReview(detailStoryboard.id, 'reshoot')}
                    className="flex flex-col items-center gap-1 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    <Camera size={14} />
                    <span className="text-[10px]">需补镜</span>
                  </button>
                  <button
                    onClick={() => handleReview(detailStoryboard.id, 'revoice')}
                    className="flex flex-col items-center gap-1 py-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
                  >
                    <Mic size={14} />
                    <span className="text-[10px]">需补音</span>
                  </button>
                  <button
                    onClick={() => { setDetailNotesOpen(!detailNotesOpen); setDetailNotesInput(detailStoryboard.reviewNotes); }}
                    className="flex flex-col items-center gap-1 py-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                  >
                    <FileText size={14} />
                    <span className="text-[10px]">备注</span>
                  </button>
                </div>
                {detailNotesOpen && (
                  <div className="mb-2">
                    <textarea
                      value={detailNotesInput}
                      onChange={(e) => setDetailNotesInput(e.target.value)}
                      placeholder="请输入验收备注..."
                      className="w-full px-3 py-2 bg-ink-700 border border-ink-600 rounded-lg text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2 mt-1.5">
                      <button
                        onClick={() => { store.updateStoryboardReview(detailStoryboard.id, 'notes', detailNotesInput.trim()); setDetailNotesOpen(false); }}
                        className="flex-1 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-colors"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setDetailNotesOpen(false)}
                        className="flex-1 py-1.5 rounded-lg bg-ink-700 text-gray-400 text-xs font-medium hover:bg-ink-600 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-ink-700 pt-3">
                <span className="text-[11px] text-gray-500 block mb-2">评论</span>
                {Object.keys(detailCommentsByRole).length === 0 && (
                  <p className="text-xs text-gray-600 text-center py-2">暂无评论</p>
                )}
                {Object.entries(detailCommentsByRole).map(([role, comments]) => {
                  const roleConfig = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG];
                  return (
                    <div key={role} className="mb-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${roleConfig.bg} ${roleConfig.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${roleConfig.dot}`} />
                          {roleConfig.label}
                        </span>
                      </div>
                      {comments.map(c => (
                        <div key={c.id} className="ml-2 mb-1 pl-2 border-l border-ink-700">
                          <span className="text-[10px] text-gray-500">{c.authorName}</span>
                          <p className="text-xs text-gray-300">{c.content}</p>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              {detailRejection && (
                <div className="border-t border-ink-700 pt-3">
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-[11px] text-red-400 font-medium mb-1">⚠ 退回意见</p>
                    <p className="text-xs text-gray-300">{detailRejection.notes}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${DELIVERY_STATUS_CONFIG.rejected.bg} ${DELIVERY_STATUS_CONFIG.rejected.color}`}>
                        {DELIVERY_STATUS_CONFIG.rejected.label}
                      </span>
                      <span className="text-[10px] text-gray-500">{detailRejection.signerName} · {new Date(detailRejection.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
