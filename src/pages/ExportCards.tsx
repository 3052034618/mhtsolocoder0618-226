import { useState, useCallback } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Download, FileText, Clock, Music, Camera,
} from 'lucide-react';
import { MATERIAL_STATUS_CONFIG } from '@/types';
import type { Storyboard, MaterialStatus } from '@/types';

function generateExportHTML(projectName: string, storyboards: Storyboard[]): string {
  const statusMap: Record<MaterialStatus, { label: string; color: string }> = {
    not_shot: { label: '未拍摄', color: '#94a3b8' },
    uploaded: { label: '已上传', color: '#60a5fa' },
    reshoot: { label: '待补拍', color: '#fbbf24' },
    ready: { label: '已齐备', color: '#34d399' },
  };

  const cards = storyboards.map(sb => {
    const ms = statusMap[sb.materialStatus];
    return `
      <div style="width:280px;height:500px;border:1px solid #e2e8f0;border-radius:12px;padding:20px;display:flex;flex-direction:column;box-sizing:border-box;background:#fff;page-break-inside:avoid;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <span style="font-size:11px;font-weight:600;color:#d97706;letter-spacing:0.5px;">${projectName}</span>
          <span style="font-size:10px;font-family:monospace;color:#94a3b8;background:#f1f5f9;padding:2px 8px;border-radius:9999px;">
            镜头 ${sb.order}/${storyboards.length}
          </span>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;gap:10px;">
          <div>
            <div style="font-size:10px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">画面描述</div>
            <div style="font-size:12px;color:#334155;line-height:1.6;">${sb.visualDescription || '—'}</div>
          </div>
          <div style="border-top:1px solid #f1f5f9;padding-top:10px;">
            <div style="font-size:10px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">台词</div>
            <div style="font-size:12px;color:#b45309;line-height:1.6;font-style:italic;">${sb.dialogue ? `「${sb.dialogue}」` : '—'}</div>
          </div>
          <div style="border-top:1px solid #f1f5f9;padding-top:10px;">
            <div style="font-size:10px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">时长</div>
            <div style="font-size:12px;color:#334155;font-family:monospace;">${sb.duration}s</div>
          </div>
          <div style="border-top:1px solid #f1f5f9;padding-top:10px;">
            <div style="font-size:10px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">配乐建议</div>
            <div style="font-size:12px;color:#334155;">${sb.musicSuggestion || '—'}</div>
          </div>
          <div style="border-top:1px solid #f1f5f9;padding-top:10px;">
            <div style="font-size:10px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">拍摄备注</div>
            <div style="font-size:12px;color:#334155;line-height:1.6;">${sb.shootingNotes || '—'}</div>
          </div>
        </div>
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:10px;color:#94a3b8;">素材状态</span>
          <span style="font-size:10px;font-weight:500;color:${ms.color};background:${ms.color}1a;padding:2px 8px;border-radius:9999px;">
            ${ms.label}
          </span>
        </div>
      </div>
    `;
  });

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${projectName} - 拍摄提示卡</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: #fff; }
    .page-title { text-align: center; font-size: 18px; font-weight: 700; color: #1e293b; padding: 20px 0 10px; }
    .page-subtitle { text-align: center; font-size: 12px; color: #94a3b8; margin-bottom: 24px; }
    .cards-grid { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; }
    @media print { .page-title, .page-subtitle { display: none; } .cards-grid { gap: 16px; } }
  </style>
</head>
<body>
  <div class="page-title">${projectName} - 拍摄提示卡</div>
  <div class="page-subtitle">共 ${storyboards.length} 个分镜 · ${new Date().toLocaleDateString('zh-CN')}</div>
  <div class="cards-grid">${cards.join('')}</div>
</body>
</html>`;
}

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

  const handleExportAll = useCallback(() => {
    if (!project) return;
    const html = generateExportHTML(project.name, storyboards);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }, [project, storyboards]);

  const handleDownloadPDF = useCallback(() => {
    if (!project) return;
    const html = generateExportHTML(project.name, storyboards);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
  }, [project, storyboards]);

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
  const msConfig = MATERIAL_STATUS_CONFIG[sb.materialStatus];

  return (
    <div className="h-screen flex flex-col bg-ink-900 text-white overflow-hidden">
      <header className="flex items-center gap-4 px-5 h-14 border-b border-ink-600 shrink-0">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-ink-700 text-ink-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-display font-semibold text-sm">{project.name}</h1>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-700 hover:bg-ink-600 text-ink-200 text-xs font-medium transition-colors"
          >
            <FileText size={14} />下载PDF
          </button>
          <button
            onClick={handleExportAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-450 text-ink-900 text-xs font-medium transition-colors"
          >
            <Download size={14} />导出全部
          </button>
        </div>
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
                <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${msConfig.bg} ${msConfig.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${msConfig.dot}`} />
                  {msConfig.label}
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
          {storyboards.map((s, i) => {
            const thumbMs = MATERIAL_STATUS_CONFIG[s.materialStatus];
            return (
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
                  <span className={`mt-1 w-1.5 h-1.5 rounded-full ${thumbMs.dot}`} />
                </div>
              </button>
            );
          })}
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
