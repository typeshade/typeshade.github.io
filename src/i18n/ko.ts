// Korean copy. Typed against the English source, so a string that exists in one and not
// the other is a build error. Numbers come from the build, as in en.ts. scripts/check-copy.ts
// compares every string with its English one: the same numerals, links and code, no
// translation tells, and no label wider than the English label it replaces.
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
    guide: '가이드',
    examples: '예제',
    github: 'GitHub',
    llms: 'llms.txt',
    languages: '언어',
    theme: '다크 모드 전환',
    menu: '메뉴',
  },
  docs: {
    introduction: '소개',
    authoring: '작성',
    reference: '참고',
    why: '왜 TypeShade인가',
    quickStart: '빠른 시작',
    authoringGuide: '작성 가이드',
    checks: '검증 방식',
    examples: '예제',
    onThisPage: '이 페이지에서',
    previous: '이전',
    next: '다음',
  },
  footer: {
    docs: '문서',
    project: '프로젝트',
    languages: '언어',
    readme: 'README',
    releases: '릴리스',
    npm: 'npm 패키지',
    license: '[MIT 라이선스](license)로 배포합니다.',
    copyright: `Copyright © ${facts.year} ${facts.author}`,
    builtFrom: '빌드한 커밋',
  },

  canvas: {
    aria: (title: string) => ({
      webgpu: `TypeScript로 쓰고 TypeShade가 WGSL로 컴파일한 ${title} 셰이더. WebGPU에서 실행 중.`,
      webgl2: `TypeScript로 쓰고 TypeShade가 ${glsl}로 컴파일한 ${title} 셰이더. WebGL2에서 실행 중.`,
      'still-webgpu': `TypeScript로 쓰고 TypeShade가 WGSL로 컴파일한 ${title} 셰이더. WebGPU에서 한 프레임을 그림.`,
      'still-webgl2': `TypeScript로 쓰고 TypeShade가 ${glsl}로 컴파일한 ${title} 셰이더. WebGL2에서 한 프레임을 그림.`,
      none: `TypeScript로 쓰고 TypeShade가 컴파일한 ${title} 셰이더. 빌드할 때 렌더링함.`,
    }),
  },

  install: { label: '서브모듈 추가 명령' },
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
    wgsl: 'WGSL로 나온 프래그먼트 진입점',
    glsl: `${glsl}로 나온 프래그먼트 main`,
    print: '예제의 출력을 인쇄하는 명령',
  },

  front: {
    hero: {
      before: 'WebGPU와 WebGL2를 위한',
      accent: '타입 있는 셰이더',
      after: '',
      tagline: `셰이더를 한 번 쓰면 WGSL과 ${glsl}이 나오는 TypeScript 라이브러리입니다. 같은 모듈을 CPU에서 배정밀도로 돌릴 수 있어서, 컴파일러가 낸 결과를 그 값과 맞춰 볼 수 있습니다.`,
      getStarted: '시작하기',
      why: '왜 TypeShade인가',
      examples: '예제',
    },
    metaballs: {
      neutral: `examples/${exampleFile('metaballs')}의 Metaballs. 정지 화면은 빌드할 때 찍은 것입니다.`,
      webgpu: 'Metaballs. WGSL 출력이 WebGPU에서 이 프레임을 그리고 있습니다.',
      webgl2: `Metaballs. ${glsl} 출력이 WebGL2에서 이 프레임을 그리고 있습니다.`,
      none: 'Metaballs. 빌드할 때 렌더링한 화면입니다. 이 브라우저에는 WebGPU도 WebGL2도 없습니다.',
      reduced: `WGSL과 ${glsl}로 컴파일한 Metaballs. 시스템이 움직임 줄이기를 켜 두어서 한 프레임만 그렸습니다.`,
    },
    note: `정식 출시 전입니다. 저장소는 ${facts.mirrorVersion} 버전이고 ${facts.nextVersion}은 아직 npm에 없습니다. 지금은 [빠른 시작](quickStart)대로 git 서브모듈로 설치합니다.`,
    highlights: [
      {
        h: '소스 하나',
        p: `타입이 있는 모듈 하나에서 WebGPU용 WGSL과 WebGL2용 ${glsl}이 나옵니다. 저장소의 예제 ${facts.examples}개 가운데 ${facts.bothTargets}개가 파일 하나로 두 출력을 다 냅니다.`,
      },
      {
        h: '검증된 출력',
        p: '같은 모듈을 CPU에서 f64로 돌리고, 테스트는 컴파일러의 산술을 그 결과와 맞춰 봅니다. 출력은 푸시할 때마다 Tint에서 컴파일하고 WebGL2에서 링크합니다.',
      },
      {
        h: '타입 검사',
        p: `유니폼 필드 이름을 잘못 쓰거나 반환 타입이 틀리면 편집기에서 바로 TypeScript 오류가 납니다. \`reflect()\`는 같은 중간 표현에서 바인드 그룹과 ${facts.layoutStandards.join('과 ')} 레이아웃을 읽어 옵니다.`,
      },
    ],
  },
  quickStart: {
    title: 'TypeShade 빠른 시작: 설치와 첫 셰이더',
    description: 'TypeShade를 git 서브모듈로 추가하고, gradient 예제의 프래그먼트 단계에서 WGSL이 나오는 과정을 따라갑니다. 출시 전 상태도 함께 적었습니다.',
    h1: '빠른 시작',
      p1: `패키지에는 TypeScript 소스가 그대로 들어 있어서, 빌드 쪽에 TypeScript를 컴파일할 도구가 있어야 합니다. 아래는 gradient 예제의 프래그먼트 단계이고, \`${hero.file}\`에 쓴 그대로 ${hero.authoredLines}줄입니다.`,
      p2: '컴파일하면 이 WGSL 진입점이 나옵니다.',
      p3: `같은 함수의 ${glsl} 단계와, [reflect()](reflectApi)가 복원한 유니폼 레이아웃은 [예제 페이지](examples)에 있습니다. 나머지 API는 [작성 가이드](guide)를 보면 됩니다.`,
    status: {
      h: '상태',
      p: `정식 출시 전입니다. 저장소는 ${facts.mirrorVersion} 버전이고, npm 이름 [typeshade](npm)는 ${facts.nextVersion} 출시용으로 잡아 두었습니다. 매니페스트와 import 이름은 그 태그에서 바뀝니다. 이슈는 환영합니다. 다만 변경은 업스트림에 먼저 들어가고 이 트리는 거기서 fast-forward되기 때문에, 풀 리퀘스트는 아직 머지할 수 없습니다. ${facts.nextVersion} 소식은 [릴리스 구독](releases)으로 받을 수 있습니다.`,
    },
  },
  motivation: {
    title: 'WebGPU와 WebGL2에 셰이더 소스 하나를 쓰는 이유, TypeShade',
    description: `TypeShade가 타입 있는 TypeScript 모듈 하나에서 WGSL과 ${glsl}을 내는 이유. 셰이더 언어 두 개를 유지하는 비용과 Khronos 설문 수치.`,
    h1: '왜 TypeShade인가',
    paragraphs: [
      'WebGL2와 WebGPU 양쪽에서 돌아야 하는 셰이더는 두 벌이 됩니다. 두 언어는 타입, 진입점, 리소스 바인딩, 정밀도가 서로 달라서 두 번째 복사본은 사실상 처음부터 다시 쓰는 일입니다. 한쪽에만 들어간 수정은 다른 경로를 타는 기기에서야 드러나고, 리뷰어는 두 언어로 된 코드를 나란히 읽으면서 둘이 여전히 같은 일을 하는지 판단해야 합니다.',
      '웹은 지금 그런 이동의 한가운데에 있습니다. [MapLibre 그래픽 현대화 로드맵](maplibreRoadmap), [deck.gl WebGPU 가이드](deckglWebgpu), [PixiJS v8 마이그레이션 가이드](pixijsMigration) 모두 기존 WebGL 경로 옆에 WebGPU 경로가 생기는 과정을 설명합니다. GLSL로 쓴 커스텀 레이어라면 WGSL로 된 복사본이 하나 더 필요해집니다.',
      `[${facts.survey.title}](survey)에서는 응답한 셰이더 개발자 ${facts.survey.n}명 이상 가운데 ${facts.survey.figure64}%가 플랫폼, API, 도구를 넘나들며 셰이더를 옮기고 있다고 답했고, ${facts.survey.figure10}% 가까이는 그 일을 상당한 또는 가장 큰 엔지니어링 비용으로 꼽았습니다.`,
      'TypeShade는 소스를 하나로 둡니다. 모듈이 타입 있는 TypeScript라서 잘못 쓴 필드나 틀린 반환 타입은 편집기에서 잡힙니다. 중간 표현 하나가 두 언어를 모두 내고, 같은 모듈이 CPU에서 배정밀도로 실행되므로 백엔드가 낸 결과를 같은 소스로 계산한 기준값과 맞춰 볼 수 있습니다. 푸시마다 무엇을 실행하는지는 [검증 페이지](checks)에 있습니다.',
      '하지 않는 일도 있습니다. TypeShade에는 렌더러도 씬 그래프도 없습니다. 문자열과 리플렉션 메타데이터를 돌려줄 뿐이고, 파이프라인 생성, 리소스 바인딩, 드로우 호출은 호스트의 몫입니다. SPIR-V, MSL, HLSL은 WGSL을 naga나 Tint에 넣어 얻습니다. 네이티브 호스트는 모두 Dawn이나 wgpu를 거쳐 WGSL을 이미 받기 때문입니다.',
    ],
  },

  checks: {
    title: 'TypeShade 검증: CPU 오라클, 컴파일 게이트, 골든 파일',
    description: 'TypeShade의 CI가 푸시마다 실행하는 것: f64 CPU 오라클, Tint와 실제 WebGL2 컨텍스트에서 도는 컴파일 게이트, 출력마다의 골든 파일.',
    h1: '검증 방식',
    intro: '저장소의 CI는 푸시와 풀 리퀘스트마다 [CI 워크플로](ciGates)에서 다음을 실행합니다.',
    items: [
      '같은 모듈을 f64 산술로 도는 CPU 함수로도 컴파일합니다. 이것이 기준값을 내는 오라클입니다. 기본 모드에서는 동등 비교만 먼저 f32로 반올림해 GPU와 맞추고, 연산마다 반올림하는 f32 모드는 따로 켭니다. 테스트는 이 함수를 알려진 답과 맞춰 보고, 생성된 JavaScript라는 두 번째 CPU 백엔드와도 맞춰 봅니다. 둘은 비트 단위로 같아야 합니다. 드라이버의 반올림에 대해서는 아무것도 말해 주지 않고, 이 저장소에서 GPU 출력을 여기에 맞춰 보지는 않습니다. [src/core/oracle.ts](oracle)',
      `컴파일 게이트는 등록된 예제를 전부 출력합니다. WGSL은 헤드리스 Chromium 안의 Tint에 넘기고, 렌더링 가능한 예제의 ${glsl} 두 단계는 실제 WebGL2 컨텍스트에서 컴파일하고 링크합니다. 컴파일될 수 없는 셰이더도 각 컴파일러에 하나씩 넘깁니다. 어느 쪽이든 그것을 받아들이면 게이트는 실패하고, 예제에 대한 판정은 무효가 됩니다. [scripts/compile-gate.ts](compileGate)`,
      '골든 파일에는 모든 예제의 출력 바이트가 들어 있어서, 백엔드가 조금이라도 바뀌면 리뷰에서 diff로 드러납니다. [emit-goldens.test.ts](goldens)',
    ],
    pairIntro: '첫 페이지의 gradient 패스를 백엔드마다 한 번씩 그렸습니다. 두 백엔드의 픽셀 비교는 아직 커밋되어 있지 않습니다.',
    gpuFrame: {
      neutral: 'WGSL 출력. 빌드할 때 WebGPU에서 그렸습니다.',
      webgpu: 'WGSL 출력. 지금 WebGPU에서 그리고 있습니다.',
      webgl2: `여기서는 WebGPU를 쓸 수 없어서 ${glsl} 출력이 WebGL2에서 이 프레임을 그렸습니다.`,
      none: 'WGSL 출력. 빌드할 때 WebGPU에서 그렸습니다. 이 브라우저에는 WebGPU도 WebGL2도 없습니다.',
    },
    glFrame: {
      neutral: `${glsl} 출력. 빌드할 때 WebGL2에서 그렸습니다.`,
      webgpu: 'WGSL 출력. 지금 WebGPU에서 그리고 있습니다.',
      webgl2: `${glsl} 출력. 지금 WebGL2에서 그리고 있습니다.`,
      none: `${glsl} 출력. 빌드할 때 WebGL2에서 그렸습니다. 이 브라우저에는 WebGPU도 WebGL2도 없습니다.`,
    },
    authorTime: {
      h: '코드를 쓰는 동안',
      p: '유니폼 블록은 한 번 선언하고, 필드를 읽는 곳마다 그 선언에 맞춰 타입 검사를 받습니다. 하나만 잘못 써도 문자열이 GPU에 닿기 전에 편집기에서 TypeScript가 알려 줍니다.',
      caption: `${err.wrongLine}행에서 잘못 읽은 필드, 그 줄이 내는 진단, 그리고 읽으려던 블록에 대해 [reflect()](reflectApi)가 복원한 ${std} 레이아웃입니다. 필드 ${err.layout.fields.length}개에 ${err.layout.size}바이트이고, 첫 필드 뒤의 빈 공간은 정렬입니다.`,
    },
  },

  examples: {
    title: `TypeShade 예제 ${facts.examples}개, GLSL 출력, 에뮬레이션 f64`,
    description: `TypeShade 예제 ${facts.examples}개와 출력을 인쇄하는 명령, gradient 패스의 ${glsl} 출력, 에뮬레이션 배정밀도의 딥 줌 데모.`,
    h1: '예제',
    intro: `저장소에는 실행할 수 있는 예제가 ${facts.examples}개 있습니다. 지도용 패스, ShaderToy 시절의 화면 공간 효과, 에뮬레이션 배정밀도 계열, 컴퓨트 커널 하나를 다룹니다. 그중 ${facts.bothTargets}개는 한 소스에서 WGSL과 ${glsl}을 모두 냅니다. 컴퓨트 커널은 ${glsl}로 낼 버텍스나 프래그먼트 단계가 없어서 WGSL과 리플렉션만 내고, WebGL2 경로는 옵션으로 켜는 에뮬레이션입니다. ${facts.fp64Examples}개는 에뮬레이션 배정밀도를 씁니다. 렌더링 가능한 예제는 [examples/index.ts](examplesIndex)에서 export하고, [예제 디렉터리](examplesDir)에서 둘러볼 수 있습니다.`,
    printIntro: '아래 첫 번째 명령은 모든 예제의 WGSL, GLSL, 리플렉션을 인쇄하고, 두 번째는 id로 하나만 인쇄합니다.',
    glsl: {
      h: `gradient 패스의 ${glsl} 출력`,
      p1: `첫 페이지에는 \`${hero.file}\`의 프래그먼트 단계와 거기서 나오는 WGSL 진입점이 있습니다. 같은 함수에서 이 ${glsl} \`main\`이 나옵니다.`,
      p2: `모듈 전체는 WGSL로 ${hero.emit.wgslLines}줄이고, GLSL은 버텍스 단계 ${hero.emit.glslVertexLines}줄, 프래그먼트 단계 ${hero.emit.glslFragmentLines}줄입니다. 유니폼 타입, 바이트 오프셋, 바인드 그룹 항목, 진입점 시그니처는 [reflect()](reflectApi)에서 나옵니다. reflect()는 같은 중간 표현을 읽지만 출력 경로에는 관여하지 않으므로, 호스트는 그 레이아웃대로 유니폼 버퍼를 채우면 됩니다. [검증 페이지](checks)에는 유니폼 블록의 복원된 레이아웃이 잘못 쓴 필드의 진단과 나란히 있습니다.`,
    },
    f64: {
      h: '에뮬레이션 배정밀도',
      p1: `WGSL에도 ${glsl}에도 배정밀도 부동소수점은 없습니다. TypeShade는 f32 값 두 개를 합치지 않고 나란히 든 쌍으로 이를 에뮬레이션하고, 산술, 비교, 일부 내장 함수를 그 쌍에 대한 호출로 바꿔 냅니다. 그 범위 밖의 연산은 출력할 때 코드가 붙은 오류로 실패합니다. 쓰는 코드는 그대로이고 선언한 타입만 다릅니다. deep-zoom 예제에서 \`${facts.deepZoomOrigin.name}\` 필드는 소스에서 \`${facts.deepZoomOrigin.sourceType}\`로 선언되고 유니폼 블록에서는 \`${facts.deepZoomOrigin.layoutType}\` 자리를 차지하며, 호스트가 그 자리를 분리한 쌍으로 채웁니다.`,
      p2: 'f64 산술을 하는 모듈에는 가드 텍스처 바인딩도 주입되는데, 호스트는 이 텍스처를 흰색 텍셀 하나로 채워야 합니다. GPU 드라이버의 셰이더 컴파일러는 텍셀 읽기를 미리 계산해 버릴 수 없는데, 그 읽기가 없으면 오차 보정 항을 마음대로 최적화해 없앨 수 있기 때문입니다. 연산마다 f32의 몇 배가 들므로 이 타입은 값 하나하나에 대해 골라서 씁니다. 예제는 [fp64-deep-zoom.ts](deepZoom)입니다.',
      caption: `같은 월드 좌표를 두 번 그렸습니다. 왼쪽은 ${split[0]}, 오른쪽은 ${split[1]}입니다. ${split[0]} 쪽은 줄무늬가 계단처럼 나오는데, 이 거리에서는 ${split[0]}의 ulp 하나가 줄무늬에 필요한 소수 부분보다 거칠기 때문입니다. 다른 쪽은 매끄럽게 나옵니다.`,
      captionNone: '빌드할 때 렌더링한 화면입니다. 이 브라우저에는 WebGPU도 WebGL2도 없습니다.',
    },
  },

  guide: {
    title: 'TypeShade 작성 가이드: TypeScript로 셰이더 쓰기',
    description: 'TypeShade의 작성 API를 절마다 설명합니다. 값, 제어 흐름, 레이아웃, 진단, 에뮬레이션 f64, 프로덕션 출력, GLSL 셰이더 옮기기.',
    contents: '목차',
    note: `커밋 ${facts.pinnedCommit}의 [AUTHORING.md](guideSource)를 그대로 옮긴 것으로, 본문은 아직 영어입니다. 패키지는 ${facts.nextVersion}에서 쓸 이름인 \`typeshade\`로 import합니다.`,
  },
  notFound: {
    title: '페이지를 찾을 수 없음, TypeShade',
    description: 'typeshade.dev의 이 주소에는 아무것도 없습니다.',
    h1: '이 주소에는 아무것도 없습니다.',
    p: '페이지가 옮겨졌을 수 있습니다. 첫 페이지와 작성 가이드는 그대로 있습니다.',
    links: '[첫 페이지로 돌아가거나](home) [작성 가이드](guide)를 읽어 보세요.',
  },
}
