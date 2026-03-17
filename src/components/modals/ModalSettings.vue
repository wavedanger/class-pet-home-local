<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useAppStore } from '@/stores/app'
import type { ScoreCategory } from '@/lib/models'
import ModalBase from '@/components/modals/ModalBase.vue'

const app = useAppStore()
type Tab = 'rules' | 'growth' | 'data' | 'about'
const tab = ref<Tab>('rules')

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
  return (['学习', '行为', '健康', '其他'] as ScoreCategory[])
    .filter((c) => map.has(c))
    .map((c) => ({ category: c, ...map.get(c)! }))
})
const activeCategory = ref<ScoreCategory>('学习')

const rulesOfActive = computed(() => app.data.rules.filter((r) => r.category === activeCategory.value))

// --- 成长页
const growthDraft = ref({
  thresholds: [] as number[],
  maxLevel: 10,
  badgeEveryExp: 200,
})
const msg = ref<string | null>(null)

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
</script>

<template>
  <ModalBase @close="app.closeModal()">
    <template #title>设置与帮助</template>

    <div class="content-wrap">
      <div class="tabs">
        <button class="tab" :class="{ active: tab === 'rules' }" @click="tab = 'rules'">📋 加减分规则</button>
        <button class="tab" :class="{ active: tab === 'growth' }" @click="tab = 'growth'">📈 成长设置</button>
        <button class="tab" :class="{ active: tab === 'data' }" @click="tab = 'data'">🗃 数据管理</button>
        <button class="tab" :class="{ active: tab === 'about' }" @click="tab = 'about'">👥 软件与帮助</button>
      </div>

      <div v-if="msg" class="mt-3 text-sm text-slate-600">{{ msg }}</div>

      <!-- 加减分规则 -->
      <div v-if="tab === 'rules'" class="panel">
      <div class="left">
        <button class="btn-blue">＋ 新增指标</button>
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
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="font-semibold truncate">{{ r.title }}</div>
                <div class="mt-2 text-sm" :class="r.delta >= 0 ? 'text-emerald-700' : 'text-rose-700'">
                  {{ r.delta >= 0 ? '+' : '' }}{{ r.delta }}
                </div>
              </div>
              <div class="flex items-center gap-2 text-slate-300">
                <button class="mini" title="编辑（占位）">✎</button>
                <button class="mini" title="删除（占位）">🗑</button>
              </div>
            </div>
            <div class="mt-3">
              <button class="tag-all">全部班级</button>
            </div>
          </div>
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

      <div class="danger mt-4">
        <div>
          <div class="font-semibold text-rose-700 flex items-center gap-2">🗑 一键重置</div>
          <div class="text-sm text-rose-700/80 mt-1">清空所有学生的得分数据、历史评价记录等，此操作不可逆</div>
        </div>
        <button class="btn-danger" @click="resetAll">🗑 确认重置</button>
      </div>
      </div>

    <!-- 软件与帮助 -->
      <div v-else class="about">
      <div class="text-xl font-semibold">关于「班级宠物园」</div>
      <div class="text-sm text-slate-600 mt-2">
        软件无需注册登录，不收集任何个人信息，免费供大家使用。可以任意拷贝分发。
      </div>
      <div class="feedback mt-4">
        意见反馈请联系微信：<span class="font-semibold">H1203322195</span>（暗号：班级宠物园）
      </div>
      </div>
    </div>
  </ModalBase>
</template>

<style scoped>
.content-wrap {
  @apply min-h-[640px];
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
.mini {
  @apply h-9 w-9 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition grid place-items-center text-slate-500;
}
.tag-all {
  @apply text-xs rounded-full px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500;
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

