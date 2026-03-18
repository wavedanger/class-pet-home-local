<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import ModalBase from '@/components/modals/ModalBase.vue'
import type { ShopItem, ShopItemCategory } from '@/lib/models'

const app = useAppStore()

type Tab = 'items' | 'records' | 'manage'
const tab = ref<Tab>('items')

const active = computed(() => app.activeClassroom)
const students = computed(() => active.value.students)
const selectedStudentId = ref<string>(students.value[0]?.id ?? '')
const selectedStudent = computed(() => students.value.find((s) => s.id === selectedStudentId.value) ?? students.value[0])

const items = computed(() => app.data.shopItems.filter((x) => x.enabled))
const records = computed(() => app.data.shopRecords.filter((r) => r.classroomId === active.value.id))

const msg = ref<string | null>(null)

function redeem(itemId: string) {
  msg.value = null
  const s = selectedStudent.value
  if (!s) return
  const res = app.redeemShopItem(s.id, itemId)
  if (!res.ok) msg.value = res.reason
  else msg.value = '兑换成功'
}

// 兑换：学生选择（可搜索）
const pickerOpen = ref(false)
const pickerItemId = ref<string | null>(null)
const pickerQuery = ref('')

const pickerItem = computed(() => {
  if (!pickerItemId.value) return null
  return app.data.shopItems.find((x) => x.id === pickerItemId.value) ?? null
})

const pickerStudents = computed(() => {
  const q = pickerQuery.value.trim()
  const list = students.value
  if (!q) return list
  return list.filter((s) => s.name.includes(q) || (s.number ?? '').includes(q))
})

function openPicker(itemId: string) {
  pickerItemId.value = itemId
  pickerQuery.value = ''
  pickerOpen.value = true
}

function closePicker() {
  pickerOpen.value = false
  pickerItemId.value = null
  pickerQuery.value = ''
}

function redeemForStudent(studentId: string) {
  if (!pickerItemId.value) return
  msg.value = null
  const res = app.redeemShopItem(studentId, pickerItemId.value)
  if (!res.ok) msg.value = res.reason
  else msg.value = '兑换成功'
  closePicker()
}

// 管理：编辑器（MVP：同弹窗内简化表单）
const editing = ref<ShopItem | null>(null)
const showEditor = ref(false)
const editTitle = ref('')
const editDesc = ref('')
const editPrice = ref(1)
const editStock = ref(10)
const editCategory = ref<ShopItemCategory>('美食')
const editIcon = ref('🎁')
const showIconPicker = ref(false)

const iconPresets = [
  '🍪',
  '🍭',
  '🍫',
  '🍬',
  '🥤',
  '🍎',
  '🍌',
  '🍊',
  '🧃',
  '🍿',
  '✏️',
  '🖊️',
  '📚',
  '📓',
  '📒',
  '📦',
  '🎁',
  '🏅',
  '🎟️',
  '⭐',
  '🌟',
  '🎮',
  '🎲',
  '🧩',
  '🎨',
  '🎵',
  '🏀',
  '⚽',
  '🏸',
  '🎬',
  '🧸',
]

function startCreate() {
  editing.value = null
  showEditor.value = true
  editTitle.value = ''
  editDesc.value = ''
  editPrice.value = 10
  editStock.value = 10
  editCategory.value = '美食'
  editIcon.value = '🍪'
  showIconPicker.value = false
  msg.value = null
}

function startEdit(item: ShopItem) {
  editing.value = item
  showEditor.value = true
  editTitle.value = item.title
  editDesc.value = item.description
  editPrice.value = item.priceBadges
  editStock.value = item.stock
  editCategory.value = item.category
  editIcon.value = item.icon
  showIconPicker.value = false
  msg.value = null
}

function saveItem() {
  const id = app.upsertShopItem({
    id: editing.value?.id,
    title: editTitle.value.trim() || '新商品',
    description: editDesc.value.trim(),
    priceBadges: Math.max(0, Math.floor(editPrice.value)),
    stock: Math.max(-1, Math.floor(editStock.value)),
    category: editCategory.value,
    icon: editIcon.value || '🎁',
    enabled: true,
  })
  msg.value = `已保存商品：${id}`
  editing.value = null
  showEditor.value = false
  showIconPicker.value = false
}

function removeItem(item: ShopItem) {
  if (!confirm(`确定删除商品「${item.title}」吗？`)) return
  app.removeShopItem(item.id)
  msg.value = '已删除商品'
}

const studentName = (id: string) => active.value.students.find((s) => s.id === id)?.name ?? '未知'
const fmt = (ts: number) => new Date(ts).toLocaleString('zh-CN')
</script>

<template>
  <ModalBase @close="app.closeModal()">
    <template #title>🛍 小商店 <span class="ml-2 chip-en">GIFT STORE</span></template>

    <div class="tabs">
      <button class="tab" :class="{ active: tab === 'items' }" @click="tab = 'items'">🏪 商品列表</button>
      <button class="tab" :class="{ active: tab === 'records' }" @click="tab = 'records'">🕘 记录</button>
      <button class="tab" :class="{ active: tab === 'manage' }" @click="tab = 'manage'">🎛 管理商品</button>
    </div>

    <div v-if="tab === 'items'" class="mt-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="it in items" :key="it.id" class="item-card">
          <div class="flex items-start justify-between gap-3">
            <div class="icon">{{ it.icon }}</div>
            <div class="price">
              🏅 {{ it.priceBadges }}
            </div>
          </div>
          <div class="mt-2 text-lg font-semibold">{{ it.title }}</div>
          <div class="mt-1 text-sm text-slate-500">{{ it.description }}</div>
          <div class="mt-4 flex items-center justify-between">
            <div class="stock">库存 {{ it.stock < 0 ? '∞' : it.stock }}</div>
            <button
              class="btn-buy"
              :disabled="it.stock === 0"
              @click="openPicker(it.id)"
            >
              立即兑换
            </button>
          </div>
        </div>
      </div>

      <div v-if="pickerOpen && pickerItem" class="picker-mask" @click="closePicker">
        <div class="picker-modal" @click.stop>
          <div class="picker-title">
            <div class="text-lg font-semibold">
              谁要兑换 <span class="text-brand-600">{{ pickerItem.title }}</span>？
            </div>
            <button class="picker-x" @click="closePicker">✕</button>
          </div>

          <div class="picker-search">
            <span class="picker-search-ic">🔎</span>
            <input v-model="pickerQuery" class="picker-input" placeholder="搜索学生…" />
          </div>

          <div class="picker-list">
            <button
              v-for="s in pickerStudents"
              :key="s.id"
              class="picker-row"
              :disabled="s.badges < pickerItem.priceBadges || pickerItem.stock === 0"
              @click="redeemForStudent(s.id)"
            >
              <div class="picker-left">
                <div class="picker-avatar">{{ s.name.slice(0, 1) }}</div>
                <div class="min-w-0">
                  <div class="font-medium truncate">{{ s.name }}</div>
                  <div class="text-xs text-slate-500">徽章：{{ s.badges }}</div>
                </div>
              </div>
              <div class="picker-right">
                <span v-if="s.badges < pickerItem.priceBadges" class="picker-bad">不足</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="tab === 'records'" class="mt-4">
      <div class="table">
        <div class="thead">
          <div>时间</div>
          <div>学生</div>
          <div>商品</div>
          <div>花费</div>
          <div class="text-right">状态</div>
        </div>
        <div v-if="records.length === 0" class="empty">暂无购买记录</div>
        <div v-else class="tbody">
          <div v-for="r in records" :key="r.id" class="tr">
            <div class="text-slate-500 text-sm">{{ fmt(r.ts) }}</div>
            <div class="font-medium">{{ studentName(r.studentId) }}</div>
            <div class="text-slate-700">{{ r.itemTitle }}</div>
            <div class="text-slate-700">🏅 {{ r.costBadges }}</div>
            <div class="text-right">
              <span class="status" :class="r.status === 'success' ? 'ok' : 'cancel'">{{ r.status }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="mt-4">
      <div class="manage-top">
        <button class="btn" @click="startCreate">＋ 添加新商品</button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <div class="rounded-3xl border border-slate-200 bg-white p-4">
          <div class="font-semibold mb-3">商品列表</div>
          <div class="space-y-2 max-h-[55vh] overflow-auto pr-2">
            <div v-for="it in app.data.shopItems" :key="it.id" class="manage-item">
              <div class="flex items-center gap-3 min-w-0">
                <div class="icon-sm">{{ it.icon }}</div>
                <div class="min-w-0">
                  <div class="font-medium truncate">{{ it.title }}</div>
                  <div class="text-xs text-slate-500">🏅 {{ it.priceBadges }} · 库存 {{ it.stock < 0 ? '∞' : it.stock }}</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button class="icon-btn" title="编辑" @click="startEdit(it)">✎</button>
                <button class="icon-btn" title="删除" @click="removeItem(it)">🗑</button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="showEditor" class="rounded-3xl border border-slate-200 bg-white p-4">
          <div class="font-semibold mb-3">{{ editing ? '编辑商品' : '添加商品' }}</div>
          <div class="grid grid-cols-1 gap-3">
            <div class="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-3">
              <div>
                <div class="label">商品名称</div>
                <input v-model="editTitle" class="input" placeholder="如：免作业卡" />
              </div>
              <div>
                <div class="label">价格（徽章）</div>
                <input v-model.number="editPrice" type="number" class="input" />
              </div>
            </div>

            <div>
              <div class="label">描述说明</div>
              <textarea v-model="editDesc" rows="3" class="input" placeholder="简单描述这个商品的作用…" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-[60px_1fr_150px] gap-3 items-end">
              <div class="relative">
                <div class="label">图标</div>
                <button
                  type="button"
                  class="icon-pick"
                  title="选择图标"
                  @click="showIconPicker = !showIconPicker"
                >
                  <span class="text-xl">{{ editIcon || '🎁' }}</span>
                </button>

                <div v-if="showIconPicker" class="picker" @click.stop>
                  <div class="picker-head">
                    <div class="text-xs text-slate-500">点击选择，也可手动输入</div>
                    <button class="picker-close" type="button" @click="showIconPicker = false">✕</button>
                  </div>
                  <div class="picker-grid">
                    <button
                      v-for="ic in iconPresets"
                      :key="ic"
                      type="button"
                      class="pick-btn"
                      :class="ic === editIcon ? 'active' : ''"
                      @click="editIcon = ic; showIconPicker = false"
                    >
                      {{ ic }}
                    </button>
                  </div>
                  <input v-model="editIcon" class="input mt-3" placeholder="也可以手动输入：🍪/🎁/🪪…" />
                </div>
              </div>
              <div>
                <div class="label">分类</div>
                <select v-model="editCategory" class="input">
                  <option value="美食">美食</option>
                  <option value="文具">文具</option>
                  <option value="娱乐">娱乐</option>
                  <option value="特权">特权</option>
                  <option value="杂项">杂项</option>
                </select>
              </div>
              <div>
                <div class="label">库存数量</div>
                <input v-model.number="editStock" type="number" class="input" />
              </div>
            </div>

            <div class="actions">
              <button class="btn" @click="editing = null; showEditor = false; showIconPicker = false">取消</button>
              <button class="btn-primary" @click="saveItem">✓ 保存更改</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ModalBase>
</template>

<style scoped>
.chip-en {
  @apply text-xs rounded-full bg-brand-50 text-brand-700 border border-brand-200 px-2 py-1;
}
.tabs {
  @apply mt-2 flex items-center gap-2 border-b border-slate-100 pb-2;
}
.tab {
  @apply rounded-2xl px-3 py-2 text-sm border border-transparent hover:bg-slate-50 transition;
}
.tab.active {
  @apply bg-brand-50 text-brand-700 border border-brand-200;
}
.pill {
  @apply text-sm rounded-2xl bg-slate-50 border border-slate-200 px-4 py-2;
}
.item-card {
  @apply rounded-3xl border border-slate-100 bg-white p-5 shadow-soft;
}
.icon {
  @apply h-16 w-16 rounded-full bg-brand-50 grid place-items-center text-3xl;
}
.price {
  @apply text-sm rounded-2xl bg-brand-50 text-brand-800 border border-brand-200 px-3 py-2 font-semibold;
}
.stock {
  @apply text-xs text-slate-500;
}
.btn-buy {
  @apply rounded-2xl px-6 py-2 text-sm bg-brand-500 text-white hover:bg-brand-600 transition shadow-soft disabled:opacity-50 disabled:cursor-not-allowed;
}
.table {
  @apply rounded-3xl border border-slate-200 bg-white overflow-hidden;
}
.thead {
  @apply grid grid-cols-[220px_1fr_1fr_140px_120px] gap-3 px-4 py-3 text-xs text-slate-500 bg-slate-50;
}
.tbody {
  @apply divide-y divide-slate-100;
}
.tr {
  @apply grid grid-cols-[220px_1fr_1fr_140px_120px] gap-3 px-4 py-3 items-center;
}
.empty {
  @apply px-4 py-10 text-center text-slate-500;
}
.status {
  @apply text-xs rounded-full px-2 py-1 border;
}
.status.ok {
  @apply bg-emerald-50 text-emerald-700 border-emerald-200;
}
.status.cancel {
  @apply bg-rose-50 text-rose-700 border-rose-200;
}
.manage-top {
  @apply flex justify-start;
}
.manage-item {
  @apply flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-3;
}
.icon-sm {
  @apply h-10 w-10 rounded-2xl bg-brand-50 grid place-items-center text-xl;
}
.icon-pick {
  @apply h-10 w-14 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition grid place-items-center;
}
.picker {
  @apply absolute left-0 top-[56px] z-10 w-[280px] rounded-3xl border border-slate-200 bg-white shadow-soft p-3;
}
.picker-head {
  @apply flex items-center justify-between mb-2;
}
.picker-close {
  @apply h-8 w-8 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition grid place-items-center text-slate-500;
}
.picker-grid {
  @apply grid grid-cols-8 gap-1;
}
.pick-btn {
  @apply h-9 w-9 rounded-2xl border border-transparent hover:bg-slate-50 transition grid place-items-center text-xl;
}
.pick-btn.active {
  @apply bg-brand-50 border border-brand-200;
}
.icon-btn {
  @apply h-10 w-10 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition grid place-items-center;
}
.label {
  @apply text-xs text-slate-500 mb-1;
}
.input {
  @apply w-full rounded-2xl border-slate-200 bg-white/80;
}
.actions {
  @apply mt-2 flex justify-end gap-2;
}
.btn {
  @apply rounded-2xl px-4 py-2 text-sm border border-slate-200 bg-white hover:bg-slate-50 transition;
}
.btn-primary {
  @apply rounded-2xl px-6 py-2 text-sm bg-brand-500 text-white hover:bg-brand-600 transition shadow-soft;
}
.picker-mask {
  @apply fixed inset-0 z-50 bg-black/30 grid place-items-center p-4;
}
.picker-modal {
  @apply w-full max-w-xl rounded-3xl bg-white shadow-soft border border-slate-100 overflow-hidden;
}
.picker-title {
  @apply px-6 py-5 flex items-center justify-between;
}
.picker-x {
  @apply h-9 w-9 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition grid place-items-center text-slate-500;
}
.picker-search {
  @apply px-6 pb-4;
}
.picker-search-ic {
  @apply absolute;
}
.picker-search {
  @apply relative;
}
.picker-search-ic {
  @apply left-9 top-1/2 -translate-y-1/2 text-slate-400;
}
.picker-input {
  @apply w-full rounded-2xl border border-brand-400 bg-white pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-brand-100;
}
.picker-list {
  @apply px-6 pb-6 space-y-2 max-h-[50vh] overflow-auto;
}
.picker-row {
  @apply w-full flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-4 hover:border-brand-200 transition disabled:opacity-60 disabled:cursor-not-allowed;
}
.picker-left {
  @apply flex items-center gap-3 min-w-0;
}
.picker-avatar {
  @apply h-10 w-10 rounded-full bg-slate-100 grid place-items-center font-semibold text-slate-600 shrink-0;
}
.picker-right {
  @apply text-sm text-slate-400;
}
.picker-bad {
  @apply text-sm text-slate-400;
}
</style>

