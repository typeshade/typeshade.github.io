---
id: glsl-float-precision
source: 479fa6e690cb174ded7e5d75567753fbcbc0633d6a9537643b6f4f91f0394441
sourceLine: 1201
---

GLSL ES 3.00 백엔드는 `precision highp float;`를 생성합니다. mediump로 충분한 곳에 highp를
쓰면 모바일 GPU가 실제로 대역폭과 전력을 낭비하게 되므로, `emitGlslModule`과
`emitGlslStages`는 **빌드 시점** 옵션을 받습니다.

```ts
const fs = emitGlslModule(m, 'fragment', { floatPrecision: 'mediump' })
```

`'highp'`가 기본값이며, 이때는 생성되는 바이트가 하나도 바뀌지 않습니다. 옵션을 생략하면 백엔드가
지금까지 늘 생성해 온 바이트와 정확히 같은 바이트를 얻습니다.

**주의: 이 옵션을 쓰기 전에 반드시 읽어야 합니다.**

- **스테이지 전체에 적용되는 기본값이므로 위치와 좌표에도 그대로 걸립니다.** mediump는
  fp16과 비슷한 정밀도로, ±65504 범위에서 유효 숫자가 약 3자리뿐입니다. 투영된 지도
  좌표는 이 정밀도로 버티지 못합니다. f32조차 깊은 줌 단계에서 이미 무너지며, 이것이
  df64 에뮬레이션이 존재하는 바로 그 이유입니다(위 §7, 그림은
  `examples/fp64-deep-zoom.ts` 참고). 이 옵션은 출력이 범위가 좁고 다이내믹 레인지가
  낮은 색상인 **프래그먼트 색상 계열 셰이더에만** 쓰십시오. 위치나 타일·월드 좌표, df64
  레인을 계산하는 스테이지에는 절대 쓰면 안 됩니다.
- **float 줄에만 영향을 미칩니다.** `precision highp int;`는 그대로 highp로 남습니다.
  스토리지 버퍼를 데이터 텍스처로 에뮬레이션할 때 쓰는 인덱스 연산도, 비트캐스트 레인도
  int 전체 범위가 필요하기 때문입니다. `precision highp sampler2DArray;` 줄도
  마찬가지로 highp를 유지합니다(§4.5.4에서 다루는 별개의 요구 사항입니다).
- **빌드 시점 옵션이며, 런타임에 기기를 검사해 정하는 값이 아닙니다.** 생성된 GLSL은
  `shaderRequestKey` 아래에 캐시되는데, 이 키에는 정밀도 성분이 없습니다. 그래서
  정밀도를 런타임에 바꾼다면 highp를 요청했는데 mediump 프로그램이 돌아오는 상황이
  생깁니다.
- **CI는 수치상의 효과를 판정하지 못하며, 판정할 수 있는 척하지도 않습니다.**
  `playground/e2e/_glsl-compile-gate.spec.ts`에 있는 측정은 CI 래스터라이저
  (ANGLE/SwiftShader, Vulkan 1.3)를 대상으로 삼았습니다. `getShaderPrecisionFormat`은
  MEDIUM_FLOAT를 `{rangeMin: 15, rangeMax: 15, precision: 10}`로 **알려 줍니다**.
  HIGH_FLOAT의 `{127, 127, 23}`과 비교하면, MEDIUM_FLOAT의 이 수치는 사실상 fp16이라고
  주장하는 셈입니다.
  그런데 그 자리에서 `precision mediump float;`로 컴파일한 셰이더는 실제로는
  **f32처럼 동작합니다**. 탐침 식 `((1.0 + 2⁻¹²) − 1.0) × 4096.0`이 mediump 쪽에서
  255를 내며(값이 살아남았다는 뜻입니다), highp 대조군과 완전히 같습니다. (스택이
  mediump를 f32 이상의 정밀도로 계산하거나, 컴파일러가 `(1+ε)−1` 식을 재결합했을
  가능성이 있습니다. GLSL ES 3.00에는 이를 금지하는 `precise` 한정자가 없습니다. 어느
  쪽이든 바깥에서는 구분할 수 없으며, ANGLE/SwiftShader의 어느 계층이 원인인지도 알 수
  없습니다.) 정밀도 포맷은 어디까지나 선언된 **최솟값**입니다. 어느 경우든 CI의 픽셀
  게이트로는 highp로 생성한 결과와 mediump로 생성한 결과를 구분할 수 없습니다. 여기
  있는 게이트는 **헤더 모양**(단위 테스트)과 **컴파일·링크 유효성**(Playwright)만
  확인합니다. 실제 기기에서 mediump가 어떻게 동작하는지, 곧 실제로 대역폭을 얼마나
  아끼는지, 밴딩이 생기는지, 범위가 잘리는지는 **의도적으로 건너뛰며**, 실제 모바일
  기기에서만 확인할 수 있습니다.
