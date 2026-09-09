---
id: your-first-shader
source: c49f95f4da58d020cd07c3fed3933a8f0267a7c0d120c6d03353c8e96e66a89e
sourceLine: 127
---

이 페이지를 마치고 나면 진입점 두 개짜리 TypeScript 셰이더 모듈을 손에 넣습니다. 같은 모듈을
WebGPU용 WGSL로 한 번, WebGL2용 GLSL ES 3.00으로 한 번 생성해 보고, 각 문자열을 만들어 낸
호출이 무엇인지도 알아봅니다. 이 셰이더는 화면을 색상 그러데이션으로 채웁니다.

이 페이지에서 쓰는 것은 모두 패키지 배럴 하나에서 가져옵니다:

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

여기에는 두 종류의 이름이 나옵니다. `u32T`, `vec2fT`, `vec4fT`는 *타입 토큰*으로, 선언에
타입이 필요한 자리에 쓰는 이름입니다. `f32`, `vec2`, `vec4`는 *노드*를 만들어 내는데, 노드는
그래프를 이루는, 타입이 정해진 표현식입니다. 노드는 TypeScript에서도 자신의 타입을 그대로
지니며, 그 위에 메서드를 호출해 더 큰 표현식을 만듭니다. `x.mul(4).sub(1)`은 곱셈 한 번과
뺄셈 한 번을 나타냅니다.

### 버텍스 진입점

*진입점*은 GPU가 직접 호출하는 함수로, 버텍스마다 한 번, 프래그먼트마다 한 번, 또는 컴퓨트
호출마다 한 번 실행됩니다. 이 페이지에서는 앞의 두 가지를 씁니다. 진입점은 `fn`과
`opts.stage`로 선언합니다. 그 밖에 작성하는 함수는 모두 평범한 헬퍼이며, 똑같이 `fn`으로
선언합니다.

버텍스 스테이지는 버텍스마다 한 번 실행됩니다. 클립 공간 좌표와 프래그먼트 스테이지가
필요로 하는 값을 만들어 내고, 이를 *IO 구조체*에 담습니다. IO 구조체란 필드마다 속성이 하나씩 붙는
값들의 모음입니다. `builtin('position', …)`은 하드웨어 자체가 소비하는 값을 표시하고,
`location(0, …)`은 삼각형 전체에서 보간되어 프래그먼트 스테이지가 다시 읽어 들이는 값을
표시합니다.

```ts
const VsOut = ioStruct('VsOut', {
  pos: builtin('position', vec4fT),
  uv: location(0, vec2fT),
})
```

이 셰이더에는 버텍스 버퍼가 없습니다. 화면 전체를 덮는 버텍스 세 개를 그리고, 그 위치는
버텍스 인덱스만으로 구합니다. 스테이지 속성이 붙은 매개변수도 일반 매개변수와 같은
매개변수 객체에 담으며, 이때도 `builtin`과 `location` 헬퍼를 그대로 씁니다:

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

함수 본문은 매개변수를 타입이 정해진 노드로 받으므로, `vi`는 `u32` 노드이고 `toF32`는 이를
`f32`로 변환합니다. 반환 타입은 본문이 반환하는 값에서 추론되는데, 여기서는
`VsOut.construct`가 만든 구조체입니다.

### 프래그먼트 진입점

프래그먼트 스테이지는 픽셀 후보마다 한 번 실행되어 색상 하나를 반환합니다. 버텍스 스테이지의
출력을 매개변수로 받으므로, 실제로 읽는 값은 `VsOut`에 선언된 필드들입니다. `vo.uv`는 `.x`와
`.y`가 있는 `vec2<f32>` 노드를 돌려줍니다.

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

`retAttr`는 구조체가 아닌 반환값에 속성을 붙입니다. `@location(0)`은 첫 번째 색상
어태치먼트입니다.

숫자 리터럴은 옆에 놓인 피연산자의 타입을 그대로 따르므로, `vec4(vo.uv.x, shade, 0.5, 1)`에는
따로 래퍼가 필요 없습니다. 반면 추론할 대상이 없는 자리에는 `f32(1)`처럼 직접 써야 하는데,
그냥 숫자에는 메서드가 없어 `sub`를 호출할 대상이 있어야 하기 때문입니다.

### 모듈 구성

*모듈*은 생성 단위입니다. `module`은 상수, 구조체, 바인딩, 함수 배열을 받고 각 필드는 기본값이
빈 배열이므로, 이 셰이더는 그중 두 개만 선언합니다:

```ts
const gradient = module({
  structs: [VsOut.decl],
  funcs: [vs, fs],
})
```

`VsOut.decl`은 핸들 뒤에 있는 구조체 선언입니다. 핸들은 값을 만들고 필드를 읽어 오는 데 쓰고,
선언은 모듈이 실제로 생성하는 대상입니다. `funcs` 안의 순서가 곧 생성 순서이므로, 어떤 함수를
호출하는 함수는 그 함수보다 뒤에 두어야 합니다.

### 두 타깃 모두 생성하기

`emitModule(gradient)`는 모듈 전체를 진입점 두 개가 모두 담긴 WGSL 문자열 하나로 돌려줍니다:

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

GLSL ES 3.00은 한 번에 스테이지 하나씩 컴파일하고 소스마다 자신만의 `main`을 가지므로, GLSL은
스테이지마다 문자열 하나로 돌아옵니다. `emitGlslStages(gradient)`는 모듈을 한 번 하향
변환하여 `{ vertex, fragment }`를 돌려주는데, 이 하향 변환은 타깃이 표현할 수 있는 형태로
IR을 다시 쓰는 패스입니다:

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

소스는 두 호출 모두 같았습니다. 두 결과물의 차이는 각 언어가 강제하는 차이일 뿐입니다. IO
구조체는 짝을 이루는 `out`과 `in` varying 쌍이 되고, 프래그먼트 반환값은 선언된 출력 변수가
되며, 위치를 나타내는 빌트인 값은 `gl_Position`이 되고, `gl_VertexID`는 부호 있는 int라서
`u32` 매개변수에 캐스트가 붙습니다. 생성은 모듈을 바꾸지 않으므로, 원하는 타깃을 원하는
순서로 원하는 횟수만큼 생성할 수 있습니다.

### 다음 단계

`Let`과 `Var`는 값에 강제로 자기 이름을 붙입니다. 이름이 언제 필요한지, `.assign`이 값을
어떻게 변경하는지는 [값과 변경](/guide/authoring/values-and-mutation/)에서 다룹니다. `fn`과
`module`이 받는 나머지 항목은, 컴퓨트 스테이지를 포함해
[함수와 진입점](/guide/authoring/functions-and-entry-points/)에 있습니다. 유니폼 블록,
버텍스 레이아웃, 텍스처를 한 번만 선언하고 어디서든 읽는 방법은
[레이아웃과 리소스](/guide/authoring/layouts-and-resources/)에서 설명합니다. 그 밖의 생성
진입점과 호스트가 바인딩에 쓰는 파이프라인 메타데이터는
[생성과 리플렉션](/guide/authoring/emitting-and-reflection/)에서 다룹니다.
