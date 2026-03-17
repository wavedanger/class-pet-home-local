<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import ModalBase from '@/components/modals/ModalBase.vue'

const app = useAppStore()
const classroomId = computed(() => app.activeClassroom.id)

const records = computed(() => app.data.records.filter((r) => r.classroomId === classroomId.value).slice(0, 50))

const studentName = (id: string) => app.activeClassroom.students.find((s) => s.id === id)?.name ?? '未知学生'

const fmt = (ts: number) => new Date(ts).toLocaleString('zh-CN')
</script>

<template>
  <ModalBase @close="app.closeModal()">
    <template #title>评价记录（最近 50 条）</template>

    <div v-if="records.length === 0" class="text-slate-500 text-sm py-10 text-center">暂无记录</div>

    <div v-else class="space-y-2 max-h-[60vh] overflow-auto pr-2">
      <div
        v-for="r in records"
        :key="r.id"
        class="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-4"
      >
        <div class="min-w-0">
          <div class="font-medium truncate">{{ studentName(r.studentId) }} · {{ r.ruleTitle }}</div>
          <div class="text-xs text-slate-500 mt-1">{{ r.category }} · {{ fmt(r.ts) }}</div>
        </div>
        <div class="shrink-0">
          <span class="badge" :class="r.delta >= 0 ? 'plus' : 'minus'">
            {{ r.delta >= 0 ? '+' : '' }}{{ r.delta }}
          </span>
        </div>
      </div>
    </div>

    <div class="mt-6 flex justify-end">
      <button class="btn" @click="app.closeModal()">关闭</button>
    </div>
  </ModalBase>
</template>

<style scoped>
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

