import { useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Film, Image, Music, X, Check, Circle, FolderOpen } from 'lucide-react';

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

export default function MaterialManagement() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const store = useProjectStore();

  const project = store.projects.find(p => p.id === projectId);
  const storyboards = store.getProjectStoryboards(projectId!);

  const allMaterials = storyboards.flatMap(sb => store.getStoryboardMaterials(sb.id));
  const readyCount = storyboards.filter(sb => sb.materialReady).length;
  const totalStoryboards = storyboards.length;
  const progressPercent = totalStoryboards > 0 ? Math.round((readyCount / totalStoryboards) * 100) : 0;

  const handleUpload = (storyboardId: string) => {
    const fileName = window.prompt('请输入素材文件名（含扩展名，如 clip.mp4）：');
    if (!fileName?.trim()) return;
    const fileType = getFileType(fileName.trim());
    store.addMaterial(storyboardId, fileName.trim(), fileType);
  };

  const handleDelete = (materialId: string) => {
    store.deleteMaterial(materialId);
  };

  const handleToggleReady = (storyboardId: string, current: boolean) => {
    store.updateStoryboard(storyboardId, { materialReady: !current });
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-ink-900 flex items-center justify-center text-gray-400">
        <FolderOpen size={48} className="mb-4 opacity-40" />
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

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-4 h-full" style={{ minWidth: 'max-content' }}>
          {storyboards.map((sb, index) => {
            const materials = store.getStoryboardMaterials(sb.id);
            return (
              <div
                key={sb.id}
                className="w-[280px] bg-ink-800 rounded-xl border border-ink-700 flex flex-col shrink-0 max-h-full"
              >
                <div className="px-4 pt-4 pb-3 border-b border-ink-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-amber-400">#{index + 1}</span>
                    <button
                      onClick={() => handleToggleReady(sb.id, sb.materialReady)}
                      className="flex items-center gap-1 text-xs cursor-pointer group"
                    >
                      {sb.materialReady ? (
                        <>
                          <Check size={16} className="text-green-400" />
                          <span className="text-green-400">已齐备</span>
                        </>
                      ) : (
                        <>
                          <Circle size={16} className="text-gray-500 group-hover:text-gray-300" />
                          <span className="text-gray-500 group-hover:text-gray-300">未齐备</span>
                        </>
                      )}
                    </button>
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
                <FolderOpen size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">暂无分镜，请先创建分镜</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
