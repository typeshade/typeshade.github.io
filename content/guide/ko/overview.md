---
id: overview
source: 0f2066454e496501eff6a02f215ab9fd6c0ecad2f0a3a5acdbbb88e56020231c
sourceLine: 1
---

# TypeShade로 셰이더 작성하기

이 문서를 읽고 나면 TypeScript 소스 하나가 TypeShade 컴파일러를 거쳐 GPU 셰이더로 바뀌는 흐름과, `"use typeshade"`로 TypeShade 작성 모드를 시작하는 방법을 알 수 있습니다. 예제 코드는 이 저장소의 소스를 기준으로 작성했으며, `examples/`에는 같은 방식으로 작성한 완전한 셰이더가 들어 있습니다.

### 작성하는 코드와 그 결과

셰이더는 TypeScript에서 타입이 붙은 표현식과 문장으로 씁니다. 표현식을 만들 때마다 연산과 피연산자를 기록하는 작은 타입 객체인 노드가 생깁니다. 이 노드의 그래프가 중간 표현, 즉 IR이며 패키지가 컴파일하는 대상입니다. 셰이더 텍스트를 직접 조립하지 않으므로 잘못된 타입이나 필드 이름은 에디터에서 TypeScript 오류로 확인할 수 있습니다.

TypeShade의 공식 작성 방식은 일반적인 `.ts` 파일에서 첫 문장으로 `"use typeshade";`를 쓰는 것입니다. 별도의 파일 확장자나 별도의 편집 모드가 필요하지 않으며, TypeScript의 타입 검사와 개발 도구를 유지하면서 GPU 실행에 필요한 의미와 제약을 추가합니다. 기존 EDSL 작성 인터페이스를 그대로 쓰는 경우에는 `typeshade` 패키지에서 같은 IR 작성 기능을 가져올 수 있습니다.

구조를 만드는 두 호출은 `fn`과 `module`입니다. `fn`은 함수의 매개변수와 본문을 선언하고, 진입점이면 실행 스테이지도 지정합니다. 진입점은 GPU가 버텍스 하나, 프래그먼트 하나, 컴퓨트 호출 하나마다 한 번씩 부르는 함수이고, 나머지 함수는 진입점이 부르는 헬퍼입니다. `module`은 함수와 구조체, 리소스, 상수를 하나의 모듈 값으로 묶습니다.

이 모듈 값 하나에서 네 가지 결과를 얻습니다.

- `emitModule`은 WebGPU가 사용하는 WGSL을 반환합니다.
- `emitGlslStages`는 버텍스와 프래그먼트 진입점을 가진 모듈에서 WebGL2용 GLSL ES 3.00 소스를 `{ vertex, fragment }`로 반환합니다.
- `compileModule`은 같은 IR을 JavaScript에서 모든 값을 배정밀도로 계산해, GPU 실행 결과와 비교할 기준값을 내는 CPU 오라클을 반환합니다.
- `reflect`는 호스트가 파이프라인을 만들 때 필요한 바인딩, std140과 std430 레이아웃, 버텍스 속성, 진입점 시그니처를 반환합니다.

```ts
import {
  fn,
  module,
  abs,
  length,
  f32T,
  vec2fT,
  emitModule,
  compileModule,
  reflect,
} from 'typeshade'

// One helper. The return type is inferred from the value the body returns.
const ringMask = fn('ring_mask', { uv: vec2fT, radius: f32T }, (p) =>
  abs(length(p.uv).sub(p.radius)),
)

const m = module({ funcs: [ringMask] })

const wgsl = emitModule(m) // WGSL source, as a string
const cpu = compileModule(m) // cpu.fns.ring_mask([0.3, 0.4], 0.5) === 0
const meta = reflect(m) // bind groups, layouts, entry signatures
```

`emitModule(m)`은 WGSL을 생성합니다.

```wgsl
fn ring_mask(uv: vec2<f32>, radius: f32) -> f32 {
  return abs((length(uv) - radius));
}
```

전달한 이름은 결과에 남고, 매개변수 타입은 WGSL 타입으로 변환되며, 반환 타입은 본문에서 추론됩니다. 반복되는 하위 표현식에는 최적화 단계가 지어 준, 직접 짓지 않은 이름이 붙을 수도 있습니다.

### 가져오기

필요한 것은 모두 패키지 루트에서 가져옵니다. 패키지 루트는 IR, 레이아웃 선언자, WGSL과 GLSL 백엔드, 검증기, CPU 오라클과 `reflect`를 포함한 작성 및 생성 인터페이스를 다시 내보냅니다.

```ts
import { fn, module, vec4, If, Switch, when, emitModule, reflect } from 'typeshade'
import {
  ioStruct,
  uniformStruct,
  structDecl,
  builtin,
  location,
  storageBuffer,
  resource,
} from 'typeshade'
```

`typeshade/dev`에는 개발용 진단과 최적화 측정, 오류의 소스 위치가 있고, `typeshade/emit-prod`에는 배포용 이름 변경과 압축 및 난독화 도구가 있습니다. `typeshade/compute`에는 호스트의 백엔드에서 compute 커널을 실행하는 도구가 있습니다. `typeshade/debug`는 `"use typeshade"` 셰이더의 인보케이션 하나를 CPU 오라클 위에서 한 문장씩 진행합니다. 작성자가 쓴 문장마다 멈춰 소스 구간과 프레임의 지역 변수를 보고하고, 중단점을 줄 번호로 찾아 줍니다. 실행 하나를 데이터로 적어 두는 실행 구성도 함께 담는데, 인수 위치가 아니라 진입점이 선언한 이름을 키로 삼으며, `launch.json`용 JSON Schema와 값을 작성자가 쓴 셰이더 타입으로 보여 주는 포매터가 들어 있습니다. 편집기의 디버그 어댑터와 Playground의 단계 실행 패널이 모두 이것을 바탕으로 만들어졌습니다. 자세한 내용은 `docs/debugging.md`를 보십시오. 실제 셰이더는 사용하는 저장소에 두고 이 패키지를 다른 의존성과 같은 방식으로 가져옵니다.

### 이 가이드의 순서

각 페이지는 학습 순서대로 하나의 주제를 다룹니다. 처음에는 순서대로 읽는 것이 가장 빠르고, 이후에는 필요한 페이지를 바로 찾아볼 수 있습니다. TypeScript나 웹 플랫폼 개념이 낯설다면 관련 개념을 먼저 이해한 뒤 TypeShade가 GPU를 위해 어떻게 제한하고 확장하는지 확인하십시오.

이 가이드는 `"use typeshade"`로 시작하는 실제 작성 경험을 먼저 익히고, 그 다음 함수와 값, 리소스, 제어 흐름, 생성과 리플렉션 같은 컴파일러 세부 사항으로 내려가도록 구성되어 있습니다. 기존 GLSL을 옮기는 경우에는 GLSL 셰이더 옮기기 페이지에서 시작해 필요한 개념으로 거슬러 올라가면 됩니다.

다음 페이지는 작성 순서에 맞춰 구성되어 있습니다.

- [첫 셰이더](/guide/authoring/your-first-shader/)
- [값과 변경](/guide/authoring/values-and-mutation/)
- [함수와 진입점](/guide/authoring/functions-and-entry-points/)
- [제어 흐름](/guide/authoring/control-flow/)
- [레이아웃과 리소스](/guide/authoring/layouts-and-resources/)
- [생성과 리플렉션](/guide/authoring/emitting-and-reflection/)
- [CPU 오라클](/guide/authoring/the-cpu-oracle/)
- [진단](/guide/authoring/diagnostics/)
- [조건부 프로그램](/guide/authoring/conditional-programs/)
- [Capability와 확장](/guide/authoring/capabilities-extensions/)
- [fp64](/guide/authoring/fp64/)
- [GLSL 부동소수점 정밀도](/guide/authoring/glsl-float-precision/)
- [배포용 생성](/guide/authoring/production-emit/)
- [Raw statements](/guide/authoring/raw-statements/)
- [GLSL 셰이더 옮기기](/guide/authoring/migrating-a-glsl-shader/)
