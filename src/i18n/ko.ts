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

// 작성 가이드의 절마다 한국어 제목과 설명. 키는 로더가 제목에서 만든 id입니다. 본문은
// 영어 원문 그대로이므로, 사이드바와 페이지 제목과 설명만 한국어로 둡니다.
const sections: Record<string, { title: string; description: string }> = {
  'the-authoring-surface': {
    title: '작성 API',
    description: '모듈의 함수는 모두 fn으로 씁니다. 평범한 헬퍼도, @vertex와 @fragment와 @compute 진입점도 같은 함수 하나로 선언합니다.',
  },
  'values-and-mutation': {
    title: '값과 변경',
    description: '중간 값은 평범한 JS const로 씁니다. Let(...)이나 Var(...)로 감쌀 일은 없고, 값을 바꿀 때만 assign을 부릅니다.',
  },
  'control-flow': {
    title: '제어 흐름',
    description: 'If, elif, else의 본문은 인자를 받지 않는 클로저입니다. 클로저 안에 쓴 코드는 그때 열려 있는 가장 안쪽 스코프로 들어갑니다.',
  },
  'sot-helpers': {
    title: '레이아웃 선언',
    description: '버텍스와 유니폼 레이아웃을 예전에는 최대 네 곳에 손으로 적고 서로 맞춰야 했습니다. 폴리곤 슬롯이 어긋나던 버그가 거기서 나왔습니다.',
  },
  'before-after': {
    title: '전과 후',
    description: '작성 API가 걷어낸 절차를 짝으로 보여 줍니다. 손으로 맞추던 예전 코드와, 선언 한 번으로 끝나는 지금 코드를 나란히 놓았습니다.',
  },
  diagnostics: {
    title: '진단',
    description: '작성하다 낸 실수는 코드가 붙은 오류로 드러나고, 오류마다 한 줄짜리 힌트가 따라옵니다. 속을 알 수 없는 문자열은 나오지 않습니다.',
  },
  fp64: {
    title: 'fp64',
    description: 'GPU에는 f64가 없습니다. 합치지 않고 나란히 든 f32 두 개로 f64를 에뮬레이션해서, f32 지수 범위에서 가수 48비트 정도를 씁니다.',
  },
  'production-emit': {
    title: '프로덕션 출력',
    description: '번들러는 JS만 줄입니다. gl.shaderSource나 createShaderModule에 넘기는 셰이더 문자열에는 손대지 않습니다.',
  },
  'glsl-float-precision': {
    title: 'GLSL 부동소수점 정밀도',
    description: 'GLSL ES 3.00 백엔드는 precision highp float을 냅니다. mediump로 충분한 자리에 highp를 쓰면 모바일 GPU가 대역폭과 전력을 더 씁니다.',
  },
  'capabilities-extensions': {
    title: '기능과 확장',
    description: '모듈은 출력에 필요한 GPU 기능을 중립적인 id로 선언합니다. EXT_나 OVR_ 같은 확장 이름을 그대로 적는 자리는 없습니다.',
  },
  'conditional-programs': {
    title: '조건부 프로그램',
    description: '기능에 따라 달라져야 하는 셰이더는, GLSL 코드베이스라면 #define과 #ifdef 사다리를 꺼내 들던 자리입니다. 여기서는 그 자리를 다르게 씁니다.',
  },
  'migrating-a-glsl-shader': {
    title: 'GLSL 셰이더 옮기기',
    description: '§1부터 §11까지는 새로 쓰는 사람을 위한 순서입니다. 이 절은 옮겨 오는 사람이 실제로 묻는 질문, 내 GLSL이 하던 일을 여기서 어떻게 쓰는지에 답합니다.',
  },
  'quick-reference': {
    title: '빠른 참조',
    description: '작성 API 전체를 표 하나로 정리했습니다. 왼쪽 칸에 필요한 일이 적혀 있고, 오른쪽 칸에 그 일을 쓰는 호출이 적혀 있습니다.',
  },
}

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
    search: '검색',
    searchUnavailable: '검색은 빌드된 사이트에서 쓸 수 있습니다',
    searchUi: {
      placeholder: '검색',
      clear_search: '지우기',
      load_more: '결과 더 보기',
      search_label: '이 사이트에서 검색',
      filters_label: '필터',
      zero_results: '[SEARCH_TERM] 검색 결과가 없습니다',
      many_results: '[SEARCH_TERM] 검색 결과 [COUNT]개',
      one_result: '[SEARCH_TERM] 검색 결과 [COUNT]개',
      alt_search: '[SEARCH_TERM] 검색 결과가 없어 [DIFFERENT_TERM] 결과를 보여 줍니다',
      search_suggestion: '[SEARCH_TERM] 검색 결과가 없습니다. 다음 검색어를 눌러 보십시오',
      searching: '[SEARCH_TERM] 검색 중',
    },
    version: '버전',
    prerelease: `출시 전, 다음은 ${facts.nextVersion}`,
    releases: '릴리스',
    commit: '고정 커밋',
    changelog: '변경 이력',
  },
  docs: {
    introduction: '소개',
    authoring: '작성',
    project: '프로젝트',
    why: '왜 TypeShade인가',
    quickStart: '빠른 시작',
    authoringGuide: '작성 가이드',
    checks: '검증 방식',
    examples: '예제',
    onThisPage: '이 페이지에서',
    previous: '이전',
    next: '다음',
    editPage: '이 페이지 편집',
    api: {
      title: 'TypeShade API 참조',
      description: 'TypeShade의 공개 export를 하나씩 페이지로 정리했습니다. 구문, 매개변수, 반환값, 예제, 그리고 어느 대상에서 지원되는지를 담습니다.',
      h1: 'API 참조',
      intro: `커밋 ${facts.pinnedCommit}의 컴파일러에서 생성한 패키지의 모든 export입니다. 함수, 타입, 인터페이스, 클래스마다 페이지가 하나씩 있습니다.`,
      reference: '참조',
      breadcrumbs: '현재 위치',
      pageTitle: (name: string) => `${name}, TypeShade API 참조`,
      pageDescription: (name: string, kind: string, category: string, summary: string) => `${category} 분류의 ${kind} ${name}에 대한 TypeShade API 참조입니다. ${summary}`,
      kindLine: (kind: string, category: string) => `${category}의 ${kind}`,
      note: `시그니처, 설명, 예제는 커밋 ${facts.pinnedCommit}의 컴파일러 소스에서 그대로 가져온 영어 원문입니다.`,
      syntax: '구문',
      parameters: '매개변수',
      returnValue: '반환값',
      exceptions: '예외',
      descriptionHeading: '설명',
      examples: '예제',
      targets: '대상별 지원',
      target: '대상',
      supportHeading: '지원',
      notes: '비고',
      constructor: '생성자',
      instanceProperties: '인스턴스 속성',
      instanceMethods: '인스턴스 메서드',
      inGuide: '가이드에서',
      seeAlso: '함께 보기',
      source: '소스',
      optional: '선택',
      readonly: '읽기 전용',
      previewNote: '템플릿 미리보기입니다. 이 페이지의 내용은 예시 데이터이고 컴파일러에서 가져온 것이 아닙니다.',
      undocumented: '소스에 아직 설명이 없습니다.',
      line: (n: number) => `${n}행`,
      atCommit: (sha: string) => `커밋 ${sha} 기준`,
      members: (n: number) => `${n}개 항목`,
      kinds: { function: '함수', constant: '상수', interface: '인터페이스', type: '타입', class: '클래스' },
      targetNames: { wgsl: 'WGSL (WebGPU)', glsl: `${glsl} (WebGL2)`, cpu: 'CPU 오라클' },
      support: { native: '지원', emulated: '에뮬레이션', stub: '스텁', none: '지원 안 함', 'n/a': '해당 없음' },
      categories: {} as Record<string, { name: string; summary: string }>,
    },
  },
  footer: {
    docs: '문서',
    project: '프로젝트',
    languages: '언어',
    readme: 'README',
    releases: '릴리스',
    npm: 'npm 패키지',
    license: '[MIT 라이선스](license)로 배포합니다.',
    copyright: `Copyright © ${facts.year} ${facts.author} 기여자`,
    builtFrom: '빌드한 커밋',
  },

  canvas: {
    aria: (title: string) => ({
      webgpu: `TypeScript로 쓰고 TypeShade가 WGSL로 컴파일한 ${title} 셰이더. WebGPU에서 실행 중.`,
      webgl2: `TypeScript로 쓰고 TypeShade가 ${glsl}으로 컴파일한 ${title} 셰이더. WebGL2에서 실행 중.`,
      'still-webgpu': `TypeScript로 쓰고 TypeShade가 WGSL로 컴파일한 ${title} 셰이더. WebGPU에서 한 프레임을 그림.`,
      'still-webgl2': `TypeScript로 쓰고 TypeShade가 ${glsl}으로 컴파일한 ${title} 셰이더. WebGL2에서 한 프레임을 그림.`,
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
    glsl: `${glsl}으로 나온 프래그먼트 main`,
    print: '예제의 WGSL, GLSL, 리플렉션을 인쇄하는 명령',
  },

  front: {
    hero: {
      before: 'WGSL과 GLSL을 모두 만드는',
      accent: 'TypeScript 셰이더 라이브러리',
      after: '',
      subtitle: 'TypeShade for Shader DSL',
      tagline: `셰이더를 TypeScript로 한 번 쓰면 WebGPU용 WGSL과 WebGL2용 ${glsl}이 나옵니다. 같은 모듈을 CPU에서 배정밀도로 돌려, 컴파일러가 낸 결과를 그 값과 맞춰 볼 수 있습니다.`,
      getStarted: '시작하기',
      why: '왜 TypeShade인가',
      examples: '예제',
      prerelease: `출시 전: ${facts.nextVersion}은 아직 npm에 없습니다. git 서브모듈로 설치합니다`,
    },
    metaballs: {
      neutral: `examples/${exampleFile('metaballs')}의 Metaballs. 빌드할 때 그린 화면입니다.`,
      webgpu: '컴파일된 WGSL로 WebGPU에서 실시간으로 그리는 Metaballs.',
      webgl2: `컴파일된 ${glsl}으로 WebGL2에서 실시간으로 그리는 Metaballs.`,
      none: '빌드할 때 렌더링한 Metaballs. 이 브라우저에는 WebGPU도 WebGL2도 없습니다.',
      reduced: '한 프레임만 그린 Metaballs. 시스템이 움직임 줄이기를 켜 두었습니다.',
    },
    code: {
      h: '작성한 프래그먼트와 그 WGSL 출력',
      p: `gradient 예제의 프래그먼트 단계를 쓴 그대로 ${hero.authoredLines}줄, 그리고 거기서 나오는 WGSL 진입점입니다. ${glsl} 단계도 같은 함수에서 나옵니다.`,
      more: '[빠른 시작](quickStart)',
    },
    highlights: [
      {
        h: '소스 하나, 출력 둘',
        p: `타입이 있는 모듈 하나에서 WebGPU용 WGSL과 WebGL2용 ${glsl}이 나옵니다. 저장소의 예제 ${facts.examples}개 가운데 ${facts.bothTargets}개가 파일 하나로 두 출력을 다 냅니다.`,
      },
      {
        h: 'CPU 결과와 대조',
        p: '같은 모듈을 CPU에서 f64로 돌리고, 테스트는 컴파일러의 산술을 그 결과와 맞춰 봅니다. 출력은 푸시할 때마다 Tint에서 컴파일하고 WebGL2에서 링크합니다.',
      },
      {
        h: '편집기에서 타입 검사',
        p: `유니폼 필드 이름을 잘못 쓰거나 반환 타입이 틀리면 편집기에서 바로 TypeScript 오류가 납니다. \`reflect()\`는 같은 중간 표현에서 바인드 그룹과 ${facts.layoutStandards.join('과 ')} 레이아웃을 읽어 옵니다.`,
      },
    ],
  },
  quickStart: {
    title: 'TypeShade 빠른 시작: 설치와 첫 셰이더',
    description: 'TypeShade를 git 서브모듈로 추가하고, gradient 예제의 프래그먼트 단계에서 WGSL이 나오는 과정을 따라갑니다. 출시 전 상태도 함께 적었습니다.',
    h1: '빠른 시작',
    installH: '설치',
      p1: `패키지에는 TypeScript 소스가 그대로 들어 있어서, 빌드 쪽에 TypeScript를 컴파일할 도구가 있어야 합니다. 아래는 gradient 예제의 프래그먼트 단계이고, \`${hero.file}\`에 쓴 그대로 ${hero.authoredLines}줄입니다.`,
      p2: '컴파일하면 이 WGSL 진입점이 나옵니다.',
      p3: `같은 함수의 ${glsl} 단계와, [reflect()](reflectApi)가 복원한 유니폼 레이아웃은 [예제 페이지](examples)에 있습니다. 나머지 API는 [작성 가이드](guide)를 보면 됩니다.`,
    status: {
      h: '상태',
      p: `정식 출시 전입니다. 저장소는 ${facts.mirrorVersion} 버전이고, npm 이름 [typeshade](npm)는 ${facts.nextVersion} 출시용으로 잡아 두었습니다. 매니페스트와 import 이름은 그 태그에서 바뀝니다. 이슈는 환영합니다. 다만 변경은 업스트림에 먼저 들어가고 이 트리는 그것을 fast-forward로 따라가기 때문에, 풀 리퀘스트는 아직 머지할 수 없습니다. ${facts.nextVersion} 소식은 [릴리스 구독](releases)으로 받을 수 있습니다.`,
    },
  },
  motivation: {
    title: 'WebGPU와 WebGL2에 셰이더 소스 하나를 쓰는 이유, TypeShade',
    description: `TypeShade가 타입 있는 TypeScript 모듈 하나에서 WGSL과 ${glsl}을 내는 이유. 셰이더 언어 두 개를 유지하는 비용과 Khronos 설문 수치.`,
    h1: '왜 TypeShade인가',
    sections: [
      {
        h: '셰이더가 두 벌이 되는 이유',
        p: 'WebGL2와 WebGPU 양쪽에서 돌아야 하는 셰이더는 두 벌이 됩니다. 두 언어는 타입, 진입점, 리소스 바인딩, 정밀도가 서로 달라서 두 번째 복사본은 사실상 처음부터 다시 쓰는 일입니다. 한쪽에만 들어간 수정은 다른 경로를 타는 기기에서야 드러나고, 리뷰어는 두 언어로 된 코드를 나란히 읽으면서 둘이 여전히 같은 일을 하는지 판단해야 합니다.',
      },
      {
        h: 'WebGPU로 넘어가는 흐름',
        p: '웹은 지금 그런 이동의 한가운데에 있습니다. [MapLibre 그래픽 현대화 로드맵](maplibreRoadmap), [deck.gl WebGPU 가이드](deckglWebgpu), [PixiJS v8 마이그레이션 가이드](pixijsMigration) 모두 기존 WebGL 경로 옆에 WebGPU 경로가 생기는 과정을 설명합니다. GLSL로 쓴 커스텀 레이어라면 WGSL로 된 복사본이 하나 더 필요해집니다.',
      },
      {
        h: '설문 결과',
        p: `[${facts.survey.title}](survey)에서는 응답한 셰이더 개발자 ${facts.survey.n}명 이상 가운데 ${facts.survey.figure64}%가 플랫폼, API, 도구를 넘나들며 셰이더를 옮기고 있다고 답했고, ${facts.survey.figure10}% 가까이는 그 일을 상당한 또는 가장 큰 엔지니어링 비용으로 꼽았습니다.`,
      },
      {
        h: 'TypeShade가 하는 일',
        p: 'TypeShade는 소스를 하나로 둡니다. 모듈이 타입 있는 TypeScript라서 잘못 쓴 필드나 틀린 반환 타입은 편집기에서 잡힙니다. 중간 표현 하나가 두 언어를 모두 내고, 같은 모듈이 CPU에서 배정밀도로 실행되므로 백엔드가 낸 결과를 같은 소스로 계산한 기준값과 맞춰 볼 수 있습니다. 푸시마다 무엇을 실행하는지는 [검증 페이지](checks)에 있습니다.',
      },
      {
        h: '하지 않는 일',
        p: 'TypeShade에는 렌더러도 씬 그래프도 없습니다. 문자열과 리플렉션 메타데이터를 돌려줄 뿐이고, 파이프라인 생성, 리소스 바인딩, 드로우 호출은 호스트의 몫입니다. SPIR-V, MSL, HLSL은 WGSL을 naga나 Tint에 넣어 얻습니다. 네이티브 호스트는 모두 Dawn이나 wgpu를 거쳐 WGSL을 이미 받기 때문입니다.',
      },
    ],
  },

  checks: {
    title: 'TypeShade 검증: CPU 오라클, 컴파일 게이트, 골든 파일',
    description: 'TypeShade의 CI가 푸시마다 실행하는 것: f64 CPU 오라클, Tint와 실제 WebGL2 컨텍스트에서 도는 컴파일 게이트, 출력마다의 골든 파일.',
    h1: '검증 방식',
    ciH: '푸시마다 도는 검사',
    intro: '저장소의 CI는 푸시와 풀 리퀘스트마다 [CI 워크플로](ciGates)에서 다음을 실행합니다.',
    items: [
      '같은 모듈을 f64 산술로 도는 CPU 함수로도 컴파일합니다. 이것이 기준값을 내는 오라클입니다. 기본 모드에서는 동등 비교만 먼저 f32로 반올림해 GPU와 맞추고, 연산마다 반올림하는 f32 모드는 따로 켭니다. 테스트는 이 함수를 알려진 답과 맞춰 보고, 생성된 JavaScript라는 두 번째 CPU 백엔드와도 맞춰 봅니다. 둘은 비트 단위로 같아야 합니다. 드라이버의 반올림에 대해서는 아무것도 말해 주지 않고, 이 저장소에서 GPU 출력을 여기에 맞춰 보지는 않습니다. [src/core/oracle.ts](oracle)',
      `컴파일 게이트는 등록된 예제를 전부 출력합니다. WGSL은 헤드리스 Chromium 안의 Tint에 넘기고, 렌더링 가능한 예제의 ${glsl} 두 단계는 실제 WebGL2 컨텍스트에서 컴파일하고 링크합니다. 컴파일될 수 없는 셰이더도 각 컴파일러에 하나씩 넘깁니다. 어느 쪽이든 그것을 받아들이면 게이트는 실패하고, 예제에 대한 판정은 무효가 됩니다. [scripts/compile-gate.ts](compileGate)`,
      '골든 파일에는 모든 예제의 출력 바이트가 들어 있어서, 백엔드가 조금이라도 바뀌면 리뷰에서 diff로 드러납니다. [emit-goldens.test.ts](goldens)',
    ],
    pairH: '두 백엔드에서 같은 패스',
    pairIntro: '첫 페이지의 gradient 패스를 백엔드마다 한 번씩 그렸습니다. 두 백엔드의 픽셀 비교는 아직 커밋되어 있지 않습니다.',
    gpuFrame: {
      neutral: '컴파일된 WGSL로 빌드할 때 WebGPU에서 그렸습니다.',
      webgpu: '컴파일된 WGSL로 지금 WebGPU에서 그리고 있습니다.',
      webgl2: `여기서는 WebGPU를 쓸 수 없어서, 컴파일된 ${glsl}으로 WebGL2에서 이 프레임을 그렸습니다.`,
      none: '컴파일된 WGSL로 빌드할 때 WebGPU에서 그렸습니다. 이 브라우저에는 WebGPU도 WebGL2도 없습니다.',
    },
    glFrame: {
      neutral: `컴파일된 ${glsl}으로 빌드할 때 WebGL2에서 그렸습니다.`,
      webgpu: '컴파일된 WGSL로 지금 WebGPU에서 그리고 있습니다.',
      webgl2: `컴파일된 ${glsl}으로 지금 WebGL2에서 그리고 있습니다.`,
      none: `컴파일된 ${glsl}으로 빌드할 때 WebGL2에서 그렸습니다. 이 브라우저에는 WebGPU도 WebGL2도 없습니다.`,
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
    intro: `저장소에는 실행할 수 있는 예제가 ${facts.examples}개 있습니다. 지도용 패스, ShaderToy 시절의 화면 공간 효과, 에뮬레이션 배정밀도 계열, 컴퓨트 커널 하나를 다룹니다. 그중 ${facts.bothTargets}개는 한 소스에서 WGSL과 ${glsl}을 모두 냅니다. 컴퓨트 커널은 ${glsl}으로 낼 버텍스나 프래그먼트 단계가 없어서 WGSL과 리플렉션만 내고, WebGL2 경로는 옵션으로 켜는 에뮬레이션입니다. ${facts.fp64Examples}개는 에뮬레이션 배정밀도를 씁니다. 렌더링 가능한 예제는 [examples/index.ts](examplesIndex)가 내보내고, [예제 디렉터리](examplesDir)에서 둘러볼 수 있습니다.`,
    categories: { cartographic: '지도', generic: '화면 공간', compute: '컴퓨트' },
    columns: { example: '예제', category: '분류', targets: '출력', blurb: '설명' },
    targets: { both: `WGSL과 ${glsl}`, wgsl: 'WGSL' },
    blurbs: {
      graticule: '지도라면 다 그리는 경위선 격자.',
      hillshade: '음영 기복.',
      'fp64-deep-zoom': '에뮬레이션 배정밀도(f32 두 개로 만든 df64).',
      'fp64-checker-plane': '월드 평면 위의 1단위 체커보드.',
      'fp64-loran': 'LORAN 방식의 해도 격자.',
      'fp64-mercator-tiles': '타일 엔진이 쓰는 그 계산식.',
      'fp64-rtc': '행성 규모 엔진이 시점 기준으로 렌더링하는 이유.',
      'color-ramp': '데이터로 색을 정하는 단계구분도 색상 램프.',
      'discard-cutout': '가운데 원 바깥에서는 픽셀을 버리고 안쪽에서는 채움 색을 돌려주는 프래그먼트 헬퍼입니다. 프래그먼트 IO 구조체 생성자에 인자로 한 번 넣습니다.',
      plasma: '사인파를 여러 개 더해 만든 고전 플라스마에 RGB 팔레트로 색을 입혔습니다.',
      voronoi: '움직이는 셀룰러 노이즈.',
      julia: '탈출 시간으로 그리는 줄리아 프랙탈.',
      mandelbrot: '탈출 시간을 매끄럽게 이어 칠한 만델브로 집합.',
      'fbm-clouds': '프랙탈 브라운 운동.',
      'domain-warp': 'fbm 출력을 다시 fbm에 넣습니다.',
      'raymarch-sphere': '구의 부호 있는 거리 필드입니다. 카메라 광선에서 스피어 트레이싱으로 찾고, 궤도를 도는 광원으로 블린퐁 셰이딩합니다.',
      'raymarch-boxes': '도메인 반복.',
      tunnel: '데모신 시절의 터널.',
      metaballs: '음함수로 그린 방울.',
      ocean: '원리부터 계산해 그린 바다 풍경.',
      starfield: '텍스처 없이 그린 밤하늘.',
      truchet: '타일 하나.',
      kaleidoscope: '극좌표로 접는 거울 반사.',
      heart: '하트 곡선 (x²+y²-1)³ = x²y³입니다. 부호로 안쪽을 채우고 fwidth로 가장자리를 다듬었으며, 뾰족하게 만든 사인파 박동에 맞춰 뛰고 박자에 맞춰 빛납니다.',
      'fp64-mandelbrot': 'f32 두 개로 만든 배정밀도의 고전 데모.',
      'fp64-julia': '같은 배정밀도 기법을 줄리아 집합으로 보인 예제.',
      'fp64-burning-ship': '버닝 십 프랙탈입니다. 제곱하기 전에 |Re z|, |Im z|로 접고, 바늘처럼 뾰족한 부분을 확대합니다.',
      'fp64-newton': 'z³ = 1을 푸는 뉴턴 방법입니다. 색은 그 픽셀이 어느 세제곱근으로 수렴하는지 나타냅니다.',
      'fp64-mandelbrot-de': '거리 추정(d = ½·|z|·ln|z|/|dz|)으로 만델브로 경계를 그립니다. 정밀도는 식 중간에서 나눕니다.',
      'fp64-clock': '오래 켜 두면 생기는 애니메이션 버그.',
      'fp64-cancellation': '수치해석 교과서의 그 그래프를 GPU로 그립니다.',
      'fp64-sine-sweep': '큰 기준값에 화면에서 조금씩 움직이는 값을 더한 x로 sin(x)를 구합니다.',
      gradient: '섞는 비율을 조절할 수 있는 세로 방향 두 색 그러데이션.',
      'override-quality': '파이프라인에서 덮어쓸 수 있는 `quality` 상수.',
      'texture-array-lod': '타일 아틀라스를 `texture_2d_array<f32>` 바인딩 하나로 씁니다.',
      'compute-reduction': '@workgroup_size가 붙은 컴퓨트 커널입니다. 입력 스토리지 버퍼의 한 구간을 reduce()로 접어 출력 원소 하나로 만듭니다.',
    },
    printIntro: '저장소를 받아 둔 디렉터리에서 실행합니다. 첫 번째 명령은 모든 예제의 WGSL, GLSL, 리플렉션을 인쇄하고, 두 번째는 id로 하나만 인쇄합니다.',
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
    sectionTitle: (title: string) => `${title}, TypeShade 작성 가이드`,
    sections,
    note: `커밋 ${facts.pinnedCommit}의 [AUTHORING.md](guideSource)를 그대로 옮긴 것으로, 본문은 아직 영어입니다. 패키지는 ${facts.nextVersion}에서 쓸 \`typeshade\`라는 이름으로 가져옵니다.`,
  },
  notFound: {
    title: '페이지를 찾을 수 없음, TypeShade',
    description: 'typeshade.dev의 이 주소에는 아무것도 없습니다.',
    h1: '이 주소에는 아무것도 없습니다.',
    p: '페이지가 옮겨졌을 수 있습니다. 첫 페이지와 작성 가이드는 그대로 있습니다.',
    links: '[첫 페이지로 돌아가거나](home) [작성 가이드](guide)를 읽어 보세요.',
  },
}
