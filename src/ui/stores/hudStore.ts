import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useHudStore = defineStore('hud', () => {
  const depth = ref(1)
  const hitPoints = ref(20)
  const maxHitPoints = ref(20)
  const messages = ref<string[]>(['Welcome to Angband Remaster (bootstrap).'])

  const pushMessage = (message: string): void => {
    messages.value = [message, ...messages.value].slice(0, 5)
  }

  return {
    depth,
    hitPoints,
    maxHitPoints,
    messages,
    pushMessage,
  }
})
