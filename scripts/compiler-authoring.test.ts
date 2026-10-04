import { expect, test } from 'bun:test';
import { compile } from '../vendor/shader-dsl/src/compiler/ts/compile.ts';
import { createTypeshadeLanguageService } from '../vendor/shader-dsl/src/language-service/index.ts';
import { wgslLayout } from '../vendor/shader-dsl/src/core/reflect.ts';

function checked(body: string) {
  const source = `"use typeshade";\n${body}`;
  const result = compile(source, { fileName: 'file:///authoring.shade.ts' });
  const service = createTypeshadeLanguageService();
  service.openDocument('file:///authoring.shade.ts', source);
  expect(
    service.getDiagnostics('file:///authoring.shade.ts').filter((d) => d.severity === 'error'),
  ).toEqual([]);
  expect(result.diagnostics.filter((d) => d.category === 'error')).toEqual([]);
  expect(result.wgsl).toBeDefined();
  return result;
}

test('parameter reassignment leaves the calling value unchanged', () => {
  const result = checked(
    'function brighter(value: f32): f32 { value += 0.25; return value; }\nexport function answer(): f32 { const value = 1.0; return brighter(value) + value; }',
  );
  expect(result.eval('answer')).toBe(2.25);
});

test('backend reserved variables preserve their source behavior', () => {
  const result = checked(
    'export function answer(target: f32): f32 { let sample = target; sample += 1.0; return sample; }',
  );
  expect(result.eval('answer', [2])).toBe(3);
  expect(result.glsl?.fragment).toBeDefined();
});

test('a method-only class has an empty host value', () => {
  const result = checked(
    'class Counter { next(value: f32): f32 { return value + 1.0; } }\nexport function make(): Counter { return new Counter(); }\nexport function answer(): f32 { return new Counter().next(2.0); }',
  );
  expect(result.eval('make')).toEqual({});
  expect(result.eval('answer')).toBe(3);
  expect(result.module.structs.find((s) => s.name === 'Counter')?.fields).toEqual([]);
  const structs = new Map(result.module.structs.map((s) => [s.name, s]));
  expect(wgslLayout(structs.get('Counter')!, 'std430', structs).size).toBe(4);
  expect(wgslLayout(structs.get('Counter')!, 'std140', structs).size).toBe(16);
});

test('a declared integer parameter constrains the unannotated local', () => {
  const result = checked(
    'function offset(value: i32): i32 { return value; }\nexport function answer(): i32 { const value = -1; return offset(value); }',
  );
  expect(result.eval('answer')).toBe(-1);
  expect(result.wgsl).toContain('i32');
});

test('conflicting declared argument types remain visible diagnostics', () => {
  const source =
    '"use typeshade";\nfunction integer(value: i32): i32 { return value; }\nfunction real(value: f32): f32 { return value; }\nexport function answer(): f32 { const value = 1; integer(value); return real(value); }';
  const result = compile(source, { fileName: 'file:///authoring.shade.ts' });
  const service = createTypeshadeLanguageService();
  service.openDocument('file:///authoring.shade.ts', source);
  expect(result.diagnostics.some((d) => d.code === 'TS8003')).toBe(true);
  expect(
    service.getDiagnostics('file:///authoring.shade.ts').some((d) => d.code === 'TS8003'),
  ).toBe(true);
  expect(result.wgsl).toBeUndefined();
});

test('an integer-written local without a declared integer demand keeps the f32 default', () => {
  const result = checked('export function answer(): f32 { const value = 1; return value; }');
  expect(result.eval('answer')).toBe(1);
  expect(result.wgsl).toContain('-> f32');
});

test('TS8018 still rejects assignment to a temporary component', () => {
  const source =
    '"use typeshade";\n@fragment export function main(@location(0) uv: vec2): vec4 { vec2(uv).x = 1.0; return vec4(uv, 0.0, 1.0); }';
  const result = compile(source);
  expect(result.diagnostics.some((d) => d.code === 'TS8018')).toBe(true);
  expect(result.wgsl).toBeUndefined();
});
