<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useHudStore } from '@/ui/stores/hudStore'

const hudStore = useHudStore()
const { depth, hitPoints, maxHitPoints, messages } = storeToRefs(hudStore)
</script>

<template>
  <header class="game-hud">
    <div class="game-hud__stats">
      <span>Depth: {{ depth }}</span>
      <span>HP: {{ hitPoints }}/{{ maxHitPoints }}</span>
    </div>
    <ul class="game-hud__messages" aria-live="polite">
      <li v-for="(message, index) in messages" :key="`${index}-${message}`">
        {{ message }}
      </li>
    </ul>
  </header>
</template>

<style scoped>
.game-hud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.5rem;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #2a261f;
  background: #14110e;
}

.game-hud__stats {
  display: flex;
  gap: 1.25rem;
  font-size: 0.95rem;
}

.game-hud__messages {
  margin: 0;
  padding: 0;
  list-style: none;
  max-width: min(40rem, 100%);
  font-size: 0.85rem;
  color: #9a9284;
}

.game-hud__messages li + li {
  margin-top: 0.15rem;
}
</style>
