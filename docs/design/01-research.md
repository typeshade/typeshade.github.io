# Reference landing-page analysis — 2026-09-07

Input for the TypeShade v2 page (`docs/design/00-brief.md`). Question answered here: **what does a
developer-tool page that advertises look like, section by section**, and which of them TypeShade
should resemble.

## Provenance

| Source | Pages |
| --- | --- |
| Live page fetched and parsed 2026-09-07 (headings, body text, `<canvas>` / `<video>` counts read out of the served HTML) | react.dev, tailwindcss.com, mui.com, angular.dev, nextjs.org, svelte.dev, bun.sh, vite.dev, motion.dev, rive.app, spline.design, linear.app, vercel.com, stripe.com, framer.com, raycast.com, zed.dev, threejs.org, pixijs.com, typegpu.com |
| Public source of record (site repo) | vuejs.org — `vuejs/docs` `src/index.md` + `.vitepress/theme/components/Home.vue` |
| Live fetch returned an app shell; hero text only | unicorn.studio (below-hero marked **(from memory)**), pixijs.com hero visual **(from memory)** |
| Redirect followed | typegpu.com → `docs.swmansion.com/TypeGPU/` |

react.dev's `src/content/index.md` is a stub (`{/* See HomeContent.js */}`) and `HomeContent.js`
has moved, so react.dev is taken from the rendered page — which is the authority anyway.

---

## Part A — the four primary pages, top to bottom

### A1. react.dev

Hero is a **wordmark, not a sentence**. Zero code above the fold. Then six teaching sections that
each pair a snippet with **the thing that snippet renders, running, next to it**.

| # | Section | Headline (verbatim) | What it shows | Code | Told vs shown |
| --- | --- | --- | --- | --- | --- |
| 0 | Nav | — | Search ⌘K · Learn · Reference · Community · Blog · `v19.2` | 0 | — |
| 1 | Hero | `React` + tagline `The library for web and native user interfaces` | Logo only. No image, no canvas, no video. CTAs `Learn React` · `API Reference` | 0 | Told (8 words) |
| 2 | Components | `Create user interfaces from components` | `Video.js` snippet **beside its live output** (a rendered video card) | 14 | Shown |
| 3 | Markup | `Write components with code and markup` | `VideoList.js` beside a live rendered list, `3 Videos` | 17 | Shown |
| 4 | Interactivity | `Add interactivity wherever you need it` | `SearchableVideoList.js` beside a **working search box** you can type into | 15 | Shown |
| 5 | Frameworks | `Go full-stack with a framework` | Server-component snippet beside a live conference-video list. CTA `Get started with a framework` | 21 | Shown |
| 6 | Platforms | `Use the best from every platform` | Two device mocks: `Stay true to the web` / `Go truly native`. CTA `Build for native platforms` | 0 | Told |
| 7 | Stability | `Upgrade when the future is ready` | Prose proof: "tested on business-critical surfaces with over a billion users", "Over 100,000 React components at Meta" | 0 | Told, numbers |
| 8 | News | `Latest React News` | 4 dated post cards. CTA `Read more React news` | 0 | Shown |
| 9 | Community | `Join a community of millions` | "Two million developers … visit the React docs every month". CTA `Welcome to the React community` | 0 | Told, numbers |
| 10 | Close | — | One button: `Get Started` | 0 | — |
| 11 | Footer | — | 4 columns: Learn React · API Reference · Community · More. `Copyright © Meta Platforms, Inc` | — | — |

Notable: **no customer-logo band anywhere.** Social proof is three numbers in prose, placed late
(sections 7 and 9). Every CTA is a different verb pointing at a different destination — the page
never repeats "Get started" until the very last line.


**Framework read.** Formula: **category-claim** hero (4 U's: *Useful* + *Unique*, no urgency), then
**FAB** run six times — feature (a component) → advantage (combine them) → benefit (whole screens).
Value-prop hierarchy (Copyhackers/Wiebe): headline → subheadline → CTA, **hero visual absent** — the
rarest configuration on this list and only affordable because the name already means something.
Reading pattern: **Z** in the hero (logo TL → nav TR → tagline centre → CTA pair), **layer-cake**
below — h2, demo, h2, demo. Social-proof type: **numbers in prose only** (no logos, no stars, no
testimonials). CTA hierarchy: primary `Learn React`, secondary `API Reference`, then a **different
tertiary verb per section** (`Add React to your page`, `Get started with a framework`, `Build for
native platforms`, `Read more React news`, `Welcome to the React community`), closing on `Get
Started`. All imperative, none first-person. Section rhythm: **solution → proof ×4 → platform →
credibility → news → community → CTA** — note there is **no problem statement anywhere.**

### A2. vuejs.org

The shortest of the four. Hero is one line of type at 76px, three CTAs, then sponsors — sponsors
appear **before** any feature copy.

| # | Section | Headline (verbatim) | What it shows | Code |
| --- | --- | --- | --- | --- |
| 0 | Nav | — | Docs · Tutorial · Examples · Ecosystem · About · Sponsor · Partner | 0 |
| 1 | Hero | `The Progressive JavaScript Framework` (`Progressive` in a green→indigo gradient) | Text only. Sub: `An approachable, performant and versatile framework for building web user interfaces.` CTAs `Get Started` · `Install` · `Get Security Updates for Vue 2` | 0 |
| 2 | Special sponsor | `Special Sponsor` | One logo + one line. Falls back to `Special Sponsor slot is now vacant - Inquire now` | 0 |
| 3 | Highlights | (no section headline) | Three boxes, ~20 words each: `Versatile` / `User-friendly` / `Efficient` | 0 |
| 4 | Sponsors | `Platinum Sponsors`, `Gold Sponsors` | Two logo grids | 0 |
| 5 | Sitemap | — | `SiteMap.vue` — the whole doc tree as the footer | — |

Notable: **zero code on the home page.** Three claims of ~20 words, then straight to money and the
sitemap. The newsletter component exists in source and is commented out — restraint is deliberate.


**Framework read.** Formula: **category-claim** + 4 U's (*Unique* carried entirely by the word
"Progressive"), then **FAB** in three ~20-word boxes. Hierarchy: headline → subheadline → CTA row;
no visual, no bullets. Reading: **Z** hero (centred, 76px), layer-cake body. Social-proof type:
**sponsor logos, tiered** — money as the proof, no numbers and no testimonials anywhere. CTA
hierarchy: primary `Get Started`, secondary `Install`, tertiary `Get Security Updates for Vue 2`
(given a gradient border so it reads as a fourth tier). Imperative. Section rhythm: **solution →
social → benefit ×3 → social → sitemap.** No problem, no proof section, no how-it-works.

### A3. tailwindcss.com

The only primary page whose **hero object is code** — and it is code you can read in one glance,
paired with the design it produces.

| # | Section | Headline (verbatim) | Sub / body (verbatim) | Shows | Code |
| --- | --- | --- | --- | --- | --- |
| 0 | Nav | — | Docs · Blog · Showcase · Partners · Plus · GitHub · `v4.3` · ⌘K | — |
| 1 | Hero | `Rapidly build modern websites without ever leaving your HTML.` | `A utility-first CSS framework packed with classes like flex, pt-4, text-center and rotate-90 that can be composed to build any design, directly in your markup.` | ~10-line HTML sample **with the rendered card beside it**. CTA `Get started` | ~10 |
| 2 | Sponsors | `Sponsors` / `Supported by the best.` | "…incredible partners and sponsors who make it possible for a team of talented designers and engineers to maintain the framework full-time." | 30+ logos. CTA `Become a sponsor` | 0 |
| 3 | Why | `Why Tailwind CSS?` / `Built for the modern web.` | "unapologetically modern…" | Umbrella for ~10 sub-demos | — |
| 3a–3j | Sub-demos | `Responsive design`, `Filters`, `Dark mode`, `CSS variables`, `P3 colors`, `CSS grid layout`, `Transitions and animations`, `Cascade layers`, `Logical properties`, `Container queries`, `Gradients`, `3D transforms` | one joke-length line each ("just stick `dark:` in front of any color") | Each is **a working demo of the feature**: breakpoint switcher, filter chips, light/dark pair, colour grid, ltr/rtl toggle | 4–18 per demo |
| 4 | How | `How it works` / `Ship faster and smaller.` | "most Tailwind projects ship less than 10kB of CSS" | Tabbed `index.html` / `app.css` / `package.json`, CSS filling in as you scrub | ~16 |
| 5 | Wild | `Tailwind in the wild` / `Build whatever you want, without touching your CSS file.` | "Some of your favorite sites are built with Tailwind, and you probably had no idea." | 15 logos incl. OpenAI, Reddit, Shopify, NASA/JPL | 0 |
| 6 | Plus | `Ready-made Components` / `Move even faster with Tailwind Plus.` | Templates · UI Blocks · UI Kit | Screenshots. CTA `Explore Tailwind Plus` | 0 |
| 7 | Footer | — | 4 column groups: Tailwind CSS · Resources · Tailwind Plus · Community | — |

Notable: the body copy is **jokes with a number in them**, never definitions. "Keep stacking filters
until your designer asks you to please, please stop." Nothing on the page defines what a utility
class is.


**Framework read.** Formula: **BAB** — the *Before* is compressed into the headline's own
prepositional phrase ("without ever leaving your HTML"), the *After* is "Rapidly build modern
websites", the *Bridge* is the code sample beside it — plus 4 U's scored high on *Ultra-specific*
(the subheadline names four real class names: `flex`, `pt-4`, `text-center`, `rotate-90`).
Hierarchy: headline → subheadline → **hero visual as proof** → CTA; the full Copyhackers stack with
bullets replaced by the sample. Reading: **F** in the hero (text left, code right), **layer-cake**
through the twelve sub-demos. Social-proof type: **sponsor logos → user logos**, one measured claim
("less than 10kB of CSS"). CTA hierarchy: primary `Get started`, tertiary `Become a sponsor` and
`Explore Tailwind Plus`. Section rhythm: **solution → social → how-it-works ×12 → proof → social →
upsell → footer.**

### A4. mui.com

The weakest of the four on the brief's own rule — a **34-word hero subline** — and the strongest on
evaluator proof.

| # | Section | Headline (verbatim) | Shows | Code |
| --- | --- | --- | --- | --- |
| 0 | Nav | — | Products · Docs · Pricing · About us · Blog · search · GitHub. Release banner: `🚀 Material UI and MUI X v9 are out!` | 0 |
| 1 | Hero | `Move faster with intuitive React UI tools` | Text only, no visual object. Sub: `MUI offers a comprehensive suite of free UI tools to help you ship new features faster. Start with Material UI, our fully-loaded component library, or bring your own design system to our production-ready components.` CTA `Discover the Core libraries` | 0 |
| 2 | Trust band | `The world's best product teams trust MUI to deliver an unrivaled experience for both developers and users.` | Spotify · Amazon · NASA · Netflix · Unity · Shutterstock | 0 |
| 3 | Products | `Every component you need is ready for production` | 4 cards: Material UI · MUI X · Templates · Design kits | 0 |
| 4 | Why | `A delightful experience for you and your users` | 4 claims: Timeless aesthetics · Intuitive customization · Unrivaled documentation ("our docs boast over 2,000 contributors") · Dedicated to accessibility | 0 |
| 5 | Components | `Beautiful and powerful, right out of the box` | **Live, interactive component demos** you can click | 0 |
| 6 | Numbers | `Join the community` / `Supported by thousands of developers and designers` | `5.8M` weekly npm downloads · `93.9k` GitHub stars · `3.0k` contributors · `19.2k` followers | 0 |
| 7 | Testimonials | — | 4 named quotes with company + role (Particl, Docker, Unity, Loggi) | 0 |
| 8 | Sponsors | `You make this possible` | Diamond / Gold tiers. CTA `Become our sponsor!` | 0 |
| 9 | Newsletter | `Keep up to date` | "Join our newsletter for regular updates. No spam ever." CTA `Subscribe` | 0 |
| 10 | Footer | — | Products · Resources · Explore · Company · Hiring · Support | — |

Notable: **zero lines of code on the entire home page** for a component library. The product is
shown by running it, and credibility is a four-number band plus four attributed quotes.


**Framework read.** Formula: **BAB** headline ("Move faster" is the after-state) over an **FAB**
body. The Copyhackers failure mode is visible: the **subheadline is doing the bullets' job** at 34
words, so the hero has a headline, a paragraph and no visual. Reading: **Z** hero, layer-cake body.
Social-proof type: **all four at once** — logos (Spotify, Amazon, NASA, Netflix, Unity), numbers
(`5.8M` weekly downloads, `93.9k` stars, `3.0k` contributors), attributed testimonials (Particl,
Docker, Unity, Loggi), tiered sponsors. CTA hierarchy: primary `Discover the Core libraries`,
tertiary `Become our sponsor!` and `Subscribe`. Imperative. Section rhythm: the textbook B2B ladder
— **solution → social → product map → benefit → proof → social(numbers) → social(quotes) → sponsor
→ capture → footer.**

---

## Part B — every page, one row each

`W` = word count. Sells = outcome / desire / identity. Explains = defines or describes mechanics.
`LOC` = lines of code above the fold.

### Primary

| Page | Hero headline (verbatim) | W | Subline (verbatim) | W | Sells/Explains | Hero visual | CTAs | LOC | First section after hero → purpose | Motion | Social proof |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| react.dev | `React` | 1 | `The library for web and native user interfaces` | 8 | **Sells** (category ownership: *the* library) | Nothing — wordmark only | 2 · `Learn React`, `API Reference` | 0 | `Create user interfaces from components` → prove the model with a snippet + its live output | Subtle | Late (§7, §9), prose numbers, **no logo band** |
| vuejs.org | `The Progressive JavaScript Framework` | 4 | `An approachable, performant and versatile framework for building web user interfaces.` | 11 | **Sells** (identity/adjectives), no mechanics | Nothing — 76px type | 3 · `Get Started`, `Install`, `Get Security Updates for Vue 2` | 0 | `Special Sponsor` band → money before features | None | **Immediately** below hero (sponsor band) |
| tailwindcss.com | `Rapidly build modern websites without ever leaving your HTML.` | 9 | `A utility-first CSS framework packed with classes like flex, pt-4, text-center and rotate-90 that can be composed to build any design, directly in your markup.` | 25 | **Sells** headline (outcome + relief); subline explains | **Code (~10 lines) + the design it renders** | 1 · `Get started` | ~10 | `Sponsors` / `Supported by the best.` → credibility + funding | Subtle | Immediately below hero (30+ sponsor logos); user logos at §5 |
| mui.com | `Move faster with intuitive React UI tools` | 7 | `MUI offers a comprehensive suite of free UI tools to help you ship new features faster. Start with Material UI, our fully-loaded component library, or bring your own design system to our production-ready components.` | 34 | Headline sells; **subline explains — the anti-pattern** | Nothing | 1 · `Discover the Core libraries` | 0 | Logo band → borrow trust before any claim | None | **Immediately** below hero (Spotify, Amazon, NASA, Netflix, Unity) |

### Secondary

| Page | Hero headline (verbatim) | W | Subline (verbatim) | W | Sells/Explains | Hero visual | CTAs | LOC | First section after hero → purpose | Motion | Social proof |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| svelte.dev | `web development for the rest of us` | 7 | `attractively thin, graceful and stylish` (dictionary gloss on the word "svelte") | 5 | **Sells** — pure identity, zero mechanics | Illustration: the compiler packaging component code | 1 · `get started` | 0 | `Svelte is a UI framework that uses a compiler…` → define once, then survey charts | Subtle | Right after intro: dev-survey rankings, then `used by companies you've heard of` |
| angular.dev | `Productivity Meets scalability` | 3 | `The framework for building scalable web apps with confidence` | 9 | Sells (abstract; low distinctiveness) | Nothing (h1 is a release banner: `Angular v22 is here!`) | 1 · `Get Started` | 0 | `Features that actually help you solve problems` → Signals, Control Flow, Deferrable Views, Hydration | None | §3 `Where performance matters`, prose only, no logos |
| nextjs.org | `The React Framework for the Web` | 6 | `Used by some of the world's largest companies, Next.js enables you to create high-quality web applications with the power of React components.` | 22 | Sells + **proof inside the subline** | Copyable command chip | 3 · `Get Started`, `Learn Next.js`, `npx create-next-app@latest` (copy) | 1 | `What's in Next.js?` / `Everything you need to build great products on the web.` | Subtle | In the subline itself; logo band later |
| astro.build | `The web framework for content-driven websites` | 6 | `Astro powers the world's fastest marketing sites, blogs, e-commerce websites, and more.` | 12 | Sells (superlative claim) | Illustration background | 2 · `Get Started`, copy-install chip | 1 | `What is Astro?` → **defines itself (explains)** | None | Immediately below: `Used by the largest companies around the world:` |
| linear.app | `The product development system for teams and agents` | 8 | `Purpose-built for planning and building products. Designed for the AI era.` | 11 | **Sells** (category definition) | **A pixel-exact replica of the app UI in DOM**, cycling 84 frames | 1 badge · `New — Loops →` (real CTAs live in the header) | 0 | `Powering the companies building the future` → logos + "over 40,000 product teams" | Subtle (84-frame cycle) | First section below hero |
| vercel.com | `Agentic Infrastructure` | 2 | `For coding agents to ship apps and agents automated by agents.` | 11 | Sells (category claim) | **Live shader canvas** (`--hero-canvas-max`, `--hero-shader-y`) | 2 · `Deploy now`, `Talk to sales` | 0 | `Build agents on infrastructure that thinks like them` → one named customer (Notion) as the proof | Subtle (shader) | First section below hero (single flagship customer) |
| stripe.com | `Financial infrastructure to grow your revenue.` | 6 | `Accept payments, offer financial services, and implement custom revenue models—from your first transaction to your billionth.` | 16 | **Sells** (outcome + scale range) | Animated gradient canvas | 2 · `Get started`, `Sign up with Google` (+ `Contact sales` in nav) | 0 | `Flexible solutions for every business model.` → product map | Subtle | **In the hero**: `Global GDP running on Stripe:` + logo marquee |
| framer.com | `Framer is the AI design agent for every step from idea to launch` | 14 | `Go from idea to launch with an agent that designs and builds on the canvas. Keep each change editable, with hosting, security, analytics, CMS, and SEO built in.` | 33 | Sells, but **14 + 33 words is the failure mode** | Video (6 `<video>` above the fold) | 2 · `Get started for free`, `Download app` | 0 | `Agents that work alongside you, not instead of you` | Heavy | Ranking chip in hero; `Meet our customers` below |
| raycast.com | `Your shortcut to everything.` | 4 | `A collection of powerful productivity tools all within an extendable launcher. Fast, ergonomic and reliable.` | 15 | **Sells** (desire, 4 words) | Interactive keyboard built in DOM | 1 · `The Raycast Keyboard` | 0 | `It's not about saving time.` / `It's about feeling like you're never wasting it.` → reframe the value | Subtle | Later: `Built for professionals like you` + named testimonials |
| bun.sh | `Bun is a fast JavaScript runtime & toolkit. All in one.` | 11 | `Runtime, package manager, test runner and bundler in a single binary. Use bun install or bun test in an existing Node.js project, or run the whole thing on Bun.` | 30 | Sells (speed + consolidation) | Install command block | 3 · `Install Bun v1.4.2`, copy-command, `View install script ↗` | 1–2 | **Animated benchmark bars** — `Installing a Next.js app · warm cache · seconds (lower is better)`, `bun 0.21s` vs `npm 4.45s`, each with a full methodology footnote and a `reproduce` link | Subtle (bars replay) | **Numbers instead of logos** |
| vite.dev | `The Build Tool for the Web` | 6 | `Vite is a blazing fast frontend build tool powering the next generation of web applications.` | 15 | Sells (category + speed) | 3 background canvases | 2 · `Get Started`, `View on GitHub` (+ 5-manager install tabs) | 1 | `Trusted by the world's best software teams` → logo band | Subtle | Immediately below hero |
| motion.dev | `Motion.` / `Production-grade animation library for the web.` | 7 | badge row: `Open source / MIT License` · `v13.1.0` · `Prev Framer Motion. Available for: React JavaScript Vue` | — | Sells (grade + provenance) | **Live animation demos** (2 canvas, 7 video) — the page *is* the product | 2 · `Get started`, `Browse examples` | 0 | **A five-claim proof strip**: `Free` (MIT) · `Production ready` ("Trusted by Framer and Figma across hundreds of thousands of sites") · `Hybrid engine` · `Built for AI` · `Tiny footprint` ("APIs up to 90% smaller than their GSAP alternative") | Heavy (justified — it is an animation library) | Inside the proof strip, one line |
| rive.app | `The Interactive experience engine` | 4 | `Powering Spotify Wrapped, Duolingo, and products reaching 2 billion users. Design, animate, and code in one place. Ship everywhere.` | 19 | Sells (category + borrowed fame) | Live Rive animations (5 canvas, 10 video) | 2 · `DOWNLOADS`, `SCRIPTING IS LIVE` | 0 | `Rive Editor` / `Design, code, and animate` | Heavy | **In the subline** (Spotify, Duolingo, 2 billion users) |
| spline.design | `Make anything 3D` | 3 | `Create 3D with AI or build with direct control` | 9 | **Sells** (pure capability desire, 3 words) | **Carousel of live community 3D scenes** (3 canvas, 12 video), each credited `@handle` | 1 · `Get Started` (+ `Get started by remixing a 3D design made by the Spline community`) | 0 | `Empowering individuals and teams at world's leading organizations` | Heavy | First section + named testimonial |
| unicorn.studio | `The Design Tool for Interactive Graphics` | 6 | `Create interactive motion and real-time graphics for the web. Stack layers on a real-time canvas, shape them with effects and motion, expose controls, and ship.` | 25 | Sells headline; subline lists mechanics | Full-bleed live WebGL effect **(from memory)** | `Get started` **(from memory)** | 0 | Gallery of live effects **(from memory)** | Heavy | Gallery + creator credits **(from memory)** |
| typegpu.com | `TypeGPU` (set as a `Type`/`GPU` wordmark) | 1 | `A modular and open-ended toolkit for WebGPU, with advanced type interface and ability to write shaders in TypeScript.` | 18 | **Explains** — a feature list, no desire | Nothing above the fold | 2 · `Get started`, `See examples` | 0 | `Explore TypeGPU examples` → grid of live tiles: Jelly Slider, 3D Fish, Vaporrave, Cubemap Reflection, Caustics, Ray Marching | None ATF, heavy below | None; video testimonials far down |
| threejs.org | `three.js` `r185` | 2 | — | 0 | Neither — the work *is* the pitch | **A full-page grid of live-rendered example thumbnails** | 0 hero CTAs (nav only: docs · examples · editor · github · download) | 0 | The showcase grid begins immediately | Heavy | The grid itself is the proof |
| pixijs.com | `The HTML5 Creation Engine` | 4 | `Create beautiful games, apps, and interactive digital content with the fastest 2D WebGPU/WebGL renderer.` | 14 | Sells (superlative) + names both APIs | Animated banner **(from memory — client-rendered)** | 2 · `Getting Started`, `Tutorials` | 0 | Examples / features | Subtle | `A mature solution for hundreds of global brands` |
| **zed.dev** (own pick) | `Your last next editor` | 4 | `Zed is a minimal code editor crafted for speed and collaboration with humans and AI.` | 15 | **Sells** — a joke that states the ambition | Animated product replica + 1 canvas | 2 · `Download now` `D`, `Clone source` `C` (keys shown) | 0 | Three one-line claims: `Fast` ("Written from scratch in Rust…") · `Agentic` · `Collaborative` | Subtle | `Trusted by world-class developers & industry leading teams` — named quotes |
| **cursor.com** (own pick) | `Cursor is your coding agent for building ambitious software.` | 9 | none — CTAs sit directly under the headline | 0 | **Sells** (identity) | Live product demo (desktop + CLI) | 3 · `Download for macOS`, `Get started`, `Request a demo` | 0 | `Trusted every day by teams that build world-class software` | Subtle | Immediately below hero (logos), then named quotes |

Own picks justified: **zed.dev** and **cursor.com** are the two pages that sell a *developer tool
whose whole claim is a felt quality* (speed; capability) without a single line of code above the
fold — the same problem TypeShade has, since "the outputs agree" is felt, not read.

---

## Part C — framework classification, every page

Columns: **Formula** = the copywriting structure the hero runs (AIDA / PAS / BAB / FAB / 4 U's /
category-claim). **VP hierarchy** = the Copyhackers–Wiebe value-proposition stack as actually built,
against the canonical headline → subheadline → bullets/proof → visual → CTA, and NN/g's rule that
the above-the-fold job is to earn the scroll, not to complete the sale. **Reading** = the layout's
intended scan path (F / Z / layer-cake / gallery). **Social proof** = which of the five types
(logos · numbers · testimonials · stars/downloads · named-customer) and where it lands.
**CTA ladder** = primary / secondary / tertiary and whether button copy is imperative or
first-person. **Rhythm** = the section sequence. **5-second test** = what a first-time visitor could
say the product is after five seconds on the hero alone.

### Primary four

| Page | Formula | VP hierarchy (as built) | Reading | Social proof | CTA ladder | Rhythm | 5-second test |
| --- | --- | --- | --- | --- | --- | --- | --- |
| react.dev | Category-claim; 4 U's *Useful*+*Unique*. Body = FAB ×6 | headline → subhead → CTA. **No visual, no bullets** | Z hero, layer-cake body | Numbers in prose only. **No logos, no stars, no quotes.** Lands late (§7, §9) | 1° `Learn React` · 2° `API Reference` · 3° a **different verb per section**. Imperative | solution → proof ×4 → platform → credibility → news → community → CTA. **No problem statement** | "The standard library for building user interfaces, for web and native." |
| vuejs.org | Category-claim; 4 U's *Unique* = "Progressive". Body = FAB ×3 | headline → subhead → CTA. No visual | Z hero, layer-cake body | **Sponsor logos, tiered.** Immediately below hero | 1° `Get Started` · 2° `Install` · 3° `Get Security Updates for Vue 2` (gradient border = 4th tier). Imperative | solution → social → benefit ×3 → social → sitemap | "A JavaScript framework for web UIs you can adopt gradually." |
| tailwindcss.com | **BAB** (Before folded into the headline) + 4 U's *Ultra-specific* (names 4 real classes) | headline → subhead → **visual = the proof** → CTA. Bullets replaced by the sample | **F** hero, layer-cake body | Sponsor logos → user logos; one measured claim ("less than 10kB of CSS") | 1° `Get started` · 3° `Become a sponsor`, `Explore Tailwind Plus`. Imperative | solution → social → how-it-works ×12 → proof → social → upsell | "A CSS framework where you style by putting utility classes in your markup." |
| mui.com | BAB headline over FAB body | headline → **34-word subhead doing the bullets' job** → CTA. No visual | Z hero, layer-cake body | **All four types**: logos, numbers (5.8M / 93.9k / 3.0k), 4 attributed quotes, tiered sponsors | 1° `Discover the Core libraries` · 3° `Become our sponsor!`, `Subscribe`. Imperative | solution → social → product map → benefit → proof → social → social → sponsor → capture | "React component libraries you can drop in and ship with." |

### Secondary

| Page | Formula | VP hierarchy (as built) | Reading | Social proof | CTA ladder | Rhythm | 5-second test |
| --- | --- | --- | --- | --- | --- | --- | --- |
| svelte.dev | 4 U's, *Unique* only; the subhead is a dictionary joke | headline → gloss → illustration → CTA | Z hero, layer-cake | **Rank-based**: dev-survey charts, then "used by companies you've heard of" logos | 1° `get started` only — **single-CTA hero**. Imperative, lowercase | solution → explain → social → community → contributors | "A friendlier way to build web UIs, using a compiler." |
| angular.dev | FAB, abstract | headline → subhead → CTA. No visual; the `h1` is a release banner | Z hero, layer-cake | None early; prose "Trusted by millions" at §3. **No logos, no numbers** | 1° `Get Started` only. Imperative | solution → features → benefits → performance → learn | "A framework for large web apps." |
| nextjs.org | 4 U's with **social proof inside the subheadline** | headline → subhead → CTA pair + copy-command | Z hero, layer-cake | **Borrowed authority in the subhead** ("Used by some of the world's largest companies"); logos later | 1° `Get Started` · 2° `Learn Next.js` · 3° copy `npx create-next-app@latest`. Imperative | solution → features → social | "The framework for building React apps." |
| astro.build | FAB + superlative | headline → subhead → CTA + copy chip; illustration bg | Z hero, layer-cake | **Logos immediately** ("Used by the largest companies around the world:") | 1° `Get Started` · 3° copy-install. Imperative | solution → **"What is Astro?" (explains)** → social | "A framework for fast content-driven sites." |
| linear.app | Category-creation / BAB | headline → subhead → **product visual dominant**; CTA displaced to the header | Z hero, layer-cake | Logos + a number ("over 40,000 product teams"), first section below hero | Hero carries only 3° `New — Loops →`; 1° `Sign up` lives in the sticky header. Imperative | solution → social → benefit ×3 | "Issue tracking and planning software for product teams." |
| vercel.com | Category-claim, 2 words | headline → subhead → **shader canvas** → CTA pair | Z hero, layer-cake | **One flagship customer** (Notion) as the entire first section | 1° `Deploy now` · 2° `Talk to sales` — the self-serve + sales-assist pair. Imperative | solution → customer proof → products | "Hosting and infrastructure for AI-agent apps." |
| stripe.com | FAB + 4 U's *Ultra-specific* ("from your first transaction to your billionth") | headline → subhead → CTA → **logo marquee inside the hero** | Z hero, layer-cake | **Logos in the hero itself**, under "Global GDP running on Stripe:" | 1° `Get started` · 2° `Sign up with Google` · 3° `Contact sales`. Imperative | solution → social → product map → numbers | "Payments infrastructure for businesses." |
| framer.com | FAB, over-long (14-word headline + 33-word subhead) | headline → subhead → video → CTA pair | Z hero | Ranking chip in hero; `Meet our customers` below | 1° `Get started for free` · 2° `Download app`. Imperative | solution → benefit → features | "An AI tool that designs and publishes websites." |
| raycast.com | **BAB**; the first section is an explicit reframe — "It's not about saving time. / It's about feeling like you're never wasting it." (PAS agitation inverted into emotion) | headline → subhead → **interactive object** → CTA | Z hero, layer-cake | Named testimonials, later (`Built for professionals like you`) | Hero carries one product CTA `The Raycast Keyboard`; download lives elsewhere. Imperative | solution → **emotional reframe** → benefit ×4 → social | "A keyboard launcher that runs everything on your Mac." |
| bun.sh | FAB + 4 U's *Ultra-specific* (versions, seconds, hardware) | headline → subhead → install block → **benchmark proof at fold+1** | F hero, layer-cake body | **Measured numbers with methodology and a `reproduce` link. No logos at all.** | 1° `Install Bun v1.4.2` · 2° copy-command · 3° `View install script ↗`, `Then follow the quickstart`. Imperative | solution → **proof ×3** → features | "A faster JavaScript runtime that replaces node, npm, jest and the bundler." |
| vite.dev | FAB | headline → subhead → CTA pair + 5 install tabs; canvas bg | Z hero, layer-cake | Logo band immediately ("Trusted by the world's best software teams"), then quotes, then `80k+` | 1° `Get Started` · 2° `View on GitHub` · 3° install tabs. Imperative | solution → social → benefit → ecosystem → quotes → numbers | "The dev server and build tool for web apps." |
| motion.dev | **FAB compressed into a proof strip** — 5 claims × 1 line, each carrying a number or a name | headline → badge row → **live demos** → CTA pair | Z hero, layer-cake with numbered sections (`01`, `02`…) | **Inside the proof strip**, one line: "Trusted by Framer and Figma across hundreds of thousands of sites" | 1° `Get started` · 2° `Browse examples`. Imperative | solution → **proof strip** → numbered features → upsell | "An animation library for React, JavaScript and Vue." |
| rive.app | FAB + **borrowed fame as the subheadline itself** | headline → subhead(names Spotify, Duolingo, 2bn users) → live animation → CTA | Z hero, layer-cake | **In the subheadline**, before anything else | 3° `DOWNLOADS`, `SCRIPTING IS LIVE` — no true primary in the hero. Imperative/announcement | solution → product → runtimes → social | "A tool for building interactive animations that ship anywhere." |
| spline.design | 4 U's, *Useful*, 3 words | headline → subhead → **live community gallery** → CTA | Gallery | Gallery credits (`@handle`) + "world's leading organizations" | 1° `Get Started` (header) · 3° `Get started by remixing a 3D design…`. Imperative | solution → social → features | "A browser tool for making 3D scenes." |
| unicorn.studio | Category-claim; subhead is a mechanics list | headline → 25-word subhead → live WebGL **(from memory)** | Gallery **(from memory)** | Gallery + creator credits **(from memory)** | `Get started` **(from memory)** | solution → gallery **(from memory)** | "A design tool for real-time web graphics." |
| typegpu.com | **FAB with the B missing** — "modular", "open-ended", "advanced type interface" are features with no benefit and no outcome | headline(wordmark) → 18-word subhead → CTA pair. **No hero visual, on a graphics library** | Z hero, gallery below | **None.** Video testimonials far down | 1° `Get started` · 2° `See examples`. Imperative | solution → live example gallery → ways-to-use → code | "A TypeScript library for WebGPU." *(a visitor cannot say what it gets them)* |
| threejs.org | **None — demonstration only** | wordmark → gallery. No headline, no subhead, no CTA | Gallery | **The showcase grid is the proof** | Nav links only. No hero CTA | gallery, immediately | "A JavaScript 3D library — and look what people made with it." |
| pixijs.com | FAB + superlative | headline → subhead → CTA pair | Z hero, layer-cake | "A mature solution for hundreds of global brands" | 1° `Getting Started` · 2° `Tutorials`. Imperative | solution → examples → features | "A fast 2D renderer for games and interactive content." |
| **zed.dev** | **BAB with a joke** — "Your last next editor" names the Before (editor churn) and the After in four words | headline → subhead → CTA pair with key hints → product replica | Z hero, layer-cake | Named testimonials below ("Trusted by world-class developers & industry leading teams") | 1° `Download now` `D` · 2° `Clone source` `C` — **keyboard shortcuts printed on the buttons**, a proof of the product inside the CTA. Imperative | solution → benefit ×3 (one line each) → product → social | "A fast code editor built for working with AI." |
| **cursor.com** | Category/identity ("Cursor **is** your coding agent") | headline → **no subhead** → CTA trio → live product | Z hero, layer-cake | Logos immediately, then named quotes | 1° `Download for macOS` · 2° `Get started` · 3° `Request a demo` — self-serve, PLG and sales-assist in one row. Imperative | solution → social → benefit | "An AI coding agent you install as your editor." |

**The 5-second test is where typegpu.com fails and everything else passes.** Its answer names a
technology, not a job — the direct consequence of an FAB hero with no B. That is the gap TypeShade's
hero exists to occupy.

---

## Part D — the pattern library TypeShade follows

Ten named patterns, each abstracted from the pages above. The build (`04-ia-wireframe.md`,
`src/**`) should be checkable against this list by name.

| # | Pattern | Rule | Seen in |
| --- | --- | --- | --- |
| **P1** | **Desire headline, mechanism subhead** | Headline states the after-state in ≤ 9 words and names no mechanism; the subheadline names the mechanism in ≤ 25. Never both in one line. | tailwind, raycast, zed, spline |
| **P2** | **Proof-adjacent visual** | A claim and the evidence for it occupy the same viewport. If the prose were deleted, the section would still communicate. | react ×4, tailwind ×12, mui, bun |
| **P3** | **Credibility band at fold + 1** | The first thing after the hero is borrowed trust — logos, sponsors, measured numbers or one named customer — never a feature. | vue, tailwind, mui, astro, vite, linear, vercel, cursor |
| **P4** | **Code as hook, never as reference** | ≤ 18 lines, always paired with what it produces. **Generated output is never printed, only indicated.** | tailwind (never prints CSS), react (never prints the reconciler) |
| **P5** | **Proof strip** | 4–5 one-line claims directly under the hero, each carrying a number or a proper name; no claim without one. | motion.dev, zed |
| **P6** | **Measured number with methodology** | Every number carries its unit, its conditions and a route to reproduce it. A bare number is an adjective. | bun (`reproduce` link + hardware + cache state), mui (`Weekly downloads on npm`) |
| **P7** | **Z hero, layer-cake body** | Centred/Z hero for the 5-second read; `h2` + proof, repeated, for the scanner who never reads a paragraph. | all four primaries |
| **P8** | **Verb-varied CTA ladder** | Primary imperative and low-friction; secondary lower-commitment; **each tertiary uses a different verb pointing at a different destination.** Repeating "Get started" six times wastes six slots. | react.dev (5 distinct section verbs) |
| **P9** | **Version state as a chip, never as a lead** | Release or pre-release status is a nav chip or a banner strip, positioned after the claim. | `v4.3`, `v19.2`, `v8.2.2`, `v13.1.0`, `Angular v22 is here!` |
| **P10** | **No comparison table** | None of the four primary pages has one. Claims stand alone; a competitor gets one honest line or nothing. | react, vue, tailwind, mui |

### Synthesis in prose

**The hero formula the four primaries share.** Claim in ≤ 9 words → one line of ≤ 25 → one or two
CTAs → nothing else. No paragraph, no self-definition. Three of four put **no visual object in the
hero at all**; Tailwind is the exception and its object is code *plus the design that code produces*
— never code alone (**P1**, **P4**).

**Where they differ, and which side TypeShade is on.** React and Vue lead with **identity** and can,
because the name already carries meaning. Tailwind and MUI lead with **outcome** because they must
earn the click. TypeShade is unknown: it is in the Tailwind/MUI class and must lead with outcome.
MUI shows that class's failure mode — a 34-word subheadline that turns the hero into a paragraph,
the exact Copyhackers error of making the subhead do the bullets' work.

**Section rhythm.** Hero → credibility → 3–6 proof sections → an ask → footer. Vue = 5 blocks,
Tailwind = 7, react.dev = 10, MUI = 10; median **6–7 before the footer**, one claim each. Note that
**not one of the four opens with a problem statement** — PAS is used, when it is used, at the
*section* level (raycast's "It's not about saving time"), never in the hero.

**Mobile.** All four collapse to one column and sacrifice the hero's second object first: Tailwind's
code pane stacks under the headline, MUI's logo band wraps to 2×3, and Vue steps its tagline
76 → 64 → 48 → 36px at 960/794/576/370px explicitly in `Home.vue`. Wide artifacts — tables, code —
are the first thing to go, which is a second argument against the rejected v1's comparison table.

**Motion.** Subtle everywhere except pages whose product *is* motion (motion.dev, rive, spline,
three.js). TypeShade's product is a rendered image, so it earns one live canvas — and nothing beyond.

### The rejected v1's anti-patterns, mapped to the pattern they break

| v1 did | Pattern broken | What the primaries do instead |
| --- | --- | --- |
| Three code panes above the fold (authored + WGSL + GLSL), reader asked to diff two outputs | **P4** | Tailwind shows **one** sample and its rendered result; React shows a snippet and its live component. Output is indicated, never listed |
| A 4-column comparison table (`tool / host / targets / note`) | **P10** | No primary page has one. MUI states its own claims and lets numbers and quotes do the comparing |
| Three pillar paragraphs defining "One source / Typed / Verified" | **P5** | Vue's three boxes claim in ~20 words; motion.dev's five-claim strip is one line each, each with a number or a name in it |
| Explaining WGSL / GLSL / std140 in prose | **P1** | Tailwind never defines "utility class"; React never defines "reconciler". Jargon is a label on a demo or absent |
| `pre-release` pill as the first element above the headline | **P9** | Every page leads with the claim; version state is a nav chip or a banner strip |
| A flat gradient `div` labelled "both draw" as the only visual | **P2** | Live and interactive everywhere: react's typeable search box, MUI's clickable components, typegpu's example grid, bun's replaying bars |
| Numbers as a bare four-cell `<dl>` with no context | **P6** | Bun attaches methodology and a `reproduce` link to every number; MUI labels each with its source |
| Every CTA a variant of "Get started / GitHub / Docs" | **P8** | React uses a different verb per section, each pointing somewhere new |
| Hero headline "Typed shaders in TypeScript" — a mechanism, not a desire | **P1** | `Rapidly build modern websites…`, `Your shortcut to everything.`, `Make anything 3D` |

### The five pages TypeShade should most resemble

1. **bun.sh** — the closest structural match: an invisible-benefit tool that advertises with a measured number, its methodology and a `reproduce` link (**P6**). TypeShade's oracle and Tint gates want exactly that treatment.
2. **motion.dev** — hero is the product running, and beneath it a five-claim proof strip where every claim carries a number or a name (**P5**). That strip is TypeShade's section 1.
3. **tailwindcss.com** — how to use code as a hook (**P4**): one short sample always paired with what it produces, jokes instead of definitions, and never a line of generated output.
4. **typegpu.com** — the direct competitor and the page to beat. Same subject, but an FAB hero with no benefit and no visual, so it fails the 5-second test. Take its one strong move — an immediate grid of live examples — and put a desire-led hero in front of it.
5. **react.dev** — the section grammar (**P2**, **P8**): claim → snippet → its live result in the same viewport, six times, with a different CTA verb each time, no comparison table and no logo band.
