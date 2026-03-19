<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import ModalBase from '@/components/modals/ModalBase.vue'

const app = useAppStore()
const classroomId = computed(() => app.activeClassroom.id)

const records = computed(() => app.data.records.filter((r) => r.classroomId === classroomId.value).slice(0, 50))

const studentName = (id: string) => app.activeClassroom.students.find((s) => s.id === id)?.name ?? '未知学生'

const fmt = (ts: number) => new Date(ts).toLocaleString('zh-CN')

function undo(id: string) {
  const res = app.undoScoreRecord(id)
  if (!res.ok) alert(res.reason)
  else alert('已撤回')
}

function exportExcel() {
  // 使用 CSV 方式导出（Excel 可直接打开）；加 BOM 避免中文乱码
  const header = ['时间', '学生', '分类', '规则', '加/减', '分值']
  const rows = records.value.map((r) => {
    const kind = r.delta >= 0 ? '加分' : '减分'
    const delta = `${r.delta >= 0 ? '+' : ''}${r.delta}`
    return [fmt(r.ts), studentName(r.studentId), r.category, r.ruleTitle, kind, delta]
  })
  const escape = (v: unknown) => {
    const s = String(v ?? '')
    const needs = /[",\r\n]/.test(s)
    const out = s.replace(/"/g, '""')
    return needs ? `"${out}"` : out
  }
  const csv = [header, ...rows].map((line) => line.map(escape).join(',')).join('\r\n')
  const bom = '\uFEFF'
  const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8' })

  const ts = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const file = `评价记录_${ts.getFullYear()}-${pad(ts.getMonth() + 1)}-${pad(ts.getDate())}.csv`

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = file
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <ModalBase @close="app.closeModal()">
    <template #title>
      🕘 评价记录（最近 50 条） <span class="chip-en">RECORDS</span>
      <button class="btn-head" :disabled="records.length === 0" @click="exportExcel">📄 导出 Excel</button>
    </template>

    <div class="modal-col">
      <div v-if="records.length === 0" class="text-slate-500 text-sm py-10 text-center">暂无记录</div>

      <div v-else class="modal-scroll pr-2 space-y-2">
        <div
          v-for="r in records"
          :key="r.id"
          class="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-4"
        >
          <div class="min-w-0">
            <div class="font-medium truncate">{{ studentName(r.studentId) }} · {{ r.ruleTitle }}</div>
            <div class="text-xs text-slate-500 mt-1">{{ r.category }} · {{ fmt(r.ts) }}</div>
          </div>
          <div class="shrink-0 flex items-center gap-3">
            <span class="badge" :class="r.delta >= 0 ? 'plus' : 'minus'">
              {{ r.delta >= 0 ? '+' : '' }}{{ r.delta }}
            </span>
            <button class="btn-undo" :disabled="!r.before" @click="undo(r.id)">撤回</button>
          </div>
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
.btn-undo {
  @apply rounded-2xl px-3 py-1.5 text-xs border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-head {
  @apply ml-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>

