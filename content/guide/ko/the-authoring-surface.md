---
id: the-authoring-surface
source: 4c2f53871993b7feb9b4733750199680d356d27be856bad12d98510a79b9d928
sourceLine: 33
---

### `fn`: 모든 함수(모든 진입점 포함)

`fn`은 일반 헬퍼 함수부터 `@vertex` / `@fragment` / `@compute` 진입점까지 모든 함수를 작성합니다.
`entryFn`이나 `computeFn`처럼 따로 마련된 함수는 없습니다.

전체 시그니처는 [`fn`](./src/core/ir/builder.ts)에 있습니다.

- **`name`**: 생략할 수 있습니다. 생략하면 `_fn{n}` 형태의 이름이 자동으로 붙습니다. 문자열로
  참조하는 fn(`externFn`, 플레이스홀더 교체용 조회 등)이거나 바이트 단위로 비교하는
  스냅숏에 쓰이는 fn이라면 명시적인 이름을 유지해야 합니다.
- **`params`**: `{ paramName: ShaderType }` 형태의 레코드입니다. 진입점은 같은 레코드 안에
  `builtin(...)` / `location(...)` 스펙을 함께 적습니다.
- **`ret`**: 생략할 수 있습니다. **생략하면 본문이 돌려주는 값에서 반환 타입을 추론합니다.**
  반환 타입을 고정하고 싶을 때만 명시적인 `ShaderType`을 전달합니다.
- **`body`**: `(p, b?) => Node | void` 형태입니다. 본문은 타입이 정해진 **파라미터 Node를
  첫 번째 인자로** 받고(`p.lon`, `p.uv` 등), 두 번째 인자로 선택적인 `Builder` `b`를
  받습니다. 이 두 번째 인자는 거의 필요하지 않습니다. 대부분의 본문은 `If` / `Let` / `Var` /
  `Return`이 이루는 앰비언트 인터페이스만으로 충분합니다.
- **`opts`**: `{ stage, workgroupSize?, retAttr?, allowEarlyReturn?, lintDisable? }`입니다.

본문이 네이티브 `return value`로 돌려주는 값은 반환 타입에 맞춰 타입 검사를 거치므로, 타입이
맞지 않는 반환은 컴파일 오류가 됩니다.

```ts
// Helper: return type inferred as f32 from `return select(...)`.
export const dist_to_segment = fn(
  'dist_to_segment',
  { p: vec2fT, a: vec2fT, b: vec2fT },
  ({ p, a, b }) => {
    const ab = b.sub(a)
    const len2 = dot(ab, ab)
    const t = clamp(dot(p.sub(a), ab).div(max(len2, 1e-10)), 0, 1)
    const segDist = length(p.sub(a).sub(ab.mul(t)))
    return select(len2.lt(1e-10), length(p.sub(a)), segDist)
  },
)
```

`fn()`으로 작성한 함수는 **`FnHandle`**입니다. 호출 가능한 값이면서 동시에 함수 선언이기도
합니다. `dist_to_segment(uv, p0, p1)`처럼 직접 호출하고, 모듈의 `funcs:` 배열에 나열합니다.
`callFn('dist_to_segment', …)` 같은 별도 호출 방식은 없습니다.

#### 진입점: `opts.stage`와 `builtin()` / `location()` 파라미터

진입점은 `opts.stage`를 붙인 `fn`일 뿐입니다. 스테이지 속성이 붙은 파라미터(`@builtin(...)`,
`@location(...)`)는 IO 구조체가 쓰는 것과 같은 `builtin()` / `location()` 헬퍼를 써서 같은
파라미터 레코드 안에 넣습니다.

```ts
const vs = fn('vs_tile', { vid: builtin('vertex_index', u32T) }, (p) => {
  // …compute clip position…
  return VsOut.construct({ pos: …, uv: …, vis: f32(1), view_w: clip.w })
}, { stage: 'vertex' })

const cs = fn('cs_match', { gid: builtin('global_invocation_id', vec3uT) }, (p) => {
  // …
}, { stage: 'compute', workgroupSize: 64 })
```

- `stage: 'compute'`는 `@compute @workgroup_size(N)`을 생성합니다(`workgroupSize`의
  기본값은 64입니다).
- `retAttr`은 구조체가 아닌 맨몸 스테이지 반환에 속성을 붙입니다. 예를 들면
  `-> @location(0) vec4<f32>`처럼 됩니다. 구조체 반환은 속성을 구조체 자체에 담아 둡니다.

> **예약어 파라미터(#763 H7).** 파라미터 이름을 `in`처럼 GLSL/WGSL 예약어로 지을 수
> 있습니다. IR은 이 이름을 그대로 지니고 있고, GLSL 백엔드가 생성 시점에 이름을 바꿔
> 줍니다. 다만 JS 구조 분해는 이 이름을 그대로 바인딩하지 못하므로, `({ in: inp }) => …`처럼
> 씁니다.

### `module`: WGSL 모듈 조립

```ts
module({ consts, structs, bindings, funcs })
```

각 필드는 배열이며, 생략한 필드는 `[]`로 기본값이 정해집니다. `funcs:`의 순서는 생성 순서를
따릅니다. **호출되는 함수를 호출하는 함수보다 앞에 둡니다.** 최종 규격의 WGSL은 모듈 스코프
선언을 순서와 무관하게 해석하고 프로토타입 구문 자체가 없어서, WGSL만 놓고 보면 이 순서를
요구하지 않습니다. 그런데도 순서를 지키는 이유는 두 가지입니다. (a) GLSL ES 3.00은 사용 전
선언을 요구합니다. GLSL 백엔드는 안전장치로 전방 프로토타입을 생성해 두지만, 의존 순서를
지키면 프로토타입 없이도 계속 동작합니다. (b) 안정된 순서는 스냅숏과 골든 파일의 바이트를
결정적으로 유지해 줍니다.

```ts
export const buildRasterModule = (pickEnabled: boolean): ModuleDecl =>
  module({
    consts: [...PROJECTION_CONSTS, ...ECEF_CONSTS],
    structs: [U.struct, Tile.struct, VsOut.decl, rasterFragmentOutput(pickEnabled).decl],
    bindings: [U.binding, tex.binding, texSampler.binding, Tile.binding],
    funcs: [
      ...getGpuProjectionFuncs(),
      ...ECEF_FUNCS,
      ...RASTER_COLOR_FUNCS,
      apply_log_depth,
      compute_log_frag_depth,
      vs,
      buildFs(pickEnabled),
    ],
  })
```

#### 레코드로 쓰는 `funcs:`: 이름을 한 번만 붙이기(#740 R1)

`funcs:`는 레코드도 받습니다. 각 키는 fn의 생성 이름이 됩니다. 핸들이 원래 지니고 있던 이름이
무엇이든 이 키로 바뀌며, 이름 없는 `fn(params, body)` 핸들도 예외가 아닙니다. 키 순서가 곧
생성 순서입니다(JS는 문자열 키의 삽입 순서를 보존합니다).

```ts
module({ funcs: { proj_mercator, wrap_lon_delta, vs_main } })
```

레코드 키는 **결정적인 이름**입니다. 익명 핸들 뒤에서 충돌을 세는 `fnAutoId` 카운터는 이
형태를 거칠 때 생성된 WGSL까지 도달하지 않으므로(#763 H9), 스냅숏으로 고정하는 셰이더나
문자열로 참조하는 셰이더에도 안전하게 씁니다. 선언 목록을 여러 소스에 나눠 두거나 데이터로
후처리할 때(`allowEarlyReturn` 맵을 일괄 적용하는 경우 등)는 배열 형태를 유지합니다.

---

### `composeModule`: 플레이스홀더로 변형 합성하기

베이스 모듈에 변형이 갈라지는 지점이 있다면, `b.placeholder('tag')`로 그 지점을 표시해 두고
변형마다 `composeModule`로 채웁니다. 복제와 치환을 손으로 훑는 방식은 필요 없습니다.

```ts
const base = module({ funcs: [/* … fs_fill ends with */ (_p, b) => b.placeholder('fill-return')] })
const composed = composeModule(base, { 'fill-return': variantFillReturnStmts })
```

`composeModule`은 `if` / `for` / `switch` 본문 안까지 내려가며, 기본값이 **엄격 모드**입니다.
치환하지 않은 플레이스홀더가 남거나 어떤 플레이스홀더와도 맞지 않는 치환 키가 있으면 오류를
던집니다(GPU에서는 조용히 지나가고 CPU에서만 던지던 함정이, 합성 시점의 요란한 오류로 바뀐
셈입니다). 맨몸 플레이스홀더를 일부러 남기려면 `{ allowUnswapped: true }`를 전달합니다.

### `rawStmt`: 타깃별로 짝을 이루는, 그대로 내보내는 탈출구(#1671)

다른 생성기가 미리 만든 문자열이나 IR이 모델링하지 못하는 구성처럼 손으로 직접 써야 하는
문장이 있다면 `rawStmt`로 끼워 넣습니다. `rawStmt`는 타깃마다 페이로드를 하나씩 담습니다.
같은 문장을 백엔드마다 다르게 표기해 두는 방식입니다.

```ts
// the FACTORY form — when you assemble a `Stmt[]` body array by hand
const PAIRED = rawStmt({
  wgsl: 'return vec4<f32>(1.0, 0.0, 0.0, 1.0);',
  glsl: 'return vec4(1.0, 0.0, 0.0, 1.0);',
})
const fs: FuncDecl = {
  name: 'fs_main',
  attrs: ['@fragment'],
  stage: 'fragment',
  params: [],
  ret: vec4fT,
  retAttr: '@location(0)',
  body: [PAIRED],
}
```

플루언트한 `fn()` 본문 안에서는 대신 **`b.raw(payload)`**를 씁니다. 그 자리에서
`rawStmt(...)`를 `b.raw()` 없이 그냥 호출하면 반환된 `Stmt`가 어디에도 밀어 넣어지지 않아
조용히 버려지며, 아무것도 생성되지 않습니다.

담긴 뜻은 고정되어 있습니다("이 바이트를 여기에 끼워 넣어라"). 타깃마다 달라지는 것은
표기뿐이며, 내장 함수 레지스트리가 쓰는 것과 같은 타깃별 표기 패턴을 따릅니다(`INTRINSICS`의
`Spelling` 레코드). `Spelling`은 양쪽 표기를 모두 요구하지만, 여기서는 한쪽을 생략할 수
있습니다(아래 참고). 다만 타입 수준에서는 **적어도 하나가 있어야 하므로** `rawStmt({})`는
컴파일되지 않습니다. 각 백엔드는 자기 쪽 표기를 그대로 감싸는 본문의 들여쓰기에 맞춰
내보냅니다.

**대칭적으로, 안전하게 차단하며 실패합니다.** 자기 타깃에 대한 페이로드가 없는 raw를 받은
백엔드는 `UnsupportedFeatureError`(SD0030)를 던집니다. wgsl 쪽만 있는 raw는 GLSL 빌드에서
반드시 오류가 나고, glsl 쪽만 있는 raw는 WGSL 빌드에서 반드시 오류가 납니다. 한쪽 표기를
생략하는 것은 "이 모듈은 그 타깃으로는 빌드하지 않는다"는 명시적인 결정입니다. 그러므로
모듈이 빌드해야 하는 모든 타깃의 표기를 갖춰 두어야 합니다. 오류 메시지는 빠진 쪽의 이름을
밝히고, 실제로 준 쪽을 그대로 인용해 줍니다.

**들여쓰기가 붙는 줄은 첫 줄뿐입니다.** 생성기는 페이로드 전체 앞에 본문 들여쓰기를 붙이므로,
여러 줄짜리 페이로드의 2번째 줄부터는 0번째 칸에 놓입니다. 출력 모양이 중요하다면 이어지는
줄의 들여쓰기는 직접 넣어야 합니다.

**raw 텍스트 안의 식별자가 계속 유효하도록 지키는 일은 작성자의 몫입니다.** DSL은 raw
페이로드 내부까지 읽지 않으므로 그 안의 어떤 것도 다시 쓰지 않습니다. `mangle()` /
`obfuscate()`는 자신이 볼 수 있는 것만 이름을 바꾸는데, 텍스트로 적힌 참조는 이들이 볼 수
없는 대상입니다(이런 이유로 raw를 하나라도 담은 모듈에서는 mangle이 모듈 전체에 걸쳐 아무
일도 하지 않게 됩니다. §8을 참고하십시오). 구체적으로 위험한 쪽은 GLSL입니다. GLSL 백엔드는
GLSL 예약어와 겹치는 파라미터와 지역 변수의 이름을 실제로 바꿉니다(`glsl-sanitize.ts`, 대상은
`in`, `sample`, `filter`, `texture` 등입니다). 그래서 예전 식별자 이름을 그대로 적은 raw
`glsl` 텍스트는 더는 존재하지 않는 변수를 가리키게 됩니다. WGSL 쪽에는 이런 이름 변경기가
없어서, 작성자가 raw 텍스트를 유효하게 지켜야 한다는 계약은 양쪽에서 같아도 위험은 한쪽으로
쏠립니다.

**모듈 어디에든 raw가 있으면 GLSL 스테이지 스코핑이 꺼집니다.** raw 텍스트는 IR의 참조
추적에게는 불투명한 대상이라서, GLSL 백엔드의 스테이지별 도달 가능성 필터(`glsl.ts`의
`stageScope`)는 모듈 전체에 대해 `null`로 물러섭니다. 헬퍼 쪽에서는 이렇게 됩니다. 모든 헬퍼
fn이 **모든** 스테이지에 생성됩니다. 진입점이 한 번도 부르지 않는 헬퍼조차 라이터까지
도달하므로, 그 헬퍼 안에 wgsl 전용 raw가 하나만 있어도 GLSL 생성 전체가 실패합니다. 진입점
쪽에서는 다르게 동작합니다. 다른 스테이지의 진입점은 본문 추적 이전에 걸러지므로, 적용은
스테이지 단위로 이루어집니다. 한쪽만 있는 raw는 그 raw를 포함한 fn 집합을 생성하는
스테이지에서만 빌드가 실패하며, 실패 범위는 대상 전체가 아니라 언제나 스테이지 단위입니다.
양쪽 타깃으로 빌드해야 하는 모듈이라면, 도달 가능성과 상관없이 모듈 안의 모든
raw에 양쪽 표기를 짝지어 두어야 합니다.

⚠ 스코핑이 꺼져 있는 탓에, raw를 담은 모듈에서는 어떤 헬퍼에 있든 프래그먼트 전용 기능이
버텍스 스테이지에도 생성되어, 그 자리에서 컴파일이 깨집니다. 내장 함수를 거치는 `dpdx` /
`dpdy` / `fwidth`, 그리고 `discard`를 예로 들 수 있습니다. 이런 모듈은 헬퍼를 깨끗하게
유지하거나, raw를 별도 모듈로 분리해 두어야 합니다.

(모듈 전체를 대상으로 하는 죽은 함수 제거도 불리지 않는 헬퍼를 구해 주지는 못합니다. 다만
이유는 다릅니다. `deadFnElim`(`passes/opt/dce-fns.ts`)은 준비는 되어 있지만 배선되지 않은
패스로, `DEFAULT_PASSES`에서 일부러 빠져 있습니다. 그래서 트리 셰이킹은 애초에 실행되지
않습니다. 이 패스를 배선한 호출자에게도, raw가 하나라도 있으면 이 패스는 물러섭니다.)

CPU 오라클은 raw 텍스트에 대한 평가를 전혀 갖고 있지 않아 어떤 타깃에서도 오류를 던집니다.
raw는 GPU 전용입니다.
