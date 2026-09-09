---
id: conditional-programs
source: 0081d2d47802b7f6baea58303d9701a3293288938e032ceb6ea5a4a1e9ad5395
sourceLine: 1554
---

이 페이지를 읽고 나면 하나의 소스에서 만들 수 있는 여러 프로그램 중 어느 것을 빌드할지
정할 수 있고, 어떤 변형이 상수 하나만 다른 경우인지 서로 다른 프로그램인지 가려낼 수
있으며, 그 선택을 define을 쥔 호스트에게 넘길 수 있고, 캐시가 한 변형을 다른 변형 대신
내주는 일이 없도록 결과에 이름을 붙일 수 있습니다.

기능에 따라, 표고 정보가 있는지 없는지에 따라, 3D인지 평면인지에 따라 셰이더가 달라져야
하는 지점에서 GLSL 코드베이스는 `#define`과 `#ifdef` ladder를 씁니다. 이 패키지에는
전처리기가 없습니다. 모듈은 평범한 함수가 반환하는 평범한 JavaScript 값이므로, 달라지는
부분은 함수 매개변수로 나타나고 평범한 `if`가 IR에 무엇을 넣을지 결정합니다. 선택되지 않은
분기는 애초에 만들어지지 않으므로 나중에 걸러낼 필요가 없고, 생성된 프로그램은 디스패치
체인 없이 선택된 분기의 연산만 담습니다.

"프로그램이 달라진다"는 말에는 질문 세 가지가 숨어 있고, 각 질문마다 답이 다릅니다.
프로그램의 형태 자체가 다른 경우, 값 하나만 다른 경우, 선택이 호스트에게 속하는 경우입니다.
디바이스가 가질 수도 있고 갖지 않을 수도 있는 기능은 네 번째 질문이며,
[기능과 확장](/guide/authoring/capabilities-extensions/)에서 다룹니다.

### 빌더 매개변수와 평범한 if

특수화란 선택을 하나로 고정해 프로그램 하나를 만드는 것이며, 그 선택은 모듈이 존재하기
전에 TypeScript에서 이미 내려져 있습니다. 빌더가 그 사실을 매개변수로 받아 분기하도록
작성합니다.

```ts
import { fn, module, f32, resource, samplerT, texture2dfT, textureSample, vec2fT } from '@xgis/shader-dsl'

const dem = resource('dem', texture2dfT, { group: 0, binding: 0 })
const demSampler = resource('dem_sampler', samplerT, { group: 0, binding: 1 })

const buildTerrain = (hasElevation: boolean) => {
  const height = fn('height', { uv: vec2fT }, ({ uv }) =>
    hasElevation ? textureSample(dem.node, demSampler.node, uv).x : f32(0),
  )
  return module({
    bindings: hasElevation ? [dem.binding, demSampler.binding] : [],
    funcs: [height],
  })
}
```

여기서는 바인딩도 형태를 따라 함께 바뀌며, 이것이 전처리기보다 이 방식을 선택하는
이유입니다. `hasElevation`이 false면 표고 텍스처를 아예 선언하지 않으므로 `reflect()`에도
나타나지 않고 바인드 그룹 레이아웃에도 나타나지 않으며, 호스트는 그 리소스를 만들지
않습니다. `#ifdef`를 쓰면 선언은 소스에 그대로 남고 레이아웃은 손으로 맞춰야 하는데,
비활성화한 기능이 바인딩 슬롯을 여전히 차지하는 것은 이 때문입니다.

드로우 시점까지는 정할 수 없는 선택도 있습니다. 이런 선택은 런타임 분기로 남겨 두며,
`when`을 쓰면 GPU가 평가하는 조건에 따라 값을 고를 수 있습니다. 특수화는 빌드하는 시점에
이미 알고 있는 선택을 위한 것입니다.

### composeModule로 채우는 문 슬롯

변형끼리 모듈 전체를 공유하면서 한 함수 안에서 이어지는 문 몇 줄만 다른 경우도 있습니다. 그
이음매는 기본 모듈에 `b.placeholder('tag')`로 표시해 두고, 변형마다 `composeModule`로
채웁니다. 플레이스홀더는 태그를 지닌 표시용 문이며, 교체는 그 자리를 대신하는 문의 목록을
뜻합니다.

```ts
import { composeModule, fn, module, vec4, vec4fT, type Stmt } from '@xgis/shader-dsl'

const base = module({
  funcs: [
    fn('fill_color', {}, vec4fT, (_p, b) => {
      b.placeholder('fill')
    }),
  ],
})

const solid: Stmt[] = [{ s: 'return', expr: vec4(1, 0, 0, 1).expr }]
const composed = composeModule(base, { fill: solid })
```

`composeModule`은 `if`, `for`, `switch` 본문 안까지 파고들어, 함수 본문만 새로 쓴 나머지
모듈을 그대로 옮긴 새 모듈을 돌려줍니다. 문 슬롯만 채울 뿐이므로 상수도, 구조체도,
바인딩도 새로 만들지 않으며, `#include`를 대신하지도 못합니다. 채우지 않은 슬롯을 남겼을
때, 그리고 어떤 플레이스홀더와도 맞지 않는 교체 키를 넣었을 때 어떻게 동작하는지는 참고
페이지에 있습니다.

### override로 다른 값 하나

모든 변형이 상수 하나만 바뀐 채 같은 프로그램을 생성한다면, 특수화는 파이프라인 수만
쓸데없이 늘립니다. 이럴 때는 `overrideConst`로 특수화 상수를 선언합니다. 특수화 상수는
모듈 스코프의 값으로, 모든 DSL 패스를 거치는 동안 읽기 자체가 기호로 남아 있다가 호스트가
파이프라인을 만들 때 값이 고정됩니다.

```ts
import { f32, f32T, If, Var, fn, module, overrideConst } from '@xgis/shader-dsl'

const quality = overrideConst('quality', f32T, 1.0)

const shade = fn('shade', { base: f32T }, ({ base }) => {
  const acc = Var(base)
  If(quality.node.gt(f32(1)), () => {
    acc.assign(acc.mul(f32(2)).add(f32(0.5)))
  })
  return acc
})

const m = module({ overrides: [quality.decl], funcs: [shade] })
```

WGSL은 `override quality: f32 = 1.0;`을 생성하고, 호스트는 파이프라인의 `constants`로 그
값을 고정합니다. GLSL ES 3.00에는 드라이버 쪽에 대응하는 기능이 없으므로 백엔드는 모듈이
그 자체로 컴파일되도록 기본값을 생성하고, 다른 값을 쓰고 싶은 호스트는
`emitGlslModule(m, 'fragment', { overrideValues: { quality: 2 } })`로 다시 생성합니다. 두
호스트 형태 모두 채워 넣을 상수 집합을 `reflect().overrides`에서 읽습니다.

읽기 자체가 옵티마이저에게 불투명하게 남아 있으므로 위의 분기는 모든 패스를 그대로
통과하고, 드라이버가 파이프라인 변형마다 그 분기를 제거합니다. 이것이 고전적인 우버셰이더
기법입니다. 경험칙은 이렇습니다. 두 변형이 리터럴 하나만 바뀐 채 같은 명령어 시퀀스로
컴파일된다면 오버라이드이고, 서로 다른 코드로 컴파일된다면 빌드 시점 매개변수입니다.

### 호스트가 결정하는 축

축이란 프로그램이 그것에 따라 달라지는 요소 하나와, 그 요소가 가질 수 있는 값의 목록을
함께 가리킵니다. 축 공간의 한 점이 곧 변형 하나입니다. 소유하지 않은 상태를
근거로 호스트가 런타임에 그 점을 고르는 경우에는 행렬 자체가 작성 대상이 됩니다.
`variantFamily`는 축, 점 하나를 만드는 빌더, 키를 정하는 함수를 받아 모든 점을 빌드합니다.

```ts
import { fn, f32T, module, variantFamily } from '@xgis/shader-dsl'

const family = variantFamily({
  axes: { quality: ['low', 'high'] },
  build: ({ quality }) =>
    module({
      funcs: [fn('shade', { x: f32T }, ({ x }) => (quality === 'high' ? x.mul(2).add(0.5) : x))],
    }),
  key: ({ quality }) => `shade:${quality}`,
})

family.keys // ['shade:low', 'shade:high']
family.emit('wgsl') // Map { 'shade:low' => '…', 'shade:high' => '…' }
family.get('shade:high')?.reflection // that variant's own reflection
```

모든 변형은 저마다 모듈과 리플렉션, 키를 지니며, `emit`은 어느 타깃에서든 키마다
전처리기 없는 소스 하나를 돌려줍니다. define을 이미 쥐고 있는 GLSL 호스트를 위해서는,
`emitGuarded`가 같은 행렬을 소스 하나로 하향 변환해 `#if` ladder를 생성합니다. 키마다
분기 하나씩이고, 각 분기는 `emit`이 만드는 것과 같은 코드이며, 모든 분기가 공유하는 서문은
이 ladder 위로 끌어올려 둡니다. `variantFamily`의 참고 페이지에 이 형태와 변형에 요구하는
사항이 있습니다.

### 특수화한 프로그램의 정체성

특수화한 프로그램은 다른 프로그램이므로, 특수화에 쓴 축은 하나도 빠짐없이 그 프로그램을
가리키는 모든 키에 나타나야 합니다. 캐시한 파이프라인의 id도, 빌더를 다시 실행하지 않고
바이트를 그대로 내주는 베이크된 아티팩트의 id도 마찬가지입니다. 키는 빌더가 받는 것과
같은 사실을 받습니다.

```ts
const keyFor = (hasElevation: boolean, method: number) =>
  `${hasElevation ? 'dem' : 'flat'}:${method}`
```

짧은 키가 일으키는 실패에는 오류가 따르지 않습니다. 빌더가 읽는 것보다 적은 것만 담은
키는 어떤 변형의 컴파일된 셰이더를 다른 변형의 드로우에 넘겨줍니다. 컴파일도 되고 링크도
되고 렌더링도 되지만 픽셀은 틀립니다. 빌더에 축을 하나 추가한다면 같은 커밋 안에서
키에도 반드시 반영합니다. `variantFamily`는 키를 축의 함수로 요구하며, 두 점이 같은 키를
만들면 오류를 던져 같은 실수를 빌드 시점 오류로 바꿔 줍니다.
