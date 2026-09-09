---
id: production-emit
source: 953eb87426ad9e790fffcc28a07319e030b1ceb229366415941b64b32a11079b
sourceLine: 2192
---

이 절을 다 읽고 나면 배포 시점 변환들을 하나의 생성 호출로 조합하고, 이름이 바뀐
텍스트로 돌아오는 드라이버 로그를 다시 읽을 수 있습니다.

번들러는 JavaScript는 압축하지만, `createShaderModule`이나 `gl.shaderSource`에 넘기는
셰이더 문자열에는 손대지 않습니다. 이 절에서 다루는 변환들이 그 나머지 절반을 맡습니다.
이 변환들은 `@xgis/shader-dsl/emit-prod`라는 자신만의 서브패스에 놓여 있으므로, 이를 한
번도 가져오지 않는 빌드는 이 코드를 전혀 번들에 담지 않고, 일반 생성 호출은 지금 나오는
바이트를 그대로 유지합니다.

### 플러그인 묶음

생성 플러그인은 `EmitPlugin`입니다. Vite나 Webpack 플러그인을 빌드에 넘기는 것과 같은
방식으로, 생성 호출에 이름 붙은 변환 하나를 넘기는 것입니다. `emitModule`과
`emitGlslModule` 모두 옵션에 `plugins` 배열을 받습니다. 플러그인은 두 단계 가운데
하나에서 동작합니다. `transformIR`은 모듈이 조립되기 전에 모듈을 고쳐 쓰고,
`transformText`는 생성된 문자열을 고쳐 씁니다. 모든 IR 단계는 어떤 텍스트 단계보다도
먼저 실행되며, 같은 단계 안에서는 배열에 적은 순서대로 실행됩니다.

```ts
import { emitModule, emitGlslModule } from '@xgis/shader-dsl'
import { mangle, minify, obfuscate } from '@xgis/shader-dsl/emit-prod'

const renames = new Map<string, string>()
const wgsl = emitModule(m, { plugins: [mangle({ renames }), minify()] })

// obfuscate() is the standard preset: [mangle, prune, aliasTypes, minify]
const vs = emitGlslModule(m, 'vertex', { plugins: obfuscate() })
const fs = emitGlslModule(m, 'fragment', { parens: 'minimal', plugins: obfuscate() })
```

`parens: 'minimal'`은 `plugins`와 나란히 생성 옵션에 놓입니다. 괄호를 넣을지는 생성기가
텍스트를 쓰는 동안 내리는 결정이기 때문입니다. 이 옵션은 WGSL과 GLSL ES 3.00이
우선순위를 똑같이 정의하는 자리에서만 괄호를 생략합니다. 단항 마이너스는 `*`, `/`,
`%`보다 우선순위가 높고, 이들은 다시 `+`, `-`보다 우선순위가 높습니다. 관계·논리·비트·
시프트 연산자는 괄호를 그대로 남겨 둡니다. WGSL이 이들 사이에 연쇄 우선순위를 정의하지
않기 때문입니다. 재결합은 결코 하지 않으므로, `a + (b + c)`는 괄호를 그대로 유지합니다.
기본값 `'full'`은 생성되는 모든 바이트를 그대로 둡니다.

### 짧아진 이름

맹글링은 생성된 텍스트가 굳이 유지할 필요 없는 식별자의 이름을 바꾸는 것입니다.
`mangle()`은 헬퍼 함수, 일반 구조체, 모듈 상수, 헬퍼 함수의 매개변수, 그리고 모든 지역
변수를 `a`, `b`처럼 짧은 base-52 이름으로 바꾸고, 한 글자를 다 쓰면 `aa`처럼 두 글자
이름으로 이어갑니다. 함수 범위의
이름은 함수마다 같은 이름 풀에서 다시 시작하므로, 알파벳 앞쪽의 짧은 이름이 계속
재사용되고 뒤쪽으로 갈수록 세어 나가지는 않습니다. 바이트 대부분이 줄어드는 지점이 바로
이 재사용입니다. 이름 바꾸기는 모듈 단위로 결정적이므로, GLSL 두 스테이지의 생성
결과는 공유하는 모든 이름에서 서로 일치하고, 프로그램은 여전히 링크됩니다.

`renames`에 `Map`을 넘기면 작성한 이름에서 생성된 이름으로 가는 대응을 받습니다. 이
맵이 셰이더 소스 맵입니다. 배포 번들 밖에 두어야 합니다.

```ts
const renames = new Map<string, string>()
const wgsl = emitModule(m, { plugins: [mangle({ renames })] })

renames.get('terrain_shade') // 'b'
renames.get('noise.coordinate') // 'f'; a function-scoped key is `authoredFn.authoredName`
```

### 더 작아진 텍스트

세 개의 플러그인이 텍스트 자체를 줄입니다.

`minify()`는 생성된 소스를 토큰 단위로 분석한 뒤 토큰 스트림을 다시 써 내는데, 이웃한
두 토큰이 합쳐져 하나가 되어 버리는 자리에만 구분자를 하나 남깁니다. 주석은 사라지고,
`#` 지시문은 자기 줄을 그대로 지키며, 숫자 리터럴은 값을 바꾸지 않은 채 정규화됩니다.
그래서 `0.500`은 `.5`가 됩니다. `{ numbers: 'f32' }`는 각 실수를 같은 f32 값으로
반올림되는 가장 짧은 십진수로 다시 씁니다. 손으로 확인한 기준과 비교할 때는
`{ numbers: false }`를 넘기면 됩니다.

`aliasTypes()`는 자주 쓰이는 타입마다 짧은 이름을 붙이고 한 번만 선언합니다. WGSL에서는
`alias A=vec2<f32>;`로, GLSL에서는 `#define A vec2`로 선언합니다. 두 타깃 모두 그
타입이 등장하는 모든 자리에서 짧은 이름을 받아들이며, 생성자 위치도 예외가 아닙니다. 두
언어 모두 타입 이름을 예약어로 남겨 두므로 `mangle()`은 이들을 건드리지 못하고, 이름을
바꾸고 난 뒤 남는 가장 큰 부류가 바로 타입 이름입니다. 한 번만 쓰여 별칭을 선언할
만한 값어치가 없는 표기는 건너뜁니다. 타입에서 별칭으로 가는 대응은 같은 `renames` 맵에 함께
보고합니다.

`prune()`은 정의가 이미 모든 사용 자리에서 함수를 선언하고 있는 GLSL 전방 선언을
지우고, 그 밖의 전방 선언은 모두 남겨 둡니다. WGSL에서는 아무 일도 하지 않습니다. GLSL
백엔드는 호출 그래프가 요구하는 자리에서만 전방 선언을 내보내므로, 백엔드가 직접 쓰지
않은 GLSL, 곧 `raw` 본문이나 호스트가 끼워 넣는 조각을 다룰 때 이 플러그인을 씁니다.

```ts
import { aliasTypes, minify, minifyShaderText, prune } from '@xgis/shader-dsl/emit-prod'

const glsl = emitGlslModule(m, 'fragment', {
  parens: 'minimal',
  plugins: [prune(), aliasTypes({ renames }), minify({ numbers: 'f32' })],
})

minifyShaderText(wgsl, { numbers: 'f32' }) // the same pass over a string you hold
```

### 인라인화

`inline()`은 호출 그래프를 평평하게 펼칩니다. 안전하게 인라인화할 수 있는 헬퍼는 모든
호출 지점에서 인라인되어 출력에서 사라집니다. 반환문 하나로 끝나는 헬퍼는 표현식
치환으로 인라인되고, 끝이 하나뿐인 여러 문장짜리 헬퍼는 그 문장들을 호출자 쪽으로
끌어올려 인라인됩니다. 진입점과 재귀 함수는 언제나 그대로 둡니다.

크기를 줄이는 수단은 아닙니다. 여러 곳에서 호출되는 헬퍼는 호출 지점마다 복제되기
때문입니다. 목적은 읽는 사람이 따라갈 수 있는 구조 자체를 없애는 데 있으므로,
`mangle()`, `minify()`와 함께 짝지어 씁니다. 프리셋에는 포함되어 있지 않습니다.
`mangle()`보다 앞에 두어야 합니다. 둘 다 IR 단계에서 동작하기 때문입니다.

축은 하나뿐이며, 이름은 `opaque`입니다. f64 하향 변환이 자신이 끼워 넣는 에뮬레이션
라이브러리에 찍어 두는 최적화 금지 플래그를 지닌 헬퍼를 어떻게 다룰지 이 축이
결정합니다. 기본값인 `'keep'`은 그런 헬퍼를 그대로 둡니다. `'single-call'`은 호출
지점이 하나뿐인 헬퍼까지 풀어 주는데, 선언과 그 호출을 없애도 아무것도 복제되지
않는 경우이기 때문입니다. `'all'`은 모든 헬퍼를 풀어 주며, 대신 생성되는 바이트가
5.1x에서 27.2x로 늘어납니다. `maxGrowth`는 풀어 주는 동안 모듈의 연산 개수가 배수로
얼마나 늘어날 수 있는지 상한을 정하고, `report`는 고려한 헬퍼마다 결정을 하나씩
모읍니다.

```ts
import { inline, obfuscate, type InlineDecision } from '@xgis/shader-dsl/emit-prod'

const decisions: InlineDecision[] = []
const wgsl = emitModule(m, {
  parens: 'minimal',
  plugins: [inline({ opaque: 'all', maxGrowth: 4, report: decisions }), ...obfuscate()],
})

decisions[0] // { fn, callSites, ops, growth, inlined, reason: 'inlined' | 'over-budget' | 'not-inlinable' }
```

### 드라이버 로그 디코딩

배포되는 텍스트는 일부러 알아보기 어렵게 되어 있어서, 드라이버 오류는
`no matching overload in 'b' for arg of type 'l'`처럼 나타납니다. `decodeShaderLog(log, renames)`는
이를 다시 작성한 이름으로 되돌립니다. 치환은 토큰 단위로 이루어지므로 드라이버 자체의
설명 문구와 줄 번호, 소스 발췌는 그대로 남고, 더 긴 단어 안에 들어 있는 짧은 이름은
결코 걸리지 않습니다. 디코딩은 빌드 시점에 이루어지는 단계이므로, 디코더와 맵 모두
`emit-prod` 서브패스에 머물고 배포 번들 밖에 남습니다.

되돌린 결과가 하나로 정해지는 이름은 그대로 치환되며, 여기에는 모듈 범위 이름과 타입
별칭처럼 드라이버가 실제로 이름 붙이는 대상이 모두 들어갑니다. 함수 범위 이름은 여러
함수에서 일부러 재사용되므로, 되돌렸을 때 후보가 여럿 나오는 이름에는 그 후보를 모두
함께 답니다. `invertRenames(renames)`는 같은 표를 데이터 그대로 건네줍니다.

```ts
import { decodeShaderLog, invertRenames } from '@xgis/shader-dsl/emit-prod'

decodeShaderLog("no matching overload in 'b' for arg of type 'l'", renames)
// "no matching overload in 'terrain_shade' for arg of type 'vec2<f32>'"

decodeShaderLog('undeclared identifier f', renames)
// 'undeclared identifier f⟨coordinate (in noise) | tint (in shade)⟩'

invertRenames(renames).get('b') // { emitted: 'b', authored: ['terrain_shade'] }
```

### 절대 이름을 바꾸지 않는 대상

몇몇 이름은 호스트가 실행 시점에 참조하는 인터페이스이므로, 이름을 바꾸면 그 연결이
끊어집니다. 다섯 가지 종류를 그대로 둡니다. 진입점 이름은 WebGPU 파이프라인이
`entryPoint`로 그 이름을 지정합니다. 진입점 매개변수 이름은 구조체가 아닌 진입점
매개변수 하나가 곧 GLSL varying 이름이기 때문에 바뀌지 않으며, 버텍스 쪽은 그
varying을 반환 구조체의 필드 이름으로 적는 별도의 생성 호출에서 다룹니다. 바인딩
이름은 `_fp64` 가드를 포함해 호스트가 이름으로 찾습니다. 바인딩 구조체 이름은 GLSL
유니폼 블록 태그 자체입니다. 구조체 필드 이름은 std140 레이아웃을 나르며, GLSL의
varying이 이름으로 두 스테이지를 연결합니다. `raw` 문을 담은 모듈은
[raw 문](/guide/authoring/raw-statements/)에서 설명하듯이 통째로 이름을 바꾸지 않은
채로 둡니다.

```ts
const renames = new Map<string, string>()
emitModule(m, { parens: 'minimal', plugins: obfuscate({ renames }) })

renames.get('terrain_shade') // 'b', a helper function
renames.get('vec2<f32>') // 'l', a type alias
renames.has('U') // false; a binding name a host resolves
renames.has('fs') // false; an entry-point name a pipeline names
```

### 배포되는 모듈이 검증한 모듈과 같음을 증명하기

`semanticDiff(dev, prod)`는 두 모듈의 차이를 네 개의 버킷으로 나누어 보고하며,
프로덕션 파이프라인은 설계상 그 버킷 가운데 일부로 줄을 옮기게 됩니다. 같은 플러그인
배열을 `transforms`로 넘기면, 선언한 파이프라인이 실제로 일으켰다고 증명할 수 있는
차이는 모두 그 버킷들에서 빠져나와 `explained`로 분류되며, 각 항목은 플러그인 이름과
버킷, 그리고 근거가 된 코드 줄을 함께 답니다.

```ts
import { isSemanticallyEqual, semanticDiff } from '@xgis/shader-dsl'

const d = semanticDiff(devModule, prodModule, { transforms: [inline(), ...obfuscate()] })

isSemanticallyEqual(d) // true when prod differs from dev only as the declared pipeline dictates
d.explained // [{ transform: 'inline', bucket: 'controlFlow', line: '…' }, …]
```

이 분류는 정의 자체에서 결정되며, 관찰이나 추측이 끼어들 자리가 없습니다. 선언한 플러그인 자체의 `transformIR`을 dev 쪽에
적용했을 때 그 줄이 diff에서 실제로 사라지는 경우에만 `explained`로 옮겨집니다.
옵티마이저가 다시 쓴 것처럼 보이는 회귀는 원래 버킷에 그대로 남으므로, 패리티
게이트는 설명되지 않은 나머지만 예산으로 잡으면 됩니다. 텍스트 단계 플러그인은
아무것도 설명하지 못합니다. 비교기가 생성된 텍스트를 전혀 보지 않기 때문이며, 그래서
프로덕션 배열 전체를 선언해도 안전합니다.

이 저장소의 예제 코퍼스를 기준으로, `parens: 'minimal'`을 곁들인 `obfuscate()`는 일반
생성 결과 175,673자를 93,490자로 줄이며, 두 개의 게이트가 이 특성을 지켜 줍니다.
`examples/minify-safety.test.ts`는 압축 전후로 토큰화된 토큰 스트림과 모든 리터럴의
f32 값이 그대로 유지되고, 이 패스가 멱등이라는 점을 검증합니다.
`examples/reserved-word-safety.test.ts`는 코퍼스를 `obfuscate()`와
`[inline(), ...obfuscate()]` 양쪽으로 돌려서, 두 플러그인 모두 두 언어 가운데 어느
쪽도 예약해 둔 이름을 새로 만들어 내지 않는다는 것을 검증합니다.
