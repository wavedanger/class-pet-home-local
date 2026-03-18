export type Id = string

// 宠物 id：为了支持“50 种宠物”可持续扩展，这里使用 string
export type PetId = string

export type ScoreKind = 'plus' | 'minus'

export type ScoreCategory = '学习' | '行为' | '健康' | '其他'

export type ScoreRule = {
  id: Id
  title: string
  delta: number // 正为加分，负为扣分
  category: ScoreCategory
  enabled: boolean
}

export type PetState = {
  petId: PetId
  name: string
  level: number // 1..10
  exp: number
}

export type Student = {
  id: Id
  name: string
  number?: string
  points: number
  badges: number
  pet?: PetState
}

export type Classroom = {
  id: Id
  name: string
  students: Student[]
}

export type ScoreRecord = {
  id: Id
  ts: number
  classroomId: Id
  studentId: Id
  kind: ScoreKind
  delta: number
  ruleTitle: string
  category: ScoreCategory
  // 用于“撤回评价”：记录操作前的学生关键状态（兼容旧数据可缺省）
  before?: {
    points: number
    badges: number
    pet?: PetState
  }
}

export type ShopItemCategory = '美食' | '文具' | '娱乐' | '特权' | '杂项'

export type ShopItem = {
  id: Id
  title: string
  description: string
  priceBadges: number
  stock: number // -1 表示无限库存
  category: ShopItemCategory
  icon: string // emoji/icon 占位
  enabled: boolean
}

export type ShopRecordStatus = 'success' | 'cancelled'

export type ShopRecord = {
  id: Id
  ts: number
  classroomId: Id
  studentId: Id
  itemId: Id
  itemTitle: string
  costBadges: number
  status: ShopRecordStatus
}

export type GrowthConfig = {
  // thresholds[i] 表示 Lv.(i+1) -> Lv.(i+2) 所需成长值
  thresholds: number[]
  maxLevel: number
  // 满级后每获得多少成长值奖励 1 枚徽章
  badgeEveryExp: number
}

export type AppData = {
  version: 1
  activeClassroomId: Id
  classrooms: Classroom[]
  rules: ScoreRule[]
  records: ScoreRecord[]
  shopItems: ShopItem[]
  shopRecords: ShopRecord[]
  growth: GrowthConfig
}

export function newId(prefix = 'id'): Id {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

export function expToNext(level: number): number {
  // 轻量可调的升级曲线：Lv1 需要 40，之后逐级 +20
  return 40 + (Math.max(1, level) - 1) * 20
}

