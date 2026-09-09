---
id: overview
source: c47868a2a6f05c3cb8a3fff26f0cc81c00bfa3e2136e52681c1fbd6a54884cba
sourceLine: 1
---

# `@xgis/shader-dsl`로 셰이더 작성하기

이 문서를 읽고 나면 TypeScript 소스 하나가 무엇으로 바뀌는지, 작성 인터페이스를 어떻게
가져오는지, 그리고 이 가이드의 어느 절이 어떤 질문에 답하는지 알 수 있습니다. 예제 코드는 이
저장소의 소스를 기준으로 작성했으며, `examples/`에는 같은 방식으로 작성한 완전한 셰이더가
들어 있습니다.

### 작성하는 코드와 그 결과

셰이더는 TypeScript로 작성한, 타입이 정해진 표현식과 문장으로 이루어집니다. 표현식을 하나씩
만들 때마다 노드가 생깁니다. 노드는 연산과 피연산자를 기록하는 작은 타입 객체입니다. 이런
노드들이 이루는 그래프가 중간 표현, 즉 IR이며, 패키지가 컴파일하는 대상도 이 IR입니다.
셰이더 텍스트를 직접 손으로 조립하지 않으므로, 타입을 잘못 쓰거나 필드 이름을 잘못 적으면
에디터에서 바로 TypeScript 오류로 나타납니다.

이 구조를 이루는 것은 두 번의 호출입니다. `fn`은 함수를 선언합니다. 매개변수와 본문을
정하고, 진입점이라면 어느 스테이지에서 실행되는지도 함께 지정합니다. 진입점은 GPU가
버텍스마다, 프래그먼트마다, 또는 컴퓨트 호출마다 한 번씩 부르는 함수이며, 그 밖의 함수는 모두
진입점이 부르는 헬퍼입니다. `module`은 이런 함수들과 그 함수들이 쓰는 구조체, 읽어 들이는
리소스, 함께 쓰는 상수를 모아 모듈 값 하나로 묶습니다.

이 모듈 값 하나가 네 가지 결과물의 입력이 됩니다.

- `emitModule`은 WebGPU가 받아들이는 셰이딩 언어인 WGSL을 돌려줍니다.
- `emitGlslStages`는 버텍스 진입점과 프래그먼트 진입점을 모두 가진 모듈에 대해, WebGL2용
  GLSL ES 3.00 소스인 `{ vertex, fragment }`를 돌려줍니다.
- `compileModule`은 같은 IR을 JavaScript에서 모든 값을 배정밀도로 두고 그대로 계산한 결과,
  즉 CPU 오라클을 돌려줍니다. GPU 실행 결과와 비교할, 수학적으로 의도된 정답을 제공합니다.
- `reflect`는 호스트가 파이프라인을 만드는 데 필요한 메타데이터, 즉 바인드 그룹, 유니폼이나
  스토리지 버퍼가 맞춰야 하는 std140과 std430 바이트 레이아웃, 버텍스 속성, 진입점 시그니처를
  돌려줍니다.

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

`emitModule(m)`을 실행하면 이런 결과를 얻습니다.

```wgsl
fn ring_mask(uv: vec2<f32>, radius: f32) -> f32 {
  return abs((length(uv) - radius));
}
```

전달한 이름은 그대로 출력에 남고, 매개변수 타입은 WGSL 타입이 되며, 반환 타입은 본문에서
결정됩니다. 최적화기는 부분 표현식이 반복되는 자리에 스스로 바인딩을 추가하므로, 생성된
본문에는 직접 쓰지 않은 이름이 나타날 수도 있습니다.

### 가져오기

패키지 루트에서 가져와 작성합니다. 패키지 루트는 작성과 생성에 필요한 인터페이스 전체, 즉
IR, 레이아웃 선언자, WGSL과 GLSL 백엔드, 검증기, CPU 오라클, `reflect`를 모두 다시
내보냅니다.

```ts
import { fn, module, vec4, If, Switch, when, emitModule, reflect } from '@xgis/shader-dsl'
import { ioStruct, uniformStruct, structDecl, builtin, location, storageBuffer, resource } from '@xgis/shader-dsl'
```

그 밖의 하위 경로에는 작성과 생성에 필요하지 않은 인터페이스가 들어 있으며, 직접 쓰지 않는
임포트는 번들 크기에 아무 영향도 주지 않습니다.

- `@xgis/shader-dsl/dev`에는 린트 보고서, 최적화기 측정, 오류에 담기는 소스 위치 같은
  개발용 도구가 들어 있습니다.
- `@xgis/shader-dsl/emit-prod`에는 생성된 소스의 이름을 바꾸고 압축하고 난독화하는 배포
  시점 텍스트 플러그인이 들어 있습니다.
- `@xgis/shader-dsl/compute`에는 호스트가 가진 백엔드가 무엇이든 그 위에서 이식 가능한
  컴퓨트 커널을 디스패치하는 실행기가 들어 있습니다.

이 패키지가 배포하는 것은 작성 인터페이스뿐입니다. 셰이더 자체는 각자의 저장소에 있으며,
다른 의존성과 마찬가지로 이 패키지를 가져와 씁니다.

### 이 가이드의 순서

각 페이지는 주제 하나씩을 다루며 학습 순서대로 배치되어 있으므로, 처음에는 순서대로 읽는
것이 가장 빠른 길입니다. 한 번 읽고 나면 이후에는 어느 페이지든 그 자체로 완결됩니다.
함수별 세부 내용은 각 함수의 참고 문서 페이지에 있으며, 이 가이드에서 그 함수가 처음
언급되는 자리마다 그 페이지로 링크가 걸립니다.

이어지는 페이지는 다음 순서로 구성되어 있습니다.

- [첫 번째 셰이더](/guide/authoring/your-first-shader/): 버텍스 진입점과 프래그먼트
  진입점을 가진 모듈을 작성하고, 두 타깃 모두에 대해 생성합니다.
- [값과 변경](/guide/authoring/values-and-mutation/): 값을 만들고, 타입을 지정하고, 그
  값을 바꿉니다.
- [함수와 진입점](/guide/authoring/functions-and-entry-points/): 헬퍼와 진입점을
  선언하고, 이들을 담는 모듈을 만듭니다.
- [제어 흐름](/guide/authoring/control-flow/): 분기하고, 반복하고, 정수 값으로
  디스패치하고, 조기 반환합니다.
- [레이아웃과 리소스](/guide/authoring/layouts-and-resources/): IO 구조체, 유니폼 블록,
  스토리지 버퍼, 텍스처를 한 번씩 선언하고, 그 필드를 타입과 함께 다시 읽어 들입니다.
- [생성과 리플렉션](/guide/authoring/emitting-and-reflection/): WGSL과 GLSL을 생성하고,
  호스트가 바인딩에 쓰는 파이프라인 메타데이터를 읽습니다.
- [CPU 오라클](/guide/authoring/the-cpu-oracle/): 같은 모듈을 배정밀도로 실행하고, 그
  결과 값을 GPU 실행 결과와 비교합니다.
- [진단](/guide/authoring/diagnostics/): 코드가 붙은 오류를 읽고, 모듈 안의 모든 실패를
  보고서 하나로 모읍니다.
- [조건부 프로그램](/guide/authoring/conditional-programs/): 기능 조합마다 특수화된
  프로그램을 하나씩 만듭니다.
- [기능과 확장](/guide/authoring/capabilities-extensions/): 모듈을 생성하는 데 필요한
  GPU 기능을 선언하고, 부팅된 디바이스가 그 기능을 지원하는지 확인합니다.
- [fp64](/guide/authoring/fp64/): 부동소수점만 지원하는 하드웨어에서도 배정밀도를
  얻습니다.
- [GLSL 부동소수점 정밀도](/guide/authoring/glsl-float-precision/): GLSL 스테이지를
  mediump로 생성하고, 그것이 소스를 어떻게 바꾸는지 확인합니다.
- [프로덕션 생성](/guide/authoring/production-emit/): 배포하는 소스의 이름을 바꾸고
  압축하고 난독화한 뒤, 드라이버 로그에 나온 이름을 다시 작성 시점 이름으로 디코딩합니다.
- [raw 문](/guide/authoring/raw-statements/): 손으로 직접 쓴 문장을 모듈에 끼워 넣고,
  그것이 각 타깃에서 어떤 비용을 치르는지 압니다.
- [GLSL 셰이더 옮기기](/guide/authoring/migrating-a-glsl-shader/): 눈앞의 GLSL 구성
  요소를 찾아보고, 이 DSL에서는 그것을 어떻게 표기하는지 확인합니다.

이 패키지를 처음 써 본다면 다음 페이지부터 시작하십시오. 이미 있는 셰이더를 옮기려고
왔다면 GLSL 셰이더 옮기기를 먼저 읽고, 거기서 거슬러 올라가는 링크를 따라가십시오.
