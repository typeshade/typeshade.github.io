---
id: layouts-and-resources
source: 2fc5ad407711135171b2d63fadc3f304de0b1f77e246310162e02ec36e050e4b
sourceLine: 928
rules: 6.6 qXyf0FpXuS4xir_HpHadSIsWFZT2WtMx8M-wm9BvJOE=, 12.3 CjhXTenX6H0V0STxt5Bka_Sp7X0GVUeCZR9Mt1IqNvA=
---

이 페이지를 마치면 버텍스, 유니폼, 스토리지, 텍스처 레이아웃을 한 번만 선언하고, 그 선언 하나에서
모든 필드를 읽을 수 있습니다.

레이아웃은 셰이더와, 셰이더에 데이터를 넣는 파이프라인 사이의 약속입니다. 한 스테이지가 다음
스테이지에 넘기는 필드, 드로 호출이 바인딩하는 유니폼 블록, 슬롯마다 놓이는 버퍼와 텍스처가 모두
레이아웃입니다. 각각은 파일 안의 선언 하나입니다. 구조체는 `class`, `interface`, `type` 별칭으로
쓰고, 리소스는 무엇을 담는지 타입으로 밝힌 `declare const`로 씁니다. 모든 읽기가 선언된 필드를
가리키므로, 필드 이름이나 필드 타입이 틀리면 그 필드를 읽는 줄에서 오류가 납니다.

### IO 구조체

IO 구조체는 스테이지 경계를 넘는 필드 묶음입니다. 버텍스 스테이지가 이 구조체를 돌려주고,
프래그먼트 스테이지가 매개변수로 받습니다. 데코레이터는 클래스 필드에만 붙일 수 있으므로 IO
구조체는 `class`로 쓰며, 모든 필드에 스테이지 속성을 붙입니다. `@builtin("id")`는 하드웨어가 주는
값을 선언하며, `"position"`이나 `"vertex_index"` 같은 WGSL 내장 값 id를 받습니다. WGSL이 정의하지
않은 id는 오류입니다. `@location(n)`은 번호 붙은 슬롯을 선언하며, `@interpolate("flat")`,
`@interpolate("linear")`, `@interpolate("perspective")`를 함께 붙일 수 있습니다. 정수 필드는 따로
적지 않아도 `flat`이 됩니다. 두 타깃 모두 정수 varying에 이를 요구하기 때문입니다. `"flat"`과
`"perspective"`는 두 타깃이 모두 지원하는 모드입니다. `"linear"`는 GLSL ES 3.00에 대응하는 형태가
없으므로, 이 모드를 쓰는 모듈에서는 GLSL이 나오지 않습니다.

```ts
"use typeshade";

class VsIn {
  @location(0) xy: vec2;
  @location(1) uv: vec2;
}

class VsOut {
  @builtin("position") pos: vec4;
  @location(0) uv: vec2;
  @location(1) vis: f32;
  @location(2) id: u32; // an integer varying: flat on both targets
}

// A vertex entry returns the struct. The object literal takes the declared struct,
// so a missing or extra field is an error.
@vertex
export function vsMain(v: VsIn, @builtin("instance_index") inst: u32): VsOut {
  const pos = vec4(v.xy, 0., 1.);
  return { pos: pos, uv: v.uv, vis: 1., id: inst };
}

// Read fields off a parameter declared with the struct.
@fragment
export function fsMain(input: VsOut): vec4 {
  if (input.vis < 0.) {
    discard;
  }
  return vec4(input.uv, f32(input.id), 1.);
}
```

버텍스 진입점의 `@location` 입력은 버텍스 속성입니다. 따로 쓴 매개변수일 수도 있고, `VsIn` 같은
구조체 매개변수의 필드일 수도 있습니다. `reflect()`는 이 입력의 버퍼 레이아웃을 알려 줍니다. 여러
문장에 걸쳐 만드는 구조체 값은 구조체 타입의 `let`으로 선언하고 필드에 하나씩 대입합니다.

### 유니폼 블록

유니폼 블록은 호스트가 드로마다 한 번 채우고 모든 호출이 읽는 구조체입니다. 구조체를 선언한 뒤,
초기화 식 없는 `declare const`로 바인딩을 선언합니다. 타입은 `uniform<T>`입니다. 필드는 이름으로
읽습니다. 읽은 결과는 평범한 값이라서 성분 접근과 수학 연산을 바로 이어 쓸 수 있습니다. 유니폼은
읽기 전용입니다. 필드에 대입하면 에디터에서도, 컴파일할 때도 오류가 납니다.

```ts
"use typeshade";

interface Uniforms {
  mvp: mat4;
  projParams: vec4;
  rasterParams: vec4;
}

declare const u: uniform<Uniforms>;

@vertex
export function vs(@location(0) pos: vec3): vec4 {
  const opacity = u.rasterParams.x;
  return u.mvp * vec4(pos, opacity);
}
```

슬롯은 파일 안에서 선언이 놓인 자리로 정해집니다. `declare const`마다 그룹 0의 다음 바인딩을
차지하고, `reflect()`가 이를 호스트에 알려 줍니다. 유니폼 버퍼는 읽기 전용이므로 `uniform<T>`는
접근 모드를 받지 않습니다.

WGSL에서는 유니폼에 스칼라나 벡터 하나만 담을 수도 있습니다(`declare const mode: uniform<u32>`).
GLSL ES 3.00은 유니폼 바인딩을 std140 블록으로 표현합니다. 그래서 WebGL2를 타깃으로 하는 모듈은
값을 구조체에 넣어야 합니다. 스칼라 유니폼이 있으면 `compile()`은 WGSL을 유지하고 GLSL 쪽은
`TS8015` 경고로 보고합니다. 모든 형태와 거부되는 경우는 인터페이스 참조 문서
`docs/use-typeshade-surface.md` §1에 있습니다.

### 평범한 구조체

스테이지 경계를 넘지 않는 구조체는 필드에 속성을 붙이지 않습니다. 스토리지 버퍼의 요소 타입이나
다른 구조체 안에 든 구조체가 그렇습니다. `class`, `interface`, 객체 타입에 붙인 `type` 별칭 가운데
무엇으로 써도 됩니다. 셋은 같은 구조체가 됩니다.

```ts
"use typeshade";

class ShapeSegment {
  kind: u32;
  colorIdx: u32;
  flags: u32;
  pad: u32;
  p0: vec2;
  p1: vec2;
  p2: vec2;
  p3: vec2;
}

declare const segments: storage<array<ShapeSegment>>;

export function segmentLength(i: u32): f32 {
  const seg = segments[i];
  return length(seg.p1 - seg.p0);
}
```

`class`는 언제나 모듈에 들어갑니다. `type`이나 `interface`는 무언가가 쓸 때만 모듈에 들어갑니다.
바인딩, 매개변수, 반환값, 지역 변수, 또는 쓰이는 다른 구조체의 필드가 그런 쓰임입니다. 아무도 쓰지
않는 타입은 호스트 쪽 형태일 수 있으므로 그대로 둡니다.

### 스토리지 버퍼

스토리지 버퍼는 바인딩된 배열이며, 길이는 호스트가 바인딩하는 버퍼에서 정해집니다. 초기화 식 없는
`declare const`로 선언합니다. 접근 모드는 두 번째 타입 인자입니다. `storage<T>`는 `read`
바인딩이고, `storage<T, "read_write">`는 쓸 수 있는 바인딩입니다. 인덱싱은 다른 배열과 같습니다.

```ts
"use typeshade";

declare const src: storage<array<f32>>;
declare const dst: storage<array<f32>, "read_write">;

@compute([64, 1, 1])
export function twice(@builtin("global_invocation_id") gid: vec3u): void {
  dst[gid.x] = src[gid.x] * 2.0;
}
```

두 선언은 소스 순서대로 그룹 0의 바인딩 0과 1에 `var<storage, read> src: array<f32>;`와
`var<storage, read_write> dst: array<f32>;`를 생성합니다. `src`에 쓰면 에디터에서도, 컴파일할
때도 오류가 납니다. 요소는 구조체, 스칼라, 벡터 가운데 무엇이든 됩니다. 그래서
`storage<array<vec4>>`는 요소마다 `vec4` 하나를 담고, `src.length`는 바인딩된 버퍼의 요소
개수입니다.

GLSL ES 3.00에는 스토리지 버퍼 객체가 없습니다. 그래서 읽기 바인딩은 생성할 때 데이터 텍스처
읽기로 하향 변환되고, 셰이더 소스는 작성한 그대로 남습니다. GLSL 타깃에서는 호스트가 그 데이터
텍스처를 할당하며, 내부 포맷은 하향 변환이 선언한 샘플러와 맞아야 합니다. float 배열은 R32F,
`array<u32>`와 `array<vecN<u32>>`는 R32UI, `array<i32>`와 `array<vecN<i32>>`는 R32I입니다. 벡터
요소는 std430 레인 수만큼 텍셀을 차지하므로 `vec4u` 하나는 텍셀 넷입니다. 구조체 요소는 필드가
모두 float이면 R32F를, `u32`나 `i32` 필드가 있으면 R32UI를 씁니다. 이때는 std430 바이트를
`Uint32Array`로 올리고, 셰이더는 float 필드를 `uintBitsToFloat`로 되돌려 읽습니다. 런타임에는 이
짝을 아무것도 검사하지 않습니다. 그러니 짝을 따로 기억하지 말고 `reflect()`가 주는 바인딩의
`glslDataTexture`(`'r32f'`, `'r32ui'`, `'r32i'`)를 보고 할당하십시오.

이 하향 변환은 gather(읽기만 하는 접근)만 합니다. 그래서 버텍스 진입점이나 프래그먼트 진입점이
닿는 `"read_write"` 바인딩에는 GLSL 형태가 없습니다. 이때 `compile()`은 WGSL을 유지하고 `glsl`을
정의하지 않은 채 `TS8015` 경고를 보고합니다. 컴퓨트 진입점은 WebGL2에서 패스 프로그램을 거쳐 이런
바인딩에 씁니다. 그 방법은 [이식 가능한 컴퓨트 커널](#portable-compute-kernels)에 있습니다.

### 텍스처와 샘플러

텍스처와 샘플러는 `uniform<>`이나 `storage<>`로 감싸지 않고 그대로 씁니다. 핸들은 어느 주소
공간에도 속하지 않기 때문입니다. 타입이 읽기에서 받을 수 있는 것을 정합니다. `texture_2d<f32>`는
필터링된 float를 담는 2D 텍스처이고, `sampler`는 필터링과 랩 상태를 담는 객체입니다. 둘 다 다른
리소스처럼 선언 순서대로 다음 바인딩 슬롯을 차지합니다.

```ts
"use typeshade";

declare const tex: texture_2d<f32>;
declare const texSampler: sampler;

@fragment
export function fs(@location(0) uv: vec2): vec4 {
  const c = textureSample(tex, texSampler, uv); // fragment only
  const cv = textureSampleLevel(tex, texSampler, uv, 0.); // any stage
  const size = textureDimensions(tex); // vec2u, the extent in texels
  return c + cv * f32(size.x);
}
```

`textureSample`은 화면 공간 미분값으로 밉 레벨을 정하는데, 이 값은 프래그먼트 호출에만 있습니다.
그래서 이 함수는 프래그먼트 전용입니다. 버텍스 진입점이나 컴퓨트 진입점이 닿는 곳에서 쓰면 그
진입점을 밝히는 오류가 납니다. 레벨을 직접 정해 읽으려면 모든 스테이지에서 쓸 수 있는
`textureSampleLevel(tex, smp, uv, level)`을 쓰십시오. 미분 내장 함수 `fwidth`, `dpdx`, `dpdy`도
같은 이유로 프래그먼트 전용이며, 버텍스나 컴퓨트에서 쓰는 형태가 없습니다. 그러니 그 값은
프래그먼트에서 미리 계산해 넘기십시오. GLSL ES 3.00에서는 텍스처와 샘플러가 `sampler2D` 하나로
합쳐지고, 호출에서 샘플러 인자가 사라집니다.

### 배열 텍스처와 정수 텍스처

2D 배열 텍스처는 바인딩 하나 뒤에 N개의 레이어를 담고, 호출할 때마다 레이어를 고릅니다. 그래서
깊이와 상관없이 아틀라스 하나가 슬롯 하나만 차지합니다. `texture_2d_array<f32>`로 선언합니다. 같은
읽기 함수를 그대로 씁니다. 텍스처 타입이 배열 형태를 고르고, 그러면 `layer` 인자가 필수가 됩니다.
레이어는 `i32`이고 `textureLoad`의 레벨은 `u32`이므로, 그냥 숫자를 쓰면 알맞은 타입이 됩니다.
`textureDimensions`는 배열 텍스처에서도 너비와 높이만 알려 줍니다. 레이어 수는 따로
`textureNumLayers`로 읽으며, 이 함수는 `u32`를 돌려줍니다.

정수 텍스처는 정확한 32비트 텍셀을 담습니다. id 맵, 압축한 색상 표, 비트 필드 조회표에 씁니다.
`texture_2d<u32>`와 `texture_2d<i32>`는 2D 형태를 선언하고, `texture_2d_array<u32>`와
`texture_2d_array<i32>`는 그 배열판입니다. 읽은 결과는 텍스처의 요소를 따릅니다. 부호 없는
텍스처에서는 `vec4u`, 부호 있는 텍스처에서는 `vec4i`가 나옵니다. `textureSample`과
`textureSampleLevel`은 정수 텍스처를 거부하고 대신 `textureLoad`를 쓰라고 알려 줍니다. 필터링은
가중 평균인데, WGSL에는 정수 텍스처를 샘플링하는 형태가 아예 없기 때문입니다.

```ts
"use typeshade";

declare const atlas: texture_2d_array<f32>;
declare const atlasSampler: sampler;
declare const ids: texture_2d<u32>;

@fragment
export function fs(@builtin("position") p: vec4, @location(0) uv: vec2): vec4 {
  const layer: i32 = 2;
  const a = textureSample(atlas, atlasSampler, uv, layer); // implicit LOD, fragment only
  const b = textureSampleLevel(atlas, atlasSampler, uv, layer, 0.); // explicit LOD, any stage
  const c = textureLoad(atlas, vec2i(0, 0), layer, 0); // unfiltered texel fetch
  const n = textureNumLayers(atlas); // u32
  const id = textureLoad(ids, vec2i(p.xy), 0); // vec4u
  const size = textureDimensions(ids); // vec2u, as for any other texture
  return a + b + c + vec4(f32(n), f32(id.x), f32(size.x), 1.);
}
```

`reflect()`는 텍스처 바인딩마다 차원과 요소를 알려 줍니다. 호스트가 맞는 뷰를 만들고 샘플 타입을
고르는 데 이 정보가 필요합니다. 이 짝이 틀려도 런타임에는 아무 오류도 나지 않습니다. 포맷이 샘플러
타입과 맞지 않는 텍스처는 불완전한 텍스처가 되고, 그 텍스처를 읽으면 조용히 영이 돌아옵니다. 큐브,
3D, 깊이, 멀티샘플, 스토리지 텍스처는 `docs/use-typeshade-surface.md` §33부터 §37까지에 있습니다.
