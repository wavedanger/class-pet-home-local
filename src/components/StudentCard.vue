<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { petStageSrc } from '@/lib/pets'

const props = defineProps<{ studentId: string }>()
const app = useAppStore()

const student = computed(() => {
  const c = app.activeClassroom
  return c.students.find((x) => x.id === props.studentId)!
})

const pet = computed(() => student.value.pet)
const selected = computed(() => app.ui.selectedStudentIds.includes(student.value.id))
const selectable = computed(() => {
  if (!app.ui.batchMode) return true
  if (app.ui.batchAction === 'score') return !!pet.value
  return !pet.value
})
const progress = computed(() => {
  if (!pet.value) return 0
  const need = app.expNeed(pet.value.level)
  return need <= 0 ? 0 : Math.min(100, Math.round((pet.value.exp / need) * 100))
})
</script>

<template>
  <div
    class="rounded-3xl bg-white border shadow-soft overflow-hidden relative"
    :class="
      app.ui.batchMode
        ? selectable
          ? selected
            ? 'border-brand-300 ring-2 ring-brand-200'
            : 'border-slate-100'
          : 'border-slate-100 opacity-50'
        : 'border-slate-100'
    "
    @click="app.ui.batchMode && selectable ? app.toggleSelectStudent(student.id) : undefined"
  >
    <!-- 外层左上：更换宠物（仅非批量模式且已领养） -->
    <button
      v-if="pet && !app.ui.batchMode"
      class="swap-btn swap-outer"
      title="更换宠物"
      @click.stop="app.openModal('adopt', student.id)"
    >
      ⟳
    </button>

    <button
      v-if="app.ui.batchMode"
      class="check"
      :class="{ on: selected }"
      :disabled="!selectable"
      @click.stop="selectable ? app.toggleSelectStudent(student.id) : undefined"
      aria-label="选择学生"
    >
      <span v-if="selected">✓</span>
    </button>

    <div class="h-36 bg-gradient-to-br from-brand-50 to-white grid place-items-center relative">
      <div v-if="!pet" class="text-6xl">🥚</div>
      <div v-else class="pet-wrap">
        <img :src="petStageSrc(pet.petId, pet.level)" class="pet-img" :alt="pet.name" />

        <!-- 右上：等级 -->
        <div class="lv-badge">Lv. {{ pet.level }}</div>
      </div>
    </div>

    <div class="p-4">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-baseline gap-2">
          <div class="text-lg font-semibold">{{ student.name }}</div>
          <span v-if="student.number" class="text-xs text-slate-500 border border-slate-200 rounded-lg px-2 py-0.5">
            {{ student.number }}
          </span>
        </div>
        <span class="text-xs text-slate-500">积分：{{ student.points }}</span>
      </div>

      <div v-if="!pet" class="mt-4">
        <button class="btn-primary w-full" @click.stop="app.openModal('adopt', student.id)">领养宠物</button>
      </div>

      <div v-else class="mt-3 space-y-3">
        <div class="flex items-center justify-between">
          <div class="text-sm font-medium text-slate-700">{{ pet.name }}</div>
          <span class="chip">徽章 {{ student.badges }}</span>
        </div>

        <div class="space-y-1">
          <div class="flex items-center justify-between text-xs text-slate-500">
            <span>成长值</span>
            <span>{{ pet.exp }} / {{ app.expNeed(pet.level) }}</span>
          </div>
          <div class="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div class="h-full bg-brand-400" :style="{ width: progress + '%' }"></div>
          </div>
        </div>

        <button class="btn w-full" @click.stop="app.openModal('score', student.id)">加分/扣分</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.check {
  @apply absolute left-3 top-3 h-7 w-7 rounded-full border border-slate-200 bg-white/80 grid place-items-center text-sm text-white;
}
.check:disabled {
  @apply opacity-40 cursor-not-allowed;
}
.check.on {
  @apply bg-brand-500 border-brand-500;
}
.pet-wrap {
  @apply h-28 w-28 grid place-items-center relative;
}
.pet-img {
  @apply h-28 w-28 object-contain drop-shadow transition-transform duration-300;
  animation: floaty 3.6s ease-in-out infinite;
}
.pet-wrap:hover .pet-img {
  @apply -translate-y-1 scale-[1.03];
}
@keyframes floaty {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}
.swap-btn {
  @apply absolute left-1 top-1 z-10 h-8 w-8 rounded-2xl border border-slate-200 bg-white/80 hover:bg-white transition grid place-items-center text-slate-600;
}
.swap-btn.swap-outer {
  @apply left-3 top-3;
}
.lv-badge {
  @apply absolute right-1 top-1 z-10 rounded-full bg-brand-500 text-white text-xs font-semibold px-2 py-1 shadow-soft;
}
.btn {
  @apply rounded-2xl px-4 py-2 text-sm border border-slate-200 bg-white hover:bg-slate-50 transition;
}
.btn-primary {
  @apply rounded-2xl px-4 py-2 text-sm bg-brand-500 text-white hover:bg-brand-600 transition shadow-soft;
}
.chip {
  @apply text-xs rounded-full bg-brand-100 text-brand-700 px-2 py-1;
}
</style>

