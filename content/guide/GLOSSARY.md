# 용어집

작성 가이드(AUTHORING.md)를 한국어로 옮길 때 쓰는 용어 목록입니다. 영어 단어를 하나씩
대응시키지 않고, 문장이 한국어 개발자에게 실제로 전달하는 뜻을 기준으로 골랐습니다
(ko.vuejs.org, MDN 한국어, MS Learn 한국어에서 쓰는 표현을 기준으로 삼았습니다). 새 절을
번역하다가 이 목록에 없는 용어를 만나면 스스로 정하고, 그 판단과 이유를 이 표에 추가해
두어야 합니다.

`.claude/skills/typeshade-site/SKILL.md`가 이미 고정한 표준 용어(셰이더, 유니폼, 프래그먼트,
버텍스, 컴파일, 바인드 그룹, 레이아웃, 파이프라인, 렌더러, 리플렉션, 리소스 바인딩, 정밀도,
배정밀도, 에뮬레이션, 골든 파일, 진단, 구조체, 스토리지 버퍼, 텍스처, 샘플러,
플레이스홀더)은 아래 표에서 다시 다루지 않습니다. WGSL, GLSL, WebGPU, WebGL2, TypeScript,
JavaScript, GPU, CPU, IR, f32, f64, std140은 로마자 그대로 씁니다.

## 표

| 영어 용어 | 한국어 | 비고 |
| --- | --- | --- |
| authoring surface | 작성 인터페이스 | 셰이더를 작성할 때 실제로 손으로 쓰는 함수·타입 전체를 가리킵니다. "노출 범위"보다 "인터페이스"가 한국어 개발 문서에서 더 자연스럽습니다. |
| author (동사) | 작성하다 | "authoring a shader" = "셰이더를 작성하다". |
| entry point | 진입점 | SKILL.md가 지정한 표준 용어. `@vertex`/`@fragment`/`@compute`로 지정된 함수를 가리킵니다. |
| emit (동사) | 생성하다 | IR에서 WGSL/GLSL 텍스트를 만들어 내는 동작. "내다"는 쓰지 않습니다(금지어 목록). "출력하다"는 이미 만들어진 바이트를 텍스트로 내보내는 맥락(예: 압축된 문자열을 출력하다)에서만 씁니다. |
| emit (명사, "the emit path") | 생성 경로 / 생성 시점 | "emit-time"은 "생성 시점", "emit path"는 "생성 경로"로 통일합니다. |
| lower / lowering | 하향 변환 | "낮추기"는 한국어 컴파일러 문헌에서 쓰지 않는 말입니다. `f64`를 `vec2<f32>`로 바꾸는 것처럼 상위 표현을 더 낮은 표현으로 옮기는 컴파일 단계를 뜻하며, "하향 변환" 또는 필요하면 풀어서 설명합니다. |
| variant | 변형 | 같은 모듈에서 갈라져 나온 버전. "사본"은 코드 복사본을 뜻하는 금지어이므로 쓰지 않습니다. |
| capability / feature (GPU) | 기능 | `enables`에 선언하는 GPU 기능과 WebGPU의 `requiredFeatures`를 모두 "기능"으로 통일합니다. 문맥상 원문이 capability인지 feature인지 구분할 필요가 있으면 처음 등장할 때만 영어를 괄호로 병기합니다. |
| extension | 확장 | GLSL `#extension`, WebGL 확장 문자열(`EXT_*`, `OVR_*`) 모두 "확장". |
| SoT (single source of truth) | SoT | 로마자 유지. 처음 등장할 때 "단일 진실 공급원(SoT)"처럼 한 번 풀어 쓰고 이후에는 SoT만 씁니다. |
| layout | 레이아웃 | 표준 용어. std140/std430 바이트 배치를 가리킬 때도 "레이아웃"을 그대로 씁니다. |
| IO struct | IO 구조체 | "IO"는 GPU/그래픽스 문서에서 널리 쓰는 축약이라 로마자로 둡니다. `ioStruct`가 만드는, 버텍스·프래그먼트 사이를 오가는 구조체를 가리킵니다. |
| storage element | 스토리지 요소 | "스토리지 버퍼"(표준 용어)에 담기는 개별 원소 타입. |
| resource | 리소스 | 텍스처·샘플러처럼 바인드 그룹에 올라가는 대상 전반. |
| handle | 핸들 | `FnHandle`처럼 선언과 호출 가능한 값을 동시에 가리키는 객체. 한국어 개발 문서에서 이미 "핸들"로 굳어진 표현입니다. |
| free (function) / free-standing / standalone | 독립(된) | `assign(x, v)`처럼 특정 대상에 매인 메서드가 아니라 따로 떨어져 존재하는 함수, 또는 문맥 없이 홀로 쓰이는 리터럴·상수를 가리킵니다(`values-and-mutation.md`). "자유 함수"는 한국어 개발 문서에서 쓰지 않는 직역이라 "독립 함수"로 통일합니다. |
| combinator | 조합자 | `when`/`reduce`처럼 값을 조합해 새 값을 만들어 내는 함수. 음차("컴비네이터")보다 뜻을 담은 "조합자"를 씁니다. |
| dispatch | 디스패치 | 조건이나 정수 값에 따라 실행 경로를 고르는 것. `Switch`의 값 디스패치와 컴퓨트 워크그룹 디스패치 모두 이 말로 통일합니다. |
| branch / arm | 분기 | 전체 분기 구조와 그 안의 개별 조건-값 쌍을 모두 "분기"로 옮깁니다. 굳이 구분해야 하면 "개별 분기"라고 풉니다. `.case()`처럼 코드에 등장하는 메서드 이름은 번역하지 않습니다. |
| scrutinee | 판별값 | `Switch`/`matchExpr`가 분기를 고를 때 기준으로 삼는 값. |
| early return | 조기 반환 | `Return`/`ReturnIf`로 함수 본문 중간에서 빠져나가는 것. |
| diagnostic | 진단 | 표준 용어. `ShaderDslError`, `diagnose()`가 내는 오류·경고 보고 전반. |
| source tracing | 소스 위치 추적 | `setSourceTracing`이 켜졌을 때 각 문장을 원본 TypeScript 줄로 되짚는 기능. |
| oracle | 오라클 | CPU에서 배정밀도로 같은 계산을 수행해 기준값을 내는 대상. 이름을 바로 쓰지 않고 "기준값을 내는 오라클입니다"처럼 뜻을 먼저 설명한 뒤 이름으로 부릅니다. |
| golden / golden file | 골든 파일 | 표준 용어. |
| precision qualifier | 정밀도 한정자 | GLSL의 `precision highp float;` 같은 선언. "정밀도"는 표준 용어, "한정자"는 한국어 프로그래밍 언어 문서에서 qualifier에 쓰는 말입니다. |
| activation | 활성화 | 호스트가 부팅 시점에 GPU 기능을 켜는 것. |
| specialise / specialization | 특수화 | 같은 소스에서 조건에 따라 다른 프로그램을 만들어 내는 것. WGSL의 특수화 상수(specialization constant)를 가리킬 때도 "특수화 상수"로 씁니다. |
| override (개념) | 오버라이드 | WGSL 키워드 `override`를 가리킬 때는 코드체(`` `override` ``)로 두고 번역하지 않습니다. 그 메커니즘을 문장 속에서 개념으로 부를 때만 "오버라이드"(예: "오버라이드 상수")를 씁니다. |
| identity (of a shader) | 정체성 | 특수화 축(variant를 가르는 조건)이 셰이더를 다른 프로그램으로 만드는 것을 가리킵니다. |
| escape hatch | 탈출구 | React 한국어 문서의 "Escape Hatch" 번역과 같은 말을 씁니다. `rawStmt`처럼 DSL이 다루지 못하는 것을 손으로 끼워 넣는 통로. |
| contextual literal lift | 문맥 기반 리터럴 승격 | `x.add(1)`처럼 벌거벗은 숫자 리터럴이 피연산자의 타입으로 자동 변환되는 것. "승격"은 타입 변환에 이미 쓰는 말입니다. |
| mutation | 변경 | `.assign`으로 값이 바뀌는 것 자체를 가리킵니다. 불변/가변을 구분해야 할 때는 "불변"/"가변"을 따로 씁니다. |
| assign / assignment | 대입 | `.assign()` 메서드와 WGSL 대입문을 가리킵니다. 메모리 "할당"(allocate)과 구분하기 위해 "대입"을 씁니다. |
| backend | 백엔드 | WGSL 백엔드, GLSL 백엔드처럼 한 타깃을 담당하는 생성기. |
| pass (컴파일러) | 패스 | lint pass, optimizer pass 등 IR을 한 번 훑고 지나가는 처리 단계. |
| barrel | 배럴 | 패키지가 하위 모듈을 다시 내보내는 진입 파일. TypeScript 생태계에서 이미 굳어진 말입니다. |
| fail closed | 안전하게 차단하며 실패 | 애매하거나 지원하지 않는 조합을 만났을 때 잘못된 코드를 내보내는 대신 오류를 던지는 설계. 문장마다 "…하며 실패합니다" 식으로 풀어 쓰고, 명사형이 필요하면 "차단형 실패"를 씁니다. |
| footgun | 함정 | 무심코 잘못 쓰기 쉬운 API 모양을 가리키는 구어적 표현. |
| intrinsic / built-in | 내장 함수 | GPU가 직접 제공하는 함수(`dot`, `mix` 등). `builtin()` 같은 코드 이름은 번역하지 않습니다. |
| lint | 린트 | 표준 개발 용어. lint pass, lint rule 모두 "린트"를 그대로 씁니다. |
| guard (texture) | 가드 | fp64 연산이 상수 폴딩되지 않도록 막아 주는 텍스처. "가드 텍스처"로 씁니다. |
| CORE (capability status) | 코어 사양 | reflect나 텍스처 기능 설명에서 "별도 GPU 기능 없이 두 타깃 모두에 기본으로 들어있다"는 뜻으로 쓰는 상태 이름. 대문자를 그대로 옮기지 않고 "코어 사양"으로 풀어 씁니다. |
| lowers to (element/format state such as INCOMPLETE) | INCOMPLETE | 텍스처 포맷과 샘플러 타입이 어긋났을 때 텍스처가 놓이는 OpenGL/WebGL 스펙상의 상태 이름(텍스처 완전성). 고유한 스펙 용어라 로마자 그대로 두고 번역하지 않습니다. |
| NEAREST (texture filter mode) | NEAREST | GL 계열 텍스처 필터링 모드의 이름. WGSL/GLSL 코드에 실제로 등장하는 상수 이름과 같은 성격이라 번역하지 않고 로마자 그대로 둡니다. |
| neutral id (capability) | 중립 id | `enables`에 적는, 특정 백엔드의 `EXT_*`/`OVR_*` 문자열이 아니라 두 타깃 모두에 통하는 기능 이름. 리플렉션이 돌려주는 id도 같은 뜻으로 "중립"이라 부릅니다. |
| tier (portable kernel) | 등급 | "portable kernel tier", "gather-only tier"처럼 어떤 조건을 만족해야 들어가는 커널의 부류를 가리킵니다. |
| gather-only | gather 전용 | 이식 가능한 컴퓨트 커널이 지켜야 하는 모양으로, 여러 위치를 읽기만 하고 자기 스레드 몫에 정확히 한 번만 쓰는 것을 가리킵니다. "gather-only pass"도 같은 말로 옮깁니다. "gather" 자체는 아래 "영어로 두는 낱말" 표를 따라 번역하지 않고 그대로 씁니다. |
| scatter write | scatter 쓰기 | 커널이 자기 스레드가 맡은 위치가 아닌 다른 위치에 쓰는 것. gather 전용 등급에서 금지됩니다. "scatter"는 아래 "영어로 두는 낱말" 표를 따라 번역하지 않고 그대로 씁니다. |
| lane (f32 lane) | 레인 | f64 값의 hi/lo 쌍이나 비트캐스트 정수처럼, f32 슬롯 하나가 나르는 값 한 조각을 가리킵니다. |
| matrix (variant space) | 행렬 | `variantFamily`의 축이 만드는 조합 전체, 즉 축 공간을 가리킵니다. "매트릭스"로 음차하지 않고 "행렬"로 통일합니다. |
| single-view / multiview (rendering) | 단일 뷰 / 멀티뷰 | `multiview` 확장이 실제로 여러 시점을 한 번에 그리는 렌더링을 가리킬 때 쓰는 말. 코드 식별자 `multiview`는 번역하지 않고 그대로 둡니다. |
| capability gate | 기능 게이트 | 모듈이 선언한 `enables` id가 실제로 지원되는지 걸러 내는 컴파일 단계. |
| dispatch uniform | 디스패치 유니폼 | 이식 가능한 컴퓨트 커널의 첫 번째 `uniform` 바인딩으로, 호출 횟수와 출력 그리드 크기 등 디스패치 정보를 담습니다. |
| fallback | 폴백 | 어떤 기능이 없을 때 호스트가 미리 준비해 둔 다른 모듈로 넘어가는 것. `enables`가 던지는 오류(차단형 실패)와 대비되는, 부팅 시점에 호스트가 직접 고르는 진짜 대안입니다. |
| hillshade | hillshade | 지형에 음영을 넣어 입체감을 표현하는 렌더링 기법의 이름. `map/src/shaders/dsl/hillshade.ts` 같은 실제 파일·기법 이름과 그대로 맞춰야 해서 번역하지 않고 로마자로 둡니다. |
| activation-authority rule | 활성화 권한 규칙 | GPU 기능의 활성화 여부는 부팅 시점, 즉 디바이스를 요청하는 호스트만 결정할 수 있고 이후에는 바꿀 수 없다는 §10의 규칙. `activation`(활성화, 이미 고정된 표준 용어)에 "권한 규칙"을 붙여 옮겼습니다. |
| exhaustive (dispatch) | 빠짐없는 | `enumU32`/`matchEnum` 조합처럼 분기 하나라도 빠뜨리면 컴파일 오류가 나는, 모든 경우를 다 다루는 디스패치를 가리킵니다. "완전한"보다 "빠짐없는"이 한국어 개발 문서에서 더 자연스럽습니다. |
| loop fold (value) | 반복으로 값 누적 | `reduce()`처럼 루프를 돌며 누산기를 갱신해 값 하나를 만들어 내는 조합자를 가리킵니다. "폴드"는 음차이고 뜻이 바로 와닿지 않아, `fp64.md`에서 이미 쓴 "누적하다"에 맞춰 풀어 옮겼습니다. |
| hand-written (raw) statement | 손으로 직접 쓴 raw 문 | `rawStmt`/`b.raw`로 끼워 넣는, DSL을 거치지 않고 타깃 코드에 그대로 나가는 문장. "raw"는 코드 이름 `rawStmt`와 짝을 맞추기 위해 로마자로 남겨 둡니다. |
| node (IR) | 노드 | `fn` 본문에서 만드는, 연산과 피연산자를 기록한 작은 타입 객체 하나. 그래프(IR)를 이루는 단위이며, 값을 지정하는 타입 토큰과 구분됩니다. |
| type token | 타입 토큰 | 이름이 항상 `T`로 끝나는, 선언 자리에 타입을 지정하는 값(`vec2fT` 등). 값 자체를 만드는 노드와 구분하기 위해 "토큰"을 그대로 씁니다. |
| stage | 스테이지 | 버텍스 스테이지, 프래그먼트 스테이지, 컴퓨트 스테이지처럼 파이프라인이 실행하는 한 단계. 이미 표준 용어인 버텍스·프래그먼트 뒤에 자연스럽게 붙는 음차를 골랐습니다. |
| invocation | 호출 | GPU가 버텍스 하나, 프래그먼트 하나, 컴퓨트 작업 항목 하나마다 셰이더를 한 번 실행하는 단위("once per vertex, per fragment or per compute invocation"이 entry point를 정의하는 문장). 함수 "호출"과 낱말은 같지만 문맥으로 구분됩니다. |
| attribute (stage) | 속성 | `builtin`/`location`으로 표시하는, 하드웨어와 값을 주고받는 방식을 나타내는 표시. "버텍스 속성", "스테이지 속성"처럼 그래픽스 문서에서 이미 쓰는 말입니다. |
| binding | 바인딩 | 유니폼 블록, 스토리지 버퍼, 텍스처, 샘플러처럼 바인드 그룹의 한 슬롯에 오르는 선언 하나. 여러 바인딩을 아우르는 "리소스 바인딩"(표준 용어)이 가리키는 개별 대상입니다. |
| field | 필드 | 구조체나 유니폼 블록 선언 안의 개별 항목. std140/std430 레이아웃에서 필드마다 갖는 offset·align·size를 가리킬 때도 그대로 씁니다. |
| host | 호스트 | 셰이더를 실행하고 바인드 그룹, 텍스처, 디바이스 같은 자원을 실제로 준비하는 애플리케이션 쪽 코드. 이미 한국어 그래픽스 문서에서 굳어진 말입니다. |
| booted device | 부팅된 디바이스 | `requestDevice` 등으로 이미 만들어지고 기능이 확정된 뒤의 GPU 디바이스. "부팅"은 §10(activation-authority rule)에서 "활성화"와 짝지어 쓰는 시점 표현을 그대로 이어받았습니다. |
| host feature | 호스트 기능 | 파이프라인을 만들기 전에 호스트가 미리 켜 둬야 하는 절반(`requiredFeatures`, `gl.getExtension` 등). "소스 지시문"과 대비되는 개념입니다. |
| source directive | 소스 지시문 | `enable …;`나 `#extension …`처럼 생성된 셰이더 코드 자체에 들어가야 하는 절반. "지시문"은 전처리기 지시문 등에 이미 쓰는 말입니다. |
| module fragment | 모듈 조각 | `emitFragment`/`emitGlslFragment`가 돌려주는, 버전 헤더나 진입점 없이 선언과 헬퍼만 담은 프로그램의 일부. 표준 용어인 셰이더 스테이지의 "프래그먼트"와는 다른 개념이라 "조각"을 붙여 구분합니다. |
| metadata (pipeline) | 메타데이터 | `reflect()`가 돌려주는, 바인드 그룹·레이아웃·진입점 서명처럼 호스트가 파이프라인을 만들 때 필요한 데이터. 한국어 개발 문서에서 이미 굳어진 음차입니다. |
| ship-time | 배포 시점 | `mangle`·`minify`·`obfuscate`처럼 실제로 내보낼 셰이더 텍스트에 적용하는 시점. 이미 정한 "emit-time"(생성 시점)과 짝을 이루는 또 다른 시점이라 구분해 옮겼습니다. |
| driver log | 드라이버 로그 | GPU 드라이버가 컴파일 오류 등에 대해 돌려주는 원문 메시지. `decodeShaderLog`가 되돌리는 대상입니다. |
| decode (driver log) | 디코딩 | `mangle`이 바꾼 이름을 드라이버 로그 안에서 다시 작성 시점 이름으로 되돌리는 것. 이미 한국어 개발 문서에서 쓰는 음차입니다. |
| statement form | 문 형태 | `If`·`Loop`처럼 본문에 코드를 쌓아 올리고 값을 돌려주지 않는 형태. 이미 고정한 "raw 문"의 "문"과 짝을 맞췄습니다. |
| spelling (raw statement) | 표기 | `rawStmt`/`b.raw`에 넘기는 `{ wgsl, glsl }` 페이로드에서, 타깃 하나에 해당하는 실제 텍스트 한 쪽. `production-emit.md`가 이름 표기에 쓴 "표기"를 그대로 이어받아, 같은 raw 문이 타깃마다 다른 문자열로 나가는 것을 가리킵니다. |
| value form | 값 형태 | `when`·`matchEnum`처럼 내부에서 같은 분기를 만들고 그 결과를 값으로 돌려주는 형태. statement form과 대비되는 개념입니다. |
| accumulator | 누산기 | `reduce`가 루프를 도는 동안 갱신해 나가는 값. 한국어 컴퓨터과학 문서에서 이미 쓰는 번역어입니다. |
| axis (variant) | 축 | `variantFamily`가 갈라지는 기준 하나(예: `quality: ['low', 'high']`). 여러 축이 모여 축 공간을 이룹니다. |
| call graph | 호출 그래프 | 어떤 함수가 어떤 함수를 부르는지를 나타내는 그래프. `inline`, `reachFrom`, `semanticDiff`가 다루는 대상입니다. |
| guard clause | 가드 절 | `ReturnIf`처럼 조건을 먼저 걸러 함수를 일찍 빠져나가게 하는 한 줄 구문. fp64의 "가드 텍스처"와는 다른 개념입니다. |
| ubershader | 우버셰이더 | 오버라이드 상수로 여러 변형을 한 소스에 담아 두고 드라이버가 파이프라인별로 가지치기하는 고전적인 기법의 이름. 그래픽스 문서에서 이미 음차로 굳어졌습니다. |
| varying | varying | 정점 스테이지와 프래그먼트 스테이지 사이를 보간되어 넘어가는 GLSL 값을 가리키는 스펙 용어. NEAREST·INCOMPLETE와 같은 성격의 GLSL 고유 이름이라 로마자 그대로 둡니다. |
| writer (backend) | 생성기 | 모듈을 건드려 WGSL/GLSL 텍스트를 만들어 내는 백엔드 쪽 구성 요소를 가리킵니다. "백엔드"(표준 용어) 자체가 아니라 그 백엔드가 실제로 생성 작업을 하는 부분을 가리킬 때 씁니다. |
| colour attachment | 색상 어태치먼트 | 텍스처를 렌더 패스의 출력 대상으로 붙이는 것. 한국어 WebGPU/그래픽스 문서에서 "어태치먼트"가 이미 음차로 쓰입니다. |
| framebuffer | 프레임버퍼 | WebGL의 FBO(Framebuffer Object)를 가리키는 한국어 그래픽스 용어. 약어 FBO 대신 풀어서 씁니다. |
| mangling | 맹글링 | `mangle()`이 식별자 이름을 base-52 짧은 이름으로 바꾸는 처리. C++ name mangling처럼 한국어 컴파일러 문서에서 이미 음차로 쓰는 말입니다. |
| helper (function) | 헬퍼 (함수) | 진입점이 호출하는, 진입점이 아닌 함수. 한국어 개발 문서에서 이미 "헬퍼 함수"로 굳어진 말입니다. |
| call site | 호출 지점 | 어떤 함수가 실제로 불리는 코드 위치 하나. "call graph"(호출 그래프)와 짝을 이룹니다. |
| forward prototype | 전방 선언 | GLSL에서 함수 정의보다 앞서 그 시그니처만 미리 적어 두는 선언. `prune()`이 다루는 대상이며, `production-emit.md`에서 이미 이렇게 옮겼습니다. |
| do-not-optimize flag | 최적화 금지 플래그 | f64 하향 변환이 자신이 끼워 넣는 에뮬레이션 라이브러리의 헬퍼에 찍어 두는 표시로, `inline()`의 `opaque` 옵션이 다루는 대상입니다. |
| bucket (semantic diff) | 버킷 | `semanticDiff`가 두 모듈의 차이를 담아 분류하는 그릇 하나. 한국어 개발 문서에서 분류 단위를 가리킬 때 이미 음차로 쓰는 말입니다. |
| parity gate | 패리티 게이트 | dev 모듈과 prod 모듈의 차이 가운데 선언한 파이프라인으로 설명되지 않는 나머지만 남았는지 검사하는 CI 게이트. |

## 로마자 그대로 쓰는 용어

SoT, IR, WGSL, GLSL, WebGPU, WebGL2, TypeScript, JavaScript, GPU, CPU, f32, f64, std140, IO는
번역하지 않고 로마자 그대로 씁니다. 이 가운데 SoT와 IR은 처음 등장하는 자리에서만 한국어로
뜻을 한 번 풀어준 뒤(예: "단일 진실 공급원(SoT)", "중간 표현(IR)") 이후에는 로마자만 씁니다.

## 영어로 두는 낱말

한국어 개발자가 동료에게 말할 때도 영어로 쓰는 낱말과, 코드의 옵션 값이나 키와 같은 낱말은
한국어 낱말로 바꾸지 않습니다. 첫 등장에서 한 번 짧게 풀고, 그 뒤로는 영어 그대로 씁니다.
셋째 칸의 대체어가 번역에 나오면 `bun run check:guide`가 실패합니다.

| 낱말 | 첫 등장에서 푸는 법 | 쓰지 않는 대체어 |
| --- | --- | --- |
| fail closed / fails closed | 드라이버가 거부할 소스를 내는 대신 컴파일 시점에 실패한다는 뜻을 한 번 적고, 그 뒤로는 "fail closed" | 차단형 실패, 닫힌 실패, 폐쇄 실패 |
| gather | 커널이 다른 위치의 값을 읽어 모으는 접근. "gather(읽기만 하는 접근)" | 수집 전용, 모으기 전용, 수집 접근 |
| scatter | 커널이 임의 위치에 쓰는 접근. "scatter 쓰기" | 흩어 쓰기, 산포 쓰기, 분산 쓰기 |
| ladder (`#if` ladder) | 조건이 줄줄이 이어진 분기. "`#if` ladder" 또는 "`#if` 체인" | 사다리꼴, 사다리 |
| tier | 커널이 속하는 지원 단계. 옵션 값이 있으면 그 값을 적는다: "`portable` 커널" | 수집 전용 등급, 커널 등급 |
| bare (a bare number) | 메서드가 없는 그냥 숫자. "그냥 숫자" | 벌거벗은, 맨 숫자 |
| `portable`, `loose`, `host`, `source` | 코드의 옵션 값과 키. 코드 스팬 그대로 두고, 옵션 값을 "이식 가능한"이나 "느슨한" 같은 한국어로 바꾸지 않는다. 산문에서 portable을 형용사로 쓰는 것(이식 가능한 셰이더)은 그대로 허용한다 | |
