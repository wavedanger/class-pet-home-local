<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useAppStore, type SortMode } from '@/stores/app'

const app = useAppStore()
const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)

type Option = { key: SortMode; label: string; icon: string }

const options: Option[] = [
  { key: 'name', label: '按姓名排序', icon: '👤' },
  { key: 'number', label: '按学号排序', icon: '#️⃣' },
  { key: 'badges', label: '按徽章排序', icon: '🏅' },
  { key: 'growth', label: '按养成进度', icon: '📈' },
]

const current = computed(() => options.find((o) => o.key === app.ui.sortMode) ?? options[0])

function choose(key: SortMode) {
  app.ui.sortMode = key
  open.value = false
}

function onDocClick(e: MouseEvent) {
  if (!open.value) return
  const el = rootEl.value
  if (!el) return
  if (el.contains(e.target as Node)) return
  open.value = false
}

onMounted(() => document.addEventListener('mousedown', onDocClick))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocClick))
</script>

<template>
  <div ref="rootEl" class="relative">
    <button class="btn" @click="open = !open">
      <span class="mr-2">{{ current.icon }}</span>
      <span class="text-sm font-medium">{{ current.label }}</span>
      <span class="ml-2 text-slate-400">▾</span>
    </button>

    <div
      v-if="open"
      class="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-soft border border-slate-100 overflow-hidden"
    >
      <button
        v-for="o in options"
        :key="o.key"
        class="item"
        :class="{ active: app.ui.sortMode === o.key }"
        @click="choose(o.key)"
      >
        <span class="w-6 grid place-items-center">{{ o.icon }}</span>
        <span class="flex-1 text-left">{{ o.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.btn {
  @apply rounded-2xl px-4 py-2 text-sm border border-slate-200 bg-white/80 hover:bg-white transition flex items-center;
}
.item {
  @apply w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 transition;
}
.item.active {
  @apply bg-brand-50 text-brand-700;
}
</style>

