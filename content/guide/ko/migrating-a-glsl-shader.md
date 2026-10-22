---
id: migrating-a-glsl-shader
source: bd506fa7fe28f1d9b75040fa4f164873fd11f101181d7f3c01aa56e8cf195659
sourceLine: 2903
rules: 6.6 qXyf0FpXuS4xir_HpHadSIsWFZT2WtMx8M-wm9BvJOE=, 12.3 CjhXTenX6H0V0STxt5Bka_Sp7X0GVUeCZR9Mt1IqNvA=
---

이 페이지를 마치면 눈앞의 GLSL 구문을 `"use typeshade"` 파일에서 어떻게 쓰는지 찾아보고, 그
표기가 각 타깃에서 무엇으로 바뀌는지 확인할 수 있습니다. 이 가이드의 나머지 페이지는 새 셰이더를
작성하는 사람을 기준으로 순서를 잡았습니다. 이 페이지는 이미 동작하는 GLSL ES 3.00 셰이더를 손에
들고 각 줄이 무엇이 되는지 묻는 사람을 기준으로 삼았습니다.

### 구문 대응표

여기서 말하는 구문은 옮길 때 하나하나 챙겨야 하는 GLSL 소스의 한 부분입니다. 유니폼 블록, 전처리기
분기, `#include`, 확장 지시문이 그런 예입니다. 해당하는 행을 찾아 표기 칸의 링크를 따라 설명
페이지로 가고, 무엇이 달라지는지는 설명 칸에서 확인하십시오.

| GLSL 구문                              | `"use typeshade"` 표기                                                                | WGSL 결과                               | 설명                                                                                                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uniform Block { … } name;`            | [`declare const name: uniform<Block>`](/guide/authoring/layouts-and-resources/)       | `@group`/`@binding` `var<uniform>`      | std140 레이아웃은 `reflect()`에서 얻으므로 오프셋을 손으로 셀 일이 없습니다                                                                                                                     |
| 따로 선언한 `uniform float u_x;`       | 유니폼 구조체의 필드                                                                  | `var<uniform>` 구조체의 필드            | `declare const u_x: uniform<f32>`는 WGSL 전용입니다. GLSL ES 3.00은 유니폼 바인딩을 std140 블록으로 표현하기 때문입니다                                                                         |
| 호스트 프리앰블이 선언한 심볼이나 블록 | 없음. IR 빌더의 `externVar`, `hostUniform`, `hostBlock`                               | 같은 참조를 타깃별 표기로               | [`docs/ir-builder.md`](docs/ir-builder.md)에 있습니다                                                                                                                                           |
| 함수 매개변수의 `in` / `out` / `inout` | 없음 / [`@out`, `@inout`](#a-function-that-changes-its-callers-variable)              | 포인터 매개변수                         | 한정자가 없는 매개변수가 곧 GLSL의 `in`입니다                                                                                                                                                   |
| 이 모듈이 결정하는 `#ifdef FEATURE`    | [변형마다 파일 하나](/guide/authoring/conditional-programs/)                          | 전처리기 없음                           | 바인딩을 선언하지 않는 변형에는 그 바인딩이 아예 없습니다                                                                                                                                       |
| 호스트가 결정하는 `#ifdef FEATURE`     | [`variantFamily`](/guide/authoring/conditional-programs/)                             | 행렬의 점마다 모듈 하나                 | `emitGuarded`는 define을 소유한 GLSL 호스트를 위해 `#if` ladder를 생성하며, 각 분기는 따로 만든 변형과 바이트 단위로 같습니다                                                                   |
| 값 하나만 달라지는 변형                | [`override<T>`와 `overrideValues`](/guide/authoring/conditional-programs/)            | `override`와 파이프라인 상수            | 이런 경우 별도 변형을 만들면 파이프라인만 쓸데없이 늘어납니다                                                                                                                                   |
| `#include "helper.glsl"`               | [다른 셰이더 파일에서 `import`](/guide/authoring/functions-and-entry-points/)         | 모듈 하나                               | 자기 프로그램을 조립하는 호스트에는 `emitGlslFragment`와 `emitFragment`가 모듈 조각을 돌려줍니다                                                                                                |
| `precision mediump float;`             | [생성 옵션 `floatPrecision`](/guide/authoring/glsl-float-precision/)                  | 없음. WGSL에는 정밀도 한정자가 없습니다 | 생성할 때 스테이지 전체의 기본값을 정합니다                                                                                                                                                     |
| `usampler2D` and `isampler2D`          | [`texture_2d<u32>`와 `texture_2d<i32>`](/guide/authoring/layouts-and-resources/)      | `texture_2d<u32>` and `texture_2d<i32>` | 샘플러 정밀도 줄은 알아서 생성됩니다                                                                                                                                                            |
| `#extension … : require`               | [그 기능이 필요한 쓰임, 또는 `"enable …"`](/guide/authoring/capabilities-extensions/) | `enable …;`                             | 프로필에 해당 행이 없는 백엔드에서는 SD0030으로 fail closed합니다. 드라이버가 거부할 소스를 내지 않고 컴파일 시점에 실패한다는 뜻입니다. 어떤 기능이 WGSL에서 살아남는지도 그 페이지에 있습니다 |
| 최적화 패스 뒤 두 생성 결과 비교       | [`semanticDiff`](/guide/authoring/production-emit/)                                   | 같음                                    | IR과 리플렉션을 비교하므로 폴딩이나 이름 변경에 diff가 묻히지 않습니다. 배포용 플러그인을 `transforms`로 선언하면 그 재작성은 `explained`로 분류됩니다                                          |

옮기기 시작할 때 가장 흔히 만나는 행은 이 모듈이 소유하는 블록입니다. 구조체와 바인딩을 선언하고,
필드는 이름으로 읽습니다.

```ts
"use typeshade";

interface Camera {
  u_matrix: mat4;
  u_viewport_px: vec2;
}

// uniform Camera { mat4 u_matrix; vec2 u_viewport_px; } u_camera;
declare const u_camera: uniform<Camera>;

@vertex
export function vs(@location(0) pos: vec2): vec4 {
  return u_camera.u_matrix * vec4(pos / u_camera.u_viewport_px, 0., 1.);
}
```

### 내장 값

내장 값은 하드웨어가 스테이지에 공급하는 값입니다. 이 값의 어휘는 WGSL의 것이며, 매개변수나
구조체 필드에 `@builtin("id")`로 적습니다. 그래서 `gl_*` 표기나 오타를 쓰면 TypeShade의 표기를
알려 주는 오류가 납니다. 각 백엔드는 그 뒤에 id를 자기 방식대로 표기합니다.

| GLSL 전역 변수                     | `"use typeshade"` 표기                             | 설명                                                                                                                                                                                                                 |
| ---------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gl_Position`                      | 버텍스 출력에 붙인 `@builtin("position")`          | GLSL에서는 `gl_Position`에 씁니다. 구조체 없이 `vec4`만 돌려주는 버텍스 진입점은 위치를 돌려줍니다                                                                                                                   |
| `gl_FragCoord`                     | 프래그먼트 입력에 붙인 `@builtin("position")`      | GLSL에서는 `gl_FragCoord`를 읽습니다. y축 원점에 주의하십시오. GL 윈도우 좌표는 왼쪽 아래가, WGSL 프레임버퍼 좌표는 왼쪽 위가 원점입니다. 그러니 `.y`를 쓰기 전에 타깃마다 뒤집거나, 위아래 대칭인 값을 계산하십시오 |
| `gl_VertexID`                      | `@builtin("vertex_index") vi: u32`                 | GLSL에서는 읽을 때 `uint(gl_VertexID)`로 감쌉니다. 인터페이스는 이 값을 u32로 두지만 GLSL에서는 int이기 때문입니다                                                                                                   |
| `gl_InstanceID`                    | `@builtin("instance_index") ii: u32`               | 마찬가지로 `uint()`로 감쌉니다                                                                                                                                                                                       |
| `gl_FrontFacing`                   | `@builtin("front_facing") front: bool`             |                                                                                                                                                                                                                      |
| `gl_FragDepth`                     | 반환 구조체의 필드에 붙인 `@builtin("frag_depth")` |                                                                                                                                                                                                                      |
| `gl_PointSize` and `gl_PointCoord` | 두 생성기 모두 지원하지 않음                       | 포인트 크기 상한은 벤더마다 다르며, WebGPU의 점 프리미티브는 항상 한 픽셀입니다. 버텍스 스테이지에서 인스턴싱한 쿼드를 펼치고, 모서리 uv는 `@location(n)`으로 넘겨 보간하십시오                                      |
| float `mod(x, y)`                  | 내장 함수 `mod()`                                  | 이쪽은 floor-mod입니다. `%`는 trunc-mod이며, WGSL의 의미이고 GLSL에서도 같은 뜻으로 생성됩니다. 음수 피연산자에서 원하는 의미에 따라 고르십시오                                                                      |

프래그먼트 스테이지는 버텍스 스테이지가 쓰는 바로 그 `position` 내장 값으로 프레임버퍼 좌표를 읽고,
깊이는 반환 구조체의 필드로 씁니다.

```ts
"use typeshade";

class FragOut {
  @location(0) color: vec4;
  @builtin("frag_depth") depth: f32;
}

@fragment
export function fsCoord(@builtin("position") pos: vec4): FragOut {
  return { color: vec4(pos.x * 0.001, pos.y * 0.001, 0., 1.), depth: 0.5 };
}
```

### WebGL2만 타깃으로 삼기

이 페이지의 어떤 내용도 GLSL 생성기가 표현할 수 있는 범위를 좁히지 않습니다. 중립 이름은 표기일
뿐이며, 그 뒤의 규칙 가운데 몇몇은 오히려 WebGL2 출력의 동작을 더 분명하게 정하려고 둔 것입니다.
`round`는 `roundEven`을 생성하고, float `%`는 GLSL ES 3.00이 컴파일하는 trunc-mod를 생성합니다.

스칼라 유니폼, 드로에서 쓰는 `"read_write"` 스토리지 바인딩, `@interpolate("linear")`처럼 WGSL에만
있는 것을 쓰는 파일도 컴파일은 됩니다. `compile()`은 WGSL을 유지하고 `glsl`을 정의하지 않으며,
그 이유를 `TS8015` 경고로 알려 줍니다. 반대 방향에는 표기가 없습니다. `gl_PointSize`처럼 언어가
모델링하지 않는 GLSL 구문은 `"use typeshade"` 파일에 쓸 수 없습니다. 그런 구문을 꼭 생성해야 하는
엔진은 IR 빌더의 raw 문(statement)으로 그 문장을 만듭니다. 방법과, raw 문이 모듈의 나머지에 치르게
하는 비용은 [`docs/ir-builder.md`](docs/ir-builder.md)에 있습니다.
