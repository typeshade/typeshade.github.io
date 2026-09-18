---
id: functions-and-entry-points
source: d8b2da39eac02885b042eb94778cb0fa6827f46073a02be56d7e2a883807255f
sourceLine: 534
---

이 페이지를 읽고 나면 헬퍼 함수를 선언하고, 그 헬퍼를 다른 함수에서 호출하고, 버텍스·프래그먼트·컴퓨트 스테이지의 진입점을 작성하고, 이 함수들을 담는 모듈을 조립할 수 있습니다.

### 함수 선언하기

셰이더 안의 모든 함수는 `fn`으로 작성합니다. 일반 헬퍼 함수도, 파이프라인이 실행하는 진입점도 마찬가지입니다. `fn`은 이름(생략 가능), 파라미터 이름을 키로 하는 레코드, 본문을 차례로 받습니다. 본문의 첫 번째 인자로는 타입이 붙은 파라미터 노드가 들어오므로, 이 인자를 구조 분해하면 파라미터마다 노드를 하나씩 꺼낼 수 있습니다.

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

`fn`은 핸들(handle)을 돌려줍니다. 직접 부를 수 있는 함수이면서 함수 선언이기도 한 객체 하나입니다. 호출할 때도 이 핸들을 그대로 부르고, 모듈에 나열할 때도 이 핸들을 그대로 넣습니다.

파라미터 이름으로 `in`, `sample`, `filter`, `texture`처럼 GLSL 예약어를 써도 됩니다. IR에는 그 이름이 그대로 남고, GLSL 백엔드가 생성 시점에 다른 이름으로 바꿉니다. 다만 JavaScript 구조 분해로는 예약어를 변수로 받을 수 없으므로 `({ in: inp }) => …`처럼 씁니다.

### 반환 타입

반환 타입을 생략하면 본문이 돌려주는 값에서 추론합니다. 본문 안의 TypeScript `return`도 이 타입으로 검사하므로, 타입이 다른 값을 돌려주면 컴파일 오류가 납니다. 아무 값도 돌려주지 않는 본문 역시 추론되며, 이 경우 `void`가 됩니다.

타입 토큰을 직접 넘겨야 하는 경우는 이제 한 가지만 남았습니다. 반환값이 중첩 클로저 안의 `Return(value)` 호출로 빠져나가는 본문입니다. TypeScript는 이런 본문을 실제로 아무 값도 돌려주지 않는 본문과 똑같이 반환 없음으로 읽습니다. 두 경우는 본문이 실제로 실행되고 나서야 비로소 구분되므로, 이때 토큰을 생략하면 어떤 토큰을 써야 하는지 알려주는 `SD0113` 오류로 거부됩니다.

```ts
// Inferred: dot() yields f32, so luma returns f32.
const luma = fn('luma', { c: vec3fT }, ({ c }) => dot(c, vec3(0.2126, 0.7152, 0.0722)))

// Inferred too: this one writes into a storage buffer and returns no value, so it is void.
const store = fn('store', { i: u32T, v: f32T }, ({ i, v }) => {
  outputB.at(i).assign(v)
})

// Pinned: the value leaves through the ambient Return(), which tsc cannot see.
const firstHit = fn(
  'first_hit',
  { d: f32T },
  f32T,
  ({ d }) => {
    If(d.lt(0), () => {
      Return(f32(0))
    })
    Return(d)
  },
  { allowEarlyReturn: true },
)
```

### 함수 호출하기

핸들을 호출할 때는 파라미터 이름을 키로 하는 객체 하나를 넘깁니다. 이렇게 호출하면 인자 이름과 타입, 빠진 인자가 없는지까지 검사하고, 자동 완성도 됩니다. 위치 인자로 호출할 수도 있지만, 이때는 TypeScript가 인자 개수, 타입, 순서를 검사하지 않으므로 같은 타입의 인자 두 개를 바꿔 넣어도 그대로 컴파일됩니다.

`externFn`은 호출만 할 수 있도록 만든 대응 함수입니다. 본문이 생성 시점에 다른 곳에서 링크되어 들어오는 함수의 시그니처만 선언하므로, 타입을 검사하는 호출은 지금 바로 쓸 수 있지만 모듈에 나열할 선언은 생기지 않습니다. 호출 지점에서 그 함수를 import할 수 있다면 언제나 실제 `fn` 핸들을 씁니다.

```ts
const d = dist_to_segment({ p: uv, a: p0, b: p1 })
const same = dist_to_segment(uv, p0, p1) // the unchecked form

const toneMap = externFn('host_tone_map', { c: vec4fT }, vec4fT)
const mapped = toneMap({ c: colour })
```

### 진입점

진입점은 옵션에 `stage`를 지정한 `fn`입니다. `stage`는 `'vertex'`, `'fragment'`, `'compute'` 중 하나입니다. 컴퓨트 진입점은 `workgroupSize`도 받습니다. 기본값은 64이며, `@compute @workgroup_size(N)`으로 생성됩니다.

```ts
const WINDOW = u32(8)
const params = resource('params', vec4uT, { group: 0, binding: 2 })

const reduceKernel = fn(
  'reduce_windows',
  { gid: builtin('global_invocation_id') },
  ({ gid }) => {
    const idx = gid.x
    If(idx.ge(params.node.x), () => {
      Return()
    })
    const base = idx.mul(WINDOW)
    // …fold WINDOW input elements into one output element…
  },
  { stage: 'compute', workgroupSize: 64, allowEarlyReturn: true },
)
```

이 가드 절(guard clause)은 함수의 마지막 문장에 이르기 전에 함수를 빠져나가므로, 옵션에 `allowEarlyReturn: true`도 함께 넣어야 합니다. 조기 반환과 이 옵션은 [제어 흐름](/guide/authoring/control-flow/)에서 다룹니다.

아무 값도 돌려주지 않는 본문에는 반환 타입 토큰이 필요 없습니다. 컴퓨트 진입점이 예전에 써넣던 `voidT`도 이제 추론됩니다.

### 스테이지 파라미터

스테이지는 속성이 붙은 파라미터로 입력을 전달받습니다. `builtin(name)`은 `'vertex_index'`, `'position'`, `'global_invocation_id'`처럼 하드웨어가 공급하는 값을 선언하며, 타입은 id로부터 읽어옵니다. WGSL은 `clip_distances`를 뺀 모든 id의 타입을 고정해 두었고, 이 id만은 `array<f32, N>`의 길이를 직접 정해서 넘깁니다. `location(n, type)`은 스테이지 사이에서 데이터를 나르는, 번호가 매겨진 슬롯을 선언합니다. IO 구조체의 필드도 이 두 헬퍼로 똑같이 적으며, `ioStruct`로 한 번 선언해 두면 두 스테이지가 그 구조체를 함께 씁니다. 필드 맵, 보간 모드, 핸들에 딸린 접근자는 [레이아웃과 리소스](/guide/authoring/layouts-and-resources/)에서 설명합니다.

```ts
const VsOut = ioStruct('VsOut', {
  pos: builtin('position'),
  uv: location(0, vec2fT),
})

const vsFull = fn(
  'vs_full',
  { idx: builtin('vertex_index') },
  (p) => {
    const pos = vec2(-1, -1)
    If(p.idx.eq(1), () => {
      pos.assign(vec2(3, -1))
    }).elif(p.idx.eq(2), () => {
      pos.assign(vec2(-1, 3))
    })
    return VsOut.construct({
      pos: vec4(pos, 0, 1),
      uv: vec2(pos.x.add(1).mul(0.5), pos.y.add(1).mul(0.5)),
    })
  },
  { stage: 'vertex' },
)

// U is a uniform block declared alongside these functions.
const fsGradient = fn(
  'fs_gradient',
  { vo: VsOut },
  (p) => {
    const t = p.vo.uv.y.add(U.field.mix_bias)
    const rgb = mix(U.field.bottom.rgb, U.field.top.rgb, t)
    return vec4(rgb, 1)
  },
  { stage: 'fragment' },
)
```

프래그먼트 함수가 구조체가 아닌 값 하나만 돌려주면, 따로 적지 않아도 첫 번째 색상 어태치먼트인 `@location(0)`이 붙습니다. 다른 곳으로 보내려면 `retAttr`을 넘기면 되고, 이런 기본값이 없는 버텍스 스테이지에서는 `retAttr`을 반드시 씁니다. 구조체를 돌려주는 스테이지 함수라면 속성은 이미 구조체 필드에 붙어 있습니다.

### 모듈 조립하기

`module`은 함께 생성할 선언을 모으며, 필드는 모두 생략할 수 있습니다. `consts`, `structs`, `bindings`, `funcs`에는 선언을 그대로 넣고, `uses`에는 선언을 스스로 지닌 핸들을 넣습니다. [레이아웃과 리소스](/guide/authoring/layouts-and-resources/)의 예제가 이 방식을 씁니다. 모듈은 [조건부 프로그램](/guide/authoring/conditional-programs/)의 `overrides`와 [기능과 확장](/guide/authoring/capabilities-extensions/)의 `enables`도 담습니다.

```ts
const gradientModule = module({
  structs: [U.struct, VsOut.decl],
  bindings: [U.binding],
  funcs: [vsFull, fsGradient],
})
```

`funcs` 배열의 순서가 곧 생성 순서입니다. 불리는 함수를 부르는 함수보다 앞에 두어야 합니다. GLSL ES 3.00은 함수를 쓰기 전에 선언해 두기를 요구하고, 순서를 고정해 두면 실행할 때마다 같은 바이트가 생성되기 때문입니다. 핸들 호출로만 닿고 목록에는 없는 함수는 컴파일러가 알아서 모아 그 함수를 부르는 함수 앞에 넣어 주므로, 진입점만 적은 목록도 올바른 순서로 생성됩니다.

리소스는 함수처럼 저절로 모이지 않습니다. 모듈은 오직 건네받은 선언만 조립하므로, 어떤 함수가 읽는 `uniformStruct`나 `storageBuffer`를 `uses`에 나열하지 않으면 `var` 선언 자체가 전혀 생성되지 않습니다. 이 실수를 맨 처음 알려주는 것은 파이프라인을 생성하는 시점의 드라이버입니다. `uses-declared` 린트 규칙이 바로 이 문제를 미리 잡아냅니다. `diagnose(m)`나 `lintModule(m)`을 실행하면 본문이 읽지만 아무것도 선언하지 않은 변수를 모두 찾아내고, 어떤 핸들을 추가해야 하는지 알려줍니다.

### 모듈 안 함수 이름 짓기

이름이 없는 `fn`에는 플레이스홀더 이름이 붙습니다. 함수 이름을 한자리에서 정하려면 `funcs`를 레코드로 넘깁니다. 각 키가 생성된 코드에서 그 함수의 이름이 되고, 키 순서가 곧 생성 순서입니다.

```ts
module({ funcs: { dist_to_segment, vs_full: vsFull, fs_gradient: fsGradient } })
```

레코드 키의 순서는 실행할 때마다 같으므로, 바이트 단위로 비교하는 스냅숏이나 문자열 이름으로 함수를 찾는 코드에도 이 방식을 안심하고 쓸 수 있습니다. 함수 목록이 여러 소스에 흩어져 있거나 데이터로 후처리해야 할 때는 배열 방식을 그대로 둡니다. 한 가지 주의할 점이 있습니다. 레코드 키는 공유되는 선언 자체의 이름을 바꿉니다. 그래서 이미 다른 모듈에 다른 이름으로 조립된 함수에 새 키를 붙이면, 그 모듈의 생성 결과를 조용히 망가뜨리는 대신 오류를 던집니다.
