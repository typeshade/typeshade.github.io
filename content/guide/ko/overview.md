---
id: overview
source: c47868a2a6f05c3cb8a3fff26f0cc81c00bfa3e2136e52681c1fbd6a54884cba
sourceLine: 1
---

# TypeShade로 셰이더 작성하기

이 문서를 읽고 나면 TypeScript 소스 하나가 TypeShade 컴파일러를 거쳐 GPU 셰이더로 바뀌는 흐름과, `"use typeshade"`로 TypeShade 작성 모드를 시작하는 방법을 알 수 있습니다. 예제 코드는 이 저장소의 소스를 기준으로 작성했으며, `examples/`에는 같은 방식으로 작성한 완전한 셰이더가 들어 있습니다.

### 작성하는 코드와 그 결과

셰이더는 TypeScript로 작성한 타입이 지정된 표현식과 문장입니다. 표현식을 만들 때마다 연산과 피연산자를 기록하는 작은 타입 객체인 노드가 생깁니다. 이 노드의 그래프가 중간 표현, 즉 IR이며 패키지가 컴파일하는 대상입니다. 셰이더 텍스트를 직접 조립하지 않으므로 잘못된 타입이나 필드 이름은 에디터에서 TypeScript 오류로 확인할 수 있습니다.

TypeShade의 공식 작성 방식은 일반적인 `.ts` 파일에서 첫 문장으로 `"use typeshade";`를 쓰는 것입니다. 별도의 파일 확장자나 별도의 편집 모드가 필요하지 않으며, TypeScript의 타입 검사와 개발 도구를 유지하면서 GPU 실행에 필요한 의미와 제약을 추가합니다.

구조를 만드는 두 호출은 `fn`과 `module`입니다. `fn`은 함수의 매개변수와 본문을 선언하고, 진입점이면 실행 스테이지도 지정합니다. `module`은 함수와 구조체, 리소스, 상수를 하나의 모듈 값으로 묶습니다.

모듈 값은 네 가지 결과의 입력이 됩니다.

- `emitModule`은 WebGPU가 사용하는 WGSL을 반환합니다.
- `emitGlslStages`는 버텍스와 프래그먼트 진입점을 가진 모듈에서 WebGL2용 GLSL ES 3.00 소스를 `{ vertex, fragment }`로 반환합니다.
- `compileModule`은 같은 IR을 JavaScript에서 배정밀도로 계산하는 CPU 오라클을 반환합니다.
- `reflect`는 호스트가 파이프라인을 만들 때 필요한 바인딩, std140과 std430 레이아웃, 버텍스 속성, 진입점 시그니처를 반환합니다.

```ts
import { fn, module, abs, length, f32T, vec2fT, emitModule, compileModule, reflect } from '@xgis/shader-dsl'

// One helper. The return type is inferred from the value the body returns.
const ringMask = fn('ring_mask', { uv: vec2fT, radius: f32T }, (p) =>
  abs(length(p.uv).sub(p.radius)),
)

const m = module({ funcs: [ringMask] })

const wgsl = emitModule(m) // WGSL source, as a string
const cpu = compileModule(m) // cpu.fns.ring_mask([0.3, 0.4], 0.5) === 0
const meta = reflect(m) // bind groups, layouts, entry signatures
```

`emitModule(m)`은 다음과 같은 WGSL을 만듭니다.

```wgsl
fn ring_mask(uv: vec2<f32>, radius: f32) -> f32 {
  return abs((length(uv) - radius));
}
```

전달한 이름은 결과에 남고, 매개변수 타입은 WGSL 타입으로 변환되며, 반환 타입은 본문에서 추론됩니다. 반복되는 하위 표현식에는 최적화 과정에서 작성하지 않은 이름이 붙을 수도 있습니다.

### 가져오기

패키지 루트에서 작성합니다. 패키지 루트는 IR, 레이아웃 선언자, WGSL과 GLSL 백엔드, 검증기, CPU 오라클과 `reflect`를 포함한 작성 및 생성 인터페이스를 다시 내보냅니다.

```ts
import { fn, module, vec4, If, Switch, when, emitModule, reflect } from '@xgis/shader-dsl'
import { ioStruct, uniformStruct, structDecl, builtin, location, storageBuffer, resource } from '@xgis/shader-dsl'
```

`@xgis/shader-dsl/dev`에는 개발용 진단과 최적화 측정, 오류의 소스 위치가 있고, `@xgis/shader-dsl/emit-prod`에는 배포용 이름 변경과 압축 및 난독화 도구가 있습니다. `@xgis/shader-dsl/compute`에는 호스트의 백엔드에서 compute 커널을 실행하는 도구가 있습니다. 실제 셰이더는 사용하는 저장소에 두고 이 패키지를 다른 의존성과 같은 방식으로 가져옵니다.

### 이 가이드의 순서

각 페이지는 학습 순서대로 하나의 주제를 다룹니다. 처음에는 순서대로 읽는 것이 가장 빠르고, 이후에는 필요한 페이지를 바로 찾아볼 수 있습니다. TypeScript나 웹 플랫폼 개념이 낯설다면 관련 개념을 먼저 이해한 뒤 TypeShade가 GPU를 위해 어떻게 제한하고 확장하는지 확인하십시오.

이 가이드는 `"use typeshade"`로 시작하는 실제 작성 경험을 먼저 익히고, 그 다음 함수와 값, 리소스, 제어 흐름, 생성과 리플렉션 같은 컴파일러 세부 사항으로 내려가도록 구성되어 있습니다. 기존 GLSL을 옮기는 경우에는 GLSL 셰이더 옮기기 페이지에서 시작해 필요한 개념으로 거슬러 올라가면 됩니다.
