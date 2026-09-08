// The `api` content collection: one entry per public export, with every markdown field
// rendered to HTML through the project's markdown pipeline (the same fences, code spans and
// package-name rewrite the guide gets). The entries come from src/lib/api.ts, generated from
// the compiler at the pinned commit; until that exists, from the fixtures in api-sample.ts.
import type { Loader } from 'astro/loaders'
import type { ApiEntry, ApiEntryHtml } from './api-types.ts'
import { sampleFunction, sampleInterface } from './api-sample.ts'

export function apiEntries(): readonly ApiEntry[] {
  return [sampleFunction, sampleInterface]
}

export function apiLoader(): Loader {
  return {
    name: 'typeshade-api',
    async load({ store, renderMarkdown, logger }) {
      store.clear()
      const md = async (text: string) => (text ? (await renderMarkdown(text)).html : '')
      for (const entry of apiEntries()) {
        const html: ApiEntryHtml = {
          summary: await md(entry.summary),
          description: await md(entry.description),
          parameters: await Promise.all(entry.parameters.map((p) => md(p.description))),
          returns: await md(entry.returns?.description ?? ''),
          exceptions: await Promise.all(entry.exceptions.map((e) => md(e.description))),
          examples: await Promise.all(entry.examples.map((e) => md(e.description))),
          targets: await Promise.all(entry.targets.map((s) => md(s.note))),
          members: await Promise.all(entry.members.map((m) => md(m.description))),
        }
        store.set({ id: entry.slug, data: { ...entry, html } })
      }
      logger.info(`${store.keys().length} reference entries`)
    },
  }
}
