---
id: capabilities-extensions
source: cc6bfe3cd72af696d736e062f789fd50e75a0f1d23b7f6df560d7e8ae0c1b00d
sourceLine: 1718
---

이 절을 읽고 나면 모듈에 필요한 GPU 기능을 선언하고, 그 기능이 타깃마다 어떤 비용으로
이어지는지 읽어 내고, 부팅된 디바이스가 그 기능을 갖추었는지 확인하고, 어떤 모듈 모양이
생성되는 대신 fail closed(드라이버가 거부할 소스를 내는 대신 컴파일 시점에 실패하는 것)로
실패하는지 가려낼 수 있게 됩니다.

기능(capability)은 모듈의 생성 결과가 의존하는 GPU 기능 하나를 가리키는 중립 id입니다.
float 텍스처에 렌더링하거나 그 텍스처에 블렌딩하는 것이 그런 기능의 예입니다.

### 기능 선언

모듈은 필요한 기능을 `enables`에 나열합니다.

```ts
module({ enables: ['floatRenderTarget'], funcs: [vs, fs] })
```

이 어휘는 고정되어 있고 타깃과 무관하므로, 모듈에 원시 `EXT_*`나 `OVR_*` 문자열이 그대로
나타나는 일은 없습니다. 각 id는 어떤 생성기가 모듈을 건드리기도 전에 실행되는 기능
게이트로 들어갑니다. 그래서 그 기능을 표현하지 못하는 백엔드는 문제가 된 기능의 이름을
담은 `UnsupportedFeatureError`(`SD0030`)를 던지며 fail closed로 실패하고, 드라이버가
거부할 소스는 결코 생성되지 않습니다.

### id별 타깃 요구 사항

id 하나 뒤에는 서로 다른 비용 두 가지가 숨어 있습니다. *호스트 기능*은 파이프라인을 만들기
전에 호스트가 미리 활성화해야 하는 절반으로, WebGL2에서는
`gl.getExtension('EXT_color_buffer_float')`, WebGPU에서는 `requiredFeatures` 항목이 이에
해당합니다. *소스 지시문*은 생성된 셰이더 자체가 담고 있어야 하는 토큰으로, GLSL ES
3.00에서는 `#extension … : require`, WGSL에서는 `enable …;`이며, 백엔드가 중복을 없애고
정렬해 대신 써 줍니다. GLSL에서는 이 지시문을 `#version` 줄 바로 뒤에, WGSL에서는 선언부
앞에 배치합니다.

기능 하나는 이 두 절반 중 하나만 필요할 수도, 둘 다 필요할 수도, 둘 다 필요 없을 수도
있습니다.

| `enables` id | WebGL2 및 GLSL ES 3.00 | WebGPU 및 WGSL |
| --- | --- | --- |
| `floatRenderTarget` | 호스트 기능 `EXT_color_buffer_float` | 코어 사양, 따로 요청할 것 없음 |
| `float32Blend` | 호스트 기능 `EXT_float_blend` | 호스트 기능 `float32-blendable` |
| `float32Filterable` | 호스트 기능 `OES_texture_float_linear` | 호스트 기능 `float32-filterable` |
| `multiview` | 지시문 `GL_OVR_multiview2`와 호스트 기능 `OVR_multiview2` | 미지원, fail closed로 실패 |
| `f16` | 미지원, fail closed로 실패 | 지시문 `f16`과 호스트 기능 `shader-f16` |
| `subgroups` | 미지원, fail closed로 실패 | 지시문 `subgroups`와 호스트 기능 `subgroups` |

호스트 반쪽만 있고 소스 반쪽이 없는 기능은 선언해도 생성되는 바이트 수가 그대로입니다.
`float32Blend`와 `float32Filterable`에 붙은 `32`는 핵심적인 역할을 하는 표기입니다. 두
기능 모두 32비트 float 전용이고, `EXT_color_buffer_float`는 16비트와 32비트 타깃을 모두
지원하기 때문에 `floatRenderTarget`에는 비트 폭 표기가 없습니다.

`capabilityMatrix`는 같은 정보를 데이터로 보고합니다. 이 정보는 백엔드 자신에게서 직접
뽑아낸 것이라, 도구나 페이지가 따로 옮겨 적지 않고도 그대로 출력할 수 있습니다.

```ts
capabilityMatrix([wgslBackend, glslEs300Backend])
// → [{ capability: 'storageBuffer', support: { wgsl: 'native', 'glsl-es300': 'unsupported' },
//      declarable: false },
//     …,
//     { capability: 'f16', support: { wgsl: 'directive', 'glsl-es300': 'unsupported' },
//      declarable: true }]
```

결과는 기능마다 한 행씩, 고정된 순서로 나오며, 모듈이 결코 선언하지 않는 세 기능도
`declarable: false`로 함께 돌아옵니다.

행 하나를 믿기 전에 알아 둘 점이 두 가지 있습니다.

- 지원은 도달 가능성과 다릅니다. `f16`, `subgroups`, `multiview`는 표가 말하는 타깃에서
  지원되지만, 셋 중 어느 것도 오늘은 작성할 수 없습니다. `f16` 스칼라 타입도, 서브그룹
  내장 함수도 없고, `layout(num_views = N) in;`을 쓰거나 `gl_ViewID_OVR`을 읽을 방법도
  없기 때문입니다. `multiview`를 선언한 모듈은 지시문만 생성하고 여전히 단일 뷰로
  렌더링합니다.
- 미지원 칸은 설계상 완전히 멈춰 서는 지점이라 생성 시 오류를 던집니다. 생성하기 전에
  미리 물어보려면 `diagnose(m, { backend })`가 같은 누락 기능을 `SD0030` 진단으로
  보고하며, 이때는 오류를 던지지 않습니다.

### 파생 기능과 암시적 기능

세 가지 기능은 파생됩니다. 즉 모듈의 모양에서 저절로 읽히며 직접 선언하는 대상이 아닙니다.
스토리지 바인딩은 `storageBuffer`를, 컴퓨트 진입점은 `compute`를, 멀티샘플 텍스처 로드는
`msaaTextureLoad`를 암시합니다. `enables`의 타입은 이 세 가지를 제외하도록 정해져 있어서,
그중 하나를 적으면 컴파일 오류가 됩니다.

한 기능이 다른 기능을 암시할 수도 있습니다. `float32Blend`는 `floatRenderTarget`을 함께
끌어옵니다. float 타깃에 블렌딩하려면 먼저 그 타깃이 색상 어태치먼트로 렌더링 가능한
상태여야 하는데, `EXT_float_blend`만 켜져 있으면 프레임버퍼가 INCOMPLETE 상태로 돌아오기
때문입니다. `reflect().requiredFeatures`는 이렇게 이어지는 전체 목록을 보고하므로, 모듈이
하나만 선언해도 둘 다 얻게 됩니다.

```ts
const m = module({ enables: ['float32Blend'], funcs: [vs, fs] })
reflect(m).requiredFeatures // ['float32Blend', 'floatRenderTarget']
```

이 목록은 항상 존재하며, 아무것도 필요하지 않은 모듈에서는 빈 배열이 됩니다.

### 부팅 시점 확인

기능을 선언한다고 해서 그 자체로 무언가가 활성화되지는 않습니다. 디바이스의 기능은
디바이스가 만들어지는 시점에, 모듈이 생성되기 훨씬 전에 이미 고정됩니다. WebGPU의
`requiredFeatures`는 `requestDevice` 호출 시점에 정해지며, 그때 요청하지 않은 기능은
이후에 결코 추가할 수 없습니다. WebGL2 컨텍스트는 이미 가져온 확장만 갖추고 있을 뿐입니다. 파이프라인을 만드는 시점에 물어보는 것은 이미 늦습니다.

그래서 작성자가 할 일은 부팅된 디바이스가 모듈이 필요로 하는 것을 갖추었는지 확인하고,
갖추지 못했다면 요란하게 실패하도록 만드는 것입니다. `reflect().requiredFeatures`는 중립
id를 내놓는데, 리플렉션은 모듈만 받을 뿐 타깃을 모르기 때문입니다. 그래서 이 id를
`hostFeaturesFor`에 통과시켜, 한 백엔드의 호스트가 실제로 필요로 하는 구체적인 문자열로
옮겨야 합니다. 호스트 반쪽이 없는 기능은 모두 건너뛰므로, 드라이버에 넘길 목록에 구멍이
생기지 않습니다.

```ts
import { hostFeaturesFor, reflect, glslEs300Backend, wgslBackend } from '@xgis/shader-dsl'

// WebGL2: verify the already-booted context has each extension.
for (const ext of hostFeaturesFor(glslEs300Backend, reflect(m).requiredFeatures)) {
  if (!gl.getExtension(ext)) throw new Error(`WebGL2 lacks ${ext}`)
}

// WebGPU: feed the same lookup into requestDevice, at boot.
const device = await adapter.requestDevice({
  requiredFeatures: hostFeaturesFor(wgslBackend, reflect(m).requiredFeatures),
})
```

### 두 모듈 중 고르기

`enables`는 강제 요구 사항을 표현하므로, 없어도 그만인 기능에는 맞지 않는 도구입니다.
폴백은 모듈 두 개와 결정 하나로 이루어지며, 디바이스가 이미 알려진 부팅 시점에
내려집니다.

```ts
const caps = reflect(fancy).requiredFeatures
const ok = hostFeaturesFor(glslEs300Backend, caps).every((e) => gl.getExtension(e))
const m = ok ? fancy : plain // two modules, one decision, made once
```

각 모듈은 여전히 자신에게 필요한 것을 스스로 선언합니다. 그래서 고르지 않은 쪽을 그
기능을 갖추지 못한 디바이스에서 골랐더라도, fail closed로 실패했을 것입니다.

### 이식 가능한 컴퓨트 커널

`portable: true`로 선언한 컴퓨트 진입점은 두 백엔드 모두에서 생성됩니다. WGSL에서는
`@compute`로 그대로 생성되고, GLSL ES 3.00에서는 별도의 생성 옵션 없이 동작하는
컴퓨트-투-프래그먼트 하향 변환을 거쳐 생성됩니다. 그 대가로 커널은 gather(읽기만 하는
접근) 전용 tier, 즉 커널이 속하는 지원 단계 안에 머물러야 하며, 이 tier에서는 모든 호출이
원하는 곳을 자유롭게 읽되 자기 자신의 인덱스 위치에만 원소 하나를 씁니다.

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
- `read_write` 스토리지 바인딩은 정확히 하나이고 그 원소 타입은 `u32`이므로 전체 타입은
  `array<u32>`이며, `gid.x` 위치에 정확히 한 번만 씁니다. scatter 쓰기, 두 번째 쓰기, 또는
  한 번도 쓰지 않는 경우는 모두 검증 실패로 이어집니다.
- 첫 번째 `uniform` 바인딩은 반드시 `vec4<u32>` 타입인 디스패치 유니폼이어야 하며, 그
  `.x`는 호출 횟수를, `.y`는 출력 그리드 너비를 가리킵니다. 나머지 두 성분은 예약되어
  있습니다. 여기서 첫 번째란 모듈의 `bindings` 목록에서 첫 번째라는 뜻이므로, 선언 순서가
  중요합니다.
- 진입점의 호출 그래프가 닿는 어디에도 `raw` 문을 쓸 수 없습니다. 타깃마다 다른 텍스트는
  이식성이라는 주장과 어긋나기 때문입니다.

이 모양을 벗어나는 것은 무엇이든 두 생성기 모두에서, 생성할 때마다 `SD0111`과 위반
사항별 해결책을 담은 오류로 검증에 실패합니다. 컴퓨트가 아닌 진입점에 `portable`을
선언하면 빌드 시점에 `SD0110`으로 실패합니다.

이 하향 변환은 커널이 생성되는 방식만이 아니라 디스패치되는 방식도 바꿉니다. WebGL2에서는
호스트가 컴퓨트 디스패치 대신 R32UI 타깃에 풀스크린 드로우를 제출합니다. `portable`을
선언하는 것 자체가 WebGL2 호스트에게 이 커널이 그 경로를 탈 자격이 있다고 알려 주는
신호입니다.

배리어, 워크그룹 메모리, 원자적 연산, scatter 쓰기, 다중 출력 커널은 이 tier 밖에 있습니다.
이 중 하나가 필요한 커널은 WebGPU 전용으로 남아야 하므로 `portable`을 빼거나, gather 전용
패스 여러 개로 작업을 재구성해야 합니다.
