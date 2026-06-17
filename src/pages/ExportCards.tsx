import { useState, useCallback } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Download, Clock, Music, Camera, Check,
} from 'lucide-react';

export default function ExportCards() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const store = useProjectStore();
  const project = store.projects.find(p => p.id === projectId);
  const storyboards = store.getProjectStoryboards(projectId!);

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [animKey, setAnimKey] = useState(0);

  const goTo = useCallback((index: number, dir: 'left' | 'right') => {
    if (index < 0 || index >= storyboards.length) return;
    setDirection(dir);
    setCurrent(index);
    setAnimKey(k => k + 1);
  }, [storyboards.length]);

  if (!project) {
    return <div className="flex items-center justify-center h-screen text-ink-500">项目不存在</div>;
  }

  if (storyboards.length === 0) {
    return (
      <div className="h-screen flex flex-col bg-ink-900 text-white">
        <header className="flex items-center gap-4 px-5 h-14 border-b border-ink-600 shrink-0">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-ink-700 text-ink-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-display font-semibold text-sm">{project.name}</h1>
        </header>
        <div className="flex-1 flex items-center justify-center text-ink-500 text-sm">暂无分镜数据</div>
      </div>
    );
  }

  const sb = storyboards[current];

  return (
    <div className="h-screen flex flex-col bg-ink-900 text-white overflow-hidden">
      <header className="flex items-center gap-4 px-5 h-14 border-b border-ink-600 shrink-0">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-ink-700 text-ink-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-display font-semibold text-sm">{project.name}</h1>
        <div className="flex-1" />
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-450 text-ink-900 text-xs font-medium transition-colors">
          <Download size={14} />导出全部
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center relative px-6">
        <button
          onClick={() => goTo(current - 1, 'left')}
          disabled={current === 0}
          className="absolute left-4 p-2 rounded-full bg-ink-700/80 hover:bg-ink-600 text-ink-300 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none z-10"
        >
          <ChevronLeft size={22} />
        </button>

        <div
          key={animKey}
          className="animate-slide-in-right"
          style={{
            animationName: direction === 'right' ? 'slideInRight' : 'slideInLeft',
            animationDuration: '0.3s',
            animationTimingFunction: 'ease-out',
          }}
        >
          <div
            className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{ width: 280, height: 500 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-ink-700 via-ink-800 to-ink-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/40 via-transparent to-ink-900/20" />
            <div className="relative h-full flex flex-col p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="font-display font-semibold text-xs text-amber-400 tracking-wide">{project.name}</span>
                <span className="text-[10px] font-mono text-ink-400 bg-ink-600/60 px-2 py-0.5 rounded-full">
                  镜头 {current + 1}/{storyboards.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                <div>
                  <span className="text-[10px] text-ink-400 tracking-wider uppercase">画面描述</span>
                  <p className="text-xs text-ink-200 mt-1 leading-relaxed">{sb.visualDescription || '—'}</p>
                </div>

                <div className="border-t border-ink-600/50 pt-3">
                  <span className="text-[10px] text-ink-400 tracking-wider uppercase">台词</span>
                  <p className="text-xs text-amber-300/80 mt-1 leading-relaxed italic font-body">
                    {sb.dialogue ? `「${sb.dialogue}」` : '—'}
                  </p>
                </div>

                <div className="border-t border-ink-600/50 pt-3">
                  <span className="text-[10px] text-ink-400 tracking-wider uppercase">时长</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock size={12} className="text-ink-400" />
                    <span className="text-xs text-ink-200 font-mono">{sb.duration}s</span>
                  </div>
                </div>

                <div className="border-t border-ink-600/50 pt-3">
                  <span className="text-[10px] text-ink-400 tracking-wider uppercase">配乐建议</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Music size={12} className="text-ink-400" />
                    <span className="text-xs text-ink-200">{sb.musicSuggestion || '—'}</span>
                  </div>
                </div>

                <div className="border-t border-ink-600/50 pt-3">
                  <span className="text-[10px] text-ink-400 tracking-wider uppercase">拍摄备注</span>
                  <div className="flex items-start gap-1.5 mt-1">
                    <Camera size={12} className="text-ink-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-ink-200 leading-relaxed">{sb.shootingNotes || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-ink-600/50 flex items-center justify-between">
                <span className="text-[10px] text-ink-500">素材状态</span>
                <span
                  className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    sb.materialReady
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-ink-600/60 text-ink-400'
                  }`}
                >
                  {sb.materialReady && <Check size={10} />}
                  {sb.materialReady ? '已就绪' : '未就绪'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => goTo(current + 1, 'right')}
          disabled={current === storyboards.length - 1}
          className="absolute right-4 p-2 rounded-full bg-ink-700/80 hover:bg-ink-600 text-ink-300 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none z-10"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="px-6 py-4 border-t border-ink-600 shrink-0">
        <div className="flex items-center justify-center gap-2 overflow-x-auto">
          {storyboards.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i, i > current ? 'right' : 'left')}
              className={`shrink-0 rounded-lg transition-all duration-200 ${
                i === current
                  ? 'ring-2 ring-amber-500 shadow-lg shadow-amber-500/20'
                  : 'hover:ring-1 hover:ring-ink-500'
              }`}
            >
              <div
                className={`flex flex-col items-center justify-center rounded-lg px-2.5 py-2 text-center ${
                  i === current ? 'bg-ink-700' : 'bg-ink-800'
                }`}
                style={{ width: 56, height: 80 }}
              >
                <span className="text-[10px] font-mono text-ink-400 mb-1">{s.order}</span>
                <p className="text-[8px] text-ink-300 line-clamp-2 leading-tight">{s.visualDescription || '—'}</p>
                <span
                  className={`mt-1 w-1.5 h-1.5 rounded-full ${
                    s.materialReady ? 'bg-emerald-400' : 'bg-ink-500'
                  }`}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideInLeft {
          0% { transform: translateX(-30px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
