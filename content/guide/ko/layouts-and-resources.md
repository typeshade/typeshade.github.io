---
id: layouts-and-resources
source: 095950dbbd1c76dc6040f7e90ee6095185fd308fe7c2045126b136c04c5e1a2a
sourceLine: 960
---

이 절을 읽고 나면 버텍스, 유니폼, 스토리지, 텍스처 레이아웃을 한 번만 선언하고, 그 선언
하나에서 모든 필드를 읽어올 수 있습니다.

레이아웃은 셰이더와 그 셰이더에 값을 공급하는 파이프라인 사이의 약속입니다. 한 스테이지가
다음 스테이지에 넘기는 필드, 드로우 콜이 바인딩하는 유니폼 블록, 각 슬롯에 오르는 버퍼와
텍스처가 여기에 해당합니다. 각 헬퍼 함수는 레이아웃을 필드 맵이나 요소 타입으로 한 번
받고, 그 레이아웃에 필요한 선언과 타입이 붙은 접근자를 함께 담은 핸들(handle)을
돌려줍니다. 접근자가 선언과 같은 객체에서 나오므로, 필드 이름이나 필드 타입을 잘못 쓰면
그 코드를 쓴 줄에서 바로 TypeScript 오류가 됩니다. 이 핸들들을 `module({ uses: [...] })`에
넘기면 모듈이 각 핸들이 담고 있는 선언을 모두 모읍니다.

### IO 구조체

IO 구조체는 스테이지 경계를 넘어가는 필드 묶음입니다. 버텍스 스테이지가 반환하고,
프래그먼트 스테이지가 매개변수로 받습니다. `ioStruct`는 이름과 필드 맵으로 IO 구조체를
선언하며, 필드마다 스테이지 속성이 붙습니다. `builtin(name, type)`은 하드웨어가 직접
공급하는 값을 선언하고, `'position'`이나 `'vertex_index'`처럼 WGSL 내장 식별자를 인자로
받습니다. 이 인자의 타입은 닫힌 유니온이므로, WGSL에 없는 이름을 쓰면 `tsc` 오류가
됩니다. `location(n, type)`은 번호가 있는 슬롯을 선언합니다. 보간 모드는 `'flat'`,
`'linear'`, `'perspective'` 중 하나를 골라 붙일 수 있고, 생략해도 됩니다. 두 타깃이 모두
지원하는 모드는 `'flat'`입니다.

```ts
const VsOut = ioStruct('VsOut', {
  pos: builtin('position', vec4fT),
  uv: location(0, vec2fT),
  vis: location(1, f32T),
  view_w: location(2, f32T),
})

// A vertex fn returns the struct. `construct` builds the value in one expression,
// so a missing or extra field is a TS error.
const vs = fn(
  'vs_main',
  { xy: location(0, vec2fT), uv: location(1, vec2fT) },
  (p) => {
    const pos = vec4(p.xy, 0, 1)
    return VsOut.construct({ pos, uv: p.uv, vis: f32(1), view_w: pos.w })
  },
  { stage: 'vertex' },
)

// Read fields off a parameter declared with the handle.
const fs = fn(
  'fs_main',
  { input: VsOut },
  (p) => {
    If(p.input.vis.lt(0), () => {
      Discard()
    })
    return vec4(p.input.uv, 0, 1)
  },
  { stage: 'fragment' },
)
```

`VsOut.var('out')`은 핸들을 쓰는 세 번째 방법입니다. 이 구조체 타입의 가변 var를 선언하고
대입할 수 있는 필드를 돌려주므로, 출력을 여러 문장에 걸쳐 채워 나갈 때 씁니다. 값을 일반
노드로 들고 있을 때 그 필드를 읽으려면 `VsOut.of(node)`를 씁니다.

### 유니폼 블록

유니폼 블록은 호스트가 드로우 콜마다 한 번 채우고 모든 호출이 읽는 구조체입니다.
`uniformStruct`는 구조체와 그 바인딩을 호출 한 번으로 함께 선언합니다. WGSL 타입 이름,
슬롯(`group`, `binding`, 변수 이름을 정하는 `as`), 그리고 필드 맵을 순서대로 넘깁니다.
필드는 `.field.<name>`으로 읽습니다. 읽은 값은 일반 노드이므로 컴포넌트 접근과 연산을
바로 이어서 쓸 수 있습니다. 유니폼 필드는 WGSL에서 읽기 전용이고 핸들의 타입도 읽기
전용이므로, 필드에 대입하면 `tsc` 오류가 됩니다.

```ts
const U = uniformStruct(
  'Uniforms',
  { group: 0, binding: 0, as: 'u' },
  {
    mvp: mat4x4fT,
    proj_params: vec4fT,
    raster_params: vec4fT,
  },
)

const opacity = U.field.raster_params.x
const m = U.field.mvp
```

`U.field`는 평범한 객체이므로, 본문 맨 위에서 한 번 구조 분해해 두고 그 뒤로는 이름으로
필드를 읽으면 됩니다: `const { mvp, proj_params } = U.field`.

유니폼이 스칼라나 벡터 하나뿐이라면 구조체로 감쌀 필요가 없습니다. `resource`는 이런 단일
바인딩 값을 선언하고, 값을 읽는 `.node`와 `uses`에 넘길 `.binding`을 함께 돌려줍니다.

```ts
const mode = resource('mode', u32T, { group: 0, binding: 1 })
// mode.node is a ReadonlyNode<'u32'> — `@group(0) @binding(1) var<uniform> mode: u32;`
```

`resource`는 텍스처와 샘플러도 선언합니다. [텍스처와 샘플러](#textures-and-samplers) 절을
참고하십시오.

### 일반 구조체

`structDecl`은 스테이지 경계를 넘지 않는 구조체를 선언합니다. 스토리지 버퍼의 요소
타입이거나 다른 구조체 안에 중첩되는 구조체가 여기에 해당합니다. 필드는 스테이지 속성이
없는 일반 타입이며, IO 구조체와 다른 점은 이것뿐입니다. 핸들의 모양은 같고,
`.get(node, 'field')` 리더가 하나 더 있습니다. 짧은 식 하나에서 여러 필드를 꺼내는 호출
지점에서는 이 위치 인자 방식이 편합니다.

```ts
export const ShapeSegment = structDecl('ShapeSegment', {
  kind: u32T,
  color_idx: u32T,
  flags: u32T,
  _pad: u32T,
  p0: vec2fT,
  p1: vec2fT,
  p2: vec2fT,
  p3: vec2fT,
})
```

### 스토리지 버퍼

스토리지 버퍼는 바인딩된 `array<Element>`이며, 길이는 호스트가 바인딩하는 버퍼가
정합니다. `storageBuffer`는 요소 타입만 받아서 스토리지 버퍼를 선언합니다. 요소는 구조체
핸들이어도 되고 스칼라나 벡터 타입이어도 됩니다. 요소는 `.at(i)`로 접근합니다. 구조체
요소라면 타입이 붙은 필드 프록시를, 스칼라나 벡터 요소라면 요소 노드 자체를 돌려줍니다.
`access`는 쓸 수 있는지를 타입 수준에서 정합니다. `'read'`이면 필드가 읽기 전용이라
대입하면 `tsc` 오류가 되고, `'read_write'`이면 대입할 수 있습니다.

```ts
const segmentsB = storageBuffer('segments', ShapeSegment, { group: 0, binding: 9, access: 'read' })

const seg = segmentsB.at(i)
seg.p0 // → Node<'vec2<f32>'>
seg.kind // → Node<'u32'>

const featIds = storageBuffer('feat_ids', u32T, { group: 0, binding: 10, access: 'read' })
featIds.at(i) // → Node<'u32'>
```

GLSL ES 3.00에는 스토리지 버퍼 객체가 없으므로, 생성 시점에 읽기 바인딩을 데이터 텍스처
조회로 하향 변환(lowering)하고 셰이더 소스는 작성한 그대로 둡니다. GLSL 타깃에서는 그
데이터 텍스처를 호스트가 직접 만들어야 하고, 내부 포맷은 하향 변환이 선언하는 샘플러와
맞춰야 합니다. 실수 배열에는 R32F를, `array<u32>`에는 R32UI를, `array<i32>`에는 R32I를
씁니다. 짝이 맞는지 런타임에 검사해 주는 것은 없으므로, 요소 타입은 따로 기록해 두지 말고
`reflect()`에서 읽습니다.

이 하향 변환은 gather(읽기만 하는 접근)만 지원하므로, GLSL 타깃에서
`'read_write'` 바인딩을 쓰면 빌드 시점 오류가 됩니다. 모듈이 WGSL 전용이 아니라면 `'read'`를 씁니다. GLSL도 타깃으로 삼는
모듈에서 `'read_write'` 바인딩을 쓰면, GLSL을 처음 생성하기 전까지는 문제가 드러나지
않습니다.

### 텍스처와 샘플러

`resource`는 필드가 없는 바인딩 값을 선언합니다. 텍스처와 샘플러가 여기에 해당합니다.
접근 노드가 어떤 값을 받는지는 타입 토큰이 정합니다. 실수를 필터링해 읽는 2D 텍스처에는
`texture2dfT`를, 샘플러에는 `samplerT`를 씁니다. 샘플러는 필터링과 래핑 상태를 담는
객체입니다. `.node`는 구체적인 타입을 그대로 갖고 있으므로, 텍스처와 샘플러를 뒤바꿔
넘기면 `tsc`가 잡아냅니다.

```ts
const tex = resource('tex', texture2dfT, { group: 0, binding: 1 })
const texSampler = resource('tex_sampler', samplerT, { group: 0, binding: 2 })

const c = textureSample(tex.node, texSampler.node, uv) // fragment only
const cv = textureSampleLevel(tex.node, texSampler.node, uv, 0) // any stage
const size = textureDimensions(tex.node) // → Node<'vec2<u32>'>, the extent in texels
```

`textureSample`은 밉 레벨을 화면 공간 미분에서 얻습니다. 미분은 프래그먼트 호출에만
있으므로 이 함수는 프래그먼트 전용이며, 버텍스나 컴퓨트에서 쓰면 SD0109 린트 오류가
됩니다. 레벨을 직접 지정하려면 `textureSampleLevel(tex, smp, uv, level)`을 쓰며, 이 함수는
모든 스테이지에서 쓸 수 있습니다. 미분 내장 함수 `fwidth`, `dpdx`, `dpdy`도 같은 이유로
프래그먼트 전용이고 버텍스나 컴퓨트용은 아예 없으므로, 필요한 값은 그 스테이지에서 미리
계산해서 넘깁니다.

### 배열 텍스처와 정수 텍스처

2D 배열 텍스처는 바인딩 하나 뒤에 레이어 N개를 두고, 레이어는 호출할 때마다 고릅니다.
그래서 깊이가 얼마든 아틀라스 하나가 슬롯 하나만 씁니다. `texture2dArrayfT`로
선언합니다. 읽기 함수 세 개도 그대로 씁니다. 첫 번째 인자가 배열 텍스처 타입이면 `layer`
인자가 필수가 됩니다. 레이어에 그냥 숫자를 넘기면 정수 리터럴로 승격됩니다.
`textureDimensions`는 배열 텍스처에서도 너비와 높이만 돌려줍니다. 레이어 개수는
`textureNumLayers`로 따로 얻으며, 결과가 `u32`이므로 실수 연산에 쓰려면 `toF32`로
감쌉니다.

정수 텍스처는 32비트 값을 손실 없이 담는 텍셀로 이루어지며, id 맵, 여러 값을 정수 하나에
묶어 담은 색상 테이블, 비트필드 조회에 씁니다. 2D 텍스처는 `texture2duT`와 `texture2diT`로,
배열 텍스처는 `texture2dArrayuT`와 `texture2dArrayiT`로 선언합니다. 로드 결과의 타입은
텍스처의 요소 타입을 따릅니다. 부호 없는 텍스처에서는 `vec4<u32>`, 부호 있는 텍스처에서는
`vec4<i32>`가 나오므로, 다른 타입에 대입하면 `tsc` 오류가 됩니다. `textureSample`과
`textureSampleLevel`은 이런 타입을 `tsc` 단계에서 거부하는데, 필터링은 가중 평균이고
WGSL에 정수 텍스처를 샘플링하는 함수가 아예 없기 때문입니다. 정수 텍스처에서 쓸 수 있는
함수는 `textureLoad`, `textureDimensions`, `textureNumLayers`뿐입니다.

```ts
const atlas = resource('atlas', texture2dArrayfT, { group: 0, binding: 4 })
const atlasSampler = resource('atlas_sampler', samplerT, { group: 0, binding: 5 })

textureSample(atlas.node, atlasSampler.node, uv, layer) // implicit LOD, fragment only
textureSampleLevel(atlas.node, atlasSampler.node, uv, layer, level) // explicit LOD, any stage
textureLoad(atlas.node, coord, layer, level) // unfiltered texel fetch
textureNumLayers(atlas.node) // → Node<'u32'>

const ids = resource('ids', texture2duT, { group: 0, binding: 3 })

textureLoad(ids.node, coord, 0) // → Node<'vec4<u32>'>
textureDimensions(ids.node) // → Node<'vec2<u32>'>, same as any other texture
```

`reflect()`는 텍스처 바인딩마다 차원과 요소 타입을 돌려줍니다. 호스트가 거기에 맞는 뷰를
만들고 샘플 타입을 고르려면 이 정보가 필요합니다. 짝을 잘못 맞춰도 런타임에는 아무 오류도
나지 않습니다. 포맷과 샘플러 타입이 어긋난 텍스처는 INCOMPLETE 상태가 될 뿐이고, 그
텍스처에서 읽으면 조용히 영을 돌려줍니다.
