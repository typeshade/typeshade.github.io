---
id: diagnostics
source: da66ea06b08c6f7fa84eecfbabe0a201736d9c904612ade78815068782253bb9
sourceLine: 881
---

작성 과정에서 저지르는 실수는 한 줄짜리 `hint`를 담은 **코드가
붙은** 오류(`shader-dsl [SD####]: …`)로 드러납니다. 타입 불일치, 벡터가 아닌 값에 대한
스위즐, 분기가 서로 맞지 않는 `select` 같은 문제는 각각 안정적인 `.code`를 가진
`ShaderDslError`를 던지며, 이 코드로 분기해 처리할 수 있습니다.

```ts
try {
  emitModule(m)
} catch (e) {
  if (e instanceof ShaderDslError && e.code === 'SD0002') {
    /* mismatched vectors */
  }
}
```

### `validate()`: 오류를 한 번에 모두 보고

`emitModule`은 먼저 `validate()`를 실행합니다. 모듈 구조 자체가 잘못됐을 때는 실패 전체를
나열하는 `ValidationError` 하나를 던집니다(각 진단은 코드, 규칙, 함수, 그리고 소스 위치
추적을 켰다면 `file:line:col`까지 담습니다). 이 진단 목록은 `err.diagnostics`에서도 꺼내
볼 수 있습니다.

### `diagnose`: "무엇이 문제인지"에 답하는 하나의 창구

린트 규칙 집합과, 원한다면 백엔드 기능 검사까지 함께 실행하되 예외를 던지지 않고 사람이
읽을 보고서로 렌더링합니다.

```ts
import { diagnose, formatReport, wgslBackend } from '@xgis/shader-dsl'

const report = diagnose(m, { rules: 'all', backend: wgslBackend })
console.log(formatReport(report))
// error[SD0107] no-assign-to-let  (fn rim_alpha)
//   --> map/src/shaders/dsl/line.ts:721:9
//   assignment to immutable 'let' binding 'x' …
//   hint: declare the binding with Var() instead of Let() to mutate it
// 1 error, 0 warnings
```

`diagnose`는 IR을 읽기만 할 뿐 생성 경로에는 전혀 관여하지 않으며, 린트 문제와 기능 문제를
한 번에 함께 드러냅니다. `Let`에 `.assign()`을 쓰는 전형적인 함정(`Let(x); x.assign(…)` →
유효하지 않은 WGSL)도 여기서 `SD0107` / `no-assign-to-let` 오류로 나타납니다.

### 소스 위치: `setSourceTracing`(개발 전용, 옵트인, 기본값 꺼짐)

소스 위치 추적을 켜면 작성한 문장이나 함수 각각을 그것을 만들어 낸 TypeScript 줄로 되짚을
수 있게 되어, 진단이 `file:line:col`을 함께 출력할 수 있습니다. 기본값은 꺼짐이며, 꺼져
있을 때는 스택을 전혀 할당하지 않으므로 비용이 정말로 들지 않습니다. 개발이나 테스트를
실행할 때만 켭니다.

```ts
import { setSourceTracing } from '@xgis/shader-dsl'
setSourceTracing(true) // or set XGIS_SHADER_DSL_TRACE=1
```

위치 정보는 노드 동일성을 키로 삼는 비공개 사이드 테이블에 저장됩니다. 생성 경로에서는
결코 읽지 않으며, 생성된 WGSL/GLSL에도 결코 나타나지 않습니다(추적을 켜든 끄든 생성 결과는
바이트 단위로 동일합니다). 위치는 옵티마이저나 하향 변환이 노드를 다시 만들기 전, 즉 작성된
그대로의 모듈에서만 해석되며, `validate()` / `lintModule()` / `diagnose()`가 실행되는
지점도 바로 이 지점입니다.
