import loader from '@monaco-editor/loader'
import type * as Monaco from 'monaco-editor'
import { sandboxExtraLib } from './sandboxApi'

const MONACO_VS = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs'

let monacoPromise: Promise<typeof Monaco> | null = null

export const setupMonaco = (): Promise<typeof Monaco> => {
  if (monacoPromise) return monacoPromise

  monacoPromise = (async () => {
    loader.config({ paths: { vs: MONACO_VS } })
    const monaco = (await loader.init()) as typeof Monaco

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      strict: true,
    })

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    })

    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      sandboxExtraLib,
      'file:///sandbox-api.d.ts',
    )

    return monaco
  })()

  return monacoPromise
}
