<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { PETS, petStageSrc } from '@/lib/pets'

import ModalBase from '@/components/modals/ModalBase.vue'

const app = useAppStore()
const targetIds = computed(() => app.ui.modalStudentIds.length ? app.ui.modalStudentIds : (app.ui.modalStudentId ? [app.ui.modalStudentId] : []))
const isBatch = computed(() => targetIds.value.length > 1)
const student = computed(() => {
  const c = app.activeClassroom
  return c.students.find((x) => x.id === app.ui.modalStudentId)! // 单人展示用
})

const picked = ref(PETS[0])
const onlyIfNoPet = ref(true)

function adopt() {
  if (isBatch.value) {
    app.adoptPetForStudents(targetIds.value, picked.value.id, picked.value.name, onlyIfNoPet.value)
    app.exitBatchMode()
  } else {
    app.adoptPet(student.value.id, picked.value.id, picked.value.name)
  }
  app.closeModal()
}
</script>

<template>
  <ModalBase @close="app.closeModal()">
    <template #title>
      ✨ 领养宠物 <span class="chip-en">ADOPT PET</span>
      <span class="text-slate-500 text-sm ml-2" v-if="isBatch">（批量）</span>
      <span class="text-slate-500 text-sm ml-2" v-else>（{{ student.name }}）</span>
    </template>

    <div class="modal-col">
      <div class="text-center text-slate-500 mb-4">选择一只可爱的神兽，它会陪你一起成长！</div>

      <div v-if="isBatch" class="mb-4 flex items-center justify-center gap-3 text-sm text-slate-600">
        <label class="flex items-center gap-2">
          <input type="checkbox" v-model="onlyIfNoPet" class="rounded border-slate-300" />
          仅对未领养的学生生效
        </label>
      </div>

      <div class="modal-scroll pr-2">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            v-for="p in PETS"
            :key="p.id"
            class="pet-card"
            :class="{ active: picked.id === p.id }"
            @click="picked = p"
          >
            <div class="img-wrap">
              <img :src="petStageSrc(p.id, 1)" class="pet-img" :alt="p.name" />
            </div>
            <div class="mt-2 text-sm font-medium">{{ p.name }}</div>
          </button>
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-2">
        <button class="btn" @click="app.closeModal()">取消</button>
        <button class="btn-primary" @click="adopt">{{ isBatch ? '批量领养' : '确认领养' }}</button>
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
.pet-card {
  @apply rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-brand-300 hover:bg-brand-50 transition;
}
.pet-card.active {
  @apply border-brand-500 ring-2 ring-brand-200;
}
.img-wrap {
  @apply h-20 w-full grid place-items-center;
}
.pet-img {
  @apply h-20 w-20 object-contain;
}
.btn {
  @apply rounded-2xl px-4 py-2 text-sm border border-slate-200 bg-white hover:bg-slate-50 transition;
}
.btn-primary {
  @apply rounded-2xl px-4 py-2 text-sm bg-brand-500 text-white hover:bg-brand-600 transition shadow-soft;
}
</style>

