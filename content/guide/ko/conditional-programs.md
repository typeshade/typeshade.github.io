---
id: conditional-programs
source: 0081d2d47802b7f6baea58303d9701a3293288938e032ceb6ea5a4a1e9ad5395
sourceLine: 1554
---

이 페이지를 읽고 나면 소스 하나에서 만들 수 있는 여러 프로그램 가운데 어느 것을 빌드할지
정할 수 있고, 어떤 변형이 상수 하나만 다른 경우이고 어떤 변형이 서로 다른 프로그램인지
가려낼 수 있습니다. 그 선택을 define을 쥔 호스트에게 넘기는 법과, 캐시가 한 변형을
요청받고 다른 변형을 돌려주는 일이 없도록 결과에 이름을 붙이는 법도 익힙니다.

기능에 따라, 표고 정보가 있는지 없는지에 따라, 3D인지 평면인지에 따라 셰이더가 달라져야
하는 지점에서 GLSL 코드베이스는 `#define`과 `#ifdef` ladder를 씁니다. 이 패키지에는
전처리기가 없습니다. 모듈은 보통의 함수가 돌려주는 보통의 JavaScript 값이므로, 달라지는
부분은 함수 매개변수가 되고 평범한 `if`가 IR에 무엇을 넣을지 정합니다. 선택받지 못한
분기는 애초에 만들지 않으므로 나중에 걷어낼 것도 없고, 생성한 프로그램에는 디스패치 체인
없이 선택한 분기의 연산만 들어갑니다.

"프로그램이 달라진다"는 말에는 질문 세 가지가 숨어 있고, 질문마다 답이 다릅니다.
프로그램의 구조 자체가 다른 경우, 값 하나만 다른 경우, 선택권이 호스트에게 있는 경우입니다.
디바이스에 있을 수도 있고 없을 수도 있는 기능은 네 번째 질문이고,
[기능과 확장](/guide/authoring/capabilities-extensions/)에서 다룹니다.

### 빌더 매개변수와 평범한 if

특수화란 선택을 하나로 정해 놓고 그에 맞는 프로그램 하나를 만드는 일이며, 그 선택은 모듈을
만들기 전에 TypeScript 쪽에서 이미 끝나 있습니다. 빌더는 그 선택을 매개변수로 받아
분기하도록 작성합니다.

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

여기서는 프로그램 구조가 바뀌면 바인딩도 함께 바뀌는데, 전처리기 대신 이 방식을 쓰는
이유가 여기에 있습니다. `hasElevation`이 false면 표고 텍스처를 아예 선언하지 않으므로
`reflect()`에도 없고 바인드 그룹 레이아웃에도 없으며, 호스트는 그 리소스를 만들지
않습니다. `#ifdef`를 쓰면 선언은 소스에 그대로 남고 레이아웃은 손으로 맞춰야 하는데,
꺼 둔 기능이 바인딩 슬롯을 계속 차지하는 것도 이 때문입니다.

드로우 시점까지는 정할 수 없는 선택도 있습니다. 이런 선택은 런타임 분기로 남겨 두며,
`when`을 쓰면 GPU가 평가하는 조건에 따라 값을 고를 수 있습니다. 특수화는 빌드할 때 이미
알고 있는 선택에 씁니다.

### composeModule로 채우는 문 슬롯

변형끼리 모듈 전체를 공유하면서 한 함수 안의 문(statement) 몇 줄만 다른 경우도 있습니다.
그 이음매는 기본 모듈에 `b.placeholder('tag')`로 표시해 두고, 변형마다 `composeModule`로
채웁니다. 플레이스홀더는 태그를 단 표시용 문장 하나이고, 교체(swap)는 그 자리에 들어갈
문장 목록입니다.

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

`composeModule`은 `if`, `for`, `switch` 본문 안까지 들어가 교체를 적용하고, 함수 본문만
새로 쓰고 나머지는 그대로 옮긴 새 모듈을 돌려줍니다. 문 슬롯만 채우므로 상수도, 구조체도,
바인딩도 새로 만들지 않으며, `#include`를 대신하지도 못합니다. 슬롯을 채우지 않고 남겨
두었을 때와 어느 플레이스홀더와도 맞지 않는 교체 키를 넘겼을 때 어떻게 되는지는 참고
페이지에 적혀 있습니다.

### override로 다른 값 하나

모든 변형이 상수 하나만 바뀐 채 같은 프로그램을 생성한다면, 특수화는 파이프라인 수만
쓸데없이 늘립니다. 이럴 때는 `overrideConst`로 특수화 상수를 선언합니다. 특수화 상수는
모듈 스코프의 값으로, DSL 패스를 모두 거치는 동안에도 값을 읽는 자리가 이름 그대로 남아
있다가 호스트가 파이프라인을 만들 때 비로소 값이 정해집니다.

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
값을 고정합니다. GLSL ES 3.00에는 드라이버 쪽에 대응하는 기능이 없으므로 백엔드는 모듈
혼자서도 컴파일되도록 기본값을 소스에 넣어 생성하고, 다른 값을 쓰려는 호스트는
`emitGlslModule(m, 'fragment', { overrideValues: { quality: 2 } })`로 다시 생성합니다.
어느 쪽 호스트든 채워 넣어야 할 상수 목록은 `reflect().overrides`에서 읽습니다.

옵티마이저는 이 값을 읽는 자리를 상수로 취급하지 못하므로 위의 분기는 모든 패스를 그대로
통과하고, 드라이버가 파이프라인 변형마다 그 분기를 걷어냅니다. 고전적인 우버셰이더 기법이
바로 이 방식입니다. 경험칙은 이렇습니다. 두 변형이 리터럴 하나만 바뀐 채 같은 명령어
시퀀스로 컴파일된다면 오버라이드이고, 서로 다른 코드로 컴파일된다면 빌드 시점
매개변수입니다.

### 호스트가 결정하는 축

축(axis)이란 프로그램을 갈라지게 하는 기준 하나와 그 기준이 가질 수 있는 값 목록을 묶어
부르는 말입니다. 축 공간의 한 점이 곧 변형 하나입니다. 그 점을 호스트가 런타임에 우리
손 밖의 상태를 보고 고른다면, 작성해야 할 대상은 행렬 전체가 됩니다. `variantFamily`는
축, 점 하나를 만드는 빌더, 키를 정하는 함수를 받아 모든 점을 빌드합니다.

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
전처리기 없는 소스 하나를 돌려줍니다. define을 이미 쥐고 있는 GLSL 호스트에게는
`emitGuarded`가 같은 행렬을 소스 하나로 하향 변환(lower)해, 생성한 `#if` ladder로 변형을
가릅니다. 키마다 분기가 하나씩 있고, 각 분기의 코드는 `emit`이 만드는 것과 같으며, 모든
분기가 공유하는 서문은 ladder 위로 끌어올려 한 번만 둡니다. 이 소스의 모양과 변형이 갖춰야
할 조건은 `variantFamily`의 참고 페이지에 있습니다.

### 특수화한 프로그램의 정체성

특수화한 프로그램은 다른 프로그램이므로, 특수화에 쓴 축은 하나도 빠짐없이 그 프로그램을
가리키는 모든 키에 나타나야 합니다. 캐시한 파이프라인의 id도, 빌더를 다시 돌리지 않고
저장해 둔 바이트를 그대로 돌려주는 아티팩트의 id도 마찬가지입니다. 키를 만드는 함수는
빌더가 받는 값을 그대로 받습니다.

```ts
const keyFor = (hasElevation: boolean, method: number) =>
  `${hasElevation ? 'dem' : 'flat'}:${method}`
```

키가 모자라서 생기는 실패는 오류로 드러나지 않습니다. 빌더가 읽는 값 가운데 일부만 담은
키는 한 변형의 컴파일된 셰이더를 다른 변형의 드로우에 넘겨줍니다. 컴파일도 되고 링크도
되고 렌더링도 되지만 픽셀은 틀립니다. 빌더에 축을 하나 추가한다면 같은 커밋 안에서
키에도 반드시 반영합니다. `variantFamily`는 키를 축에서 계산하는 함수로 받고, 두 점이 같은
키를 만들면 오류를 던지므로 같은 실수가 빌드 시점 오류로 바뀝니다.
