---
id: conditional-programs
source: 6ae8052b65567b78d18281bf314b74785d80289a8a8377ab65a62e5f82a515e1
sourceLine: 1391
---

기능에 따라 셰이더가 달라져야 하는 경우, 즉 표고 정보가 있는지 없는지, 3D인지 평면인지,
확장이 있는지 없는지 같은 상황에서 GLSL 코드베이스는 `#define`과 `#ifdef` 사다리를 씁니다.
**이 DSL에는 전처리기가 없고, 필요하지도 않습니다.** 모듈은 평범한 함수가 반환하는 평범한
JavaScript 값이므로, 달라지는 부분은 **함수 매개변수**로 나타내고 평범한 `if`가 IR에 무엇을
넣을지 결정합니다. 나중에 걸러내는 단계는 없습니다. 선택되지 않은 분기는 애초에 만들어지지
않습니다.

"프로그램이 달라진다"는 말 속에는 서로 다른 질문 세 가지가 숨어 있고, 답도 세 가지로
다릅니다. 어느 질문으로 접근하느냐를 잘못 고르는 데서 문제가 시작됩니다.

### 프로그램의 형태가 다르다면: 빌드 시점 특수화

`map/src/shaders/dsl/hillshade.ts`에 있는 실제 사례를 보겠습니다. hillshade 기법은 다섯
가지이고, 레이어는 그중 하나를 그립니다.

```ts
const buildFs = (pickEnabled: boolean, methodFlag: number) => {
  // Each method is a named builder, NOT inlined into the dispatch chain — which is what
  // makes it possible to emit one alone.
  const METHOD_BODY: ReadonlyArray<() => ReadonlyNode<'vec4<f32>'>> = [/* …five… */]

  const outColor =
    methodFlag >= 0
      ? METHOD_BODY[Math.min(4, methodFlag)]!() // ONE arm, no dispatch at all
      : when(
          // methodFlag < 0 → runtime 5-way
          [
            [method.lt(0.5), METHOD_BODY[0]!],
            [method.lt(1.5), METHOD_BODY[1]!],
            [method.lt(2.5), METHOD_BODY[2]!],
            [method.lt(3.5), METHOD_BODY[3]!],
          ],
          METHOD_BODY[4]!,
        )
  // …
}
```

소스는 하나, 형태는 둘입니다. `methodFlag >= 0`이면 **그 방식의 연산만** 생성합니다.
분기도 없고, 다른 분기의 임시 변수도 없으며, 실행되지 않는 코드가 만드는 레지스터 압박도
없습니다. `< 0`이면 런타임 체인을 그대로 유지하는데, 드로우 시점까지 정말로 결정할 수 없는
호출자를 위한 경우입니다.

표고 문제도 형태가 같습니다. 그 사실을 받아들이는 빌더는 이렇게 씁니다.

```ts
const buildTerrain = (hasElevation: boolean) => {
  const bindings = hasElevation ? [demTexture.binding, demSampler.binding] : []
  const height = hasElevation ? sampleDem(uv) : f32(0)
  return module({ bindings, funcs: [vs(height), fs] })
}
```

이 방식은 `#ifdef ELEVATION`보다 확실히 낫고, 취향의 문제만은 아닙니다. `hasElevation`이
false면 DEM 바인딩을 **선언하지 않으므로**, `reflect()`에도 나타나지 않고 바인드 그룹
레이아웃에도 나타나지 않으며 호스트는 그 리소스를 아예 만들지 않습니다. 전처리기를 쓰면
선언이 소스 코드에 그대로 남고 레이아웃은 손으로 맞춰 줘야 하는데, "비활성화한" 기능이
바인딩 슬롯을 여전히 차지하는 전형적인 사례입니다.

### 값만 다르고 형태는 같다면: `override`

모든 변형이 상수 하나만 다르고 나머지는 _똑같은_ 프로그램을 만들어 낸다면 특수화하지
않습니다. 특수화하면 파이프라인만 쓸데없이 늘어납니다. 이럴 때는 특수화 상수를 씁니다.
WGSL은 `override`를 생성하고 호스트는 `createRenderPipeline({ constants })`로 값을
고정합니다. GLSL ES 3.00에는 드라이버 쪽에 대응하는 기능이 없으므로, 백엔드는 `#version`
전문 뒤에 고정된 `#define NAME <value>`를 다시 생성해 붙입니다. 앞에 붙이면 GLSL이
거부하는데, `#version`이 소스 맨 앞에 와야 하기 때문입니다. 이 값을 다루는 손잡이가
[`GlslEmitOptions`](/api/index/interfaces/GlslEmitOptions)의 `overrideValues`이고, 그
형태는 TSDoc 자체가 정한 기준입니다. 값은 `reflect().overrides`에서 옵니다. 이 `#define`은
시스템에서 유일하게 생성되는 것이며, 항상 값 하나만 담습니다.

경험칙은 이렇습니다. **두 변형이 리터럴 하나만 다르고 나머지 명령어 시퀀스가 똑같이
컴파일된다면 오버라이드이고, 서로 다른 코드로 컴파일된다면 빌드 시점 매개변수입니다.**

### 기능이 없을 수도 있다면: 선언과 차단형 실패

`enables`(§10)는 기능이 없을 때 요청 자체를 막아 버리는 장치입니다. `f16`을 선언한 모듈이
이를 표현하지 못하는 백엔드로
컴파일되면 그 기능 이름을 담아 `UnsupportedFeatureError`/`SD0030`을 던지며, 드라이버가
거부할 소스는 내보내지 않습니다. 반드시 있어야 하는 기능이라면 바로 이런 동작을 원하는
것입니다.

진짜 **폴백**은 모듈 두 개를 두고 호스트가 그중 하나를 고르는 방식입니다. 이 선택은
디바이스를 이미 알고 있는 부팅 시점에 해야 하기 때문입니다(§10의 활성화 권한 규칙: WebGPU의
`requiredFeatures`는 `requestDevice` 시점에 고정되고 이후에는 절대 추가할 수 없습니다).

```ts
const caps = reflect(fancy).requiredFeatures
const ok = hostFeaturesFor(glslEs300Backend, caps).every((e) => gl.getExtension(e))
const m = ok ? fancy : plain // two modules, one decision, made once
```

### 특수화 축과 셰이더의 정체성

여기서 진짜 문제가 생기는데, 겉으로는 잘 드러나지 않습니다. 특수화한 프로그램은
_다른 프로그램_이므로, 특수화 축은 하나도 빠짐없이 그 프로그램을 가리키는 모든 키에
나타나야 합니다.

- **파이프라인 캐시**: `map/src/render/material/hillshade-material.ts`는 `Material`을
  `` `${methodFlag}:${pick}` ``마다 하나씩 유지합니다. 프래그먼트가 그 방식의 연산만
  담고 있어서, 파이프라인을 공유하면 잘못된 프로그램이 되기 때문입니다.
- **베이크한 셰이더 id**: 셰이더 계열을 베이크해 둔 경우입니다(#1679). 베이크는
  _빌더를 다시 실행하지 않고_ id로 바이트를 그대로 내주므로, id에 `methodFlag`가 드러나
  있지 않으면 어떤 방식의 컴파일된 셰이더를 전혀 다른 방식의 드로우에 넘겨주게 됩니다.
  컴파일도 되고 링크도 되고 렌더링도 되지만 결과는 틀립니다. 오류는 나지 않고, 픽셀만
  잘못 나옵니다.

빌더에 축을 하나 추가한다면 같은 커밋 안에서 키에도 반드시 반영합니다. 빌더가 무엇을
생성할지 설명하지 못하는 키는 이 코드베이스에서 가장 날카로운 함정입니다.
