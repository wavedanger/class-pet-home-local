<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'

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
</script>

<template>
  <ModalBase @close="app.closeModal()">
    <template #title>
      <span v-if="isBatch">
        给 <span class="text-brand-700">{{ targetIds.length }}</span> 位学生 批量加分/扣分
      </span>
      <span v-else>给 <span class="text-brand-700">{{ student.name }}</span> 加分/扣分</span>
    </template>

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

    <div class="max-h-[55vh] overflow-auto pr-2">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          v-for="r in rulesInCategory"
          :key="r.id"
          class="rule-card"
          @click="isBatch ? app.applyRuleForStudents(targetIds, r) : app.applyRule(student.id, r)"
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
  </ModalBase>
</template>

<style scoped>
.tab {
  @apply rounded-2xl px-3 py-1.5 text-sm border border-slate-200 bg-white hover:bg-slate-50 transition whitespace-nowrap;
}
.tab.active {
  @apply bg-brand-50 border-brand-300 text-brand-700;
}
.rule-card {
  @apply rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-brand-300 hover:bg-brand-50 transition;
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

