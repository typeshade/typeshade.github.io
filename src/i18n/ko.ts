// Korean copy. Typed against the English source, so a string that exists in one and not
// the other is a build error. Numbers come from the build, as in en.ts.
import type { Copy } from './index.ts'
import { exampleFile, facts, hero } from '../lib/examples.ts'
import { typedError } from '../lib/typed-error.ts'

const glsl = facts.glslTarget
const err = typedError()
const std = facts.layoutStandards[0]
const split = facts.splitLabels ?? ['f32', 'f64']

export const ko: Copy = {
  lang: 'ko',
  name: '한국어',
  skip: '본문으로 건너뛰기',

  meta: {
    title: 'TypeShade: WebGPU와 WebGL2를 위한 TypeScript 셰이더',
    description: `TypeScript로 셰이더를 한 번 쓰면 WebGPU용 WGSL과 WebGL2용 ${glsl}이 나옵니다. 같은 모듈이 CPU에서 f64로 실행되어 출력을 대조할 수 있습니다.`,
    ogAlt: 'TypeShade: WebGPU와 WebGL2를 위한 하나의 셰이더 소스. 렌더링된 metaballs 셰이더.',
  },

  nav: {
    motivation: '동기',
    checks: '검증',
    examples: '예제',
    guide: '작성 가이드',
    github: 'GitHub',
    llms: 'llms.txt',
    languages: '언어',
  },
  footer: { builtFrom: '빌드 기준 커밋' },

  canvas: {
    aria: (title: string) => ({
      webgpu: `TypeScript로 쓰고 TypeShade가 WGSL로 컴파일한 ${title} 셰이더. WebGPU에서 실행 중.`,
      webgl2: `TypeScript로 쓰고 TypeShade가 ${glsl}로 컴파일한 ${title} 셰이더. WebGL2에서 실행 중.`,
      'still-webgpu': `TypeScript로 쓰고 TypeShade가 WGSL로 컴파일한 ${title} 셰이더. WebGPU에서 한 프레임을 그림.`,
      'still-webgl2': `TypeScript로 쓰고 TypeShade가 ${glsl}로 컴파일한 ${title} 셰이더. WebGL2에서 한 프레임을 그림.`,
      none: `TypeScript로 쓰고 TypeShade가 컴파일한 ${title} 셰이더. 빌드 시점에 렌더링됨.`,
    }),
  },

  install: { label: '서브모듈 명령' },
  diagnostic: {
    frameLabel: '필드 이름을 잘못 쓴 셰이더, typed-error-shader.ts',
    error: (code: number, line: number, column: number) => `오류 TS${code}, ${line}행 ${column}열:`,
    truncated: '(긴 메시지의 첫 줄)',
  },
  layout: {
    region: `reflect()가 복원한 ${std} 레이아웃`,
    caption: (size: number) => `reflect(), ${std}, ${size}바이트`,
    field: '필드',
    type: '타입',
    offset: '오프셋',
    size: '크기',
  },
  codeLabels: {
    authored: `작성한 프래그먼트, ${hero.file}`,
    wgsl: '출력된 WGSL 프래그먼트 진입점',
    glsl: `출력된 ${glsl} 프래그먼트 main`,
    print: '예제의 출력을 인쇄하는 명령',
  },

  front: {
    intro1: `TypeShade는 셰이더를 쓰기 위한 TypeScript 라이브러리입니다. 타입이 붙은 모듈 하나에서 WebGPU용 WGSL과 WebGL2용 ${glsl}이 나오고, 같은 모듈이 CPU에서 배정밀도로 실행되므로 컴파일러의 출력을 그 결과와 대조해 확인할 수 있습니다.`,
    intro2: `저장소의 예제 ${facts.examples}개 중 ${facts.bothTargets}개가 한 소스에서 두 출력을 모두 냅니다. 런타임 의존성 ${facts.runtimeDeps}개, 테스트 파일 ${facts.testFiles}개, ${facts.license} 라이선스입니다. ${facts.nextVersion} 버전은 아직 npm에 없습니다. 저장소 자체가 패키지이고, git 서브모듈로 사용합니다.`,
    metaballs: {
      neutral: `Metaballs, examples/${exampleFile('metaballs')}에서. 정지 화면은 빌드 시점에 캡처한 것입니다.`,
      webgpu: 'Metaballs. WGSL 출력이 WebGPU에서 이 프레임을 그리고 있습니다.',
      webgl2: `Metaballs. ${glsl} 출력이 WebGL2에서 이 프레임을 그리고 있습니다.`,
      none: 'Metaballs. 빌드 시점에 렌더링한 화면입니다. 이 브라우저에는 WebGPU도 WebGL2도 없습니다.',
      reduced: `Metaballs, WGSL과 ${glsl}로 컴파일됨. 시스템이 움직임 줄이기를 요청해서 한 프레임만 그렸습니다.`,
    },
    quickStart: {
      h: '빠른 시작',
      p1: `패키지는 TypeScript 소스를 그대로 담고 있으므로, 빌드에 TypeScript를 컴파일하는 도구가 필요합니다. 아래는 gradient 예제의 프래그먼트 단계로, \`${hero.file}\`에 쓰인 그대로 ${hero.authoredLines}줄입니다.`,
      p2: '여기서 이 WGSL 진입점이 나옵니다.',
      p3: `같은 함수의 ${glsl} 단계와, [reflect()](reflectApi)가 복원하는 유니폼 레이아웃은 [예제 페이지](examples)에 있습니다. 나머지 API는 [작성 가이드](guide)에서 다룹니다.`,
    },
    does: {
      h: '하는 일',
      items: [
        '타입이 붙은 함수, 진입점, 제어 흐름, 그리고 유니폼 블록, 스토리지 버퍼, IO 구조체, 텍스처, 샘플러 선언.',
        '유니폼 필드 이름을 잘못 쓰거나 반환 타입이 틀리면 편집기에서 TypeScript 오류가 납니다.',
        `\`reflect()\`: 바인드 그룹, ${facts.layoutStandards.join('과 ')} 레이아웃, 진입점 시그니처를 같은 중간 표현에서 읽어 냅니다.`,
        'f32와 같은 문법으로 쓰는 에뮬레이션 배정밀도.',
        'IR 위의 최적화 패스: 공통 부분식 제거, 죽은 코드 제거, 루프 불변식 끌어올리기, 상수 접기.',
        'CPU 오라클: 모듈을 f64 JavaScript 함수로 컴파일한 것으로, 테스트가 사용합니다.',
        '코드가 붙은 진단, 한 모듈을 N가지로 특수화해 출력하는 `variantFamily`, 출력 변경을 검토하는 `semanticDiff`.',
      ],
      note: 'TypeShade에는 렌더러가 없습니다. 문자열과 리플렉션 메타데이터를 돌려줄 뿐이고, 파이프라인 생성, 바인딩, 드로우 호출은 호스트의 몫입니다.',
    },
    more: {
      h: '더 읽기',
      items: [
        '[동기](motivation): 두 셰이더 언어에 소스 하나를 쓰는 이유.',
        '[검증](checks): CPU 오라클, Tint와 WebGL2에서 도는 컴파일 게이트, 골든 파일.',
        `[예제](examples): 예제 ${facts.examples}개, GLSL 출력, 에뮬레이션 배정밀도 데모.`,
        '[작성 가이드](guide)와 [README](docs), GitHub에서.',
      ],
    },
    status: {
      h: '상태',
      p: `정식 출시 전입니다. 저장소는 ${facts.mirrorVersion} 버전이고, npm 이름 [typeshade](npm)는 ${facts.nextVersion} 출시를 위해 예약되어 있으며 매니페스트와 import 이름은 그 태그에서 바뀝니다. 이슈는 환영합니다. 변경은 아직 업스트림에 먼저 들어가고 이 트리는 거기서 fast-forward되므로, 풀 리퀘스트는 아직 머지할 수 없습니다. ${facts.nextVersion} 소식을 받으려면 [릴리스를 구독](releases)하세요.`,
    },
  },

  motivation: {
    title: 'WebGPU와 WebGL2에 셰이더 소스 하나를 쓰는 이유, TypeShade',
    description: `TypeShade가 타입 있는 TypeScript 모듈 하나에서 WGSL과 ${glsl}을 내는 이유. 셰이더 언어 두 개를 유지하는 비용과 Khronos 설문 수치.`,
    h1: '동기',
    paragraphs: [
      'WebGL2와 WebGPU 양쪽에서 돌아야 하는 셰이더는 두 번 존재합니다. 두 언어는 타입, 진입점, 리소스 바인딩, 정밀도에서 서로 다르므로 두 번째 사본은 다시 쓰는 일입니다. 한쪽에만 들어간 수정은 다른 경로를 타는 기기에서만 드러나고, 리뷰어는 두 방언을 읽으면서 둘이 여전히 같은 뜻인지 판단해야 합니다.',
      '웹은 지금 그런 이동의 한가운데에 있습니다. [MapLibre 그래픽 현대화 로드맵](maplibreRoadmap), [deck.gl WebGPU 가이드](deckglWebgpu), [PixiJS v8 마이그레이션 가이드](pixijsMigration)는 모두 기존 WebGL 경로 옆에 WebGPU 경로가 생기는 과정을 설명합니다. GLSL로 쓴 커스텀 레이어에는 WGSL 사본이 필요해집니다.',
      `[${facts.survey.title}](survey)에서는 응답한 셰이더 개발자 ${facts.survey.n}명 이상 가운데 ${facts.survey.figure64}%가 플랫폼, API, 도구를 넘나들며 셰이더를 옮기고 있고, ${facts.survey.figure10}% 가까이가 그것을 상당한 또는 가장 큰 엔지니어링 비용으로 꼽았습니다.`,
      'TypeShade는 소스를 하나로 유지합니다. 모듈이 타입 있는 TypeScript이므로 잘못 쓴 필드나 틀린 반환 타입은 편집기에서 잡히고, 중간 표현 하나가 두 언어를 모두 내며, 같은 모듈이 CPU에서 배정밀도로 실행되므로 백엔드의 출력을 같은 소스에서 계산한 기준값과 대조할 수 있습니다. 푸시마다 무엇이 실행되는지는 [검증 페이지](checks)에 있습니다.',
      '하지 않는 일: TypeShade에는 렌더러도 씬 그래프도 없습니다. 문자열과 리플렉션 메타데이터를 돌려줄 뿐이고, 파이프라인 생성, 리소스 바인딩, 드로우 호출은 호스트의 몫입니다. SPIR-V, MSL, HLSL은 WGSL을 naga나 Tint에 넣어 얻습니다. 네이티브 호스트는 모두 Dawn이나 wgpu를 통해 이미 WGSL을 받기 때문입니다.',
    ],
  },

  checks: {
    title: 'TypeShade 검증: CPU 오라클, 컴파일 게이트, 골든 파일',
    description: 'TypeShade의 CI가 푸시마다 실행하는 것: f64 CPU 오라클, Tint와 실제 WebGL2 컨텍스트에서 도는 컴파일 게이트, 출력마다의 골든 파일.',
    h1: '검증',
    intro: '저장소의 CI는 푸시와 풀 리퀘스트마다 [CI 워크플로](ciGates)에서 다음을 실행합니다.',
    items: [
      '같은 모듈이 f64 산술로 도는 CPU 함수로 컴파일됩니다. 기본 모드에서는 동등 비교만 먼저 f32로 반올림해서 GPU와 일치시키고, 연산마다 반올림하는 f32 모드는 선택 사항입니다. 테스트는 이 함수를 알려진 답과, 그리고 생성된 JavaScript라는 두 번째 CPU 백엔드와 대조하며 둘은 비트 단위로 같아야 합니다. 드라이버의 반올림에 대해서는 아무것도 말해 주지 않고, 이 저장소에서 GPU 출력을 여기에 대조하지는 않습니다. [src/core/oracle.ts](oracle)',
      `컴파일 게이트는 등록된 예제를 전부 출력해서 WGSL은 헤드리스 Chromium 안의 Tint에 넘기고, 렌더링 가능한 예제의 ${glsl} 두 단계는 실제 WebGL2 컨텍스트에서 컴파일하고 링크합니다. 각 컴파일러에 컴파일될 수 없는 셰이더도 하나씩 넘깁니다. 어느 쪽이든 그것을 받아들이면 게이트는 실패하고 예제에 대한 판정은 무효가 됩니다. [scripts/compile-gate.ts](compileGate)`,
      '골든 파일은 모든 예제의 출력 바이트를 담고 있어서, 백엔드가 조금이라도 바뀌면 리뷰에서 diff로 드러납니다. [emit-goldens.test.ts](goldens)',
    ],
    pairIntro: '첫 페이지의 gradient 패스를 각 백엔드에서 한 번씩 그린 것입니다. 두 백엔드 사이의 픽셀 비교는 아직 커밋되어 있지 않습니다.',
    gpuFrame: {
      neutral: 'WGSL 출력. 빌드 시점에 WebGPU에서 그림.',
      webgpu: 'WGSL 출력. 지금 WebGPU에서 그림.',
      webgl2: `여기서는 WebGPU를 쓸 수 없어서 ${glsl} 출력이 WebGL2에서 이 프레임을 그렸습니다.`,
      none: 'WGSL 출력. 빌드 시점에 WebGPU에서 그림. 이 브라우저에는 WebGPU도 WebGL2도 없습니다.',
    },
    glFrame: {
      neutral: `${glsl} 출력. 빌드 시점에 WebGL2에서 그림.`,
      webgpu: 'WGSL 출력. 지금 WebGPU에서 그림.',
      webgl2: `${glsl} 출력. 지금 WebGL2에서 그림.`,
      none: `${glsl} 출력. 빌드 시점에 WebGL2에서 그림. 이 브라우저에는 WebGPU도 WebGL2도 없습니다.`,
    },
    authorTime: {
      h: '작성 시점에',
      p: '유니폼 블록은 한 번 선언되고, 모든 필드 읽기는 그 선언에 대해 타입 검사를 받습니다. 하나만 잘못 써도 문자열이 GPU에 닿기 전에 편집기에서 TypeScript가 알려 줍니다.',
      caption: `${err.wrongLine}행의 잘못된 읽기, 그것이 만드는 진단, 그리고 읽는 블록에 대해 [reflect()](reflectApi)가 복원한 ${std} 레이아웃: 필드 ${err.layout.fields.length}개, ${err.layout.size}바이트. 첫 필드 뒤의 빈 공간은 정렬입니다.`,
    },
  },

  examples: {
    title: `TypeShade 예제 ${facts.examples}개, GLSL 출력, 에뮬레이션 f64`,
    description: `TypeShade 예제 ${facts.examples}개와 출력을 인쇄하는 명령, gradient 패스의 ${glsl} 출력, 에뮬레이션 배정밀도의 딥 줌 데모.`,
    h1: '예제',
    intro: `저장소에는 실행 가능한 예제가 ${facts.examples}개 있습니다. 지도 관련 패스, ShaderToy 시절의 화면 공간 효과, 에뮬레이션 배정밀도 계열, 컴퓨트 커널 하나를 다룹니다. 그중 ${facts.bothTargets}개가 한 소스에서 WGSL과 ${glsl}을 모두 냅니다. 컴퓨트 커널은 ${glsl}로 낼 버텍스나 프래그먼트 단계가 없어서 WGSL과 리플렉션만 내고, WebGL2 경로는 선택형 에뮬레이션입니다. ${facts.fp64Examples}개가 에뮬레이션 배정밀도를 씁니다. 렌더링 가능한 예제는 [examples/index.ts](examplesIndex)에서 export되며, [예제 디렉터리](examplesDir)에서 둘러볼 수 있습니다.`,
    printIntro: '아래 첫 번째 명령은 모든 예제의 WGSL, GLSL, 리플렉션을 인쇄하고, 두 번째는 id로 하나만 인쇄합니다.',
    glsl: {
      h: `${glsl}로 본 gradient 패스`,
      p1: `첫 페이지는 \`${hero.file}\`의 프래그먼트 단계와 거기서 나오는 WGSL 진입점을 보여 줍니다. 같은 함수에서 이 ${glsl} \`main\`이 나옵니다.`,
      p2: `모듈 전체는 WGSL ${hero.emit.wgslLines}줄이고, GLSL 버텍스 단계는 ${hero.emit.glslVertexLines}줄, 프래그먼트 단계는 ${hero.emit.glslFragmentLines}줄입니다. 유니폼 타입, 바이트 오프셋, 바인드 그룹 항목, 진입점 시그니처는 [reflect()](reflectApi)에서 나옵니다. reflect()는 같은 중간 표현을 읽되 출력 경로에는 관여하지 않으므로, 호스트는 그 레이아웃대로 유니폼 버퍼를 채울 수 있습니다. [검증 페이지](checks)에는 유니폼 블록의 복원된 레이아웃이 잘못 쓴 필드의 진단과 나란히 있습니다.`,
    },
    f64: {
      h: '에뮬레이션 배정밀도',
      p1: `WGSL에도 ${glsl}에도 배정밀도 부동소수점은 없습니다. TypeShade는 이를 f32 값 두 개의 미평가 쌍으로 에뮬레이션하고, 산술, 비교, 일부 내장 함수를 그 쌍에 대한 호출로 낮춥니다. 그 범위 밖의 연산은 출력 시점에 코드가 붙은 오류로 실패합니다. 쓰는 코드는 그대로이고 선언한 타입만 다릅니다. deep-zoom 예제에서 \`${facts.deepZoomOrigin.name}\` 필드는 소스에서 \`${facts.deepZoomOrigin.sourceType}\`로 선언되고 유니폼 블록에서는 \`${facts.deepZoomOrigin.layoutType}\` 자리를 차지하며, 호스트가 그 자리를 분리된 쌍으로 채웁니다.`,
      p2: 'f64 산술을 하는 모듈에는 호스트가 흰색 텍셀 하나로 채워야 하는 가드 텍스처 바인딩도 주입됩니다. 뒤단의 셰이더 컴파일러는 텍셀 읽기를 상수로 접을 수 없고, 그것이 없으면 오차 보정 항을 자유롭게 최적화해 없앨 수 있기 때문입니다. 연산마다 f32의 몇 배 비용이 들므로 이 타입은 값 단위로 선택해서 씁니다. 예제는 [fp64-deep-zoom.ts](deepZoom)입니다.',
      caption: `같은 월드 좌표를 두 번 그린 것입니다. 왼쪽은 ${split[0]}, 오른쪽은 ${split[1]}입니다. ${split[0]} 쪽은 이 거리에서 ${split[0]}의 1 ulp가 줄무늬에 필요한 소수 부분보다 거칠어서 줄무늬가 계단으로 나오고, 다른 쪽은 매끄럽게 나옵니다.`,
      captionNone: '빌드 시점에 렌더링한 화면입니다. 이 브라우저에는 WebGPU도 WebGL2도 없습니다.',
    },
  },

  notFound: {
    title: '페이지를 찾을 수 없음, TypeShade',
    description: 'typeshade.dev의 이 주소에는 아무것도 없습니다.',
    h1: '이 주소에는 아무것도 없습니다.',
    p: '페이지가 옮겨졌을 수 있습니다. 첫 페이지와 작성 가이드는 그대로 있습니다.',
    links: '[첫 페이지로 가기](home), 또는 [작성 가이드](guide) 읽기.',
  },
}
