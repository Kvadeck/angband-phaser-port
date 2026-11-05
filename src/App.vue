<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import type { Game } from 'phaser'
import { createDungeonGame } from '@/render/phaser/createDungeonGame'
import GameHud from '@/ui/components/GameHud.vue'

const phaserHost = ref<HTMLElement | null>(null)
const game = shallowRef<Game | null>(null)

onMounted(() => {
  if (!phaserHost.value) {
    return
  }

  game.value = createDungeonGame(phaserHost.value)
})

onBeforeUnmount(() => {
  game.value?.destroy(true)
  game.value = null
})
</script>

<template>
  <div class="app-shell">
    <GameHud />
    <div ref="phaserHost" class="phaser-host" aria-label="Dungeon view" />
  </div>
</template>
