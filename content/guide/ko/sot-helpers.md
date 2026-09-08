---
id: sot-helpers
source: 6b049bc5b6ba503cfbd222c7e4931e9a8b97e10139da85dd23ac955a4d6abf1c
sourceLine: 528
---

버텍스/유니폼 레이아웃은 예전에는 최대 네 곳(구조체 선언, 바인딩 선언, 바인딩 참조 노드,
필드 접근마다)에 손으로 따로 적어야 했고, 이 네 곳이 서로 맞아떨어지는지도 손으로 맞춰야
했습니다. 폴리곤 슬롯이 어긋나는 버그 계열은 바로 여기서 나왔습니다. 단일 진실 공급원(SoT)
헬퍼는 레이아웃을 **한 번만** 선언하면 나머지를 이끌어 내고, 필드 이름과 타입은 타입
검사기가 검사합니다.

### IO 구조체: `ioStruct`

```ts
const VsOut = ioStruct('VsOut', {
  pos: builtin('position', vec4fT),
  uv: location(0, vec2fT),
  vis: location(1, f32T),
  view_w: location(2, f32T),
})
```

- **`builtin(name, type)`**: `@builtin(<name>)` 필드를 만듭니다. `name`은 WGSL 내장
  식별자(`'position'`, `'vertex_index'`, `'instance_index'`, `'front_facing'`,
  `'frag_depth'`, `'global_invocation_id'` 등)이며 그대로 전달됩니다. 닫힌
  `WgslBuiltinName` 유니온으로 타입이 정해져 있어서 오타나 GLSL 전용 표기는 작성 시점에
  `tsc` 오류로 잡히며, 파이프라인 생성 시점의 naga 오류로는 나타나지 않습니다.
- [**`location`**](./src/core/sot.ts): `@location(n)` 필드를 만들고, 필요하면
  `@interpolate(<mode>)`도 붙일 수 있습니다. `mode ∈ 'flat' | 'linear' | 'perspective'`이며,
  `'flat'`은 GLSL 백엔드도 그대로 지키는 모드입니다(양쪽에 `flat` 한정자를 생성합니다).
- **`VsOut.type`**: 이 구조체의 `ShaderType`입니다(파라미터 타입으로 쓸 때는
  `{ input: VsOut.type }`처럼 씁니다).
- **`VsOut.decl`**: 모듈의 `structs:` 배열에 넣는 `StructDecl`입니다.
- **`VsOut.of(node).uv`**: 구조체 값에서 타입이 정해진 필드를 **읽습니다**.
- **`VsOut.var('out')`**: 구조체의 `var`를 선언하고, 타입이 정해져 있으며 대입 가능한
  필드를 얻습니다. `o.pos.assign(…)`처럼 쓴 다음 `return o`로 돌려주면 됩니다. 프록시는
  값이 오는 자리에서 원래 노드처럼 동작합니다(#763 X14). **`o.$`**는 명시적으로 넘길 때
  쓰는, 구조체 값 자체를 가리키는 원래 노드입니다.
- **`VsOut.construct({ pos, uv, vis, view_w })`**: 구조체 값을 **한 표현식**으로
  만듭니다(필드 이름으로 키를 지정하며, 필드가 빠지거나 남으면 TS 오류가 됩니다). 값을
  바꿀 필요가 없다면 명령형으로 쓰던 `var out; out.uv = …; return out` 대신 이 방식을
  씁니다.

```ts
const pin = VsOut.of(p.input)   // pin.uv, pin.vis, … are typed reads
If(pin.vis.lt(0), () => { Discard() })
return RasterFragmentOutput.construct({ color: …, depth: … })
```

### 유니폼: `uniformStruct`

구조체와 그 바인딩을 함께 선언합니다.

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
// usage — `.field` for field access, `.x` chains straight off it:
const opacity = U.field.raster_params.x
const m = U.field.mvp
```

- **`U.struct`** / **`U.binding`**: 각각 모듈의 `structs:` / `bindings:` 배열에 넣습니다.
- **`U.field.<name>`**: 타입이 정해진 필드 접근 노드입니다. `.x`, `.mul` 등을 바로 이어
  붙일 수 있습니다.
- **`U.node`**: 바인딩 접근 노드입니다(직접 쓸 일은 거의 없습니다).

### 일반 구조체와 스토리지 요소 구조체: `structDecl`

스토리지 버퍼 요소 타입이나 중첩 구조체에 씁니다.

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

`.decl` / `.type`은 각각 모듈용 선언과 타입 토큰으로 씁니다. 타입이 정해진 필드를 읽을
때는 `.of(node).p0`나 `.get(node, 'p0')`를 씁니다.

### 스토리지 버퍼: `storageBuffer(name, element, …)`와 `.at(i).field`

**요소** 타입(`structDecl` / `ioStruct` 핸들이거나 스칼라 타입)으로부터 선언하는, 바인딩된
`array<Element>`입니다. `.at(i)`는 요소의 **타입이 정해진 필드 프록시**를 바로
돌려줍니다. `.of()`도, 요소 타입 인자도 필요 없습니다.

```ts
const segmentsB = storageBuffer('segments', ShapeSegment, { group: 0, binding: 9, access: 'read' })

const seg = segmentsB.at(i) // typed
seg.p0 // → Node<'vec2<f32>'>
seg.kind // → Node<'u32'>
```

**스칼라** 요소라면 `.at(i)`는 요소 Node를 바로 돌려줍니다. 모듈 배선에는 `.binding` /
`.node`를 씁니다.

### 텍스처와 샘플러: `resource`

```ts
const tex = resource('tex', texture2dfT, { group: 0, binding: 1 })
const texSampler = resource('tex_sampler', samplerT, { group: 0, binding: 2 })
// usage:
const c = textureSample(tex.node, texSampler.node, pin.uv)
```

`r.node`는 **구체적인** 키(`Node<'texture_2d<f32>'>`, `Node<'sampler'>`)를 그대로 지니고
있어서, 텍스처/샘플러 연산이 타입 검사를 받습니다. `r.binding`은 `bindings:` 배열에
넣습니다.

`textureSample`은 화면 공간 미분에서 얻은 **암시적 LOD**를 쓰므로 **프래그먼트
전용**입니다(버텍스/컴퓨트에서 쓰면 SD0109 린트 오류가 됩니다). 명시적 레벨이 필요하면
대신 `textureSampleLevel(tex, smp, uv, level)`을 씁니다. 이 함수는 모든 스테이지에서
씁니다. 미분 내장 함수 `fwidth` / `dpdx` / `dpdy`도 같은 이유로 프래그먼트
전용입니다(SD0109, #1654). 버텍스/컴퓨트용 형태가 아예 없으므로, 필요한 값은 미리
계산해서 넘겨야 합니다.

#### 2D 배열 텍스처: `texture2dArrayfT`

레이어 N개짜리 아틀라스를 바인딩 **하나** 뒤에 두고, 레이어는 **샘플할 때마다** 고릅니다.

```ts
const atlas = resource('atlas', texture2dArrayfT, { group: 0, binding: 1 })
const atlasSampler = resource('atlas_sampler', samplerT, { group: 0, binding: 2 })

textureSample(atlas.node, atlasSampler.node, uv, layer) // implicit LOD (fragment-only)
textureSampleLevel(atlas.node, atlasSampler.node, uv, layer, level) // explicit LOD, any stage
textureLoad(atlas.node, coord, layer, level) // unfiltered texel fetch
textureNumLayers(atlas.node) // → Node<'u32'> — how many layers the atlas has
```

함수 이름은 셋 다 같습니다. **첫 번째 인자의 키**가 배열 형태인지를 정하고, 그러면
`layer` 인자가 필수가 됩니다(빠뜨리면 런타임에서 놀라는 대신 tsc 오류로 잡힙니다).
`number` 타입의 layer는 **i32** 리터럴로 승격됩니다. WGSL은 레이어를 별도 인자로
표기하고(`texture_2d_array<f32>`에 대해 `textureSample(t, s, uv, layer)`), GLSL ES
3.00은 좌표 안에 접어 넣습니다(`texture(sampler2DArray, vec3(uv, float(layer)))`). 둘
다 코어 사양이라 어느 타깃에서도 별도 기능이 필요하지 않습니다. `reflect()`는 바인드
엔트리에 차원을 보고하므로(`textureDim: '2d-array'`), 호스트가 그에 맞는 뷰를 만들 수
있습니다.

`textureDimensions(atlas.node)`는 배열 텍스처에서도 **너비/높이만**(`vec2<u32>`)
돌려줍니다. 레이어 **개수**는 별도로 `textureNumLayers(atlas.node)`(`u32`,
#1658)로 얻으며, 실수 연산에 쓰려면 `toF32`로 감쌉니다. 배열 키에서만 쓸 수 있고(일반
2d 텍스처에 쓰면 tsc 오류입니다), 타깃마다 표기가 다릅니다. WGSL에는 전용 함수
`textureNumLayers(t)`가 있지만 GLSL ES 3.00에는 없어서 `uint(textureSize(t, 0).z)`로
읽습니다(이때 lod 인자가 필수이지만, 레이어 개수는 lod와 무관하므로 `0`을 넣으면 항상
맞습니다).

#### 정수 텍스처: `texture2duT` / `texture2diT`(배열 버전 포함)

텍셀이 필터링을 거치지 않는 **정확한 32비트 정수**인 텍스처입니다. id 맵, 값을 채워 넣은
색상 테이블, 비트필드 조회 등에 씁니다.

```ts
const ids = resource('ids', texture2duT, { group: 0, binding: 1 })

textureLoad(ids.node, coord, 0) // → Node<'vec4<u32>'>
textureDimensions(ids.node) // → Node<'vec2<u32>'>, same as any other texture
```

상수는 넷입니다. `texture2duT` / `texture2diT`, `texture2dArrayuT` /
`texture2dArrayiT`. **불러온 결과는 텍스처의 요소를 따라갑니다**. 부호 없는 요소에서는
`vec4<u32>`, 부호 있는 요소에서는 `vec4<i32>`이므로, 잘못된 키에 대입하면 값이 조용히
잘못 해석되는 대신 `tsc` 오류가 됩니다. 둘 다 두 타깃 모두에서 코어 사양입니다(WGSL `texture_2d<u32>`, GLSL ES 3.00
`usampler2D`). 그래서 어느 쪽도 별도 기능이 필요 없습니다.

**`textureSample`과 `textureSampleLevel`은 설계상 이 키들을 tsc에서 거부합니다.**
필터링은 가중 평균이고 정수 텍셀을 보간하는 것은 정의되어 있지 않으므로, WGSL에는
`texture_2d<u32>`용 `textureSample`이 아예 없습니다. GLSL의 `texture(usampler2D, …)`는
(NEAREST로) 동작은 하지만, 이를 허용하는 것이야말로 이 DSL이 막으려는 함정 그
자체입니다. WebGL2에서는 컴파일되지만 WebGPU에서는 표현할 수 없는 구성을 만들어 내기
때문입니다. 두 타깃이 정직하게 겹치는 부분은 **`textureLoad` + `textureDimensions` +
`textureNumLayers`**뿐이며, 이것이 쓸 수 있는 인터페이스의 전부입니다.

멀티샘플 정수 텍스처는 **표현할 수 없습니다**. `{ dim: '2d-ms', elem: 'u32' }`는 생성
시점에 예외를 던지는 대신, 애초에 타입 검사를 통과하지 못합니다.

`reflect()`는 차원과 함께 요소도 보고합니다(`textureElem: 'u32'`). 호스트가 바인딩을
만들 때 이 값이 필요합니다. WebGPU의 `sampleType`은 `'uint'` / `'sint'`여야 하고,
WebGL2는 정수 내부 포맷으로 뒷받침해야 합니다. 이를 잘못 맞춰도 오류는 나지 않습니다.
포맷과 샘플러 타입이 어긋난 텍스처는 그저 INCOMPLETE 상태가 되고, 이런 텍스처에
`texelFetch`를 하면 조용히 0을 돌려줍니다.

##### WebGL2의 `array<u32>` / `array<i32>` 스토리지

최상위 정수 스토리지 배열이 GLSL 백엔드에서 동작하게 해 주는 것이 바로 이 기능입니다.
WebGL2에는 SSBO가 없어서 `var<storage, read>` 배열은 데이터 텍스처로 하향
변환됩니다. 정수 배열은 이제 안전하게 차단하며 실패하는 대신, `usampler2D`는 R32UI
위에, `isampler2D`는 R32I 위에 얹히는 **타입이 정해진** 텍스처로 하향 변환됩니다.

```ts
const featIds = storageBuffer('feat_ids', u32T, { group: 0, binding: 0, access: 'read' })
featIds.at(i) // → Node<'u32'>; on GLSL this is a texelFetch, on WGSL a real SSBO read
```

그 데이터 텍스처를 할당하는 쪽은 **맞는 내부 포맷**을 지정해야 합니다. `array<u32>`가
하향 변환되는 `usampler2D`에는 `R32UI`를, `isampler2D`에는 `R32I`를, 실수인
경우에는 `R32F`를 씁니다. 이 짝을 런타임에 강제하는 장치는 없습니다. 포맷과 샘플러
타입이 어긋난 텍스처는 그저 INCOMPLETE 상태가 되고, 여기에 `texelFetch`를 하면 조용히
0을 돌려줍니다. 따로 추적하는 대신 `reflect()`에서 요소를 읽어야 합니다.

가장 먼저 떠오르는 방법은 따로 있습니다: 기존 **R32F** 텍스처에 정수를 그대로 실어
보내고 `floatBitsToUint`로 복원하는 방법입니다. GLSL ES 3.00 §2.1.1은 구현체가
비정규화 값을
**무엇이든** 영으로 밀어버리는 것을 허용하는데, 작은 정수는 비정규화된 f32 비트
패턴이라서(`1u`는 1.4e-45입니다) 이 경로는 값을 정당하게 잃어버릴 수 있습니다. 지금까지
측정된 모든 드라이버에서는 별 탈 없이 동작하는데, 바로 그 점 때문에 이 방식 위에
무언가를 쌓아서는 안 됩니다.

### 타입이 정해진 const 핸들과 fn 핸들

모듈 수준 WGSL const는 그냥 문자열로 된 `constRef('NAME')` 대신 `shaders/consts.ts`에서
가져오는 **타입이 정해진 핸들**로 씁니다(문자열의 오타는 컴파일은 되지만 WGSL 링크
시점에야 실패합니다).

```ts
import { PI, EARTH_R } from './consts'
const latRad = f32(2)
  .mul(atan(exp(mercYAbs)))
  .sub(PI.div(2))
```

**선언**할 때, 절단된 정밀도와 전체 정밀도로 나뉘어야 하는 스칼라(`PI`)는
`{ wgslValue, cpuValue }` 형태의 `ConstDecl`로 직접 작성합니다. **스칼라가 아닌** 상수,
즉 `vec4<f32>` 색상, `array<vec4<f32>, N>` 팔레트, 구조체라면 `constExpr`을 씁니다.
`constExpr`은 상수로 접을 수 있는 리터럴 Node를 받아 WGSL과 GLSL 양쪽에
`const <name>: <type> = <value>;`를 생성하고, CPU 오라클에서도 그 값을 계산합니다.

```ts
const SKY = constExpr('SKY', vec4fT, vec4(0.4, 0.6, 0.9, 1))
const PALETTE = constExpr('PALETTE', arrayT(vec4fT, 3), arrayLit(vec4fT, c0, c1, c2))
```

함수도 **핸들**입니다. 가져와서 바로 호출하면 되고, `callFn('name')`은 없습니다.

```ts
import { lonlatToEcef } from './ecef'
import { project, flat_rel } from './projections'
const ecef = lonlatToEcef(lonRad, latRad, f32(0))
```

핸들은 **위치 인자** `foo(a, b)`(느슨한 `NodeLike`)와 **타입이 정해진 객체**
`foo({ lon, lat })` 중 어느 쪽이든 받습니다. 객체 형태는 인자 이름, 타입, 빠짐없음을
검사하고 파라미터 자동완성도 제공합니다.

> **`externFn`**은 본문이 나중에 연결되는 함수(예: `configureProjections()` 이후에
> 만들어지는 투영 함수들)를 위한, 호출 전용 대응물입니다. `externFn`도 호출 방식은
> 똑같습니다(`f({a, b})` 또는 `f(a, b)`). 다른 점은 본문이 연결되는 시점뿐입니다.
> 일반적인 셰이더를 작성할 때는 실제 fn 핸들을 가져와 씁니다.
