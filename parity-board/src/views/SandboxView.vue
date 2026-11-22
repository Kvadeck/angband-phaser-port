<script setup lang="ts">
import { ref } from 'vue'
import TsEditor from '../components/sandbox/TsEditor.vue'
import {
  getSandboxTemplate,
  sandboxTemplates,
  type SandboxTemplateId,
} from '../lib/sandboxTemplates'
import { runSandboxTs, type ConsoleLine } from '../lib/runSandboxTs'

const activeTemplateId = ref<SandboxTemplateId>('queue')
const code = ref(getSandboxTemplate('queue').code)
const lines = ref<ConsoleLine[]>([])
const running = ref(false)
const runError = ref('')

const handleSelectTemplate = (id: SandboxTemplateId) => {
  activeTemplateId.value = id
  code.value = getSandboxTemplate(id).code
  lines.value = []
  runError.value = ''
}

const handleRun = async () => {
  running.value = true
  runError.value = ''
  lines.value = []
  try {
    const result = await runSandboxTs(code.value)
    lines.value = result.lines
    if (!result.ok && result.error) {
      runError.value = result.error
    }
  } catch (err) {
    runError.value = err instanceof Error ? err.message : String(err)
  } finally {
    running.value = false
  }
}

const handleClearConsole = () => {
  lines.value = []
  runError.value = ''
}

const levelClass = (level: ConsoleLine['level']) => {
  if (level === 'error') return 'text-red-300'
  if (level === 'warn') return 'text-amber-200'
  return 'text-[#d4d4d4]'
}
</script>

<template>
  <div class="flex flex-col gap-4 lg:flex-row lg:items-stretch">
    <aside class="w-full shrink-0 lg:w-56">
      <p class="mb-2 text-xs tracking-wide text-[var(--mute)] uppercase">Templates</p>
      <ul class="flex flex-row gap-1 overflow-x-auto lg:flex-col">
        <li v-for="template in sandboxTemplates" :key="template.id">
          <button
            type="button"
            class="w-full rounded px-3 py-2 text-left text-sm transition"
            :class="
              activeTemplateId === template.id
                ? 'bg-[var(--accent)] text-white'
                : 'hover:bg-[var(--paper-2)]'
            "
            @click="handleSelectTemplate(template.id)"
          >
            <span class="block font-medium">{{ template.label }}</span>
            <span
              class="mt-0.5 block text-xs"
              :class="activeTemplateId === template.id ? 'text-white/80' : 'text-[var(--mute)]'"
            >
              {{ template.description }}
            </span>
          </button>
        </li>
      </ul>
      <p class="mt-3 text-xs text-[var(--mute)]">
        Helpers in scope (no imports): <code class="font-mono">loc*</code>,
        <code class="font-mono">qNew</code>, <code class="font-mono">qPush</code>, …
      </p>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm text-[var(--mute)]">
          TypeScript playground — edit, Run, read console.
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded border border-[var(--line)] bg-white px-3 py-1.5 text-sm hover:bg-[var(--paper-2)]"
            @click="handleClearConsole"
          >
            Clear console
          </button>
          <button
            type="button"
            class="rounded bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
            :disabled="running"
            @click="handleRun"
          >
            {{ running ? 'Running…' : 'Run' }}
          </button>
        </div>
      </div>

      <div class="h-[min(55vh,520px)] min-h-[280px]">
        <TsEditor v-model="code" />
      </div>

      <section class="rounded border border-[var(--line)] bg-[#1e1e1e] p-3 text-[#d4d4d4]">
        <div class="mb-2 flex items-center justify-between gap-2">
          <p class="font-mono text-xs tracking-wide text-[#9d9d9d] uppercase">Console</p>
          <p v-if="runError" class="font-mono text-xs text-red-300">{{ runError }}</p>
        </div>
        <ul
          v-if="lines.length"
          class="max-h-56 space-y-1 overflow-y-auto font-mono text-xs leading-relaxed"
        >
          <li
            v-for="(line, index) in lines"
            :key="`${line.at}-${index}`"
            :class="levelClass(line.level)"
            class="whitespace-pre-wrap break-words"
          >
            <span class="mr-2 text-[#6a6a6a]">{{ line.level }}</span>
            <span>{{ line.text }}</span>
          </li>
        </ul>
        <p v-else class="font-mono text-xs text-[#6a6a6a]">No output yet. Press Run.</p>
      </section>
    </div>
  </div>
</template>
