---
id: diagnostics
source: 0bfe59bd4d4d96296aca5f0ef005a29cdc03db329e1cdb61feb99f83281ded6b
sourceLine: 1786
rules: 12.2 i81jajIqKPFQCmZ8J1MOkejuMSPX2dkEGKTlWS3-yBQ=, 12.4 BHZ-Neq9i9zSLzX_EHLkq_rZA6ansI2EDMVOVFuqdZk=, 6.2 X1TddP_Ob7b4QaR9Qbuoo1UgPCngNA5JdtbbWwd_lOc=, 6.10 suiaQZS1y-SaWxDmJXHL21Qzp_yYkddUlpCNV8AsLVc=, 8.13 aNXyjNJvi1bR7zPmCgF2WJ0PmaP_Qk6WWqXOOuEbzCg=, 8.14 SP-Fa9DtpBru_e2Zuh3x8ZUFrqweaTrNrJs-c8RHbE0=, 8.17 iy_UhoCMHYdgpfUXu8eRAllyZo67mQ2c6BRfQtMcIYY=, 6.6 qXyf0FpXuS4xir_HpHadSIsWFZT2WtMx8M-wm9BvJOE=, 12.3 8O2dxHWoC8EyiSghUPlEO7j2e1gLt7se9PGHEkU-8fw=
---

이 페이지를 마치면 진단을 읽고, 진단에 붙은 코드로 자기 코드의 분기를 나누고, 모듈의 모든 실패를
보고서 하나로 받고, 오류가 난 줄을 찾을 수 있습니다.

진단 하나는 프로그램 하나에서 찾은 문제 하나입니다. 바뀌지 않는 코드, 오류인지 경고인지를 나타내는
심각도, 메시지, 그리고 그 문제가 속한 소스 위치가 들어 있습니다. 호스트에 닿는 진단은 두 종류입니다.
`compile()`은 소스에서 잘못된 점을 `TS8` 코드가 붙은 진단 목록으로 보고하며, 오류를 던지지
않습니다. 모듈을 읽는 호출, 곧 생성, `reflect`, 오라클은 모듈로 요청한 일을 할 수 없을 때 `SD`
코드가 붙은 `TypeShadeError`를 던집니다.

### 코드가 붙은 오류

`compile()`은 `diagnostics`를 돌려줍니다. 진단마다 `code`, `category`, `message`, `fileName`이
있고, 시작 위치는 1부터 세는 `line`과 `character`로, 끝 위치는 `endLine`과 `endCharacter`로
적힙니다. 오류가 있는 소스에는 `wgsl`도 `glsl`도 없습니다. 반쯤 만든 모듈을 셰이더 텍스트로
내보내는 일은 없기 때문입니다.

```ts
import { compile } from 'typeshade'

const { diagnostics } = compile(source, { fileName: 'rim.shade.ts' })
for (const d of diagnostics) {
  console.error(`${d.fileName}:${d.line}:${d.character} ${d.code} ${d.message}`)
}
```

`rim.shade.ts`가 `edge`를 `const`로 선언하고 5번 줄에서 대입한다면, 이 반복은 다음 줄을
출력합니다.

```
rim.shade.ts:5:3 TS8005 Cannot assign to "edge" — it is declared with const.
```

호스트 호출이 일으키는 코드 붙은 실패는 모두 `TypeShadeError`입니다. 고정된 카탈로그에서 온
`code`와, 여러 조각을 이어 만든 `message`가 들어 있습니다. 카탈로그에 그 코드의 한 줄짜리
해결책이 있으면 `hint`도 들어 있습니다. `ValidationError`와 `UnsupportedFeatureError`는 하위
클래스이므로, `instanceof TypeShadeError` 처리기 하나로 코드 붙은 실패를 모두 잡습니다.

```ts
import { TypeShadeError, emitGlslModule } from 'typeshade'

try {
  emitGlslModule(m, 'fragment')
} catch (e) {
  if (e instanceof TypeShadeError) console.error(e.code, e.message, e.hint)
  throw e
}
```

varying이 `@interpolate("linear")`인 모듈은 GLSL ES 3.00에 대응하는 형태가 없습니다. 이 모듈로
호출하면 코드가 `SD0030`인 `UnsupportedFeatureError`가 이 메시지와 함께 던져집니다.

```
glsl-es300: @interpolate("linear") has no GLSL ES 3.00 form — that spec has smooth, flat and centroid, and linear (desktop `noperspective`) is none of them. Use "perspective", or keep the shader WGSL-only.
```

`compile()`은 같은 실패를 `TS8015` 경고로 보고하고 WGSL은 유지합니다.

### 코드로 분기하기

진단에서 여러분의 코드가 기준으로 삼을 부분은 코드입니다. `TS8` 코드는 번호가 바뀌지 않고(규칙
12.2), `SD` 코드는 덧붙이기만 하는 카탈로그에서 옵니다. 그래서 코드로 나눈 분기는 계속 동작합니다.
분기는 코드로 나누고, 작성자에게는 메시지를 보여 주십시오.

```ts
const errors = compile(source).diagnostics.filter((d) => d.category === 'error')
if (errors.some((d) => d.code === 'TS8005')) {
  // a write to a const: report it against the author's own source
}
```

### 모든 실패를 한 번에

`compile()`은 호출 한 번에 소스의 모든 진단을 모읍니다. 그래서 실수가 세 개인 소스는 진단 세 개를
보고합니다. 실수 하나는 진단 하나로 읽힙니다(규칙 12.4). 거부된 선언의 이름을 쓰는 줄마다 오류가
또 나지는 않습니다. `category`는 셰이더 텍스트를 남기지 않는 `error`와, 프로그램을 더 낫게 쓰는
법이나 닿지 못하는 타깃을 알려 주는 `warning`을 구분합니다.

`compile()` 뒤에 바꾼 모듈이나 엔진이 조립한 모듈은 `validate(m)`이 검사합니다. 이 함수는 생성
시점의 규칙을 모듈에 적용합니다. 함수나 구조체 이름이 겹치지 않아야 하고, 바인딩이 충돌하지 않아야
하며, 값을 돌려주는 함수는 모든 경로에서 반환해야 하고, 호출 지점은 부르는 선언과 맞아야 합니다.
`emitModule`과 GLSL 생성기가 먼저 실행하는 것도 이 검사입니다. 그래서 규칙을 어긴 모듈은
`createShaderModule`에서 드라이버 메시지로 실패하지 않고, 생성을 호출하는 자리에서 코드 붙은
오류로 실패합니다. `validate`는 오류를 모두 모은 다음에 던지며, `ValidationError`의
`.diagnostics`에 그 오류들이 담깁니다.

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

`same` 함수가 두 번 들어 있는 모듈은 이렇게 보고합니다.

```
typeshade [SD0020]: module validation failed (1 error):
  - dup-func: duplicate function 'same'
```

### diagnose 보고서

`typeshade/dev` 하위 경로의 `diagnose(m)`은 "이 모듈의 무엇이 잘못되었나"를 묻는 입구입니다. 린트
규칙 묶음을 실행하고, 백엔드를 넘기면 기능 검사를 더하며, 모든 진단과 그 개수를 센 요약을 담은
보고서를 돌려줍니다. 오류를 던지지 않고 모듈을 바꾸지도 않으므로, 곧 생성할 모듈에 불러도
안전합니다. `formatReport`는 보고서를 텍스트로 만듭니다. `lintModule(m)`은 같은 규칙 묶음을
실행하되, 요약과 기능 검사 없이 진단만 평범한 배열로 돌려줍니다.

```ts
import { compile, wgslBackend } from 'typeshade'
import { diagnose, formatReport } from 'typeshade/dev'

const report = diagnose(compile(source).module, { rules: 'all', backend: wgslBackend })
if (report.summary.errors + report.summary.warnings > 0) console.error(formatReport(report))
```

`same(a: f32, b: f32)`가 `a == b ? 1. : 0.`을 돌려주는 소스라면 보고서는 이렇게 나옵니다.

```
warning no-float-eq  (fn same)
  f32 '==' in fn 'same' — exact float equality is unreliable

0 errors, 1 warning
```

`rules: 'all'`은 생성 시점의 규칙보다 범위가 넓습니다. 이름 짓기, 중첩 깊이, 쓰이지 않는 바인딩,
부동소수점 동등 비교, 단일 출구를 함께 봅니다. 이 가운데 몇몇 규칙은 IR 빌더가 조립하는 모듈을
위해 만들었습니다. `single-exit`는 함수에 `return`이 하나이기를 요구하므로, `"use typeshade"`
함수가 쓴 조기 반환을 하나하나 보고합니다. 이 보고는 잘못이 아니라 스타일에 관한 참고로 읽으십시오.
`rules: 'core'`는 실행 범위를 `validate`가 쓰는 규칙으로 좁힙니다. `backend` 옵션은 그 백엔드가
감당하지 못하는 기능을 모두 밝힌 `SD0030` 진단 하나를 더합니다. 이 진단은 `emitModule`이 실행하는
게이트와 같은 검사를 오류를 던지지 않고 하는 짝입니다.

```
error[SD0030] unsupported-capability
  backend 'glsl-es300' cannot emit this module — missing capabilities: compute, subgroups
```

### 소스 위치

앞의 예제에서 보듯 `compile()`의 진단에는 모두 위치가 붙어 있습니다. 소스가 가져온 파일에서 난
진단은 그 파일의 이름을 밝힙니다. 이를 위해 따로 켤 것은 없습니다.

모듈도 위치를 간직합니다. 컴파일러가 만드는 문장마다 원래 소스의 구간이 붙어 있으며,
`sourceSpanOf(stmt)`로 읽습니다. 파일, 오프셋, 시작과 끝의 줄과 문자 위치가 들어 있습니다.
`typeshade/debug`의 디버거는 이 구간으로 중단점을 찾고 단계를 보고합니다. 위치 정보는 생성된
셰이더에 들어가지 않습니다. IR 빌더가 조립하는 모듈은 소스 위치 추적을 켰을 때만 위치를
기록하며, 그 방법은 [`docs/ir-builder.md`](docs/ir-builder.md)에 있습니다.
