// Locales, and the two things every page needs from them: the copy and the path.
// English is the source text; every other locale is a translation of it, typed against it
// so a missing string is a build error.
import { API_CATEGORIES } from '../lib/api.ts'
import { guideSectionIds } from '../lib/guide.ts'
import { en } from './en.ts'
import { ko } from './ko.ts'

export const locales = ['en', 'ko'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export type Copy = typeof en

export const copies: Record<Locale, Copy> = { en, ko }

export const copyFor = (locale: Locale): Copy => copies[locale]

/** The path of a locale-neutral route ('/', '/checks/') in a given locale. */
export function localePath(locale: Locale, path: string): string {
  // Pages end in a slash, which is the URL GitHub Pages serves them at; files keep their name.
  const p = path.endsWith('/') || /\.[a-z0-9]+$/i.test(path) ? path : `${path}/`
  return locale === defaultLocale ? p : `/${locale}${p}`
}

/** Absolute URL for hreflang and canonical links. */
export function localeUrl(site: URL, locale: Locale, path: string): string {
  return new URL(localePath(locale, path), site).toString()
}

/** One guide section's title and description in one language. */
export function guideSection(locale: Locale, id: string): { title: string; description: string } {
  const entry = copyFor(locale).guide.sections[id]
  if (!entry) throw new Error(`[guide] src/i18n/${locale}.ts has no guide.sections['${id}']`)
  return entry
}

/** Every section of the guide is named in every language, and no language names a section the
 *  guide no longer has. The pages that render the guide call this at build time. */
export function assertGuideSections(): void {
  for (const locale of locales) {
    const map = copies[locale].guide.sections
    for (const id of guideSectionIds) {
      if (!map[id]) throw new Error(`[guide] src/i18n/${locale}.ts has no guide.sections['${id}']`)
    }
    for (const id of Object.keys(map)) {
      if (!guideSectionIds.includes(id)) throw new Error(`[guide] src/i18n/${locale}.ts still names the section '${id}', which the guide no longer has`)
    }
  }
}

/** One category of the API reference, named in one language. */
export function apiCategoryCopy(locale: Locale, slug: string): { name: string; summary: string } {
  const named = copyFor(locale).docs.api.categories[slug]
  if (!named) throw new Error(`[api] src/i18n/${locale}.ts has no docs.api.categories['${slug}']`)
  return named
}

/** Every category of the reference is named in every language, and no language names one the
 *  reference no longer has. The reference's pages call this at build time. */
export function assertApiCategories(): void {
  for (const locale of locales) {
    const map = copies[locale].docs.api.categories
    for (const { slug } of API_CATEGORIES) {
      const named = map[slug]
      if (!named?.name) throw new Error(`[api] src/i18n/${locale}.ts has no name for the category '${slug}'`)
      if (!named.summary) throw new Error(`[api] src/i18n/${locale}.ts has no summary for the category '${slug}'`)
    }
    for (const slug of Object.keys(map)) {
      if (!API_CATEGORIES.some((c) => c.slug === slug)) {
        throw new Error(`[api] src/i18n/${locale}.ts still names the category '${slug}', which the reference no longer has`)
      }
    }
  }
}
