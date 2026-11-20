import { computed, ref } from 'vue'
import type { ParityData, ParityStatus } from '../types'

const STATUS_ORDER: ParityStatus[] = ['stub', 'partial', 'parity']

export const useParity = () => {
  const data = ref<ParityData | null>(null)
  const dirty = ref(false)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const saveMessage = ref('')

  const filterStatus = ref<ParityStatus | 'all'>('all')
  const filterMilestone = ref<string>('all')
  const filterHasNotes = ref(false)

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
    if (!data.value) return

    for (const milestone of data.value.milestones) {
      const module = milestone.modules.find((item) => item.id === moduleId)
      if (!module) continue

      const index = STATUS_ORDER.indexOf(module.status)
      module.status = STATUS_ORDER[(index + 1) % STATUS_ORDER.length]
      dirty.value = true
      saveMessage.value = ''
      return
    }
  }

  const handleNotesInput = (moduleId: string, notes: string) => {
    if (!data.value) return

    for (const milestone of data.value.milestones) {
      const module = milestone.modules.find((item) => item.id === moduleId)
      if (!module) continue
      module.notes = notes
      dirty.value = true
      saveMessage.value = ''
      return
    }
  }

  return {
    data,
    dirty,
    loading,
    saving,
    error,
    saveMessage,
    filterStatus,
    filterMilestone,
    filterHasNotes,
    totals,
    visibleMilestones,
    loadParity,
    saveParity,
    cycleStatus,
    handleNotesInput,
  }
}
