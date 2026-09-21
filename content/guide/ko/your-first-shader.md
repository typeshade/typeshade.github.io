---
id: your-first-shader
source: 03178c82393a313851e1a2963ab674d63e6c866e1466a144bb5a3c1fd0ae98d2
sourceLine: 134
---

이 페이지를 마치면 진입점이 두 개인 셰이더 모듈을 TypeScript로 작성하고, 같은 모듈을 WebGPU용
WGSL로 한 번, WebGL2용 GLSL ES 3.00으로 한 번 생성하며, 어느 호출이 어느 문자열을 만드는지
알게 됩니다. 이 셰이더는 화면을 색상 그러데이션으로 채웁니다.

이 페이지에서 쓰는 이름은 모두 패키지 배럴에서 가져옵니다:

```ts
import {
  fn,
  module,
  ioStruct,
  builtin,
  location,
  emitModule,
  emitGlslStages,
  sub,
  vec2,
  vec4,
  vec2fT,
  vec4fT,
} from 'typeshade'
```

여기에는 두 종류의 이름이 있습니다. `vec2fT`와 `vec4fT`는 *타입 토큰*으로, 선언에 타입을
적어야 하는 자리에 씁니다. `vec2`와 `vec4`는 *노드*를 만듭니다. 노드는 타입이 정해진 표현식
하나이고, 이런 노드가 모여 그래프를 이룹니다. 노드는 TypeScript 타입으로도 자기 타입을
드러내므로, 노드의 메서드를 호출해 더 큰 표현식을 만듭니다. `x.mul(4).sub(1)`은 곱셈 한 번과
뺄셈 한 번입니다. `sub`는 같은 뺄셈을 독립 함수로 제공하며, 왼쪽 피연산자가 리터럴인
표현식에 씁니다.

### 버텍스 진입점

*진입점*은 GPU가 직접 호출하는 함수로, 버텍스마다 한 번, 프래그먼트마다 한 번, 또는 컴퓨트
호출마다 한 번 실행됩니다. 이 페이지에서는 앞의 두 가지를 씁니다. 진입점은 `fn`과
`opts.stage`로 선언합니다. 그 밖에 작성하는 함수는 모두 헬퍼 함수이며, 헬퍼도 똑같이 `fn`으로
선언합니다.

버텍스 스테이지는 버텍스마다 한 번 실행됩니다. 클립 공간 좌표와 프래그먼트 스테이지에 넘길
값을 계산해 *IO 구조체*에 담습니다. IO 구조체는 필드마다 속성이 하나씩 붙은 필드의 묶음입니다.
`builtin('position', …)`은 하드웨어가 직접 쓰는 값에 붙이고, `location(0, …)`은 삼각형 안에서
보간된 뒤 프래그먼트 스테이지가 읽는 값에 붙입니다.

```ts
const VsOut = ioStruct('VsOut', {
  pos: builtin('position'),
  uv: location(0, vec2fT),
})
```

`builtin`에는 타입 토큰이 필요 없습니다. WGSL은 `clip_distances`를 제외한 모든 빌트인의
타입을 스펙에서 고정해 두므로, `builtin('position')`은 id만 보고 `vec4<f32>`를 읽어 옵니다.
타입 토큰을 따로 받으면 스펙과 어긋난 타입을 적을 여지만 생깁니다.

이 셰이더에는 버텍스 버퍼가 없습니다. 화면 전체를 덮는 버텍스 세 개를 그리고, 위치는 버텍스
인덱스만으로 계산합니다. 스테이지 속성이 붙은 매개변수도 일반 매개변수와 같은 매개변수
객체에 적으며, 이때도 `builtin`과 `location` 헬퍼를 그대로 씁니다:

```ts
const vs = fn(
  'vs',
  { vi: builtin('vertex_index') },
  ({ vi }) => {
    const x = vi.bitAnd(1).f32().mul(4).sub(1)
    const y = vi.shr(1).f32().mul(4).sub(1)
    return VsOut.construct({
      pos: vec4(x, y, 0, 1),
      uv: vec2(x.mul(0.5).add(0.5), y.mul(0.5).add(0.5)),
    })
  },
  { stage: 'vertex' },
)
```

본문은 매개변수를 타입이 정해진 노드로 받습니다. 그래서 `vi`는 `u32` 노드이고, `.f32()`가
이를 변환합니다. 이 캐스트는 `.mul`, `.sub`와 나란히 체인 안에 있으므로 줄을 왼쪽에서
오른쪽으로 그대로 읽어 나갈 수 있습니다. 독립 함수인 `f32(vi)`와 예전 이름인 `toF32(vi)`도
같은 노드를 만듭니다. 메서드가 없는 그냥 숫자 피연산자는 만나는 노드의 타입을 그대로
따르므로, `bitAnd(1)`은 `u32(1)`로 감쌀 필요가 없습니다. 반환 타입은 따로 적지 않고 본문이
돌려주는 값에서 추론하며, 여기서는 `VsOut.construct`가 만든 구조체가 반환 타입입니다.

### 프래그먼트 진입점

프래그먼트 스테이지는 픽셀 후보마다 한 번 실행되어 색상 하나를 반환합니다. 버텍스 스테이지의
출력을 매개변수로 받으므로, `VsOut`에 선언한 필드를 그대로 읽습니다. `vo.uv`는 `vec2<f32>`
노드이고, 성분은 `.x`와 `.y`로 읽습니다.

```ts
const fs = fn(
  'fs',
  { vo: VsOut },
  ({ vo }) => {
    const shade = sub(1, vo.uv.y)
    return vec4(vo.uv.x, shade, 0.5, 1)
  },
  { stage: 'fragment' },
)
```

프래그먼트 함수가 구조체가 아닌 값을 반환하면 별도로 적지 않아도 기본값인 `@location(0)`,
즉 첫 번째 색상 어태치먼트로 나갑니다. 구조체가 아닌 반환값을 다른 곳으로 보내려면
`retAttr`을 씁니다.

숫자 리터럴은 옆에 있는 피연산자의 타입을 따르므로 `vec4(vo.uv.x, shade, 0.5, 1)`에는 따로
래퍼가 필요 없습니다. `sub(1, x)`는 `x`가 가진 `.sub`를 독립 함수로 옮겨 놓은 형태로, 왼쪽
피연산자가 리터럴인 표현식을 위한 것입니다. 그냥 숫자에는 메서드가 없으므로 메서드 형태로
쓰려면 `f32(1).sub(x)`처럼 직접 감싸야 합니다. `add`, `mul`, `div`에도 같은 짝이 있습니다.

### 모듈 구성

*모듈*은 생성 단위입니다. `module`은 상수, 구조체, 바인딩, 함수를 각각 배열로 받습니다. 비워 둔
필드는 빈 배열로 취급하므로, 이 셰이더는 둘만 적습니다:

```ts
const gradient = module({
  structs: [VsOut.decl],
  funcs: [vs, fs],
})
```

`VsOut.decl`은 핸들(handle)이 가리키는 구조체 선언입니다. 핸들은 값을 만들고 필드를 읽을 때
쓰고, 모듈이 실제로 생성하는 쪽은 선언입니다. `funcs`에 적은 순서대로 생성하므로, 다른
함수를 호출하는 함수는 호출되는 함수보다 뒤에 둡니다.

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

GLSL ES 3.00은 한 번에 스테이지 하나씩 컴파일하고 소스마다 `main`이 따로 있으므로, GLSL은
스테이지마다 문자열이 하나씩 나옵니다. `emitGlslStages(gradient)`는 모듈을 한 번만 하향
변환(lowering)해서 `{ vertex, fragment }`를 돌려줍니다. 하향 변환은 IR을 타깃 언어로 적을 수
있는 모양으로 다시 쓰는 패스입니다:

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

두 호출에 넘긴 소스는 같습니다. 두 결과가 다른 곳은 언어 규칙상 다를 수밖에 없는 곳뿐입니다.
IO 구조체는 `out`과 `in`으로 짝지은 varying이 되고, 프래그먼트 반환값은 따로 선언한 출력
변수가 되며, position 빌트인은 `gl_Position`이 되고, `gl_VertexID`가 부호 있는 int라서
`u32` 매개변수에 캐스트가 붙습니다. 생성해도 모듈은 바뀌지 않으므로, 어느 타깃이든 어떤
순서로든 원하는 횟수만큼 생성할 수 있습니다.

### 다음 단계

`Let`과 `Var`는 값에 이름을 붙이도록 강제합니다. 이름이 언제 필요한지, `.assign`이 값을
어떻게 변경하는지는 [값과 변경](/guide/authoring/values-and-mutation/)에서 다룹니다. `fn`과
`module`이 받는 나머지 옵션은 컴퓨트 스테이지까지 포함해
[함수와 진입점](/guide/authoring/functions-and-entry-points/)에 있습니다. 유니폼 블록,
버텍스 레이아웃, 텍스처를 한 번만 선언하고 어디서든 읽는 방법은
[레이아웃과 리소스](/guide/authoring/layouts-and-resources/)에서 설명합니다. 그 밖의 생성
진입점과 호스트가 바인딩에 쓰는 파이프라인 메타데이터는
[생성과 리플렉션](/guide/authoring/emitting-and-reflection/)에서 다룹니다.
