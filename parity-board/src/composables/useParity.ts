import { computed, ref } from 'vue'
import type { ParityData, ParityFunction, ParityModule, ParityStatus } from '../types'

const STATUS_ORDER: ParityStatus[] = ['stub', 'partial', 'parity']

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')

export const useParity = () => {
  const data = ref<ParityData | null>(null)
  const dirty = ref(false)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const saveMessage = ref('')
  const selectedModuleId = ref<string | null>(null)

  const filterStatus = ref<ParityStatus | 'all'>('all')
  const filterMilestone = ref<string>('all')
  const filterHasNotes = ref(false)

  const findModule = (moduleId: string): ParityModule | null => {
    if (!data.value) return null
    for (const milestone of data.value.milestones) {
      const module = milestone.modules.find((item) => item.id === moduleId)
      if (module) return module
    }
    return null
  }

  const selectedModule = computed(() => {
    if (!selectedModuleId.value) return null
    return findModule(selectedModuleId.value)
  })

  const totals = computed(() => {
    if (!data.value) {
      return { total: 0, done: 0, stub: 0, partial: 0, parity: 0 }
    }

    let total = 0
    let stub = 0
    let partial = 0
    let parity = 0

    for (const milestone of data.value.milestones) {
      for (const module of milestone.modules) {
        total += 1
        if (module.status === 'stub') stub += 1
        if (module.status === 'partial') partial += 1
        if (module.status === 'parity') parity += 1
      }
    }

    return {
      total,
      done: partial + parity,
      stub,
      partial,
      parity,
    }
  })

  const visibleMilestones = computed(() => {
    if (!data.value) return []

    return data.value.milestones
      .filter((milestone) => {
        if (filterMilestone.value === 'all') return true
        return milestone.id === filterMilestone.value
      })
      .map((milestone) => ({
        ...milestone,
        modules: milestone.modules.filter((module) => {
          if (filterStatus.value !== 'all' && module.status !== filterStatus.value) {
            return false
          }
          if (filterHasNotes.value && !module.notes.trim()) {
            return false
          }
          return true
        }),
      }))
      .filter((milestone) => milestone.modules.length > 0)
  })

  const markDirty = () => {
    dirty.value = true
    saveMessage.value = ''
  }

  const loadParity = async () => {
    loading.value = true
    error.value = ''
    saveMessage.value = ''

    try {
      const response = await fetch('/api/parity')
      if (!response.ok) {
        throw new Error(`Failed to load parity.json (${response.status})`)
      }
      data.value = (await response.json()) as ParityData
      dirty.value = false
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load'
    } finally {
      loading.value = false
    }
  }

  const saveParity = async () => {
    if (!data.value) return

    saving.value = true
    error.value = ''
    saveMessage.value = ''

    try {
      const response = await fetch('/api/parity', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.value, null, 2),
      })

      if (!response.ok) {
        throw new Error(`Failed to save (${response.status})`)
      }

      dirty.value = false
      saveMessage.value = 'Saved to parity.json'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save'
    } finally {
      saving.value = false
    }
  }

  const cycleStatus = (moduleId: string) => {
    const module = findModule(moduleId)
    if (!module) return

    const index = STATUS_ORDER.indexOf(module.status)
    module.status = STATUS_ORDER[(index + 1) % STATUS_ORDER.length]
    markDirty()
  }

  const handleNotesInput = (moduleId: string, notes: string) => {
    const module = findModule(moduleId)
    if (!module) return
    module.notes = notes
    markDirty()
  }

  const openModule = (moduleId: string) => {
    selectedModuleId.value = moduleId
  }

  const closeModule = () => {
    selectedModuleId.value = null
  }

  const ensureFunctions = (module: ParityModule) => {
    if (!module.functions) {
      module.functions = []
    }
    return module.functions
  }

  const toggleFunctionDone = (moduleId: string, functionId: string) => {
    const module = findModule(moduleId)
    if (!module?.functions) return
    const fn = module.functions.find((item) => item.id === functionId)
    if (!fn) return
    fn.done = !fn.done
    markDirty()
  }

  const addFunction = (moduleId: string, cName: string, tsName: string) => {
    const module = findModule(moduleId)
    if (!module) return false

    const c = cName.trim()
    const ts = tsName.trim()
    if (!c || !ts) return false

    const functions = ensureFunctions(module)
    const baseId = slugify(c) || `fn_${functions.length + 1}`
    let id = baseId
    let suffix = 2
    while (functions.some((item) => item.id === id)) {
      id = `${baseId}_${suffix}`
      suffix += 1
    }

    const entry: ParityFunction = { id, c, ts, done: false }
    functions.push(entry)
    markDirty()
    return true
  }

  const removeFunction = (moduleId: string, functionId: string) => {
    const module = findModule(moduleId)
    if (!module?.functions) return
    const index = module.functions.findIndex((item) => item.id === functionId)
    if (index < 0) return
    module.functions.splice(index, 1)
    markDirty()
  }

  const functionProgress = (module: ParityModule) => {
    const functions = module.functions ?? []
    if (functions.length === 0) return null
    const done = functions.filter((item) => item.done).length
    return { done, total: functions.length }
  }

  return {
    data,
    dirty,
    loading,
    saving,
    error,
    saveMessage,
    selectedModuleId,
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
  }
}
