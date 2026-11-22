<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type * as Monaco from 'monaco-editor'
import { setupMonaco } from '../../lib/monacoEnv'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const host = ref<HTMLElement | null>(null)
const loadError = ref('')
let editor: Monaco.editor.IStandaloneCodeEditor | null = null

onMounted(async () => {
  if (!host.value) return

  try {
    const monaco = await setupMonaco()
    if (!host.value) return

    editor = monaco.editor.create(host.value, {
      value: props.modelValue,
      language: 'typescript',
      theme: 'vs',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 13,
      fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
      tabSize: 2,
      scrollBeyondLastLine: false,
      padding: { top: 12, bottom: 12 },
      renderLineHighlight: 'line',
    })

    editor.onDidChangeModelContent(() => {
      if (!editor) return
      emit('update:modelValue', editor.getValue())
    })
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : String(err)
  }
})

watch(
  () => props.modelValue,
  (value) => {
    if (!editor) return
    if (editor.getValue() === value) return
    editor.setValue(value)
  },
)

onBeforeUnmount(() => {
  editor?.dispose()
  editor = null
})

const handleFocus = () => {
  editor?.focus()
}

defineExpose({ handleFocus })
</script>

<template>
  <div class="relative h-full min-h-[320px] w-full overflow-hidden rounded border border-[var(--line)]">
    <div ref="host" class="h-full w-full" />
    <p
      v-if="loadError"
      class="absolute inset-0 flex items-center justify-center bg-white/90 px-4 text-center text-sm text-red-700"
    >
      Monaco failed to load: {{ loadError }}
    </p>
  </div>
</template>
