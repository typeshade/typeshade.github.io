---
id: conditional-programs
source: 71cd6e3d933c1439c344131ccc354e6ecc7f86191e35d2e823c84a017ce94825
sourceLine: 1944
---

이 페이지를 마치면 한 코드베이스에서 여러 프로그램 가운데 무엇을 만들지 정할 수 있습니다. 변형이
다른 프로그램이 아니라 상수 하나일 뿐인 때를 가려내고, define을 소유한 호스트에 선택을 넘기고,
캐시가 한 변형 자리에 다른 변형을 내주지 않도록 결과에 이름을 붙일 수도 있습니다.

고도 데이터가 있는지 없는지, 3D인지 평면인지처럼 기능에 따라 달라져야 하는 셰이더를 만날 때 GLSL
코드베이스는 `#define`과 `#ifdef`가 줄줄이 이어진 분기를 꺼내 듭니다. 이 패키지에는 전처리기가
없습니다. 프로그램은 파일 하나와 그 파일이 가져오는 것들입니다. 그래서 달라지는 것은 어느 파일을
컴파일하느냐이고, 변형들이 공유하는 코드는 모두가 가져오는 파일 하나에 둡니다. 생성된 프로그램에는
선택된 변형의 코드만 들어가며, 그 둘레에 디스패치 체인이 붙지 않습니다.

"프로그램이 바뀐다"는 말 아래에는 질문 세 가지가 숨어 있고, 질문마다 답이 따로 있습니다. 프로그램의
형태가 다른 경우, 값 하나만 다른 경우, 선택을 호스트가 하는 경우입니다. 디바이스에 있을 수도 없을
수도 있는 기능은 네 번째 질문이며, [기능과 확장](/guide/authoring/capabilities-extensions/)이 그
답을 줍니다.

### 변형마다 파일 하나

특수화는 선택의 조합 하나에 프로그램 하나를 만드는 일입니다. 변형마다 진입 파일을 하나씩 쓰고,
공유하는 부분은 각 파일이 가져오는 파일에 둡니다.

```ts
// terrain.shade.ts
"use typeshade";

export function shadeHeight(h: f32): vec4 {
  return vec4(h, h * 0.5, 0., 1.);
}

// terrain-flat.shade.ts
"use typeshade";

import { shadeHeight } from "./terrain.shade.ts";

@fragment
export function fs(@location(0) uv: vec2): vec4 {
  return shadeHeight(0.);
}

// terrain-dem.shade.ts
"use typeshade";

import { shadeHeight } from "./terrain.shade.ts";

declare const dem: texture_2d<f32>;
declare const demSampler: sampler;

@fragment
export function fs(@location(0) uv: vec2): vec4 {
  return shadeHeight(textureSample(dem, demSampler, uv).x);
}
```

파일은 호스트가 고릅니다.

```ts
import { compile } from 'typeshade'

// read: the readDocument of "A shader module that imports another"
const buildTerrain = (hasElevation: boolean) => {
  const fileName = hasElevation ? 'terrain-dem.shade.ts' : 'terrain-flat.shade.ts'
  return compile(read(fileName)!, { fileName, readDocument: read })
}
```

여기서는 바인딩이 형태와 함께 움직입니다. 전처리기보다 이 방법을 권하는 이유가 바로 이것입니다.
평면 변형에서는 고도 텍스처를 아예 선언하지 않습니다. 그래서 `reflect()`에도, 바인드 그룹
레이아웃에도 나타나지 않고, 호스트는 이 텍스처를 위한 리소스를 만들지 않습니다. `const` 플래그와
평범한 `if`로는 이렇게 되지 않습니다. 분기는 쓴 그대로 생성되고 선언한 텍스처는 모듈에 남으므로,
꺼 둔 기능이 바인딩 슬롯을 여전히 차지하게 됩니다.

드로 시점이 되어야 정할 수 있는 선택도 있습니다. 이런 선택은 유니폼에 따른 런타임 분기로 남기고,
GPU가 계산합니다. 특수화는 빌드할 때 이미 아는 선택에 씁니다.

### override로 다른 값 하나

모든 변형이 상수 하나만 바뀐 같은 프로그램을 생성한다면, 특수화는 쓸데없이 파이프라인만 늘립니다.
이럴 때는 `override<T>`로 특수화 상수를 선언하십시오. 특수화 상수는 모듈 범위의 값입니다. 이 값을
읽는 자리는 모든 패스를 거치는 동안 기호로 남고, 호스트가 파이프라인을 만들 때 값을 고정합니다.

```ts
"use typeshade";

const quality: override<f32> = 1.;

export function shade(base: f32): f32 {
  let acc = base;
  if (quality > 1.) {
    acc = acc * 2. + 0.5;
  }
  return acc;
}

@fragment
export function fs(@location(0) v: f32): vec4 {
  return vec4(shade(v), 0., 0., 1.);
}
```

WGSL은 `override quality: f32 = 1.0;`을 생성하고, 호스트는 파이프라인의 `constants`로 값을
고정합니다. GLSL ES 3.00에는 드라이버 쪽에서 이에 해당하는 기능이 없습니다. 그래서 백엔드는
기본값으로 `#define`을 생성하고, 다른 값을 원하는 호스트는
`emitGlslModule(m, 'fragment', { overrideValues: { quality: 2 } })`로 다시 생성합니다. 두 호스트
형태 모두 채워야 할 상수 목록을 `reflect().overrides`에서 읽습니다.

이 읽기는 최적화 단계가 들여다보지 못하므로, 위의 분기는 모든 패스를 거쳐 살아남습니다. 그리고
드라이버가 파이프라인 변형마다 이 분기를 지웁니다. 전형적인 우버셰이더 방식입니다. 간단한 기준은
이렇습니다. 두 변형이 리터럴 하나만 다른 같은 명령어 열로 컴파일된다면 override를 쓰고, 다른
코드로 컴파일된다면 파일을 나눕니다.

### 호스트가 정하는 축

축은 프로그램이 달라지는 기준 하나와, 그 기준이 가질 수 있는 값의 목록입니다. 축이 이루는 공간의
점 하나가 변형 하나입니다. 여러분이 소유하지 않은 상태를 보고 호스트가 런타임에 점을 고른다면,
행렬 자체를 작성 대상으로 삼습니다. `variantFamily`는 축, 점 하나에 대한 모듈을 만드는 함수, 키를
만드는 방법을 받아 모든 점을 빌드합니다.

```ts
import { compile, variantFamily } from 'typeshade'

const family = variantFamily({
  axes: { elevation: ['flat', 'dem'] },
  build: ({ elevation }) => {
    const fileName = `terrain-${elevation}.shade.ts`
    return compile(read(fileName)!, { fileName, readDocument: read }).module
  },
  key: ({ elevation }) => `terrain:${elevation}`,
})

family.keys // ['terrain:flat', 'terrain:dem']
family.emit('wgsl') // Map { 'terrain:flat' => '…', 'terrain:dem' => '…' }
family.get('terrain:dem')?.reflection // that variant's own reflection
```

변형마다 모듈, 자기 리플렉션, 키가 들어 있습니다. `emit`은 어느 타깃이든 키마다 전처리기 없는
소스를 하나씩 돌려줍니다. define을 이미 소유한 GLSL 호스트에는 `emitGuarded`가 있습니다. 이 함수는
같은 행렬을 소스 하나로 하향 변환하며, 그 안에 `#if` ladder(조건이 줄줄이 이어진 분기)를
생성합니다. 키마다 분기가 하나씩 있고, 각 분기는 `emit`이 만드는 코드와 같으며, 모든 분기가
공유하는 프리앰블은 ladder 위로 끌어올립니다. 이 형태와 변형에 요구하는 조건은 `variantFamily`의
참조 페이지에 있습니다.

### 특수화된 프로그램의 정체성

특수화된 프로그램은 다른 프로그램입니다. 그러니 특수화하는 축은 모두 그 프로그램을 가리키는 모든
키에 들어가야 합니다. 캐시한 파이프라인의 id, 다시 컴파일하지 않고 바이트를 내주는 미리 구운
아티팩트의 id가 그런 키입니다. 키는 파일을 고를 때와 같은 사실을 담습니다.

```ts
const keyFor = (hasElevation: boolean, method: number) =>
  `${hasElevation ? 'dem' : 'flat'}:${method}`
```

키가 모자라서 생기는 실패에는 오류가 따라오지 않습니다. 빌드가 읽는 것보다 적게 담은 키는 한
변형의 컴파일된 셰이더를 다른 변형의 드로에 넘깁니다. 컴파일도 되고, 링크도 되고, 렌더링도 되지만
픽셀이 틀립니다. 빌드에 축을 더하면 같은 커밋에서 키에도 더하십시오. `variantFamily`는 키를 축의
함수로 받고, 두 점이 같은 키를 만들면 오류를 던집니다. 그러면 같은 실수가 빌드 시점의 오류로
바뀝니다.
