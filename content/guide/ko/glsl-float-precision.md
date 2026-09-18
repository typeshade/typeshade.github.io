---
id: glsl-float-precision
source: bd5e9af82e5add18f38e3dc938af31cb8b12885c72fb21963a045d109a4eb7e7
sourceLine: 2188
---

이 절을 읽고 나면 GLSL 스테이지를 언제 mediump로 생성해야 하는지, 이 옵션 하나가 생성된
소스에서 무엇을 바꾸는지, 헤더의 어느 부분은 그대로 남겨 두는지 알 수 있습니다.

GLSL ES 3.00은 float에 암묵적인 정밀도를 두지 않으므로, 생성된 소스가 정밀도를 직접
선언합니다. 백엔드는 모든 스테이지 맨 위에 `precision highp float;`를 적어 넣고, 그
스테이지 안의 모든 float가 이 정밀도를 따릅니다. 모바일 GPU에서는 highp 연산과 highp
varying이 대역폭과 전력을 실제로 더 씁니다. 언어가 이 비용을 줄일 수단으로 주는 것은
정밀도 한정자뿐이라, GLSL 생성 옵션에 한정자를 고르는 옵션을 두었습니다.

### floatPrecision 옵션

`emitGlslModule`과 `emitGlslStages`는 옵션 객체에서 `floatPrecision` 값으로 `'highp'`나
`'mediump'`를 받습니다.

```ts
import { emitGlslModule } from 'typeshade'

const fs = emitGlslModule(m, 'fragment', { floatPrecision: 'mediump' })
```

기본값은 `'highp'`이며, 옵션을 생략해도 직접 넘겼을 때와 바이트 하나 다르지 않은 소스를
얻습니다. `'mediump'`를 넘기면 생성 결과 전체에서 토큰 하나, float 줄의 한정자만
바뀝니다.

정밀도는 빌드 시점에 정합니다. 생성 옵션일 뿐이므로, 프로그램이 실제로 돌아갈 기기를
런타임에 살펴서 고르지는 않습니다. 생성된 소스를 캐시한다면 정밀도를 반드시 캐시 키에
넣으십시오. 정밀도를 뺀 키를 쓰면 highp를 요청한 호출자에게 mediump 프로그램이 돌아갈 수
있습니다.

### 스테이지 전체 기본값이 다루는 범위

mediump는 대략 fp16에 해당하며, 유효 숫자는 약 세 자리이고 범위는 ±65504 정도입니다. 이
기본값은 스테이지 전체에 적용됩니다. 위치, 월드 단위 값, varying은 물론 스테이지 안의 모든
중간값이 영향을 받는데, 그 가운데는 옵션을 고를 때 미처 생각하지 못한 값도 있습니다. 유효
숫자가 세 자리 넘게 필요한 값, 예를 들어 월드 단위로 나타낸 위치는 mediump에서 살아남지
못합니다. f32도 값이 일곱 자리를 넘어서면 정밀도를 잃으며,
[fp64](/guide/authoring/fp64/) 에뮬레이션이 있는 이유도 여기에 있습니다.

출력이 정해진 범위 안의 색상뿐이고 다이내믹 레인지가 낮은 스테이지에는 mediump를
쓰십시오. 위치, 월드 단위 값, f64 값을 계산하는 스테이지는 highp로 유지하십시오. 이
옵션은 생성 호출마다 따로 적용되므로, 같은 프로그램이라도 버텍스 스테이지와 프래그먼트
스테이지에서 서로 다른 한정자를 쓸 수 있습니다.

```ts
import { emitGlslModule } from 'typeshade'

const vertex = emitGlslModule(m, 'vertex') // positions stay highp
const fragment = emitGlslModule(m, 'fragment', { floatPrecision: 'mediump' })
```

`emitGlslStages(m, opts)`는 같은 옵션 객체를 받아 두 스테이지 모두에 적용합니다. 두
스테이지에 같은 한정자를 쓰고 싶고, 두 스테이지가 공유하는 하향 변환(lowering)도 한 번만
치르고 싶다면 이 함수를 쓰십시오.

### highp로 남는 부분

이 옵션이 손대는 곳은 float 줄뿐입니다. 헤더의 다른 두 정밀도 줄은 컴파일 결과를
좌우하므로 어느 설정에서든 highp로 남습니다.

그중 하나가 `precision highp int;`입니다. GLSL ES 3.00 프래그먼트 셰이더는 int에 기본
정밀도가 아예 없으므로 이 줄은 반드시 있어야 합니다. 데이터 텍스처를 거쳐 스토리지 버퍼를
읽는 인덱스 계산도, 비트캐스트의 정수 쪽 절반도 int의 전체 범위가 있어야 맞게 동작합니다.
여기서 정밀도를 낮추면 대역폭을 아끼려던 선택이 틀린 결과를 만듭니다.

다른 하나는 샘플러 줄입니다. GLSL ES 3.00은 `sampler2D`와 `samplerCube`에만 기본
정밀도를 미리 선언해 두므로, `sampler2DArray`나 `usampler2D`, `isampler2DArray`를
선언하는 모듈에는 사용하는 샘플러 타입마다 `precision highp <type>;` 줄이 하나씩 들어가며,
`precision highp float;`가 이 줄들을 대신하지는 못합니다. 이 줄들은 없으면 컴파일이 되지
않으므로 한정자도 그대로 둡니다. `sampler2DArray` 하나를 샘플링하는 프래그먼트
스테이지를 mediump로 생성하면 다음과 같이 시작합니다.

```glsl
#version 300 es
precision mediump float;
precision highp int;
precision highp sampler2DArray;
```

### CI 실행으로는 알 수 없는 것

빌드는 이 옵션에 대해 두 가지를 확인할 수 있습니다. 헤더의 모양은 백엔드의 단위 테스트가
고정해 둡니다. 소스가 컴파일되고 링크되는지는 실제 드라이버만 답할 수 있는데, 두 설정은
토큰 하나만 다를 뿐 똑같이 통과합니다.

수치가 실제로 어떻게 달라지는지는 별개의 질문이고, 데스크톱 래스터라이저로는 답을 얻지
못합니다. 예를 들어 어떤 스택은 `getShaderPrecisionFormat`으로는 mediump가 10비트
포맷이라고 보고하면서 정작 mediump 셰이더는 f32로 계산합니다. 그래서 비트 하나를 잃어야
정상인 검사 셰이더가 highp와 같은 답을 돌려줍니다. GPU 스택이 이렇게 동작하는 것은 허용된
일이고, 셰이더 컴파일러가 검사 셰이더의 연산 순서를 바꾸는 것도 허용됩니다. GLSL ES
3.00에는 연산 순서 재결합(reassociation)을 금지하는 한정자가 없기 때문입니다. 그래서
드라이버 바깥에서는 두 경우를 구분할 수 없습니다. 여기서 꼭 기억해 둘 점이 있습니다.
CI에서 픽셀을 아무리 비교해도 mediump로 생성한 결과와 highp로 생성한 결과를 가려낼 수
없습니다. 대역폭 이득, mediump가 일으킬 수 있는 밴딩, 범위가 잘리는 현상은 모두 실제
모바일 하드웨어에서만 확인할 수 있습니다.

빌드가 확인할 수 있는 것은 이 옵션이 한 줄만 바꾸고 나머지 생성 결과는 그대로 두었다는
사실뿐입니다.

```ts
import { emitGlslModule } from 'typeshade'

const highp = emitGlslModule(m, 'fragment')
const mediump = emitGlslModule(m, 'fragment', { floatPrecision: 'mediump' })

mediump.replace('precision mediump float;', 'precision highp float;') === highp // true
```

그러니 이 옵션은 손에 쥔 실제 기기를 보고 정하십시오. 색상 스테이지는 mediump로 생성해서
실제로 출시할 폰에서 눈으로 확인하고, 좌표가 흐르는 곳에는 어디든 highp를 유지하십시오.
