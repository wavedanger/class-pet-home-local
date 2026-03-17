<script setup lang="ts">
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/30" @click="emit('close')"></div>
    <div class="absolute inset-0 p-4 grid place-items-center">
      <div class="w-full max-w-4xl rounded-3xl bg-white shadow-soft border border-slate-100 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div class="font-semibold text-slate-900">
            <slot name="title" />
          </div>
          <button class="text-slate-400 hover:text-slate-700" @click="emit('close')">✕</button>
        </div>
        <div class="p-6">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

