---
id: capabilities-extensions
source: 324a2c18bff18d923ec35b51f9550b6f8038025a94b0b0bf4c990059f7952b9e
sourceLine: 1249
---

모듈은 생성에 필요한 GPU 기능을 중립 id로 선언합니다. 원시 `EXT_*` / `OVR_*`
문자열을 직접 쓰지 않습니다(#1650).

```ts
module({ enables: ['floatRenderTarget'], funcs: [vs, fs] })
```

각 id는 기능 게이트로 들어갑니다. 그래서 어떤 id를 표현하지 못하는 백엔드는 드라이버가
거부할 소스를 생성하는 대신, 문제가 된 기능의 이름을 담은 오류(`UnsupportedFeatureError` / `SD0030`)로
안전하게 차단하며 실패합니다. 리소스 관련 기능(`storageBuffer`, `compute`,
`msaaTextureLoad`)은 모듈의 모양에서 저절로 정해지며 여기서 직접 선언하는 대상이 아닙니다.
`enables`의 타입은 `readonly DeclarableCapability[]`(`Capability`에서 이 세 가지를 뺀
것)이므로, 이 셋 중 하나를 적으면 조용히 넘어가지 않고 컴파일 오류가 됩니다.

백엔드마다 `capProfile` 테이블을 정확히 하나 둡니다. 이 테이블은 중립 id를
`{ directive?, hostFeature? }`로 매핑하며 유일한 근거 역할을 합니다. 지원 범위는 테이블의
키에서 나오고, 확장 지시문 헤더는 각 행의 `directive` 값에서, 호스트 활성화 목록은 각
행의 `hostFeature` 값에서 나옵니다.

| `enables` id        | WebGL2 / GLSL ES 3.00                                                     | WebGPU / WGSL                                       |
| ------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------- |
| `floatRenderTarget` | 호스트: `EXT_color_buffer_float`                                            | 코어 사양(별도로 요청할 것 없음)                       |
| `float32Blend`      | 호스트: `EXT_float_blend`                                                   | 호스트: `float32-blendable`                           |
| `float32Filterable` | 호스트: `OES_texture_float_linear`                                          | 호스트: `float32-filterable`                          |
| `multiview`         | 소스: `#extension GL_OVR_multiview2 : require` 및 호스트: `OVR_multiview2`   | 미지원(OVR에 대응하는 것 없음), 차단형 실패             |
| `f16`               | 미지원(GLSL ES 3.00에 대응하는 것 없음)                                       | 소스: `enable f16;` 및 호스트: `shader-f16`            |
| `subgroups`         | 미지원(GLSL ES 3.00에 대응하는 것 없음)                                       | 소스: `enable subgroups;` 및 호스트: `subgroups`       |

기능 하나가 반쪽 중 하나만 필요할 수도, 둘 다 필요할 수도 있습니다. 그래서 표의 각 칸에는
해당 타깃에 필요한 반쪽을 모두 적습니다. 호스트 반쪽은 파이프라인을 만들기 전에 호스트가
직접 활성화해야 하는 부분을 가리킵니다. 소스 반쪽은 백엔드 스스로 지시문을 생성하는
부분으로(`#extension`은 `#version 300 es` 바로 뒤에, `enable`은 선언부 앞에 두며, 중복을
없애고 정렬합니다), `host` 반쪽만 있고 `source` 반쪽이 없는 기능은 선언해도 생성되는
바이트가 한 글자도 바뀌지 않습니다.
`float32Blend` / `float32Filterable`에 붙은 `32`에는 실제 의미가 있습니다. 두 기능 모두
32F 전용이며, `EXT_color_buffer_float`는 16F와 32F를 모두 지원하기 때문에
`floatRenderTarget`에는 비트 폭 표기가 없습니다.

기능은 다른 기능을 암시적으로 끌어들이기도 합니다. `float32Blend`는 `floatRenderTarget`을
함께 끌어옵니다. float 타깃에 블렌딩하려면 먼저 그 타깃이 색상 렌더링 가능한 상태여야
하기 때문입니다(`EXT_float_blend`만 있으면 FBO가 INCOMPLETE 상태가 됩니다).
`reflect().requiredFeatures`는 이렇게 연쇄적으로 필요해지는 기능 전체를 보고하므로, 모듈이
하나만 선언해도 둘 다 얻게 됩니다.

`multiview`의 한계: 이 기능이 실제로 마련해 주는 것은 지시문뿐입니다. DSL은 아직
`layout(num_views = N) in;`을 쓰거나 `gl_ViewID_OVR`을 읽지 못합니다. 그래서 `multiview`를
선언한 모듈은 `#extension` 줄만 생성할 뿐 여전히 단일 뷰로 렌더링합니다. 이 기능은
`#extension` 메커니즘이 끝까지 동작하는지 검증하기 위해 존재하며(#1670), 실제 멀티뷰
작성 기능은 이후 과제로 남아 있습니다.

### 활성화 권한: 확인은 부팅 시점에

기능을 선언한다고 해서 그 자체로 무언가가 활성화되지는 않습니다. 이 저장소의 런타임에서는
디바이스가 생성되는 시점에 디바이스 스스로 판단하며, 모듈이 생성되는 시점에는 이미 그
판단이 끝나 있습니다.

- **WebGL2**: 디바이스 생성자(`rhi-webgl2/src/rhi-webgl2.ts`)가 float 관련 확장 두
  가지(`EXT_color_buffer_float`, `EXT_float_blend`)를 둘 다 지원할 때 이미 `getExtension`으로
  가져옵니다.
- **WebGPU**: `requiredFeatures`는 `requestDevice`(`rhi-webgpu/src/gpu.ts`) 호출 시점에
  고정됩니다. 이때 요청하지 않은 기능은 나중에 추가할 방법이 없으므로, 파이프라인을 만드는
  시점에 요청하면 이미 늦습니다.

그래서 모듈을 작성하는 사람은 부팅된 디바이스가 모듈에 필요한 것을 갖추었는지 확인하고,
갖추지 못했다면 명확하게 실패하도록 만들어야 합니다.

필요한 기능 목록은 `reflect().requiredFeatures`가 항상 제공하며, 모듈이 아무것도 필요로
하지 않으면 빈 배열이 되고, 파생된 기능과 암시적으로 딸려 오는 기능까지 모두 포함합니다.
이 id들은 리플렉션 자체가 타깃과 무관하기 때문에 중립 값입니다. 그래서 호스트 활성화
조회 함수인 `hostFeaturesFor`로 타깃별 프로필을 거쳐 변환해야 합니다(호스트 반쪽이 없는
기능은 건너뛰므로, 드라이버에 넘길 목록에 `undefined` 구멍이 생기지 않습니다):

```ts
import { hostFeaturesFor, reflect, glslEs300Backend, wgslBackend } from '@xgis/shader-dsl'

// WebGL2 — verify the already-booted context has each extension.
for (const ext of hostFeaturesFor(glslEs300Backend, reflect(m).requiredFeatures)) {
  if (!gl.getExtension(ext)) throw new Error(`WebGL2 lacks ${ext}`)
}

// WebGPU — feed the SAME lookup into requestDevice, at boot.
const device = await adapter.requestDevice({
  requiredFeatures: hostFeaturesFor(wgslBackend, reflect(m).requiredFeatures),
})
```

### WebGL2의 컴퓨트: 이식 가능한 커널 등급(#1812)

`stage: 'compute'` 진입점에 `portable: true`를 선언하면 두 백엔드 모두에서 생성됨이
보장됩니다. WGSL에서는 `@compute`로 그대로 생성되고(`portable`은 WGSL 속성이 아니므로
생성되는 바이트가 전혀 바뀌지 않습니다), GLSL ES 3.00에서는 컴퓨트를 프래그먼트 GPGPU로
바꾸는 하향 변환(`lowerComputeToFragment`)을 거쳐 생성되며, 이때 별도의 생성 옵션이
필요 없습니다. 그 대가로 커널은 수집 전용 등급 안에 머물러야 합니다.

```ts
const kernel = fn(
  'eval_field',
  { gid: builtin('global_invocation_id', vec3uT) },
  ({ gid }) => {
    const fid = gid.x
    // … reads only, one write …
    outColor.at(fid).assign(pack4x8unorm(color))
  },
  { stage: 'compute', workgroupSize: 64, portable: true },
)
```

- `global_invocation_id`는 `.x`로만 씁니다(1차원 선형 인덱스).
- `read_write` 스토리지 바인딩은 정확히 하나이며, 원소 타입은 `array<u32>`이고, `gid.x`
  위치에 정확히 한 번만 씁니다. 흩어 쓰기, 두 번 이상 쓰기, 한 번도 쓰지 않는 경우는 모두
  검증 실패로 이어집니다.
- 첫 번째 `uniform` 바인딩은 `vec4<u32>` 타입의 디스패치 유니폼입니다.

  | field | meaning                   |
  | ----- | ------------------------- |
  | `.x`  | 호출 횟수                    |
  | `.y`  | 출력 그리드 너비(W_out)        |
  | `.z`  | 미사용(예약됨)                |
  | `.w`  | 미사용(예약됨)                |

- 진입점의 호출 그래프가 닿는 어디에도 `raw` 문을 쓸 수 없습니다(타깃별 탈출구는 이식성
  주장과 어긋나기 때문입니다).

이 모양을 벗어나면 두 생성기 모두, 생성할 때마다 매번 `SD0111`과 위반 사항별 해결
방법을 담은 오류로 검증에 실패합니다. `stage: 'compute'` 없이 `portable`만 선언하면 빌드
시점에 `SD0110`으로 실패합니다. `analyzePortableKernel`(`core/passes/portable-kernel.ts`)이
이 모양을 판단하는 유일한 근거이며, 린트 규칙 `portable-kernel`이 `validate()`가 실행될
때마다 이를 호출합니다.

호스트 계약: WebGL2 하향 변환은 커널이 생성되는 방식만이 아니라 디스패치되는 방식도
바꿉니다. 호스트는 컴퓨트 디스패치 대신 R32UI 타깃에 풀스크린 드로우를 제출해야 합니다.
`rhi-webgl2/src/compute-webgl2.ts`가 이 차이를 이미 흡수하므로, 커널을 작성하는 사람이
호출부마다 따로 고를 필요는 없습니다. `portable`을 선언하는 것 자체가 WebGL2 RHI에게 이
커널이 그 경로를 탈 수 있다고 알려 주는 신호입니다.

등급 밖의 경우: 배리어, 워크그룹 메모리, 원자적 연산, 흩어 쓰기, 다중 출력 커널은 v1에
들어 있지 않습니다. 오늘날 DSL에서는 `SD0111`이 이미 거부하는 모양을 거치지 않고서는
이들 중 어느 것도 작성할 수 없습니다. 이 가운데 하나가 필요한 커널은 `portable`을 빼고
WebGPU 전용으로 남거나, 수집 전용 패스 여러 개로 재구성해야 합니다.

`emulateCompute`는 이 등급에 자리를 내주고 폐기 예정입니다. 생성 호출부에서
`emulateCompute: true`를 쓰는 대신, 작성하는 자리에서 `portable: true`를 씁니다. 이
플래그는 지금도 그대로 동작하며 선언되지 않은 커널을 가리키는 동의어 역할을 계속하므로,
오늘 이 플래그를 쓰는 코드는 바꿀 필요가 없습니다.
