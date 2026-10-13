---
id: functions-and-entry-points
source: 0eb77fdf24b40f5f916813b6d8737070d04275acd5c0dbf1655c77f2ab2ce973
sourceLine: 514
rules: 2.1 9eWN6RxoCWF7PMo_T1USzBA1CAyjigmKnoVwzLkeJ4Q=, 3.2 9-wLkxopPgqhKoXl0afzqsDa3zUi6T6yoxXjhOBg0qc=, 3.4 qTsvqHCf4ZNlv5OA0ks54fZEJ2-O_jR3l_uT-MjDSqw=, 9.5 0ahOuIeiTVBHHjA-1IXXW_l9GsFrF8XtZveADRO2qNw=, 12.3 8O2dxHWoC8EyiSghUPlEO7j2e1gLt7se9PGHEkU-8fw=, 12.6 kuInDVEKCI_Qu_9zVLzT--W8UeBj0WgdX22sRWA_VNY=
---

이 페이지를 마치면 헬퍼를 선언해 다른 함수에서 부르고, 버텍스, 프래그먼트, 컴퓨트 스테이지의
진입점을 쓰고, 이 함수들을 담는 모듈을 조립할 수 있습니다.

### 함수 선언하기

셰이더의 함수는 모두 `function` 선언으로 작성합니다. 평범한 헬퍼도, 파이프라인이 실행하는
진입점도 마찬가지입니다. 매개변수에는 타입을 붙이고, 본문은 평범한 TypeScript로 씁니다.

```ts
"use typeshade";

// Helper: the return type is f32, the type the body returns.
export function distToSegment(p: vec2, a: vec2, b: vec2): f32 {
  const ab = b - a;
  const len2 = dot(ab, ab);
  const t = clamp(dot(p - a, ab) / max(len2, 1e-10), 0., 1.);
  const segDist = length(p - a - ab * t);
  return len2 < 1e-10 ? length(p - a) : segDist;
}
```

매개변수 이름으로 `sample`, `filter`, `texture`처럼 GLSL이 예약한 이름을 써도 됩니다. IR은 그
이름을 그대로 두고, GLSL 백엔드가 생성할 때 이름을 바꿉니다. 지역 함수, 다른 함수 안에서 선언한
함수, 함수를 인자로 받는 함수도 TypeScript의 형태 그대로 쓸 수 있습니다
(`docs/use-typeshade-surface.md` §14).

### 반환 타입

반환 타입을 생략하면 TypeScript가 추론하는 대로 본문이 돌려주는 타입이 됩니다. 모든 `return`은
이 타입과 대조되므로, 타입이 틀린 반환은 컴파일 오류입니다. 아무것도 돌려주지 않는 본문의 타입은
`void`입니다.

```ts
"use typeshade";

declare const outputB: storage<array<f32>, "read_write">;

// Inferred: dot() yields f32, so luma returns f32.
export function luma(c: vec3) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

// Inferred too: this one writes into a storage buffer and returns no value, so it is void.
export function store(i: u32, v: f32) {
  outputB[i] = v;
}

// Written: a return from inside a branch is an ordinary return.
export function firstHit(d: f32): f32 {
  if (d < 0.) {
    return 0.;
  }
  return d;
}
```

### 함수 호출하기

호출은 TypeScript처럼 인자를 위치 순서대로 넘깁니다. 컴파일러는 인자의 개수와 타입을 선언과
대조합니다. 파일이 선언하거나 가져온 함수는 같은 이름의 내장 함수보다 우선합니다.

```ts
const d = distToSegment(uv, p0, p1);
```

매개변수의 기본값은 호출 지점에서 채워집니다. 함수는 다른 함수를 매개변수로 받을 수도 있으며,
호출할 때마다 그 자리의 스코프에 있는 함수 이름을 넘깁니다(`docs/use-typeshade-surface.md` §14).
WGSL에는 호출 스택이 없으므로 재귀는 거부됩니다.

### 진입점

진입점은 스테이지 데코레이터 `@vertex`, `@fragment`, `@compute` 가운데 하나를 붙인 최상위
`export function`입니다. 컴퓨트 진입점은 워크그룹 크기를 데코레이터에 `@compute([64])`나
`@compute([8, 8])`처럼 적습니다. 아무 인자 없는 `@compute`는 기본값 64를 씁니다.

```ts
"use typeshade";

const WINDOW: u32 = 8;

declare const params: uniform<vec4u>;
declare const input: storage<array<f32>>;
declare const output: storage<array<f32>, "read_write">;

@compute([64])
export function reduceWindows(@builtin("global_invocation_id") gid: vec3u): void {
  const idx = gid.x;
  if (idx >= params.x) {
    return;
  }
  const base = idx * WINDOW;
  let acc = 0.;
  for (let k: u32 = 0; k < WINDOW; k++) {
    acc += input[base + k];
  }
  output[idx] = acc;
}
```

가드는 평범한 `return`으로 마지막 문장 전에 함수를 빠져나갑니다. 조기 반환은
[제어 흐름](/guide/authoring/control-flow/)에서 다룹니다.

워크그룹 크기 자리에는 `override<u32>` 이름을 쓸 수도 있습니다. 이 이름은 워크그룹 임시 배열의
바깥 길이와 함께 씁니다. 평범한 TypeScript 코드가 입력 형태를 보고 특수화 값을 고른 뒤
`program.compute(entry, { constants })`로 넘기고, 디스패치 횟수를 계산하기 전에 확정된
`pipeline.workgroupShape`를 읽을 수 있습니다. 소스 형태와 제한, 호스트 호출은
[`docs/use-typeshade-surface.md` §3](docs/use-typeshade-surface.md#3-entries--function-decorators-and-explicit-builtins),
[`§15`](docs/use-typeshade-surface.md#15-textures-samplers-and-overrides),
[`§24`](docs/use-typeshade-surface.md#24-module-variables),
[`§69`](docs/use-typeshade-surface.md#69-running-a-compiled-program)를 보십시오.

### 스테이지 매개변수

스테이지는 속성을 붙인 매개변수로 입력을 받습니다. `@builtin("id")`는 하드웨어가 주는 값을
선언합니다. `"vertex_index"`, `"position"`, `"global_invocation_id"`가 그런 값입니다.
`@location(n)`은 스테이지 사이에서 데이터를 나르는 번호 붙은 슬롯을 선언합니다. 같은 두 속성이
IO 구조체의 필드도 설명하며, IO 구조체는 두 스테이지가 함께 쓰는 클래스입니다. 보간 모드는
[레이아웃과 리소스](/guide/authoring/layouts-and-resources/)에 있습니다.

```ts
"use typeshade";

class VsOut {
  @builtin("position") pos: vec4;
  @location(0) uv: vec2;
}

interface Gradient {
  top: vec4;
  bottom: vec4;
  mixBias: f32;
}

declare const u: uniform<Gradient>;

@vertex
export function vsFull(@builtin("vertex_index") idx: u32): VsOut {
  let pos = vec2(-1., -1.);
  if (idx == 1) {
    pos = vec2(3., -1.);
  } else if (idx == 2) {
    pos = vec2(-1., 3.);
  }
  return { pos: vec4(pos, 0., 1.), uv: vec2((pos.x + 1.) * 0.5, (pos.y + 1.) * 0.5) };
}

@fragment
export function fsGradient(vo: VsOut): vec4 {
  const t = vo.uv.y + u.mixBias;
  const rgb = mix(u.bottom.rgb, u.top.rgb, t);
  return vec4(rgb, 1.);
}
```

구조체 없이 값만 돌려주는 프래그먼트 진입점은 따로 적지 않아도 첫 번째 색상 어태치먼트인
`@location(0)`을 받습니다. 구조체 없이 `vec4`만 돌려주는 버텍스 진입점은 위치를 돌려줍니다.
구조체를 돌려주는 진입점은 구조체 필드에 속성을 붙입니다.

### 모듈 조립하기

파일 하나가 모듈 하나입니다. 파일의 함수, 구조체, 상수, 리소스가 함께 생성됩니다. WGSL에는
파일이 선언한 모든 함수가 파일에 선언된 순서대로 들어갑니다. WGSL에서는 뒤에 선언된 함수를
불러도 되기 때문입니다. GLSL 스테이지에는 그 스테이지의 진입점이 닿는 함수만 들어가며, GLSL ES
3.00의 요구대로 불리는 함수가 부르는 함수보다 앞에 놓입니다.

파일은 다른 TypeScript 모듈처럼 다른 셰이더 파일이 내보낸 것을 가져옵니다. 컴파일하는 파일과,
그 파일이 직접 또는 다른 파일을 거쳐 가져오는 셰이더 파일은 하나의 프로그램이며, 이 프로그램이
모듈 하나가 됩니다. 가져온 파일에서 여러분의 파일이 닿는 헬퍼, 구조체, 상수, 바인딩은 함께
들어옵니다. 가져온 파일의 진입점은 들어오지 않습니다.

```ts
// noise.shade.ts
"use typeshade";

export function hash(p: vec2): f32 {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// clouds.shade.ts
"use typeshade";

import { hash } from "./noise.shade.ts";

@fragment
export function fs(@location(0) uv: vec2): vec4 {
  return vec4(hash(uv), hash(uv * 2.), 0., 1.);
}
```

이런 프로그램을 컴파일하는 호스트 호출은
[다른 셰이더 모듈을 가져오는 셰이더 모듈](#a-shader-module-that-imports-another)에 있습니다.

### 모듈 안 함수의 이름

함수는 두 타깃 모두에서 선언한 이름 그대로 생성됩니다. 진입점은 언제나 이름을 유지합니다.
호스트가 그 이름으로 파이프라인을 만들기 때문입니다. `use`처럼 WGSL이 예약한 이름을 가진
함수는 `TS8068`로 거부되며, 이 진단은 해당 타깃을 알려 줍니다.

컴파일러가 헬퍼에 다른 이름을 붙이는 경우는 두 가지입니다. 첫째, 직접 만든 `fract`처럼 내장
함수와 이름이 같은 헬퍼는 `fract_`로 생성되고, 그 선언을 거치는 모든 호출도 함께 바뀝니다.
WGSL에서는 내장 함수가 가려지고, GLSL ES 3.00은 다시 선언하는 것을 거부하기 때문입니다. 둘째,
한 프로그램의 두 파일이 같은 이름의 비공개 헬퍼를 각각 선언하면 두 번째 헬퍼는 자기만의 이름으로
생성됩니다. CPU 오라클은 각 함수를 파일이 붙인 이름으로 부릅니다. 타깃마다 예약한 이름은
`docs/use-typeshade-surface.md` §62에 있습니다.
