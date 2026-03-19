<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import ModalBase from '@/components/modals/ModalBase.vue'

const app = useAppStore()

const active = computed(() => app.activeClassroom)
const studentCount = computed(() => active.value.students.length)

const showAdd = ref(false)
const newStudentName = ref('')
const newStudentNumber = ref('')
const formMsg = ref<string | null>(null)

const showImport = ref(false)
const importText = ref('')
const importMsg = ref<string | null>(null)

const newClassName = ref('')
const addingClass = ref(false)
const editingClassId = ref<string | null>(null)
const editClassName = ref('')

function addStudent() {
  formMsg.value = null
  const before = active.value.students.length
  app.addStudentToActiveClassroom(newStudentName.value, newStudentNumber.value)
  const after = active.value.students.length
  if (after === before) {
    formMsg.value = '添加失败：请检查姓名是否为空，学号是否为纯数字且不重复'
    return
  }
  newStudentName.value = ''
  newStudentNumber.value = ''
  showAdd.value = false
}

function addClassroom() {
  app.addClassroom(newClassName.value)
  newClassName.value = ''
  addingClass.value = false
}

function startImport() {
  const n = app.bulkImportStudentsToActiveClassroom(importText.value)
  importMsg.value = `已导入 ${n} 位学生`
  importText.value = ''
  showImport.value = false
}

function setActive(id: string) {
  app.setActiveClassroom(id)
}

function openEditClassroom(id: string) {
  const c = app.data.classrooms.find((x) => x.id === id)
  if (!c) return
  editingClassId.value = id
  editClassName.value = c.name
}

function cancelEditClassroom() {
  editingClassId.value = null
  editClassName.value = ''
}

function saveEditClassroom() {
  if (!editingClassId.value) return
  const ok = app.updateClassroomName(editingClassId.value, editClassName.value)
  if (!ok) return
  editingClassId.value = null
}

function removeClassroom(id: string) {
  const c = app.data.classrooms.find((x) => x.id === id)
  if (!c) return
  if (app.data.classrooms.length <= 1) {
    alert('至少需要保留 1 个班级')
    return
  }
  if (!confirm(`确定要删除「${c.name}」吗？该班级的学生与相关记录将一并清理。此操作不可逆。`)) return
  const ok = app.removeClassroom(id)
  if (!ok) alert('删除失败：至少需要保留 1 个班级')
  if (editingClassId.value === id) cancelEditClassroom()
}

const studentsSorted = computed(() => {
  const list = [...active.value.students]
  const num = (s: { number?: string }) => {
    const n = Number.parseInt(s.number ?? '', 10)
    return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY
  }
  return list.sort((a, b) => num(a) - num(b))
})

const editingId = ref<string | null>(null)
const editName = ref('')
const editNumber = ref('')

function openEdit(id: string) {
  const s = active.value.students.find((x) => x.id === id)
  if (!s) return
  editingId.value = id
  editName.value = s.name
  editNumber.value = s.number ?? ''
  formMsg.value = null
}

function saveEdit() {
  if (!editingId.value) return
  const ok = app.updateStudentInActiveClassroom(editingId.value, { name: editName.value, number: editNumber.value })
  if (!ok) {
    formMsg.value = '保存失败：请检查姓名是否为空，学号是否为纯数字且不重复'
    return
  }
  editingId.value = null
}

function removeStudent(id: string) {
  if (!confirm('确定要删除该学生吗？（相关评价记录也会一并清理）')) return
  app.removeStudentFromActiveClassroom(id)
}
</script>

<template>
  <ModalBase @close="app.closeModal()">
    <template #title>🏫 班级与学生管理 <span class="chip-en">CLASS MANAGER</span></template>

    <div class="layout">
      <aside class="sidebar">
        <div class="sidebar-head">
          <div class="font-semibold flex items-center gap-2">
            <span class="text-brand-600">🏫</span>
            班级列表
          </div>
          <button v-if="!addingClass" class="icon-btn" title="新增班级" @click="addingClass = true">＋</button>
        </div>

        <div v-if="addingClass" class="px-3 pb-3">
          <input v-model="newClassName" class="w-full rounded-2xl border-slate-200 bg-white" placeholder="输入班级名称…" />
          <div class="mt-2 flex items-center justify-end gap-2 text-xs text-slate-500">
            <button class="btn-sm text-slate-500" @click="addingClass = false; newClassName = ''">取消</button>
            <button class="btn-sm" :disabled="!newClassName.trim()" @click="addClassroom">添加</button>
          </div>
        </div>

        <div class="class-list">
          <div
            v-for="c in app.data.classrooms"
            :key="c.id"
            class="class-item group"
            :class="{ active: c.id === app.data.activeClassroomId }"
            role="button"
            tabindex="0"
            @click="setActive(c.id)"
          >
            <template v-if="editingClassId === c.id">
              <input v-model="editClassName" class="class-input" placeholder="班级名称…" @click.stop />
              <div
                class="class-actions flex items-center gap-2 shrink-0"
              >
                <button class="icon-action-sm" title="取消" @click.stop="cancelEditClassroom">✕</button>
                <button class="icon-action-sm" title="保存" :disabled="!editClassName.trim()" @click.stop="saveEditClassroom">
                  ✓
                </button>
              </div>
            </template>

            <template v-else>
              <div class="min-w-0">
                <div class="font-semibold truncate">{{ c.name }}</div>
                <div v-if="c.id === app.data.activeClassroomId" class="tag">当前使用</div>
              </div>
              <div
                class="class-actions class-actions-hover flex items-center gap-2 shrink-0"
              >
                <button class="icon-action-sm" title="编辑" @click.stop="openEditClassroom(c.id)">✎</button>
                <button class="icon-action-sm" title="删除" @click.stop="removeClassroom(c.id)">🗑</button>
              </div>
            </template>
          </div>
        </div>
      </aside>

      <section class="content">
        <div class="content-head">
          <div class="flex items-center gap-3">
            <div class="text-2xl font-semibold">{{ active.name }}</div>
            <div class="pill">{{ studentCount }} 位学生</div>
          </div>

          <div class="flex items-center gap-2">
            <button class="btn-primary" @click="showAdd = true">👤 添加学生</button>
            <button class="btn-secondary" @click="showImport = true">📄 批量导入</button>
          </div>
        </div>

        <div v-if="importMsg" class="mt-3 text-sm text-slate-600">{{ importMsg }}</div>
        <div v-if="formMsg" class="mt-3 text-sm text-rose-600 px-6">{{ formMsg }}</div>

        <div v-if="showAdd" class="add-panel">
          <div class="add-head">
            <div class="flex items-center gap-2 font-semibold text-slate-800">
              <span class="text-brand-600">👤</span>
              添加新学生
            </div>
            <button class="text-slate-400 hover:text-slate-700" @click="showAdd = false">✕</button>
          </div>

          <div class="add-form">
            <input v-model="newStudentName" class="input-lg" placeholder="新学生姓名…" />
            <input v-model="newStudentNumber" class="input-lg" placeholder="学号（可选，纯数字）" />
            <button class="plus-btn" :disabled="!newStudentName.trim()" @click="addStudent">＋</button>
          </div>
        </div>

        <div v-if="showImport" class="import-panel">
          <div class="import-head">
            <div class="flex items-center gap-2 font-semibold text-slate-800">
              <span class="text-indigo-500">👥</span>
              批量导入
            </div>
            <button class="text-slate-400 hover:text-slate-700" @click="showImport = false">✕</button>
          </div>

          <textarea
            v-model="importText"
            rows="5"
            class="w-full rounded-2xl border-slate-200"
            placeholder="直接粘贴或输入，每行一位：&#10;张小花 101&#10;杨四 102&#10;王小五 103"
          />
          <div class="hint">格式：姓名 123（空格分隔），学号可选</div>

          <div class="import-actions">
            <button class="btn" @click="showImport = false">取消</button>
            <button class="btn-indigo" :disabled="!importText.trim()" @click="startImport">开始导入</button>
          </div>
        </div>

        <div class="student-list">
          <div
            v-for="s in studentsSorted"
            :key="s.id"
            class="student-item group"
          >
            <div class="avatar">{{ s.name.slice(0, 1) }}</div>
            <div class="min-w-0">
              <div class="font-semibold truncate">{{ s.name }}</div>
              <div class="text-xs text-slate-500">学号：{{ s.number ?? '—' }}</div>
            </div>
            <div class="ml-auto flex items-center gap-2 student-actions student-actions-hover">
              <button class="icon-action" title="编辑" @click.stop="openEdit(s.id)">✎</button>
              <button class="icon-action" title="删除" @click.stop="removeStudent(s.id)">🗑</button>
            </div>
          </div>
        </div>

        <div v-if="editingId" class="edit-panel">
          <div class="edit-head">
            <div class="font-semibold">编辑学生</div>
            <button class="text-slate-400 hover:text-slate-700" @click="editingId = null">✕</button>
          </div>
          <div class="edit-form">
            <input v-model="editName" class="input-lg" placeholder="姓名" />
            <input v-model="editNumber" class="input-lg" placeholder="学号（纯数字，可空）" />
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button class="btn" @click="editingId = null">取消</button>
            <button class="btn-primary" @click="saveEdit">保存</button>
          </div>
        </div>
      </section>
    </div>
  </ModalBase>
</template>

<style scoped>
.layout {
  @apply flex gap-0 border border-slate-100 rounded-3xl overflow-hidden;
}
.sidebar {
  @apply w-64 shrink-0 bg-slate-50 border-r border-slate-100;
}
.sidebar-head {
  @apply px-4 py-4 flex items-center justify-between;
}
.icon-btn {
  @apply h-8 w-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition;
}
.btn-sm {
  @apply rounded-2xl px-3 py-1.5 text-xs border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed;
}
.class-list {
  @apply p-3 space-y-2;
}
.class-item {
  @apply w-full text-left rounded-2xl border border-transparent bg-white px-4 py-3 shadow-soft hover:border-brand-200 transition flex items-center justify-between gap-3 cursor-pointer select-none;
}
.class-item.active {
  @apply bg-brand-500 text-white border-brand-600;
}
.class-actions {
  @apply shrink-0;
}
.class-actions-hover {
  @apply opacity-0 pointer-events-none transition;
}
.class-item:hover .class-actions-hover,
.class-item:focus-within .class-actions-hover {
  @apply opacity-100 pointer-events-auto;
}
.class-item.active:hover .class-actions-hover,
.class-item.active:focus-within .class-actions-hover {
  @apply opacity-100 pointer-events-auto;
}
.icon-action-sm {
  @apply h-9 w-9 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition grid place-items-center disabled:opacity-50 disabled:cursor-not-allowed;
}
.class-item.active .icon-action-sm {
  @apply border-white/40 bg-white/10 hover:bg-white/15 text-white;
}
.class-input {
  @apply w-full rounded-2xl border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900;
}
.tag {
  @apply mt-2 inline-flex text-xs rounded-full px-2 py-1 bg-white/20 text-white;
}
.content {
  @apply flex-1 bg-white;
}
.content-head {
  @apply px-6 py-5 flex items-center justify-between border-b border-slate-100;
}
.pill {
  @apply text-xs rounded-full bg-slate-100 text-slate-600 px-3 py-1;
}
.btn-primary {
  @apply rounded-2xl px-4 py-2 text-sm bg-brand-500 text-white hover:bg-brand-600 transition shadow-soft;
}
.btn-secondary {
  @apply rounded-2xl px-4 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition;
}
.import-panel {
  @apply mt-4 mx-6 rounded-3xl border border-slate-200 bg-white p-5;
}
.import-head {
  @apply flex items-center justify-between mb-3;
}
.hint {
  @apply mt-2 text-xs text-slate-500 text-right;
}
.import-actions {
  @apply mt-4 flex items-center justify-end gap-2;
}
.btn {
  @apply rounded-2xl px-4 py-2 text-sm border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-indigo {
  @apply rounded-2xl px-6 py-2 text-sm bg-indigo-500 text-white hover:bg-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed;
}
.add-panel {
  @apply mt-4 mx-6 rounded-3xl border border-slate-200 bg-white p-5;
}
.add-head {
  @apply flex items-center justify-between mb-3;
}
.add-form {
  @apply grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-center;
}
.input-lg {
  @apply rounded-2xl border-slate-200 bg-white/80 px-4 py-3;
}
.plus-btn {
  @apply h-12 w-14 rounded-2xl bg-brand-500 text-white text-2xl grid place-items-center hover:bg-brand-600 transition disabled:opacity-50 disabled:cursor-not-allowed;
}
.student-list {
  @apply p-6 grid grid-cols-1 sm:grid-cols-2 gap-3;
}
.student-item {
  @apply rounded-3xl border border-slate-100 bg-white px-4 py-4 shadow-soft flex items-center gap-3 hover:border-brand-200 transition;
}
.student-actions-hover {
  @apply opacity-0 pointer-events-none transition;
}
.student-item:hover .student-actions-hover,
.student-item:focus-within .student-actions-hover {
  @apply opacity-100 pointer-events-auto;
}
.avatar {
  @apply h-12 w-12 rounded-full bg-indigo-600 text-white grid place-items-center font-semibold;
}
.icon-action {
  @apply h-10 w-10 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition grid place-items-center;
}
.edit-panel {
  @apply mx-6 mb-6 rounded-3xl border border-slate-200 bg-white p-5 sticky bottom-4 shadow-soft;
}
.edit-head {
  @apply flex items-center justify-between;
}
.edit-form {
  @apply mt-3 grid grid-cols-1 md:grid-cols-2 gap-3;
}
</style>

