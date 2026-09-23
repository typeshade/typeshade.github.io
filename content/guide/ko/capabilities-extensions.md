---
id: capabilities-extensions
source: d357930bfc694c653423bafbf108d8acc35ad25d3bf0d235772e8b1a2b555ee0
sourceLine: 1861
---

이 절을 읽고 나면 모듈에 필요한 GPU 기능을 선언하고, 그 기능이 타깃마다 어떤 비용이
드는지 알아보고, 부팅된 디바이스가 그 기능을 갖추었는지 확인하고, 어떤 모양의 모듈이
코드를 생성하는 대신 fail closed(드라이버가 거부할 소스를 내는 대신 컴파일 시점에
실패하는 것)로 실패하는지 가려낼 수 있게 됩니다.

기능(capability)은 모듈이 생성하는 코드가 기대는 GPU 기능 하나에 붙인 중립 id입니다.
float 텍스처에 렌더링하기, float 텍스처에 블렌딩하기 같은 것이 여기에 해당합니다.

### 기능 선언

모듈은 필요한 기능을 `enables`에 나열합니다.

```ts
module({ enables: ['floatRenderTarget'], funcs: [vs, fs] })
```

이 id 목록은 고정되어 있고 어느 타깃에도 매이지 않으므로, `EXT_*`나 `OVR_*` 같은 확장
문자열을 모듈에 직접 적을 일은 없습니다. 각 id는 기능 게이트(capability gate)에서
검사되는데, 이 게이트는 어떤 생성기가 모듈을 손대기 전에 먼저 실행됩니다. 그래서 그
기능을 지원하지 않는 백엔드는 해당 기능의 이름을 담은 `UnsupportedFeatureError`(`SD0030`)를
던지며 fail closed로 실패하고, 드라이버가 거부할 소스는 아예 생성하지 않습니다.

### id별 타깃 요구 사항

id 하나 뒤에는 서로 다른 비용 두 가지가 숨어 있습니다. _호스트 기능_(host feature)은
호스트가 파이프라인을 만들기 전에 미리 켜 두어야 하는 쪽입니다. WebGL2에서는
`gl.getExtension('EXT_color_buffer_float')`, WebGPU에서는 `requiredFeatures` 항목이 여기에
해당합니다. _소스 지시문_(source directive)은 생성된 셰이더 코드 자체에 들어가야 하는
토큰입니다. GLSL ES 3.00에서는 `#extension … : require`, WGSL에서는 `enable …;`인데,
백엔드가 중복을 걸러내고 정렬해서 대신 적어 줍니다. GLSL에서는 `#version` 줄 바로 뒤에,
WGSL에서는 선언부 앞에 들어갑니다.

기능에 따라 이 둘 중 하나만 필요할 수도, 둘 다 필요할 수도, 둘 다 필요 없을 수도
있습니다.

| `enables` id         | WebGL2 및 GLSL ES 3.00                                    | WebGPU 및 WGSL                                                     |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------------ |
| `floatRenderTarget`  | 호스트 기능 `EXT_color_buffer_float`                      | 코어 사양, 따로 요청할 것 없음                                     |
| `float32Blend`       | 호스트 기능 `EXT_float_blend`                             | 호스트 기능 `float32-blendable`                                    |
| `float32Filterable`  | 호스트 기능 `OES_texture_float_linear`                    | 호스트 기능 `float32-filterable`                                   |
| `multiview`          | 지시문 `GL_OVR_multiview2`와 호스트 기능 `OVR_multiview2` | 미지원, fail closed로 실패                                         |
| `f16`                | 미지원, fail closed로 실패                                | 지시문 `f16`과 호스트 기능 `shader-f16`                            |
| `subgroups`          | 미지원, fail closed로 실패                                | 지시문 `subgroups`와 호스트 기능 `subgroups`                       |
| `clipDistances`      | 미지원, fail closed로 실패                                | 지시문 `clip_distances`와 호스트 기능 `clip-distances`             |
| `primitiveIndex`     | 미지원, fail closed로 실패                                | 지시문 `primitive_index`와 호스트 기능 `primitive-index`           |
| `dualSourceBlending` | 미지원, fail closed로 실패                                | 지시문 `dual_source_blending`과 호스트 기능 `dual-source-blending` |
| `bgra8unormStorage`  | 미지원, fail closed로 실패                                | 호스트 기능 `bgra8unorm-storage`, 파생                             |
| `packed4x8Dot`       | 미지원, fail closed로 실패                                | 코어 사양, 파생. 언어 기능 하나를 확인해야 함                      |

아래쪽 다섯 행은 아무도 직접 선언하지 않는 기능입니다. `@builtin("clip_distances")`,
`@builtin("primitive_index")`, `@blend_src(n)`을 적으면 해당 기능이 파생됩니다. WGSL은
이 셋을 저마다 짝이 맞는 `enable` 없이는 거부하기 때문입니다. `"bgra8unorm"` 스토리지
텍스처와 packed 4x8 계열 함수 호출도 각각 바인딩과 호출에서 기능을 끌어냅니다. 어떤
사용으로도 파생되지 않는 두 기능은 `"use typeshade"` 파일에서 `"use typeshade"` 옆에
문자열 지시문으로 적습니다.

```ts
'use typeshade'
'enable subgroups'
```

호스트 기능만 있고 소스 지시문이 없는 기능은 선언해도 생성되는 셰이더가 한 바이트도
달라지지 않습니다. `float32Blend`와 `float32Filterable` 이름에 붙은 `32`에는 이유가
있습니다. 두 기능이 기대는 확장이 모두 32비트 float 전용이기 때문입니다. 반면
`EXT_color_buffer_float`는 16비트와 32비트 타깃을 모두 지원하므로 `floatRenderTarget`에는
비트 폭을 적지 않습니다.

`capabilityMatrix`는 같은 정보를 데이터로 돌려줍니다. 백엔드에서 직접 뽑아낸 값이므로
도구나 문서 페이지가 손으로 옮겨 적지 않고 그대로 출력할 수 있습니다.

```ts
capabilityMatrix([wgslBackend, glslEs300Backend])
// → [{ capability: 'storageBuffer', support: { wgsl: 'native', 'glsl-es300': 'unsupported' },
//      declarable: false },
//     …,
//     { capability: 'f16', support: { wgsl: 'directive', 'glsl-es300': 'unsupported' },
//      declarable: true }]
```

결과는 기능마다 한 행씩 고정된 순서로 나오며, 모듈의 모양에서 파생되어 직접 선언할 일이 없는
일곱 기능(`storageBuffer`부터 `textureGather`까지)도 `declarable: false`로 함께 들어 있습니다.

표의 행을 그대로 믿기 전에 알아 둘 점이 두 가지 있습니다.

- 지원한다는 것과 실제로 쓸 수 있다는 것은 다릅니다. `f16`과 `multiview`는 표에 적힌
  타깃에서 지원되지만, 지금은 둘 다 셰이더에서 쓸 방법이 없습니다. `f16` 스칼라 타입이
  없고, `layout(num_views = N) in;`을 적거나 `gl_ViewID_OVR`을 읽을 길도 없기 때문입니다.
  `multiview`를 선언한 모듈은 지시문만 생성하고 여전히 단일 뷰로 렌더링합니다. 나머지 네 기능은
  쓸 수 있습니다. `clipDistances`, `primitiveIndex`, `dualSourceBlending`은 각 속성에
  필요한 기능입니다. `subgroups`는 컴퓨트나 프래그먼트 진입점에
  `@builtin("subgroup_invocation_id")`이나 `@builtin("subgroup_size")`를 적으면 쓰게
  됩니다. 다만 서브그룹 내장 함수(`subgroupAdd` 등)는 아직 없는데, 이는 기능과는 별개인
  빈자리입니다. 어떤 어댑터가 이 네 기능 가운데 하나를 실제로 갖추었는지 알려면
  `reflect().requiredFeatures`를 씁니다. 디바이스는 `requestDevice`에서 요청받은 선택
  기능만 갖습니다. 컴파일 게이트가 바로 그렇게 코퍼스에서 목록을 뽑아 요청하며,
  `examples/clip-planes.shade.ts`가 게이트의 Tint에서 컴파일되는 것도 그 덕분입니다. 이
  소프트웨어 어댑터는 `clip-distances`와 `subgroups`는 제공하지만 `primitive-index`는
  제공하지 않으므로, 그 한 행의 호스트 문자열은 여기서 확인하지 못했습니다.
- 미지원 칸은 의도적으로 넘어갈 수 없게 막아 둔 것이라, 생성하려 하면 오류를 던집니다.
  생성 전에 미리 확인하고 싶으면 `diagnose(m, { backend })`를 쓰면 됩니다. 같은 누락
  기능을 `SD0030` 진단으로 보고하되 오류는 던지지 않습니다.

### 파생 기능과 암시적 기능

몇몇 기능은 직접 선언하지 않고 모듈의 모양에서 저절로 파생됩니다. 스토리지 바인딩은
`storageBuffer`를, 컴퓨트 진입점은 `compute`를, 멀티샘플 텍스처 로드는
`msaaTextureLoad`를, 스토리지 텍스처 바인딩은 `storageTexture`를, 1D 텍스처는
`texture1d`를, 큐브 배열 텍스처는 `textureCubeArray`를, `textureGather` 호출은
`textureGather`를 암시합니다. packed 4x8 정수 내장 함수 여덟 개 가운데 하나를 호출하면
`packed4x8Dot`이 따라옵니다. `bgra8unormStorage`는 바인딩의 종류가 아니라 포맷에서
파생됩니다. `bgra8unorm`은 코어 사양에 들지 않는 유일한 스토리지 포맷이라, 디바이스는
`bgra8unorm-storage`를 요청받지 않았으면 바인드 그룹 레이아웃을 거부합니다. 이는 실측한
결과이며, Tint는 어느 쪽이든 모듈을 컴파일하므로 이 요구 사항을 호스트에 전하는 것은 이
기능뿐입니다. `enables`의 타입에서 파생 기능 id는 모두 빠져 있으므로, 하나라도 적으면
컴파일 오류가 납니다.

호스트가 확인해야 할 것이 기능만은 아닙니다. WGSL *언어* 기능(language feature)은
디바이스가 아니라 브라우저의 셰이딩 언어 구현이 갖는 속성입니다. 그래서 `requestDevice`에서
요청하는 대상이 전혀 아닙니다.
`reflect().requiredLanguageFeatures`는 모듈 소스가 쓰는 언어 기능을 나열하고, 지원 여부는
`navigator.gpu.wgslLanguageFeatures`가 답합니다. WGSL 생성기는 `read`나 `read_write`로
바인딩한 스토리지 텍스처에 `requires readonly_and_readwrite_storage_textures;`를 생성합니다.
packed 4x8 계열은 지시문 없이도 컴파일되므로 지시문을 생성하지 않습니다.

한 기능이 다른 기능을 암시할 수도 있습니다. `float32Blend`는 `floatRenderTarget`을 함께
끌어옵니다. float 타깃에 블렌딩하려면 먼저 그 타깃이 색상 어태치먼트로 렌더링 가능한
상태여야 하는데, `EXT_float_blend`만 켜져 있으면 프레임버퍼가 INCOMPLETE 상태로 돌아오기
때문입니다. `reflect().requiredFeatures`는 이렇게 딸려 오는 기능까지 모두 모은 목록을
돌려주므로, 모듈이 하나만 선언해도 둘 다 들어 있습니다.

```ts
const m = module({ enables: ['float32Blend'], funcs: [vs, fs] })
reflect(m).requiredFeatures // ['float32Blend', 'floatRenderTarget']
```

이 목록은 항상 있고, 필요한 기능이 없는 모듈에서는 빈 배열입니다.

### 부팅 시점 확인

기능을 선언한다고 해서 무언가가 켜지지는 않습니다. 디바이스가 어떤 기능을 갖는지는
디바이스를 만드는 시점에 정해지며, 모듈을 생성하는 시점보다 한참 앞입니다. WebGPU의
`requiredFeatures`는 `requestDevice`를 호출할 때 확정되고, 그때 요청하지 않은 기능은
나중에 추가할 수 없습니다. WebGL2 컨텍스트도 이미 가져온 확장만 쓸 수 있습니다.
파이프라인을 만들 때 확인하면 이미 늦습니다.

그래서 작성자는 부팅된 디바이스가 모듈에 필요한 기능을 갖추었는지 확인하고, 없으면 바로
눈에 띄게 실패시켜야 합니다. `reflect().requiredFeatures`가 돌려주는 것은 중립 id입니다.
리플렉션은 모듈만 받고 타깃은 모르기 때문입니다. 이 id를 `hostFeaturesFor`에 넘기면 특정
백엔드의 호스트가 실제로 요구하는 문자열로 바꿔 줍니다. 호스트 기능이 없는 기능은 모두
건너뛰므로, 드라이버에 넘길 목록에 빈자리가 생기지 않습니다.

```ts
import { hostFeaturesFor, reflect, glslEs300Backend, wgslBackend } from 'typeshade'

// WebGL2: verify the already-booted context has each extension.
for (const ext of hostFeaturesFor(glslEs300Backend, reflect(m).requiredFeatures)) {
  if (!gl.getExtension(ext)) throw new Error(`WebGL2 lacks ${ext}`)
}

// WebGPU: feed the same lookup into requestDevice, at boot.
const device = await adapter.requestDevice({
  requiredFeatures: hostFeaturesFor(wgslBackend, reflect(m).requiredFeatures) as GPUFeatureName[],
})
```

### 두 모듈 중 고르기

`enables`는 반드시 있어야 하는 기능을 적는 자리이므로, 없어도 되는 기능을 다루는 데는
맞지 않습니다. 폴백은 모듈 두 개와 결정 하나면 됩니다. 결정은 디바이스가 이미 정해진
부팅 시점에 한 번 내립니다.

```ts
const caps = reflect(fancy).requiredFeatures
const ok = hostFeaturesFor(glslEs300Backend, caps).every((e) => gl.getExtension(e))
const m = ok ? fancy : plain // two modules, one decision, made once
```

두 모듈 모두 필요한 기능을 각자 선언하고 있으므로, 고르지 않은 쪽을 그 기능이 없는
디바이스에서 골랐더라도 fail closed로 실패했을 것입니다.

### 이식 가능한 컴퓨트 커널

`portable: true`로 선언한 컴퓨트 진입점은 두 백엔드 모두에서 생성됩니다. WGSL에서는
`@compute` 진입점으로 그대로 나오고, GLSL ES 3.00에서는 컴퓨트를 프래그먼트 셰이더로
바꾸는 하향 변환(lowering)을 거쳐 나옵니다. 이 변환에는 별도의 생성 옵션이 필요 없습니다.
그 대신 커널은 gather(읽기만 하는 접근) 전용 tier(커널이 속하는 지원 단계) 안에 머물러야
합니다. 이 tier에서는 각 호출이 어디든 자유롭게 읽되, 쓰기는 자기 인덱스 위치의 원소
하나에만 합니다.

```ts
const dispatch = resource('dispatch', vec4uT, { group: 0, binding: 0 })
const field = storageBuffer('field', f32T, { group: 0, binding: 1, access: 'read' })
const outColor = storageBuffer('out_color', u32T, { group: 0, binding: 2, access: 'read_write' })

const kernel = fn(
  'eval_field',
  { gid: builtin('global_invocation_id', vec3uT) },
  voidT,
  ({ gid }) => {
    const fid = gid.x
    If(fid.ge(dispatch.node.x), () => {
      Return()
    })
    outColor.at(fid).assign(pack4x8unorm(vec4(field.at(fid), 0, 0, 1)))
  },
  { stage: 'compute', workgroupSize: 64, portable: true },
)

const m = module({
  bindings: [dispatch.binding, field.binding, outColor.binding],
  funcs: [kernel],
})
```

이 tier의 모양은 정확히 이렇습니다.

- `global_invocation_id`는 `.x`로만 읽으며, 1차원 선형 호출 인덱스를 가리킵니다.
- `read_write` 스토리지 바인딩은 정확히 하나이고 원소 타입이 `u32`이므로 타입은
  `array<u32>`이며, `gid.x` 위치에 정확히 한 번 씁니다. scatter 쓰기를 하거나, 두 번
  쓰거나, 한 번도 쓰지 않으면 검증에 실패합니다.
- 첫 번째 `uniform` 바인딩은 `vec4<u32>` 타입의 디스패치 유니폼이어야 합니다. `.x`가 호출
  횟수, `.y`가 출력 그리드 너비이고 나머지 두 성분은 예약되어 있습니다. 여기서 첫 번째란
  모듈의 `bindings` 목록에서 첫 번째라는 뜻이므로 선언 순서가 중요합니다.
- 진입점의 호출 그래프가 닿는 곳 어디에도 `raw` 문(statement)을 둘 수 없습니다. 타깃마다
  다른 텍스트가 들어가면 이식 가능하다는 말이 성립하지 않기 때문입니다.

이 모양에서 벗어나면 두 생성기 모두 생성할 때마다 검증에 실패하며, 오류에는 `SD0111`과
위반 사항별 해결 방법이 담깁니다. 컴퓨트가 아닌 진입점에 `portable`을 선언하면 빌드
시점에 `SD0110`으로 실패합니다.

이 하향 변환은 커널을 생성하는 방식과 함께 디스패치하는 방식도 바꿉니다. WebGL2에서는
호스트가 컴퓨트 디스패치 대신 R32UI 타깃에 풀스크린 드로우를 제출합니다. WebGL2 호스트는
`portable` 선언을 보고 이 커널을 그 경로로 보낼 수 있다고 판단합니다.

배리어, 워크그룹 메모리, 원자 연산, scatter 쓰기, 다중 출력 커널은 이 tier 밖에 있습니다.
이 가운데 하나라도 필요한 커널은 WebGPU 전용으로 두고 `portable`을 빼거나, 작업을 gather
전용 패스 여러 개로 나누어야 합니다.
