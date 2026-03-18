<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'

const app = useAppStore()
const count = computed(() => app.ui.selectedStudentIds.length)


function scoreBatch() {
  app.setBatchAction('score')
  if (app.ui.selectedStudentIds.length === 0) return
  app.openModalForStudents('score', app.ui.selectedStudentIds)
}
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 z-40">
    <div class="mx-auto max-w-6xl px-4 pb-4">
      <div class="bar">
        <div class="left">
          <div class="text-sm text-slate-600">已选择 <span class="font-semibold text-brand-700">{{ count }}</span> 位学生</div>
          <button class="link" @click="app.selectAllFiltered">全选</button>
          <span class="sep">|</span>
          <button class="link" @click="app.clearSelection">清空</button>
        </div>

        <div class="right">
          <button class="btn" @click="app.exitBatchMode">取消</button>
          <button
            class="btn"
            :class="{ active: app.ui.batchAction === 'score' }"
            :disabled="count === 0"
            @click="scoreBatch"
          >
            批量评价
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bar {
  @apply rounded-3xl border border-slate-200 bg-white/90 backdrop-blur shadow-soft px-4 py-3 flex items-center justify-between gap-4;
}
.left {
  @apply flex items-center gap-3;
}
.right {
  @apply flex items-center gap-2;
}
.link {
  @apply text-sm text-brand-700 hover:text-brand-800;
}
.sep {
  @apply text-slate-300;
}
.btn {
  @apply rounded-2xl px-4 py-2 text-sm border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn.active {
  @apply border-brand-300 bg-brand-50 text-brand-700;
}
.btn-primary {
  @apply rounded-2xl px-4 py-2 text-sm bg-brand-500 text-white hover:bg-brand-600 transition shadow-soft disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-primary.active {
  @apply ring-2 ring-brand-200;
}
</style>

