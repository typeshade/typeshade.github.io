---
id: emitting-and-reflection
source: 9ee5a392833eca0692209ee0db2d05d77b5172d3a7d819223cafa256eb7e07db
sourceLine: 1083
---

이 페이지를 읽고 나면 모듈을 WGSL로, GLSL 두 스테이지로, 또는 호스트가 자신의 프로그램에
이어 붙이는 조각으로 바꿀 수 있고, 호스트가 바인딩의 근거로 삼는 파이프라인 메타데이터도
읽을 수 있습니다.

생성은 모듈이 담고 있는 IR을 한 타깃용 소스 텍스트로 바꾸는 과정입니다. 리플렉션은 같은
모듈의 다른 절반으로, 셰이더가 무엇을 요구하는지를 데이터로 기술합니다. 그래서 버퍼를
할당하고 바인드 그룹을 만들고 버텍스 레이아웃을 설정하는 코드는 이를 손으로 반복해 적는
대신 모듈에서 그대로 읽어 옵니다. 둘 다 IR을 읽기만 할 뿐 바꾸지 않으므로, 어느 쪽을
호출해도 넘긴 모듈은 그대로 남습니다.

### WGSL 생성

`emitModule(m)`은 전체 모듈을 WGSL 문자열 하나로 돌려줍니다. 모듈의 상수, 구조체, 바인딩,
함수가 모두 담기며, 각 진입점은 자신의 스테이지 속성을 지닙니다. 생성 전 검사를 먼저
실행하므로, 검증을 통과하지 못하는 모듈이나 타깃에 없는 기능이 필요한 모듈은 생성 호출
시점에 코드가 붙은 오류를 던집니다.

```ts
import { emitModule, emitModuleAt, emitIdentity } from '@xgis/shader-dsl'

const wgsl = emitModule(m)

// The same module at an explicit optimization level. 'O2' is what emitModule runs and is
// byte-identical to it; 'O0' is the lowered module with no optimizer pass.
const naive = emitModuleAt(m, 'O0')

// A one-line identity for one emit configuration, for a build to compare:
emitIdentity('wgsl') // 'wgsl;parens=full;fp64=float;plugins=-#069d5f95'
```

생성은 모듈만이 아니라 설정이기도 합니다. 괄호 모드, f64 방식, 고정한 오버라이드 값,
플러그인 체인이 모두 생성되는 바이트를 바꾸므로, 서로 다른 두 설정으로 만든 파일 두 개는
설명되지 않는 diff처럼 보입니다. `emitIdentity(target, opts)`는 이 설정을 읽을 수 있는
요약과 그 다이제스트로 압축합니다. 커밋하는 아티팩트 옆에 이를 적어 두고 빌드 뒤에
비교하십시오. 이 값이 같으면 같은 설정이 둘 다 만들었다는 뜻이고, 다르면 어느 축이
움직였는지를 알려 줍니다.

### GLSL ES 3.00 생성

WebGL2 프로그램은 따로 컴파일되는 셰이더 두 개로 이루어지므로, GLSL 백엔드는 호출 한 번에
스테이지 하나씩만 생성합니다. `emitGlslStages(m)`은 한 모듈의 두 스테이지를 모두 돌려주며,
공유되는 하향 변환 비용은 그 쌍 전체에서 한 번만 치릅니다.

```ts
import { emitGlslModule, emitGlslStages } from '@xgis/shader-dsl'

const { vertex, fragment } = emitGlslStages(m)

// One stage on its own, byte-identical to that member of the pair.
const fs = emitGlslModule(m, 'fragment')

// Omit the stage for the whole module in one string. It carries every entry point, so it
// is for reading and diffing and does not compile as a stage.
const whole = emitGlslModule(m)
```

각 문자열은 자기 자신의 `#version 300 es` 줄과 정밀도 프리앰블, 그리고 그 스테이지가 실제로
닿는 선언만을 담습니다. 하향 변환이 결정적이므로 두 스테이지는 공유하는 이름 전부에서
여전히 일치하고, 그래서 이 쌍은 링크됩니다. 한 스테이지 안에 진입점을 여러 개 담은
모듈이라면 `emitGlslStages`에 `vertexEntry`와 `fragmentEntry`도 넘길 수 있으며, 이렇게
이름을 지정해도 하향 변환은 한 번만 이루어집니다. GLSL 호출은 WGSL 생성 옵션에 자신만의
옵션을 더해 받으며, 그 목록은 `GlslEmitOptions` 참고 문서에 있습니다.

### 모듈 조각

모듈 조각은 프로그램의 한 부분입니다. 버전 헤더가 없고 기본적으로 진입점도 없는 선언과
헬퍼 모음으로, 최종 프로그램을 소유하고 우리가 생성한 텍스트를 그 안에 붙여 넣는 호스트를
위한 것입니다. GLSL 코드베이스라면 `#include`를 쓸 자리에 대신 손을 뻗는 대상이 바로
이것입니다. `emitGlslFragment(m, stage)`는 GLSL용 모듈 조각을, `emitFragment(m)`은 WGSL용
모듈 조각을 같은 모양으로 돌려줍니다.

```ts
import { emitFragment, emitGlslFragment } from '@xgis/shader-dsl'

const f = emitGlslFragment(m, 'fragment')

f.source // 'struct VsOut {\n  vec4 pos;\n …', the declarations and helpers
f.preamble // ['#version 300 es', 'precision highp float;', 'precision highp int;']
f.declares // { functions, structs, bindings, consts, overrides, entryPoints }
f.requires // [], the symbols this fragment calls and does not define

// Keep the entry points, and the WGSL twin:
const w = emitFragment(m, { entryPoints: true })
```

프리앰블이 데이터 형태로 돌아오므로, 여러 모듈 조각을 조합하는 쪽에서 그 줄들을 하나로
합치고 중복을 제거할 수 있습니다. 아무것도 버려지지 않으므로 정규식으로 헤더를 걷어 낼
필요가 없습니다. `declares`는 `source`가 정의하는 것의 목록이라, 이어 붙이기 전에 이름이
충돌하는지 조합하는 쪽에서 미리 확인할 수 있고, `requires`는 호스트 자신의 프리앰블이
채워 줘야 하는 이름을 나열합니다. 진입점은 요청하지 않는 한 조각에서 빠지지만, 어느
쪽이든 `declares.entryPoints`에는 담깁니다. 진입점이 여전히 스테이지 범위를 정하기
때문입니다. 그 조각이 어떤 헬퍼, 구조체, 바인딩을 담는지는 그 스테이지가 무엇을
필요로 하는지에 달려 있습니다. 모듈 조각도 모듈 전체를 생성할 때와 같은 생성 전 검사를
거칩니다.

### reflect가 돌려주는 것

`reflect(m)`은 모듈을 타깃에 상관없는 데이터로 기술합니다. 타깃에 상관없다는 말은
`reflect`가 백엔드 인자 없이 모듈만 받는다는 뜻으로, 그래서 리플렉션 하나가 그 모듈의
WGSL 생성과 GLSL 생성을 한꺼번에 기술합니다.

```ts
import { reflect } from '@xgis/shader-dsl'

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

`uniforms`는 std140을, `storage`는 std430을 씁니다. 이 둘은 타깃이 각각 유니폼 블록과
스토리지 버퍼에 쓰는 바이트 레이아웃입니다. 이 둘은 각각 필드마다 오프셋, 정렬, 크기를
담고, 이미 자신의 정렬 단위로 올림한 구조체 자체의 크기도 함께 담습니다. 그래서 이 크기는
그 구조체 배열의 스트라이드이기도 합니다. `storageBuffer`로 선언한 바인딩은 넘긴 요소
타입의 배열이므로 `bindGroups`에는 나타나지만 `storage`에는 항목이 없습니다. 그 요소의
std430 스트라이드를 구하려면, 또는 모듈 없이 혼자 들고 있는 `structDecl` 핸들의 레이아웃을
구하려면, [레이아웃과 리소스](/guide/authoring/layouts-and-resources/)가 선언하는 구조체를
예로 든 `wgslLayout(ShapeSegment.decl, 'std430')`처럼 핸들의 `decl`에 `wgslLayout`을
호출하십시오. 버텍스 진입점이 `location` 매개변수를 하나도 받지 않는 모듈에서는 `vertex`가
`undefined`입니다.

### 리플렉션에서 바인딩하기

호스트는 `bindGroups`를 훑으며 항목마다 리소스를 하나씩 만듭니다. 그 판단은 필드
세 개에 담깁니다.

```ts
import { reachFrom, reflect, stageOf } from '@xgis/shader-dsl'

for (const group of reflect(m).bindGroups) {
  for (const e of group.entries) {
    if (e.owner === 'host') continue // the surrounding renderer allocates this one
    e.resourceKind // 'uniform-buffer' | 'storage-buffer' | 'texture' | 'sampler'
    e.stages // ['fragment'], ordered vertex, fragment, compute
  }
}

// The same reachability question for an entry set you choose yourself:
const reach = reachFrom(m, m.funcs.filter((f) => stageOf(f) === 'fragment'))
reach.bindings // Set { 'U' }, the binding names that stage reads
reach.fns // the call-graph closure from those entries, the entries included
```

`owner`는 그 리소스를 누가 소유하는지 나타냅니다. 모듈이 바인딩을 선언하고 호스트가 이
리플렉션을 바탕으로 그것을 할당하면 `'module'`이고, 파이프라인을 소유한 호스트가 그것을
선언하고 그 레이아웃의 근거가 되면 `'host'`입니다. 어느 쪽이든 목록은 완전한 채로 남습니다. 호스트는
자신이 소유한 바인딩에 대해서도 여전히 알아야 하기 때문입니다. `resourceKind`는 무엇을
만들어야 하는지 나타내고, 텍스처 항목은 뷰와 샘플 타입에 필요한 두 축인 `textureDim`과
`textureElem`도 함께 지니는데, 이는 [레이아웃과 리소스](/guide/authoring/layouts-and-resources/)가
작성하는 쪽에서 다룹니다. `stages`는 어떤 스테이지가 그 바인딩에 닿는지를 나타내며, 이는
WebGPU 바인드 그룹 레이아웃 항목이 요구하는 가시성 마스크이자 WebGL2 호스트가 유니폼 블록
포인트와 텍스처 유닛에 대해 스테이지별로 하는 배정이기도 합니다.

바인드 그룹에는 직접 선언한 바인딩뿐 아니라 하향 변환이 끼워 넣는 바인딩도 들어갑니다.
[fp64](/guide/authoring/fp64/) 하향 변환은 에뮬레이션 헬퍼가 그 텍스처를 읽는 모듈에 `_fp64`라는
이름의 텍스처 바인딩을, 즉 그 페이지가 설명하는 가드 텍스처를 추가하는데, 이 리플렉션을
바탕으로 바인딩하는 호스트는 그런 사실을 모른 채로도 그것을 바인딩하게 됩니다. 생성 시점에 넘길 것과 같은 `fp64Flavor`를 `reflect`에도
넘겨서, 리플렉션이 실제로 실행될 프로그램을 기술하도록 해야 합니다.
