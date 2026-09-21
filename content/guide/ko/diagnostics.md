---
id: diagnostics
source: 0e477cb350409448ed287c789e704112abe5a0172027dd888a37c99d61f7faf1
sourceLine: 1510
---

이 절을 읽고 나면 오류 코드가 붙은 오류를 읽고, 그 코드를 조건으로 자기 코드의 분기를 나누고,
모듈 하나에서 나온 실패를 보고서 한 장으로 받고, 오류가 나온 TypeScript 줄을 출력할 수
있습니다.

진단 하나는 모듈 하나에서 찾은 문제 하나입니다. 문제를 찾은 규칙의 id, 오류인지 경고인지를
나타내는 심각도, 메시지가 기본으로 들어가고, 있을 때는 바뀌지 않는 오류 코드, 문제가 난 함수,
한 줄짜리 힌트, 소스 위치도 함께 들어갑니다. 던져진 오류에도 같은 `message`, `code`, `hint`,
`loc`가 들어 있습니다. 보고서의 항목에는 규칙 id, 심각도, 문제가 난 함수가 더 붙습니다.

### 코드가 붙은 오류

이 패키지가 오류 코드를 붙여 던지는 오류는 모두 `TypeShadeError`입니다. 고정된 카탈로그에서 온
`code`와 여러 조각을 이어 붙여 만든 `message`가 들어 있고, 카탈로그에 그 코드의 한 줄짜리
해결책이 있으면 `hint`도 들어 있습니다. `ValidationError`는 이 클래스의 하위 클래스이므로,
`instanceof TypeShadeError` 처리기 하나로 코드가 붙은 오류를 전부 잡을 수 있습니다.

```ts
import { TypeShadeError, emitModule } from 'typeshade'

try {
  emitModule(buildModule())
} catch (e) {
  if (e instanceof TypeShadeError) console.error(e.code, e.message, e.hint)
  throw e
}
```

타입이 맞지 않는 문제는 생성을 호출하기도 전에, 모듈을 만드는 도중에 드러납니다. 빌더가
실행되는 순간 피연산자를 검사하기 때문입니다. `vec2f`에 `vec3f`를 더하면 `SD0002`를 던집니다.
메시지는 코드와 카탈로그 요약 `typeshade [SD0002]: binary op on mismatched vectors`로
시작하고, 이어서 연산자와 실제로 받은 두 타입을 `+: vec2<f32> vs vec3<f32>`처럼 적습니다.
그 아래 줄이 힌트 `both operands must be the same vector type, or one must be a scalar`입니다.

### 코드로 분기하기

오류에서 자기 코드가 기대어야 할 절반은 오류 코드입니다. 코드는 `SD####` 모양의 문자열로,
항목을 덧붙이기만 하고 번호를 다시 매기지 않는 카탈로그에서 나오므로, 코드로 나눈 분기는
계속 동작합니다. 메시지는 카탈로그 요약에 그 실패의 세부 내용을 이어 붙인 것이라 문구가
언제든 바뀔 수 있으므로, 메시지 문구로 나눈 분기는 언제 깨질지 모릅니다.

```ts
try {
  buildModule()
} catch (e) {
  if (e instanceof TypeShadeError && e.code === 'SD0002') {
    // a binary op on mismatched vectors: report it against the author's own source
    console.error(e.message, e.loc)
  } else throw e
}
```

### 모든 실패를 한 번에

`validate(m)`는 작성한 모듈에 생성 시점 규칙을 돌립니다. 모든 모듈이 지켜야 하는 구조 규칙도
여기에 들어 있습니다. 함수나 구조체 이름이 겹치지 않아야 하고, 바인딩이 서로 충돌하지 않아야
하며, 값을 반환하는 함수는 모든 경로에서 값을 반환해야 하고, 스칼라 연산에 타입이 뒤섞이지
않아야 하며, 호출 지점은 자신이 부르는 선언과 맞아야 하고, 한 함수 안에서 지역 변수 두 개가
같은 이름을 쓰지 않아야 합니다. `emitModule`과 GLSL 생성기는 이 검사를 맨 먼저 돌리므로,
규칙 하나라도 어긴 모듈은 생성 호출에서 오류 코드가 붙은 오류로 실패합니다.
`createShaderModule`까지 가서 드라이버 메시지를 보는 일은 없습니다.

`validate`는 오류를 전부 모은 뒤에 한 번 던집니다. 이때 던지는 `ValidationError`는 메시지에
오류를 모두 적어 넣고, 배열 그대로는 `.diagnostics`에 담습니다. UI에 보여줄 것은 이
배열입니다.

```ts
import { emitModule, ValidationError } from 'typeshade'

try {
  emitModule(m)
} catch (e) {
  if (e instanceof ValidationError) {
    for (const d of e.diagnostics) console.error(d.ruleId, d.fn, d.message)
  } else throw e
}
```

`ramp`를 두 번 선언하고 `band` 함수가 `If`를 지나 반환 없이 끝나는 모듈이라면, 두 문제를
예외 하나로 함께 보고합니다.

```
typeshade [SD0020]: module validation failed (2 errors):
  - dup-func: duplicate function 'ramp'
  - all-paths-return (fn band): fn 'band' returns non-void but a code path falls through without return
```

### diagnose 보고서

`diagnose(m)`는 "이 모듈은 어디가 잘못됐는가"를 물을 때 부르는 함수입니다. 린트 규칙 전체를
돌리고, 백엔드를 넘기면 기능 검사도 더한 뒤, 진단 전부와 개수를 센 요약을 보고서로
돌려줍니다. 예외를 던지지 않고 모듈도 건드리지 않으므로, 곧 생성할 모듈에 그대로 불러도
됩니다. `formatReport`는 보고서를 텍스트로 만듭니다. `lintModule(m)`은 같은 규칙 전체를
돌리되 요약과 기능 검사 없이 진단만 그냥 배열로 돌려줍니다.

전체 규칙 집합은 생성 시점 규칙보다 넓습니다. 이름 규칙, 중첩 깊이, 쓰지 않는 바인딩,
부동소수점 같음 비교, 단일 종료, 불변 바인딩에 대입하기까지 잡아냅니다. 이 문제들은 여기서만
볼 수 있고 다른 곳에서는 알려 주지 않습니다. 마지막 것은 `Let`으로 선언해 놓고 `.assign()`을
부르는 실수인데, 드라이버가 거부하는 WGSL이 나오므로 셰이더를 배포하기 전에 `diagnose`를 한 번
돌려 볼 만합니다.

```ts
import { wgslBackend } from 'typeshade'
import { diagnose, formatReport } from 'typeshade/dev'

const report = diagnose(m, { rules: 'all', backend: wgslBackend })
if (report.summary.errors > 0) console.error(formatReport(report))
```

`rim.ts`에서 `edge`를 `Let`으로 바인딩하고 8번 줄에서 대입했다면, 보고서는 심각도, 코드, 규칙,
함수로 시작하고 그다음 줄에 위치를 적습니다.

```
error[SD0107] no-assign-to-let  (fn rim_alpha)
  --> rim.ts:8:14
```

이 두 줄 아래에 규칙의 메시지가 옵니다. 바인딩 이름과 그 바인딩이 있는 함수를 적고, `let`에
대입하면 WGSL로 유효하지 않다고 알려 줍니다. 그다음이 힌트 `declare the binding with Var()
instead of Let() to mutate it`입니다. 마지막 줄은 개수 `1 error, 0 warnings`입니다. 경로는
작성 파일에 대해 스택이 알려 준 경로인데, 여기서는 짧게 줄였습니다.

`rules: 'core'`를 주면 `validate`와 같은 규칙 집합만 돌립니다. `backend` 옵션을 주면 그 백엔드가
지원하지 못하는 기능을 모두 이름으로 적은 `SD0030` 진단이 하나 더 붙습니다. `emitModule`이
돌리는 기능 게이트를 예외 없이 미리 해 보는 셈입니다.

### 소스 위치

위의 `-->` 줄은 문제가 된 문(statement)을 만든 TypeScript 코드의 위치입니다. 위치를 기록하는
기능은 기본으로 꺼져 있습니다. 작성하는 노드마다 스택을 한 번씩 훑어야 하기 때문입니다. 꺼져
있을 때는 스택을 전혀 훑지 않으므로, 스위치를 그대로 두어도 비용이 없습니다. 개발이나
테스트로 실행할 때 켭니다.

```ts
import { setSourceTracing } from 'typeshade/dev'

setSourceTracing(true)
```

환경 변수 `TYPESHADE_TRACE=1`을 주면 프로세스 전체에서 켜지므로, 테스트 코드를 고치지
않고 테스트 실행에서 위치를 얻을 때는 이 방법을 씁니다. 위치는 생성된 셰이더에 들어가지
않습니다. 추적을 켜든 끄든 WGSL과 GLSL은 바이트까지 같습니다. 기록이 선택이므로 오류와 진단의
`loc`도 선택이며, 없을 수도 있는 필드로 읽어야 합니다.
