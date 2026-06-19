/**
 * 和润心语者 — Aged Mental Health Service Provider
 * Training modules, registration types, implementation protocols, and feedback types.
 * Part of SilverConnect China Platform.
 */

export type LessonType = 'video' | 'reading' | 'quiz' | 'practice'
export type ModuleColor = 'green' | 'purple' | 'blue' | 'red' | 'amber'

export interface TrainingLesson {
  id: string
  title: string
  duration: string
  type: LessonType
}

export interface TrainingModule {
  id: string
  title: string
  description: string
  totalHours: number
  badge: string
  color: ModuleColor
  lessons: TrainingLesson[]
}

export const TRAINING_MODULES: TrainingModule[] = [
  {
    id: 'M1', title: '情感陪伴基础',
    description: '和润心语者的核心理念、职业伦理与基本陪伴框架。',
    totalHours: 4, badge: '🌱', color: 'green',
    lessons: [
      { id: 'M1-1', title: '和润心语者的使命与价值观', duration: '45分钟', type: 'video' },
      { id: 'M1-2', title: '职业伦理与服务边界', duration: '60分钟', type: 'reading' },
      { id: 'M1-3', title: '情感陪伴 vs. 心理治疗：区别与联系', duration: '45分钟', type: 'video' },
      { id: 'M1-4', title: '基础理念评估测试', duration: '30分钟', type: 'quiz' },
    ],
  },
  {
    id: 'M2', title: '老龄心理学',
    description: '老龄化心理变化、常见精神健康问题及应对策略。',
    totalHours: 4, badge: '🧠', color: 'purple',
    lessons: [
      { id: 'M2-1', title: '老龄化的心理特征', duration: '60分钟', type: 'video' },
      { id: 'M2-2', title: '孤独感、丧失与哀伤辅导', duration: '60分钟', type: 'reading' },
      { id: 'M2-3', title: '认知退化与沟通策略', duration: '45分钟', type: 'video' },
      { id: 'M2-4', title: '老年心理案例分析实践', duration: '45分钟', type: 'practice' },
      { id: 'M2-5', title: '老龄心理学证书测试', duration: '30分钟', type: 'quiz' },
    ],
  },
  {
    id: 'M3', title: '沟通技巧与同理心',
    description: '积极倾听、非暴力沟通和情感反映技术。',
    totalHours: 6, badge: '💬', color: 'blue',
    lessons: [
      { id: 'M3-1', title: '积极倾听的艺术', duration: '60分钟', type: 'video' },
      { id: 'M3-2', title: '非暴力沟通（NVC）基础', duration: '60分钟', type: 'reading' },
      { id: 'M3-3', title: '情感反映与共情技术', duration: '60分钟', type: 'video' },
      { id: 'M3-4', title: '文化敏感性与多样性', duration: '45分钟', type: 'reading' },
      { id: 'M3-5', title: '模拟陪伴会话角色演练', duration: '90分钟', type: 'practice' },
      { id: 'M3-6', title: '沟通技巧综合评估测试', duration: '45分钟', type: 'quiz' },
    ],
  },
  {
    id: 'M4', title: '危机识别与干预',
    description: '识别危机信号，掌握干预流程和紧急上报机制。',
    totalHours: 3, badge: '🚨', color: 'red',
    lessons: [
      { id: 'M4-1', title: '抑郁与自杀风险评估', duration: '60分钟', type: 'video' },
      { id: 'M4-2', title: '危机干预的SAFER模型', duration: '45分钟', type: 'reading' },
      { id: 'M4-3', title: '紧急联络与上报流程', duration: '30分钟', type: 'video' },
      { id: 'M4-4', title: '危机干预实战演练', duration: '45分钟', type: 'practice' },
    ],
  },
  {
    id: 'M5', title: '数字工具与隐私保护',
    description: '熟练使用SilverConnect工具，遵守个人信息保护法规。',
    totalHours: 2, badge: '🔒', color: 'amber',
    lessons: [
      { id: 'M5-1', title: 'SilverConnect平台使用指南', duration: '45分钟', type: 'video' },
      { id: 'M5-2', title: '个人信息保护法（PIPL）要点', duration: '45分钟', type: 'reading' },
      { id: 'M5-3', title: '数字工具认证测试', duration: '30分钟', type: 'quiz' },
    ],
  },
]

export const TOTAL_HOURS = TRAINING_MODULES.reduce((s, m) => s + m.totalHours, 0)
export const TOTAL_LESSONS = TRAINING_MODULES.reduce((s, m) => s + m.lessons.length, 0)

export const SERVICE_TYPES = [
  { id: 'ai_companion',       label: 'AI心语陪伴',  icon: '🤖', desc: '微信/电话情感陪伴服务' },
  { id: 'digital_biography',  label: '家庭数字传记', icon: '📖', desc: '人生故事整理与影像制作' },
  { id: 'grief_support',      label: '哀伤辅导',  icon: '🕊️', desc: '失亲失能后的心理支持' },
  { id: 'dementia_companion', label: '认知症陪伴', icon: '🌸', desc: '轻中度认知退化长者陪伴' },
  { id: 'insurance_support',  label: '保险增值服务', icon: '🛡️', desc: '长者关怀与家属情感支持' },
  { id: 'medical_liaison',    label: '医管协助',  icon: '🏥', desc: '医患沟通与就医陪伴' },
]

export const CITIES = [
  '上海', '北京', '广州', '深圳', '成都', '武汉', '杭州', '南京', '西安', '重庆', '沈阳', '青岛', '山东', '广西', '云南', '其他',
]

export const IMPLEMENTATION_PROTOCOLS = [
  {
    id: 'first-contact',
    title: '首次联系指南',
    icon: '🤝',
    color: 'blue',
    description: '与长者建立第一次服务接触时的标准流程。',
    steps: [
      '自我介绍与角色说明（心语者，非医疗人员）',
      '了解长者基本情况与当前需求',
      '签署服务知情同意书（数字版）',
      '确定联系方式与频率偏好',
      '告知紧急情况处理程序',
      '记录初次评估内容至系统',
    ],
  },
  {
    id: 'session-framework',
    title: '情感支持会话框架',
    icon: '🗣️',
    color: 'green',
    description: '每次陪伴会话的标准结构与边界管理。',
    steps: [
      '开场暖场：问候近况、天气、身体',
      '跟进上次会话内容（连续性建立信任）',
      '本次主题探讨：情感/回忆/需求',
      '情感反映与共情回应',
      '资源连接（如需转介）',
      '总结与下次约定',
      '会后记录：情绪状态评分、关键信息',
    ],
  },
  {
    id: 'crisis-response',
    title: '危机响应流程',
    icon: '🚨',
    color: 'red',
    description: '识别高风险信号并立即启动干预的步骤。',
    steps: [
      '保持关心冷静，使用SAFER评估框架',
      '不挂断电话/微信，持续陪伴',
      '评估立即风险等级（低/中/高）',
      '高风险：立即联系家属 + 拨打120',
      '中风险：升级至督导，24h内跟进',
      '低风险：记录、加密跟进频率',
      '事后填写危机事件报告（系统必填）',
    ],
  },
  {
    id: 'biography-interview',
    title: '数字传记采访指南',
    icon: '📘',
    color: 'amber',
    description: '与高净值家庭进行人生故事采访和整理的标准流程。',
    steps: [
      '预读客户基本信息与人生大事',
      '开场：评估情绪状态和选择开始的时间段',
      '开放式问题引导（欺凌、不评价）',
      '关注五个主题：家庭、事业、信仰、成就、溃望',
      '录音/录像（签知情同意后）',
      'AI整理输出初稿，客户确认与修改',
      '终稿、家族档案交付',
    ],
  },
]

export interface ProviderRegistrationData {
  name: string
  gender: string
  phone: string
  email: string
  city: string
  education: string
  major: string
  university: string
  licenseType: string
  licenseNumber: string
  yearsExperience: number
  serviceTypes: string[]
  bio: string
  agreeTerms: boolean
  agreeBackground: boolean
}

export interface FeedbackData {
  sessionDate: string
  sessionType: string
  clientAlias: string
  overallRating: number
  professionalismRating: number
  empathyRating: number
  effectivenessRating: number
  strengths: string
  improvements: string
  specialNotes: string
}
