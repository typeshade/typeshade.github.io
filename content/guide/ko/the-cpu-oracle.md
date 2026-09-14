---
id: the-cpu-oracle
source: a5e59fa93ff8a83fbea9c15cd55b3ad62fe28d92829ca4965b1ea6d6a26877aa
sourceLine: 1252
---

이 절을 다 읽고 나면 모듈을 CPU에서 배정밀도로 실행하고, 그 결과를 GPU가 만들어 낸 값과
비교할 수 있습니다.

CPU 오라클은 WGSL·GLSL 생성기가 읽는 것과 같은 IR 위에서 동작하는 세 번째 백엔드로,
셰이더가 계산해야 하는 값이 무엇인지 답해 줍니다. 디바이스도 브라우저도 없이
JavaScript에서 모듈을 실행하며, 모듈 안의 함수는 하나하나 숫자를 넘기고 숫자를 돌려받는
JavaScript 함수가 됩니다. 픽셀이 잘못 나왔을 때 GPU 실행 결과를 견주어 보는 기준이 이
답입니다. 검증도 두 GPU 생성기와 같은 것을 거치므로, 오라클이 거부하는 모듈은 두
생성기도 거부합니다.

### CPU용으로 모듈 컴파일하기

`compileModule(m)`은 `CpuModule`을 돌려줍니다. 함수 이름을 키로 삼는 `fns` 레코드와,
모듈이 읽는 리소스에 값을 넣는 `setBinding` 메서드로 이루어져 있습니다. 진입점과 헬퍼
함수는 모두 `fns` 안에, 선언할 때 쓴 이름 그대로 들어 있습니다. 함수에 넘기고 돌려받는
값은 그냥 JavaScript 값입니다. 스칼라는 `number`나 `boolean`이고, 벡터나 행렬은 중첩 없이
펼친 `number[]`이며, 구조체는 필드 이름을 키로 삼는 객체입니다.

```ts
import { module, fn, vec2fT, dot, sqrt, compileModule } from '@xgis/shader-dsl'

const len = fn('len', { p: vec2fT }, ({ p }) => sqrt(dot(p, p)))
const m = module({ funcs: [len] })

const cpu = compileModule(m)
cpu.fns.len([3, 4]) // → 5
```

`compileModule`은 호출할 때마다 IR을 노드 단위로 훑습니다. `compileModuleJs(m)`은 같은
인자를 받아 같은 모양의 결과를 돌려주지만, 함수 본문마다 한 번만 훑어 JavaScript 소스를
만들고 그 소스를 `new Function`으로 함수로 만듭니다. 같은 모듈을 프레임마다 실행하거나
버퍼의 모든 행에 걸쳐 수천 번 실행할 때 이쪽을 씁니다. 소스를 만들 수 없는 본문은 그
함수 하나만 인터프리터로 실행하므로, 호출하는 쪽은 그대로 두고 모듈 안에서 함수마다
컴파일과 해석이 섞일 수 있습니다. 호출하는 쪽에서 따로 처리해야 하는 경우는
하나뿐입니다. `eval`을 금지하는 호스트에서는 `new Function` 자체가 오류를 던지므로,
이때는 `compileModule`을 쓰면 됩니다.

### 바인딩과 호출

바인딩은 유니폼 블록, 스토리지 버퍼, 텍스처, 샘플러처럼 파이프라인이 공급하는
리소스입니다. 오라클에는 이런 리소스를 담아 둘 GPU 메모리가 없으므로, 처음 호출하기 전에
`setBinding(name, value)`로 값을 하나씩 직접 넣어 줍니다. 이름은 선언에 적은 이름을
그대로 씁니다. 유니폼 구조체라면 `as`에 적은 이름이고, 스토리지 버퍼나 `resource`라면
선언할 때 준 이름입니다. `reflect(m).bindGroups`는 하향 변환(lowering)이 끼워 넣은
것까지 포함해, 호스트가 채워야 할 바인딩을 모두 나열합니다. 오라클은 실행하는 함수가
실제로 읽는 바인딩만 요구합니다. 그래서 f64 연산이 있는 모듈이라도, 하향 변환이 끼워
넣는 `_fp64` 가드 텍스처([fp64](/guide/authoring/fp64/) 참고)에는 값을 넣지 않아도
됩니다. 함수가 읽는 바인딩에 값을 넣어 두지 않았으면
`shader-dsl/cpu: unbound <name>` 오류를 던집니다.

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

배열과 구조체는 참조로 들고 있으므로, `read_write` 스토리지 버퍼에 쓰면 넘긴 배열이 그
자리에서 바뀝니다. 배열을 바인딩하고 함수를 호출한 뒤, 같은 배열에서 결과를 읽으면
됩니다. `f64` 값은 CPU 쪽에서는 JavaScript 숫자 하나입니다. GPU는 같은 값을 상위 부분과
하위 부분, 두 개의 f32 값으로 나누어 나르며, 호스트가 버퍼에 채워 넣을 그 쌍은
`splitF64(x)`가 만들어 줍니다. 양쪽 모두 같은 수를 각자에게 맞는 모양으로 담는 셈입니다.

### f64와 f32 정밀도 모드

두 컴파일 함수 모두 `precision` 옵션을 받으며, 이 옵션이 f32 연산을 어떻게 계산할지
정합니다. 기본값인 `'f64'`에서는 모든 연산을 중간 반올림 없이 JavaScript의 배정밀도로
계산하므로, 결과는 유효 비트 53개 안에서 수식대로 계산한 값 그대로입니다. 모듈이 맞는
연산을 맞는 순서로 골랐는지 확인할 때 이 모드를 씁니다. 값을 32비트로 줄일 때에만
드러나는 오차는 이 모드로는 원래 잡히지 않습니다.

`'f32'`에서는 GPU 백엔드에 넘기는 것과 같은 모듈을 그대로 두고, f32 타입 연산마다
결과를 f32로 반올림하며 오버플로가 나면 무한대로 만듭니다. 타깃이 정말 이 값을
계산하는지 확인할 때 이 모드를 씁니다. 그러면 GPU에서 읽어 온 값과 비교할 때 진짜
불일치를 가릴 만큼 넓은 허용 오차 대신 ulp 단위로 좁혀서 볼 수 있습니다.

```ts
import { module, fn, f32T, compileModule } from '@xgis/shader-dsl'

const acc = fn('acc', { a: f32T, b: f32T }, ({ a, b }) => a.add(b))
const m = module({ funcs: [acc] })

compileModule(m).fns.acc(1, 2 ** -30) // → 1.0000000009313226
compileModule(m, { precision: 'f32' }).fns.acc(1, 2 ** -30) // → 1
```

이 모드는 [fp64](/guide/authoring/fp64/)에서 다루는 에뮬레이션 `f64` 타입과는
별개입니다. `f64` 값은 CPU에서는 온전한 배정밀도 그대로이고, GPU에서는 유효 비트 약
48개를 담는 f32 값 쌍으로 계산됩니다. 이런 모듈은 WGSL, GLSL, CPU의 결과가 그 폭 안에서
서로 일치합니다.

비교할 때는 GPU가 쓴 버퍼를 읽어 와서, 같은 모듈을 CPU에서 한 행씩 실행한 결과와 맞춰
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

호출이 닿으면 오류를 던지는 것이 세 가지 있습니다. `rawStmt`의 페이로드는 IR이 읽지
않는 타깃 언어 텍스트이므로, 어떤 표기가 들어 있든 CPU에서는 계산할 수 없습니다. 어떤
컴포저도 바꿔 넣지 않은 플레이스홀더는 태그를 담아 오류를 던지므로, 어디에 끼워 넣기가
빠졌는지 태그로 찾을 수 있습니다. GPU 전용 내장 함수는 계산할 재료 자체가 없습니다.
텍스처를 읽는 `textureSample`, `textureSampleLevel`, `textureLoad`와 그 배열 텍스처용
변형, 크기를 묻는 `textureDimensions`와 `textureNumLayers`, 미분을 구하는 `dpdx`,
`dpdy`, `fwidth`가 여기에 듭니다. 이 목록은 `ORACLE_GPU_STUB_NAMES`라는 이름으로 내보내
둡니다.

`{ gpuStubs: true }`를 주고 컴파일하면 이런 내장 함수는 대신 쓸 값을 돌려줍니다. 텍스처
읽기는 불투명한 검정이 되고, 미분은 영이 되며, `textureDimensions`는 1×1 크기가 되고,
`textureNumLayers`는 레이어 하나가 됩니다. 옵션 없이 던지는 오류 메시지에는 어떤 내장
함수인지와 이 옵션의 이름이 함께 적혀 있습니다. 확인하려는 것이 대신 쓴 값으로도 답이
나오는 질문일 때 이 옵션을 넘깁니다. 예를 들어 프래그먼트 함수가 샘플 값 자체에는
의존하지 않고 그 주변에서 계산하는 기하 정보를 확인할 때가 그렇습니다. 다만 바인딩은
여전히 넣어 두어야 합니다. 호출을 스텁으로 바꾸기 전에 모듈이 텍스처와 샘플러 변수를
먼저 읽기 때문입니다.

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
