<script setup lang="ts">
import { onMounted } from 'vue'
import type { ParityModule, ParityStatus } from '../types'
import { useParity } from '../composables/useParity'
import ModuleDualView from '../components/ModuleDualView.vue'

const {
  data,
  dirty,
  loading,
  saving,
  error,
  saveMessage,
  selectedModule,
  filterStatus,
  filterMilestone,
  filterHasNotes,
  totals,
  visibleMilestones,
  loadParity,
  saveParity,
  cycleStatus,
  handleNotesInput,
  openModule,
  closeModule,
  toggleFunctionDone,
  addFunction,
  removeFunction,
  functionProgress,
} = useParity()

const statusClass = (status: ParityStatus) => {
  if (status === 'parity') {
    return 'bg-[var(--accent-soft)] text-[var(--parity)] ring-[var(--parity)]/30'
  }
  if (status === 'partial') {
    return 'bg-[var(--warn-soft)] text-[var(--partial)] ring-[var(--partial)]/30'
  }
  return 'bg-[var(--paper-2)] text-[var(--stub)] ring-[var(--line)]'
}

const handleSave = () => {
  void saveParity()
}

const handleReload = () => {
  void loadParity()
}

const handleCycleStatus = (moduleId: string) => {
  cycleStatus(moduleId)
}

const handleNotesChange = (moduleId: string, event: Event) => {
  const target = event.target
  if (!(target instanceof HTMLTextAreaElement)) return
  handleNotesInput(moduleId, target.value)
}

const handleRowClick = (moduleId: string) => {
  openModule(moduleId)
}

const handleStop = (event: Event) => {
  event.stopPropagation()
}

const progressLabel = (module: ParityModule) => {
  const progress = functionProgress(module)
  if (!progress) return ''
  return `${progress.done}/${progress.total}`
}

onMounted(() => {
  void loadParity()
})
</script>

<template>
  <div :class="selectedModule ? 'max-w-7xl' : 'max-w-6xl'">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p v-if="data" class="font-mono text-sm text-[var(--mute)]">
          {{ data.upstreamPin.path }} @ {{ data.upstreamPin.tag }}
          <span class="text-[var(--line)]">·</span>
          {{ data.upstreamPin.commit }}
        </p>
        <p class="mt-1 text-sm text-[var(--mute)]">
          Click a row for C ↔ TS dual view. Click status to cycle.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded border border-[var(--line)] bg-white/70 px-3 py-2 text-sm transition hover:bg-white"
          :disabled="loading || saving"
          @click="handleReload"
        >
          Reload
        </button>
        <button
          type="button"
          class="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
          :disabled="!dirty || saving || loading || !data"
          @click="handleSave"
        >
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </div>

    <p v-if="loading" class="text-sm text-[var(--mute)]">Loading parity.json…</p>
    <p v-else-if="error" class="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
      {{ error }}
    </p>
    <p
      v-else-if="saveMessage"
      class="mb-4 rounded border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--parity)]"
    >
      {{ saveMessage }}
    </p>
    <p
      v-else-if="dirty"
      class="mb-4 rounded border border-[var(--partial)]/30 bg-[var(--warn-soft)] px-3 py-2 text-sm text-[var(--warn)]"
    >
      Unsaved changes
    </p>

    <ModuleDualView
      v-if="selectedModule && !loading"
      :module="selectedModule"
      @back="closeModule"
      @cycle-status="handleCycleStatus"
      @notes-input="handleNotesInput"
      @toggle-function="toggleFunctionDone"
      @add-function="addFunction"
      @remove-function="removeFunction"
    />

    <template v-else-if="data && !loading">
      <section class="mb-6 grid gap-3 sm:grid-cols-[1.2fr_1fr]">
        <div class="rounded border border-[var(--line)] bg-white/50 p-4">
          <div class="mb-2 flex items-baseline justify-between gap-3">
            <p class="text-sm text-[var(--mute)]">Progress (partial + parity)</p>
            <p class="font-mono text-sm">
              {{ totals.done }}/{{ totals.total }}
            </p>
          </div>
          <div class="h-2 overflow-hidden rounded bg-[var(--paper-2)]">
            <div
              class="h-full bg-[var(--accent)] transition-all"
              :style="{ width: totals.total ? `${(totals.done / totals.total) * 100}%` : '0%' }"
            />
          </div>
          <div class="mt-3 flex flex-wrap gap-3 font-mono text-xs text-[var(--mute)]">
            <span>stub {{ totals.stub }}</span>
            <span>partial {{ totals.partial }}</span>
            <span>parity {{ totals.parity }}</span>
          </div>
        </div>

        <div class="flex flex-wrap items-end gap-3 rounded border border-[var(--line)] bg-white/50 p-4">
          <label class="flex min-w-28 flex-1 flex-col gap-1 text-xs text-[var(--mute)]">
            Status
            <select
              v-model="filterStatus"
              class="rounded border border-[var(--line)] bg-white px-2 py-2 text-sm text-[var(--ink)]"
            >
              <option value="all">all</option>
              <option value="stub">stub</option>
              <option value="partial">partial</option>
              <option value="parity">parity</option>
            </select>
          </label>

          <label class="flex min-w-40 flex-1 flex-col gap-1 text-xs text-[var(--mute)]">
            Milestone
            <select
              v-model="filterMilestone"
              class="rounded border border-[var(--line)] bg-white px-2 py-2 text-sm text-[var(--ink)]"
            >
              <option value="all">all</option>
              <option
                v-for="milestone in data.milestones"
                :key="milestone.id"
                :value="milestone.id"
              >
                {{ milestone.title }}
              </option>
            </select>
          </label>

          <label class="flex items-center gap-2 pb-2 text-sm text-[var(--ink)]">
            <input
              v-model="filterHasNotes"
              type="checkbox"
              class="size-4 accent-[var(--accent)]"
            />
            has notes
          </label>
        </div>
      </section>

      <section
        v-for="milestone in visibleMilestones"
        :key="milestone.id"
        class="mb-8"
      >
        <h2 class="mb-3 font-serif text-2xl tracking-tight">
          {{ milestone.title }}
        </h2>

        <div class="overflow-x-auto rounded border border-[var(--line)] bg-white/60">
          <table class="min-w-full border-collapse text-left text-sm">
            <thead class="bg-[var(--paper-2)]/80 font-mono text-xs tracking-wide text-[var(--mute)] uppercase">
              <tr>
                <th class="px-3 py-2 font-medium">Upstream (C)</th>
                <th class="px-3 py-2 font-medium">TypeScript</th>
                <th class="px-3 py-2 font-medium">Status</th>
                <th class="px-3 py-2 font-medium">Fn</th>
                <th class="min-w-64 px-3 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="module in milestone.modules"
                :key="module.id"
                class="cursor-pointer border-t border-[var(--line)] align-top transition hover:bg-[var(--accent-soft)]/40"
                title="Open C ↔ TS dual view"
                @click="handleRowClick(module.id)"
              >
                <td class="px-3 py-3 font-mono text-xs sm:text-sm">
                  {{ module.upstream }}
                </td>
                <td class="px-3 py-3 font-mono text-xs sm:text-sm">
                  {{ module.typescript }}
                </td>
                <td class="px-3 py-3" @click="handleStop">
                  <button
                    type="button"
                    class="rounded px-2.5 py-1 font-mono text-xs ring-1 transition hover:brightness-95"
                    :class="statusClass(module.status)"
                    :title="`Click to cycle status (now: ${module.status})`"
                    @click="handleCycleStatus(module.id)"
                  >
                    {{ module.status }}
                  </button>
                </td>
                <td class="px-3 py-3 font-mono text-xs text-[var(--mute)]">
                  {{ progressLabel(module) || '—' }}
                </td>
                <td class="px-3 py-3" @click="handleStop">
                  <textarea
                    :value="module.notes"
                    rows="2"
                    class="w-full resize-y rounded border border-[var(--line)] bg-white px-2 py-1.5 text-sm leading-snug outline-none focus:border-[var(--accent)]"
                    @input="handleNotesChange(module.id, $event)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <p
        v-if="visibleMilestones.length === 0"
        class="text-sm text-[var(--mute)]"
      >
        No modules match the current filters.
      </p>
    </template>
  </div>
</template>
