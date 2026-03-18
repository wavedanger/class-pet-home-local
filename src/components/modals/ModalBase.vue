<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

const emit = defineEmits<{ close: [] }>()

let prevBodyOverflow = ''
let prevHtmlOverflow = ''

onMounted(() => {
  // 锁定背景滚动，避免滚动/事件“穿透”导致的层级错觉
  prevBodyOverflow = document.body.style.overflow
  prevHtmlOverflow = document.documentElement.style.overflow
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
})

onBeforeUnmount(() => {
  document.body.style.overflow = prevBodyOverflow
  document.documentElement.style.overflow = prevHtmlOverflow
})
</script>

<template>
  <div class="fixed inset-0 z-50 overscroll-contain">
    <div class="absolute inset-0 bg-black/30 z-0" @click="emit('close')"></div>
    <div class="absolute inset-0 p-2 sm:p-4 flex items-stretch justify-center z-10">
      <div
        class="w-full sm:max-w-4xl sm:my-4 rounded-3xl bg-white shadow-soft border border-slate-100 overflow-hidden flex flex-col max-h-full sm:max-h-[calc(100vh-2rem)]"
      >
        <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 flex items-center justify-between">
          <div class="font-semibold text-slate-900">
            <slot name="title" />
          </div>
          <button class="text-slate-400 hover:text-slate-700" @click="emit('close')">✕</button>
        </div>
        <div class="p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

