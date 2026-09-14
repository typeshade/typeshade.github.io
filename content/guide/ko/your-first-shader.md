---
id: your-first-shader
source: c49f95f4da58d020cd07c3fed3933a8f0267a7c0d120c6d03353c8e96e66a89e
---

이 페이지를 마치면 TypeScript로 작성한 셰이더 모듈과 두 개의 진입점을 갖게 됩니다. 같은 모듈을 WebGPU용 WGSL과 WebGL2용 GLSL ES 3.00으로 각각 생성하고, 각 문자열을 만든 호출도 이해하게 됩니다. 이 셰이더는 화면을 색상 그러데이션으로 채웁니다.

이 페이지에서 사용하는 모든 항목은 패키지 배럴에서 가져옵니다.

```ts
import {
  fn,
  module,
  ioStruct,
  builtin,
  location,
  emitModule,
  emitGlslStages,
  u32,
  toF32,
  f32,
  vec2,
  vec4,
  u32T,
  vec2fT,
  vec4fT,
} from '@xgis/shader-dsl'
```

여기에는 두 종류의 이름이 있습니다. `u32T`, `vec2fT`, `vec4fT`는 *type tokens*이며, 선언에 타입이 필요할 때 작성합니다. `f32`, `vec2`, `vec4`는 그래프를 이루는 *node*인 타입 지정 표현식을 만듭니다. 노드는 TypeScript 안에서 자신의 타입을 가지며, 메서드를 호출해 더 큰 표현식을 만듭니다. `x.mul(4).sub(1)`은 곱셈과 뺄셈을 나타냅니다.

### 버텍스 진입점

*진입점*은 GPU가 직접 호출하는 함수입니다. 버텍스마다 한 번, 프래그먼트마다 한 번, 또는 컴퓨트 호출마다 한 번 실행됩니다. 이 페이지에서는 앞의 두 가지를 사용합니다. `fn`과 `opts.stage`로 진입점을 선언하고, 나머지 함수도 같은 `fn`으로 일반 헬퍼를 선언합니다.

버텍스 스테이지는 버텍스마다 한 번 실행됩니다. 클립 공간 위치와 프래그먼트 스테이지에 필요한 값을 *IO struct*에 담아 만듭니다. `builtin('position', …)`은 하드웨어가 직접 소비하는 값을 표시하고, `location(0, …)`은 삼각형 전체에서 보간되어 프래그먼트 스테이지가 읽는 값을 표시합니다.

```ts
const VsOut = ioStruct('VsOut', {
  pos: builtin('position', vec4fT),
  uv: location(0, vec2fT),
})
```

이 셰이더에는 버텍스 버퍼가 없습니다. 화면을 덮는 세 버텍스를 그리고 위치를 버텍스 인덱스만으로 계산합니다. 스테이지 속성이 붙은 매개변수도 일반 매개변수와 같은 매개변수 레코드에 넣고 `builtin`과 `location` 헬퍼를 사용합니다.

```ts
const vs = fn(
  'vs',
  { vi: builtin('vertex_index', u32T) },
  ({ vi }) => {
    const x = toF32(vi.bitAnd(u32(1))).mul(4).sub(1)
    const y = toF32(vi.shr(u32(1))).mul(4).sub(1)
    return VsOut.construct({
      pos: vec4(x, y, 0, 1),
      uv: vec2(x.mul(0.5).add(0.5), y.mul(0.5).add(0.5)),
    })
  },
  { stage: 'vertex' },
)
```

본문은 매개변수를 타입이 지정된 노드로 받으므로 `vi`는 `u32` 노드이고 `toF32`는 이를 `f32`로 변환합니다. 반환 타입은 본문이 반환하는 값에서 추론되며, 여기서는 `VsOut.construct`가 만든 구조체입니다.

### 프래그먼트 진입점

프래그먼트 스테이지는 후보 픽셀마다 한 번 실행되고 색상을 반환합니다. 버텍스 출력을 매개변수로 받으므로 `VsOut`에 선언된 필드를 읽습니다. `vo.uv`는 `.x`와 `.y`를 가진 `vec2<f32>` 노드를 반환합니다.

```ts
const fs = fn(
  'fs',
  { vo: VsOut },
  ({ vo }) => {
    const shade = f32(1).sub(vo.uv.y)
    return vec4(vo.uv.x, shade, 0.5, 1)
  },
  { stage: 'fragment', retAttr: '@location(0)' },
)
```

`retAttr`는 구조체가 아닌 반환값에 속성을 붙입니다. `@location(0)`은 첫 번째 색상 어태치먼트입니다.

숫자 리터럴은 옆에 있는 피연산자에서 타입을 얻으므로 `vec4(vo.uv.x, shade, 0.5, 1)`에는 래퍼가 필요하지 않습니다. 반면 추론할 대상이 없는 곳에서는 `f32(1)`처럼 작성합니다. 일반 숫자에는 메서드가 없고 `sub`를 호출할 대상이 필요하기 때문입니다.

### 모듈 구성

*모듈*은 생성 단위입니다. `module`은 const, struct, binding, func 배열을 받고 각 필드는 기본적으로 비어 있으므로 이 셰이더에서는 두 항목만 선언합니다.

```ts
const gradient = module({
  structs: [VsOut.decl],
  funcs: [vs, fs],
})
```

`VsOut.decl`은 핸들 뒤에 있는 구조체 선언입니다. 핸들은 값을 구성하고 필드를 읽는 데 사용하고, 선언은 모듈이 생성하는 대상입니다. `funcs`의 순서가 생성 순서이므로 호출되는 함수보다 호출하는 함수를 뒤에 둡니다.

### 두 타깃 모두 생성하기

`emitModule(gradient)`는 두 진입점을 모두 포함한 전체 모듈을 하나의 WGSL 문자열로 반환합니다.

```wgsl
struct VsOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> VsOut {
  let _cse0 = ((f32((vi & 1u)) * 4.0) - 1.0);
  let _cse1 = ((f32((vi >> 1u)) * 4.0) - 1.0);
  return VsOut(vec4<f32>(_cse0, _cse1, 0.0, 1.0), vec2<f32>(((_cse0 * 0.5) + 0.5), ((_cse1 * 0.5) + 0.5)));
}

@fragment
fn fs(vo: VsOut) -> @location(0) vec4<f32> {
  return vec4<f32>(vo.uv.x, (1.0 - vo.uv.y), 0.5, 1.0);
}
```

GLSL ES 3.00은 한 번에 한 스테이지씩 컴파일하고 각 소스가 자신의 `main`을 가지므로 GLSL은 스테이지마다 하나의 문자열로 돌아옵니다. `emitGlslStages(gradient)`는 모듈을 한 번 하향 변환하여 `{ vertex, fragment }`를 반환하며, 이 패스는 IR을 타깃이 표현할 수 있는 형태로 다시 씁니다.

```glsl
#version 300 es
precision highp float;
precision highp int;

out vec2 uv;

void main() {
  uint vi = uint(gl_VertexID);
  float _cse0 = ((float((vi & 1u)) * 4.0) - 1.0);
  float _cse1 = ((float((vi >> 1u)) * 4.0) - 1.0);
  gl_Position = vec4(_cse0, _cse1, 0.0, 1.0);
  uv = vec2(((_cse0 * 0.5) + 0.5), ((_cse1 * 0.5) + 0.5));
}
```

```glsl
#version 300 es
precision highp float;
precision highp int;

in vec2 uv;
layout(location = 0) out vec4 _ret;

void main() {
  _ret = vec4(uv.x, (1.0 - uv.y), 0.5, 1.0);
}
```

두 호출에 전달한 소스는 같습니다. 두 결과의 차이는 각 언어가 요구하는 형태에서 생깁니다. IO struct는 서로 짝을 이루는 `out`과 `in` varying이 되고, 프래그먼트 반환값은 선언된 출력 변수가 되며, 빌트인 위치는 `gl_Position`이 됩니다. `gl_VertexID`는 signed int이므로 `u32` 매개변수에는 캐스트가 추가됩니다. 생성은 모듈을 변경하지 않으므로 어느 타깃이든 원하는 순서와 횟수로 생성할 수 있습니다.

### 다음 단계

`Let`과 `Var`는 값이 자신의 이름을 갖도록 만들며, [값과 변경](/guide/authoring/values-and-mutation/)에서는 이름이 필요한 경우와 `.assign`으로 값을 변경하는 방법을 다룹니다. [함수와 진입점](/guide/authoring/functions-and-entry-points/)에서는 컴퓨트 스테이지를 포함해 `fn`과 `module`이 받는 나머지 항목을 설명합니다. [레이아웃과 리소스](/guide/authoring/layouts-and-resources/)에서는 uniform block, vertex layout, texture를 한 번 선언하고 어디서든 읽는 방법을 다룹니다. [생성과 리플렉션](/guide/authoring/emitting-and-reflection/)에서는 다른 생성 진입점과 호스트가 사용하는 파이프라인 메타데이터를 설명합니다.
