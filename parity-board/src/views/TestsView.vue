<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

type TestsStatus = {
  online: boolean
  url: string
  port?: number
  path?: string
}

const testsStatus = ref<TestsStatus | null>(null)
const loading = ref(false)
const error = ref('')
let pollTimer: ReturnType<typeof setInterval> | null = null

const loadTestsStatus = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch('/api/tests')
    if (!response.ok) {
      throw new Error(`Failed to load tests status (${response.status})`)
    }
    testsStatus.value = (await response.json()) as TestsStatus
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load'
    testsStatus.value = { online: false, url: '/tests' }
  } finally {
    loading.value = false
  }
}

const handleRefresh = () => {
  void loadTestsStatus()
}

onMounted(() => {
  void loadTestsStatus()
  pollTimer = setInterval(() => {
    void loadTestsStatus()
  }, 10000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <div class="max-w-xl">
    <p class="mb-6 text-sm text-[var(--mute)]">
      Vitest UI runs separately. This page shows whether it is reachable and gives a direct link.
    </p>

    <div class="rounded border border-[var(--line)] bg-white/60 p-5">
      <div class="mb-4 flex items-center gap-3">
        <span
          class="size-3 rounded-full"
          :class="testsStatus?.online ? 'bg-[var(--parity)]' : 'bg-[var(--stub)]'"
        />
        <div>
          <p class="font-medium">
            {{ testsStatus?.online ? 'Vitest UI online' : 'Vitest UI offline' }}
          </p>
          <p class="font-mono text-xs text-[var(--mute)]">
            {{ testsStatus?.url || '—' }}
          </p>
        </div>
      </div>

      <p v-if="error" class="mb-3 text-sm text-red-800">{{ error }}</p>
      <p v-else-if="loading && !testsStatus" class="mb-3 text-sm text-[var(--mute)]">
        Checking…
      </p>

      <div class="flex flex-wrap gap-2">
        <a
          class="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
          :href="testsStatus?.url || '/tests'"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Vitest UI
        </a>
        <button
          type="button"
          class="rounded border border-[var(--line)] bg-white/70 px-3 py-2 text-sm transition hover:bg-white"
          :disabled="loading"
          @click="handleRefresh"
        >
          Refresh
        </button>
      </div>

      <p class="mt-4 text-xs text-[var(--mute)]">
        Start with <code class="font-mono">npm run test:ui</code> from the repo root if offline.
      </p>
    </div>
  </div>
</template>
