<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'

import StudentGrid from '@/components/StudentGrid.vue'
import ModalAdoptPet from '@/components/modals/ModalAdoptPet.vue'
import ModalScore from '@/components/modals/ModalScore.vue'
import ModalSettings from '@/components/modals/ModalSettings.vue'
import ModalLeaderboard from '@/components/modals/ModalLeaderboard.vue'
import ModalRecords from '@/components/modals/ModalRecords.vue'
import SortMenu from '@/components/SortMenu.vue'
import ModalClassManager from '@/components/modals/ModalClassManager.vue'
import ModalShop from '@/components/modals/ModalShop.vue'
import BatchBar from '@/components/BatchBar.vue'
import LevelUpOverlay from '@/components/LevelUpOverlay.vue'

const app = useAppStore()

const activeName = computed(() => app.activeClassroom?.name ?? '')

function undoLatest() {
  const res = app.undoLatestScoreRecord()
  if (!res.ok) window.alert(res.reason)
  else window.alert('已撤回最近一条评价')
}

onMounted(async () => {
  // 自动备份循环只初始化一次；开关控制是否真正执行写入
  await app.startAutoBackupLoop()
})

watch(
  () => app.ui.autoBackupEnabled,
  async (v) => {
    // 关闭时不销毁循环（避免多处组件重复启动），但允许你需要“彻底停止”时调用 stopAutoBackupLoop
    if (v) {
      await app.refreshAutoBackupTarget()
      if (app.ui.autoBackupHasTarget) await app.runAutoBackupOnce()
    }
  }
)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-white to-slate-50">
    <header class="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-100">
      <div class="mx-auto max-w-6xl px-4 pt-3 pb-2 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="h-12 w-12 rounded-2xl bg-brand-100 grid place-items-center shadow-soft">
            <span class="text-2xl">🐾</span>
          </div>
          <div class="leading-tight">
            <div class="text-xs text-slate-500">班级宠物园</div>
            <button
              class="font-semibold text-slate-900 flex items-center gap-2 hover:text-brand-700 transition"
              @click="app.openModal('classManager')"
            >
              <span>{{ activeName }}</span>
              <span class="text-slate-400">▾</span>
            </button>
          </div>
        </div>

        <button class="btn-ghost" @click="app.openModal('settings')">
          <span class="mr-2">⚙️</span>
          设置与帮助
        </button>
      </div>

      <div class="mx-auto max-w-6xl px-4 pb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div class="w-full sm:flex-1">
          <div class="relative">
            <input
              v-model="app.ui.query"
              class="w-full rounded-2xl border-slate-200 bg-white/80 pl-10 pr-4 py-2"
              placeholder="搜索学生…"
            />
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
          </div>
        </div>

        <div class="mt-2 sm:mt-0 flex flex-wrap justify-end gap-2">
          <SortMenu />
          <button class="btn" @click="app.openModal('leaderboard')">🏆 排行榜</button>
          <button class="btn" @click="app.openModal('shop')">🛍 小商店</button>
          <button class="btn" @click="app.openModal('records')">🕘 评价记录</button>
          <button class="btn" @click="undoLatest">↩ 撤回评价</button>
          <button class="btn-primary" @click="app.ui.batchMode ? app.exitBatchMode() : app.enterBatchMode()">
            {{ app.ui.batchMode ? '退出批量' : '批量评价' }}
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-6">
      <StudentGrid />
    </main>

    <ModalAdoptPet v-if="app.ui.modal === 'adopt'" />
    <ModalScore v-if="app.ui.modal === 'score'" />
    <ModalSettings v-if="app.ui.modal === 'settings'" />
    <ModalLeaderboard v-if="app.ui.modal === 'leaderboard'" />
    <ModalRecords v-if="app.ui.modal === 'records'" />
    <ModalClassManager v-if="app.ui.modal === 'classManager'" />
    <ModalShop v-if="app.ui.modal === 'shop'" />

    <BatchBar v-if="app.ui.batchMode" />

    <LevelUpOverlay v-if="app.ui.levelUp" />
  </div>
</template>

<style scoped>
.btn {
  @apply rounded-2xl px-3 sm:px-4 py-2 text-xs sm:text-sm border border-slate-200 bg-white/80 hover:bg-white transition;
}
.btn-primary {
  @apply rounded-2xl px-3 sm:px-4 py-2 text-xs sm:text-sm bg-brand-500 text-white hover:bg-brand-600 transition shadow-soft;
}
.btn-ghost {
  @apply rounded-2xl px-4 py-2 text-sm border border-slate-200 bg-white/60 hover:bg-white transition;
}
</style>

