---
id: glsl-float-precision
source: 5d9a3f24f4b323ac96a8a13b47e73cee9427455d5d5c8c2d8bab3787039fbc5c
sourceLine: 2080
---

이 절을 읽고 나면 GLSL 스테이지를 언제 mediump로 생성해야 하는지, 이 옵션 하나가 생성된
소스에서 무엇을 바꾸는지, 헤더의 어느 부분은 그대로 남겨 두는지 알 수 있습니다.

GLSL ES 3.00은 float에 암묵적인 정밀도를 두지 않으므로, 생성된 소스가 정밀도를 직접
선언합니다. 백엔드는 모든 스테이지 맨 위에 `precision highp float;`를 적어 넣고, 그
스테이지 안의 모든 float가 이 정밀도를 따릅니다. 모바일 GPU는 highp 연산과 highp
varying에 실제로 대역폭과 전력을 소모하는데, 언어가 이를 조절할 수단으로 주는 것은
정밀도 한정자뿐입니다. 그래서 GLSL 생성 옵션에도 이를 위한 값이 마련되어 있습니다.

### floatPrecision 옵션

`emitGlslModule`과 `emitGlslStages`는 옵션 객체에서 `floatPrecision` 값으로 `'highp'`나
`'mediump'`를 받습니다.

```ts
import { emitGlslModule } from '@xgis/shader-dsl'

const fs = emitGlslModule(m, 'fragment', { floatPrecision: 'mediump' })
```

`'highp'`가 기본값이며 바이트 수준에서 차이를 전혀 만들지 않습니다. 옵션을 생략해도 값을
직접 넘겼을 때와 정확히 같은 바이트를 얻습니다. `'mediump'`는 생성된 전체 코드에서 딱
하나의 토큰, 곧 float 줄의 한정자만 바꿉니다.

이 선택은 빌드 시점에 이루어집니다. 생성 옵션이므로 프로그램이 실제로 돌아갈 기기를
런타임에 검사해서 정하는 값이 아닙니다. 생성된 소스를 캐시한다면 정밀도를 반드시 캐시
키에 포함시켜야 합니다. 정밀도를 뺀 키를 쓰면 highp를 요청한 호출자에게 mediump
프로그램이 돌아갈 수 있습니다.

### 스테이지 전체 기본값이 다루는 범위

mediump는 대략 fp16에 해당하며, 유효 숫자는 약 세 자리이고 범위는 ±65504 정도입니다. 이
기본값은 스테이지 전체에 적용되므로 위치, 타일·월드 좌표, varying은 물론 이 옵션을 고를
때는 미처 생각하지 못했을 스테이지 안의 다른 중간값까지 모두 영향을 받습니다. 투영된
지도 좌표는 세 자리 정밀도로는 버티지 못합니다. f32조차 깊은 줌 단계에서 이미 무너지며,
[fp64](/guide/authoring/fp64/) 에뮬레이션이 존재하는 이유도 바로 여기에 있습니다.

출력이 범위가 정해져 있고 다이내믹 레인지가 낮은 색상인 스테이지에는 mediump를
쓰십시오. 위치, 타일·월드 좌표, f64 레인을 계산하는 스테이지는 highp로 유지하십시오. 이
옵션은 생성 호출마다 따로 적용되므로, 같은 프로그램이라도 버텍스 스테이지와 프래그먼트
스테이지에서 서로 다른 한정자를 쓸 수 있습니다.

```ts
import { emitGlslModule } from '@xgis/shader-dsl'

const vertex = emitGlslModule(m, 'vertex') // positions stay highp
const fragment = emitGlslModule(m, 'fragment', { floatPrecision: 'mediump' })
```

`emitGlslStages(m, opts)`는 같은 옵션 객체를 받아 두 스테이지 모두에 적용합니다. 두
스테이지에 같은 한정자를 적용하고, 한 번만 치르면 되는 공유 하향 변환까지 함께 얻고
싶다면 이 함수를 쓰십시오.

### highp로 남는 부분

이 옵션이 손대는 곳은 float 줄뿐입니다. 헤더에 있는 다른 두 정밀도 줄은 핵심적인 역할을
하므로 설정 값과 상관없이 항상 highp로 남습니다.

그중 하나가 `precision highp int;`입니다. GLSL ES 3.00 프래그먼트 셰이더는 int에 기본
정밀도가 아예 없으므로 이 줄은 반드시 있어야 하며, 스토리지 버퍼 에뮬레이션이 생성하는
인덱스 연산도 비트캐스트 레인도 int의 전체 범위를 필요로 합니다. 이 정밀도를 낮추면
대역폭을 아끼려던 선택이 잘못된 결과로 바뀌어 버립니다.

다른 하나는 샘플러 줄입니다. GLSL ES 3.00은 `sampler2D`와 `samplerCube`에만 기본
정밀도를 미리 선언해 두므로, `sampler2DArray`나 `usampler2D`, `isampler2DArray`를
선언하는 모듈은 쓰는 형태마다 별도의 `precision highp <type>;` 줄을 갖게 되고,
`precision highp float;`는 이 줄들을 대신해 주지 않습니다. 이런 줄은 컴파일에 반드시
필요하므로 한정자를 그대로 유지합니다. `sampler2DArray` 하나를 샘플링하는 프래그먼트
스테이지를 mediump로 생성하면 다음과 같이 시작합니다.

```glsl
#version 300 es
precision mediump float;
precision highp int;
precision highp sampler2DArray;
```

### CI 실행으로는 알 수 없는 것

빌드는 이 옵션에 대해 두 가지를 확인할 수 있습니다. 헤더 모양은 백엔드의 단위 테스트에
고정됩니다. 소스가 실제로 컴파일되고 링크되는지는 실제 드라이버가 답해야 할 질문이며,
두 설정 모두 토큰 하나만 빼면 똑같이 통과합니다.

수치상의 효과는 다른 질문이며, 데스크톱 래스터라이저는 이 질문에 답하지 못합니다.
실제로 어떤 스택은 `getShaderPrecisionFormat`으로 mediump를 10비트 포맷이라고 보고해
놓고도 정작 mediump 셰이더는 f32로 계산하므로, 한 비트만큼 정밀도가 낮아져야 정상인
탐침이 highp와 같은 값을 돌려줍니다. GPU 스택은 이렇게 동작해도 되고, 셰이더 컴파일러도
정밀도 탐침이 쓰는 연산을 재결합해도 됩니다. GLSL ES 3.00에는 재결합을 금지하는 한정자가
없기 때문이며, 그래서 드라이버 바깥에서는 두 경우가 똑같아 보입니다. 여기서부터가 꼭
기억해 둘 부분입니다. CI의 어떤 픽셀 비교로도 mediump로 생성한 결과와 highp로 생성한
결과를 구분할 수 없으므로, 대역폭 이득과 mediump가 만들어낼 수 있는 밴딩, 범위가 잘리는
현상은 모두 실제 모바일 기기에서만 확인할 수 있습니다.

빌드가 확실히 검증할 수 있는 것은, 이 옵션이 딱 한 줄만 바꾸고 나머지 생성 결과는
그대로 두었다는 사실입니다.

```ts
import { emitGlslModule } from '@xgis/shader-dsl'

const highp = emitGlslModule(m, 'fragment')
const mediump = emitGlslModule(m, 'fragment', { floatPrecision: 'mediump' })

mediump.replace('precision mediump float;', 'precision highp float;') === highp // true
```

그러므로 이 옵션은 손에 쥔 실제 기기를 두고 내리는 결정으로 다뤄야 합니다. 색상
스테이지는 mediump로 생성해서 실제로 출시할 폰에서 눈으로 확인하고, 좌표가 흐르는
곳에는 어디든 highp를 유지하십시오.
