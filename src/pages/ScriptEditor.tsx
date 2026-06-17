import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import type { Storyboard, Comment as TComment, Member, MaterialStatus, Role, ReviewStatus } from '@/types';
import { ROLE_CONFIG, MATERIAL_STATUS_CONFIG, REVIEW_STATUS_CONFIG } from '@/types';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Clock, Film, MessageCircle, ChevronRight,
  ArrowLeft, Download, Image, Send, AtSign, Check, X, History, Star, RotateCcw,
} from 'lucide-react';

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const MentionText = ({ text, members }: { text: string; members: Member[] }) => (
  <>
    {text.split(/(@\S+)/g).map((part, i) => {
      const name = part.slice(1);
      const member = members.find(m => m.name === name);
      if (part.startsWith('@') && member) {
        const cfg = ROLE_CONFIG[member.role];
        return <span key={i} className={`${cfg.color} font-medium`}>{part}</span>;
      }
      return <span key={i}>{part}</span>;
    })}
  </>
);

export default function ScriptEditor() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const store = useProjectStore();
  const project = store.projects.find(p => p.id === projectId);
  const storyboards = store.getProjectStoryboards(projectId!);
  const totalDuration = storyboards.reduce((sum, s) => sum + s.duration, 0);
  const members = store.getProjectMembers(projectId!);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [projectName, setProjectName] = useState(project?.name || '');
  const [commentText, setCommentText] = useState('');
  const [mentionIds, setMentionIds] = useState<string[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [commentTab, setCommentTab] = useState<string>('all');
  const [materialStatusOpen, setMaterialStatusOpen] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  const selected = storyboards.find(s => s.id === selectedId) || null;
  const comments = selectedId ? store.getStoryboardComments(selectedId) : [];
  const filteredComments = commentTab === 'all' ? comments : comments.filter(c => c.authorRole === commentTab);
  const selectedMaterials = selectedId ? store.getStoryboardMaterials(selectedId) : [];
  const versions = selectedId ? store.getStoryboardVersions(selectedId) : [];
  const isInLibrary = store.library.some(l => l.projectId === projectId);

  useEffect(() => { if (project) setProjectName(project.name); }, [project?.name]);

  const handleAdd = (afterOrder?: number) => {
    const sb = store.addStoryboard(projectId!, afterOrder);
    setSelectedId(sb.id);
  };

  const handleUpdate = (data: Partial<Storyboard>) => {
    if (selectedId) store.updateStoryboard(selectedId, data);
  };

  const handleDelete = () => {
    if (selectedId) {
      store.deleteStoryboard(selectedId);
      setSelectedId(null);
    }
  };

  const handleComment = () => {
    if (!selectedId || !commentText.trim()) return;
    store.addComment(selectedId, commentText.trim(), mentionIds);
    setCommentText('');
    setMentionIds([]);
    setShowMentions(false);
  };

  const handleCommentInput = (val: string) => {
    setCommentText(val);
    const atIdx = val.lastIndexOf('@');
    if (atIdx >= 0 && (atIdx === 0 || val[atIdx - 1] === ' ')) {
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const pickMention = (name: string, id: string) => {
    const atIdx = commentText.lastIndexOf('@');
    const before = commentText.slice(0, atIdx);
    setCommentText(`${before}@${name} `);
    setMentionIds(prev => [...new Set([...prev, id])]);
    setShowMentions(false);
    commentRef.current?.focus();
  };

  if (!project) return <div className="flex items-center justify-center h-screen text-ink-500">项目不存在</div>;

  return (
    <div className="h-screen flex flex-col bg-ink-900 text-white overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center gap-4 px-5 h-14 border-b border-ink-600 shrink-0">
        <button onClick={() => navigate('/')} className="p-1.5 rounded-lg hover:bg-ink-700 text-ink-400 hover:text-white transition-colors"><ArrowLeft size={18} /></button>
        {editingName ? (
          <input value={projectName} onChange={e => setProjectName(e.target.value)}
            onBlur={() => { store.updateProject(projectId!, { name: projectName }); setEditingName(false); }}
            onKeyDown={e => { if (e.key === 'Enter') { store.updateProject(projectId!, { name: projectName }); setEditingName(false); } }}
            className="bg-ink-700 px-2 py-1 rounded text-sm font-display outline-none border border-amber-500/40" autoFocus />
        ) : (
          <h1 className="font-display font-semibold text-sm cursor-pointer hover:text-amber-400 transition-colors" onClick={() => setEditingName(true)}>{projectName}</h1>
        )}
        <div className="flex items-center gap-1.5 text-xs text-ink-400 ml-2"><Clock size={13} /><span>{fmt(totalDuration)}</span></div>
        <div className="flex-1" />
        <button onClick={() => navigate(`/project/${projectId}/export`)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-700 hover:bg-ink-600 text-xs text-ink-300 transition-colors"><Download size={14} />导出卡片</button>
        <button onClick={() => navigate(`/project/${projectId}/materials`)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-700 hover:bg-ink-600 text-xs text-ink-300 transition-colors"><Image size={14} />素材库</button>
        <button onClick={() => { isInLibrary ? store.removeFromLibrary(projectId!) : store.addToLibrary(projectId!, project.type); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${isInLibrary ? 'bg-amber-500/20 text-amber-400' : 'bg-ink-700 hover:bg-ink-600 text-ink-300'}`}>
          <Star size={14} className={isInLibrary ? 'fill-amber-400' : ''} />{isInLibrary ? '已收藏' : '收藏'}</button>
      </header>

      {/* Rhythm Bar */}
      <div className="px-5 py-2.5 border-b border-ink-600 shrink-0">
        <div className="flex items-center gap-2 h-3">
          <div className="flex-1 flex rounded-full overflow-hidden bg-ink-700 h-full">
            {storyboards.map(sb => (
              <div key={sb.id} className={`h-full ${sb.materialReady ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${(sb.duration / Math.max(totalDuration, 1)) * 100}%` }} />
            ))}
          </div>
          <span className="text-[11px] text-ink-400 font-mono w-12 text-right">{fmt(totalDuration)}</span>
        </div>
      </div>

      {/* Storyboard Timeline */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-5 py-4">
        <div className="flex items-center gap-2 h-full min-w-max">
          {storyboards.map((sb, i) => (
            <div key={sb.id} className="flex items-center gap-2 animate-slide-in-up" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
              <button onClick={() => setSelectedId(sb.id)}
                className={`relative w-52 h-36 rounded-xl p-3 flex flex-col gap-1.5 border transition-all cursor-pointer shrink-0
                  ${sb.id === selectedId ? 'border-amber-500 bg-ink-700 card-glow' : 'border-ink-600 bg-ink-800 hover:border-ink-500 hover:bg-ink-700'}`}>
                <span className="absolute top-2 left-2 text-[10px] font-mono bg-ink-600 text-ink-300 rounded-full w-5 h-5 flex items-center justify-center">{sb.order}</span>
                <span className="absolute top-2 right-2 flex items-center gap-1">
                  <span className="text-[10px] text-ink-400 font-mono flex items-center gap-0.5"><Clock size={10} />{sb.duration}s</span>
                  {sb.reviewStatus !== 'pending' && <span className={`w-2 h-2 rounded-full ${REVIEW_STATUS_CONFIG[sb.reviewStatus].dot}`} />}
                  <span className={`w-2 h-2 rounded-full ${sb.materialReady ? 'bg-emerald-400' : 'bg-ink-500'}`} />
                </span>
                <p className="text-[11px] text-ink-300 mt-5 line-clamp-2 leading-tight">{sb.visualDescription || '—'}</p>
                <p className="text-[11px] text-amber-400/70 line-clamp-2 leading-tight italic">{sb.dialogue || '—'}</p>
                <div className="flex-1" />
                <div className="flex items-center gap-1 text-[10px] text-ink-500">
                  <Film size={10} />
                  <span>{selectedId === sb.id ? store.getStoryboardMaterials(sb.id).length : ''}</span>
                </div>
              </button>
              <button onClick={() => handleAdd(sb.order)}
                className="w-6 h-6 rounded-full border border-ink-600 bg-ink-800 flex items-center justify-center text-ink-500 hover:text-amber-400 hover:border-amber-500/50 transition-colors shrink-0">
                <Plus size={12} />
              </button>
            </div>
          ))}
          {storyboards.length === 0 && (
            <button onClick={() => handleAdd()}
              className="w-52 h-36 rounded-xl border border-dashed border-ink-600 flex items-center justify-center text-ink-500 hover:text-amber-400 hover:border-amber-500/40 transition-colors">
              <Plus size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Edit Panel */}
      <div className={`fixed top-0 right-0 h-full w-[400px] bg-ink-800 panel-shadow z-30 flex flex-col transition-transform duration-300 ease-out
        ${selected ? 'translate-x-0' : 'translate-x-full'}`}>
        {selected && (
          <>
            <div className="flex items-center justify-between px-4 h-12 border-b border-ink-600 shrink-0">
              <span className="font-display font-semibold text-sm">分镜 #{selected.order}</span>
              <button onClick={() => setSelectedId(null)} className="p-1 rounded hover:bg-ink-700 text-ink-400"><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <label className="block"><span className="text-[11px] text-ink-400 mb-1 block">画面描述</span>
                <textarea rows={3} value={selected.visualDescription} onChange={e => handleUpdate({ visualDescription: e.target.value })}
                  className="w-full bg-ink-700 rounded-lg px-3 py-2 text-sm outline-none border border-ink-600 focus:border-amber-500/50 transition-colors" /></label>
              <label className="block"><span className="text-[11px] text-ink-400 mb-1 block">台词</span>
                <textarea rows={3} value={selected.dialogue} onChange={e => handleUpdate({ dialogue: e.target.value })}
                  className="w-full bg-ink-700 rounded-lg px-3 py-2 text-sm outline-none border border-ink-600 focus:border-amber-500/50 transition-colors" /></label>
              <div className="flex gap-3">
                <label className="flex-1"><span className="text-[11px] text-ink-400 mb-1 block">时长(秒)</span>
                  <input type="number" min={1} value={selected.duration} onChange={e => handleUpdate({ duration: Math.max(1, +e.target.value) })}
                    className="w-full bg-ink-700 rounded-lg px-3 py-2 text-sm outline-none border border-ink-600 focus:border-amber-500/50 transition-colors" /></label>
                <label className="flex-1"><span className="text-[11px] text-ink-400 mb-1 block">配乐建议</span>
                  <input value={selected.musicSuggestion} onChange={e => handleUpdate({ musicSuggestion: e.target.value })}
                    className="w-full bg-ink-700 rounded-lg px-3 py-2 text-sm outline-none border border-ink-600 focus:border-amber-500/50 transition-colors" /></label>
              </div>
              <label className="block"><span className="text-[11px] text-ink-400 mb-1 block">拍摄备注</span>
                <textarea rows={2} value={selected.shootingNotes} onChange={e => handleUpdate({ shootingNotes: e.target.value })}
                  className="w-full bg-ink-700 rounded-lg px-3 py-2 text-sm outline-none border border-ink-600 focus:border-amber-500/50 transition-colors" /></label>
              <div className="relative">
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-ink-400">素材状态</span>
                  <button onClick={() => setMaterialStatusOpen(!materialStatusOpen)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${MATERIAL_STATUS_CONFIG[selected.materialStatus].bg} ${MATERIAL_STATUS_CONFIG[selected.materialStatus].color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${MATERIAL_STATUS_CONFIG[selected.materialStatus].dot}`} />
                    {MATERIAL_STATUS_CONFIG[selected.materialStatus].label}
                  </button>
                </div>
                {materialStatusOpen && (
                  <div className="absolute left-0 right-0 z-10 mt-1 bg-ink-700 rounded-lg border border-ink-600 shadow-lg overflow-hidden">
                    {(Object.keys(MATERIAL_STATUS_CONFIG) as MaterialStatus[]).map(status => {
                      const sc = MATERIAL_STATUS_CONFIG[status];
                      return (
                        <button key={status}
                          onClick={() => { handleUpdate({ materialStatus: status }); setMaterialStatusOpen(false); }}
                          className={`flex items-center gap-2 w-full px-3 py-2 hover:bg-ink-600 text-xs transition-colors
                            ${selected.materialStatus === status ? `${sc.bg} ${sc.color}` : 'text-ink-300'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-ink-600">
                <div className="flex items-center justify-between py-1 mb-2">
                  <span className="text-xs text-ink-400">验收状态</span>
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${REVIEW_STATUS_CONFIG[selected.reviewStatus].bg} ${REVIEW_STATUS_CONFIG[selected.reviewStatus].color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${REVIEW_STATUS_CONFIG[selected.reviewStatus].dot}`} />
                    {REVIEW_STATUS_CONFIG[selected.reviewStatus].label}
                  </span>
                </div>
                {selected.reviewStatus === 'pending' ? (
                  <p className="text-[11px] text-ink-500 italic">待剪辑验收</p>
                ) : (
                  <div className="space-y-2">
                    {selected.reviewNotes && (
                      <p className="text-[11px] text-ink-300 leading-relaxed">
                        <span className="text-amber-400/60">「</span>
                        {selected.reviewNotes}
                        <span className="text-amber-400/60">」</span>
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-ink-500">
                      {selected.reviewerId && store.getMemberById(selected.reviewerId) && (
                        <span className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${ROLE_CONFIG[store.getMemberById(selected.reviewerId)!.role].dot}`} />
                          {store.getMemberById(selected.reviewerId)!.name}
                        </span>
                      )}
                      {selected.reviewedAt && (
                        <span>{new Date(selected.reviewedAt).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-')}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Version History */}
              <div className="pt-2 border-t border-ink-600">
                <button onClick={() => setShowVersions(!showVersions)}
                  className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-200 transition-colors w-full">
                  <History size={14} /><span>版本历史 ({versions.length})</span>
                  <ChevronRight size={12} className={`transition-transform ${showVersions ? 'rotate-90' : ''}`} />
                </button>
                {showVersions && (
                  <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                    {versions.length === 0 && <p className="text-[11px] text-ink-500 py-2">暂无修改记录</p>}
                    {versions.map(v => {
                      const vCfg = ROLE_CONFIG[v.operatorRole];
                      return (
                      <div key={v.id} className="flex items-start gap-2 text-[11px] bg-ink-700/50 rounded-lg p-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${vCfg.dot} mt-1.5 shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-medium text-ink-200">{v.operatorName}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${vCfg.bg} ${vCfg.color}`}>{vCfg.label}</span>
                            <span className="text-ink-500">{new Date(v.timestamp).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-ink-400">
                            <span className="text-amber-400/80">{v.field}</span>：
                            <span className="line-through text-red-400/60">{v.oldValue}</span>
                            →
                            <span className="text-emerald-400/80">{v.newValue}</span>
                          </p>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Comments */}
              <div className="pt-2 border-t border-ink-600">
                <div className="flex items-center gap-1.5 mb-2"><MessageCircle size={14} className="text-ink-400" /><span className="text-xs font-medium text-ink-300">评论 ({comments.length})</span></div>
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  {[
                    { key: 'all', label: '全部', bg: 'bg-amber-500/20', color: 'text-amber-400', dot: 'bg-amber-400' },
                    { key: 'director', label: '编导', ...ROLE_CONFIG.director },
                    { key: 'writer', label: '文案', ...ROLE_CONFIG.writer },
                    { key: 'camera', label: '拍摄', ...ROLE_CONFIG.camera },
                    { key: 'editor', label: '剪辑', ...ROLE_CONFIG.editor },
                  ].map(tab => (
                    <button key={tab.key} onClick={() => setCommentTab(tab.key)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors
                        ${commentTab === tab.key ? `${tab.bg} ${tab.color}` : 'bg-ink-700 text-ink-400 hover:bg-ink-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${commentTab === tab.key ? tab.dot : 'bg-ink-500'}`} />
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="space-y-2.5 max-h-60 overflow-y-auto mb-3">
                  {filteredComments.map(c => {
                    const cfg = ROLE_CONFIG[c.authorRole];
                    const author = store.getMemberById(c.authorId);
                    return (
                      <div key={c.id} className={`rounded-lg p-2.5 ${cfg.bg}/40`} style={{ background: `linear-gradient(135deg, ${cfg.bg.replace('/20', '/10')}, transparent)` }}>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-5 h-5 rounded-full bg-ink-600 flex items-center justify-center text-[9px] font-bold">{c.authorName[0]}</div>
                          <span className="text-[11px] font-medium">{c.authorName}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                        </div>
                        <p className="text-[11px] text-ink-300 leading-relaxed"><MentionText text={c.content} members={members} /></p>
                      </div>
                    );
                  })}
                  {filteredComments.length === 0 && <p className="text-[11px] text-ink-500 py-2 text-center">暂无评论</p>}
                </div>

                <div className="relative">
                  <textarea ref={commentRef} rows={2} value={commentText} onChange={e => handleCommentInput(e.target.value)}
                    placeholder="输入评论，@提及成员…"
                    className="w-full bg-ink-700 rounded-lg px-3 py-2 text-xs outline-none border border-ink-600 focus:border-amber-500/50 transition-colors pr-9" />
                  <button onClick={handleComment} className="absolute right-2 bottom-2 p-1 rounded hover:bg-ink-600 text-amber-500"><Send size={14} /></button>
                  {showMentions && (
                    <div className="absolute bottom-full left-0 mb-1 w-full bg-ink-700 rounded-lg border border-ink-600 shadow-lg overflow-hidden z-10">
                      {members.map(m => (
                        <button key={m.id} onClick={() => pickMention(m.name, m.id)}
                          className="flex items-center gap-2 w-full px-3 py-2 hover:bg-ink-600 text-xs transition-colors">
                          <div className="w-5 h-5 rounded-full bg-ink-500 flex items-center justify-center text-[9px] font-bold">{m.name[0]}</div>
                          <span>{m.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${ROLE_CONFIG[m.role].bg} ${ROLE_CONFIG[m.role].color}`}>{ROLE_CONFIG[m.role].label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-ink-600 shrink-0">
              <button onClick={handleDelete}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"><Trash2 size={13} />删除分镜</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
