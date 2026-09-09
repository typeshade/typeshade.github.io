---
id: functions-and-entry-points
source: 857f1e7aaccc0e32d3d337053893b34728addacdbc6781044f3ddab84a4ba94f
sourceLine: 488
---

이 페이지를 읽고 나면 헬퍼 함수를 선언하고, 다른 함수에서 그 함수를 호출하고, 버텍스·프래그먼트·컴퓨트 스테이지의 진입점을 작성하고, 이들을 담는 모듈을 조립할 수 있습니다.

### 함수 선언하기

`fn`은 셰이더 안의 모든 함수를 작성합니다. 일반 헬퍼 함수도, 파이프라인이 실행하는 진입점도 다르지 않습니다. `fn`은 선택적인 이름과 이름을 키로 하는 파라미터 레코드, 그리고 본문을 받습니다. 본문은 타입이 정해진 파라미터 노드를 첫 번째 인자로 받으므로, 이 인자를 구조 분해하면 파라미터마다 노드를 하나씩 얻습니다.

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

`fn`이 돌려주는 값은 핸들입니다. 호출 가능한 값이면서 동시에 함수 선언이기도 한 객체 하나입니다. 이 핸들을 직접 호출하고, 모듈에도 그대로 나열합니다.

파라미터 이름에는 `in`, `sample`, `filter`, `texture`처럼 GLSL이 예약해 둔 이름도 그대로 쓸 수 있습니다. IR은 이 이름을 그대로 지니고 있다가, GLSL 백엔드가 생성 시점에 이름을 바꿉니다. JavaScript 구조 분해는 이런 이름을 그대로 바인딩하지 못하므로, `({ in: inp }) => …`처럼 씁니다.

### 반환 타입

반환 타입을 생략하면 본문이 돌려주는 값에서 타입을 추론합니다. 본문의 네이티브 `return`은 이렇게 정해진 타입을 기준으로 검사하므로, 타입이 맞지 않는 반환은 컴파일 오류가 됩니다.

명시적인 타입 토큰을 넘겨야 하는 경우는 두 가지입니다. 첫 번째는 값이 중첩된 클로저 안의 앰비언트 `Return()`을 거쳐 빠져나가는 본문으로, 이 경로는 TypeScript가 보지 못합니다. 두 번째는 아무 값도 돌려주지 않는 함수로, 이때는 `voidT`를 넘깁니다.

```ts
// Inferred: dot() yields f32, so luma returns f32.
const luma = fn('luma', { c: vec3fT }, ({ c }) => dot(c, vec3(0.2126, 0.7152, 0.0722)))

// Pinned: this one writes into a storage buffer and returns no value.
const store = fn('store', { i: u32T, v: f32T }, voidT, ({ i, v }) => {
  outputB.at(i).assign(v)
})
```

### 함수 호출하기

핸들은 파라미터 이름을 키로 하는 객체 하나를 인자로 받습니다. 이 형태는 인자 이름과 타입, 그리고 빠진 인자가 없는지를 검사하고, 자동 완성도 지원합니다. 핸들은 위치 인자도 받는데, 이 형태에서는 TypeScript가 개수나 타입, 순서를 검사하지 않으므로, 같은 타입의 인자 두 개를 서로 바꿔 넣어도 그대로 컴파일됩니다.

`externFn`은 호출 전용 대응물입니다. 본문이 다른 곳에서 생성 시점에 링크되어 들어오는 함수의 시그니처만 선언하므로, 지금 당장 타입이 맞는 호출을 얻으면서도 모듈에 나열할 선언은 따로 없습니다. 호출 대상을 호출 지점에서 import할 수 있다면 언제나 실제 `fn` 핸들을 씁니다.

```ts
const d = dist_to_segment({ p: uv, a: p0, b: p1 })
const same = dist_to_segment(uv, p0, p1) // the unchecked form

const toneMap = externFn('host_tone_map', { c: vec4fT }, vec4fT)
const mapped = toneMap({ c: colour })
```

### 진입점

진입점은 옵션에 `stage`를 지정한 `fn`입니다. `stage`는 `'vertex'`, `'fragment'`, `'compute'` 중 하나입니다. 컴퓨트 진입점은 `workgroupSize`도 받으며, 기본값은 64이고 `@compute @workgroup_size(N)`을 생성합니다.

```ts
const WINDOW = u32(8)
const params = resource('params', vec4uT, { group: 0, binding: 2 })

const reduceKernel = fn(
  'reduce_windows',
  { gid: builtin('global_invocation_id', vec3uT) },
  voidT,
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

이 가드 절은 함수의 마지막 문 이전에 함수를 빠져나가므로, 옵션에는 `allowEarlyReturn: true`도 함께 넣습니다. 조기 반환과 이 옵션은 [제어 흐름](/guide/authoring/control-flow/)에서 다룹니다.

### 스테이지 파라미터

스테이지는 속성이 붙은 파라미터로 입력을 전달받습니다. `builtin(name, type)`은 `'vertex_index'`, `'position'`, `'global_invocation_id'`처럼 하드웨어가 공급하는 값을 선언합니다. `location(n, type)`은 스테이지 사이에서 데이터를 나르는 번호 붙은 슬롯을 선언합니다. 이 두 헬퍼는 IO 구조체의 필드도 똑같이 표현하며, `ioStruct`가 한 번 선언해 두면 두 스테이지가 그 구조체를 함께 씁니다. 필드 맵과 보간 모드, 핸들이 지니는 접근자는 [레이아웃과 리소스](/guide/authoring/layouts-and-resources/)에 있습니다.

```ts
const VsOut = ioStruct('VsOut', {
  pos: builtin('position', vec4fT),
  uv: location(0, vec2fT),
})

const vsFull = fn(
  'vs_full',
  { idx: builtin('vertex_index', u32T) },
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
    return vec4(rgb, f32(1))
  },
  { stage: 'fragment', retAttr: '@location(0)' },
)
```

구조체 없이 값 하나만 그대로 돌려주는 스테이지 함수는 위 `fs_gradient`처럼 `retAttr`로 속성을 붙입니다. 구조체를 돌려주는 스테이지 함수는 그 속성을 구조체 필드 쪽에 담아 둡니다.

### 모듈 조립하기

`module`은 함께 생성되는 선언을 모으며, 필드는 모두 선택 사항입니다. `consts`, `structs`, `bindings`, `funcs`는 선언을 그대로 받고, `uses`는 자신만의 선언을 지니는 핸들을 받습니다. 이 형태는 [레이아웃과 리소스](/guide/authoring/layouts-and-resources/)에서 씁니다. 모듈은 [조건부 프로그램](/guide/authoring/conditional-programs/)의 `overrides`와 [기능과 확장](/guide/authoring/capabilities-extensions/)의 `enables`도 담습니다.

```ts
const gradientModule = module({
  structs: [U.struct, VsOut.decl],
  bindings: [U.binding],
  funcs: [vsFull, fsGradient],
})
```

`funcs` 배열의 순서가 곧 생성 순서입니다. 호출되는 함수를 호출하는 함수보다 앞에 두어야 합니다. GLSL ES 3.00은 사용하기 전에 선언할 것을 요구하고, 순서를 고정해 두면 실행할 때마다 같은 바이트가 생성되기 때문입니다. 핸들 호출로만 닿고 목록에는 넣지 않은 함수는 자동으로 모아져 그 함수를 부르는 함수보다 앞에 놓이므로, 진입점만 적은 목록도 유효한 순서로 생성됩니다.

### 모듈 안 함수 이름 짓기

이름이 없는 `fn`에는 플레이스홀더 이름이 붙습니다. 함수 이름을 한 번에 지정하려면 `funcs`를 레코드로 넘깁니다. 각 키가 그 함수의 생성 이름이 되고, 키 순서가 곧 생성 순서입니다.

```ts
module({ funcs: { dist_to_segment, vs_full: vsFull, fs_gradient: fsGradient } })
```

레코드 키는 결정적이므로, 이 형태는 바이트 단위로 비교하는 스냅숏이나 문자열로 참조하는 함수에도 안전합니다. 선언 목록이 여러 소스에 나뉘어 있거나 데이터로 후처리될 때는 배열 형태를 유지합니다. 한 가지 주의할 점은, 레코드 키가 공유된 선언의 이름을 바꾼다는 것입니다. 이미 다른 이름으로 다른 모듈에 조립된 함수를 레코드 키로 다시 쓰면, 그 모듈의 생성 결과를 조용히 망가뜨리는 대신 오류를 던집니다.
