---
id: migrating-a-glsl-shader
source: 1237c505d6cb1995bb61c9d18c80b91c924bd86bfa30d68020d9bd87fbc83726
sourceLine: 2559
---

이 페이지를 다 읽으면 눈앞의 GLSL 구성 요소를 두고 DSL에서 어떻게 표기하는지 찾아본 다음,
그 표기가 각 타깃에서 무엇으로 바뀌는지 바로 확인할 수 있습니다. 이 가이드의 나머지 절은
새 셰이더를 처음부터 작성하는 사람을 기준으로 순서를 잡았습니다. 반면 이 페이지는 이미
동작하는 GLSL ES 3.00 셰이더를 손에 들고 각 줄이 무엇으로 바뀌는지 묻는 사람을 기준으로
삼았습니다.

### 구성 요소 대응표

여기서 말하는 구성 요소란 유니폼 블록, 전처리기 분기, `#include`, 확장 지시문처럼 반드시
챙겨야 하는 GLSL 소스 조각 하나하나를 뜻합니다. 해당하는 행을 찾아 표기법을 따라 설명
페이지로 이동하고, 무엇이 달라지는지는 설명 칸에서 확인하십시오.

| GLSL 구성 요소 | DSL 표기법 | WGSL 결과 | 설명 |
| --- | --- | --- | --- |
| 이 모듈이 소유하는 `uniform Block { … }` | [`uniformStruct`](/guide/authoring/layouts-and-resources/) | `@group`/`@binding` `var<uniform>` | std140 레이아웃은 `reflect()`에서 얻으므로 오프셋을 직접 계산할 필요가 없습니다 |
| 호스트 프리앰블이 이미 선언해 둔 `uniform float u_x;` | `externVar` | 같은 참조를 타깃별 표기로 | 아무것도 생성하지 않으며 `reflect().requires`에 나타납니다 |
| 이 모듈이 선언하고 호스트가 소유하는 `uniform float u_x;` | `hostUniform` | `@group`/`@binding` `var<uniform>` | GLSL은 블록으로 묶지 않고 느슨한 기본 유니폼 하나로 생성되며, `reflect()`는 이를 `owner: 'host'`로 표시합니다 |
| 호스트가 소유하는 블록 전체 | `hostBlock` | `@group`/`@binding` `var<uniform>` 하나 | `glsl: 'loose'`는 멤버마다 유니폼 하나씩으로 펼치고, IR에서 `blk.field`를 `field`로 다시 씁니다. 기본값인 `'std140-block'`은 블록을 그대로 유지합니다. 호스트 바인드 그룹은 하나의 단위이므로 WGSL은 어느 쪽이든 블록을 유지합니다 |
| 호스트가 제공하는 함수 | `externFn` | 두 타깃 모두에서 같은 호출 | 호출 지점에서 타입이 정해지며, 선언은 생성되지 않습니다 |
| `#ifdef FEATURE`: 이 모듈이 결정하는 경우 | [빌더 매개변수와 평범한 `if`](/guide/authoring/conditional-programs/) | 전처리기 없음 | 선택되지 않은 분기는 아예 빌드되지 않으므로 그 바인딩도 선언되지 않습니다 |
| `#ifdef FEATURE`: 호스트가 결정하는 경우 | [`variantFamily`](/guide/authoring/conditional-programs/) | 행렬의 각 지점마다 모듈 하나씩 | `emitGuarded`는 define을 소유한 GLSL 호스트를 위해, 조건이 줄줄이 이어지는 `#if` ladder를 생성하며, 각 분기는 독립된 변형과 바이트 단위로 동일합니다. `#include` 안에 들어가는 ladder가 필요하면 `emitGuardedFragment`가 같은 ladder를 프리앰블과 함께 데이터로 돌려줍니다 |
| 값 하나만 달라지는 변형 | [`overrideConst`와 `overrideValues`](/guide/authoring/conditional-programs/) | `override`와 파이프라인 상수 | 이런 경우 별도 변형을 만들면 파이프라인만 쓸데없이 늘어납니다 |
| `#include "helper.glsl"` | [`emitGlslFragment`와 `emitFragment`](/guide/authoring/emitting-and-reflection/) | 호스트가 이어 붙이는 모듈 조각 | 헤더는 데이터인 `preamble`로 돌아옵니다 |
| 모듈 하나 안에 있는 문 수준의 변형 슬롯 | [`composeModule`과 `placeholder`](/guide/authoring/conditional-programs/) | 동일 | 문 수준 슬롯만 지원하므로 `#include`를 대신하지 못합니다 |
| 선언 하나에 붙는 `precision highp …` | `hostUniform`의 `precision` 옵션 | 없음(WGSL에는 정밀도 한정자가 없습니다) | [스테이지 프리앰블](/guide/authoring/glsl-float-precision/)이 기본값이며, 이 옵션은 호스트 프로그램에 합쳐 넣는 조각을 위한 것입니다 |
| `usampler2D` and `isampler2D` | [`texture2duT`와 `texture2diT`](/guide/authoring/layouts-and-resources/) | `texture_2d<u32>` and `texture_2d<i32>` | 샘플러 정밀도 줄은 자동으로 생성됩니다 |
| `#extension … : require` | [`enables`](/guide/authoring/capabilities-extensions/) | `enable …;` | 프로필에 이 기능의 행이 없는 백엔드에서는 컴파일 시점에 미리 실패해 드라이버가 거부할 소스를 애초에 내보내지 않습니다. 이런 동작을 fail closed라고 부르며, SD0030으로 실패합니다. 어떤 기능이 WGSL에서 살아남는지도 그 페이지에서 설명합니다 |
| 옵티마이저 패스를 거친 뒤 두 생성 결과를 비교하는 경우 | [`semanticDiff`](/guide/authoring/production-emit/) | 동일 | IR과 리플렉션을 비교하므로 폴딩이나 이름 변경 때문에 diff가 흐려지지 않습니다. 운영 플러그인을 `transforms`로 선언해 두면 그 재작성 결과가 `explained`로 분류됩니다 |

이 모듈이 소유하는 블록은 가장 자주 마주치는 첫 행입니다. `uniformStruct`는 WGSL 타입
이름과 슬롯, 필드 맵을 받아 타입이 맞는 필드 접근을 돌려줍니다.

```ts
import { mat4x4fT, uniformStruct, vec2fT } from '@xgis/shader-dsl'

// uniform Camera { mat4 u_matrix; vec2 u_viewport_px; } u_camera;
const camera = uniformStruct(
  'Camera',
  { group: 0, binding: 0, as: 'u_camera' },
  { u_matrix: mat4x4fT, u_viewport_px: vec2fT },
)

const mvp = camera.field.u_matrix
```

### 내장값

내장값이란 하드웨어가 스테이지에 공급하는 값을 말합니다. DSL이 이 값들에 쓰는 어휘는
WGSL의 어휘이며, 닫힌 유니온 타입인 `WgslBuiltinName`으로 타입이 정해집니다. 따라서
`gl_*` 식 표기나 오타를 쓰면 그 유니온 타입을 가리키는 `tsc` 오류가 납니다. 각 백엔드는
그 뒤에 해당 id를 자기 방식대로 표기합니다.

| GLSL 전역 변수 | DSL 표기법 | 설명 |
| --- | --- | --- |
| `gl_Position` | 버텍스 출력에 쓰는 `builtin('position', vec4fT)` | GLSL에서는 `gl_Position`을 씁니다 |
| `gl_FragCoord` | 프래그먼트 입력에 쓰는 `builtin('position', vec4fT)` | GLSL에서는 `gl_FragCoord`를 읽습니다. y축 원점에 주의해야 합니다. GL 윈도우 좌표는 왼쪽 아래가 원점이고 WGSL 프레임버퍼 좌표는 왼쪽 위가 원점이므로, `.y`를 쓰기 전에 타깃별로 뒤집거나 y 대칭 값을 미리 유도해야 합니다 |
| `gl_VertexID` | `builtin('vertex_index', u32T)` | GLSL에서는 읽을 때 `uint(gl_VertexID)`로 감쌉니다. DSL에서는 u32 타입이지만 GLSL 쪽은 int이기 때문입니다 |
| `gl_InstanceID` | `builtin('instance_index', u32T)` | 마찬가지로 `uint()`로 감쌉니다 |
| `gl_FrontFacing` | `builtin('front_facing', boolT)` | |
| `gl_FragDepth` | 반환 속성으로 쓰는 `builtin('frag_depth', f32T)` | |
| `gl_PointSize` and `gl_PointCoord` | 두 생성기 모두 지원하지 않음 | 포인트 크기 상한은 벤더마다 다르며, WebGPU의 점 프리미티브는 항상 한 픽셀입니다. 버텍스 스테이지에서 인스턴스 쿼드를 확장하고 모서리 uv를 `@location(n)`으로 보간하십시오 |
| float `mod(x, y)` | 독립 함수 `mod()` | 이는 floor-mod입니다. `.mod()`와 `%`는 trunc-mod로, WGSL의 의미론이며 GLSL에서도 이식 가능하게 표기할 수 있습니다. 음수 피연산자에서 어떤 의미를 원하는지에 따라 골라 쓰면 됩니다 |

프래그먼트 스테이지는 버텍스 스테이지가 쓰는 것과 같은 `position` 내장값을 통해
프레임버퍼 좌표를 읽습니다.

```ts
import { builtin, f32, fn, vec4, vec4fT } from '@xgis/shader-dsl'

const fsCoord = fn(
  'fs_coord',
  { pos: builtin('position', vec4fT) },
  (p) => vec4(p.pos.x.mul(0.001), p.pos.y.mul(0.001), f32(0), f32(1)),
  { stage: 'fragment', retAttr: '@location(0)' },
)
```

### 호스트가 소유하는 선언

위 표의 행 가운데 네 개는 결국 같은 질문을 다룹니다. 심볼을 누가 선언하고, 그 심볼이
가리키는 메모리는 누가 소유하는가라는 질문입니다. `externVar`는 호스트 프리앰블이 이미 선언해 둔
심볼을 위한 것입니다. 아무것도 생성하지 않고 타입이 맞는 참조를 돌려주며, 타깃별
`spelling`을 받으므로 값을 다르게 노출하는 호스트로 옮길 때는 그 맵만 바꾸면 됩니다.
`externFn`은 본문이 다른 곳에 정의되어 있고 생성 시점에 링크되는 호출 가능한 대상을
전방 선언합니다. 그래서 호출은 타입이 정해지고 선언은 생성되지 않습니다. `hostUniform`과
`hostBlock`은 이 모듈이 선언하지만 저장 공간은 호스트가 소유하는 심볼을 위한 것이므로,
선언을 생성하고 리플렉션에서 `owner: 'host'`로 표시합니다.

`hostBlock`은 GLSL 호스트가 강제하는 선택도 함께 담습니다. 프리앰블은 std140 블록이나
느슨한 유니폼 가운데 하나만 제공하며, 잘못 고르면 링크되지 않기 때문입니다.

```ts
import { hostBlock, mat4x4fT, vec2fT } from '@xgis/shader-dsl'

const camera = hostBlock(
  'CameraUniforms',
  { group: 0, binding: 0, as: 'u_camera' },
  { u_matrix: mat4x4fT, u_viewport_px: vec2fT },
  { glsl: 'loose' },
)

camera.field.u_matrix // emits `u_matrix` on GLSL, `u_camera.u_matrix` on WGSL
```

`u_camera.u_matrix`를 `u_matrix`로 바꾸는 재작성은 생성 이전에 IR 위에서 일어나므로,
관련 없는 부분 문자열을 건드릴 일이 없고 `minify()`를 거쳐도 그대로 살아남으며
`reflect()`도 실제로 생성된 내용을 정확히 설명합니다. 느슨한 블록의 멤버는 스칼라,
벡터, 행렬이어야 하며, 그렇지 않은 멤버를 선언하면 `hostBlock`이 SD0016을 던집니다.
이름은 다른 느슨한 블록의 이름과도 겹치면 안 됩니다. 펼치는 과정에서 모든 멤버가
하나의 네임스페이스에 놓이기 때문입니다. 이 충돌은 GLSL 생성기가 실행될 때 잡히며,
두 블록의 이름을 모두 알려 주는 SD0030으로 나타납니다.

### WebGL2만 타깃으로 삼기

이 페이지의 어떤 내용도 GLSL 생성기가 표현할 수 있는 범위를 좁히지 않습니다. 중립
이름은 어디까지나 표기법일 뿐이며, 그 뒤에 있는 규칙 몇 가지는 오히려 WebGL2 출력을
더 명확하게 정의하려고 존재합니다. `round`는 `roundEven`을 생성하고, float `%`는
GLSL ES 3.00이 컴파일하는 trunc-mod를 생성합니다.

중립 표면이 다루지 못하는 GLSL 구성 요소에는 [`rawStmt`](/guide/authoring/raw-statements/)가
있어 한 타깃만을 위한 페이로드를 받으며, `fn()` 본문 안에서는 `b.raw`가 같은 페이로드를
받습니다. 위 표의 point-size 행이 바로 이런 경우입니다. 그 내장값에는 중립 표기가
없지만, WebGL2 전용 빌드라면 여전히 쓸 수 있습니다. GLSL 생성기는 페이로드를 그대로
이어 붙이며, 그 모듈에서 WGSL 생성기가 실행되는 일이 생기면 해당 문에서 fail closed로
실패합니다.

```ts
import { f32, f32T, fn } from '@xgis/shader-dsl'

const sized = fn('sized', {}, f32T, (_p, b) => {
  b.raw({ glsl: 'gl_PointSize = 4.0;' })
  return f32(1)
})
```

오늘은 WebGPU를 배제하지만 나중에 다시 쓰고 싶어질 수도 있는 경우, 이런 형태를 쓰면
됩니다. raw 문 하나가 나머지 모듈에 어떤 대가를 치르게 하는지는
[raw 문](/guide/authoring/raw-statements/) 페이지에서 설명합니다.
