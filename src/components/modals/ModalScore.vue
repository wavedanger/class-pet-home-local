<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import type { ScoreRule } from '@/lib/models'

import ModalBase from '@/components/modals/ModalBase.vue'

const app = useAppStore()

const targetIds = computed(() => app.ui.modalStudentIds.length ? app.ui.modalStudentIds : (app.ui.modalStudentId ? [app.ui.modalStudentId] : []))
const isBatch = computed(() => targetIds.value.length > 1)

const student = computed(() => {
  const c = app.activeClassroom
  return c.students.find((x) => x.id === app.ui.modalStudentId)!
})

const categories = computed(() => {
  const set = new Set(app.data.rules.map((r) => r.category))
  return Array.from(set)
})

const rulesInCategory = computed(() =>
  app.data.rules.filter((r) => r.enabled && r.category === app.ui.modalCategory)
)

function pickRule(r: ScoreRule) {
  if (isBatch.value) app.applyRuleForStudents(targetIds.value, r)
  else app.applyRule(student.value.id, r)
  app.closeModal()
}
</script>

<template>
  <ModalBase @close="app.closeModal()">
    <template #title>
      📝 加分/扣分 <span class="chip-en">SCORE</span>
      <span class="text-slate-500 text-sm ml-2" v-if="isBatch">（{{ targetIds.length }} 人）</span>
      <span class="text-slate-500 text-sm ml-2" v-else>（{{ student.name }}）</span>
    </template>

    <div class="modal-col">
      <div class="flex items-center gap-2 mb-4 overflow-auto">
        <button
          v-for="c in categories"
          :key="c"
          class="tab"
          :class="{ active: app.ui.modalCategory === c }"
          @click="app.ui.modalCategory = c"
        >
          {{ c }}
        </button>
      </div>

      <div class="modal-scroll pr-2">
        <div class="rule-grid gap-3">
          <button
            v-for="r in rulesInCategory"
            :key="r.id"
            class="rule-card"
            @click="pickRule(r)"
          >
            <div class="font-medium text-slate-900">{{ r.title }}</div>
            <div class="mt-2">
              <span class="badge" :class="r.delta >= 0 ? 'plus' : 'minus'">
                {{ r.delta >= 0 ? '+' : '' }}{{ r.delta }}
              </span>
            </div>
          </button>
        </div>

        <div v-if="rulesInCategory.length === 0" class="text-slate-500 text-sm py-10 text-center">
          当前分类没有启用的规则（MVP 占位）。
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <button class="btn" @click="app.closeModal()">关闭</button>
      </div>
    </div>
  </ModalBase>
</template>

<style scoped>
.modal-col {
  @apply h-full flex flex-col min-h-0;
}
.modal-scroll {
  @apply flex-1 min-h-0 overflow-auto;
}
.tab {
  @apply rounded-2xl px-3 py-1.5 text-sm border border-slate-200 bg-white hover:bg-slate-50 transition whitespace-nowrap;
}
.tab.active {
  @apply bg-brand-50 border-brand-300 text-brand-700;
}
.rule-card {
  @apply rounded-2xl border border-slate-200 bg-white p-4 text-left;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  z-index: 0;
  cursor: pointer;
  transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
}
.rule-card:hover {
  z-index: 1;
  border-color: rgba(245, 158, 11, 0.55);
  background-color: rgba(255, 251, 235, 1);
  box-shadow:
    0 10px 28px rgba(15, 23, 42, 0.08),
    0 2px 10px rgba(15, 23, 42, 0.05);
}
.rule-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
@media (min-width: 640px) {
  .rule-grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (min-width: 1024px) {
  .rule-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}
.rule-card:focus-visible {
  outline: 2px solid rgba(245, 158, 11, 0.35);
  outline-offset: 2px;
}
.badge {
  @apply inline-flex items-center rounded-xl px-2 py-1 text-xs font-semibold;
}
.badge.plus {
  @apply bg-emerald-50 text-emerald-700;
}
.badge.minus {
  @apply bg-rose-50 text-rose-700;
}
.btn {
  @apply rounded-2xl px-4 py-2 text-sm border border-slate-200 bg-white hover:bg-slate-50 transition;
}
</style>

