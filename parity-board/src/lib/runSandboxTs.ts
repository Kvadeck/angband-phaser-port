import ts from 'typescript'
import { sandboxBindings } from './sandboxApi'

export type ConsoleLevel = 'log' | 'info' | 'warn' | 'error'

export type ConsoleLine = {
  level: ConsoleLevel
  text: string
  at: number
}

const formatArg = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') {
    return String(value)
  }
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`
  try {
    return JSON.stringify(value, null, 2) ?? String(value)
  } catch {
    return Object.prototype.toString.call(value)
  }
}

const createConsoleProxy = (lines: ConsoleLine[]) => {
  const push =
    (level: ConsoleLevel) =>
    (...args: unknown[]) => {
      lines.push({
        level,
        text: args.map(formatArg).join(' '),
        at: Date.now(),
      })
    }

  return {
    log: push('log'),
    info: push('info'),
    warn: push('warn'),
    error: push('error'),
    debug: push('log'),
  }
}

export type SandboxRunResult = {
  ok: boolean
  lines: ConsoleLine[]
  error?: string
  js?: string
}

export const runSandboxTs = async (source: string): Promise<SandboxRunResult> => {
  const lines: ConsoleLine[] = []
  const sandboxConsole = createConsoleProxy(lines)

  let js = ''
  try {
    const transpiled = ts.transpileModule(source, {
      reportDiagnostics: true,
      compilerOptions: {
        module: ts.ModuleKind.None,
        target: ts.ScriptTarget.ES2022,
        strict: true,
        removeComments: false,
      },
      fileName: 'sandbox.ts',
    })

    const diagnostics = transpiled.diagnostics ?? []
    if (diagnostics.length > 0) {
      for (const diagnostic of diagnostics) {
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
        const line =
          diagnostic.file && diagnostic.start !== undefined
            ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line + 1
            : undefined
        lines.push({
          level: 'error',
          text: line ? `TS${diagnostic.code} (line ${line}): ${message}` : `TS${diagnostic.code}: ${message}`,
          at: Date.now(),
        })
      }
      return { ok: false, lines, error: 'TypeScript transpile failed', js: transpiled.outputText }
    }

    js = transpiled.outputText
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, lines, error: message }
  }

  const bindingNames = Object.keys(sandboxBindings)
  const bindingValues = Object.values(sandboxBindings)

  try {
    const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (
      ...args: string[]
    ) => (...args: unknown[]) => Promise<unknown>

    const runner = new AsyncFunction(
      ...bindingNames,
      'console',
      `"use strict";\n${js}\n`,
    )

    await runner(...bindingValues, sandboxConsole)
    return { ok: true, lines, js }
  } catch (err) {
    const message = err instanceof Error ? err.stack || err.message : String(err)
    lines.push({ level: 'error', text: message, at: Date.now() })
    return { ok: false, lines, error: message, js }
  }
}
