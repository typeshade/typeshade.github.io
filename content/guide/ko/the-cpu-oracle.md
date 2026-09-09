---
id: the-cpu-oracle
source: a5e59fa93ff8a83fbea9c15cd55b3ad62fe28d92829ca4965b1ea6d6a26877aa
sourceLine: 1252
---

이 절을 다 읽고 나면 모듈을 CPU에서 배정밀도로 실행하고, 그 결과를 GPU가 만들어 낸 값과
비교할 수 있습니다.

셰이더가 계산해야 하는 값이 무엇인지 답을 주는 것이 CPU 오라클이며, WGSL·GLSL 생성기가
읽는 것과 같은 IR 위에서 동작하는 세 번째 백엔드입니다. 디바이스도 브라우저도 없이
JavaScript에서 모듈을 실행하며, 모듈 안의 모든 함수는 숫자를 넘기면 숫자를 돌려받는 호출
가능한 값이 됩니다. 픽셀이 잘못 나왔을 때 GPU 실행 결과를 견주어 보는 기준이 바로 이
값입니다. 두 GPU 생성기가 실행하는 것과 같은 검증을 실행하므로, 오라클이 거부하는 모듈은
두 생성기도 그대로 거부합니다.

### CPU용으로 모듈 컴파일하기

`compileModule(m)`은 `CpuModule`을 돌려줍니다. 함수 이름을 키로 삼는 `fns` 레코드와,
모듈이 읽는 리소스를 위한 `setBinding` 메서드로 이루어져 있습니다. 진입점과 헬퍼 함수는
모두 `fns` 안에, 선언할 때 쓴 이름 그대로 들어 있습니다. 이 경계를 넘나드는 값은 평범한
JavaScript입니다. 스칼라는 `number`나 `boolean`이고, 벡터나 행렬은 평평한 `number[]`이며,
구조체는 필드 이름을 키로 삼는 객체입니다.

```ts
import { module, fn, vec2fT, dot, sqrt, compileModule } from '@xgis/shader-dsl'

const len = fn('len', { p: vec2fT }, ({ p }) => sqrt(dot(p, p)))
const m = module({ funcs: [len] })

const cpu = compileModule(m)
cpu.fns.len([3, 4]) // → 5
```

`compileModule`은 호출할 때마다 IR을 노드 단위로 훑습니다. `compileModuleJs(m)`은 같은
인자를 받아 같은 형태를 돌려주며, 각 함수 본문을 한 번만 훑어 JavaScript 소스를 생성한
뒤 그 소스를 `new Function`으로 빌드합니다. 같은 모듈을 프레임마다, 또는 행 전체 버퍼에
걸쳐 수천 번 실행할 때 이 함수를 씁니다. 생성할 수 없는 본문은 그 함수 하나만
인터프리터로 되돌아가므로, 호출하는 자리를 바꾸지 않고도 모듈 일부는 컴파일되고 일부는
해석될 수 있습니다. 호출하는 쪽에서 따로 처리해야 하는 경우는 하나뿐입니다. `eval`을
금지하는 호스트에서는 `new Function` 자체가 오류를 던지므로, 이때는 `compileModule`을
쓰면 됩니다.

### 바인딩과 호출

바인딩은 파이프라인이 공급하는 리소스, 즉 유니폼 블록, 스토리지 버퍼, 텍스처,
샘플러입니다. 오라클 뒤에는 이런 리소스를 뒷받침하는 GPU 메모리가 없으므로, 첫 호출 전에
`setBinding(name, value)`로 값을 직접 공급합니다. 이름은 선언이 지니는 이름 그대로이며,
유니폼 구조체라면 `as` 이름이고 스토리지 버퍼나 `resource`라면 선언한 이름입니다.
`reflect(m).bindGroups`는 하향 변환 과정이 주입한 것을 포함해, 호스트가 채워야 할 모든
바인딩을 나열합니다. 오라클은 실제로 실행하는 함수가 읽는 바인딩만 요구하므로, f64
연산이 있는 모듈이라도 [fp64](/guide/authoring/fp64/)에서 설명하는, 주입된 `_fp64` 가드
텍스처에는 값을 줄 필요가 없습니다. 함수가 읽는데도
아무 값도 설정하지 않은 바인딩은 `shader-dsl/cpu: unbound <name>`을 던집니다.

```ts
import { module, fn, uniformStruct, storageBuffer, f32T, u32T, compileModule } from '@xgis/shader-dsl'

const U = uniformStruct('U', { group: 0, binding: 0, as: 'u' }, { scale: f32T })
const data = storageBuffer('data', f32T, { group: 0, binding: 1, access: 'read' })

const scale_at = fn('scale_at', { i: u32T }, ({ i }) => data.at(i).mul(U.field.scale))
const m = module({ uses: [U, data], funcs: [scale_at] })

const cpu = compileModule(m)
cpu.setBinding('u', { scale: 2 }) // a uniform block: an object keyed by field name
cpu.setBinding('data', [1, 2, 3]) // a buffer: one flat array
cpu.fns.scale_at(2) // → 6
```

배열과 구조체는 참조로 유지되므로, `read_write` 스토리지 버퍼는 제자리에서 값이
바뀝니다. 배열을 바인딩하고 호출을 실행한 뒤, 결과를 읽으려면 그 배열을 다시 읽으면
됩니다. `f64` 값은 이쪽에서는 JavaScript 숫자 하나입니다. GPU에서는 이를 상위 부분과
하위 부분, 즉 f32 값 한 쌍으로 나르며, `splitF64(x)`는 호스트가 버퍼에 채워 넣을 수
있도록 그 쌍을 돌려줍니다. 그래서 양쪽은 같은 값을 각자에게 필요한 형태로 나타냅니다.

### f64와 f32 정밀도 모드

두 컴파일 함수 모두 `precision` 옵션을 받으며, 이 옵션이 f32 연산을 어떻게 계산할지
정합니다. 기본값인 `'f64'`에서는 모든 연산이 중간에 반올림 없이 JavaScript의 배정밀도로
실행되므로, 결과는 유효 비트 53개까지 수학적으로 의도된 값 그대로입니다. 모듈이 올바른
연산을 올바른 순서로 골랐는지 물을 때 이 모드를 씁니다. 값이 32비트에 눌려 들어갈 때만
나타나는 오류는 구조상 이 모드로는 보이지 않습니다.

`'f32'`에서는 f32 타입의 모든 연산이 계산된 뒤 f32로 반올림되고, 오버플로가 나면
무한대가 되며, 이는 GPU 백엔드에 건네는 것과 같은 모듈을 대상으로 합니다. 타깃이 실제로
이 값을 계산하는지 물을 때 이 모드를 쓰며, 그러면 GPU 리드백과의 비교를 실제 불일치를
가려버릴 만큼 넓은 허용 오차 대신 ulp 단위로 좁혀 볼 수 있습니다.

```ts
import { module, fn, f32T, compileModule } from '@xgis/shader-dsl'

const acc = fn('acc', { a: f32T, b: f32T }, ({ a, b }) => a.add(b))
const m = module({ funcs: [acc] })

compileModule(m).fns.acc(1, 2 ** -30) // → 1.0000000009313226
compileModule(m, { precision: 'f32' }).fns.acc(1, 2 ** -30) // → 1
```

이 모드는 에뮬레이션된 `f64` 타입과는 별개이며, [fp64](/guide/authoring/fp64/)에서
다룹니다. `f64`는 이쪽에서는 온전한 배정밀도 값 그대로 남아 있지만, GPU에서는 유효 비트
약 48개를 나르는 f32 값 쌍으로 실행됩니다. 이런 모듈에 대해서는 WGSL, GLSL, CPU의
결과가 그 폭 안에서 일치합니다.

그렇다면 비교는 GPU가 쓴 버퍼를 읽어, 같은 모듈을 CPU에서 실행한 결과와 한 행씩 맞춰
봅니다.

```ts
import { compileModuleJs } from '@xgis/shader-dsl'

// m: the module from the bindings sample above.
const cpu = compileModuleJs(m, { precision: 'f32' })
cpu.setBinding('u', { scale: 2 })
cpu.setBinding('data', Array.from(rows)) // rows: the input the GPU run was given

// gpuOut: the Float32Array read back from that GPU run.
for (let i = 0; i < gpuOut.length; i++) {
  const expected = cpu.fns.scale_at(i) as number
  if (Math.abs(gpuOut[i] - expected) > 1e-6) {
    throw new Error(`row ${i}: GPU ${gpuOut[i]}, CPU ${expected}`)
  }
}
```

### CPU에서 의미가 없는 호출

호출이 다다르면 오류를 던지는 대상이 세 가지 있습니다. `rawStmt` 페이로드는 IR이 전혀
읽지 않는 타깃 텍스트이므로, 어떤 표기를 담고 있든 여기서는 계산할 방법이 없습니다. 어떤
컴포저도 채워 넣지 않은 플레이스홀더는 자신의 태그와 함께 오류를 던지며, 이 태그가 빠진
삽입 지점을 찾아 줍니다. GPU 전용 내장 함수는 계산할 근거가 아예 없습니다. 텍스처를 읽는
`textureSample`, `textureSampleLevel`, `textureLoad`와 이들의 배열 형태, 질의 함수인
`textureDimensions`와 `textureNumLayers`, 미분 함수인 `dpdx`, `dpdy`, `fwidth`가 여기에
해당합니다. 이 목록은 `ORACLE_GPU_STUB_NAMES`로 내보냅니다.

`{ gpuStubs: true }`로 컴파일하면 이런 내장 함수가 플레이스홀더 값으로 바뀝니다. 텍스처
읽기는 불투명한 검정이 되고, 미분 함수는 영이 되며, `textureDimensions`는 1×1 크기가
되고, `textureNumLayers`는 레이어 하나가 됩니다. 오류 메시지에는 어떤 내장 함수인지와 이
옵션 이름이 함께 담깁니다. 프래그먼트 함수가 의존하지 않는 샘플 주변에서 계산하는 기하
구조를 확인하는 것처럼, 묻고자 하는 질문에 대신하는 값으로 충분할 때 이 옵션을 넘깁니다.
호출이 스텁으로 바뀌기 전에 모듈이 텍스처와 샘플러 변수를 먼저 읽으므로, 바인딩은
여전히 설정해 두어야 합니다.

```ts
import { module, fn, resource, texture2dfT, samplerT, vec2fT, textureSample, compileModule } from '@xgis/shader-dsl'

const tex = resource('tex', texture2dfT, { group: 0, binding: 0 })
const smp = resource('smp', samplerT, { group: 0, binding: 1 })

const shade = fn('shade', { uv: vec2fT }, ({ uv }) => textureSample(tex.node, smp.node, uv), {
  stage: 'fragment',
})
const cpu = compileModule(module({ uses: [tex, smp], funcs: [shade] }), { gpuStubs: true })

cpu.setBinding('tex', 0) // the value is never read under a stub
cpu.setBinding('smp', 0)
cpu.fns.shade([0.5, 0.5]) // → [0, 0, 0, 1]
```
