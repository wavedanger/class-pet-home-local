<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { petStageSrc } from '@/lib/pets'

const app = useAppStore()

const payload = computed(() => app.ui.levelUp)
const petImg = computed(() => {
  const p = payload.value
  if (!p) return undefined
  return petStageSrc(p.petId, p.level)
})

let prevBodyOverflow = ''
let prevHtmlOverflow = ''

onMounted(() => {
  prevBodyOverflow = document.body.style.overflow
  prevHtmlOverflow = document.documentElement.style.overflow
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
})

onBeforeUnmount(() => {
  document.body.style.overflow = prevBodyOverflow
  document.documentElement.style.overflow = prevHtmlOverflow
})

function close() {
  app.closeLevelUp()
}
</script>

<template>
  <div v-if="payload" class="wrap" @click="close">
    <div class="rays"></div>
    <div class="stars">
      <span v-for="i in 18" :key="i" class="star" :style="{ '--i': i }">★</span>
    </div>

    <div class="content" @click="close">
      <div class="title">
        <span class="spark">✦</span>
        <span class="level">LEVEL</span>
        <span class="up">UP!</span>
        <span class="spark">✦</span>
      </div>

      <div class="subtitle">
        恭喜 <span class="name">{{ payload.studentName }}</span> 的神兽升到新等级！
      </div>

      <div class="card">
        <div class="ring">
          <div class="ring-inner">
            <img v-if="petImg" :src="petImg" class="pet" alt="pet" />
          </div>
        </div>

        <div class="lv">Lv.<br /><span class="n">{{ payload.level }}</span></div>
      </div>

      <div class="hint">— 点击屏幕继续 —</div>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  position: fixed;
  inset: 0;
  z-index: 70;
  background: rgba(15, 23, 42, 0.65);
  overflow: hidden;
}
.content {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  text-align: center;
  color: white;
}
.title {
  font-weight: 900;
  letter-spacing: 0.06em;
  font-size: clamp(34px, 6vw, 64px);
  margin-bottom: 10px;
  text-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}
.level {
  color: #fff;
  font-style: italic;
  text-shadow: 0 0 0 rgba(0,0,0,0.35), 0 0 18px rgba(255, 191, 0, 0.35);
}
.up {
  margin-left: 10px;
  color: #ffbf00;
  font-style: italic;
  text-shadow: 0 10px 30px rgba(0, 0, 0, 0.35), 0 0 20px rgba(255, 191, 0, 0.55);
}
.spark {
  color: #ffbf00;
  margin: 0 10px;
  opacity: 0.9;
}
.subtitle {
  font-size: 16px;
  opacity: 0.95;
  margin-bottom: 18px;
}
.subtitle .name {
  color: #ffbf00;
  font-weight: 800;
}
.card {
  position: relative;
  width: min(340px, 82vw);
  aspect-ratio: 1 / 1;
  display: grid;
  place-items: center;
  margin: 10px auto 0;
}
.ring {
  width: 86%;
  height: 86%;
  border-radius: 999px;
  background: radial-gradient(circle at 40% 30%, rgba(255,255,255,0.96), rgba(255,255,255,0.82));
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.35),
    0 0 0 10px rgba(255, 191, 0, 0.25),
    0 0 0 2px rgba(255, 255, 255, 0.18) inset;
  position: relative;
  animation: pop 520ms cubic-bezier(.2,.9,.2,1);
}
.ring::after {
  content: '';
  position: absolute;
  inset: 14px;
  border-radius: 999px;
  border: 2px dashed rgba(255, 191, 0, 0.5);
}
.ring-inner {
  position: absolute;
  inset: 26px;
  border-radius: 999px;
  display: grid;
  place-items: center;
}
.pet {
  width: 70%;
  height: 70%;
  object-fit: contain;
  filter: drop-shadow(0 16px 22px rgba(0, 0, 0, 0.25));
  animation: float 1600ms ease-in-out infinite;
}
.lv {
  position: absolute;
  right: 10%;
  bottom: 14%;
  width: 88px;
  height: 88px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #e24b2a;
  border: 5px solid rgba(255, 255, 255, 0.88);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.3);
  font-weight: 900;
  line-height: 1.05;
  animation: badge 650ms cubic-bezier(.2,.9,.2,1);
}
.lv .n {
  font-size: 28px;
}
.hint {
  margin-top: 14px;
  font-size: 12px;
  opacity: 0.85;
}

.rays {
  position: absolute;
  inset: -20%;
  background:
    conic-gradient(
      from 0deg,
      rgba(255, 191, 0, 0.00),
      rgba(255, 191, 0, 0.33),
      rgba(255, 191, 0, 0.00),
      rgba(255, 191, 0, 0.28),
      rgba(255, 191, 0, 0.00)
    );
  filter: blur(0.2px);
  opacity: 0.85;
  animation: spin 7s linear infinite;
  transform-origin: center;
}
.stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.star {
  position: absolute;
  left: calc((var(--i) * 37px) % 100vw);
  top: -20px;
  font-size: calc(10px + (var(--i) % 4) * 3px);
  color: rgba(255, 221, 102, 0.9);
  text-shadow: 0 8px 22px rgba(0, 0, 0, 0.25);
  animation: fall calc(2.6s + (var(--i) % 5) * 0.35s) linear infinite;
  animation-delay: calc((var(--i) % 9) * -0.25s);
  opacity: 0.95;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes fall {
  0% { transform: translateY(-30px) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateY(120vh) rotate(280deg); opacity: 0.05; }
}
@keyframes pop {
  0% { transform: scale(0.88); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes badge {
  0% { transform: scale(0.7) rotate(-12deg); opacity: 0; }
  65% { transform: scale(1.08) rotate(6deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
</style>

