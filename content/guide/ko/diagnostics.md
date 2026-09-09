---
id: diagnostics
source: 6a715cd71faf465579b355f2a3770bdd4d581f78db842008c8578d09631a9024
sourceLine: 1405
---

이 절을 읽고 나면 코드가 붙은 오류를 읽고, 그 오류가 담은 코드로 자신의 코드를 분기시키고,
모듈의 모든 실패를 보고서 하나로 모아 받고, 오류가 비롯된 TypeScript 줄을 출력할 수 있게
됩니다.

진단은 한 모듈에서 발견된 문제 하나를 가리키며, 그 문제를 찾은 규칙의 id, 오류 또는 경고라는
심각도, 메시지, 그리고 가능할 때는 안정적인 코드와 그 문제가 속한 함수, 한 줄짜리 힌트,
소스 위치로 이루어집니다. 던져지는 오류는 같은 `message`, `code`, `hint`, `loc`를 담습니다.
보고서 항목은 여기에 규칙 id, 심각도, 그 문제가 속한 함수를 더합니다.

### 코드가 붙은 오류

이 패키지가 던지는 코드가 붙은 실패는 모두 `ShaderDslError`입니다. 고정된 카탈로그에서 가져온
`code`와 조합해 만든 `message`를 담으며, 카탈로그에 해당 코드의 한 줄짜리 해결책이 있으면
`hint`도 함께 담습니다. `ValidationError`는 이 클래스의 하위 클래스이므로 `instanceof
ShaderDslError` 처리기 하나로 코드가 붙은 실패를 모두 잡아낼 수 있습니다.

```ts
import { ShaderDslError, emitModule } from '@xgis/shader-dsl'

try {
  emitModule(buildModule())
} catch (e) {
  if (e instanceof ShaderDslError) console.error(e.code, e.message, e.hint)
  throw e
}
```

타입 불일치는 어떤 생성 호출보다도 먼저, 모듈을 빌드하는 도중에 드러납니다. 빌더가 실행되면서
피연산자를 검사하기 때문입니다. `vec2f`에 `vec3f`를 더하면 `SD0002`가 던져집니다. 메시지는
코드와 카탈로그 요약인 `shader-dsl [SD0002]: binary op on mismatched vectors`로 시작한
다음, 연산자와 주어진 두 타입인 `+: vec2<f32> vs vec3<f32>`를 담습니다. 그 아래에는 `both
operands must be the same vector type, or one must be a scalar`라는 힌트 줄이 옵니다.

### 코드로 분기하기

오류를 이루는 정보 가운데 자신의 코드가 기준으로 삼아야 하는 부분은 `code`입니다. 코드는 추가만 가능하고 이미 있는
번호는 절대 다시 매기지 않는 카탈로그에서 나온 `SD####` 형태의 문자열이므로, 코드를 기준으로
분기한 코드는 계속 동작합니다. 메시지는 카탈로그 요약에 개별 실패의 세부 내용을 조합해서
만들며 언제든 문구를 바꿀 수 있으므로, 메시지 문자열을 기준으로 분기한 코드는 그렇게 동작한다고
보장할 수 없습니다.

```ts
try {
  buildModule()
} catch (e) {
  if (e instanceof ShaderDslError && e.code === 'SD0002') {
    // a binary op on mismatched vectors: report it against the author's own source
    console.error(e.message, e.loc)
  } else throw e
}
```

### 모든 실패를 한 번에

`validate(m)`는 작성된 모듈에 생성 시점 규칙을 실행합니다. 여기에는 모든 모듈이 지켜야 하는
구조적 불변 조건이 포함됩니다. 함수나 구조체 이름이 중복되지 않아야 하고, 바인딩이 서로
충돌하지 않아야 하며, 값을 반환하는 함수는 모든 경로에서 값을 반환해야 하고, 스칼라 연산에
타입이 뒤섞이지 않아야 하며, 호출 지점은 자신이 부르는 선언과 일치해야 하고, 한 함수 안에서 두
지역 변수가 이름을 공유하지 않아야 합니다. `emitModule`과 GLSL 생성기는 이 검사를 가장 먼저
실행하므로, 이 가운데 하나라도 어긴 모듈은 생성 호출 시점에 코드가 붙은 오류로 실패하며,
`createShaderModule`까지 가서야 드라이버 메시지로 실패하는 일은 없습니다.

`validate`는 예외를 던지기 전에 모든 오류를 먼저 모읍니다. 이때 던져지는 `ValidationError`는
메시지 안에 오류를 전부 렌더링하고, 배열은 `.diagnostics`에 담아 전달하는데, UI에 보여줄
목록은 바로 이 배열입니다.

```ts
import { emitModule, ValidationError } from '@xgis/shader-dsl'

try {
  emitModule(m)
} catch (e) {
  if (e instanceof ValidationError) {
    for (const d of e.diagnostics) console.error(d.ruleId, d.fn, d.message)
  } else throw e
}
```

`ramp`를 두 번 선언하고 `band` 함수가 `If` 밖으로 반환 없이 빠져나가는 모듈은 두 문제를 예외
하나에 함께 담아 보고합니다.

```
shader-dsl [SD0020]: module validation failed (2 errors):
  - dup-func: duplicate function 'ramp'
  - all-paths-return (fn band): fn 'band' returns non-void but a code path falls through without return
```

### diagnose 보고서

`diagnose(m)`는 "이 모듈에 무엇이 문제인가"라는 질문에 답하는 창구입니다. 린트 규칙 전체를
실행하고, 백엔드를 넘기면 기능 검사까지 더하며, 모든 진단과 그 개수를 센 요약을 담은 보고서를
돌려줍니다. 예외를 던지지 않고 모듈도 바꾸지 않으므로, 곧 생성할 모듈에 대해 안전하게 호출할
수 있습니다. `formatReport`는 이 보고서를 텍스트로 렌더링합니다. `lintModule(m)`은 같은 린트
규칙 전체를 실행하지만 요약도 기능 검사도 없이 진단을 평범한 배열로 돌려줍니다.

전체 규칙 집합은 생성 시점 규칙보다 범위가 넓어서, 이름 짓기, 중첩 깊이, 쓰이지 않는 바인딩,
부동소수점 동등 비교, 단일 종료 지점, 불변 바인딩에 대한 대입까지 다룹니다. 이 문제들은 오직
여기에서만 만날 수 있습니다. 마지막 항목은 `Let`로 선언한 뒤 `.assign()`을 쓰는 실수로, 드라이버가
거부하는 WGSL을 생성하므로 셰이더를 배포하기 전에 `diagnose`를 한 번 실행할 가치가 있습니다.

```ts
import { wgslBackend } from '@xgis/shader-dsl'
import { diagnose, formatReport } from '@xgis/shader-dsl/dev'

const report = diagnose(m, { rules: 'all', backend: wgslBackend })
if (report.summary.errors > 0) console.error(formatReport(report))
```

`edge`를 `Let`으로 바인딩하고 8번째 줄에서 그 값에 대입하는 `rim.ts`라면, 보고서는 심각도,
코드, 규칙, 함수 순으로 시작한 다음 위치를 보여줍니다.

```
error[SD0107] no-assign-to-let  (fn rim_alpha)
  --> rim.ts:8:14
```

이 두 줄 아래에는 규칙 자체의 메시지가 오는데, 이 메시지는 바인딩 이름과 그것이 속한 함수를
밝히고 `let`에 대입하는 것이 유효하지 않은 WGSL이라고 설명한 다음, `declare the binding with
Var() instead of Let() to mutate it`라는 힌트를 덧붙입니다. 실행은 `1 error, 0 warnings`라는
개수로 끝납니다. 경로는 작성 파일에 대해 스택이 보고하는 경로를 여기서는 줄인 것입니다.

`rules: 'core'`를 주면 실행 범위가 `validate`가 쓰는 것과 같은 규칙 집합으로 좁혀집니다.
`backend` 옵션을 주면 그 백엔드가 다루지 못하는 기능을 모두 나열하는 `SD0030` 진단이 하나
추가되는데, 이는 `emitModule`이 실행하는 기능 게이트를 예외를 던지지 않고 미리 확인해 보는 짝이라 할 수
있습니다.

### 소스 위치

위에서 본 `-->` 줄은 문제가 된 문을 만들어 낸 TypeScript 위치입니다. 이 정보를 잡아내는
기능은 기본값이 꺼짐인데, 작성된 노드마다 스택을 훑어야 하는 비용이 들기 때문입니다. 꺼져
있으면 스택을 아예 훑지 않으므로, 이 스위치를 그대로 두어도 비용이 들지 않습니다. 개발이나
테스트를 실행할 때는 켭니다.

```ts
import { setSourceTracing } from '@xgis/shader-dsl/dev'

setSourceTracing(true)
```

환경 변수에 `XGIS_SHADER_DSL_TRACE=1`을 설정하면 프로세스 전체에서 이 기능이 켜지므로, 테스트
코드를 고치지 않고도 테스트 실행에서 위치 정보를 얻을 수 있습니다. 위치 정보는 생성된
셰이더에는 결코 나타나지 않습니다. 추적을 켰을 때와 껐을 때 WGSL과 GLSL은 바이트 단위로
동일하게 나옵니다. 추적이 선택
사항이므로 오류와 진단의 `loc`도 선택 사항이며, 값이 없을 수도 있는 필드로 다루어야 합니다.
