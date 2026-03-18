<script setup lang="ts">
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/30" @click="emit('close')"></div>
    <div class="absolute inset-0 p-2 sm:p-4 flex items-stretch justify-center">
      <div
        class="w-full sm:max-w-4xl sm:my-4 rounded-3xl bg-white shadow-soft border border-slate-100 overflow-hidden flex flex-col max-h-full sm:max-h-[calc(100vh-2rem)]"
      >
        <div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 flex items-center justify-between">
          <div class="font-semibold text-slate-900">
            <slot name="title" />
          </div>
          <button class="text-slate-400 hover:text-slate-700" @click="emit('close')">✕</button>
        </div>
        <div class="p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

