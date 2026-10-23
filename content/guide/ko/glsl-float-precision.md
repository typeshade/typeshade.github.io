---
id: glsl-float-precision
source: bd5e9af82e5add18f38e3dc938af31cb8b12885c72fb21963a045d109a4eb7e7
sourceLine: 2188
---

이 페이지는 GLSL 생성 옵션의 mediump 사용 기준, 생성 소스에서 바뀌는 부분, 유지되는 헤더 선언을 설명한다.

GLSL ES 3.00은 float의 암묵적 정밀도가 없으므로 생성 소스에 정밀도를 선언한다. 백엔드는 각 스테이지 맨 위에 `precision highp float;`를 추가하며, 스테이지의 모든 float가 이를 따른다. 모바일 GPU에서는 highp 연산과 highp varying이 대역폭과 전력을 더 사용한다. 언어에서 이 비용을 줄이는 수단은 정밀도 한정자이므로 GLSL 생성 옵션으로 선택할 수 있다.

### floatPrecision 옵션

`emitGlslModule`과 `emitGlslStages`는 옵션 객체에서 `floatPrecision` 값으로 `'highp'`나
`'mediump'`를 받는다.

```ts
import { emitGlslModule } from 'typeshade'

const fs = emitGlslModule(m, 'fragment', { floatPrecision: 'mediump' })
```

기본값은 `'highp'`이며, 옵션을 생략한 결과와 명시한 결과는 바이트 단위로 같다. `'mediump'`를 전달하면 생성 결과에서 float 선언 줄의 한정자 토큰만 바뀐다.

정밀도는 빌드 시점의 생성 옵션이다. 실제 실행 기기를 런타임에 확인해 자동으로 선택하지 않는다. 생성 소스를 캐시할 때는 정밀도를 캐시 키에 반드시 포함해야 한다. 누락하면 highp를 요청한 호출에 mediump 프로그램을 반환할 수 있다.

### 스테이지 전체 기본값이 다루는 범위

mediump는 대략 fp16에 해당하며 유효 숫자는 약 세 자리, 범위는 ±65504 정도이다. 기본값은 스테이지 전체에 적용되어 위치, 월드 단위 값, varying, 모든 중간값에 영향을 준다. 월드 위치처럼 유효 숫자가 세 자리 넘게 필요한 값은 mediump에서 정밀도를 잃는다. f32도 일곱 자리를 넘으면 정밀도를 잃으며, [fp64](/guide/authoring/fp64/) 에뮬레이션은 이 문제에 사용한다.

출력이 제한된 범위의 색상이고 다이내믹 레인지가 낮은 스테이지에는 mediump를 사용한다. 위치, 월드 단위 값, f64 값을 계산하는 스테이지는 highp로 유지해야 한다. 옵션은 생성 호출마다 적용되므로 같은 프로그램의 버텍스와 프래그먼트 스테이지에 서로 다른 한정자를 사용할 수 있다.

```ts
import { emitGlslModule } from 'typeshade'

const vertex = emitGlslModule(m, 'vertex') // positions stay highp
const fragment = emitGlslModule(m, 'fragment', { floatPrecision: 'mediump' })
```

`emitGlslStages(m, opts)`는 같은 옵션을 두 스테이지에 적용한다. 두 스테이지에 같은 한정자를 사용하면서 공통 하향 변환(lowering)을 한 번만 수행할 때 사용한다.

### highp로 남는 부분

옵션은 float 정밀도 선언 줄만 변경한다. 헤더의 다른 두 정밀도 선언은 컴파일 결과에 필요하므로 설정과 무관하게 highp로 유지한다.

그중 하나는 `precision highp int;`이다. GLSL ES 3.00 프래그먼트 셰이더에는 int의 기본 정밀도가 없으므로 이 선언이 반드시 필요하다. 데이터 텍스처의 스토리지 버퍼 인덱스 계산과 비트캐스트의 정수 부분도 int의 전체 범위가 필요하다. 여기서 정밀도를 낮추면 결과가 잘못된다.

다른 하나는 샘플러 선언이다. GLSL ES 3.00은 `sampler2D`와 `samplerCube`에만 기본 정밀도를 정의한다. 따라서 `sampler2DArray`, `usampler2D`, `isampler2DArray`를 선언하는 모듈은 사용하는 타입마다 `precision highp <type>;` 선언이 필요하다. `precision highp float;`로는 이를 대신할 수 없다. 이 선언이 없으면 컴파일할 수 없으므로 한정자를 유지한다. `sampler2DArray`를 샘플링하는 프래그먼트 스테이지를 mediump로 생성한 헤더는 다음과 같다.

```glsl
#version 300 es
precision mediump float;
precision highp int;
precision highp sampler2DArray;
```

### CI 실행으로는 알 수 없는 것

빌드는 이 옵션에 대해 두 가지를 확인할 수 있다. 헤더의 모양은 백엔드의 단위 테스트가
고정해 둔다. 소스가 컴파일되고 링크되는지는 실제 드라이버만 답할 수 있는데, 두 설정은
토큰 하나만 다를 뿐 똑같이 통과한다.

수치 결과의 차이는 별도로 확인해야 하며, 데스크톱 래스터라이저만으로 판단할 수 없다. 어떤 스택은 `getShaderPrecisionFormat`에서 mediump를 10비트 포맷으로 보고하면서 실제로는 f32로 계산한다. 이 경우 비트 손실을 예상한 검사 셰이더도 highp와 같은 결과를 반환한다. 이런 동작과 컴파일러의 연산 순서 변경은 모두 허용된다. GLSL ES 3.00에는 연산 순서 재결합(reassociation)을 금지하는 한정자가 없으므로 드라이버 외부에서는 두 경우를 구별할 수 없다. CI 픽셀 비교만으로는 mediump와 highp 생성 결과를 구별할 수 없다. 대역폭 이득, 밴딩, 범위 초과 현상은 실제 모바일 하드웨어에서 확인해야 한다.

빌드가 확인할 수 있는 것은 이 옵션이 한 줄만 바꾸고 나머지 생성 결과는 그대로 두었다는
사실뿐이다.

```ts
import { emitGlslModule } from 'typeshade'

const highp = emitGlslModule(m, 'fragment')
const mediump = emitGlslModule(m, 'fragment', { floatPrecision: 'mediump' })

mediump.replace('precision mediump float;', 'precision highp float;') === highp // true
```

정밀도 옵션은 실제 실행 기기를 기준으로 결정한다. 색상 스테이지를 mediump로 생성한 뒤 출시 대상 휴대전화에서 결과를 확인하고, 좌표를 계산하는 부분은 highp로 유지해야 한다.
