<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const links = [
  { to: '/dev/parity', label: 'Parity' },
  { to: '/dev/sandbox', label: 'Sandbox' },
  { to: '/dev/tests', label: 'Tests' },
] as const

const isActive = (to: string) => route.path === to || route.path.startsWith(`${to}/`)

const pageTitle = computed(() => {
  if (route.path.startsWith('/dev/parity')) return 'Parity Board'
  if (route.path.startsWith('/dev/sandbox')) return 'Sandbox'
  if (route.path.startsWith('/dev/tests')) return 'Tests'
  return 'Dev Workbench'
})
</script>

<template>
  <div class="min-h-screen">
    <header class="border-b border-[var(--line)] bg-white/40 backdrop-blur-sm">
      <div class="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p class="font-mono text-xs tracking-[0.18em] text-[var(--mute)] uppercase">
            Angband Phaser Port
          </p>
          <h1 class="font-serif text-2xl tracking-tight text-[var(--ink)] sm:text-3xl">
            {{ pageTitle }}
          </h1>
        </div>

        <nav class="flex flex-wrap gap-1" aria-label="Dev shell">
          <RouterLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="rounded px-3 py-1.5 text-sm transition"
            :class="
              isActive(link.to)
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--ink)] hover:bg-[var(--paper-2)]'
            "
          >
            {{ link.label }}
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <RouterView />
    </main>
  </div>
</template>
