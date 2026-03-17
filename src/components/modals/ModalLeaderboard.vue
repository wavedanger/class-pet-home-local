<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import ModalBase from '@/components/modals/ModalBase.vue'

const app = useAppStore()

const list = computed(() => {
  const c = app.activeClassroom
  return [...c.students].sort((a, b) => {
    const byBadges = (b.badges ?? 0) - (a.badges ?? 0)
    if (byBadges !== 0) return byBadges
    const aLevel = a.pet?.level ?? 0
    const bLevel = b.pet?.level ?? 0
    const byLevel = bLevel - aLevel
    if (byLevel !== 0) return byLevel
    return b.points - a.points
  })
})
</script>

<template>
  <ModalBase @close="app.closeModal()">
    <template #title>🏆 荣誉榜</template>

    <div class="table-head">
      <div class="col-rank">排名</div>
      <div class="col-student">学生</div>
      <div class="col-level">等级</div>
      <div class="col-badges">徽章数</div>
    </div>

    <div class="space-y-3 mt-3">
      <div v-for="(s, idx) in list" :key="s.id" class="row" :class="{ top: idx === 0 }">
        <div class="col-rank flex items-center gap-3">
          <div class="medal">
            <span v-if="idx === 0">👑</span>
            <span v-else-if="idx === 1">🥈</span>
            <span v-else-if="idx === 2">🥉</span>
            <span v-else class="text-slate-400">#</span>
          </div>
          <div class="rank-num">{{ idx + 1 }}</div>
        </div>

        <div class="col-student min-w-0">
          <div class="font-semibold truncate">{{ s.name }}</div>
          <div class="text-xs text-slate-500">
            <span v-if="s.pet">伙伴：{{ s.pet.name }}</span>
            <span v-else>未领养</span>
          </div>
        </div>

        <div class="col-level">
          <span class="chip">Lv. {{ s.pet?.level ?? 0 }}</span>
        </div>

        <div class="col-badges flex items-center justify-end gap-2">
          <span class="badge-icon">🏅</span>
          <span class="font-semibold text-slate-700">{{ s.badges ?? 0 }}</span>
        </div>
      </div>
    </div>

    <div class="mt-6 rounded-3xl border border-brand-200 bg-brand-50 px-5 py-4">
      <div class="flex items-center gap-2 font-semibold text-brand-800">
        <span>🏅</span>
        关于徽章
      </div>
      <div class="mt-2 text-sm text-brand-800/80">
        徽章是宠物养成的最高荣誉！当宠物达到满级后，继续获得成长值将触发“毕业仪式”获得一枚荣誉徽章。徽章越多，说明养成的宠物越多。
      </div>
    </div>

    <div class="mt-6 flex justify-end">
      <button class="btn" @click="app.closeModal()">关闭</button>
    </div>
  </ModalBase>
</template>

<style scoped>
.table-head {
  @apply grid grid-cols-[140px_1fr_140px_140px] items-center text-xs text-slate-500 px-4;
}
.row {
  @apply grid grid-cols-[140px_1fr_140px_140px] items-center rounded-3xl border border-slate-200 bg-white px-4 py-4;
}
.row.top {
  @apply border-brand-200 bg-brand-50;
}
.col-rank {
  @apply flex items-center;
}
.col-student {
  @apply pr-4;
}
.col-level {
  @apply flex justify-end;
}
.col-badges {
  @apply flex justify-end;
}
.medal {
  @apply h-10 w-10 rounded-2xl grid place-items-center bg-white border border-slate-200;
}
.rank-num {
  @apply text-sm font-semibold text-slate-700;
}
.chip {
  @apply text-xs rounded-full bg-white border border-brand-200 text-brand-700 px-2 py-1;
}
.badge-icon {
  @apply text-lg;
}
.btn {
  @apply rounded-2xl px-4 py-2 text-sm border border-slate-200 bg-white hover:bg-slate-50 transition;
}
</style>

