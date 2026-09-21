---
id: raw-statements
source: e8131bf154a4542837ab8f79f13e710da19b3c0e112e3968e4a297ddb36b9d74
sourceLine: 2504
---

이 페이지를 읽고 나면 손으로 직접 쓴 문장을 모듈에 끼워 넣을 수 있고, 그 대가로 타깃마다
무엇을 포기하게 되는지도 알게 됩니다.

raw 문(raw statement)은 DSL이 내용을 읽지 않고 함수 본문에 그대로 써 넣는 문자열입니다.
문장을 손으로 직접 써야 할 때, 다른 생성기가 미리 만들어 둔 문장을 그대로 가져올 때, 또는
IR로 표현할 수 없는 구문을 써야 할 때 raw 문을 씁니다. 이 페이지의 나머지 내용은 모두 한
가지 사실에서 나옵니다. 컴파일러에게 그 문자열은 뜻을 알 수 없는 바이트 덩어리일 뿐입니다.

### 타깃마다 다른 표기

페이로드는 `rawStmt`에 넘기는 `{ wgsl, glsl }` 객체로, 타깃마다 표기(spelling)를 하나씩
담습니다. `rawStmt`는 이 페이로드로 raw 문 노드를 만들어 돌려주며, 이 노드는 본문 배열에
그대로 넣을 수 있습니다.

```ts
import { rawStmt, vec4fT, type FuncDecl } from 'typeshade'

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

raw 문의 뜻은 하나뿐입니다. 이 바이트를 이 자리에 그대로 넣으라는 것입니다. 타깃마다
달라지는 것은 표기뿐입니다. `emitModule`은 `wgsl` 문자열을, `emitGlslModule`은 `glsl`
문자열을 한 글자도 바꾸지 않고 생성하며, 어느 쪽 생성기도 다른 쪽 표기에는 손대지
않습니다.

### fn 본문 안에서

`fn` 본문은 빌더가 모아서 만들므로, 그 안에 raw 문을 끼워 넣을 때는 `b.raw(payload)`를
씁니다. 빌더는 본문 함수의 두 번째 인자로 들어옵니다.

```ts
import { fn, voidT } from 'typeshade'

const seed_lane = fn('seed_lane', {}, voidT, (_p, b) => {
  b.raw({ wgsl: 'let _k = 1.0;', glsl: 'float _k = 1.0;' })
})
```

`fn` 본문 안에서 `rawStmt(...)`를 그냥 호출하기만 하면 결과가 버려집니다. 노드는
만들어지지만 본문에 넣는 쪽이 없으니 생성되는 코드도 없습니다. 첫 번째 예제처럼 `Stmt[]`
배열을 직접 만들 때만 독립 함수 `rawStmt`를 쓰고, 그 밖에는 모두 `b.raw`를 씁니다. `b.raw`는
다른 문장과 같은 경로로 본문에 들어가므로, 본문의 나머지 부분과 똑같이 소스 위치도
기록합니다.

### 표기 누락과 fail closed

표기는 타입 수준에서 적어도 한쪽이 있어야 하므로, `rawStmt({})`는 컴파일 오류입니다. 한쪽
표기만 주어도 되지만, 그렇게 하면 이 모듈을 다른 타깃으로는 빌드하지 않겠다고 정한
셈입니다. 백엔드는 자기 타깃의 표기가 없는 raw 문을 만나면 `SD0030` 코드가 붙은
`UnsupportedFeatureError`를 던집니다. 드라이버가 거부할 소스를 내는 대신 컴파일 시점에
실패하는 fail closed 동작입니다. 오류 메시지에는 빠진 표기의 이름과 여러분이 준 쪽 표기가
그대로 실리므로, 오류만 보고도 어느 문장을 옮겨 적어야 하는지 알 수 있습니다.

```ts
import { emitGlslModule, emitModule, fn, module, vec4, vec4fT } from 'typeshade'

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

지금은 WebGL2로 배포하고 WebGPU는 나중에 붙일지도 모르는 모듈이라면 이 모양으로 씁니다.
GLSL 빌드는 그대로 동작하고, 나중에 누군가 WGSL 생성기를 처음 돌리면 wgsl 표기가 없는 첫
raw 문에서 멈추면서 옮겨 적을 문장을 알려 줍니다. 모듈이 빌드해야 하는 타깃의 표기를 모두
채워 두면 이런 일은 아예 생기지 않습니다.

### 들여쓰기와 식별자

표기 텍스트 자체에서 여러분이 직접 챙겨야 할 것이 두 가지 있습니다.

생성기는 표기 전체를 한 덩어리로 보고 그 앞에만 본문의 들여쓰기를 붙입니다. 그래서 여러
줄짜리 표기는 첫 줄만 들여쓰기가 되고, 그 뒤의 줄은 모두 0번째 칸에서 시작합니다. 생성된
소스의 모양이 중요하다면 둘째 줄부터는 들여쓰기를 직접 넣어야 합니다.

```ts
b.raw({
  wgsl: 'if (t > 1.0) {\n    t = 1.0;\n  }',
  glsl: 'if (t > 1.0) {\n    t = 1.0;\n  }',
})
```

표기 안의 식별자가 계속 유효하도록 지키는 것도 여러분의 몫입니다. 그 문자열 안을 읽는
쪽이 없으니 이름을 고쳐 써 주는 쪽도 없기 때문입니다. GLSL 백엔드는 `in`, `sample`,
`filter`, `texture`처럼 GLSL 예약어와 겹치는 이름의 파라미터와 지역 변수를 다른 이름으로
바꿉니다. 그래서 그런 이름을 그대로 적은 `glsl` 표기는 생성된 스테이지에 이미 없는 변수를
가리키게 됩니다. WGSL 쪽에는 이런 이름 바꾸기가 없습니다. raw 문에 대한 약속은 양쪽
타깃이 같지만, 실제로 이 문제를 겪는 쪽은 GLSL 표기뿐입니다. 주변 본문의 이름을 쓰는 raw
문을 추가했다면 생성된 소스를 한 번 열어 확인하십시오.

### raw 문이 꺼 버리는 것

모듈 어딘가에 raw 문이 하나라도 있으면 모듈 전체가 세 가지를 잃습니다.

첫째, 식별자 맹글링이 동작하지 않습니다. [프로덕션 생성](/guide/authoring/production-emit/)에서
다루는 `mangle()`은 헬퍼, 구조체, const의 이름을 짧게 줄이고, 작성 시점 이름에서 생성
시점 이름으로 가는 맵을 돌려줍니다. raw 문이 든 모듈을 건네면 모듈은 손대지 않고 맵은 빈
채로 돌려줍니다. 읽을 수 없는 텍스트 주변의 이름만 바꾸면 끼워 넣은 raw 문과 이름이
어긋나기 때문입니다.

```ts
import { emitModule, f32T, fn, module, vec4, vec4fT } from 'typeshade'
import { mangle } from 'typeshade/emit-prod'

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

둘째, GLSL 스테이지 스코핑이 꺼집니다. GLSL 백엔드는 평소에 각 스테이지에서 실제로
호출되는 함수만 그 스테이지에 생성합니다. raw 텍스트는 이 참조 추적이 읽을 수 없으므로,
필터는 모듈 전체를 포기하고 모든 헬퍼를 모든 스테이지에 생성합니다. 그래서 진입점이 한
번도 부르지 않는 헬퍼도 생성기까지 그대로 넘어가고, 그 안에 `glsl` 표기가 없는 raw 문이
있으면 GLSL 생성 전체가 실패합니다. 더 골치 아픈 쪽은 `dpdx`, `dpdy`, `fwidth`, `discard`
같은 프래그먼트 전용 기능입니다. 어느 헬퍼에 있든 버텍스 스테이지에도 함께 생성되고,
거기서는 컴파일되지 않습니다. raw 문이 든 모듈에는 이런 헬퍼를 두지 말거나, raw 문을 아예
별도의 모듈로 옮기십시오. 다른 스테이지의 진입점은 본문을 훑기 전에 여전히 걸러지므로,
이 검사는 스테이지마다 따로 적용됩니다. `glsl` 표기가 없는 raw 문은, 그 문장이 든 함수를
생성하는 스테이지마다 그 스테이지의 생성을 실패시킵니다.

셋째, [CPU 오라클](/guide/authoring/the-cpu-oracle/)은 raw 문 앞에서 멈춥니다.
`compileModule`은 모듈을 받아 fn마다 함수를 하나씩 돌려주는데, 오라클은 raw 텍스트를
계산할 방법이 없으므로 본문에 raw 문이 든 함수를 호출하면 오류를 던집니다. 같은 모듈
안의 다른 함수는 여전히 실행됩니다. 한 함수에 raw 문과 오라클 검사가 둘 다 필요하다면
함수를 나누십시오. 연산은 오라클이 실행할 수 있는 함수에 남겨 두고, raw 문은 그 함수를
부르는 쪽에 두십시오.
