/** Resolve ledger path fields into repo-relative source file paths.
 *  Ledger uses " / " between multiple files (e.g. "src/z-type.h / src/z-type.c").
 */

const splitEntries = (value: string): string[] =>
  value
    .split(' / ')
    .map((part) => part.trim())
    .filter(Boolean)

export const resolveUpstreamPaths = (
  upstream: string,
  vendorRoot = 'vendor/angband',
): string[] => {
  return splitEntries(upstream)
    .filter((part) => /\.(c|h)$/.test(part) || part.startsWith('src/'))
    .map((part) => {
      if (part.startsWith('vendor/')) return part
      if (part.startsWith('src/')) return `${vendorRoot}/${part}`
      return `${vendorRoot}/src/${part}`
    })
}

export const resolveTypescriptPaths = (typescript: string): string[] => {
  return splitEntries(typescript).filter(
    (part) =>
      part.startsWith('src/') &&
      (part.endsWith('.ts') || part.endsWith('.tsx') || part.endsWith('.vue')),
  )
}
