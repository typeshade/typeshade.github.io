---
id: before-after
source: 1f764168e71bb00a594c586293d9e5bcb7fc81378c8a2ae39cb721d56ee791d3
sourceLine: 781
---
**출력 구조체 선언과 필드 접근**

```ts
// BEFORE — hand-synced struct string + manual field access + imperative build
const VsOut: StructDecl = { name: 'VsOut', fields: [ … ] }
const uv = node.field('uv', vec2fT)
const out = b.var('out', structT('VsOut'))
b.assign(out.field('uv', vec2fT), someUv)
b.ret(out)

// AFTER — one declaration; typed read; one-expression build
const VsOut = ioStruct('VsOut', { pos: builtin('position', vec4fT), uv: location(0, vec2fT), … })
const uv = VsOut.of(node).uv
return VsOut.construct({ pos, uv: someUv, … })
```

**다른 함수 호출**

```ts
// BEFORE — string name + explicit return type, no name checking
const ecef = callFn('lonlat_to_ecef', vec3fT, lonRad, latRad, f32(0))

// AFTER — import the handle, call directly (object form checks names/types)
const ecef = lonlatToEcef(lonRad, latRad, f32(0))
```

**바인딩된 배열 요소**

```ts
// BEFORE — arrayT element + manual element type + per-field accessor
const seg = segments.at(i, structT('ShapeSegment'))
const p0 = seg.field('p0', vec2fT)

// AFTER — element handle; typed field proxy
const segmentsB = storageBuffer('segments', ShapeSegment, { group: 0, binding: 9, access: 'read' })
const p0 = segmentsB.at(i).p0
```

**가변 누산기**

```ts
// BEFORE — explicit Var with name + type, free assign function
const min_dist = b.var('min_dist', f32T, f32(1e10))
b.assign(min_dist, min(min_dist, d))

// AFTER — plain const (auto-materialises as var), method assign
const min_dist = f32(1e10)
min_dist.assign(min(min_dist, d))
```

**리터럴과 도-라디안 변환**

```ts
// BEFORE — f32()/u32() wrappers, multiply by a rounded constant
mode.eq(u32(2))
x.add(f32(1))
vec4(pos, f32(0), f32(1))
const lonRad = lon.mul(DEG2RAD)

// AFTER — contextual literal lift + radians()
mode.eq(2)
x.add(1)
vec4(pos, 0, 1)
const lonRad = radians(lon)
```

**값 디스패치**

```ts
// BEFORE — named, typed, tuple-array switch / equality condExpr
const v = condExpr(
  f32T,
  'v',
  [
    [mode.eq(0), e0],
    [mode.eq(1), e1],
  ],
  elseVal,
)

// AFTER — familiar Switch with Var + assign, OR condExpr taking only values
const v = Var(elseVal)
Switch(mode)
  .case(0, () => v.assign(e0))
  .case(1, () => v.assign(e1))
  .default(() => {})
// or, for condition/range dispatch:
const clip = condExpr(
  [
    [c0, () => e0],
    [c1, () => e1],
  ],
  () => elseVal,
)
```
