import { useState, useCallback, useMemo, useRef } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Download, FileText, Clock, Music, Camera, AlertTriangle,
  CheckCircle, XCircle, Loader2, ClipboardCheck,
} from 'lucide-react';
import { MATERIAL_STATUS_CONFIG, REVIEW_STATUS_CONFIG, DELIVERY_STATUS_CONFIG, ROLE_CONFIG, SIGN_OFF_PARTY_CONFIG } from '@/types';
import type { Storyboard, MaterialStatus, ReviewStatus, DeliveryStatus, Role, Comment, SignOffParty } from '@/types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function escapeHtml(str: string): string {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s] || s));
}

function generateExportHTML(
  projectName: string,
  storyboards: Storyboard[],
  view: 'cards' | 'package',
  getComments: (sbId: string) => Comment[],
  signOffs?: { status: DeliveryStatus; signerName: string; signerRole: Role; signerParty: SignOffParty; notes: string; createdAt: string; rejectedStoryboardIds: string[] }[],
): string {
  const statusMap: Record<MaterialStatus, { label: string; color: string }> = {
    not_shot: { label: '未拍摄', color: '#94a3b8' },
    uploaded: { label: '已上传', color: '#60a5fa' },
    reshoot: { label: '待补拍', color: '#fbbf24' },
    ready: { label: '已齐备', color: '#34d399' },
  };

  const reviewStatusMap: Record<ReviewStatus, { label: string; color: string }> = {
    pending: { label: '待验收', color: '#94a3b8' },
    pass: { label: '通过', color: '#34d399' },
    reshoot: { label: '需补镜', color: '#f87171' },
    revoice: { label: '需补音', color: '#a855f7' },
    notes: { label: '有备注', color: '#fbbf24' },
  };

  const deliveryStatusMap: Record<DeliveryStatus, { label: string; color: string }> = {
    pending: { label: '待签收', color: '#94a3b8' },
    approved: { label: '已通过', color: '#34d399' },
    rejected: { label: '退回修改', color: '#f87171' },
  };

  const roleLabelMap: Record<Role, string> = {
    director: '编导',
    writer: '文案',
    camera: '拍摄',
    editor: '剪辑',
  };

  const partyMap: Record<string, { label: string; color: string }> = {
    client: { label: '客户', color: '#22d3ee' },
    responsible: { label: '负责人', color: '#fbbf24' },
    internal: { label: '内部成员', color: '#94a3b8' },
  };

  const total = storyboards.length;
  const readyCount = storyboards.filter(s => s.materialStatus === 'ready').length;
  const reshootCount = storyboards.filter(s => s.materialStatus === 'reshoot').length;
  const notShotCount = storyboards.filter(s => s.materialStatus === 'not_shot').length;
  const passCount = storyboards.filter(s => s.reviewStatus === 'pass').length;
  const readyRate = total > 0 ? Math.round((readyCount / total) * 100) : 0;
  const passRate = total > 0 ? Math.round((passCount / total) * 100) : 0;

  const nonReadyStoryboards = storyboards.filter(s => s.materialStatus !== 'ready');
  const hasIssues = nonReadyStoryboards.length > 0 || storyboards.some(s => s.reviewStatus !== 'pass');

  if (view === 'package') {
    const overviewHTML = `
      <div style="background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:24px;">
        <div style="font-size:16px;font-weight:600;color:#1e293b;margin-bottom:16px;">交付概览</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px;">
          <div style="background:#fff;border-radius:8px;padding:16px;text-align:center;">
            <div style="font-size:28px;font-weight:700;color:#1e293b;">${total}</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px;">总数</div>
          </div>
          <div style="background:#fff;border-radius:8px;padding:16px;text-align:center;">
            <div style="font-size:28px;font-weight:700;color:#34d399;">${readyCount}</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px;">已齐备</div>
          </div>
          <div style="background:#fff;border-radius:8px;padding:16px;text-align:center;">
            <div style="font-size:28px;font-weight:700;color:#fbbf24;">${reshootCount}</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px;">待补拍</div>
          </div>
          <div style="background:#fff;border-radius:8px;padding:16px;text-align:center;">
            <div style="font-size:28px;font-weight:700;color:#94a3b8;">${notShotCount}</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px;">未拍摄</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;">
          <div style="background:#fff;border-radius:8px;padding:16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:14px;color:#64748b;">分镜达标率</span>
              <span style="font-size:24px;font-weight:700;color:${readyRate >= 100 ? '#34d399' : readyRate >= 80 ? '#fbbf24' : '#f87171'};">${readyRate}%</span>
            </div>
            <div style="margin-top:8px;height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;">
              <div style="height:100%;width:${readyRate}%;background:${readyRate >= 100 ? '#34d399' : readyRate >= 80 ? '#fbbf24' : '#f87171'};"></div>
            </div>
          </div>
          <div style="background:#fff;border-radius:8px;padding:16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:14px;color:#64748b;">验收通过率</span>
              <span style="font-size:24px;font-weight:700;color:${passRate >= 100 ? '#34d399' : passRate >= 80 ? '#fbbf24' : '#f87171'};">${passRate}%</span>
            </div>
            <div style="margin-top:8px;height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;">
              <div style="height:100%;width:${passRate}%;background:${passRate >= 100 ? '#34d399' : passRate >= 80 ? '#fbbf24' : '#f87171'};"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const storyboardBlocksHTML = storyboards.map(sb => {
      const ms = statusMap[sb.materialStatus];
      const rs = reviewStatusMap[sb.reviewStatus];
      const isNotReady = sb.materialStatus !== 'ready';

      const comments = getComments(sb.id);
      const latestByRole: Record<string, Comment> = {};
      comments.forEach(c => {
        if (!latestByRole[c.authorRole] || new Date(c.createdAt) > new Date(latestByRole[c.authorRole].createdAt)) {
          latestByRole[c.authorRole] = c;
        }
      });
      const hasComments = Object.keys(latestByRole).length > 0;

      const commentsSection = hasComments
        ? `<div style="margin-top:16px;padding-top:16px;border-top:1px solid #e2e8f0;">
            <div style="font-size:13px;font-weight:600;color:#1e293b;margin-bottom:12px;">评论摘要</div>
            <div style="display:flex;flex-wrap:wrap;gap:12px;">
              ${(['director', 'writer', 'camera', 'editor'] as Role[]).map(role => {
                const comment = latestByRole[role];
                if (!comment) return '';
                const roleColorMap: Record<string, string> = {
                  director: '#a855f7', writer: '#60a5fa', camera: '#f87171', editor: '#34d399',
                };
                const rc = roleColorMap[role] || '#64748b';
                return `
                  <div style="flex:1;min-width:180px;background:#f8fafc;border-radius:8px;padding:12px;">
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                      <span style="width:6px;height:6px;border-radius:50%;background:${rc};"></span>
                      <span style="font-size:11px;font-weight:600;color:${rc};">${roleLabelMap[role]}</span>
                      <span style="font-size:10px;color:#94a3b8;">${escapeHtml(comment.authorName)}</span>
                    </div>
                    <div style="font-size:12px;color:#334155;line-height:1.5;">${escapeHtml(comment.content)}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>`
        : '';

      return `
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:20px;page-break-inside:avoid;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:14px;font-weight:700;color:#1e293b;font-family:monospace;">镜头 ${sb.order}</span>
              <span style="font-size:12px;color:#64748b;max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(sb.visualDescription || '')}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              ${isNotReady ? `<span style="font-size:11px;font-weight:600;color:#ef4444;background:#fef2f2;padding:3px 10px;border-radius:9999px;">素材未齐备</span>` : ''}
              <span style="font-size:11px;font-weight:500;color:${ms.color};background:${ms.color}1a;padding:3px 8px;border-radius:9999px;">${ms.label}</span>
              <span style="font-size:11px;font-weight:500;color:${rs.color};background:${rs.color}1a;padding:3px 8px;border-radius:9999px;">${rs.label}</span>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
            <div>
              <div style="font-size:10px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">画面描述</div>
              <div style="font-size:12px;color:#334155;line-height:1.6;">${escapeHtml(sb.visualDescription || '—')}</div>
            </div>
            <div>
              <div style="font-size:10px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">台词</div>
              <div style="font-size:12px;color:#b45309;line-height:1.6;font-style:italic;">${sb.dialogue ? `「${escapeHtml(sb.dialogue)}」` : '—'}</div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px;">
            <div>
              <div style="font-size:10px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">时长</div>
              <div style="font-size:12px;color:#334155;font-family:monospace;">${sb.duration}s</div>
            </div>
            <div>
              <div style="font-size:10px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">配乐建议</div>
              <div style="font-size:12px;color:#334155;">${escapeHtml(sb.musicSuggestion || '—')}</div>
            </div>
            <div>
              <div style="font-size:10px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">拍摄备注</div>
              <div style="font-size:12px;color:#334155;line-height:1.6;">${escapeHtml(sb.shootingNotes || '—')}</div>
            </div>
          </div>

          ${isNotReady ? `
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
              <span style="color:#ef4444;font-size:14px;">⚠️</span>
              <span style="font-size:12px;color:#dc2626;font-weight:500;">素材缺口：当前状态为 <strong>${ms.label}</strong>，尚未齐备</span>
            </div>
          ` : ''}

          <div style="background:#f8fafc;border-radius:8px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:12px;color:#64748b;">剪辑结论</span>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:11px;font-weight:500;color:${rs.color};background:${rs.color}1a;padding:3px 10px;border-radius:9999px;">${rs.label}</span>
              ${sb.reviewNotes ? `<span style="font-size:12px;color:#64748b;">${escapeHtml(sb.reviewNotes)}</span>` : ''}
            </div>
          </div>

          ${commentsSection}
        </div>
      `;
    }).join('');

    let signOffHTML = '';
    if (signOffs && signOffs.length > 0) {
      const latestStatus = signOffs[0].status;
      const ds = deliveryStatusMap[latestStatus];
      signOffHTML = `
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;page-break-inside:avoid;">
          <div style="font-size:16px;font-weight:600;color:#1e293b;margin-bottom:16px;">交付签收记录</div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
            <span style="font-size:12px;color:#64748b;">当前状态：</span>
            <span style="font-size:11px;font-weight:600;color:${ds.color};background:${ds.color}1a;padding:3px 10px;border-radius:9999px;">${ds.label}</span>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;border-bottom:1px solid #e2e8f0;">时间</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;border-bottom:1px solid #e2e8f0;">签收人</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;border-bottom:1px solid #e2e8f0;">角色</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;border-bottom:1px solid #e2e8f0;">签收方</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;border-bottom:1px solid #e2e8f0;">状态</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#64748b;border-bottom:1px solid #e2e8f0;">意见</th>
              </tr>
            </thead>
            <tbody>
              ${signOffs.map(so => {
                const soDs = deliveryStatusMap[so.status];
                const pm = partyMap[so.signerParty] || partyMap.internal;
                const notesContent = so.status === 'rejected' && so.rejectedStoryboardIds.length === 0
                  ? `${escapeHtml(so.notes || '')}<span style="font-size:10px;font-weight:500;color:#f87171;background:#f871711a;padding:2px 8px;border-radius:9999px;margin-left:4px;">整包退回</span>`
                  : escapeHtml(so.notes || '—');
                return `
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:10px 12px;font-size:11px;color:#64748b;">${new Date(so.createdAt).toLocaleString('zh-CN')}</td>
                    <td style="padding:10px 12px;font-size:11px;color:#1e293b;font-weight:500;">${escapeHtml(so.signerName)}</td>
                    <td style="padding:10px 12px;font-size:11px;color:#64748b;">${roleLabelMap[so.signerRole]}</td>
                    <td style="padding:10px 12px;"><span style="font-size:10px;font-weight:500;color:${pm.color};background:${pm.color}1a;padding:2px 8px;border-radius:9999px;">${pm.label}</span></td>
                    <td style="padding:10px 12px;"><span style="font-size:10px;font-weight:500;color:${soDs.color};background:${soDs.color}1a;padding:2px 8px;border-radius:9999px;">${soDs.label}</span></td>
                    <td style="padding:10px 12px;font-size:11px;color:#64748b;max-width:200px;line-height:1.5;">${notesContent}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(projectName)} - 交付包</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: #fff; color: #1e293b; }
    .page-title { text-align: center; font-size: 20px; font-weight: 700; color: #1e293b; padding: 20px 0 8px; }
    .page-subtitle { text-align: center; font-size: 12px; color: #64748b; margin-bottom: 20px; }
    .warning-bar { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
    .warning-icon { color: #ef4444; }
    .warning-text { font-size: 13px; color: #dc2626; font-weight: 500; }
    @media print { .page-title, .page-subtitle { display: none; } }
  </style>
</head>
<body>
  <div class="page-title">${escapeHtml(projectName)} - 交付包</div>
  <div class="page-subtitle">共 ${total} 个分镜 · ${new Date().toLocaleDateString('zh-CN')}</div>
  ${hasIssues ? `
    <div class="warning-bar">
      <span class="warning-icon">⚠️</span>
      <span class="warning-text">交付检查不通过：${nonReadyStoryboards.length} 个分镜素材未齐备，${storyboards.filter(s => s.reviewStatus !== 'pass').length} 个分镜未通过验收</span>
    </div>
  ` : ''}
  ${overviewHTML}
  ${storyboardBlocksHTML}
  ${signOffHTML}
</body>
</html>`;
  }

  const cards = storyboards.map(sb => {
    const ms = statusMap[sb.materialStatus];
    return `
      <div style="width:280px;height:500px;border:1px solid #e2e8f0;border-radius:12px;padding:20px;display:flex;flex-direction:column;box-sizing:border-box;background:#fff;page-break-inside:avoid;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <span style="font-size:11px;font-weight:600;color:#d97706;letter-spacing:0.5px;">${escapeHtml(projectName)}</span>
          <span style="font-size:10px;font-family:monospace;color:#94a3b8;background:#f1f5f9;padding:2px 8px;border-radius:9999px;">
            镜头 ${sb.order}/${storyboards.length}
          </span>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;gap:10px;">
          <div>
            <div style="font-size:10px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">画面描述</div>
            <div style="font-size:12px;color:#334155;line-height:1.6;">${escapeHtml(sb.visualDescription || '—')}</div>
          </div>
          <div style="border-top:1px solid #f1f5f9;padding-top:10px;">
            <div style="font-size:10px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">台词</div>
            <div style="font-size:12px;color:#b45309;line-height:1.6;font-style:italic;">${sb.dialogue ? `「${escapeHtml(sb.dialogue)}」` : '—'}</div>
          </div>
          <div style="border-top:1px solid #f1f5f9;padding-top:10px;">
            <div style="font-size:10px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">时长</div>
            <div style="font-size:12px;color:#334155;font-family:monospace;">${sb.duration}s</div>
          </div>
          <div style="border-top:1px solid #f1f5f9;padding-top:10px;">
            <div style="font-size:10px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">配乐建议</div>
            <div style="font-size:12px;color:#334155;">${escapeHtml(sb.musicSuggestion || '—')}</div>
          </div>
          <div style="border-top:1px solid #f1f5f9;padding-top:10px;">
            <div style="font-size:10px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">拍摄备注</div>
            <div style="font-size:12px;color:#334155;line-height:1.6;">${escapeHtml(sb.shootingNotes || '—')}</div>
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
  <title>${escapeHtml(projectName)} - 拍摄提示卡</title>
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
  <div class="page-title">${escapeHtml(projectName)} - 拍摄提示卡</div>
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

  const [currentView, setCurrentView] = useState<'cards' | 'package'>('cards');
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [animKey, setAnimKey] = useState(0);

  const [pdfLoading, setPdfLoading] = useState(false);
  const [signOffStatus, setSignOffStatus] = useState<DeliveryStatus>('approved');
  const [signOffName, setSignOffName] = useState('');
  const [signOffRole, setSignOffRole] = useState<Role>('director');
  const [signOffNotes, setSignOffNotes] = useState('');
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const [signOffParty, setSignOffParty] = useState<SignOffParty>('internal');
  const [pdfWithHistory, setPdfWithHistory] = useState(false);

  const packageRef = useRef<HTMLDivElement>(null);

  const getComments = useCallback((sbId: string) => {
    return store.getStoryboardComments(sbId);
  }, [store]);

  const deliveryStatus = useMemo(() => {
    if (!projectId) return 'pending' as DeliveryStatus;
    return store.getLatestDeliveryStatus(projectId);
  }, [projectId, store]);

  const deliverySignOffs = useMemo(() => {
    if (!projectId) return [];
    return store.getProjectDeliverySignOffs(projectId);
  }, [projectId, store]);

  const stats = useMemo(() => {
    const total = storyboards.length;
    const readyCount = storyboards.filter(s => s.materialStatus === 'ready').length;
    const reshootCount = storyboards.filter(s => s.materialStatus === 'reshoot').length;
    const notShotCount = storyboards.filter(s => s.materialStatus === 'not_shot').length;
    const passCount = storyboards.filter(s => s.reviewStatus === 'pass').length;
    const readyRate = total > 0 ? Math.round((readyCount / total) * 100) : 0;
    const passRate = total > 0 ? Math.round((passCount / total) * 100) : 0;
    const nonReadyStoryboards = storyboards.filter(s => s.materialStatus !== 'ready');
    const nonPassStoryboards = storyboards.filter(s => s.reviewStatus !== 'pass');
    const hasIssues = nonReadyStoryboards.length > 0 || nonPassStoryboards.length > 0;
    return { total, readyCount, reshootCount, notShotCount, passCount, readyRate, passRate, nonReadyStoryboards, nonPassStoryboards, hasIssues };
  }, [storyboards]);

  const goTo = useCallback((index: number, dir: 'left' | 'right') => {
    if (index < 0 || index >= storyboards.length) return;
    setDirection(dir);
    setCurrent(index);
    setAnimKey(k => k + 1);
  }, [storyboards.length]);

  const handleExportAll = useCallback(() => {
    if (!project) return;
    const signOffsForExport = pdfWithHistory ? deliverySignOffs : (deliverySignOffs.length > 0 ? [deliverySignOffs[0]] : []);
    const html = generateExportHTML(project.name, storyboards, currentView, getComments, signOffsForExport);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }, [project, storyboards, currentView, getComments, deliverySignOffs, pdfWithHistory]);

  const handleDownloadPDF = useCallback(async () => {
    if (!project || pdfLoading) return;
    setPdfLoading(true);
    try {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '794px';
      container.style.background = '#fff';
      container.style.color = '#1e293b';
      container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
      container.style.fontSize = '14px';
      container.style.padding = '0';
      document.body.appendChild(container);

      const signOffsForExport = pdfWithHistory ? deliverySignOffs : (deliverySignOffs.length > 0 ? [deliverySignOffs[0]] : []);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generateExportHTML(project.name, storyboards, 'package', getComments, signOffsForExport);
      const bodyContent = tempDiv.querySelector('body');
      if (bodyContent) {
        container.innerHTML = bodyContent.innerHTML;
      } else {
        container.innerHTML = tempDiv.innerHTML;
      }

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = position - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const safeName = project.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
      const date = new Date();
      const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
      pdf.save(`${safeName}_交付包_${dateStr}.pdf`);

      document.body.removeChild(container);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setPdfLoading(false);
    }
  }, [project, storyboards, getComments, deliverySignOffs, pdfLoading]);

  const handleSignOff = useCallback(() => {
    if (!projectId || !signOffName.trim()) return;
    store.addDeliverySignOff(
      projectId,
      signOffStatus,
      signOffName.trim(),
      signOffRole,
      signOffParty,
      signOffNotes.trim(),
      signOffStatus === 'rejected' ? rejectedIds : [],
    );
    setSignOffName('');
    setSignOffNotes('');
    setRejectedIds([]);
    setSignOffStatus('approved');
    setSignOffParty('internal');
  }, [projectId, store, signOffStatus, signOffName, signOffRole, signOffParty, signOffNotes, rejectedIds]);

  const toggleRejectedId = useCallback((id: string) => {
    setRejectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

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
  const dsConfig = DELIVERY_STATUS_CONFIG[deliveryStatus];

  return (
    <div className="h-screen flex flex-col bg-ink-900 text-white overflow-hidden">
      <header className="flex items-center gap-4 px-5 h-14 border-b border-ink-600 shrink-0">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-ink-700 text-ink-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-display font-semibold text-sm">{project.name}</h1>
        {deliveryStatus !== 'pending' && (
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${dsConfig.bg} ${dsConfig.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dsConfig.dot}`} />
            {dsConfig.label}
          </span>
        )}
        <div className="flex items-center gap-1 bg-ink-800 rounded-lg p-1">
          <button
            onClick={() => setCurrentView('cards')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              currentView === 'cards' ? 'bg-ink-700 text-white' : 'text-ink-400 hover:text-white'
            }`}
          >
            卡片视图
          </button>
          <button
            onClick={() => setCurrentView('package')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              currentView === 'package' ? 'bg-ink-700 text-white' : 'text-ink-400 hover:text-white'
            }`}
          >
            交付包视图
          </button>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[10px] text-ink-400 cursor-pointer">
            <input type="checkbox" checked={pdfWithHistory} onChange={e => setPdfWithHistory(e.target.checked)}
              className="w-3 h-3 rounded border-ink-500 bg-ink-700 text-amber-500 focus:ring-amber-500/50" />
            含完整签收历史
          </label>
          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-700 hover:bg-ink-600 text-ink-200 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            {pdfLoading ? '正在生成PDF...' : '下载PDF'}
          </button>
          <button
            onClick={handleExportAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-450 text-ink-900 text-xs font-medium transition-colors"
          >
            <Download size={14} />导出全部
          </button>
        </div>
      </header>

      {currentView === 'cards' ? (
        <>
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
        </>
      ) : (
        <div className="flex-1 overflow-y-auto" ref={packageRef}>
          <div className="max-w-5xl mx-auto px-6 py-6">
            {stats.hasIssues && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-red-400">交付标准检查不通过</div>
                  <div className="text-xs text-red-300/80 mt-1">
                    {stats.nonReadyStoryboards.length > 0 && `${stats.nonReadyStoryboards.length} 个分镜素材未齐备`}
                    {stats.nonReadyStoryboards.length > 0 && stats.nonPassStoryboards.length > 0 && '，'}
                    {stats.nonPassStoryboards.length > 0 && `${stats.nonPassStoryboards.length} 个分镜未通过验收`}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-ink-800/50 rounded-2xl p-6 mb-6">
              <h2 className="text-sm font-semibold text-ink-200 mb-4">交付概览</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-ink-700/50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-white">{stats.total}</div>
                  <div className="text-xs text-ink-400 mt-1">总数</div>
                </div>
                <div className="bg-ink-700/50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-emerald-400">{stats.readyCount}</div>
                  <div className="text-xs text-ink-400 mt-1">已齐备</div>
                </div>
                <div className="bg-ink-700/50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-amber-400">{stats.reshootCount}</div>
                  <div className="text-xs text-ink-400 mt-1">待补拍</div>
                </div>
                <div className="bg-ink-700/50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-slate-400">{stats.notShotCount}</div>
                  <div className="text-xs text-ink-400 mt-1">未拍摄</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-ink-700/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-ink-400">分镜达标率</span>
                    <span className={`text-lg font-bold ${stats.readyRate >= 100 ? 'text-emerald-400' : stats.readyRate >= 80 ? 'text-amber-400' : 'text-red-400'}`}>{stats.readyRate}%</span>
                  </div>
                  <div className="h-2 bg-ink-600 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${stats.readyRate >= 100 ? 'bg-emerald-500' : stats.readyRate >= 80 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${stats.readyRate}%` }} />
                  </div>
                </div>
                <div className="bg-ink-700/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-ink-400">验收通过率</span>
                    <span className={`text-lg font-bold ${stats.passRate >= 100 ? 'text-emerald-400' : stats.passRate >= 80 ? 'text-amber-400' : 'text-red-400'}`}>{stats.passRate}%</span>
                  </div>
                  <div className="h-2 bg-ink-600 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${stats.passRate >= 100 ? 'bg-emerald-500' : stats.passRate >= 80 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${stats.passRate}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {storyboards.map(sbItem => {
              const itemMs = MATERIAL_STATUS_CONFIG[sbItem.materialStatus];
              const itemRs = REVIEW_STATUS_CONFIG[sbItem.reviewStatus];
              const isNotReady = sbItem.materialStatus !== 'ready';
              const comments = getComments(sbItem.id);
              const latestByRole: Record<string, Comment> = {};
              comments.forEach(c => {
                if (!latestByRole[c.authorRole] || new Date(c.createdAt) > new Date(latestByRole[c.authorRole].createdAt)) {
                  latestByRole[c.authorRole] = c;
                }
              });
              const hasComments = Object.keys(latestByRole).length > 0;

              return (
                <div key={sbItem.id} className="bg-ink-800/50 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold font-mono text-ink-200">镜头 {sbItem.order}</span>
                      <span className="text-xs text-ink-500 truncate max-w-md">{sbItem.visualDescription || ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isNotReady && (
                        <span className="text-[10px] font-semibold text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full">
                          素材未齐备
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${itemMs.bg} ${itemMs.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${itemMs.dot}`} />
                        {itemMs.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${itemRs.bg} ${itemRs.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${itemRs.dot}`} />
                        {itemRs.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-[10px] text-ink-400 tracking-wider uppercase">画面描述</span>
                      <p className="text-xs text-ink-200 mt-1 leading-relaxed">{sbItem.visualDescription || '—'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-400 tracking-wider uppercase">台词</span>
                      <p className="text-xs text-amber-300/80 mt-1 leading-relaxed italic font-body">
                        {sbItem.dialogue ? `「${sbItem.dialogue}」` : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-[10px] text-ink-400 tracking-wider uppercase">时长</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock size={12} className="text-ink-400" />
                        <span className="text-xs text-ink-200 font-mono">{sbItem.duration}s</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-400 tracking-wider uppercase">配乐建议</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Music size={12} className="text-ink-400" />
                        <span className="text-xs text-ink-200">{sbItem.musicSuggestion || '—'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-400 tracking-wider uppercase">拍摄备注</span>
                      <div className="flex items-start gap-1.5 mt-1">
                        <Camera size={12} className="text-ink-400 mt-0.5 shrink-0" />
                        <span className="text-xs text-ink-200 leading-relaxed">{sbItem.shootingNotes || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {isNotReady && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2">
                      <AlertTriangle size={16} className="text-red-400 shrink-0" />
                      <span className="text-xs text-red-300 font-medium">素材缺口：当前状态为「{itemMs.label}」，尚未齐备</span>
                    </div>
                  )}

                  <div className="bg-ink-700/30 rounded-xl p-3 flex items-center justify-between mb-4">
                    <span className="text-xs text-ink-400">剪辑结论</span>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-0.5 rounded-full ${itemRs.bg} ${itemRs.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${itemRs.dot}`} />
                        {itemRs.label}
                      </span>
                      {sbItem.reviewNotes && (
                        <span className="text-xs text-ink-400">{sbItem.reviewNotes}</span>
                      )}
                    </div>
                  </div>

                  {hasComments && (
                    <div className="pt-4 border-t border-ink-700">
                      <h3 className="text-xs font-semibold text-ink-300 mb-3">评论摘要</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(['director', 'writer', 'camera', 'editor'] as Role[]).map(role => {
                          const comment = latestByRole[role];
                          if (!comment) return null;
                          const roleConfig = ROLE_CONFIG[role];
                          return (
                            <div key={role} className={`${roleConfig.bg} rounded-xl p-3`}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`w-2 h-2 rounded-full ${roleConfig.dot}`} />
                                <span className={`text-[11px] font-semibold ${roleConfig.color}`}>{roleConfig.label}</span>
                                <span className="text-[10px] text-ink-500">{comment.authorName}</span>
                              </div>
                              <p className="text-xs text-ink-300 leading-relaxed">{comment.content}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="bg-ink-800/50 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <ClipboardCheck size={18} className="text-amber-400" />
                <h2 className="text-sm font-semibold text-ink-200">交付签收</h2>
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${dsConfig.bg} ${dsConfig.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dsConfig.dot}`} />
                  {dsConfig.label}
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-ink-400 tracking-wider uppercase block mb-1.5">签收人姓名</label>
                    <input
                      type="text"
                      value={signOffName}
                      onChange={e => setSignOffName(e.target.value)}
                      className="w-full px-3 py-2 bg-ink-700/50 border border-ink-600 rounded-lg text-xs text-ink-200 placeholder-ink-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      placeholder="请输入姓名"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-ink-400 tracking-wider uppercase block mb-1.5">签收人角色</label>
                    <select
                      value={signOffRole}
                      onChange={e => setSignOffRole(e.target.value as Role)}
                      className="w-full px-3 py-2 bg-ink-700/50 border border-ink-600 rounded-lg text-xs text-ink-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="director">编导</option>
                      <option value="writer">文案</option>
                      <option value="camera">拍摄</option>
                      <option value="editor">剪辑</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-ink-400 tracking-wider uppercase block mb-1.5">签收方身份</label>
                  <div className="flex items-center gap-2">
                    {(['client', 'responsible', 'internal'] as SignOffParty[]).map(party => {
                      const pc = SIGN_OFF_PARTY_CONFIG[party];
                      return (
                        <button key={party} onClick={() => setSignOffParty(party)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            signOffParty === party ? `${pc.bg} ${pc.color} ring-1 ring-current/30` : 'bg-ink-700/50 text-ink-400 hover:text-ink-200'
                          }`}>
                          {pc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-ink-400 tracking-wider uppercase block mb-1.5">签收状态</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSignOffStatus('approved')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                        signOffStatus === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50'
                          : 'bg-ink-700/50 text-ink-400 hover:text-ink-200'
                      }`}
                    >
                      <CheckCircle size={14} />
                      已通过
                    </button>
                    <button
                      onClick={() => setSignOffStatus('rejected')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                        signOffStatus === 'rejected'
                          ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50'
                          : 'bg-ink-700/50 text-ink-400 hover:text-ink-200'
                      }`}
                    >
                      <XCircle size={14} />
                      退回修改
                    </button>
                  </div>
                </div>

                {signOffStatus === 'rejected' && (
                  <div>
                    <p className="text-[10px] text-ink-500 mb-2">不勾选分镜则默认整包退回</p>
                    <label className="text-[10px] text-ink-400 tracking-wider uppercase block mb-1.5">退回分镜</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {storyboards.map(sbItem => (
                        <label key={sbItem.id} className="flex items-center gap-2 px-3 py-2 bg-ink-700/30 rounded-lg cursor-pointer hover:bg-ink-700/50 transition-colors">
                          <input
                            type="checkbox"
                            checked={rejectedIds.includes(sbItem.id)}
                            onChange={() => toggleRejectedId(sbItem.id)}
                            className="w-3.5 h-3.5 rounded border-ink-500 bg-ink-700 text-red-500 focus:ring-red-500/50"
                          />
                          <span className="text-[11px] text-ink-300">
                            <span className="font-mono text-ink-200">{sbItem.order}</span>
                            {' '}{sbItem.visualDescription?.slice(0, 20) || '—'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] text-ink-400 tracking-wider uppercase block mb-1.5">签收意见</label>
                  <textarea
                    value={signOffNotes}
                    onChange={e => setSignOffNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-ink-700/50 border border-ink-600 rounded-lg text-xs text-ink-200 placeholder-ink-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                    placeholder="请输入签收意见..."
                  />
                </div>

                <button
                  onClick={handleSignOff}
                  disabled={!signOffName.trim()}
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-450 text-ink-900 text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  提交签收
                </button>
              </div>

              {deliverySignOffs.length > 0 && (
                <div className="mt-6 pt-6 border-t border-ink-700">
                  <h3 className="text-xs font-semibold text-ink-300 mb-3">签收历史</h3>
                  <div>
                    {deliverySignOffs.map((so, index) => {
                      const soConfig = DELIVERY_STATUS_CONFIG[so.status];
                      const soRoleConfig = ROLE_CONFIG[so.signerRole];
                      const soPartyConfig = SIGN_OFF_PARTY_CONFIG[so.signerParty];
                      return (
                        <div key={so.id} className="relative pl-6 pb-6">
                          {index < deliverySignOffs.length - 1 && (
                            <div className="absolute left-[7px] top-3 bottom-0 w-px bg-ink-700" />
                          )}
                          <div className="absolute left-0 top-1 w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center"
                            style={{ borderColor: so.status === 'approved' ? '#34d399' : so.status === 'rejected' ? '#f87171' : '#94a3b8' }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: so.status === 'approved' ? '#34d399' : so.status === 'rejected' ? '#f87171' : '#94a3b8' }} />
                          </div>
                          <div className="bg-ink-700/30 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${soConfig.bg} ${soConfig.color}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${soConfig.dot}`} />
                                  {soConfig.label}
                                </span>
                                <span className="text-xs font-medium text-ink-200">{so.signerName}</span>
                                <span className={`text-[10px] font-medium ${soRoleConfig.color}`}>{soRoleConfig.label}</span>
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${soPartyConfig.bg} ${soPartyConfig.color}`}>{soPartyConfig.label}</span>
                              </div>
                              <span className="text-[10px] text-ink-500">{new Date(so.createdAt).toLocaleString('zh-CN')}</span>
                            </div>
                            {so.notes && <p className="text-xs text-ink-400 mt-1">{so.notes}</p>}
                            {so.rejectedStoryboardIds.length > 0 && (
                              <div className="mt-2 flex items-center gap-1 flex-wrap">
                                <span className="text-[10px] text-ink-500">退回分镜：</span>
                                {so.rejectedStoryboardIds.map(id => {
                                  const rSb = storyboards.find(s => s.id === id);
                                  return rSb ? (
                                    <span key={id} className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">镜头{rSb.order}</span>
                                  ) : null;
                                })}
                              </div>
                            )}
                            {so.status === 'rejected' && so.rejectedStoryboardIds.length === 0 && (
                              <div className="mt-2">
                                <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">整包退回</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInLeft {
          0% { transform: translateX(-30px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
