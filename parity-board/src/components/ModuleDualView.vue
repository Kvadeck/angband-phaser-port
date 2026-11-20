<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { ParityModule, ParityStatus } from '../types'
import { highlightCode } from '../lib/highlight'
import { resolveTypescriptPaths, resolveUpstreamPaths } from '../lib/paths'

const props = defineProps<{
  module: ParityModule
}>()

const emit = defineEmits<{
  back: []
  cycleStatus: [moduleId: string]
  notesInput: [moduleId: string, notes: string]
  toggleFunction: [moduleId: string, functionId: string]
  addFunction: [moduleId: string, c: string, ts: string]
  removeFunction: [moduleId: string, functionId: string]
}>()

type SourceFile = {
  path: string
  content: string
  error: string
}

const cFiles = ref<SourceFile[]>([])
const tsFiles = ref<SourceFile[]>([])
const activeCPath = ref('')
const activeTsPath = ref('')
const loadingSources = ref(false)
const newC = ref('')
const newTs = ref('')

const functions = computed(() => props.module.functions ?? [])
const doneCount = computed(() => functions.value.filter((item) => item.done).length)

const activeC = computed(
  () => cFiles.value.find((file) => file.path === activeCPath.value) ?? cFiles.value[0] ?? null,
)
const activeTs = computed(
  () => tsFiles.value.find((file) => file.path === activeTsPath.value) ?? tsFiles.value[0] ?? null,
)

const highlightedC = computed(() => {
  if (!activeC.value || activeC.value.error) return ''
  return highlightCode(activeC.value.content, 'c')
})

const highlightedTs = computed(() => {
  if (!activeTs.value || activeTs.value.error) return ''
  return highlightCode(activeTs.value.content, 'typescript')
})

const statusClass = (status: ParityStatus) => {
  if (status === 'parity') {
    return 'bg-[var(--accent-soft)] text-[var(--parity)] ring-[var(--parity)]/30'
  }
  if (status === 'partial') {
    return 'bg-[var(--warn-soft)] text-[var(--partial)] ring-[var(--partial)]/30'
  }
  return 'bg-[var(--paper-2)] text-[var(--stub)] ring-[var(--line)]'
}

const loadSource = async (filePath: string): Promise<SourceFile> => {
  try {
    const response = await fetch(`/api/source?path=${encodeURIComponent(filePath)}`)
    const payload = (await response.json()) as { content?: string; error?: string }
    if (!response.ok) {
      return { path: filePath, content: '', error: payload.error || `HTTP ${response.status}` }
    }
    return { path: filePath, content: payload.content || '', error: '' }
  } catch (err) {
    return {
      path: filePath,
      content: '',
      error: err instanceof Error ? err.message : 'Failed to load',
    }
  }
}

const loadSources = async () => {
  loadingSources.value = true
  const upstreamPaths = resolveUpstreamPaths(props.module.upstream)
  const typescriptPaths = resolveTypescriptPaths(props.module.typescript)

  const [cLoaded, tsLoaded] = await Promise.all([
    Promise.all(upstreamPaths.map((filePath) => loadSource(filePath))),
    Promise.all(typescriptPaths.map((filePath) => loadSource(filePath))),
  ])

  cFiles.value = cLoaded
  tsFiles.value = tsLoaded
  activeCPath.value = cLoaded[0]?.path || ''
  activeTsPath.value = tsLoaded[0]?.path || ''
  loadingSources.value = false
}

const handleBack = () => {
  emit('back')
}

const handleCycleStatus = () => {
  emit('cycleStatus', props.module.id)
}

const handleNotesChange = (event: Event) => {
  const target = event.target
  if (!(target instanceof HTMLTextAreaElement)) return
  emit('notesInput', props.module.id, target.value)
}

const handleToggleFunction = (functionId: string) => {
  emit('toggleFunction', props.module.id, functionId)
}

const handleRemoveFunction = (functionId: string) => {
  emit('removeFunction', props.module.id, functionId)
}

const handleAddFunction = () => {
  const ok = newC.value.trim() && newTs.value.trim()
  if (!ok) return
  emit('addFunction', props.module.id, newC.value, newTs.value)
  newC.value = ''
  newTs.value = ''
}

watch(
  () => props.module.id,
  () => {
    void loadSources()
  },
)

onMounted(() => {
  void loadSources()
})
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <button
          type="button"
          class="mb-2 font-mono text-xs text-[var(--mute)] transition hover:text-[var(--ink)]"
          @click="handleBack"
        >
          ← Back to board
        </button>
        <h2 class="font-serif text-3xl tracking-tight">
          {{ module.id }}
        </h2>
        <p class="mt-1 font-mono text-xs text-[var(--mute)]">
          {{ module.upstream }}
          <span class="text-[var(--line)]">→</span>
          {{ module.typescript }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded px-2.5 py-1 font-mono text-xs ring-1 transition hover:brightness-95"
          :class="statusClass(module.status)"
          :title="`Click to cycle status (now: ${module.status})`"
          @click="handleCycleStatus"
        >
          {{ module.status }}
        </button>
        <span
          v-if="functions.length"
          class="font-mono text-xs text-[var(--mute)]"
        >
          fn {{ doneCount }}/{{ functions.length }}
        </span>
      </div>
    </div>

    <label class="flex flex-col gap-1 text-xs text-[var(--mute)]">
      Notes
      <textarea
        :value="module.notes"
        rows="2"
        class="w-full resize-y rounded border border-[var(--line)] bg-white/70 px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
        @input="handleNotesChange"
      />
    </label>

    <section class="rounded border border-[var(--line)] bg-white/60 p-4">
      <div class="mb-3 flex items-baseline justify-between gap-3">
        <h3 class="font-serif text-xl">Functions</h3>
        <p class="font-mono text-xs text-[var(--mute)]">
          manual checklist — mark as you port
        </p>
      </div>

      <ul v-if="functions.length" class="mb-4 divide-y divide-[var(--line)]">
        <li
          v-for="fn in functions"
          :key="fn.id"
          class="flex flex-wrap items-center gap-3 py-2"
        >
          <label class="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              class="size-4 accent-[var(--accent)]"
              :checked="fn.done"
              @change="handleToggleFunction(fn.id)"
            />
            <span class="font-mono text-sm">
              <span :class="fn.done ? 'text-[var(--parity)]' : 'text-[var(--ink)]'">
                {{ fn.c }}
              </span>
              <span class="mx-2 text-[var(--line)]">↔</span>
              <span :class="fn.done ? 'text-[var(--parity)]' : 'text-[var(--ink)]'">
                {{ fn.ts }}
              </span>
            </span>
          </label>
          <button
            type="button"
            class="font-mono text-xs text-[var(--mute)] transition hover:text-red-700"
            @click="handleRemoveFunction(fn.id)"
          >
            remove
          </button>
        </li>
      </ul>
      <p v-else class="mb-4 text-sm text-[var(--mute)]">
        No functions yet — add C ↔ TS pairs below as you go.
      </p>

      <form
        class="flex flex-wrap items-end gap-2"
        @submit.prevent="handleAddFunction"
      >
        <label class="flex min-w-36 flex-1 flex-col gap-1 text-xs text-[var(--mute)]">
          C name
          <input
            v-model="newC"
            type="text"
            placeholder="loc_eq"
            class="rounded border border-[var(--line)] bg-white px-2 py-2 font-mono text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
          />
        </label>
        <label class="flex min-w-36 flex-1 flex-col gap-1 text-xs text-[var(--mute)]">
          TS name
          <input
            v-model="newTs"
            type="text"
            placeholder="locEq"
            class="rounded border border-[var(--line)] bg-white px-2 py-2 font-mono text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
          />
        </label>
        <button
          type="submit"
          class="rounded bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
          :disabled="!newC.trim() || !newTs.trim()"
        >
          Add
        </button>
      </form>
    </section>

    <p v-if="loadingSources" class="text-sm text-[var(--mute)]">Loading sources…</p>

    <section
      v-else
      class="grid gap-4 lg:grid-cols-2"
    >
      <div class="source-pane min-w-0 overflow-hidden rounded border border-[var(--line)]">
        <div class="flex flex-wrap items-center gap-1 border-b border-white/10 bg-[#0d1117] px-2 py-2">
          <span class="mr-2 px-1 font-mono text-[10px] tracking-wider text-white/50 uppercase">
            C
          </span>
          <button
            v-for="file in cFiles"
            :key="file.path"
            type="button"
            class="rounded px-2 py-1 font-mono text-[11px] transition"
            :class="
              activeC?.path === file.path
                ? 'bg-white/15 text-white'
                : 'text-white/55 hover:bg-white/10 hover:text-white/80'
            "
            @click="activeCPath = file.path"
          >
            {{ file.path.split('/').pop() }}
          </button>
          <span
            v-if="!cFiles.length"
            class="font-mono text-[11px] text-white/40"
          >
            no .c/.h path in ledger
          </span>
        </div>
        <pre
          v-if="activeC?.error"
          class="overflow-auto bg-[#0d1117] p-3 font-mono text-xs text-red-300"
        >{{ activeC.error }}</pre>
        <pre
          v-else-if="activeC"
          class="hljs max-h-[70vh] overflow-auto p-3 font-mono text-[12px] leading-relaxed"
        ><code class="language-c" v-html="highlightedC" /></pre>
      </div>

      <div class="source-pane min-w-0 overflow-hidden rounded border border-[var(--line)]">
        <div class="flex flex-wrap items-center gap-1 border-b border-white/10 bg-[#0d1117] px-2 py-2">
          <span class="mr-2 px-1 font-mono text-[10px] tracking-wider text-white/50 uppercase">
            TS
          </span>
          <button
            v-for="file in tsFiles"
            :key="file.path"
            type="button"
            class="rounded px-2 py-1 font-mono text-[11px] transition"
            :class="
              activeTs?.path === file.path
                ? 'bg-white/15 text-white'
                : 'text-white/55 hover:bg-white/10 hover:text-white/80'
            "
            @click="activeTsPath = file.path"
          >
            {{ file.path.split('/').pop() }}
          </button>
          <span
            v-if="!tsFiles.length"
            class="font-mono text-[11px] text-white/40"
          >
            no .ts file path (directory-only modules need a file)
          </span>
        </div>
        <pre
          v-if="activeTs?.error"
          class="overflow-auto bg-[#0d1117] p-3 font-mono text-xs text-red-300"
        >{{ activeTs.error }}</pre>
        <pre
          v-else-if="activeTs"
          class="hljs max-h-[70vh] overflow-auto p-3 font-mono text-[12px] leading-relaxed"
        ><code class="language-typescript" v-html="highlightedTs" /></pre>
      </div>
    </section>
  </div>
</template>
