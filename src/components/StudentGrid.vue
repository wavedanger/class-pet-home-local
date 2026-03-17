<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import StudentCard from '@/components/StudentCard.vue'

const app = useAppStore()
const students = computed(() => app.filteredStudents)
</script>

<template>
  <div>
    <div
      v-if="students.length === 0"
      class="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500"
    >
      没有匹配的学生。你可以在“设置与帮助 → 数据管理”里导入示例数据。
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StudentCard v-for="s in students" :key="s.id" :student-id="s.id" />
    </div>
  </div>
</template>

