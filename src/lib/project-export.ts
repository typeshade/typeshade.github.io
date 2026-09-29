// The Playground's workspace as a project of its own: the files a reader downloads, installs
// with npm, checks, builds and runs, in VS Code or anywhere else (DESIGN.md, Playground, "The
// project a reader downloads").
//
// The Playground draws a program with values the reader never writes: the clock, the size of
// the canvas, the pointer, the colours and pictures in the bindings panel, the passes of the
// workspace. A folder of shader files leaves all of that behind, so it was a set of files no
// tool could run but the Playground itself. The project carries it as code: `src/main.ts` draws
// the same programs with the program runtime (`typeshade/runtime`), and each value the
// Playground gave a binding is written there, where the reader can read it and change it.
//
// This file builds that project from a description of what the Playground draws (`ProjectFill`,
// which src/scripts/playground-bindings.ts produces). It imports nothing and touches no DOM, so a
// check can build the same project in Node that the page builds in the browser
// (scripts/check-projects.mjs).

/** The version of `typeshade` a project depends on. */
export const TYPESHADE_VERSION = '^0.1.0';

/** A value the Playground fills every frame, which main.ts computes the same way: the clock in
 *  seconds, the drawing buffer in pixels, the pointer from 0 to 1, the frames drawn and the
 *  seconds since the frame before (src/lib/live-shader-contract.ts). */
export type LiveValue = 'time' | 'resolution' | 'mouse' | 'frame' | 'timeDelta';

/** A binding's value as main.ts writes it: a value in the program runtime's host shape (a
 *  scalar a number or a boolean, a vector an array of its components, a matrix a flat
 *  column-major array, a fixed array an array, a struct an object of its fields), or one of
 *  the live values, which main.ts computes each frame. A live `mouse` read as a `vec4` is the
 *  pointer followed by zeros, as the Playground packs it. */
export type FillValue =
  | number
  | boolean
  | { readonly live: LiveValue; readonly components?: number }
  | readonly FillValue[]
  | { readonly [field: string]: FillValue };

/** A texture a program samples, and what the Playground puts in it. */
export type TextureFill =
  /** One of the Playground's pictures, made by src/textures.ts, which the project carries. */
  | {
      readonly kind: 'generated';
      readonly source: 'checker' | 'gradient' | 'noise' | 'solid' | 'faces';
      readonly width: number;
      readonly height: number;
      readonly layers: number;
      readonly solid: readonly number[];
      /** The view the program reads it through, where it is not `2d`. */
      readonly view?: 'cube' | 'cube-array' | '2d-array' | '3d';
    }
  /** A picture the reader dropped on the Playground, carried as `public/<file>`. */
  | { readonly kind: 'image'; readonly file: string }
  /** The output of a pass of the workspace (compiler change 0026). */
  | { readonly kind: 'pass'; readonly pass: string };

export interface SamplerFill {
  readonly filter: 'linear' | 'nearest';
  readonly address: 'clamp' | 'repeat' | 'mirror';
}

/** One program main.ts draws: a pass of the workspace, drawn into a texture, or the main file,
 *  drawn onto the canvas. */
export interface ProgramFill {
  /** The shader file, by its path under `src/`. */
  readonly file: string;
  /** The pass this program draws, by the name the workspace gives it; none for the main file. */
  readonly pass?: string;
  /** Each uniform binding's value, by the binding's name. */
  readonly uniforms: Readonly<Record<string, FillValue>>;
  readonly textures: Readonly<Record<string, TextureFill>>;
  readonly samplers: Readonly<Record<string, SamplerFill>>;
  /** The overrides the reader moved away from their defaults, by name. */
  readonly constants: Readonly<Record<string, number>>;
  /** The three vertices a vertex entry with `@location` inputs reads, interleaved. */
  readonly vertices?: readonly number[];
  /** Set for a module whose only entry is `@compute`: main.ts dispatches it once and prints what
   *  it wrote, where a program with a fragment entry is drawn every frame. */
  readonly compute?: ComputeFill;
}

/** A host value a dispatch is handed, as the Playground hands the CPU oracle: the shapes of
 *  `FillValue`, and a typed array for a storage array with no size of scalars. */
export type DataValue =
  | number
  | boolean
  | readonly DataValue[]
  | { readonly [field: string]: DataValue }
  | {
      readonly $typed: 'Float32Array' | 'Uint32Array' | 'Int32Array';
      readonly values: readonly number[];
    };

/** One dispatch of a compute entry, with the values the Playground gave its bindings. */
export interface ComputeFill {
  readonly entry: string;
  /** Workgroups along x, as the Playground dispatches them. */
  readonly workgroups: number;
  /** Every uniform and storage binding's value, by name. */
  readonly values: Readonly<Record<string, DataValue>>;
  /** The storage buffers the entry writes, which main.ts reads back and prints. */
  readonly written: readonly string[];
  /** The storage textures the entry writes, each read back and shown when it is RGBA8. */
  readonly storageTextures: Readonly<
    Record<string, { readonly format: string; readonly width: number; readonly height: number }>
  >;
}

/** What a project is made from. */
export interface ProjectFill {
  /** The folder and the package name: lower case, digits and hyphens. */
  readonly name: string;
  /** Every shader file of the workspace, by its path under `src/`. */
  readonly files: Readonly<Record<string, string>>;
  /** The passes, in draw order, then the main file. */
  readonly programs: readonly ProgramFill[];
  /** Pictures the reader dropped, by their path under `public/`. */
  readonly images?: Readonly<Record<string, Uint8Array>>;
  /** The text of src/lib/texture-sources.ts, carried as `src/textures.ts` when a program
   *  samples one of the Playground's pictures. The caller reads it: the page through Vite's
   *  `?raw`, a script from the file. */
  readonly texturesModule: string;
}

// ── Writing JavaScript ───────────────────────────────────────────────────────────────────

/** A number as main.ts writes it: whole numbers bare, the rest at the precision the value has,
 *  which `String` already gives. */
const num = (n: number): string => (Object.is(n, -0) ? '0' : String(n));

const isLive = (v: FillValue): v is { readonly live: LiveValue; readonly components?: number } =>
  typeof v === 'object' && v !== null && !Array.isArray(v) && 'live' in v;

/** An identifier for a property key, quoted where it is not one. */
const key = (k: string): string => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k));

/** A property of an object literal, in its short form where the value is the variable of its
 *  name (`{ time }`). */
const property = (name: string, value: string): string =>
  name === value ? name : `${key(name)}: ${value}`;

/** A value as a JavaScript expression, the live values named by the variables main.ts keeps. */
function expression(v: FillValue): string {
  if (typeof v === 'number') return num(v);
  if (typeof v === 'boolean') return String(v);
  if (isLive(v)) {
    if (v.live === 'mouse' && (v.components ?? 2) > 2)
      return `[...mouse${', 0'.repeat((v.components ?? 2) - 2)}]`;
    return v.live;
  }
  if (Array.isArray(v)) return `[${v.map(expression).join(', ')}]`;
  const entries = Object.entries(v as { readonly [field: string]: FillValue });
  return `{ ${entries.map(([k, x]) => property(k, expression(x))).join(', ')} }`;
}

/** Whether a value reads any live value, which is when it is written inside the frame loop. */
function readsLive(v: FillValue): boolean {
  if (isLive(v)) return true;
  if (Array.isArray(v)) return v.some(readsLive);
  if (typeof v === 'object' && v !== null) return Object.values(v).some(readsLive);
  return false;
}

/** The live values a value reads. */
function livesOf(v: FillValue, out = new Set<LiveValue>()): Set<LiveValue> {
  if (isLive(v)) out.add(v.live);
  else if (Array.isArray(v)) for (const x of v) livesOf(x, out);
  else if (typeof v === 'object' && v !== null) for (const x of Object.values(v)) livesOf(x, out);
  return out;
}

/** A JavaScript identifier from a file name, `passes/blur-x.shade.ts` → `blurX`. */
function identifierOf(file: string): string {
  const stem = file
    .split('/')
    .pop()!
    .replace(/\.shade\.ts$/, '');
  const words = stem.split(/[^A-Za-z0-9]+/).filter(Boolean);
  const id = words
    .map((w, i) =>
      i === 0 ? w.charAt(0).toLowerCase() + w.slice(1) : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join('');
  return /^[A-Za-z_]/.test(id) ? id : `shader${id.charAt(0).toUpperCase()}${id.slice(1)}`;
}

/** The names main.ts declares itself, which an import of a shader never takes. */
const RESERVED_NAMES = new Set([
  'canvas',
  'context',
  'format',
  'rt',
  'draw',
  'frame',
  'time',
  'resolution',
  'mouse',
  'timeDelta',
  'start',
  'last',
  'frames',
  'uploaded',
  'textures',
  'passFormat',
]);

// ── The project ──────────────────────────────────────────────────────────────────────────

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

/**
 * The project's files, by their path in the folder: text, and the bytes of any picture.
 *
 * @param fill - what the Playground draws.
 * @returns every file of the project.
 */
export function projectFiles(fill: ProjectFill): Record<string, string | Uint8Array> {
  const main = fill.programs[fill.programs.length - 1];
  if (!main || main.pass !== undefined)
    throw new Error('a project needs its main file as the last program');
  const generated = fill.programs.some((p) =>
    Object.values(p.textures).some((t) => t.kind === 'generated'),
  );
  const files: Record<string, string | Uint8Array> = {
    'package.json': packageJson(fill.name),
    'vite.config.ts': VITE_CONFIG,
    'tsconfig.json': TSCONFIG,
    'index.html': indexHtml(fill.name, main.compute !== undefined),
    'typeshade.json': json({
      main: `src/${main.file}`,
      ...(fill.programs.length > 1
        ? {
            passes: fill.programs
              .slice(0, -1)
              .map((p) => ({ name: p.pass!, file: `src/${p.file}` })),
          }
        : {}),
    }),
    '.gitignore': 'node_modules\ndist\n*.shade.typeshade.ts\n',
    '.vscode/extensions.json': json({ recommendations: ['typeshade.vscode-typeshade'] }),
    'README.md': readme(fill.name, main.file, main.compute !== undefined),
    'src/main.ts': main.compute ? computeMainTs(main, main.compute) : mainTs(fill),
  };
  for (const [path, text] of Object.entries(fill.files)) files[`src/${path}`] = text;
  if (generated) files['src/textures.ts'] = fill.texturesModule;
  for (const [path, bytes] of Object.entries(fill.images ?? {})) files[`public/${path}`] = bytes;
  return files;
}

function packageJson(name: string): string {
  return json({
    name,
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
      check: 'tshc check src/ && tsc -p tsconfig.json',
      prepare: 'tshc sync',
    },
    dependencies: { typeshade: TYPESHADE_VERSION },
    devDependencies: { '@webgpu/types': '^0.1.60', typescript: '~5.9.0', vite: '^7.1.0' },
  });
}

const VITE_CONFIG = `// The TypeShade plugin compiles each .shade.ts file an import names: a host file that imports
// one gets the program's manifest, which the program runtime draws (src/main.ts).
import { defineConfig } from 'vite';
import { typeshade } from 'typeshade/vite';

export default defineConfig({ plugins: [typeshade()] });
`;

// The host files only: a shader is checked by \`tshc check\` and by the editor's TypeShade
// plugin, which know the language, where plain tsc reports errors a shader does not have. A
// host file's import of a shader reads the view \`tshc sync\` writes beside it
// (\`moduleSuffixes\`), which \`npm install\` runs.
const TSCONFIG = json({
  compilerOptions: {
    target: 'ES2022',
    module: 'ESNext',
    moduleResolution: 'bundler',
    lib: ['ES2022', 'DOM'],
    types: ['@webgpu/types', 'vite/client'],
    moduleSuffixes: ['.typeshade', ''],
    allowImportingTsExtensions: true,
    strict: true,
    noEmit: true,
  },
  include: ['src'],
  exclude: ['src/**/*.shade.ts'],
});

function indexHtml(name: string, compute: boolean): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${name}</title>
    <style>
      html,
      body {
        margin: 0;
        height: 100%;
        background: #000;
      }
      canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
      main {
        padding: 16px;
        font: 13px/1.5 ui-monospace, monospace;
        color: #e8e8e8;
      }
      h2 {
        margin: 16px 0 4px;
        font-size: 13px;
      }
      pre {
        margin: 0;
        white-space: pre-wrap;
      }
      main canvas {
        width: auto;
        height: auto;
        image-rendering: pixelated;
      }
      p {
        position: fixed;
        inset: auto 0 0;
        margin: 0;
        padding: 12px 16px;
        font: 14px/1.5 system-ui, sans-serif;
        color: #fff;
        background: #b3261e;
      }
    </style>
  </head>
  <body>
    ${compute ? '<main></main>' : '<canvas></canvas>'}
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`;
}

function readme(name: string, mainFile: string, compute: boolean): string {
  return `# ${name}

A TypeShade program, downloaded from the Playground at https://typeshade.dev/playground/.

\`\`\`sh
npm install      # also writes the host views of the shaders (tshc sync)
npm run dev      # opens it in the browser, redrawn on every save
npm run check    # what the editor reports: tshc check over src/, tsc over the host code
npm run build    # the site in dist/
\`\`\`

- \`src/${mainFile}\` is the shader, and every other \`.shade.ts\` file under \`src/\` is one it imports or a pass
  the program draws first.
- \`src/main.ts\` ${compute ? 'dispatches its compute entry once' : 'draws it every frame'} with the program runtime (\`typeshade/runtime\`), with the values the
  Playground gave it: change them there.${compute ? ' The page lists what the entry wrote.' : ''}
- \`typeshade.json\` names the main file and the passes, for the TypeShade extension and for opening the
  program in the Playground again.

It needs a browser with WebGPU. In VS Code, the TypeShade extension (recommended when the folder opens)
checks the shaders as you type.
`;
}

// ── main.ts ──────────────────────────────────────────────────────────────────────────────

/** The format a pass draws into, as the Playground draws it (compiler change 0026). */
const PASS_FORMAT = 'rgba16float';

function mainTs(fill: ProjectFill): string {
  const programs = fill.programs;
  const main = programs[programs.length - 1]!;
  // An import per program, named after its file.
  const taken = new Set(RESERVED_NAMES);
  const idOf = new Map<ProgramFill, string>();
  for (const p of programs) {
    let id = identifierOf(p.file);
    if (taken.has(id)) id = `${id}Shader`;
    while (taken.has(id)) id = `${id}_`;
    taken.add(id);
    idOf.set(p, id);
  }
  const passIndex = new Map(programs.slice(0, -1).map((p, i) => [p.pass!, i]));
  // A pass another program reads in the frame after it (itself, or a pass drawn before it)
  // keeps two textures and swaps them each frame; one read only later in the frame needs one.
  const history = new Set<string>();
  programs.forEach((p, at) => {
    for (const t of Object.values(p.textures))
      if (t.kind === 'pass' && (passIndex.get(t.pass) ?? -1) >= at) history.add(t.pass);
  });

  const lines: string[] = [];
  const out = (...more: string[]): void => {
    lines.push(...more);
  };

  const mainName = idOf.get(main)!;
  out(
    `// Draws ${main.file} every frame with the program runtime (typeshade/runtime), with the`,
    `// values the Playground gave it.${programs.length > 1 ? ' The passes typeshade.json names are drawn first, each into a' : ''}`,
    ...(programs.length > 1 ? [`// texture the programs after it read by the pass's name.`] : []),
    `import { createRuntime } from 'typeshade/runtime';`,
  );
  if (
    Object.values(programs).some((p) =>
      Object.values(p.textures).some((t) => t.kind === 'generated'),
    )
  )
    out(`import { generateTexels } from './textures.ts';`);
  for (const p of programs) out(`import ${idOf.get(p)} from './${p.file}';`);
  out(
    '',
    `const canvas = document.querySelector('canvas')!;`,
    `if (!navigator.gpu) {`,
    `  document.body.insertAdjacentHTML('beforeend', '<p>This page draws with WebGPU, which this browser does not have.</p>');`,
    `  throw new Error('WebGPU is not available');`,
    `}`,
    `const rt = await createRuntime<GPUDevice>({ programs: [${programs.map((p) => idOf.get(p)).join(', ')}] });`,
    `const context = canvas.getContext('webgpu')!;`,
    `const format = navigator.gpu.getPreferredCanvasFormat();`,
    `context.configure({ device: rt.device, format, alphaMode: 'opaque' });`,
  );

  // ── Textures and samplers, made once ──
  const textureLines: string[] = [];
  const uploads = new Set<string>();
  const madeTextures = new Map<string, string>(); // a key per distinct texture → its variable
  const textureVar = (program: ProgramFill, name: string, t: TextureFill): string => {
    if (t.kind === 'pass') return '';
    const k =
      t.kind === 'image'
        ? `image|${t.file}`
        : `gen|${t.source}|${t.width}|${t.height}|${t.layers}|${t.solid.join(',')}|${t.view ?? '2d'}`;
    const seen = madeTextures.get(k);
    if (seen) return seen;
    let v = name;
    while (taken.has(v)) v = `${v}Texture`;
    taken.add(v);
    madeTextures.set(k, v);
    if (t.kind === 'image') {
      uploads.add('image');
      textureLines.push(`const ${v} = await image('/${t.file}');`);
    } else {
      uploads.add('texels');
      const layers =
        t.layers === 1
          ? `[generateTexels('${t.source}', ${t.width}, ${t.height}, 0, 1${t.source === 'solid' ? `, [${t.solid.map(num).join(', ')}]` : ''})]`
          : `Array.from({ length: ${t.layers} }, (_, layer) => generateTexels('${t.source}', ${t.width}, ${t.height}, layer, ${t.layers}${t.source === 'solid' ? `, [${t.solid.map(num).join(', ')}]` : ''}))`;
      textureLines.push(
        `// The Playground's ${t.source} picture${t.layers > 1 ? `, ${t.layers} layers` : ''}${t.view ? `, read as a ${t.view} texture` : ''}.`,
        `const ${v} = uploaded(${t.width}, ${t.height}, ${layers}${t.view === '3d' ? `, '3d'` : ''});`,
      );
    }
    void program;
    return v;
  };
  const bindingsOf = new Map<ProgramFill, [string, string][]>(); // binding → expression
  const samplerVars = new Map<string, string>();
  for (const p of programs) {
    const pairs: [string, string][] = [];
    for (const [name, t] of Object.entries(p.textures)) {
      if (t.kind === 'pass') continue;
      pairs.push([name, textureVar(p, name, t)]);
    }
    for (const [name, s] of Object.entries(p.samplers)) {
      const k = `${s.filter}|${s.address}`;
      let v = samplerVars.get(k);
      if (!v) {
        v = name;
        while (taken.has(v)) v = `${v}Sampler`;
        taken.add(v);
        samplerVars.set(k, v);
        textureLines.push(
          `const ${v} = rt.sampler({ filter: '${s.filter}', address: '${s.address}' });`,
        );
      }
      pairs.push([name, v]);
    }
    bindingsOf.set(p, pairs);
  }
  if (textureLines.length > 0) out('', ...textureLines);

  // ── Pipelines ──
  out('');
  for (const p of programs) {
    const constants = Object.entries(p.constants);
    const state = [
      `targets: [${p.pass === undefined ? 'format' : `'${PASS_FORMAT}'`}]`,
      ...(constants.length > 0
        ? [`constants: { ${constants.map(([k, v]) => `${key(k)}: ${num(v)}`).join(', ')} }`]
        : []),
    ];
    out(
      `const ${idOf.get(p)}Pipeline = await rt.load(${idOf.get(p)}).render({ ${state.join(', ')} });`,
    );
  }
  // ── Pass targets ──
  const targetOf = new Map<string, string>();
  for (const p of programs.slice(0, -1)) {
    const v = `${idOf.get(p)}Targets`;
    targetOf.set(p.pass!, v);
    const count = history.has(p.pass!) ? 2 : 1;
    out(
      `// ${count === 2 ? 'Two textures, swapped each frame: a program that reads this pass after it drew, or before it draws, reads the frame before.' : 'What this pass drew, read by the programs after it in the same frame.'}`,
      `const ${v} = [${Array.from({ length: count }, () => `rt.texture({ size: [1, 1], format: '${PASS_FORMAT}' })`).join(', ')}];`,
    );
  }

  // ── The pointer and the clock ──
  const lives = new Set<LiveValue>();
  for (const p of programs) for (const v of Object.values(p.uniforms)) livesOf(v, lives);
  if (lives.has('mouse'))
    out(
      '',
      `// The pointer, from 0 to 1 across the canvas, as the Playground gives it.`,
      `const mouse = [0, 0];`,
      `canvas.addEventListener('pointermove', (event) => {`,
      `  mouse[0] = event.offsetX / canvas.clientWidth;`,
      `  mouse[1] = event.offsetY / canvas.clientHeight;`,
      `});`,
    );
  out('', `const start = performance.now();`, `let last = start;`, `let frames = 0;`);

  // ── The frame ──
  out(
    '',
    `function draw(now: number): void {`,
    `  const width = Math.max(1, Math.round(canvas.clientWidth * devicePixelRatio));`,
    `  const height = Math.max(1, Math.round(canvas.clientHeight * devicePixelRatio));`,
    `  if (canvas.width !== width || canvas.height !== height) {`,
    `    canvas.width = width;`,
    `    canvas.height = height;`,
    ...[...targetOf.values()].map(
      (v) => `    for (const target of ${v}) target.resize(width, height);`,
    ),
    `  }`,
  );
  if (lives.has('time')) out(`  const time = (now - start) / 1000;`);
  if (lives.has('timeDelta')) out(`  const timeDelta = (now - last) / 1000;`);
  if (lives.has('resolution')) out(`  const resolution = [width, height];`);
  if (lives.has('frame')) out(`  const frame = frames;`);
  out(`  const encoder = rt.frame();`);
  programs.forEach((p, at) => {
    const pairs: string[] = [];
    for (const [name, v] of Object.entries(p.uniforms)) pairs.push(property(name, expression(v)));
    for (const [name, v] of bindingsOf.get(p)!) pairs.push(property(name, v));
    for (const [name, t] of Object.entries(p.textures)) {
      if (t.kind !== 'pass') continue;
      const targets = targetOf.get(t.pass)!;
      const reads = history.has(t.pass)
        ? (passIndex.get(t.pass) ?? -1) >= at
          ? `${targets}[(frames + 1) % 2]`
          : `${targets}[frames % 2]`
        : `${targets}[0]`;
      pairs.push(`${key(name)}: ${reads}`);
    }
    const into =
      p.pass === undefined
        ? 'context'
        : history.has(p.pass)
          ? `${targetOf.get(p.pass)}[frames % 2]`
          : `${targetOf.get(p.pass)}[0]`;
    const geometry =
      p.vertices !== undefined
        ? `{ count: 3, vertices: new Float32Array([${p.vertices.map(num).join(', ')}]) }`
        : '{ count: 3 }';
    // Laid out the way Prettier lays it out, so the file reads like one a person wrote: the call
    // on one line where it fits in 100 columns, else an argument a line, and the bindings a
    // property a line where they do not fit either.
    const pipeline = `${idOf.get(p)}Pipeline`;
    const bindingsLine = `{ ${pairs.join(', ')} }`;
    const oneLine = `    pass.draw(${pipeline}, ${bindingsLine}, ${geometry}),`;
    out(`  encoder.pass({ color: [${into}] }, (pass) =>`);
    if (oneLine.length <= 100) out(oneLine);
    else if (`      ${bindingsLine},`.length <= 100)
      out(
        `    pass.draw(`,
        `      ${pipeline},`,
        `      ${bindingsLine},`,
        `      ${geometry},`,
        `    ),`,
      );
    else
      out(
        `    pass.draw(`,
        `      ${pipeline},`,
        `      {`,
        ...pairs.map((pair) => `        ${pair},`),
        `      },`,
        `      ${geometry},`,
        `    ),`,
      );
    out(`  );`);
  });
  out(
    `  last = now;`,
    `  frames += 1;`,
    `  void encoder.submit().then(() => requestAnimationFrame(draw));`,
    `}`,
    `requestAnimationFrame(draw);`,
  );

  // ── Helpers ──
  if (uploads.has('texels'))
    out(
      '',
      `/** A texture of RGBA8 texels, one array per layer. */`,
      `function uploaded(width: number, height: number, layers: Uint8Array<ArrayBuffer>[], dimension: '2d' | '3d' = '2d') {`,
      `  const texture = rt.texture({ size: [width, height, layers.length], format: 'rgba8unorm', dimension });`,
      `  layers.forEach((texels, layer) =>`,
      `    rt.device.queue.writeTexture(`,
      `      { texture: texture.texture as GPUTexture, origin: [0, 0, layer] },`,
      `      texels,`,
      `      { bytesPerRow: width * 4, rowsPerImage: height },`,
      `      [width, height, 1],`,
      `    ),`,
      `  );`,
      `  return texture;`,
      `}`,
    );
  if (uploads.has('image'))
    out(
      '',
      `/** A texture of a picture in public/. */`,
      `async function image(url: string) {`,
      `  const bitmap = await createImageBitmap(await (await fetch(url)).blob());`,
      `  const texture = rt.texture({ size: [bitmap.width, bitmap.height], format: 'rgba8unorm' });`,
      `  rt.device.queue.copyExternalImageToTexture({ source: bitmap }, { texture: texture.texture as GPUTexture }, [bitmap.width, bitmap.height]);`,
      `  return texture;`,
      `}`,
    );
  void readsLive;
  void mainName;
  return `${lines.join('\n')}\n`;
}

// ── main.ts for a dispatch ───────────────────────────────────────────────────────────────

/** A host value as a JavaScript expression, laid out over lines of at most 100 columns from
 *  `indent`: a long array wraps its numbers, and a long object puts a field on a line. */
function data(v: DataValue, indent: string): string {
  if (typeof v === 'number') return num(v);
  if (typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) {
    const items = v.map((x) => data(x, `${indent}  `));
    const flat = `[${items.join(', ')}]`;
    if (flat.length + indent.length <= 100 && !flat.includes('\n')) return flat;
    return `[\n${wrap(items, `${indent}  `)}\n${indent}]`;
  }
  if ('$typed' in v && Array.isArray((v as { values?: unknown }).values)) {
    const typed = v as { readonly $typed: string; readonly values: readonly number[] };
    return `new ${typed.$typed}(${data(typed.values, indent)})`;
  }
  const entries = Object.entries(v as { readonly [field: string]: DataValue }).map(
    ([k, x]) => `${key(k)}: ${data(x, `${indent}  `)}`,
  );
  const flat = `{ ${entries.join(', ')} }`;
  if (flat.length + indent.length <= 100 && !flat.includes('\n')) return flat;
  return `{\n${entries.map((e) => `${indent}  ${e},`).join('\n')}\n${indent}}`;
}

/** Items on lines of at most 100 columns, each line starting at `indent`. */
function wrap(items: readonly string[], indent: string): string {
  const lines: string[] = [];
  let line = '';
  for (const item of items) {
    const next = line === '' ? `${indent}${item},` : `${line} ${item},`;
    if (next.length > 100 && line !== '') {
      lines.push(line);
      line = `${indent}${item},`;
    } else line = next;
  }
  if (line !== '') lines.push(line);
  return lines.join('\n');
}

function computeMainTs(p: ProgramFill, c: ComputeFill): string {
  const id = identifierOf(p.file);
  const lines: string[] = [];
  const out = (...more: string[]): void => {
    lines.push(...more);
  };
  const written = new Set(c.written);
  out(
    `// Runs ${p.file}'s compute entry \`${c.entry}\` once with the program runtime`,
    `// (typeshade/runtime), with the values the Playground gave its bindings, and lists what it`,
    `// wrote.`,
    `import { createRuntime${written.size > 0 ? ', resident' : ''} } from 'typeshade/runtime';`,
    `import ${id} from './${p.file}';`,
    '',
    `const main = document.querySelector('main')!;`,
    `if (!navigator.gpu) {`,
    `  document.body.insertAdjacentHTML('beforeend', '<p>This page runs on WebGPU, which this browser does not have.</p>');`,
    `  throw new Error('WebGPU is not available');`,
    `}`,
    `const rt = await createRuntime<GPUDevice>({ programs: [${id}] });`,
    `const ${c.entry}Pipeline = await rt.load(${id}).compute('${c.entry}');`,
    '',
    `// The values the Playground gave each binding. What the entry writes is resident, so it is`,
    `// read back after the dispatch.`,
  );
  const names: string[] = [];
  const taken = new Set([...RESERVED_NAMES, id, 'main', 'show', 'picture', `${c.entry}Pipeline`]);
  const variable = (name: string): string => {
    let v = name;
    while (taken.has(v)) v = `${v}Value`;
    taken.add(v);
    return v;
  };
  for (const [name, value] of Object.entries(c.values)) {
    const v = variable(name);
    names.push(property(name, v));
    const expr = data(value, '');
    out(`const ${v} = ${written.has(name) ? `resident(${expr})` : expr};`);
  }
  for (const [name, t] of Object.entries(c.storageTextures)) {
    const v = variable(name);
    names.push(property(name, v));
    out(
      `const ${v} = rt.texture({ size: [${t.width}, ${t.height}], format: '${t.format}', storage: true });`,
    );
  }
  const bindings = `{ ${names.join(', ')} }`;
  out(
    '',
    `const frame = rt.frame();`,
    `${bindings.length <= 60 ? `frame.dispatch(${c.entry}Pipeline, ${bindings}, ${c.workgroups});` : `frame.dispatch(\n  ${c.entry}Pipeline,\n  {\n${names.map((n) => `    ${n},`).join('\n')}\n  },\n  ${c.workgroups},\n);`}`,
    `await frame.submit();`,
  );
  for (const name of c.written) out(`show('${name}', await ${variableOf(name, names)}.read());`);
  for (const [name, t] of Object.entries(c.storageTextures))
    out(
      t.format === 'rgba8unorm'
        ? `picture('${name}', ${t.width}, ${t.height}, await ${variableOf(name, names)}.read());`
        : `show('${name}', '${t.width} × ${t.height} ${t.format}');`,
    );
  out(
    '',
    `/** One binding's value, under its name. */`,
    `function show(name: string, value: unknown): void {`,
    `  const pre = document.createElement('pre');`,
    `  pre.textContent = JSON.stringify(ArrayBuffer.isView(value) ? Array.from(value as Float32Array) : value);`,
    `  const title = document.createElement('h2');`,
    `  title.textContent = name;`,
    `  main.append(title, pre);`,
    `}`,
  );
  if (Object.values(c.storageTextures).some((t) => t.format === 'rgba8unorm'))
    out(
      '',
      `/** An RGBA8 storage texture, as a picture. */`,
      `function picture(name: string, width: number, height: number, bytes: Uint8Array): void {`,
      `  const canvas = document.createElement('canvas');`,
      `  canvas.width = width;`,
      `  canvas.height = height;`,
      `  canvas.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(bytes), width, height), 0, 0);`,
      `  const title = document.createElement('h2');`,
      `  title.textContent = name;`,
      `  main.append(title, canvas);`,
      `}`,
    );
  return `${lines.join('\n')}\n`;
}

/** The variable main.ts binds `name` from, out of the `name` or `name: variable` pairs. */
function variableOf(name: string, pairs: readonly string[]): string {
  for (const pair of pairs) {
    if (pair === name) return name;
    if (pair.startsWith(`${key(name)}: `)) return pair.slice(key(name).length + 2);
  }
  return name;
}
