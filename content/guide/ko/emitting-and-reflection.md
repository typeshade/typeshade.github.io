---
id: emitting-and-reflection
source: 6c82986946f2bac53c9cd7ac496872bc267216ec4f107bf3bc10d87a5a479a0e
sourceLine: 1210
---

이 페이지를 읽고 나면 모듈을 WGSL로, GLSL 스테이지 둘로, 또는 호스트가 자기 프로그램에
이어 붙이는 모듈 조각(module fragment)으로 바꿀 수 있고, 호스트가 바인딩할 때 참고하는
파이프라인 메타데이터도 읽을 수 있습니다.

생성(emit)은 모듈이 담고 있는 IR을 타깃 하나의 소스 텍스트로 바꾸는 과정입니다. 리플렉션은
같은 모듈을 반대편에서 본 것으로, 셰이더가 무엇을 기대하는지를 데이터로 기술합니다. 덕분에
버퍼를 할당하고 바인드 그룹을 만들고 버텍스 레이아웃을 정하는 코드가 같은 내용을 손으로
다시 적지 않고 모듈에서 바로 읽어 올 수 있습니다. 둘 다 IR을 읽기만 할 뿐 바꾸지 않으므로,
어느 쪽을 호출해도 넘긴 모듈은 그대로 남습니다.

### WGSL 생성

`emitModule(m)`은 모듈 전체를 WGSL 문자열 하나로 돌려줍니다. 모듈의 상수, 구조체, 바인딩,
함수가 모두 들어가고, 진입점마다 스테이지 속성이 붙습니다. 생성 전 검사를 먼저 돌리므로,
검증에 실패하는 모듈이나 타깃이 지원하지 않는 기능을 쓰는 모듈은 생성을 호출하는 시점에
오류 코드가 붙은 오류를 던집니다.

```ts
import { emitModule, emitModuleAt, emitIdentity } from 'typeshade'

const wgsl = emitModule(m)

// The same module at an explicit optimization level. 'O2' is what emitModule runs and is
// byte-identical to it; 'O0' is the lowered module with no optimizer pass.
const naive = emitModuleAt(m, 'O0')

// A one-line identity for one emit configuration, for a build to compare:
emitIdentity('wgsl') // 'wgsl;parens=full;fp64=float;plugins=-#069d5f95'
```

생성 결과는 모듈뿐 아니라 설정에도 달려 있습니다. 괄호 모드, f64 방식, 고정해 둔 오버라이드
값, 플러그인 체인이 모두 생성되는 바이트를 바꾸므로, 설정이 다른 두 파일을 나란히 놓으면
이유를 알 수 없는 diff가 나옵니다. `emitIdentity(target, opts)`는 그 설정을 사람이 읽을 수
있는 요약 한 줄과 그 다이제스트로 정리해 줍니다. 커밋하는 아티팩트 옆에 이 값을 적어 두고
빌드가 끝난 뒤 비교하십시오. 값이 같으면 두 파일을 같은 설정으로 만들었다는 뜻이고, 다르면
설정의 어느 항목이 바뀌었는지가 값에 드러납니다.

### GLSL ES 3.00 생성

WebGL2 프로그램은 따로 컴파일되는 셰이더 두 개로 이루어지므로, GLSL 백엔드는 호출 한 번에
스테이지 하나씩만 생성합니다. `emitGlslStages(m)`은 한 모듈의 두 스테이지를 한꺼번에
돌려주며, 두 스테이지에 공통인 하향 변환(lowering)은 한 번만 수행합니다.

```ts
import { emitGlslModule, emitGlslStages } from 'typeshade'

const { vertex, fragment } = emitGlslStages(m)

// One stage on its own, byte-identical to that member of the pair.
const fs = emitGlslModule(m, 'fragment')

// Omit the stage for the whole module in one string. It carries every entry point, so it
// is for reading and diffing and does not compile as a stage.
const whole = emitGlslModule(m)
```

문자열마다 `#version 300 es` 줄과 정밀도 프리앰블이 들어 있고, 선언은 그 스테이지가 실제로
쓰는 것만 담깁니다. 하향 변환은 결정적이라 두 스테이지가 공유하는 이름은 전부 같게 나오고,
그래서 둘을 링크할 수 있습니다. 한 스테이지 안에 진입점을 여러 개 담은 모듈이라면
`emitGlslStages`에 `vertexEntry`와 `fragmentEntry`도 넘길 수 있으며, 이름을 지정해도 하향
변환은 여전히 한 번입니다. GLSL 쪽 함수는 WGSL 생성 옵션에 GLSL 전용 옵션을 더해 받습니다.
전체 목록은 `GlslEmitOptions` 참고 문서에 있습니다.

### 모듈 조각

모듈 조각은 프로그램의 한 부분입니다. 버전 헤더 없이, 기본값으로는 진입점도 없이 선언과
헬퍼만 담은 것으로, 최종 프로그램은 호스트가 소유하고 우리 쪽 텍스트를 그 안에 붙여 넣는
경우에 씁니다. GLSL 코드베이스에서 `#include`를 쓰던 자리에는 모듈 조각을 쓰면 됩니다.
`emitGlslFragment(m, stage)`는 GLSL용 모듈 조각을, `emitFragment(m)`은 WGSL용 모듈 조각을
같은 모양으로 돌려줍니다.

```ts
import { emitFragment, emitGlslFragment } from 'typeshade'

const f = emitGlslFragment(m, 'fragment')

f.source // 'struct VsOut {\n  vec4 pos;\n …', the declarations and helpers
f.preamble // ['#version 300 es', 'precision highp float;', 'precision highp int;']
f.declares // { functions, structs, bindings, consts, overrides, entryPoints }
f.requires // [], the symbols this fragment calls and does not define

// Keep the entry points, and the WGSL twin:
const w = emitFragment(m, { entryPoints: true })
```

프리앰블은 문자열에 섞이지 않고 데이터로 돌아오므로, 조각 여러 개를 조합하는 쪽에서 그
줄들을 합치고 중복을 걸러 낼 수 있습니다. 빠지는 줄이 없으니 정규식으로 헤더를 걷어 낼
일도 없습니다. `declares`는 `source`가 무엇을 정의하는지 적은 목록이라 조합하는 쪽이 이어
붙이기 전에 이름 충돌을 확인할 수 있고, `requires`는 호스트 쪽 프리앰블이 채워 줘야 하는
이름을 나열합니다. 진입점은 따로 요청하지 않으면 조각에 들어가지 않지만,
`declares.entryPoints`에는 어느 경우든 이름이 올라갑니다. 조각에 들어가지 않아도 진입점이
스테이지 범위를 정하기 때문입니다. 조각이 어떤 헬퍼, 구조체, 바인딩을 담는지는 그
스테이지에 무엇이 필요한지로 정해집니다. 모듈 조각도 모듈 전체를 생성할 때와 같은 생성 전
검사를 거칩니다.

### reflect가 돌려주는 것

`reflect(m)`은 모듈을 타깃과 무관한 데이터로 기술합니다. 타깃과 무관하다는 말은 `reflect`가
백엔드 인자 없이 모듈만 받는다는 뜻이고, 그래서 리플렉션 하나로 그 모듈의 WGSL 생성 결과와
GLSL 생성 결과를 함께 설명할 수 있습니다.

```ts
import { reflect } from 'typeshade'

const r = reflect(m)

r.bindGroups // [{ group: 0, entries: [{ group: 0, binding: 0, name: 'U', space: 'uniform',
//                 resourceKind: 'uniform-buffer', owner: 'module',
//                 structName: 'Uniforms', stages: ['fragment'] }] }]
r.uniforms // [{ name: 'Uniforms', size: 32, align: 16, fields: [
//              { name: 'time', type: 'f32', offset: 0, align: 4, size: 4 }, … ] }]
r.storage // std430 layouts for a storage binding declared directly as a struct
r.vertex // { attributes: [{ name, location, type, offset }], arrayStride }
r.entries // [{ name: 'vs', stage: 'vertex', inputs: ['u32'], output: 'struct:VsOut', io }, …]
r.overrides // the pipeline constants a host supplies per variant
r.requiredFeatures // the capabilities a host must have active before it creates a pipeline
r.requires // host-provided globals the module references and does not declare
```

`uniforms`는 std140, `storage`는 std430 레이아웃입니다. 타깃이 유니폼 블록과 스토리지 버퍼에
각각 쓰는 바이트 레이아웃입니다. 둘 다 필드마다 오프셋, 정렬, 크기를 적고, 구조체 자체의
크기도 정렬 단위로 이미 올림한 값으로 담습니다. 그래서 그 크기를 그대로 구조체 배열의
스트라이드로 쓸 수 있습니다. `storageBuffer`로 선언한 바인딩은 넘긴 요소 타입의 배열이므로
`bindGroups`에는 나타나지만 `storage`에는 항목이 없습니다. 그 요소의 std430 스트라이드가
필요하거나, 모듈 없이 `structDecl` 핸들만 들고 있는 상태에서 레이아웃이 필요하면, 핸들의
`decl`에 `wgslLayout`을 호출하십시오.
[레이아웃과 리소스](/guide/authoring/layouts-and-resources/)에서 선언한 구조체라면
`wgslLayout(ShapeSegment.decl, 'std430')`처럼 씁니다. 버텍스 진입점이 `location` 매개변수를
하나도 받지 않는 모듈에서는 `vertex`가 `undefined`입니다.

### 리플렉션에서 바인딩하기

호스트는 `bindGroups`를 훑으며 항목마다 리소스를 하나씩 만듭니다. 무엇을 만들지는 필드
세 개를 보고 정합니다.

```ts
import { reachFrom, reflect, stageOf } from 'typeshade'

for (const group of reflect(m).bindGroups) {
  for (const e of group.entries) {
    if (e.owner === 'host') continue // the surrounding renderer allocates this one
    e.resourceKind // 'uniform-buffer' | 'storage-buffer' | 'texture' | 'sampler'
    e.stages // ['fragment'], ordered vertex, fragment, compute
  }
}

// The same reachability question for an entry set you choose yourself:
const reach = reachFrom(
  m,
  m.funcs.filter((f) => stageOf(f) === 'fragment'),
)
reach.bindings // Set { 'U' }, the binding names that stage reads
reach.fns // the call-graph closure from those entries, the entries included
```

`owner`는 리소스의 주인이 누구인지 나타냅니다. 모듈이 바인딩을 선언하고 호스트가 이
리플렉션을 보고 할당하면 `'module'`, 파이프라인을 소유한 호스트가 직접 선언하고 호스트 쪽
레이아웃이 기준이 되면 `'host'`입니다. 어느 쪽이든 목록에서 빠지는 바인딩은 없습니다.
호스트가 직접 소유한 바인딩이라도 그 자리를 알아야 하기 때문입니다. `resourceKind`는 무엇을
만들어야 하는지 나타냅니다. 텍스처 항목에는 `textureDim`과 `textureElem`도 들어 있는데, 뷰와
샘플 타입을 정할 때 필요한 두 값으로, 작성하는 쪽 설명은
[레이아웃과 리소스](/guide/authoring/layouts-and-resources/)에 있습니다. `stages`는 어떤
스테이지가 그 바인딩을 쓰는지 나타냅니다. WebGPU에서는 바인드 그룹 레이아웃 항목에 넣을
가시성 마스크가 되고, WebGL2에서는 호스트가 유니폼 블록 바인딩 포인트와 텍스처 유닛을
스테이지별로 배정할 때 쓰는 정보가 됩니다.

바인드 그룹에는 직접 선언한 바인딩뿐 아니라 하향 변환이 끼워 넣는 바인딩도 들어갑니다.
[fp64](/guide/authoring/fp64/) 하향 변환은 에뮬레이션 헬퍼가 가드 텍스처를 읽는 모듈에
`_fp64`라는 텍스처 바인딩을 추가합니다. 그 페이지가 설명하는 가드 텍스처가 바로 이것입니다.
이 리플렉션을 보고 바인딩하는 호스트는 그런 사정을 몰라도 이 바인딩을 다른 바인딩과
똑같이 바인딩하게 됩니다. 생성할 때 넘길 `fp64Flavor`를 `reflect`에도 똑같이 넘기십시오.
그래야 리플렉션이 실제로 실행될 프로그램을 기술합니다.
