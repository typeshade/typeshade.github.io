// Korean copy. Typed against the English source, so a string that exists in one and not
// the other is a build error. Numbers come from the build, as in en.ts. scripts/check-copy.ts
// compares every string with its English one: the same numerals, links and code, no
// translation tells, and no label wider than the English label it replaces.
import type { Copy } from './index.ts'
import { exampleFile, facts, hero, quickStartFile } from '../lib/examples.ts'
import { typedError } from '../lib/typed-error.ts'

const glsl = facts.glslTarget
const err = typedError()
const std = facts.layoutStandards[0]
const split = facts.splitLabels ?? ['f32', 'f64']

// 작성 가이드의 절마다 한국어 제목과 설명. 키는 로더가 제목에서 만든 id입니다. 본문은
// 영어 원문 그대로이므로, 사이드바와 페이지 제목과 설명만 한국어로 둡니다.
const sections: Record<string, { title: string; description: string }> = {
  'your-first-shader': {
    title: '첫 셰이더',
    description: `TypeScript로 진입점 두 개짜리 셰이더 모듈을 쓰고 WGSL과 ${glsl}로 출력합니다. 어느 호출이 어느 문자열을 냈는지도 알게 됩니다.`,
  },
  'values-and-mutation': {
    title: '값과 변경',
    description: '중간 값을 쓰고 필요한 곳에만 타입을 붙이며, 그 값을 바꾸고, 어떤 값이 자기 이름을 따로 가져야 하는지 가리는 법을 익힙니다.',
  },
  'functions-and-entry-points': {
    title: '함수와 진입점',
    description: '헬퍼 함수를 선언해 다른 함수에서 부르고, 어느 스테이지든 진입점을 쓰고, 그 함수들을 모두 담는 모듈을 선언하는 법을 익힙니다.',
  },
  'control-flow': {
    title: '제어 흐름',
    description: '셰이더 본문 안에서 분기하고 반복하고 디스패치하는 법을 익히고, 문장 형태의 제어 흐름과 값 형태의 제어 흐름을 서로 구분합니다.',
  },
  'layouts-and-resources': {
    title: '레이아웃과 리소스',
    description: '버텍스, 유니폼, 스토리지, 텍스처 레이아웃을 한 번만 선언하고, 그 선언 하나에서 모든 필드를 읽어 두 타깃에 그대로 쓰는 법을 익힙니다.',
  },
  'emitting-and-reflection': {
    title: '출력과 리플렉션',
    description: '모듈을 WGSL로, GLSL 두 스테이지로, 또는 호스트가 조합하는 조각으로 바꾸고, 호스트가 바인딩에 쓰는 파이프라인 메타데이터를 읽습니다.',
  },
  'the-cpu-oracle': {
    title: 'CPU 오라클 안내서',
    description: '모듈을 CPU에서 배정밀도로 실행하고, 거기서 나온 숫자를 GPU가 낸 값과 비교해 컴파일러의 출력을 검증하는 법을 익힙니다.',
  },
  diagnostics: {
    title: '진단',
    description: '코드가 붙은 오류를 읽고 그 코드로 분기하며, 모듈의 모든 실패를 보고서 하나로 받고, 오류가 난 TypeScript 줄을 출력합니다.',
  },
  'conditional-programs': {
    title: '조건부 프로그램',
    description: '소스 하나에서 여러 프로그램 중 무엇을 만들지 정하고, 배리언트가 상수 하나로 끝나는 경우를 가려내며, 선택을 호스트에 넘깁니다.',
  },
  'capabilities-extensions': {
    title: '기능과 확장',
    description: '모듈에 필요한 GPU 기능을 선언하고, 대상마다 그 기능이 무엇을 요구하는지 읽고, 출력 전에 부팅된 장치를 그 선언과 대조합니다.',
  },
  fp64: {
    title: 'fp64',
    description: '셰이더 안에 배정밀도 값을 선언하고, f64가 지원하는 연산이 무엇인지 알고, 에뮬레이션에 필요한 가드 텍스처를 바인딩하는 법을 익힙니다.',
  },
  'glsl-float-precision': {
    title: 'GLSL 부동소수점 정밀도',
    description: 'GLSL 스테이지를 언제 mediump로 출력할지, 그 옵션 하나가 출력된 소스에서 무엇을 바꾸고 무엇을 그대로 두는지 압니다.',
  },
  'production-emit': {
    title: '프로덕션 출력',
    description: '배포 시점 변환을 출력 호출 하나로 조합하고, 이름이 바뀐 셰이더 텍스트로 돌아온 드라이버 로그를 원래 이름으로 되돌려 읽습니다.',
  },
  'raw-statements': {
    title: '원시 문장',
    description: '손으로 쓴 문장을 모듈에 그대로 끼워 넣는 법과, 그 문장이 WGSL과 GLSL 각 타깃에서 무엇을 포기하게 하는지 알아봅니다.',
  },
  'migrating-a-glsl-shader': {
    title: 'GLSL 셰이더 옮기기',
    description: '눈앞의 GLSL 구문을 DSL에서 어떻게 쓰는지 표에서 찾고, 그 표기가 WGSL과 GLSL 각 타깃에서 무엇으로 바뀌는지 확인합니다.',
  },
}

// 참조의 분류 이름과 한 줄 설명입니다. 키는 추출기가 정한 슬러그이고, 하나라도 빠지면
// assertApiCategories()가 그 슬러그를 알려 주며 빌드를 세웁니다.
const apiCategories: Record<string, { name: string; summary: string }> = {
  authoring: {
    name: '작성',
    summary: '셰이더를 쓰는 빌더입니다. 모듈과 함수, 변수, 제어 흐름을 여기 있는 호출로 선언합니다.',
  },
  builtins: {
    name: '내장 함수',
    summary: '셰이더에서 부르는 수학, 벡터, 텍스처 함수입니다. 이름 하나로 두 대상 모두에 나갑니다.',
  },
  values: {
    name: '값',
    summary: '리터럴과 타입이 붙은 참조, 그리고 자바스크립트 값을 노드로 바꾸는 생성자입니다.',
  },
  types: {
    name: '타입',
    summary: '작성 API에 타입을 붙이는 타입 키와 타입 기술자입니다. 셰이더 값의 형태가 여기서 정해집니다.',
  },
  ir: {
    name: 'IR',
    summary: '모든 백엔드가 읽는 중간 표현입니다. 노드와 문장과 선언이 들어 있고, 출력은 모두 여기서 나옵니다.',
  },
  layout: {
    name: '레이아웃',
    summary: '구조체와 바인딩 리소스를 한 번만 선언하는 선언자입니다. 호스트와 두 대상이 같은 선언을 씁니다.',
  },
  emit: {
    name: '출력',
    summary: `WGSL과 ${glsl}을 쓰는 출력기와 모듈 조각, 그리고 그 앞에서 실행되는 패스입니다.`,
  },
  'reflection-api': {
    name: '리플렉션',
    summary: 'reflect()가 모듈에서 복원해 내는 것들입니다. 바인드 그룹과 바이트 레이아웃, 진입점이 여기 있습니다.',
  },
  'cpu-oracle': {
    name: 'CPU 오라클',
    summary: '모듈을 f64로 실행하는 CPU 백엔드입니다. 여기서 나온 값이 GPU 출력을 맞춰 보는 기준이 됩니다.',
  },
  diagnostics: {
    name: '진단',
    summary: '코드가 붙은 오류 클래스와, 출력이 나가기 전에 거치는 검증 단계입니다. 실수는 여기서 걸립니다.',
  },
  'emulated-f64': {
    name: 'f64 에뮬레이션',
    summary: 'f64가 없는 대상에서 쓰는 배정밀도입니다. f32 레인 두 개에 나눠 담아 계산합니다.',
  },
  variants: {
    name: '배리언트',
    summary: '기능 축을 모듈 한 계열로 다룹니다. 조합마다 컴파일하고 링크해서 프로그램을 냅니다.',
  },
  backends: {
    name: '백엔드',
    summary: '백엔드가 지켜야 하는 계약과 기능 모델, 그리고 대상마다 내장 함수를 어떤 이름으로 낼지 정하는 레지스트리입니다.',
  },
  tooling: {
    name: '도구',
    summary: '레지스트리 생성과 의미 비교, 출력 동일성 확인, 크기 측정에 쓰는 도구를 모았습니다.',
  },
  editor: {
    name: '편집기',
    summary: '편집기가 컴파일러에 묻는 것을 모았습니다. 소스 위치를 주면 진단과 자동 완성, 호버 설명이 나옵니다.',
  },
}

export const ko: Copy = {
  lang: 'ko',
  name: '한국어',
  skip: '본문으로 건너뛰기',

  meta: {
    title: 'TypeShade, 검증 가능한 TypeScript 셰이더 라이브러리',
    description: `파일 맨 위에 "use typeshade"를 쓰면 WebGPU용 WGSL과 WebGL2용 ${glsl}이 나옵니다. 같은 소스가 CPU에서 f64로 실행되어 출력을 대조할 수 있습니다.`,
    ogAlt: 'TypeShade: WebGPU와 WebGL2를 위한 하나의 셰이더 소스. 렌더링된 metaballs 셰이더.',
  },

  nav: {
    primary: '주요 메뉴',
    guide: '가이드',
    api: 'API',
    examples: '예제',
    github: 'GitHub',
    llms: 'llms.txt',
    languages: '언어',
    theme: '다크 모드 전환',
    menu: '메뉴',
    search: '검색',
    close: '닫기',
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
    labels: {
      nav: {
        use: 'TypeShade 사용하기',
        playground: 'Playground',
        language: '언어',
        api: 'API',
        examples: '예제'
      },
      languageGuide: '언어 가이드',
      internals: '컴파일러 내부 구조',
      concepts: 'TypeScript와 WebGPU',
      playground: 'Playground',
      sidebarGroups: {
        learn: '학습',
        language: '언어',
        internals: '컴파일러 내부',
        project: '프로젝트',
      },
      topics: {
        types: '타입',
        functions: '함수',
        controlFlow: '제어 흐름',
        gpuTypes: 'GPU 타입',
        resources: '리소스',
        stages: '셰이더 스테이지'
      }
    },
    introduction: '소개',
    authoring: '셰이더 작성',
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
    permalink: '제목 고정 링크',
    api: {
      // 영어 제목의 45자 하한과 짝을 맞추려 늘렸습니다(SEO 리뷰, onpage, 제목 길이).
      title: 'TypeShade API 참조: 함수, 타입, 인터페이스, 클래스',
      description: 'TypeShade의 공개 export를 하나씩 페이지로 정리했습니다. 구문, 매개변수, 반환값, 예제, 그리고 어느 대상에서 지원되는지를 담습니다.',
      h1: 'API 참조',
      intro: `typeshade 패키지가 내보내는 export를 모두 모았습니다. 커밋 ${facts.pinnedCommit}의 컴파일러에서 뽑았습니다. 함수, 타입, 인터페이스, 클래스마다 페이지가 하나씩 있습니다.`,
      reference: '참조',
      breadcrumbs: '현재 위치',
      // 영어와 같은 이유로 제목에 분류와 종류를 넣고, 60자 안에서 들어가는 만큼만 꾸밈말을 붙입니다.
      // 한글 음절은 로마자보다 스니펫에서 더 넓게 렌더링되므로(check-copy.ts의 1.35배 폭 예산과
      // ApiReferencePage.astro의 META_MAX가 로케일별로 다른 이유와 같음), 이 함수가 실제로 내는
      // 39-44자 제목은 리뷰가 영어 기준으로 잰 45자 하한보다 화면에서 좁지 않습니다. export 제목은
      // 그대로 두고, 훨씬 짧은 참조 인덱스와 분류 제목만 아래에서 늘렸습니다.
      pageTitle: (heading: string, kind: string, category: string) => {
        const variants = [
          `: TypeShade 셰이더 API의 ${category} 분류 ${kind} 참조 문서`,
          `: TypeShade API의 ${category} 분류 ${kind} 참조 문서`,
          `: TypeShade API의 ${category} 분류 ${kind} 참조`,
          `: TypeShade API ${category} 분류 ${kind}`,
          `: TypeShade API ${kind}`,
        ]
        const fitting = variants.find((suffix) => (heading + suffix).length <= 60)
        return fitting ? heading + fitting : heading
      },
      categoryTitle: (name: string) => `${name} 분류, TypeShade 셰이더 API 참조 문서`,
      categoryDescription: (name: string, summary: string) => `TypeShade API 참조의 ${name} 분류입니다. ${summary}`,
      // "~에 대한 TypeShade API 참조입니다"였던 접두어를 줄였습니다: 예제 요약(summary)은 컴파일러의
      // JSDoc 원문이라 영어이고, 접두어만 한글이라서 접두어가 길수록 문장 경계를 찾을 70-140자 구간이
      // 좁아져 단어 중간에서 잘리는 사례가 늘었습니다(SEO 리뷰, onpage, 설명 절단).
      pageDescription: (name: string, kind: string, category: string, summary: string) => `${name}, ${category} 분류 ${kind}입니다. ${summary}`,
      kindLine: (kind: string, category: string) => `${kind}, ${category} 분류`,
      note: `시그니처, 설명, 예제는 커밋 ${facts.pinnedCommit}의 컴파일러 소스에서 그대로 가져온 영어 원문입니다.`,
      syntax: '구문',
      parameters: '매개변수',
      returnValue: '반환값',
      exceptions: '예외',
      descriptionHeading: '설명',
      examples: '예제',
      example: '예제',
      targets: '대상별 지원',
      target: '대상',
      supportHeading: '지원',
      notes: '비고',
      constructor: '생성자',
      instanceProperties: '인스턴스 속성',
      instanceMethods: '인스턴스 메서드',
      inGuide: '관련 가이드',
      seeAlso: '함께 보기',
      source: '소스',
      optional: '선택 사항',
      readonly: '읽기 전용',
      deprecated: '지원 중단',
      previewNote: '템플릿 미리보기입니다. 이 페이지의 내용은 예시 데이터이고 컴파일러에서 가져온 것이 아닙니다.',
      line: (n: number) => `${n}행`,
      atCommit: (sha: string) => `커밋 ${sha} 기준`,
      members: (n: number) => `export ${n}개`,
      kindMeta: '종류',
      kinds: { function: '함수', constant: '상수', interface: '인터페이스', type: '타입', class: '클래스' },
      targetNames: { wgsl: 'WGSL (WebGPU)', glsl: `${glsl} (WebGL2)`, cpu: 'CPU 오라클' },
      support: { native: '지원', emulated: '에뮬레이션', stub: '스텁', none: '지원 안 함', 'n/a': '해당 없음' },
      categories: apiCategories,
    },
  },
  playground: {
    h1: 'Playground',
    intro: 'TypeShade TypeScript 파일을 작성하고 브라우저에서 컴파일한 뒤, 나온 WGSL과 진단을 확인하십시오.',
    fileName: 'hello.shade.ts',
    help: 'Monaco 편집기에서 TypeShade를 작성하고 여기서 컴파일합니다.',
    run: '컴파일',
    reset: '예제 복원',
    editor: 'TypeShade 소스',
    output: 'WGSL 출력',
    diagnostics: '진단',
    idle: '컴파일 대기 중',
    ready: '컴파일 성공',
    errors: '컴파일 오류',
    loading: '편집기를 불러옵니다',
    clean: '진단 없음.',
    noOutput: 'WGSL 출력이 없습니다.',
    directive: '파일 맨 위에 "use typeshade" 지시어를 쓰면 컴파일합니다.',
    unavailable: '편집기를 불러오지 못했습니다. 연결을 확인하고 페이지를 새로 고치십시오.',
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

  code: { copy: '클립보드로 복사', copied: '복사됨' },
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
    quickStartFile: '전체 파일, shader.ts',
    wgsl: 'WGSL로 나온 프래그먼트 진입점',
    glsl: `${glsl}으로 나온 프래그먼트 main`,
    print: '예제의 WGSL, GLSL, 리플렉션을 출력하는 명령',
    useTypeshade: 'hello.shade.ts',
  },

  front: {
    use: {
      eyebrow: 'TypeScript 개발 경험으로 작성하는 셰이더 언어',
      title: 'TypeShade',
      subtitle: '`"use typeshade"`에서 시작하세요.',
      tagline: 'TypeScript의 익숙한 타입, 함수, 모듈과 에디터 경험을 바탕으로 TypeShade만의 GPU 타입과 셰이더 의미론을 사용합니다. 하나의 소스에서 WGSL과 GLSL ES 3.00을 생성합니다.',
      getStarted: 'TypeShade 사용하기',
      playground: 'Playground에서 작성하기',
      learn: '왜 TypeShade인가',
      language: '언어 배우기',
      examples: '예제 보기',
      flowH: 'TypeShade는 이렇게 동작합니다',
      flowP: 'TypeScript 파일에 `"use typeshade"`를 선언하면 일반 애플리케이션 코드와 TypeShade 언어의 경계가 생깁니다.',
      flowLabels: ['TypeScript 저작', 'TypeShade 의미론', '공유 IR', 'WGSL / GLSL ES 3.00'],
      flowAriaLabel: 'TypeShade 컴파일 흐름',
      codeH: '첫 번째 TypeShade 프로그램',
      codeP: '작성하는 코드는 TypeScript처럼 보이지만, 컴파일러는 TypeShade의 타입과 GPU 의미론을 적용해 호스트가 사용할 셰이더를 생성합니다.',
      conceptsH: 'TypeScript를 알면 바로 이어집니다',
      conceptsP: 'TypeShade는 새로운 문법을 외우게 하기보다 TypeScript의 개념을 GPU 프로그램의 규칙으로 확장합니다. 아래 대응 관계부터 이해하면 문서의 나머지가 훨씬 쉬워집니다.',
      concepts: [['파일 지시어', '`"use typeshade"`', 'JavaScript의 directive prologue와 같은 파일 시작 위치를 사용하지만, TypeShade에서는 해당 파일을 셰이더 컴파일 단위로 선택합니다.'], ['타입', '타입 주석 → GPU 타입', '`number` 같은 애플리케이션 타입만 보는 대신 `f32`, `vec2`, `mat4` 같은 GPU 타입과 셰이더 연산 규칙을 정적으로 검사합니다.'], ['함수', '함수 → 엔트리 포인트', '일반 함수와 같은 선언·호출 모델을 유지하면서 `@vertex`, `@fragment` 같은 TypeShade 표면 문법으로 셰이더 스테이지를 지정합니다.'], ['모듈', 'import / export → shader module', 'TypeScript의 모듈 경계를 유지하되 컴파일러가 실제 셰이더로 내릴 수 있는 프로그램 그래프만 허용합니다.']],
      highlights: [
        ['TypeScript에서 출발합니다', '타입 주석, 함수, 모듈과 제어 흐름처럼 익숙한 언어 개념을 유지하면서 셰이더에 필요한 규칙은 정적으로 확인합니다.'],
        ['`use typeshade`가 언어 경계입니다', '`"use typeshade"`는 주석이나 런타임 호출이 아닙니다. 해당 파일을 TypeShade 프로그램으로 선택하고 TypeShade의 셰이더 의미론을 적용하는 언어 지시어입니다.'],
        ['GPU에 맞는 출력으로 내려갑니다', '같은 TypeShade 소스에서 WebGPU용 WGSL 또는 WebGL2용 GLSL ES 3.00을 생성합니다. 애플리케이션에 TypeShade 런타임을 배포할 필요가 없습니다.'],
      ]
    },
    hero: {
      before: '',
      accent: 'TypeShade',
      after: '',
      subtitle: '검증 가능한 TypeScript 셰이더 라이브러리',
      tagline: `파일 맨 위에 \`"use typeshade"\`를 씁니다. TypeShade가 WebGPU용 WGSL과 WebGL2용 ${glsl}을 냅니다. 같은 소스를 CPU에서 배정밀도로 실행해 기준값을 얻고, 컴파일러가 낸 결과를 그 값과 맞춰 봅니다.`,
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
      h: '작성한 파일과 그 WGSL',
      p: '`"use typeshade"`로 시작하는 파일과, 그 파일이 내보내는 WGSL입니다.',
      more: '[빠른 시작](quickStart)',
    },
    highlights: [
      {
        h: '소스 하나, 출력 둘',
        p: `\`"use typeshade"\`로 시작하는 파일에서 WebGPU용 WGSL과 WebGL2용 ${glsl}이 나옵니다. 저장소의 예제 ${facts.examples}개 가운데 ${facts.bothTargets}개가 파일 하나로 두 출력을 다 냅니다. 갤러리는 그래프 호출 [\`emitModule()\`](apiEmitModule)과 [\`emitGlslModule()\`](apiEmitGlsl)을 그대로 씁니다.`,
      },
      {
        h: 'CPU 결과와 대조',
        p: '같은 모듈을 CPU에서 f64로 실행하고, [테스트](checks)는 컴파일러의 산술을 그 결과와 맞춰 봅니다. 출력은 푸시할 때마다 Tint에서 컴파일하고 WebGL2에서 링크합니다.',
      },
      {
        h: '편집기에서 타입 검사',
        p: `유니폼 필드 이름을 잘못 쓰거나 반환 타입이 틀리면 편집기에서 바로 TypeScript 오류가 납니다. [\`reflect()\`](apiReflect)는 같은 중간 표현에서 바인드 그룹과 ${facts.layoutStandards.join('과 ')} 레이아웃을 읽어 옵니다.`,
      },
    ],
  },
  quickStart: {
    host: {
      hostH: '호스트 애플리케이션에 연결하기',
      boundaryH: 'TypeShade와 호스트의 경계',
      nextLearnH: '다음 학습',
      p0: '파일이 `"use typeshade"`로 시작하면 그 파일은 셰이더 컴파일 단위입니다. 아래 예제는 TypeShade의 실제 authoring surface입니다.',
      boundaryP: 'TypeShade 코드는 TypeScript처럼 작성하지만, `"use typeshade"`가 붙은 파일에서는 셰이더 언어 규칙이 적용됩니다. TypeScript 타입과 문법은 authoring surface를 만들고, TypeShade의 GPU 타입·리소스·shader stage 규칙이 실제 셰이더 의미를 결정합니다.',
      boundaryBullets: [
        '`"use typeshade"`가 언어 경계를 선언합니다.',
        'entry point의 GPU 입력은 `@builtin(...)` 같은 명시적인 매개변수로 표현합니다.',
        '`uniform<T>`와 `storage<T>` 같은 리소스 타입은 GPU 리소스의 의미를 표현합니다.'
      ],
      hostWgslLabel: '호스트가 WGSL을 소비하는 위치',
      hostP1: 'TypeShade는 렌더링 런타임이 아닙니다. TypeScript에서 셰이더를 작성하고 컴파일한 뒤, 호스트 애플리케이션이 생성된 WGSL 또는 GLSL ES 3.00 문자열을 WebGPU나 WebGL2에 넘깁니다.',
      hostP2: 'TypeShade가 담당하는 것은 언어 의미와 셰이더 코드 생성입니다. device, pipeline, bind group, buffer, texture, command encoder 같은 GPU 런타임 객체의 생성과 수명 관리는 호스트가 담당합니다.',
      nextLearnP: '이제 TypeScript에서 익숙한 개념을 TypeShade의 GPU 의미로 연결해 보세요.',
      nextLinks: [
        { linkKey: 'languageTypes', label: 'Types: 타입과 GPU struct' },
        { linkKey: 'languageFunctions', label: 'Functions: helper와 entry point' },
        { linkKey: 'languageControlFlow', label: 'Control flow: GPU 실행 흐름' },
        { linkKey: 'languageGpuTypes', label: 'GPU types: scalar, vector, matrix, array' },
        { linkKey: 'languageResources', label: 'Resources: uniform과 storage' },
        { linkKey: 'languageStages', label: 'Shader stages: compute, vertex, fragment' }
      ],
      nextLearnAllLink: '전체 Language Guide 보기'
    },
    title: 'TypeShade 빠른 시작: 설치와 첫 셰이더',
    description: 'TypeShade를 git 서브모듈로 추가한 뒤, "use typeshade"로 시작하는 파일을 컴파일합니다. 출시 전 상태도 함께 적었습니다.',
    h1: '빠른 시작',
    installH: '설치',
      p0: '파일이 `"use typeshade"`로 시작하면 그 파일은 셰이더 컴파일 단위입니다. 아래는 class와 스테이지 데코레이터가 붙은 함수로 작성한 첫 셰이더입니다.',
      p1: `TypeShade에는 함수 기반 작성 방식도 있습니다. 같은 패스를 class 대신 [\`fn\`](apiFn)과 [\`module()\`](apiModule)로 선언한 파일이며, import 문부터 WGSL을 내보내는 호출까지 ${quickStartFile.lines}줄입니다.`,
      p2: '실행하면 두 단계의 WGSL이 함께 나옵니다. 프래그먼트 진입점은 여기 있습니다.',
      p3: `같은 함수의 ${glsl} 단계와, [\`reflect()\`](apiReflect)가 복원한 유니폼 레이아웃은 [예제 페이지](examples)에 있습니다. 나머지 API는 [작성 가이드](guide)를 보면 됩니다.`,
    status: {
      h: '상태',
      p: `정식 출시 전입니다. 저장소는 ${facts.mirrorVersion} 버전이고, npm 이름 [typeshade](npm)는 ${facts.nextVersion} 출시용으로 잡아 두었습니다. 매니페스트와 import 이름은 그 태그에서 바뀝니다. 그때까지는 미러 저장소이며, 위 import는 서브모듈 안의 \`${quickStartFile.importPath}\`에서 해석됩니다. 이슈는 환영합니다. 다만 변경은 업스트림에 먼저 들어가고 이 트리는 그것을 fast-forward로 따라가기 때문에, 풀 리퀘스트는 아직 머지할 수 없습니다. ${facts.nextVersion} 소식은 [릴리스 구독](releases)으로 받을 수 있습니다.`,
    },
  },
  motivation: {
    use: {
      title: 'TypeShade란 무엇인가',
      description: 'TypeScript의 개발 경험에서 출발해 셰이더 언어로 확장되는 TypeShade와 use typeshade의 의미를 설명합니다.',
      h1: 'TypeScript에서 시작하는 셰이더 언어',
      sections: [
        ['TypeShade는 무엇을 바꾸나요?', 'TypeShade는 TypeScript 코드를 GPU에서 그대로 실행하는 런타임이 아닙니다. TypeScript의 익숙한 문법과 개발 도구를 출발점으로 삼고, GPU 프로그램에 필요한 타입과 의미론을 가진 별도의 컴파일 언어로 해석합니다.'],
        ['`use typeshade`는 언어 경계입니다', '`"use typeshade"`는 파일 수준에서 TypeShade 프로그램임을 선언합니다. 이 한 줄을 기준으로 컴파일러는 일반 애플리케이션 코드와 다른 TypeShade 셰이더 의미론을 적용합니다. 따라서 TypeShade를 처음 배울 때 가장 먼저 이해해야 하는 문법입니다.'],
        ['TypeScript에서 무엇이 그대로 익숙한가요?', '함수, 타입 주석, 모듈, 표현식과 제어 흐름처럼 이미 알고 있는 언어 개념이 TypeShade의 작성 경험을 구성합니다. 하지만 TypeScript의 모든 기능을 그대로 실행할 수 있다는 뜻은 아닙니다. TypeShade는 GPU 실행 모델에 맞지 않는 기능을 제한하고, 차이가 있는 곳을 정적 진단으로 드러냅니다.'],
        ['TypeScript와 TypeShade의 차이는 어디에 있나요?', 'TypeScript가 일반 프로그램의 타입과 실행을 설명한다면 TypeShade는 GPU 프로그램의 값, 벡터와 행렬, 리소스, 엔트리 포인트, 타깃별 제약까지 설명합니다. 같은 `function`이나 `if`를 보더라도 최종 프로그램은 GPU의 실행 모델을 따라야 합니다.'],
        ['컴파일 결과는 무엇인가요?', 'TypeShade 소스는 하나의 중간 표현으로 내려간 뒤 호스트가 사용할 셰이더 소스로 출력됩니다. 현재 WebGPU에는 WGSL을, WebGL2에는 GLSL ES 3.00을 생성합니다. 애플리케이션에는 TypeShade 런타임을 배포하지 않고 생성된 결과를 호스트가 소비합니다.'],
        ['어디서부터 배우면 되나요?', '처음이라면 Quick start에서 `"use typeshade"` 파일 하나를 만든 다음 Language guide에서 타입, 값과 표현식, 함수, 제어 흐름과 GPU 의미론을 순서대로 배우세요. 이미 컴파일러를 이해하고 있다면 그 다음에 Verification과 API reference로 내려가면 됩니다.']
      ],
      familiarH: 'TypeScript 지식이 출발점이 됩니다',
      familiarP: 'TypeShade는 익숙한 언어 개념을 버리지 않습니다. 대신 GPU에서 의미가 달라지는 지점을 명확하게 구분합니다.',
      rows: [
        ['함수', '함수 선언과 호출', '셰이더 함수와 엔트리 포인트 규칙이 추가됩니다.'],
        ['타입', '타입 주석과 추론', 'GPU-native 타입과 벡터·행렬 타입이 추가됩니다.'],
        ['모듈', 'import / export', '셰이더 컴파일 단위와 출력 가능한 모듈 규칙이 적용됩니다.'],
        ['제어 흐름', 'if / for 등의 문법', 'GPU 실행 모델과 타깃 제약을 만족해야 합니다.'],
        ['실행', 'JavaScript 런타임', '컴파일 결과를 WebGPU/WebGL2 호스트가 실행합니다.']
      ],
      furtherH: 'TypeScript와 JavaScript를 함께 참고하세요',
      furtherP: 'TypeShade 문서는 언어의 차이를 설명하는 데 집중합니다. 익숙하지 않은 TypeScript 또는 JavaScript 개념은 원문 문서를 함께 보면 더 빠르게 배울 수 있습니다.',
      further: [
        ['TypeScript Handbook — Everyday Types', 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html', '타입 주석, union, literal 등 TypeScript 타입의 기본 개념'],
        ['TypeScript Handbook — Functions', 'https://www.typescriptlang.org/docs/handbook/2/functions.html', '함수 선언, 매개변수, 반환 타입과 호출 규칙'],
        ['MDN — JavaScript Guide', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', 'JavaScript의 표현식, 제어 흐름, 함수와 모듈에 대한 언어 배경']
      ],
      columns: ['개념', 'TypeScript에서 익숙한 부분', 'TypeShade에서 추가되는 의미']
    },
    title: 'WebGPU와 WebGL2에 셰이더 소스 하나를 쓰는 이유, TypeShade',
    description: `TypeShade가 타입 있는 TypeScript 모듈 하나에서 WGSL과 ${glsl}을 내는 이유. 셰이더 언어 두 개를 유지하는 비용과 Khronos 설문 수치.`,
    h1: '왜 TypeShade인가',
    sections: [
      {
        h: '셰이더를 두 번 쓰는 문제',
        p: 'WebGL2와 WebGPU 양쪽에서 실행되어야 하는 셰이더는 두 번 써야 합니다. 두 언어는 타입, 진입점, 리소스 바인딩, 정밀도가 서로 달라서, 두 번째 셰이더는 사실상 처음부터 다시 쓰는 일입니다. 한쪽에만 들어간 수정은 다른 경로를 타는 기기에서야 드러나고, 리뷰어는 두 언어로 된 코드를 나란히 읽으면서 둘이 여전히 같은 일을 하는지 판단해야 합니다.',
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
        p: '공식 표면은 \`"use typeshade"\`로 시작하는 TypeScript 파일입니다. 잘못 쓴 필드나 틀린 반환 타입은 편집기에서 잡힙니다. 중간 표현 하나가 두 언어를 모두 내고, 같은 소스가 CPU에서 배정밀도로 실행되므로 백엔드가 낸 결과를 같은 소스로 계산한 기준값과 맞춰 볼 수 있습니다. 푸시마다 무엇을 실행하는지는 [검증 페이지](checks)에 있습니다. 갤러리용 그래프 API는 그대로 둡니다.',
      },
      {
        h: '하지 않는 일',
        p: 'TypeShade에는 렌더러도 씬 그래프도 없습니다. 문자열과 리플렉션 메타데이터를 돌려줄 뿐이고, 파이프라인 생성, 리소스 바인딩, 드로우 호출은 호스트의 몫입니다. SPIR-V, MSL, HLSL은 WGSL을 naga나 Tint에 넣어 얻습니다. 네이티브 호스트는 모두 Dawn이나 wgpu를 거쳐 WGSL을 이미 받기 때문입니다.',
      },
    ],
  },

  checks: {
    title: 'TypeShade 검증: CPU 오라클, 컴파일 게이트, 골든 파일',
    description: 'TypeShade의 CI가 푸시마다 실행하는 것: f64 CPU 오라클, Tint와 실제 WebGL2 컨텍스트에서 실행되는 컴파일 게이트, 출력마다의 골든 파일.',
    h1: '검증 방식',
    ciH: '푸시마다 하는 검사',
    intro: '저장소의 CI는 푸시와 풀 리퀘스트마다 [CI 워크플로](ciGates)에서 다음을 실행합니다.',
    items: [
      '같은 모듈을 f64 산술로 실행되는 CPU 함수로도 컴파일합니다. 이것이 기준값을 내는 오라클입니다. 기본 모드에서는 동등 비교만 먼저 f32로 반올림해 GPU와 맞추고, 연산마다 반올림하는 f32 모드는 따로 켭니다. 테스트는 이 함수를 알려진 답과 맞춰 보고, 생성된 JavaScript라는 두 번째 CPU 백엔드와도 맞춰 봅니다. 둘은 비트 단위로 같아야 합니다. 오라클은 드라이버의 반올림에 대해서는 아무것도 말해 주지 않습니다. 이 저장소에서는 GPU 출력을 오라클과 맞춰 보지 않습니다. [src/core/oracle.ts](oracle)',
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
      caption: `${err.wrongLine}행에서 잘못 읽은 필드, 그 줄이 내는 진단, 그리고 읽으려던 블록에 대해 [\`reflect()\`](apiReflect)가 복원한 ${std} 레이아웃입니다. 필드 ${err.layout.fields.length}개에 ${err.layout.size}바이트이고, 첫 필드 뒤의 빈 공간은 정렬 때문에 생긴 자리입니다.`,
    },
  },

  examples: {
    path: {
      h: '예제로 배우는 순서',
      p: '각 단계는 Language Guide의 한 개념을 실제 shader 작성으로 연결합니다.',
      steps: [
        {
          title: '1. 첫 shader',
          text: '"use typeshade" 파일의 기본 형태와 shader entry를 먼저 익힙니다.',
          label: 'Quick start',
          linkKey: 'quickStart'
        },
        {
          title: '2. 값과 타입',
          text: 'TypeScript의 type/class가 GPU value layout으로 어떻게 내려가는지 봅니다.',
          label: 'Types',
          linkKey: 'languageTypes'
        },
        {
          title: '3. 계산을 함수로',
          text: 'helper function과 stage entry를 조합해 실제 shader 계산을 구성합니다.',
          label: 'Functions',
          linkKey: 'languageFunctions'
        },
        {
          title: '4. GPU 데이터',
          text: 'vector, matrix, array와 host-owned resource를 연결합니다.',
          label: 'Resources',
          linkKey: 'languageResources'
        },
        {
          title: '5. 실제 예제',
          text: '저장소의 예제를 읽으며 여러 개념을 하나의 shader로 조합합니다.',
          label: 'Source examples',
          linkKey: 'examplesDir'
        }
      ]
    },
    title: `TypeShade 예제 ${facts.examples}개, GLSL 출력, 에뮬레이션 f64`,
    description: `TypeShade 예제 ${facts.examples}개와 그 결과를 표준 출력으로 내보내는 명령, gradient 패스의 ${glsl} 출력, 에뮬레이션 배정밀도의 딥 줌 데모.`,
    h1: '예제',
    intro: `저장소에는 실행할 수 있는 예제가 ${facts.examples}개 있습니다. 지도용 패스, ShaderToy 시절의 화면 공간 효과, 에뮬레이션 배정밀도 계열, 컴퓨트 커널 하나를 다룹니다. ${facts.fp64Examples}개는 에뮬레이션 배정밀도를 씁니다. 렌더링 가능한 예제는 [examples/index.ts](examplesIndex)가 내보내고, [예제 디렉터리](examplesDir)에서 둘러볼 수 있습니다.`,
    categories: { cartographic: '지도', generic: '화면 공간', compute: '컴퓨트' },
    columns: { example: '예제', category: '분류', blurb: '설명' },
    tableCaption: `아래 ${facts.examples}개 예제 가운데 ${facts.bothTargets}개는 WGSL과 ${glsl}을 모두 냅니다. ${facts.wgslOnlyExample.title}은 ${glsl}으로 낼 버텍스나 프래그먼트 단계가 없어서 표에 WGSL 전용으로 표시했습니다. WebGL2 경로는 옵션으로 켜는 에뮬레이션입니다.`,
    wgslOnly: 'WGSL 전용',
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
    printIntro: '저장소를 받아 둔 디렉터리에서 실행합니다. 첫 번째 명령은 모든 예제의 WGSL, GLSL, 리플렉션을 출력하고, 두 번째는 id로 하나만 출력합니다.',
    glsl: {
      h: `gradient 패스의 ${glsl} 출력`,
      p1: `첫 페이지에는 \`"use typeshade"\`로 시작하는 파일이 있습니다. 갤러리 패스 \`${hero.file}\`는 이 ${glsl} \`main\`을 그대로 냅니다.`,
      p2: `모듈 전체는 WGSL로 ${hero.emit.wgslLines}줄이고, GLSL은 버텍스 단계 ${hero.emit.glslVertexLines}줄, 프래그먼트 단계 ${hero.emit.glslFragmentLines}줄입니다. 유니폼 타입, 바이트 오프셋, 바인드 그룹 항목, 진입점 시그니처는 [\`reflect()\`](apiReflect)에서 나옵니다. reflect()는 같은 중간 표현을 읽지만 출력 경로에는 관여하지 않으므로, 호스트는 그 레이아웃대로 유니폼 버퍼를 채우면 됩니다. [검증 페이지](checks)에는 유니폼 블록의 복원된 레이아웃이 잘못 쓴 필드의 진단과 나란히 있습니다.`,
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
    referenceTableHeading: '참조 표',
    note: `커밋 ${facts.pinnedCommit}의 [AUTHORING.md](guideSource)를 한국어로 옮긴 것입니다. 패키지는 ${facts.nextVersion}에서 쓸 \`typeshade\`라는 이름으로 가져옵니다.`,
    noteUntranslated: `커밋 ${facts.pinnedCommit}의 [AUTHORING.md](guideSource)를 그대로 옮긴 것으로, 이 절의 본문은 아직 영어입니다. 패키지는 ${facts.nextVersion}에서 쓸 \`typeshade\`라는 이름으로 가져옵니다.`,
  },

  // The language guide: src/components/pages/LanguagePage.astro and the Language*Page.astro topic pages.
  language: {
    overview: {
      title: 'TypeShade 언어 가이드',
      description: 'TypeScript 개발자가 TypeShade의 문법과 GPU 의미론을 예제와 함께 단계적으로 배우고, JavaScript와 달라지는 실행 규칙까지 이해하는 언어 가이드입니다.',
      h1: 'TypeShade 언어 가이드',
      intro: 'TypeShade를 문법 목록으로 외우기보다, 이미 알고 있는 TypeScript 개념에서 출발해 GPU에서 그 개념이 어떻게 달라지는지 이해하세요. 각 항목은 문법, 의미, 작은 예제, 실제 shader 사용 순서로 읽는 것을 권장합니다.',
      boundaryH: '1. 먼저 `use typeshade`를 이해하기',
      boundaryP: '`"use typeshade"`는 단순한 문자열이 아니라 파일의 언어 경계를 선언합니다. 이 파일에서는 TypeScript의 익숙한 작성 표면을 사용하면서도 TypeShade의 타입, resource, stage, builtin 규칙을 적용합니다.',
      boundaryNote: '파일의 첫 directive를 보면 이 코드가 일반 TypeScript 모듈과 같은 방식으로 해석되지 않는다는 것을 알 수 있습니다.',
      syntaxH: '2. TypeScript 문법은 출발점입니다',
      syntaxP: '변수, 함수, type alias, class, 조건문, 반복문 같은 표면은 TypeScript 개발자에게 익숙합니다. 그러나 shader는 JavaScript 프로그램처럼 실행되지 않습니다. 컴파일러가 GPU 코드로 내릴 수 있는 값과 연산만 TypeShade 프로그램의 의미를 가집니다.',
      syntaxTableHeader1: 'TypeScript 개념',
      syntaxTableHeader3: '달라지는 의미',
      syntaxTableRows: [
        ['function', 'helper / entry', 'GPU에서 실행 가능한 함수가 됩니다.'],
        ['type', 'GPU value shape', '허용되는 GPU 값과 layout을 기준으로 검사합니다.'],
        ['class', 'GPU struct', 'runtime object가 아니라 데이터 layout을 표현합니다.'],
        ['if / for', 'GPU control flow', 'JavaScript runtime 전체가 아니라 컴파일 가능한 흐름입니다.']
      ],
      gpuH: '3. GPU 개념은 소스에 드러납니다',
      gpuP: 'TypeShade의 중요한 차이는 GPU 인터페이스를 숨기지 않는다는 점입니다. resource는 `declare`로, stage는 decorator가 붙은 top-level function으로, builtin 입력은 `@builtin(...)` parameter로 표현합니다.',
      gpuNote: '여기서 `camera`와 `pixels`는 shader가 생성하지 않습니다. `gid` 역시 전역 변수로 주입되지 않고 함수 입력으로 선언됩니다.',
      functionH: '4. 함수는 값의 흐름을 설명합니다',
      functionP: 'TypeScript에서 parameter와 return type이 함수의 계약을 설명하듯 TypeShade에서도 함수 시그니처가 값의 흐름을 설명합니다. 여기에 stage와 builtin이라는 shader-specific 의미가 추가됩니다.',
      functionNote: '`addBias`는 재사용 가능한 helper이고 `paint`는 compute entry입니다. 같은 함수 문법을 사용하지만 pipeline에서 맡는 역할은 다릅니다.',
      resourceH: '5. Resource는 호스트와의 경계입니다',
      resourceP: '`uniform<T>`와 `storage<T>`는 JavaScript 객체가 아니라 호스트가 제공하는 GPU resource입니다. `declare`는 shader가 그 값을 생성하지 않는다는 사실을 코드에 남깁니다.',
      resourceNote: '`const`와 `let`은 여기서 단순한 변수 스타일이 아니라 resource 접근 모드와 연결됩니다.',
      stageH: '6. Entry function은 pipeline의 시작점입니다',
      stageP: '`@vertex`, `@fragment`, `@compute`는 함수가 어느 shader stage의 entry인지 선언합니다. builtin은 자동으로 생기는 전역 변수가 아니라 entry parameter로 받아야 합니다.',
      completeH: '7. 하나의 shader로 합쳐 보기',
      completeP: '아래 코드를 한 줄씩 읽어 보세요. language directive에서 시작해 GPU struct, resource, compute stage, builtin parameter가 하나의 프로그램 계약으로 연결됩니다.',
      tsH: '8. TypeScript에서 가져온 것과 바뀐 것',
      tsNote: '즉 TypeShade는 TypeScript 문법을 복제하는 언어가 아니라 TypeScript의 authoring 경험을 GPU 언어의 의미론에 연결하는 언어입니다.',
      refsH: '9. 다음에 읽을 자료',
      refsP: 'TypeShade의 개념을 처음 배울 때는 TypeScript의 타입과 함수 문서를 함께 읽고, JavaScript의 실행 모델을 확인한 뒤 GPU 개념으로 넘어가면 이해가 빠릅니다.',
      nextH: '10. 학습 순서',
      nextP: 'Quick start에서 실행 가능한 첫 파일을 만든 뒤 Types, Functions, Control flow, GPU types, Resources, Shader stages 순서로 확장하세요.',
      nextLink: 'Quick start'
    },
    topics: {
      types: {
        title: 'TypeShade 타입',
        description: 'TypeScript의 type과 class 개념을 TypeShade의 GPU 값, struct, 필드 layout과 연결하는 방법을 설명합니다.',
        h1: 'Types: TypeScript 타입에서 GPU 값으로',
        intro: 'TypeShade는 TypeScript의 타입 표면을 출발점으로 삼지만 타입의 최종 의미는 GPU 값 모델에 있습니다. 먼저 TypeScript의 structural typing과 type alias를 이해하고, GPU layout metadata가 필요한 경우 class와 field decorator를 사용합니다.',
        ts: 'TypeScript에서 출발하기',
        tsP: 'Type alias는 값의 shape를 이름 붙이는 방법입니다. TypeShade에서도 이 표면을 유지하지만, 사용 가능한 타입과 표현식은 shader semantics가 결정합니다.',
        alias: '1. 타입 별칭은 plain data에 사용',
        aliasP: '필드에 decorator가 필요 없다면 type alias가 가장 단순한 표현입니다. 여러 함수의 인자나 반환값에서 같은 GPU value shape를 공유할 때도 유용합니다.',
        struct: '2. class는 GPU struct',
        structP: 'class는 JavaScript 객체를 만드는 런타임 클래스가 아닙니다. TypeShade에서는 GPU struct와 필드 metadata를 표현하는 authoring surface입니다.',
        attrs: '3. 필드 decorator는 레이아웃을 설명',
        attrsP: '현재 surface에서 `@location`, `@builtin`, `@align`, `@size`, `@offset`, `@interpolate`, `@ignore`를 class field에 사용할 수 있습니다. decorator는 TypeScript의 일반적인 객체 metadata가 아니라 shader layout 의미를 부여합니다.',
        boundary: '4. TypeScript의 class와 다른 점',
        boundaryItems: ['`new`로 GPU struct를 생성하지 않습니다.', '`extends`와 일반적인 상속 모델을 사용하지 않습니다.', 'entry point를 class method로 만들지 않습니다.', '필드 metadata가 필요하지 않다면 type alias가 더 명확합니다.'],
        mapping: '5. 개념 대응표',
        mappingRows: [['TypeScript', 'TypeShade'], ['type alias / object shape', 'GPU value shape'], ['class fields', 'GPU struct fields'], ['decorator metadata', 'GPU layout / stage metadata'], ['runtime object', '해당하지 않음'], ['structural compatibility', 'shader 타입 검사 범위에서 적용']],
        example: '6. 실제 entry point와 연결하기',
        exampleP: 'struct를 정의한 뒤 entry point 매개변수에서 사용할 수 있습니다. 이때 값의 shape와 field metadata가 shader 입력의 의미를 결정합니다.',
        next: '다음: Functions'
      },
      functions: {
        title: 'TypeShade 함수',
        description: 'TypeScript 함수에서 출발해 TypeShade helper, shader entry, parameter, return type, builtin과 stage metadata를 이해하는 상세 가이드.',
        h1: 'Functions: TypeScript 함수에서 GPU 함수로',
        intro: 'TypeShade에서 함수는 계산을 이름 붙이고 입력과 출력을 명확하게 만드는 기본 단위입니다. TypeScript에서 함수를 읽는 방법을 그대로 출발점으로 삼되, `"use typeshade"` 파일에서는 함수가 GPU IR로 내려갈 수 있는 계산이어야 한다는 차이를 이해해야 합니다.',
        anatomy: '1. 함수의 구조',
        anatomyP: '함수는 이름, parameter 목록, return type, body로 구성됩니다. TypeShade는 이 익숙한 구조를 유지하면서 parameter와 return type에 GPU 의미를 부여합니다.',
        anatomyNote: '여기서 <code>value</code>는 입력 parameter이고 <code>f32</code>는 입력과 결과의 GPU 타입입니다. <code>return</code>은 함수가 계산한 값을 호출자에게 돌려줍니다.',
        params: '2. Parameter와 return type',
        paramsP: 'parameter는 함수가 읽는 입력이고 return type은 계산 결과의 GPU value shape를 설명합니다. 타입은 단순한 문서가 아니라 컴파일러가 표현식의 유효성을 판단하는 정보입니다.',
        paramsTable: [['부분', '역할'], ['<code>a</code>, <code>b</code>', 'GPU 입력 값입니다.'], ['<code>amount: f32</code>', '스칼라 입력이며 컴파일러가 연산 타입을 확인합니다.'], ['<code>: vec4</code>', '호출자에게 반환할 GPU 값의 shape입니다.']],
        helper: '3. Helper function',
        helperP: 'stage decorator가 없는 top-level function은 다른 shader 함수에서 호출할 수 있는 helper입니다. 반복되는 계산을 이름 있는 함수로 분리하면 shader를 읽고 검증하기 쉬워집니다.',
        helperNote: 'helper는 pipeline entry가 아니므로 stage decorator가 없습니다. 이 구조는 계산을 작은 단위로 나누고 entry의 역할을 읽기 쉽게 만듭니다.',
        call: '4. 함수 호출',
        callP: '함수 호출은 일반적인 TypeScript 호출처럼 보이지만 호출 대상과 argument는 TypeShade의 GPU 타입 체계에 속해야 합니다. 일반 JavaScript API를 호출한다고 생각하면 안 됩니다.',
        callNote: '호출은 일반 함수 호출처럼 보이지만, `addBias`의 입력과 반환값은 TypeShade가 이해하는 GPU 타입이어야 합니다.',
        entry: '5. Shader entry function',
        entryP: 'pipeline이 실행을 시작하는 함수는 top-level `export function`에 stage decorator를 붙여 선언합니다. `@compute`, `@vertex`, `@fragment`가 각각 GPU 실행 단계와 연결됩니다.',
        entryNote: '`export`는 TypeScript module 개념과 함께 entry를 compiler가 발견할 수 있게 합니다. stage decorator는 그 exported function이 어느 pipeline stage인지 추가로 설명합니다.',
        builtin: '6. Builtin은 parameter로 받습니다',
        builtinP: 'GPU가 제공하는 stage input은 숨겨진 전역 변수가 아니라 함수 signature에 명시합니다. 이렇게 하면 함수의 입력이 코드만 읽어도 드러나고 helper와 entry의 경계도 분명해집니다.',
        builtinTable: [['표현', '의미'], ['<code>@builtin("global_invocation_id")</code>', 'GPU가 제공하는 compute 입력을 지정합니다.'], ['<code>gid: vec3u</code>', '그 입력의 TypeShade 타입과 local 이름입니다.'], ['<code>gid.x</code>', '현재 invocation의 x component를 읽습니다.']],
        compute: '7. Compute entry를 읽는 법',
        computeP: '`@compute([64, 1, 1])`는 workgroup 크기를 선언하고, `gid`는 `global_invocation_id` builtin을 받는 parameter입니다. `gid.x`를 통해 현재 invocation의 x 좌표를 읽습니다.',
        computeNote: '이 함수를 읽을 때는 먼저 stage와 workgroup 크기를 보고, 다음으로 parameter를 통해 어떤 GPU 입력이 들어오는지 확인한 뒤 body에서 계산을 따라가면 됩니다.',
        graphics: '8. Vertex와 fragment entry',
        graphicsP: 'vertex와 fragment도 같은 함수 모델을 사용합니다. stage decorator가 실행 단계를 결정하고 parameter와 return type이 pipeline interface를 설명합니다.',
        graphicsNote: 'vertex의 `vid`와 `vin`은 서로 다른 입력입니다. 하나는 GPU builtin이고 다른 하나는 사용자 정의 struct 입력입니다. fragment의 `pid` 역시 signature에 명시되어 있으므로 함수만 읽어도 필요한 입력을 알 수 있습니다.',
        scope: '9. 함수와 scope',
        scopeP: '함수 안의 local variable은 호출마다 계산되는 값입니다. resource나 stage builtin처럼 함수 바깥에서 제공되는 값과 local 값을 구분해서 읽어야 합니다.',
        scopeNote: '`factor`는 함수 안에서만 존재하는 local value입니다. 반대로 `camera`나 `pixels` 같은 resource는 host와 연결된 shader interface이며, builtin parameter는 GPU stage가 제공하는 입력입니다.',
        boundary: '10. TypeScript 함수와의 차이',
        boundaryItems: ['임의의 JavaScript runtime API를 호출하지 않습니다.', '동적 객체 생성과 일반적인 runtime side effect를 shader 계산으로 가정하지 않습니다.', 'entry point는 class method가 아니라 top-level exported function입니다.', 'builtin은 implicit global이 아니라 명시적인 parameter입니다.', 'parameter와 return type은 GPU value semantics에 맞아야 합니다.'],
        example: '11. 작은 함수에서 실제 entry까지',
        exampleP: '아래 예제는 helper가 계산을 담당하고 entry가 builtin과 resource를 연결하는 전형적인 구조입니다.',
        exampleNote: '이 예제의 핵심은 함수 자체보다 경계입니다. `addBias`는 재사용 가능한 계산이고, `paint`는 stage와 builtin을 선언하면서 실제 GPU invocation과 resource를 연결합니다.',
        next: '다음: Control flow'
      },
      controlFlow: {
        title: 'TypeShade 제어 흐름',
        description: 'TypeScript에서 익숙한 조건문과 반복문의 개념을 TypeShade의 GPU 실행 모델로 연결하고, 실제 셰이더에서 컴파일 가능한 분기와 반복을 안전하게 작성하는 방법을 단계적으로 설명합니다.',
        h1: 'Control flow: 익숙한 흐름, 명시적인 GPU 실행',
        intro: 'TypeShade는 TypeScript의 조건문과 반복문 표면을 활용하지만, 코드는 GPU에서 실행됩니다. 따라서 JavaScript runtime의 동적 동작이 아니라 컴파일 가능한 계산을 기준으로 제어 흐름을 이해해야 합니다.',
        ts: '1. TypeScript의 흐름에서 출발하기',
        tsP: 'if/else와 for 같은 구문은 익숙하지만, TypeShade에서는 각 조건식과 반복식이 GPU 코드로 낮아질 수 있어야 합니다. 문법이 같다는 것이 JavaScript runtime semantics 전체를 가져온다는 뜻은 아닙니다.',
        branch: '2. 조건 분기',
        branchP: 'if/else는 계산 경로를 표현합니다. 분기 안에서도 TypeShade가 이해하는 값과 resource만 사용합니다.',
        loop: '3. 반복',
        loopP: '반복문은 GPU에서 컴파일 가능한 형태로 사용합니다. 배열 길이나 런타임 객체를 기준으로 동적으로 실행 구조를 바꾸는 JavaScript 패턴은 피합니다.',
        boundary: '4. JavaScript와의 경계',
        boundaryItems: ['동적 배열 메서드로 실행 길이를 바꾸는 패턴은 사용하지 않습니다.', '클로저와 일반 runtime 객체에 의존하지 않습니다.', '조건과 반복은 GPU에서 계산 가능한 값과 범위로 제한합니다.', 'TypeScript에서 유효한 제어 흐름이라고 해서 TypeShade shader semantics에서도 자동으로 유효한 것은 아닙니다.'],
        next: '다음: GPU types'
      },
      gpuTypes: {
        title: 'TypeShade GPU 타입',
        description: 'TypeScript의 타입 표면과 TypeShade의 scalar, vector, matrix, array GPU 값을 연결하는 방법을 설명합니다.',
        h1: 'GPU types: TypeScript 표면에서 GPU 값으로',
        intro: 'TypeShade의 타입은 TypeScript 문법으로 작성하지만 TypeScript의 모든 런타임 값 타입을 그대로 가져오지는 않습니다. 이 페이지에서는 GPU에서 실제 계산되는 값의 종류를 중심으로 봅니다.',
        mapping: '1. TypeScript 타입과 GPU 타입의 관계',
        mappingP: 'TypeScript의 `number`처럼 넓은 런타임 타입을 그대로 shader 값으로 취급하기보다 `f32`, `i32`, `u32`처럼 GPU 표현을 명시합니다. `vec*`, `mat*`도 JavaScript 객체가 아니라 GPU arithmetic value입니다.',
        scalar: '2. Scalar',
        scalarP: '단일 숫자 값은 GPU scalar 타입으로 표현합니다. 리소스와 struct field의 타입을 명시할 때 사용합니다.',
        vector: '3. Vector',
        vectorP: 'vec2, vec3, vec4는 여러 scalar 값을 하나의 GPU 값으로 묶습니다. shader 계산과 vertex/fragment 데이터에서 자주 사용합니다.',
        matrix: '4. Matrix',
        matrixP: 'mat4 같은 matrix 타입은 변환 계산에 사용합니다. TypeScript 객체가 아니라 GPU arithmetic value입니다.',
        arrays: '5. Arrays',
        arraysP: 'array는 여러 GPU 값을 하나의 타입으로 표현합니다. resource element type과 함께 사용하면 host가 제공하는 buffer shape를 명확하게 설명할 수 있습니다.',
        next: '다음: Resources'
      },
      resources: {
        title: 'TypeShade 리소스',
        description: 'TypeScript의 선언과 타입 표면에서 출발해 uniform과 storage 리소스의 GPU 의미와 호스트 계약을 이해합니다.',
        h1: 'Resources: TypeScript 선언에서 GPU 리소스로',
        intro: 'TypeShade resource는 셰이더가 소유하는 JavaScript 객체가 아니라 호스트가 채우는 binding slot입니다. 제품 코드에서는 `declare`로 이 경계를 명시합니다.',
        mapping: '1. TypeScript 선언과 대응하기',
        mappingP: 'TypeScript의 `declare`가 런타임 값을 만들지 않고 타입 수준의 존재를 설명하듯, TypeShade의 `declare`는 호스트가 제공하는 GPU resource를 소스에 표현합니다. 다만 TypeShade에서는 `uniform<T>`와 `storage<T>`가 GPU 메모리 의미까지 지정합니다.',
        decl: '2. `declare`로 resource 선언',
        declP: 'initializer 없이 resource의 타입과 접근 권한을 선언합니다.',
        access: '3. const와 let은 접근 권한을 나타냅니다',
        accessP: 'uniform은 읽기 전용이므로 `declare const`만 허용됩니다. storage는 `const`면 read-only, `let`이면 read-write입니다.',
        slots: '4. binding 순서와 호스트 계약',
        slotsP: 'resource slot은 파일의 declare 순서와 연결됩니다. 실제 binding 번호를 코드에 흩뿌리기보다 컴파일러와 호스트의 reflection 결과를 계약으로 사용하는 방향이 기본입니다.',
        invalid: '5. 자주 하는 실수',
        invalidItems: ['`declare const x: f32`처럼 `uniform<T>`나 `storage<T>` 없이 선언하지 않습니다.', '`declare let x: uniform<T>`는 허용되지 않습니다.', 'read-only resource에 대입하지 않습니다.', 'resource를 class의 bind group처럼 모델링하지 않습니다.'],
        next: '다음: Shader stages'
      },
      stages: {
        title: 'TypeShade 셰이더 스테이지',
        description: 'TypeScript 함수와 모듈 개념에서 출발해 compute, vertex, fragment entry point와 명시적인 builtin parameter를 이해합니다.',
        h1: 'Shader stages: GPU 실행 지점을 명시하기',
        intro: 'TypeShade의 entry point는 class가 아니라 top-level exported function입니다. decorator가 함수의 shader stage와 필요한 metadata를 표시합니다.',
        mapping: '1. TypeScript 함수와 모듈에서 출발하기',
        mappingP: 'TypeScript에서 `export function`은 모듈의 공개 함수입니다. TypeShade에서는 여기에 stage decorator를 더하면 pipeline entry point라는 GPU 의미가 생깁니다. decorator가 없는 함수는 재사용 가능한 helper로 남습니다.',
        compute: '2. Compute',
        computeP: '`@compute`는 workgroup 크기를 함께 표현합니다. `global_invocation_id` 같은 compute builtin은 암시적 전역 변수가 아니라 명시적인 함수 parameter로 받습니다.',
        graphics: '3. Vertex와 fragment',
        graphicsP: '`@vertex`와 `@fragment`는 그래픽스 pipeline의 entry point를 표현합니다. 입력과 출력은 TypeShade value type과 명시적인 builtin parameter로 선언합니다.',
        helper: '4. Helper function',
        helperP: 'decorator가 없는 함수는 entry가 아니라 helper입니다. entry point를 class method로 만들거나 `this`를 pipeline 객체로 취급하지 않습니다.',
        next: '언어 개요로 돌아가기'
      }
    }
  },

  notFound: {
    title: '페이지를 찾을 수 없음, TypeShade',
    description: 'typeshade.dev의 이 주소에는 아무것도 없습니다.',
    h1: '이 주소에는 아무것도 없습니다.',
    p: '페이지가 옮겨졌을 수 있습니다. 첫 페이지와 작성 가이드는 그대로 있습니다.',
    links: '[첫 페이지로 돌아가거나](home) [작성 가이드](guide)를 읽어 보십시오.',
  },
}
