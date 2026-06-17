import type { Member, NarrativeTemplate, Project, Storyboard, Comment, Material, VersionRecord, LibraryScript } from '@/types';

export const MOCK_MEMBERS: Member[] = [
  { id: 'm1', name: '张导', role: 'director', avatar: '🎬', color: '#8B5CF6' },
  { id: 'm2', name: '李文', role: 'writer', avatar: '✍️', color: '#3B82F6' },
  { id: 'm3', name: '王摄', role: 'camera', avatar: '📷', color: '#EF4444' },
  { id: 'm4', name: '赵剪', role: 'editor', avatar: '🎞️', color: '#10B981' },
];

export const MOCK_TEMPLATES: NarrativeTemplate[] = [
  {
    id: 't1',
    name: '钩子开头',
    description: '3秒黄金钩子抓住注意力，再展开核心内容，适合知识科普、种草类视频',
    category: '开头技巧',
    icon: '🎣',
    storyboardStructure: [
      { visualDescription: '钩子画面：冲击性/反常识画面', dialogue: '你知道吗？90%的人都做错了！', duration: 3, musicSuggestion: '节奏感强的音效' },
      { visualDescription: '过渡画面：引出主题', dialogue: '今天就来告诉你正确的方法', duration: 5, musicSuggestion: '轻快BGM起' },
      { visualDescription: '核心内容：干货展示', dialogue: '', duration: 30, musicSuggestion: '轻快BGM' },
      { visualDescription: '总结+CTA', dialogue: '关注我，了解更多技巧', duration: 5, musicSuggestion: 'BGM渐弱' },
    ],
  },
  {
    id: 't2',
    name: '反转结尾',
    description: '前半段铺垫常规认知，结尾出人意料反转，适合搞笑、剧情类视频',
    category: '结尾技巧',
    icon: '🔄',
    storyboardStructure: [
      { visualDescription: '开场：日常场景', dialogue: '', duration: 5, musicSuggestion: '轻松日常BGM' },
      { visualDescription: '铺垫：建立预期', dialogue: '', duration: 15, musicSuggestion: '轻松BGM持续' },
      { visualDescription: '升级：矛盾加剧', dialogue: '', duration: 10, musicSuggestion: 'BGM加快节奏' },
      { visualDescription: '反转：出人意料', dialogue: '', duration: 5, musicSuggestion: '反转音效+搞笑BGM' },
    ],
  },
  {
    id: 't3',
    name: '前后呼应',
    description: '开头和结尾形成闭环，首尾呼应增强记忆，适合情感、品牌类视频',
    category: '结构技巧',
    icon: '🔁',
    storyboardStructure: [
      { visualDescription: '开头画面：建立情感基调', dialogue: '', duration: 5, musicSuggestion: '抒情BGM' },
      { visualDescription: '展开：故事推进', dialogue: '', duration: 20, musicSuggestion: '抒情BGM' },
      { visualDescription: '高潮：情感爆发', dialogue: '', duration: 10, musicSuggestion: 'BGM高潮' },
      { visualDescription: '呼应：回到开头画面', dialogue: '', duration: 5, musicSuggestion: 'BGM渐弱呼应' },
    ],
  },
  {
    id: 't4',
    name: '问题-解决',
    description: '提出痛点→分析原因→给出方案，适合干货、教程类视频',
    category: '叙事结构',
    icon: '💡',
    storyboardStructure: [
      { visualDescription: '痛点画面：展示问题', dialogue: '你是不是也遇到过这个问题？', duration: 5, musicSuggestion: '疑问音效' },
      { visualDescription: '分析：原因剖析', dialogue: '其实是因为……', duration: 15, musicSuggestion: '思考BGM' },
      { visualDescription: '方案：步骤演示', dialogue: '只需要三步就能解决', duration: 20, musicSuggestion: '轻快BGM' },
      { visualDescription: '效果对比+CTA', dialogue: '试试看吧！关注获取更多', duration: 5, musicSuggestion: 'BGM结束' },
    ],
  },
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: '5分钟学会手机摄影',
    type: '知识',
    templateId: 't4',
    coverGradient: 'from-amber-600 to-orange-500',
    createdAt: '2026-06-15T10:00:00Z',
    updatedAt: '2026-06-18T08:30:00Z',
    members: ['m1', 'm2', 'm3', 'm4'],
  },
  {
    id: 'p2',
    name: '深夜食堂·第3期',
    type: '美食',
    templateId: 't3',
    coverGradient: 'from-purple-600 to-pink-500',
    createdAt: '2026-06-10T14:00:00Z',
    updatedAt: '2026-06-17T16:20:00Z',
    members: ['m1', 'm2', 'm3'],
  },
  {
    id: 'p3',
    name: '职场反转喜剧合集',
    type: '搞笑',
    templateId: 't2',
    coverGradient: 'from-blue-600 to-cyan-500',
    createdAt: '2026-06-08T09:00:00Z',
    updatedAt: '2026-06-16T11:45:00Z',
    members: ['m1', 'm2'],
  },
];

export const MOCK_STORYBOARDS: Storyboard[] = [
  {
    id: 's1', projectId: 'p1', order: 1,
    visualDescription: '手机拍摄糊片的特写，手指抖动',
    dialogue: '你拍的照片总是糊的？90%的人不知道这个技巧！',
    duration: 3, musicSuggestion: '疑问音效+节奏鼓点',
    shootingNotes: '需要微距镜头，手持抖动效果', materialReady: true,
  },
  {
    id: 's2', projectId: 'p1', order: 2,
    visualDescription: '展示错误握持姿势，标红标注',
    dialogue: '问题出在你的握持方式上，这样拿手机肯定会抖',
    duration: 8, musicSuggestion: '轻快BGM起',
    shootingNotes: '需要绿幕后期标注', materialReady: true,
  },
  {
    id: 's3', projectId: 'p1', order: 3,
    visualDescription: '正确握持演示，三步拆解',
    dialogue: '第一步，双手持机；第二步，手肘贴紧身体；第三步，利用音量键拍照',
    duration: 15, musicSuggestion: '轻快BGM持续',
    shootingNotes: '需要俯拍+侧面两个机位', materialReady: false,
  },
  {
    id: 's4', projectId: 'p1', order: 4,
    visualDescription: '前后对比：糊片vs清晰照片',
    dialogue: '看到区别了吗？简单三步，出片率提升10倍',
    duration: 8, musicSuggestion: 'BGM渐强',
    shootingNotes: '需要分屏对比效果', materialReady: false,
  },
  {
    id: 's5', projectId: 'p1', order: 5,
    visualDescription: '关注引导+更多技巧预告',
    dialogue: '关注我，下期教你夜景怎么拍！',
    duration: 4, musicSuggestion: '结尾音效+BGM渐弱',
    shootingNotes: '口播+贴纸动画', materialReady: false,
  },
  {
    id: 's6', projectId: 'p2', order: 1,
    visualDescription: '深夜厨房暖光，食材特写',
    dialogue: '又是一个加班到深夜的日子…',
    duration: 5, musicSuggestion: '温柔钢琴BGM',
    shootingNotes: '暖色调灯光，蒸汽效果', materialReady: true,
  },
  {
    id: 's7', projectId: 'p2', order: 2,
    visualDescription: '烹饪过程：切菜、下锅、翻炒',
    dialogue: '但一碗热面，足以治愈一切',
    duration: 20, musicSuggestion: '温柔BGM+白噪音',
    shootingNotes: '需要慢动作特写', materialReady: true,
  },
  {
    id: 's8', projectId: 'p2', order: 3,
    visualDescription: '成品展示，热气腾腾的面',
    dialogue: '深夜食堂，为你而开',
    duration: 8, musicSuggestion: 'BGM高潮',
    shootingNotes: '需要升格拍摄蒸汽', materialReady: false,
  },
  {
    id: 's9', projectId: 'p3', order: 1,
    visualDescription: '办公室日常，同事A在认真工作',
    dialogue: '今天老板说要表扬一个人…',
    duration: 5, musicSuggestion: '日常轻松BGM',
    shootingNotes: '工位实拍', materialReady: false,
  },
  {
    id: 's10', projectId: 'p3', order: 2,
    visualDescription: '同事B疯狂拍马屁',
    dialogue: '那肯定是我啦！我最近加班最多！',
    duration: 10, musicSuggestion: 'BGM加快',
    shootingNotes: '夸张表情特写', materialReady: false,
  },
  {
    id: 's11', projectId: 'p3', order: 3,
    visualDescription: '老板宣布结果，指向同事A',
    dialogue: '我表扬的是小张，他默默把项目做完了',
    duration: 5, musicSuggestion: '反转音效',
    shootingNotes: '需要面部表情快速切换', materialReady: false,
  },
];

export const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1', storyboardId: 's1', authorId: 'm1', authorName: '张导', authorRole: 'director',
    content: '开头3秒必须有冲击力，建议加一个糊片抖动的特写', mentionIds: ['m3'],
    createdAt: '2026-06-16T10:00:00Z',
  },
  {
    id: 'c2', storyboardId: 's1', authorId: 'm3', authorName: '王摄', authorRole: 'camera',
    content: '收到，我会用微距拍手持抖动的画面',
    mentionIds: [],
    createdAt: '2026-06-16T10:30:00Z',
  },
  {
    id: 'c3', storyboardId: 's3', authorId: 'm2', authorName: '李文', authorRole: 'writer',
    content: '台词可以再精简一些，"利用音量键拍照"可以改成"用音量键当快门"',
    mentionIds: ['m1'],
    createdAt: '2026-06-17T09:00:00Z',
  },
  {
    id: 'c4', storyboardId: 's3', authorId: 'm1', authorName: '张导', authorRole: 'director',
    content: '同意，这样更口语化 @李文', mentionIds: ['m2'],
    createdAt: '2026-06-17T09:15:00Z',
  },
  {
    id: 'c5', storyboardId: 's3', authorId: 'm3', authorName: '王摄', authorRole: 'camera',
    content: '这个分镜需要两个机位，俯拍和侧面，我需要带三脚架',
    mentionIds: [],
    createdAt: '2026-06-17T11:00:00Z',
  },
  {
    id: 'c6', storyboardId: 's5', authorId: 'm4', authorName: '赵剪', authorRole: 'editor',
    content: '结尾配乐建议用渐弱而不是突然停止，更有余韵感',
    mentionIds: [],
    createdAt: '2026-06-18T08:00:00Z',
  },
];

export const MOCK_MATERIALS: Material[] = [
  { id: 'mat1', storyboardId: 's1', fileName: '镜头1_抖动特写.mp4', fileUrl: '#', fileType: 'video', uploadedAt: '2026-06-17T14:00:00Z', uploadedBy: 'm3' },
  { id: 'mat2', storyboardId: 's1', fileName: '镜头1_备选角度.mp4', fileUrl: '#', fileType: 'video', uploadedAt: '2026-06-17T14:30:00Z', uploadedBy: 'm3' },
  { id: 'mat3', storyboardId: 's2', fileName: '镜头2_错误握持.mp4', fileUrl: '#', fileType: 'video', uploadedAt: '2026-06-17T15:00:00Z', uploadedBy: 'm3' },
  { id: 'mat4', storyboardId: 's6', fileName: '深夜厨房空镜.mp4', fileUrl: '#', fileType: 'video', uploadedAt: '2026-06-16T20:00:00Z', uploadedBy: 'm3' },
  { id: 'mat5', storyboardId: 's7', fileName: '烹饪过程主镜头.mp4', fileUrl: '#', fileType: 'video', uploadedAt: '2026-06-16T20:30:00Z', uploadedBy: 'm3' },
  { id: 'mat6', storyboardId: 's6', fileName: '食材特写.jpg', fileUrl: '#', fileType: 'image', uploadedAt: '2026-06-16T19:00:00Z', uploadedBy: 'm3' },
];

export const MOCK_VERSIONS: VersionRecord[] = [
  { id: 'v1', storyboardId: 's1', field: 'dialogue', oldValue: '你的照片为什么总是糊？', newValue: '你拍的照片总是糊的？90%的人不知道这个技巧！', operatorId: 'm2', operatorName: '李文', timestamp: '2026-06-16T09:00:00Z' },
  { id: 'v2', storyboardId: 's1', field: 'duration', oldValue: '5', newValue: '3', operatorId: 'm1', operatorName: '张导', timestamp: '2026-06-16T09:30:00Z' },
  { id: 'v3', storyboardId: 's3', field: 'dialogue', oldValue: '第一步双手持机，第二步手肘贴紧身体，第三步用音量键拍照', newValue: '第一步，双手持机；第二步，手肘贴紧身体；第三步，利用音量键拍照', operatorId: 'm2', operatorName: '李文', timestamp: '2026-06-17T09:05:00Z' },
  { id: 'v4', storyboardId: 's4', field: 'visualDescription', oldValue: '对比效果展示', newValue: '前后对比：糊片vs清晰照片', operatorId: 'm1', operatorName: '张导', timestamp: '2026-06-17T14:00:00Z' },
  { id: 'v5', storyboardId: 's5', field: 'musicSuggestion', oldValue: '结尾音效', newValue: '结尾音效+BGM渐弱', operatorId: 'm4', operatorName: '赵剪', timestamp: '2026-06-18T08:10:00Z' },
];

export const MOCK_LIBRARY: LibraryScript[] = [
  { id: 'l1', projectId: 'p2', category: '美食', archivedAt: '2026-06-17T12:00:00Z' },
  { id: 'l2', projectId: 'p3', category: '搞笑', archivedAt: '2026-06-16T18:00:00Z' },
];
