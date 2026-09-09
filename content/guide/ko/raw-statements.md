---
id: raw-statements
source: f3fbe848da05c89a5750a8e9433c86944a2ad2f50fa26102db44ea479f4430f2
sourceLine: 2395
---

이 페이지를 읽고 나면 손으로 직접 쓴 문장을 모듈에 끼워 넣을 수 있고, 그 문장이 각
타깃에서 어떤 비용을 치르는지 알 수 있습니다.

raw 문은 DSL이 읽지 않고 함수 본문에 그대로 써 넣는 문자열입니다. 문장을 손으로 직접
써야 할 때, 다른 생성기가 미리 만들어 둔 문장을 그대로 가져올 때, 또는 IR이 모델링하지
못하는 구문을 써야 할 때 raw 문을 씁니다. 이 페이지에서 다루는 나머지 내용은 모두 한
가지 사실에서 비롯됩니다. 컴파일러 입장에서 그 문자열은 그저 불투명한 바이트일 뿐입니다.

### 타깃마다 다른 표기

페이로드는 `rawStmt`에 넘기는 `{ wgsl, glsl }` 객체로, 타깃마다 표기를 하나씩 담습니다.
`rawStmt`는 본문 배열에 그대로 넣을 수 있는 문 노드를 반환합니다.

```ts
import { rawStmt, vec4fT, type FuncDecl } from '@xgis/shader-dsl'

const PAIRED = rawStmt({
  wgsl: 'return vec4<f32>(1.0, 0.0, 0.0, 1.0);',
  glsl: 'return vec4(1.0, 0.0, 0.0, 1.0);',
})

const fs: FuncDecl = {
  name: 'fs_main',
  attrs: ['@fragment'],
  stage: 'fragment',
  params: [],
  ret: vec4fT,
  retAttr: '@location(0)',
  body: [PAIRED],
}
```

raw 문의 의미는 언제나 고정되어 있습니다. 바로 이 바이트를 여기에 놓으라는 뜻입니다.
타깃마다 달라지는 것은 표기뿐입니다. `emitModule`은 `wgsl` 문자열을, `emitGlslModule`은
`glsl` 문자열을 각각 그대로 생성하며, 어느 쪽 생성기도 다른 쪽의 표기를 생성하지
않습니다.

### fn 본문 안에서

`fn` 본문은 빌더가 조립하므로, 그 안에 raw 문을 끼워 넣을 때는 `b.raw(payload)`를
씁니다. 빌더는 본문 함수가 받는 두 번째 인자입니다.

```ts
import { fn, voidT } from '@xgis/shader-dsl'

const seed_lane = fn('seed_lane', {}, voidT, (_p, b) => {
  b.raw({ wgsl: 'let _k = 1.0;', glsl: 'float _k = 1.0;' })
})
```

`fn` 본문 안에서 `rawStmt(...)`만 단독으로 호출하면 그 결과는 버려집니다. 노드는
만들어지지만 아무도 그것을 밀어 넣지 않으므로 아무것도 생성되지 않습니다. 첫 번째
예제처럼 `Stmt[]` 배열을 손으로 조립할 때는 독립 함수인 `rawStmt`를 쓰고, 그 밖의 모든
경우에는 `b.raw`를 씁니다. `b.raw`도 다른 문과 똑같은 경로로 밀어 넣어지므로, 본문의
나머지 부분과 마찬가지로 소스 위치를 기록합니다.

### 표기 누락과 fail closed

타입 수준에서 적어도 한쪽 표기는 반드시 있어야 하므로, `rawStmt({})`는 컴파일
오류입니다. 표기를 한쪽만 주는 것은 허용되며, 이는 이 모듈을 다른 타깃으로는 생성하지
않겠다는 결정이기도 합니다. 자신이 맡은 타깃의 표기가 없는 raw 문을 받은 백엔드는
`SD0030` 코드가 붙은 `UnsupportedFeatureError`를 던집니다(fail closed, 드라이버가
거부할 소스를 내는 대신 컴파일 시점에 실패한다는 뜻). 오류 메시지는 어떤 표기가
빠졌는지 이름을 밝히고 여러분이 준 쪽 표기를 그대로 인용하므로, 오류가 가리키는 지점이
곧 옮겨야 할 문장입니다.

```ts
import { emitGlslModule, emitModule, fn, module, vec4, vec4fT } from '@xgis/shader-dsl'

const fs = fn(
  'fs_main',
  {},
  vec4fT,
  (_p, b) => {
    b.raw({ glsl: 'gl_FragDepth = 0.5;' })
    return vec4(1, 0, 0, 1)
  },
  { stage: 'fragment' },
)

const m = module({ funcs: [fs] })

emitGlslModule(m, 'fragment') // splices the glsl spelling verbatim
emitModule(m) // throws UnsupportedFeatureError (SD0030)
```

지금은 WebGL2로 배포하고 WebGPU는 나중에 추가할 수도 있는 모듈이라면 이 모양을
씁니다. GLSL 빌드는 계속 동작하고, 누군가 WGSL 생성기를 처음 돌리는 날 wgsl 표기가 없는
첫 번째 raw 문에서 멈추어 옮겨야 할 문장의 이름을 알려줍니다. 모듈이 반드시 빌드해야 할
모든 타깃의 표기를 채워 두면, 이 질문 자체가 나올 일이 없습니다.

### 들여쓰기와 식별자

이 텍스트 자체에서 여러분이 직접 맞춰야 할 것이 두 가지 있습니다.

생성기는 표기 전체 앞에 감싸는 본문의 들여쓰기를 붙이므로, 여러 줄로 된 표기에서는 첫
줄만 들여쓰기가 되고 그 뒤의 모든 줄은 들여쓰기 없이 0번째 칸부터 시작됩니다. 생성된 소스의 모양이
중요하다면 이어지는 줄의 들여쓰기는 직접 넣어야 합니다.

```ts
b.raw({
  wgsl: 'if (t > 1.0) {\n    t = 1.0;\n  }',
  glsl: 'if (t > 1.0) {\n    t = 1.0;\n  }',
})
```

표기 안의 식별자가 유효한 상태로 남아 있게 하는 것도 여러분의 몫입니다. 아무도 그
문자열 안을 읽지 않으므로 아무도 다시 써 주지 않기 때문입니다. GLSL 백엔드는 `in`,
`sample`, `filter`, `texture`를 비롯해 GLSL 예약어와 이름이 겹치는 파라미터와 지역
변수의 이름을 바꾸므로, 그 가운데 하나를 그대로 쓴 `glsl` 표기는 생성된 스테이지에는 더
이상 존재하지 않는 변수를 가리키게 됩니다. WGSL 쪽에는 이런 이름 변경기가 없습니다. raw
문에 적용되는 계약 자체는 양쪽 타깃에서 똑같지만, 실제로 이런 위험에 노출되는 쪽은 GLSL
표기뿐입니다. 주변 본문에 있는 이름을 언급하는 raw 문을 추가했다면, 그 뒤에는 생성된
소스를 한 번 확인하십시오.

### raw 문이 꺼 버리는 것

모듈 어딘가에 raw 문이 하나라도 있으면, 그 모듈 전체가 포기하는 것이 세 가지 있습니다.

첫째, 식별자 맹글링이 동작하지 않습니다. [프로덕션 생성](/guide/authoring/production-emit/)에서
다루는 `mangle()`은 헬퍼, 구조체, const의 이름을 짧게 줄이고, 작성 시점 이름에서 생성
시점 이름으로 가는 맵을 돌려줍니다. raw 문을 담은 모듈을 건네면 모듈은 그대로, 맵은
비워서 돌려주는데, 읽을 수 없는 텍스트 주변에서 이름을 바꾸면 끼워 넣은 조각과 어긋나기
때문입니다.

```ts
import { emitModule, f32T, fn, module, vec4, vec4fT } from '@xgis/shader-dsl'
import { mangle } from '@xgis/shader-dsl/emit-prod'

const shade = fn('shade_pixel', { x: f32T }, vec4fT, (p) => vec4(p.x, 0, 0, 1))

const fs = fn(
  'fs_main',
  {},
  vec4fT,
  (_p, b) => {
    b.raw({ wgsl: 'let _k = 1.0;', glsl: 'float _k = 1.0;' })
    return shade(0.5)
  },
  { stage: 'fragment' },
)

const renames = new Map<string, string>()
const wgsl = emitModule(module({ funcs: [shade, fs] }), { plugins: [mangle({ renames })] })
// The module holds a raw, so `shade_pixel` keeps its authored name and renames is empty.
```

둘째, GLSL 스테이지 스코핑이 꺼집니다. GLSL 백엔드는 평소에는 해당 스테이지가 실제로
닿는 함수만 그 스테이지에 생성합니다. raw 텍스트는 이 참조 훑기에 불투명하므로, 필터는
모듈 전체에 대해 포기하고 모든 헬퍼를 모든 스테이지에 생성합니다. 그래서 진입점이 한
번도 부르지 않는 헬퍼도 생성기까지 그대로 도달하고, 그 안에 `glsl` 표기가 없는 raw
문이 있으면 GLSL 생성 전체가 실패합니다. 더 심각한 결과는, 어느 헬퍼에 있든 `dpdx`,
`dpdy`, `fwidth`, `discard` 같은 프래그먼트 전용 기능이 버텍스 스테이지에도 함께
생성된다는 점이며, 그곳에서는 컴파일되지 않습니다. raw 문을 담은 모듈에는 이런 헬퍼를
두지 말거나, raw 문을 아예 별도의 모듈로 옮기십시오. 다른 스테이지의 진입점은 본문
훑기 전에 여전히 걸러지므로, 이 제약은 스테이지별로 그대로 적용됩니다. `glsl` 표기가 없는 raw
문은 자신을 담은 함수가 생성 대상 함수 집합에 포함되는 스테이지마다 그 스테이지의
생성을 실패시킵니다.

셋째, [CPU 오라클](/guide/authoring/the-cpu-oracle/)은 raw 문 앞에서 멈춥니다.
`compileModule`은 모듈을 받아 fn마다 함수 하나씩을 돌려주는데, 오라클은 raw 텍스트를
계산할 방법이 없으므로 본문에 raw 문을 담은 함수를 호출하면 오류를 던집니다. 같은 모듈
안의 다른 함수는 여전히 실행됩니다. 한 함수에 raw 문과 오라클 검사가 둘 다 필요하다면
함수를 나누십시오. 연산은 오라클이 실행할 수 있는 함수에 남겨 두고, raw 문은 그 함수를
부르는 쪽에 두십시오.
