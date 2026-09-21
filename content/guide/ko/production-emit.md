---
id: production-emit
source: c4b68090036af9a869567bf96a59435346d5a57122fb2af6e4131c22a03cec65
sourceLine: 2301
---

이 절을 읽고 나면 배포 시점 변환들을 생성 호출 하나에 조합할 수 있고, 바뀐 이름으로
적혀 돌아오는 드라이버 로그도 읽어 낼 수 있습니다.

번들러는 JavaScript는 압축하지만, `createShaderModule`이나 `gl.shaderSource`에 넘기는
셰이더 문자열에는 손대지 않습니다. 이 절에서 다루는 변환들이 그 나머지 절반을 맡습니다.
이 변환들은 `typeshade/emit-prod`라는 별도 서브패스에 있으므로, 이 경로를
가져오지 않는 빌드에는 하나도 번들되지 않고, 일반 생성 호출이 내는 바이트도 달라지지
않습니다.

### 플러그인 묶음

생성 플러그인은 `EmitPlugin`입니다. Vite나 Webpack에 플러그인을 넘기듯이, 이름이 있는
변환 하나를 생성 호출에 넘기는 것입니다. `emitModule`과 `emitGlslModule` 모두 옵션으로
`plugins` 배열을 받습니다. 플러그인은 두 단계 가운데 하나에서 동작합니다. `transformIR`은
모듈을 텍스트로 조립하기 전에 모듈을 고쳐 쓰고, `transformText`는 생성된 문자열을 고쳐
씁니다. IR 단계 플러그인은 텍스트 단계 플러그인보다 항상 먼저 실행되고, 같은 단계
안에서는 배열에 적은 순서대로 실행됩니다.

```ts
import { emitModule, emitGlslModule } from 'typeshade'
import { mangle, minify, obfuscate } from 'typeshade/emit-prod'

const renames = new Map<string, string>()
const wgsl = emitModule(m, { plugins: [mangle({ renames }), minify()] })

// obfuscate() is the standard preset: [mangle, prune, aliasTypes, minify]
const vs = emitGlslModule(m, 'vertex', { plugins: obfuscate() })
const fs = emitGlslModule(m, 'fragment', { parens: 'minimal', plugins: obfuscate() })
```

`parens: 'minimal'`은 `plugins`와 나란히 생성 옵션에 적습니다. 괄호를 넣을지 말지는
생성기가 텍스트를 쓰면서 정하는 일이기 때문입니다. 이 옵션은 WGSL과 GLSL ES 3.00이
우선순위를 똑같이 정의하는 자리에서만 괄호를 생략합니다. 단항 마이너스는 `*`, `/`,
`%`보다 우선순위가 높고, 이들은 다시 `+`, `-`보다 우선순위가 높습니다. 관계·논리·비트·
시프트 연산자의 괄호는 그대로 둡니다. WGSL은 이 연산자들을 괄호 없이 이어 쓸 때의
우선순위를 정해 두지 않았기 때문입니다. 연산 순서를 다시 묶는 일은 없으므로
`a + (b + c)`의 괄호는 그대로 남습니다. 기본값 `'full'`은 생성되는 모든 바이트를 그대로
둡니다.

### 짧아진 이름

맹글링(mangling)은 생성된 텍스트에 굳이 남길 필요가 없는 식별자의 이름을 바꾸는
것입니다. `mangle()`은 헬퍼 함수, 일반 구조체, 모듈 상수, 헬퍼 함수의 매개변수, 그리고
모든 지역 변수를 `a`, `b`처럼 짧은 base-52 이름으로 바꾸고, 한 글자를 다 쓰면 `aa`처럼
두 글자 이름으로 이어갑니다. 함수 안에서만 쓰이는 이름은 함수마다 같은 이름 풀에서
다시 시작하므로, 이름이 뒤로 계속 길어지지 않고 알파벳 앞쪽의 짧은 이름을 거듭 씁니다.
줄어드는 바이트의 대부분이 바로 이 재사용에서 나옵니다. 이름 바꾸기는 같은 모듈에
대해 항상 같은 결과를 내므로, GLSL의 두 스테이지를 따로 생성해도 공유하는 이름이 모두
일치하고 프로그램은 그대로 링크됩니다.

`renames`에 `Map`을 넘기면 작성 시점 이름이 어떤 생성 이름으로 바뀌었는지가 그 맵에
채워집니다. 이 맵이 셰이더의 소스 맵입니다. 배포 번들에는 담지 마십시오.

```ts
const renames = new Map<string, string>()
const wgsl = emitModule(m, { plugins: [mangle({ renames })] })

renames.get('terrain_shade') // 'b'
renames.get('noise.coordinate') // 'f'; a function-scoped key is `authoredFn.authoredName`
```

### 더 작아진 텍스트

텍스트 자체를 줄이는 플러그인은 셋입니다.

`minify()`는 생성된 소스를 토큰으로 쪼갠 뒤 그 토큰들을 다시 이어 쓰는데, 붙여 쓰면
이웃한 두 토큰이 하나로 합쳐질 자리에만 구분자를 넣습니다. 주석은 지우고, `#` 지시문은
한 줄을 그대로 차지하며, 숫자 리터럴은 값을 바꾸지 않는 범위에서 표기를 정리합니다.
그래서 `0.500`은 `.5`가 됩니다. `{ numbers: 'f32' }`를 주면 실수마다 f32로 반올림했을 때
같은 값이 되는 가장 짧은 십진수로 다시 씁니다. 손으로 검토해 둔 기준 출력과 비교할
때는 `{ numbers: false }`를 넘기십시오.

`aliasTypes()`는 자주 쓰이는 타입마다 짧은 이름을 붙이고 한 번만 선언합니다. WGSL에서는
`alias A=vec2<f32>;`로, GLSL에서는 `#define A vec2`로 선언합니다. 두 타깃 모두 그
타입을 적던 모든 자리에서 짧은 이름을 받아들이며, 생성자 호출 자리도 마찬가지입니다.
두 언어 모두 타입 이름은 예약어라 `mangle()`이 건드릴 수 없고, 그래서 맹글링을 거치고
나면 가장 많이 남는 것이 타입 이름입니다. 별칭을 선언하는 비용보다 절약이 적은 타입
표기는 건너뜁니다. 어떤 타입이 어떤 별칭이 되었는지는 같은 `renames` 맵에 함께
기록합니다.

`prune()`은 GLSL 전방 선언 가운데 함수 정의가 이미 모든 호출 지점보다 앞에 와서 필요
없어진 것만 지우고, 나머지는 모두 남겨 둡니다. WGSL에서는 아무 일도 하지 않습니다. GLSL
백엔드는 호출 그래프상 꼭 필요한 자리에만 전방 선언을 생성하므로, 이 플러그인은
백엔드가 쓰지 않은 GLSL을 다룰 때 씁니다. `raw` 본문이나 호스트가 끼워 넣는 모듈
조각(module fragment)이 그런 경우입니다.

```ts
import { aliasTypes, minify, minifyShaderText, prune } from 'typeshade/emit-prod'

const glsl = emitGlslModule(m, 'fragment', {
  parens: 'minimal',
  plugins: [prune(), aliasTypes({ renames }), minify({ numbers: 'f32' })],
})

minifyShaderText(wgsl, { numbers: 'f32' }) // the same pass over a string you hold
```

### 인라인화

`inline()`은 호출 그래프를 평평하게 펼칩니다. 안전하게 인라인할 수 있는 헬퍼는 모든
호출 지점에 인라인되므로, 그 함수들은 출력에서 사라집니다. 반환문 하나뿐인 헬퍼는 호출
자리를 그 표현식으로 바꿔 넣는 방식으로 인라인하고, 문장이 여럿이지만 빠져나가는 곳이
하나뿐인 헬퍼는 그 문장들을 호출한 함수 안으로 옮겨 인라인합니다. 진입점과 재귀 함수는
언제나 그대로 둡니다.

크기가 줄어드는 것은 아닙니다. 여러 곳에서 호출되는 헬퍼는 호출 지점마다 복사되기
때문입니다. 목적은 읽는 사람이 따라갈 수 있는 구조 자체를 없애는 데 있으므로,
`mangle()`, `minify()`와 함께 짝지어 씁니다. 프리셋에는 들어 있지 않습니다. 둘 다 IR
단계에서 동작하므로 `mangle()`보다 앞에 두십시오.

옵션은 `opaque` 하나뿐입니다. f64 하향 변환(lowering)은 자신이 끼워 넣는 에뮬레이션
라이브러리의 헬퍼에 최적화 금지 플래그를 찍어 두는데, 이 옵션은 그런 헬퍼를 어떻게
다룰지 정합니다. 기본값인 `'keep'`은 그런 헬퍼를 그대로 둡니다. `'single-call'`은 호출
지점이 하나뿐인 헬퍼까지 인라인 대상에 넣습니다. 선언 하나와 호출 하나를 없애는
것이라 복사되는 코드가 없기 때문입니다. `'all'`은 모든 헬퍼를 대상에 넣으며, 그 대가로
생성되는 바이트가 5.1x에서 27.2x까지 늘어납니다. `maxGrowth`는 인라인하는 동안 모듈의
연산 개수가 몇 배까지 늘어나도 되는지 상한을 정하고, `report`에는 검토한 헬퍼마다
어떤 결정을 내렸는지 하나씩 쌓입니다.

```ts
import { inline, obfuscate, type InlineDecision } from 'typeshade/emit-prod'

const decisions: InlineDecision[] = []
const wgsl = emitModule(m, {
  parens: 'minimal',
  plugins: [inline({ opaque: 'all', maxGrowth: 4, report: decisions }), ...obfuscate()],
})

decisions[0] // { fn, callSites, ops, growth, inlined, reason: 'inlined' | 'over-budget' | 'not-inlinable' }
```

### 드라이버 로그 디코딩

배포되는 텍스트는 일부러 읽기 어렵게 만든 것이라, 드라이버 오류도
`no matching overload in 'b' for arg of type 'l'`처럼 나옵니다. `decodeShaderLog(log, renames)`는
이 로그 속 이름을 작성 시점 이름으로 되돌립니다. 토큰 단위로 치환하므로 드라이버가 쓴
설명 문구와 줄 번호, 소스 발췌는 그대로 남고, 긴 단어 안에 우연히 들어 있는 짧은
이름을 잘못 바꾸는 일도 없습니다. 디코딩은 빌드 시점에 하는 일이므로, 디코더와 맵은
둘 다 `emit-prod` 서브패스에 있고 배포 번들에는 들어가지 않습니다.

원래 이름이 하나로 정해지는 이름은 바로 바꿔 넣습니다. 모듈 범위 이름과 타입 별칭이
여기에 해당하며, 드라이버가 오류에 실제로 적는 이름도 이 둘입니다. 함수 안에서만
쓰이는 이름은 일부러 여러 함수에서 다시 쓰므로, 원래 이름 후보가 여럿인 경우에는
후보를 모두 붙여 적습니다. `invertRenames(renames)`를 부르면 이 역방향 표를 데이터로
받을 수 있습니다.

```ts
import { decodeShaderLog, invertRenames } from 'typeshade/emit-prod'

decodeShaderLog("no matching overload in 'b' for arg of type 'l'", renames)
// "no matching overload in 'terrain_shade' for arg of type 'vec2<f32>'"

decodeShaderLog('undeclared identifier f', renames)
// 'undeclared identifier f⟨coordinate (in noise) | tint (in shade)⟩'

invertRenames(renames).get('b') // { emitted: 'b', authored: ['terrain_shade'] }
```

### 절대 이름을 바꾸지 않는 대상

어떤 이름은 호스트가 실행 시점에 이름으로 찾는 인터페이스라서, 바꾸면 바인딩이
끊어집니다. 그런 이름 다섯 종류는 건드리지 않습니다. 진입점 이름은 WebGPU
파이프라인이 `entryPoint`에 그대로 적는 이름입니다. 진입점 매개변수 이름은 구조체가
아닌 매개변수라면 그 이름이 곧 GLSL varying 이름이고, 버텍스 쪽에서는 별도의 생성
호출이 반환 구조체의 필드 이름으로 같은 varying을 적습니다. 바인딩 이름은 `_fp64`
가드까지 포함해 호스트가 이름으로 찾습니다. 바인딩 구조체 이름은 그대로 GLSL 유니폼
블록의 태그가 됩니다. 구조체 필드 이름은 std140 레이아웃 정보를 담고 있고, GLSL에서는
varying이 이 이름으로 두 스테이지를 연결합니다. `raw` 문(statement)을 담은 모듈은
아예 통째로 이름을 바꾸지 않는데, 그 이유는
[raw 문](/guide/authoring/raw-statements/)에서 설명합니다.

```ts
const renames = new Map<string, string>()
emitModule(m, { parens: 'minimal', plugins: obfuscate({ renames }) })

renames.get('terrain_shade') // 'b', a helper function
renames.get('vec2<f32>') // 'l', a type alias
renames.has('U') // false; a binding name a host resolves
renames.has('fs') // false; an entry-point name a pipeline names
```

### 배포되는 모듈이 검증한 모듈과 같음을 증명하기

`semanticDiff(dev, prod)`는 두 모듈의 차이를 네 버킷으로 나누어 보고하는데, 프로덕션
파이프라인을 거치면 의도한 변경 때문에 그 가운데 몇몇 버킷에 줄이 쌓이기 마련입니다.
생성에 쓴 것과 같은 플러그인 배열을 `transforms`로 넘기면, 선언한 파이프라인이
일으켰음이 증명되는 차이는 모두 원래 버킷에서 빠져 `explained`로 옮겨지고, 항목마다
어느 플러그인이 어느 버킷의 어떤 줄을 설명하는지 적힙니다.

```ts
import { isSemanticallyEqual, semanticDiff } from 'typeshade'

const d = semanticDiff(devModule, prodModule, { transforms: [inline(), ...obfuscate()] })

isSemanticallyEqual(d) // true when prod differs from dev only as the declared pipeline dictates
d.explained // [{ transform: 'inline', bucket: 'controlFlow', line: '…' }, …]
```

이 분류는 실제로 적용해 본 결과로 정합니다. 선언한 플러그인의 `transformIR`을 dev
모듈에 직접 적용해서 그 줄이 diff에서 정말로 사라질 때만 `explained`로 옮깁니다.
그래서 옵티마이저의 재작성처럼 보이는 회귀도 원래 버킷에 그대로 남고, 패리티 게이트는
설명되지 않고 남은 차이에만 예산을 두면 됩니다. 텍스트 단계 플러그인은 아무것도
설명하지 않습니다. 비교기는 생성된 텍스트를 보지 않기 때문이며, 그래서 프로덕션
플러그인 배열을 통째로 넘겨도 안전합니다.

이 저장소의 예제 코퍼스에서 `obfuscate()`에 `parens: 'minimal'`을 더하면 일반 생성
결과 175,673자가 93,490자로 줄어들며, 이 성질은 두 개의 게이트가 지킵니다.
`examples/minify-safety.test.ts`는 압축 전후로 토큰 스트림과 모든 리터럴의 f32 값이
같고, 이 패스를 두 번 적용해도 결과가 같다는(멱등) 점을 검증합니다.
`examples/reserved-word-safety.test.ts`는 코퍼스를 `obfuscate()`와
`[inline(), ...obfuscate()]` 양쪽으로 돌려서, 어느 플러그인도 두 언어 중 한쪽에서라도
예약어인 이름을 만들어 내지 않는다는 것을 검증합니다.
