---
id: the-cpu-oracle
source: c38a4f3e836a893d51238209a14f379f12d7603f6a0c7ec41217c650a283f4c4
sourceLine: 1391
rules: 3.9 3B2rlXJXA0GupXGpH-mhQpicZan-WehN8Xf4nhFST6Q=, 8.22 CSipAu_lP4nuQbNgkYGyi9q-TIQ0sDBvNaUJxFl4U1s=, 12.4 BHZ-Neq9i9zSLzX_EHLkq_rZA6ansI2EDMVOVFuqdZk=
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
import { module, fn, vec2fT, dot, sqrt, compileModule } from 'typeshade'

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
`typeshade/cpu: unbound <name>` 오류를 던집니다.

```ts
import { module, fn, uniformStruct, storageBuffer, f32T, u32T, compileModule } from 'typeshade'

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
import { module, fn, f32T, compileModule } from 'typeshade'

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
import { compileModuleJs } from 'typeshade'

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
텍스처를 읽는 `textureSample`, `textureSampleLevel`, `textureLoad`와 그 배열·bias·grad·gather·깊이 비교
변형, `textureStore`, 크기를 묻는 `textureDimensions`와 `textureNumLayers`, 미분을 구하는 `dpdx`,
`dpdy`, `fwidth`와 그 coarse·fine 변형이 여기에 듭니다. 전체 목록은 `ORACLE_GPU_STUB_NAMES`라는 이름으로 내보내
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
import {
  module,
  fn,
  resource,
  texture2dfT,
  samplerT,
  vec2fT,
  textureSample,
  compileModule,
} from 'typeshade'

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

### grad로 구하는 미분

`grad(m, fn, param)`은 모듈의 함수 하나를 매개변수 하나에 대해 미분하고 `{ module, name }`을
돌려줍니다. `module`은 새 함수가 하나 더해진 모듈입니다. 이 함수는 `fn`과 같은 인수를 받아
그 지점의 `d fn / d param`을 돌려주며, 결과 타입은 `fn`의 결과 타입과 같습니다. 새 함수도
평범한 IR이므로 오라클이 그대로 실행하고, 엔트리가 이 함수를 호출하면 WGSL과 GLSL 코드
생성기가 함께 출력합니다.

```ts
import { module, fn, f32T, sin, compileModule, grad } from 'typeshade'

const wave = fn('wave', { x: f32T, k: f32T }, ({ x, k }) => sin(k.mul(x)).mul(k))
const d = grad(module({ funcs: [wave] }), 'wave', 'k')

compileModule(d.module).fns[d.name](0.5, 2) // → cos(1) * 0.5 * 2 + sin(1) = 1.3817…
```

미분은 순방향 모드로 계산합니다. 모든 `f32`와 부동소수점 벡터, 부동소수점 행렬은 값 옆에
미분값을 함께 들고 다니며, `if`, `switch`, `for`는 본문을 지나는 동안 둘 다 전달합니다.
모듈의 다른 함수를 호출하면 호출되는 함수마다 한 번 생성되는 헬퍼 `g_jvp`를 거칩니다.
성분별 내장 함수에는 교과서에 나오는 미분 규칙이 있습니다. `floor`, `ceil`, `round`,
`trunc`, `sign`, `step`의 미분은 영입니다. 불연속 지점을 빼면 어디서나 맞는 값입니다. 벡터
매개변수라면 `{ direction: [...] }`을 넘기고, 결과는 그 방향을 따라 구한 방향 미분이 됩니다.

미분 규칙이 없는 구성 요소는 `SD0118`로 거부되며, 진단에 그 구성 요소의 이름이 적힙니다.
텍스처 샘플, 미분 내장 함수, 매개변수가 흘러 들어갈 구조체가 그런 예입니다. 거부는
매개변수가 그 구성 요소에 닿을 때만 일어납니다. 이 패스는 유도하지 않은 미분을 영으로
채워 돌려주는 일이 없습니다. 생성된 함수는 오라클 위에서 중앙 유한 차분과 비교해 검사하며,
직접 만든 함수도 같은 방법으로 검사하면 됩니다.

### 모듈의 헬퍼를 호스트 코드에서 부르기

`"use typeshade"` 모듈은 애플리케이션이 가져올 수 있는 모듈이기도 합니다. Vite 플러그인을
설정하면 평범한 `.ts` 파일이 `.shade.ts`를 가져와 그 파일이 내보내는 헬퍼 함수를 부릅니다.
호출마다 그 함수의 코드가 GPU가 아니라 **CPU에서** 실행되며, GPU가 반올림하는 방식대로
`f32` 정밀도로 계산합니다. 높이 조회나 피킹 검사, 단위 테스트처럼 호스트 코드가 셰이더의 계산을
함께 쓸 때 이 방법을 씁니다. 같은 방식으로 가져온 `@compute` 진입점은 반대로 GPU에서 실행됩니다.
`await entry(bindings, workgroups)`는 진입점을 WebGPU에서 디스패치하고 진입점이 쓴 값을 배열로
다시 읽어 오며, `entry(canvas, bindings)`는 전체 화면 프래그먼트 진입점을 캔버스에
그립니다(`docs/use-typeshade-surface.md` §67).

```ts
// app.ts, ordinary TypeScript: terrain.shade.ts exports `height(p: vec2, k: vec4): f32`
import { height } from './terrain.shade.ts'

const h = height([0.5, 0.5], [1, 0.5, 2, 0.25]) // a number
```

값은 평범한 JavaScript 값입니다. 스칼라는 `number`나 `boolean`, 벡터는 튜플(`[x, y]`), 행렬은
열 우선으로 펼친 배열, `array<T, N>`은 배열, 구조체는 객체가 됩니다. 호출은 인자를 하나씩
검사하고, 맞지 않는 인자가 있으면 그 매개변수를 밝힌 `TypeError`를 던집니다. 돌려주는 값은
새로 만든 값이며, 호출은 동기적으로 끝납니다.

호스트가 부를 수 있는 함수는 내보낸 함수 가운데 진입점이 아니고, 제네릭이 아니며, 함수를 인자로
받지 않고, 바인딩이나 GPU에서만 계산되는 내장 함수에 닿지 않는 것입니다. 모듈이 내보내는
나머지는 호스트에게 이유와 함께 `never`로 보이므로, 그것을 부르면 호출을 쓴 자리에서 타입 오류가
납니다. 설정은 네 줄입니다. `vite.config.ts`에 플러그인 한 줄, `tsconfig.json`에 두 줄,
`prepare`에 `tshc sync` 한 줄을 씁니다. 이 설정과 호스트 값 표 전체는
`docs/use-typeshade-surface.md` §64에 있습니다.

### 배열을 도는 루프

크기가 없는 배열 `array<T>`를 받는 내보낸 함수는 커널 함수입니다. 호스트 코드는 이 함수를
`await`로 기다리고, 배열은 호출한 쪽의 배열이며 그 자리에서 바뀝니다. 함수 본문 맨 위에 있는
`for`는 어떤 반복도 다른 반복이 건드리는 것을 건드리지 않는다고 컴파일러가 증명하면 반복마다
호출 하나씩 GPU에서 실행되고, 증명하지 못하면 CPU에서 실행됩니다. 이때 그 줄과 해결 방법을
밝히는 `TS8070` 경고가 납니다(`docs/use-typeshade-surface.md` §65).

디스패치는 맨 위 루프의 것이므로, 그 안에 중첩된 루프는 호출 하나 안에서 통째로 실행됩니다.
두 겹의 중첩 루프로 쓴 격자는 행 하나가 호출 하나입니다. 칸마다 호출 하나가 되어야 한다면 격자를
평평한 루프 하나 `for (let i: u32 = 0; i < w * h; i++)`로 쓰고, 인덱스에서 `x = i % w`와
`y = i / w`를 구합니다.

### 다른 셰이더 모듈을 가져오는 모듈

`"use typeshade"` 파일은 다른 TypeScript 모듈처럼 다른 셰이더 파일이 내보낸 것을 가져옵니다.
`import { fbm } from './noise.shade.ts'`처럼 씁니다. 컴파일하는 파일과, 그 파일이 직접 또는 다른
파일을 거쳐 가져오는 셰이더 파일은 하나의 프로그램이고, 프로그램은 모듈 하나가 됩니다. 가져온
파일에서 컴파일하는 파일이 닿는 헬퍼와 구조체, 상수, 바인딩은 함께 들어오지만, 가져온 파일의
진입점은 들어오지 않습니다. 파일마다 스코프를 따로 가지므로 두 파일이 각자 비공개 `hash`를 둘 수
있고, 모듈은 두 번째 것을 다른 이름으로 생성합니다.

`compile()`은 소스가 가져오는 파일을 직접 넘겨준 `readDocument`로 읽습니다. 이 함수는 경로를 받아
파일의 텍스트를 돌려주고, 그런 파일이 없으면 `undefined`를 돌려줍니다. Vite 플러그인과
`tshc check`, `tshc sync`, 편집기는 파일을 스스로 읽습니다.

```ts
import { existsSync, readFileSync } from 'node:fs'
import { compile } from 'typeshade'

const read = (path: string) => (existsSync(path) ? readFileSync(path, 'utf8') : undefined)
const { wgsl, diagnostics } = compile(read('src/clouds.shade.ts')!, {
  fileName: 'src/clouds.shade.ts',
  readDocument: read,
})
```

셰이더 라이브러리는 다른 패키지처럼 npm으로 설치하고, 셰이더 파일은 그 패키지를 이름으로 가져옵니다.
`import { fbm } from 'shade-noise'`처럼 씁니다. 패키지는 Node가 찾는 방식 그대로, 가져오는 파일의
디렉터리에서 위로 올라가며 `node_modules`에서 찾습니다. 읽는 파일은 패키지의 `package.json`이
`exports`의 `typeshade` 조건으로 공개한 파일입니다. 호스트 코드용으로 공개하는 JavaScript는 그 옆에
따로 둡니다.

```json
{
  "name": "shade-noise",
  "exports": {
    ".": { "typeshade": "./src/index.shade.ts", "default": "./dist/index.js" },
    "./*": { "typeshade": "./src/*.shade.ts" }
  }
}
```

`'shade-noise'`는 패키지의 `src/index.shade.ts`를 읽고, `'shade-noise/hash'`는 그 옆의
`hash.shade.ts`를 읽습니다. `exports`가 없는 패키지는 파일 경로로 가져오며,
`'shade-noise/noise.shade.ts'`처럼 씁니다. `readDocument`에는 각 `package.json`도 요청하므로 위의 `read`는
고치지 않아도 패키지를 따라갑니다. 여러 의존성이 같은 패키지 버전에 닿더라도 프로그램에는 한 벌만
들어갑니다. 모듈이 이름을 바꾸는 패키지 헬퍼에는 패키지와 파일 이름이 붙어 `shade_noise_noise_hash`처럼
생성됩니다.

가져온 파일에 있는 실수는 그 파일의 줄과 열에서 보고됩니다. 컴파일러가 따라갈 수 없는 가져오기는
그 가져오기 자리에서 `TS8072`가 됩니다. 파일을 가리키지 않는 경로, 지시문으로 시작하지 않는 파일,
어느 `node_modules`에도 없는 패키지, 패키지의 `exports`에 없는 하위 경로, 그 파일이 내보내지 않는
이름, 기본 가져오기가 여기에 해당합니다. 가져오기의 모든 형태와 모듈이 생성하는 이름,
거부하는 경우는 `docs/use-typeshade-surface.md` §68에 모두 있습니다.
