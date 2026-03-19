<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import { useAppStore } from '@/stores/app'
import type { ScoreCategory, ScoreRule } from '@/lib/models'
import ModalBase from '@/components/modals/ModalBase.vue'

const app = useAppStore()
type Tab = 'rules' | 'growth' | 'data' | 'about'
const tab = ref<Tab>('rules')
watch(
  () => tab.value,
  (v) => {
    if (v === 'data') void initAutoBackupPanel()
  },
  { immediate: true }
)

// --- 规则页
const categories = computed(() => {
  const map = new Map<ScoreCategory, { plus: number; minus: number; total: number }>()
  for (const r of app.data.rules) {
    const cur = map.get(r.category) ?? { plus: 0, minus: 0, total: 0 }
    cur.total += 1
    if (r.delta >= 0) cur.plus += 1
    else cur.minus += 1
    map.set(r.category, cur)
  }
  return (['学习', '行为', '健康', '其他'] as ScoreCategory[]).map((c) => ({
    category: c,
    ...(map.get(c) ?? { plus: 0, minus: 0, total: 0 }),
  }))
})
const activeCategory = ref<ScoreCategory>('学习')

const rulesOfActive = computed(() =>
  app.data.rules
    .filter((r) => r.category === activeCategory.value)
    .slice()
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
)
const ruleStats = computed(() => {
  let plus = 0
  let minus = 0
  for (const r of app.data.rules) {
    if (r.delta >= 0) plus += 1
    else minus += 1
  }
  return { plus, minus }
})

// 新增/编辑指标弹窗
const ruleEditorOpen = ref(false)
const isEditing = ref(false)
const ruleDraft = ref({
  id: null as null | string,
  icon: '⭐',
  title: '',
  category: '学习' as ScoreCategory,
  scope: 'all' as 'all' | 'class',
  kind: 'plus' as 'plus' | 'minus',
  deltaAbs: 1,
})

const iconPool = [
  '📘',
  '📗',
  '🧮',
  '✍️',
  '⭐',
  '🏆',
  '👍',
  '🧠',
  '💡',
  '🧩',
  '⏱️',
  '✅',
  '🫶',
  '🎯',
  '🧹',
  '🌱',
  '💪',
  '🥗',
  '🧼',
  '🩺',
  '⚠️',
  '🧯',
  '🚫',
  '🗣️',
  '🙂',
  '❤️',
  '🍎',
  '🏅',
]

function openCreateRule() {
  isEditing.value = false
  ruleDraft.value = {
    id: null,
    icon: '⭐',
    title: '',
    category: activeCategory.value,
    scope: 'all',
    kind: 'plus',
    deltaAbs: 1,
  }
  ruleEditorOpen.value = true
}

function openEditRule(r: ScoreRule) {
  isEditing.value = true
  ruleDraft.value = {
    id: r.id,
    icon: r.icon ?? '⭐',
    title: r.title ?? '',
    category: r.category,
    scope: (r.scope === 'class' ? 'class' : 'all') as 'all' | 'class',
    kind: r.delta >= 0 ? 'plus' : 'minus',
    deltaAbs: Math.max(1, Math.floor(Math.abs(r.delta || 1))),
  }
  ruleEditorOpen.value = true
}

const canSubmitRule = computed(() => {
  const title = ruleDraft.value.title.trim()
  const n = Number(ruleDraft.value.deltaAbs)
  return !!title && Number.isFinite(n) && n >= 1
})

function submitRule() {
  if (!canSubmitRule.value) return
  const abs = Math.max(1, Math.floor(Number(ruleDraft.value.deltaAbs)))
  const delta = ruleDraft.value.kind === 'plus' ? abs : -abs
  app.upsertScoreRule({
    id: ruleDraft.value.id ?? undefined,
    title: ruleDraft.value.title.trim(),
    delta,
    category: ruleDraft.value.category,
    icon: ruleDraft.value.icon,
    scope: ruleDraft.value.scope,
    enabled: true,
  })
  ruleEditorOpen.value = false
  msg.value = isEditing.value ? '已更新指标' : '已新增指标'
}

function removeRule(r: ScoreRule) {
  if (!confirm(`确定删除「${r.title}」吗？`)) return
  app.removeScoreRule(r.id)
  msg.value = '已删除指标'
}

// --- 成长页
const growthDraft = ref({
  thresholds: [] as number[],
  maxLevel: 10,
  badgeEveryExp: 200,
})
const msg = ref<string | null>(null)
const toastOpen = ref(false)
const toastText = ref('')
let toastTimer: number | null = null

watch(msg, (v) => {
  if (!v) return
  toastText.value = v
  toastOpen.value = true
  if (toastTimer) window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toastOpen.value = false
    msg.value = null
  }, 1800)
})

watchEffect(() => {
  // 进入弹窗时同步一次（避免刷新）
  growthDraft.value = {
    thresholds: [...app.data.growth.thresholds],
    maxLevel: app.data.growth.maxLevel,
    badgeEveryExp: app.data.growth.badgeEveryExp,
  }
})

function saveGrowth() {
  app.saveGrowthConfig({
    thresholds: growthDraft.value.thresholds,
    maxLevel: growthDraft.value.maxLevel,
    badgeEveryExp: growthDraft.value.badgeEveryExp,
  })
  msg.value = '已保存配置'
}

// --- 数据页
function resetAll() {
  if (!confirm('确定要重置吗？将清空所有学生的得分数据、历史评价记录等，此操作不可逆。')) return
  app.resetData()
  msg.value = '已重置'
}

// --- 导入/导出
const dataIoOpen = ref(false)
const importJson = ref('')
const importErr = ref<string | null>(null)

function openDataIo() {
  importJson.value = ''
  importErr.value = null
  dataIoOpen.value = true
}

async function copyExportJson() {
  const text = app.exportData()
  try {
    await navigator.clipboard.writeText(text)
    msg.value = '已复制到剪贴板'
  } catch {
    // fallback：仍然把内容放进输入框，方便手动复制
    importJson.value = text
    msg.value = '复制失败：已填充到文本框，请手动复制'
    dataIoOpen.value = true
  }
}

function downloadExportJson() {
  const text = app.exportData()
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const ts = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const name = `class-pet-home_${ts.getFullYear()}-${pad(ts.getMonth() + 1)}-${pad(ts.getDate())}.json`
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
  msg.value = '已导出文件'
}

function doImport() {
  importErr.value = null
  try {
    const text = importJson.value.trim()
    if (!text) {
      importErr.value = '请输入要导入的 JSON'
      return
    }
    app.importData(text)
    msg.value = '已导入并保存'
    dataIoOpen.value = false
  } catch (e: any) {
    importErr.value = e?.message ? String(e.message) : '导入失败：JSON 格式不正确或版本不支持'
  }
}

const autoBackupSupported = computed(() => (app as any).ui && true)
const fmtTs = (ts: number) => new Date(ts).toLocaleString('zh-CN')
const autoBackupIntervalDraft = ref<number | null>(null)

async function initAutoBackupPanel() {
  await app.refreshAutoBackupTarget()
  autoBackupIntervalDraft.value = app.ui.autoBackupIntervalSec || 60
}

function commitAutoBackupInterval() {
  const v = autoBackupIntervalDraft.value
  if (v === null || !Number.isFinite(Number(v))) {
    autoBackupIntervalDraft.value = app.ui.autoBackupIntervalSec || 60
    return
  }
  app.setAutoBackupIntervalSec(v)
  autoBackupIntervalDraft.value = app.ui.autoBackupIntervalSec || 60
}

async function toggleAutoBackup(next: boolean) {
  app.setAutoBackupEnabled(next)
  if (next) {
    await app.refreshAutoBackupTarget()
    if (app.ui.autoBackupHasTarget) {
      await app.runAutoBackupOnce()
      msg.value = '已开启自动备份'
    } else {
      msg.value = '已开启自动备份：请先选择备份文件'
    }
  } else {
    msg.value = '已关闭自动备份'
  }
}

async function pickAutoBackup() {
  try {
    await app.pickAutoBackupFile()
    msg.value = '已选择备份文件'
    if (app.ui.autoBackupEnabled) await app.runAutoBackupOnce()
  } catch (e: any) {
    const name = e?.name ? String(e.name) : ''
    const message = e?.message ? String(e.message) : ''
    // 用户点击“取消”属于正常流程，不提示错误
    if (name === 'AbortError' || /aborted/i.test(message)) {
      msg.value = '已取消选择'
      return
    }
    msg.value = message || '选择备份文件失败'
  }
}

async function clearAutoBackup() {
  await app.clearAutoBackupFile()
  msg.value = '已清除备份目标'
}
</script>

<template>
  <ModalBase @close="app.closeModal()">
    <template #title>⚙ 设置与帮助 <span class="chip-en">SETTINGS</span></template>

    <div class="content-wrap">
      <Transition name="toast">
        <div v-if="toastOpen" class="toast" role="status" aria-live="polite">
          <div class="toast-inner">
            <div class="toast-title">消息提示</div>
            <div class="toast-body">{{ toastText }}</div>
          </div>
        </div>
      </Transition>

      <div class="tabs">
        <button class="tab" :class="{ active: tab === 'rules' }" @click="tab = 'rules'">📋 加减分规则</button>
        <button class="tab" :class="{ active: tab === 'growth' }" @click="tab = 'growth'">📈 成长设置</button>
        <button class="tab" :class="{ active: tab === 'data' }" @click="tab = 'data'">🗃 数据管理</button>
        <button class="tab" :class="{ active: tab === 'about' }" @click="tab = 'about'">👥 软件与帮助</button>
      </div>

      <!-- 加减分规则 -->
      <div v-if="tab === 'rules'" class="panel">
      <div class="left">
        <button class="btn-blue" @click="openCreateRule">＋ 新增指标</button>
        <div class="mt-4 text-xs text-slate-500">分类目录</div>

        <div class="mt-2 space-y-2">
          <button
            v-for="c in categories"
            :key="c.category"
            class="cat"
            :class="{ active: activeCategory === c.category }"
            @click="activeCategory = c.category"
          >
            <div class="flex items-center justify-between">
              <div class="font-medium">{{ c.category }}</div>
              <div class="text-xs text-slate-500">{{ c.total }}</div>
            </div>
            <div class="mt-2 flex items-center gap-2 text-xs">
              <span class="dot green"></span> 加分 {{ c.plus }}
              <span class="dot red ml-3"></span> 减分 {{ c.minus }}
            </div>
          </button>
        </div>

        <div class="mt-6 border-t border-slate-100 pt-4 text-sm">
          <div class="text-xs text-slate-500 mb-2">规则统计</div>
          <div class="flex items-center justify-between">
            <div class="text-emerald-700">加分</div>
            <div class="font-semibold text-emerald-700">{{ ruleStats.plus }} 条</div>
          </div>
          <div class="mt-2 flex items-center justify-between">
            <div class="text-rose-700">减分</div>
            <div class="font-semibold text-rose-700">{{ ruleStats.minus }} 条</div>
          </div>
        </div>
      </div>

      <div class="right">
        <div class="right-head">
          <div class="flex items-center gap-3">
            <div class="bar"></div>
            <div class="font-semibold">{{ activeCategory }}类指标</div>
            <div class="text-xs text-slate-500">奖 {{ rulesOfActive.filter((r) => r.delta >= 0).length }} 罚 {{ rulesOfActive.filter((r) => r.delta < 0).length }}</div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          <div v-for="r in rulesOfActive" :key="r.id" class="rule-card">
            <div class="rule-content">
              <div class="rule-main">
                <div class="icon-box" aria-hidden="true">{{ r.icon ?? '⭐' }}</div>
                <div class="rule-title" :title="r.title">{{ r.title }}</div>
              </div>
              <div class="rule-delta">
                <button class="tag-all"  @click="openEditRule(r)">{{ r.scope === 'class' ? '本班' : '全部班级' }}</button>
                <div :class="r.delta >= 0 ? 'plus' : 'minus'">{{ r.delta >= 0 ? '+' : '' }}{{ r.delta }}</div>
              </div>
              <div class="rule-actions">
                <button class="mini" title="编辑" @click="openEditRule(r)">✎</button>
                <button class="mini" title="删除" @click="removeRule(r)">🗑</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <!-- 新增/编辑指标 -->
      <div v-if="ruleEditorOpen" class="sheet-mask" @click.self="ruleEditorOpen = false">
        <div class="sheet">
          <div class="sheet-head">
            <div class="text-lg font-semibold">{{ isEditing ? '编辑指标' : '新增指标' }}</div>
            <button class="x" @click="ruleEditorOpen = false">×</button>
          </div>

          <div class="sheet-body">
            <div class="label">图标</div>
            <div class="icon-grid">
              <button
                v-for="ic in iconPool"
                :key="ic"
                class="ic"
                :class="{ active: ruleDraft.icon === ic }"
                @click="ruleDraft.icon = ic"
              >
                {{ ic }}
              </button>
            </div>

            <div class="mt-4 label">指标名称</div>
            <input v-model="ruleDraft.title" class="field" placeholder="如：课堂发言" />

            <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div class="label">所属分类</div>
                <select v-model="ruleDraft.category" class="field">
                  <option value="学习">学习</option>
                  <option value="行为">行为</option>
                  <option value="健康">健康</option>
                  <option value="其他">其他</option>
                </select>
              </div>

              <div>
                <div class="label">生效范围</div>
                <div class="seg">
                  <button class="seg-btn" :class="{ active: ruleDraft.scope === 'all' }" @click="ruleDraft.scope = 'all'">全部</button>
                  <button class="seg-btn" :class="{ active: ruleDraft.scope === 'class' }" @click="ruleDraft.scope = 'class'">本班</button>
                </div>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div class="label">评价导向</div>
                <div class="seg">
                  <button class="seg-btn" :class="{ active: ruleDraft.kind === 'plus' }" @click="ruleDraft.kind = 'plus'">奖励</button>
                  <button class="seg-btn" :class="{ active: ruleDraft.kind === 'minus' }" @click="ruleDraft.kind = 'minus'">扣分</button>
                </div>
              </div>

              <div>
                <div class="label">分值设定</div>
                <div class="delta-wrap">
                  <span class="delta-sign" :class="ruleDraft.kind === 'plus' ? 'plus' : 'minus'">
                    {{ ruleDraft.kind === 'plus' ? '+' : '-' }}
                  </span>
                  <input v-model.number="ruleDraft.deltaAbs" type="number" min="1" step="1" class="field delta" />
                </div>
              </div>
            </div>
          </div>

          <div class="sheet-foot">
            <button class="btn-lite" @click="ruleEditorOpen = false">取消</button>
            <button class="btn-primary" :disabled="!canSubmitRule" @click="submitRule">
              {{ isEditing ? '确认保存' : '确认添加' }}
            </button>
          </div>
        </div>
      </div>

    <!-- 成长设置 -->
      <div v-else-if="tab === 'growth'" class="growth">
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="text-xl font-semibold">成长阶段设置</div>
          <div class="text-sm text-slate-500 mt-1">配置每个等级所需的成长值</div>
        </div>
        <button class="btn-green" @click="saveGrowth">✓ 保存配置</button>
      </div>

      <div class="hint-box mt-4">
        <div class="font-semibold flex items-center gap-2"><span>💡</span> 提示</div>
        <div class="mt-2 text-sm text-brand-800/80">
          这里的数值代表升级到该等级所需的成长值。例如 Lv.1 → Lv.2 需要 40 点积分，意味着学生在 Lv.1 级时积累 40 点积分即可升到 Lv.2 级。
        </div>
      </div>

      <div class="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div v-for="(v, idx) in growthDraft.thresholds" :key="idx" class="lv-card">
          <div class="idx">{{ idx + 1 }}</div>
          <div class="flex-1">
            <div class="text-xs text-slate-500">Lv. {{ idx + 1 }} → Lv. {{ idx + 2 }} 所需积分</div>
            <input v-model.number="growthDraft.thresholds[idx]" type="number" class="input" />
          </div>
        </div>

        <div class="lv-card graduate">
          <div class="idx">🎓</div>
          <div class="flex-1">
            <div class="text-xs text-slate-500">毕业，获得徽章</div>
            <div class="mt-2 rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm text-brand-800/80">
              Lv. {{ growthDraft.maxLevel }} 为满级，可以毕业；满级后每获得
              <input v-model.number="growthDraft.badgeEveryExp" type="number" class="inline-input" />
              点成长值奖励 1 枚徽章
            </div>
          </div>
        </div>
      </div>
      </div>

    <!-- 数据管理 -->
      <div v-else-if="tab === 'data'" class="data">
      <div class="text-xl font-semibold">数据管理</div>
      <div class="text-sm text-slate-500 mt-1">管理应用数据及状态</div>

      <div class="mt-4 rounded-3xl border border-slate-200 bg-white px-6 py-5 flex items-center justify-between gap-4">
        <div>
          <div class="font-semibold flex items-center gap-2">💾 导入/导出</div>
          <div class="text-sm text-slate-600 mt-1">将当前数据导出为 JSON，或导入 JSON 初始化/迁移数据</div>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn" @click="copyExportJson">📋 复制导出</button>
          <button class="btn" @click="downloadExportJson">⬇️ 下载导出</button>
          <button class="btn-primary" @click="openDataIo">💾 导入数据</button>
        </div>
      </div>

      <div class="mt-4 rounded-3xl border border-slate-200 bg-white px-6 py-5">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="font-semibold flex items-center gap-2">⏱ 自动备份到本地文件</div>
            <div class="text-sm text-slate-600 mt-1">
              首次需要选择一个备份文件位置并授权；开启后每
              <input
                class="inline-num"
                type="number"
                min="10"
                max="3600"
                step="1"
                v-model.number="autoBackupIntervalDraft"
                placeholder="60"
                @blur="commitAutoBackupInterval"
                @keydown.enter.prevent="commitAutoBackupInterval"
              />
              秒自动写入一次（关闭标签页前也会尝试保存一次）
            </div>
          </div>
          <div class="shrink-0 flex items-center gap-2">
            <button
              :class="app.ui.autoBackupEnabled ? 'btn' : 'btn-primary'"
              @click="toggleAutoBackup(!app.ui.autoBackupEnabled)"
            >
              {{ app.ui.autoBackupEnabled ? '⏸ 关闭自动备份' : '▶ 开启自动备份' }}
            </button>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-2">
          <button class="btn" @click="pickAutoBackup">选择备份文件</button>
          <button class="btn" :disabled="!app.ui.autoBackupHasTarget" @click="app.runAutoBackupOnce()">立即备份</button>
          <button class="btn" :disabled="!app.ui.autoBackupHasTarget" @click="clearAutoBackup">清除目标</button>
        </div>

        <div class="mt-3 text-sm text-slate-600">
          <div>状态：<span class="font-semibold">{{ app.ui.autoBackupEnabled ? '已开启' : '已关闭' }}</span></div>
          <div>
            目标文件：
            <span class="font-semibold">
              {{ app.ui.autoBackupHasTarget ? '已选择' : '未选择' }}
            </span>
            <span v-if="app.ui.autoBackupHasTarget && app.ui.autoBackupTargetName" class="ml-2 text-xs text-slate-400">
              {{ app.ui.autoBackupTargetName }}
            </span>
          </div>
          <div v-if="app.ui.autoBackupLastOkAt">最近成功：{{ fmtTs(app.ui.autoBackupLastOkAt) }}</div>
          <div v-if="app.ui.autoBackupLastError" class="text-rose-700">最近错误：{{ app.ui.autoBackupLastError }}</div>
        </div>
      </div>

      <div class="danger mt-4">
        <div>
          <div class="font-semibold text-rose-700 flex items-center gap-2">🗑 一键重置</div>
          <div class="text-sm text-rose-700/80 mt-1">清空所有学生的得分数据、历史评价记录等，此操作不可逆</div>
        </div>
        <button class="btn-danger" @click="resetAll">🗑 确认重置</button>
      </div>
      </div>

    <!-- 软件与帮助 -->
      <div v-else-if="tab === 'about'" class="about">
      <div class="text-xl font-semibold">关于「班级宠物园」</div>
      <div class="text-sm text-slate-600 mt-2">
        软件无需注册登录，不收集任何个人信息，免费供大家使用。可以任意拷贝分发。
      </div>
      <div class="feedback mt-4">
        意见反馈请联系微信：<span class="font-semibold">H1203322195</span>（暗号：班级宠物园）
      </div>
      </div>
      <div v-else></div>
    </div>

    <!-- 导入数据弹窗 -->
    <div v-if="dataIoOpen" class="sheet-mask" @click.self="dataIoOpen = false">
      <div class="sheet">
        <div class="sheet-head">
          <div class="text-lg font-semibold">导入 / 导出 JSON</div>
          <button class="x" @click="dataIoOpen = false">×</button>
        </div>

        <div class="sheet-body">
          <div class="text-sm text-slate-600">
            导出用于备份/迁移；导入会直接覆盖当前数据并写入本机 <span class="font-semibold">localStorage</span>。
          </div>

          <div class="mt-4 flex items-center gap-2">
            <button class="btn" @click="copyExportJson">复制当前数据 JSON</button>
            <button class="btn" @click="downloadExportJson">下载 JSON 文件</button>
          </div>

          <div class="mt-4 label">粘贴要导入的 JSON</div>
          <textarea v-model="importJson" class="field textarea" rows="10" placeholder="粘贴导出的 JSON 内容"></textarea>
          <div v-if="importErr" class="mt-2 text-sm text-rose-700">{{ importErr }}</div>
        </div>

        <div class="sheet-foot">
          <button class="btn-lite" @click="dataIoOpen = false">取消</button>
          <button class="btn-primary" @click="doImport">确认导入</button>
        </div>
      </div>
    </div>
  </ModalBase>
</template>

<style scoped>
.content-wrap {
  @apply min-h-[60vh] lg:min-h-[640px];
}
.toast {
  @apply fixed top-6 right-6 z-[60] max-w-[360px] w-[calc(100vw-48px)];
}
.toast-inner {
  @apply rounded-3xl border border-slate-200 bg-white/95 backdrop-blur shadow-soft px-5 py-4;
}
.toast-title {
  @apply text-xs text-slate-500 font-semibold;
}
.toast-body {
  @apply mt-1.5 text-sm text-slate-800;
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
.tabs {
  @apply mt-2 flex items-center gap-6 border-b border-slate-100 pb-2;
}
.tab {
  @apply text-sm px-1 py-2 border-b-2 border-transparent text-slate-600 hover:text-slate-900 transition;
}
.tab.active {
  @apply border-brand-500 text-brand-700 font-semibold;
}
.panel {
  @apply mt-4 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6;
}
.left {
  @apply rounded-3xl bg-white border border-slate-100 p-4;
}
.right {
  @apply rounded-3xl bg-white border border-slate-100 p-4;
}
.right-head {
  @apply flex items-center justify-between;
}
.bar {
  @apply h-5 w-1 rounded-full bg-brand-500;
}
.btn-blue {
  @apply w-full rounded-2xl px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 transition;
}
.cat {
  @apply w-full text-left rounded-2xl px-4 py-3 border border-transparent hover:bg-slate-50 transition;
}
.cat.active {
  @apply bg-brand-50 border border-brand-200;
}
.dot {
  @apply inline-block h-2 w-2 rounded-full;
}
.dot.green {
  @apply bg-emerald-500;
}
.dot.red {
  @apply bg-rose-500;
}
.rule-card {
  @apply rounded-2xl border border-slate-200 bg-white p-4;
}
.rule-content {
  @apply flex flex-col gap-2;
}
.rule-main {
  @apply flex items-center gap-3 min-w-0 flex-1;
}
.rule-title {
  @apply text-slate-900 font-semibold leading-5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.rule-delta {
  @apply mt-2 text-sm font-semibold flex items-center gap-2 justify-between;
}
.plus {
  @apply text-emerald-700;
}
.minus {
  @apply text-rose-700;
}
.rule-actions {
  @apply flex justify-end gap-2 shrink-0;
}
.icon-box {
  @apply h-9 w-9 rounded-2xl bg-emerald-50 border border-emerald-100 grid place-items-center text-base shrink-0;
}
.mini {
  @apply h-9 w-9 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition grid place-items-center text-slate-500;
}
.tag-all {
  @apply text-xs rounded-full px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500;
}
.sheet-mask {
  @apply fixed inset-0 z-50 bg-black/30 backdrop-blur-sm grid place-items-center p-4;
}
.sheet {
  @apply w-full max-w-2xl rounded-3xl bg-white border border-slate-100 shadow-soft overflow-hidden;
}
.sheet-head {
  @apply px-6 py-4 flex items-center justify-between border-b border-slate-100;
}
.x {
  @apply h-10 w-10 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 grid place-items-center text-slate-600;
}
.sheet-body {
  @apply px-6 py-5 max-h-[65vh] overflow-auto;
}
.label {
  @apply text-xs text-slate-500;
}
.field {
  @apply mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-200;
}
.icon-grid {
  @apply mt-2 grid grid-cols-6 sm:grid-cols-10 gap-2 max-h-40 overflow-auto pr-1;
}
.ic {
  @apply h-10 w-10 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 grid place-items-center text-base;
}
.ic.active {
  @apply border-brand-400 ring-2 ring-brand-200 bg-brand-50;
}
.seg {
  @apply mt-2 flex items-center rounded-2xl border border-slate-200 bg-white overflow-hidden;
}
.seg-btn {
  @apply flex-1 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition;
}
.seg-btn.active {
  @apply bg-brand-500 text-white hover:bg-brand-600;
}
.delta-wrap {
  @apply mt-2 flex items-center gap-2;
}
.delta-sign {
  @apply h-10 w-10 rounded-2xl grid place-items-center font-semibold border;
}
.delta-sign.plus {
  @apply bg-emerald-50 text-emerald-700 border-emerald-200;
}
.delta-sign.minus {
  @apply bg-rose-50 text-rose-700 border-rose-200;
}
.field.delta {
  @apply mt-0;
}
.sheet-foot {
  @apply px-6 py-4 border-t border-slate-100 flex justify-end gap-2;
}
.btn-lite {
  @apply rounded-2xl px-5 py-2 text-sm border border-slate-200 bg-white hover:bg-slate-50 transition;
}
.btn {
  @apply rounded-2xl px-4 py-2 text-sm border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-primary {
  @apply rounded-2xl px-5 py-2 text-sm bg-brand-500 text-white hover:bg-brand-600 transition shadow-soft disabled:opacity-50 disabled:cursor-not-allowed;
}
.textarea {
  @apply font-mono text-xs leading-5;
}
.growth {
  @apply mt-4;
}
.btn-green {
  @apply rounded-2xl px-5 py-2 text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition;
}
.hint-box {
  @apply rounded-3xl border border-brand-200 bg-brand-50 px-5 py-4;
}
.lv-card {
  @apply rounded-3xl border border-slate-200 bg-white p-4 flex items-center gap-4;
}
.lv-card.graduate {
  @apply border-brand-200 bg-brand-50;
}
.idx {
  @apply h-12 w-12 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 grid place-items-center font-semibold;
}
.input {
  @apply mt-2 w-full rounded-2xl border-slate-200 bg-white;
}
.inline-input {
  @apply mx-2 w-20 rounded-xl border-slate-200 bg-white text-center;
}
.inline-num {
  @apply mx-1 w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 align-middle;
}
.data {
  @apply mt-4;
}
.danger {
  @apply rounded-3xl border border-rose-200 bg-rose-50 px-6 py-5 flex items-center justify-between gap-4;
}
.btn-danger {
  @apply rounded-2xl px-5 py-2 text-sm bg-rose-600 text-white hover:bg-rose-700 transition;
}
.about {
  @apply mt-4;
}
.feedback {
  @apply rounded-3xl border border-rose-200 bg-rose-50 px-6 py-5 text-slate-700;
}
</style>

