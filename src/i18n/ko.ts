// Korean copy. Typed against the English source, so a string that exists in one and not
// the other is a build error. Numbers come from the build, as in en.ts. scripts/check-copy.ts
// compares every string with its English one: the same numerals, links and code, no
// translation tells, and no label wider than the English label it replaces.
import type { Copy } from './index.ts';
import { exampleFile, facts, hero, quickStartFile } from '../lib/examples.ts';
import { typedError } from '../lib/typed-error.ts';

const glsl = facts.glslTarget;
const err = typedError();
const std = facts.layoutStandards[0];
const split = facts.splitLabels ?? ['f32', 'f64'];

// 작성 가이드의 절마다 한국어 제목과 설명. 키는 로더가 제목에서 만든 id입니다. 본문은
// 영어 원문 그대로이므로, 사이드바와 페이지 제목과 설명만 한국어로 둡니다.
const sections: Record<string, { title: string; description: string }> = {
  'your-first-shader': {
    title: '첫 셰이더',
    description: `TypeScript로 진입점 두 개짜리 셰이더 모듈을 쓰고 WGSL과 ${glsl}로 출력합니다. 어느 호출이 어느 문자열을 냈는지도 알게 됩니다.`,
  },
  'values-and-mutation': {
    title: '값과 변경',
    description:
      '중간 값을 쓰고 필요한 곳에만 타입을 붙이며, 그 값을 바꾸고, 어떤 값이 자기 이름을 따로 가져야 하는지 가리는 법을 익힙니다.',
  },
  'functions-and-entry-points': {
    title: '함수와 진입점',
    description:
      '헬퍼 함수를 선언해 다른 함수에서 부르고, 어느 스테이지든 진입점을 쓰고, 그 함수들을 모두 담는 모듈을 선언하는 법을 익힙니다.',
  },
  'control-flow': {
    title: '제어 흐름',
    description:
      '셰이더 본문 안에서 분기하고 반복하고 디스패치하는 법을 익히고, 문장 형태의 제어 흐름과 값 형태의 제어 흐름을 서로 구분합니다.',
  },
  'layouts-and-resources': {
    title: '레이아웃과 리소스',
    description:
      '버텍스, 유니폼, 스토리지, 텍스처 레이아웃을 한 번만 선언하고, 그 선언 하나에서 모든 필드를 읽어 두 타깃에 그대로 쓰는 법을 익힙니다.',
  },
  'emitting-and-reflection': {
    title: '출력과 리플렉션',
    description:
      '모듈을 WGSL로, GLSL 두 스테이지로, 또는 호스트가 조합하는 조각으로 바꾸고, 호스트가 바인딩에 쓰는 파이프라인 메타데이터를 읽습니다.',
  },
  'the-cpu-oracle': {
    title: 'CPU 오라클 안내서',
    description:
      '모듈을 CPU에서 배정밀도로 실행하고, 거기서 나온 숫자를 GPU가 낸 값과 비교해 컴파일러의 출력을 검증하는 법을 익힙니다.',
  },
  diagnostics: {
    title: '진단',
    description:
      '코드가 붙은 오류를 읽고 그 코드로 분기하며, 모듈의 모든 실패를 보고서 하나로 받고, 오류가 난 TypeScript 줄을 출력합니다.',
  },
  'conditional-programs': {
    title: '조건부 프로그램',
    description:
      '소스 하나에서 여러 프로그램 중 무엇을 만들지 정하고, 배리언트가 상수 하나로 끝나는 경우를 가려내며, 선택을 호스트에 넘깁니다.',
  },
  'capabilities-extensions': {
    title: '기능과 확장',
    description:
      '모듈에 필요한 GPU 기능을 선언하고, 대상마다 그 기능이 무엇을 요구하는지 읽고, 출력 전에 부팅된 장치를 그 선언과 대조합니다.',
  },
  fp64: {
    title: 'fp64',
    description:
      '셰이더 안에 배정밀도 값을 선언하고, f64가 지원하는 연산이 무엇인지 알고, 에뮬레이션에 필요한 가드 텍스처를 바인딩하는 법을 익힙니다.',
  },
  'glsl-float-precision': {
    title: 'GLSL 부동소수점 정밀도',
    description:
      'GLSL 스테이지를 언제 mediump로 출력할지, 그 옵션 하나가 출력된 소스에서 무엇을 바꾸고 무엇을 그대로 두는지 압니다.',
  },
  'production-emit': {
    title: '프로덕션 출력',
    description:
      '배포 시점 변환을 출력 호출 하나로 조합하고, 이름이 바뀐 셰이더 텍스트로 돌아온 드라이버 로그를 원래 이름으로 되돌려 읽습니다.',
  },
  'raw-statements': {
    title: '원시 문장',
    description:
      '손으로 쓴 문장을 모듈에 그대로 끼워 넣는 법과, 그 문장이 WGSL과 GLSL 각 타깃에서 무엇을 포기하게 하는지 알아봅니다.',
  },
  'migrating-a-glsl-shader': {
    title: 'GLSL 셰이더 옮기기',
    description:
      '눈앞의 GLSL 구문을 DSL에서 어떻게 쓰는지 표에서 찾고, 그 표기가 WGSL과 GLSL 각 타깃에서 무엇으로 바뀌는지 확인합니다.',
  },
};

// 참조의 분류 이름과 한 줄 설명입니다. 키는 추출기가 정한 슬러그이고, 하나라도 빠지면
// assertApiCategories()가 그 슬러그를 알려 주며 빌드를 세웁니다.
const apiCategories: Record<string, { name: string; summary: string }> = {
  authoring: {
    name: '작성',
    summary:
      '셰이더를 쓰는 빌더입니다. 모듈과 함수, 변수, 제어 흐름을 여기 있는 호출로 선언합니다.',
  },
  builtins: {
    name: '내장 함수',
    summary:
      '셰이더에서 부르는 수학, 벡터, 텍스처 함수입니다. 이름 하나로 두 대상 모두에 나갑니다.',
  },
  values: {
    name: '값',
    summary: '리터럴과 타입이 붙은 참조, 그리고 자바스크립트 값을 노드로 바꾸는 생성자입니다.',
  },
  types: {
    name: '타입',
    summary:
      '작성 API에 타입을 붙이는 타입 키와 타입 기술자입니다. 셰이더 값의 형태가 여기서 정해집니다.',
  },
  ir: {
    name: 'IR',
    summary:
      '모든 백엔드가 읽는 중간 표현입니다. 노드와 문장과 선언이 들어 있고, 출력은 모두 여기서 나옵니다.',
  },
  layout: {
    name: '레이아웃',
    summary:
      '구조체와 바인딩 리소스를 한 번만 선언하는 선언자입니다. 호스트와 두 대상이 같은 선언을 씁니다.',
  },
  emit: {
    name: '출력',
    summary: `WGSL과 ${glsl}을 쓰는 출력기와 모듈 조각, 그리고 그 앞에서 실행되는 패스입니다.`,
  },
  'reflection-api': {
    name: '리플렉션',
    summary:
      'reflect()가 모듈에서 복원해 내는 것들입니다. 바인드 그룹과 바이트 레이아웃, 진입점이 여기 있습니다.',
  },
  'cpu-oracle': {
    name: 'CPU 오라클',
    summary:
      '모듈을 f64로 실행하는 CPU 백엔드입니다. 여기서 나온 값이 GPU 출력을 맞춰 보는 기준이 됩니다.',
  },
  diagnostics: {
    name: '진단',
    summary:
      '코드가 붙은 오류 클래스와, 출력이 나가기 전에 거치는 검증 단계입니다. 실수는 여기서 걸립니다.',
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
    summary:
      '백엔드가 지켜야 하는 계약과 기능 모델, 그리고 대상마다 내장 함수를 어떤 이름으로 낼지 정하는 레지스트리입니다.',
  },
  tooling: {
    name: '도구',
    summary: '레지스트리 생성과 의미 비교, 출력 동일성 확인, 크기 측정에 쓰는 도구를 모았습니다.',
  },
  editor: {
    name: '편집기',
    summary:
      '편집기가 컴파일러에 묻는 것을 모았습니다. 소스 위치를 주면 진단과 자동 완성, 호버 설명이 나옵니다.',
  },
};

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
        reference: '참조',
        examples: '예제',
      },
      languageGuide: '언어 가이드',
      languageReference: '언어 참조',
      internals: '컴파일러 내부 구조',
      concepts: 'TypeScript와 WebGPU',
      languageService: '언어 서비스',
      playground: 'Playground',
      sidebarGroups: {
        getStarted: '시작하기',
        language: '언어',
        concepts: '개념',
        examples: '예제',
        reference: '참조',
        project: '프로젝트',
      },
      conceptPages: {
        cpuAndGpu: 'CPU와 GPU',
        pipeline: '파이프라인',
        webgpuAndWebgl2: 'WebGPU와 WebGL2',
        wgslAndGlsl: 'WGSL과 GLSL',
      },
      topics: {
        types: '타입',
        functions: '함수',
        controlFlow: '제어 흐름',
        gpuTypes: 'GPU 타입',
        resources: '리소스',
        stages: '셰이더 스테이지',
      },
      mapping: {
        fromTypescript: 'TypeScript에서',
        fromWgsl: 'WGSL에서',
        fromGlsl: 'GLSL에서',
        builtins: '내장 함수',
      },
      mappingSections: {
        fromTypescript: {
          declarations: '선언',
          functions: '함수',
          classes: '클래스',
          controlFlow: '제어 흐름',
          expressions: '식과 타입',
          double: '배정밀도 에뮬레이션',
        },
        fromWgsl: {
          types: '타입',
          resources: '리소스',
          entries: '진입점',
          statements: '문과 식',
        },
        fromGlsl: {
          types: '타입',
          uniforms: '유니폼',
          variables: 'builtin 변수',
          functions: '함수',
        },
      },
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
      title: 'TypeShade 컴파일러 API 참조: 호스트와 빌더가 부르는 export 목록',
      description:
        'TypeShade 컴파일러의 공개 export를 하나씩 페이지로 정리했습니다. 구문, 매개변수, 반환값, 예제, 그리고 어느 대상에서 지원되는지를 담습니다.',
      h1: '컴파일러 API 참조',
      intro: `typeshade 패키지가 내보내는 export를 모두 모았습니다. 커밋 ${facts.pinnedCommit}의 컴파일러에서 뽑았습니다. 함수, 타입, 인터페이스, 클래스마다 페이지가 하나씩 있습니다.`,
      audience:
        '호스트 애플리케이션과 [`fn()`](apiFn) 빌더가 부르는 쪽입니다. 셰이더를 쓰는 사람은 [언어 참조](reference)를 보십시오.',
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
        ];
        const fitting = variants.find((suffix) => (heading + suffix).length <= 60);
        return fitting ? heading + fitting : heading;
      },
      categoryTitle: (name: string) => `${name} 분류, TypeShade 셰이더 API 참조 문서`,
      categoryDescription: (name: string, summary: string) =>
        `TypeShade API 참조의 ${name} 분류입니다. ${summary}`,
      // "~에 대한 TypeShade API 참조입니다"였던 접두어를 줄였습니다: 예제 요약(summary)은 컴파일러의
      // JSDoc 원문이라 영어이고, 접두어만 한글이라서 접두어가 길수록 문장 경계를 찾을 70-140자 구간이
      // 좁아져 단어 중간에서 잘리는 사례가 늘었습니다(SEO 리뷰, onpage, 설명 절단).
      pageDescription: (name: string, kind: string, category: string, summary: string) =>
        `${name}, ${category} 분류 ${kind}입니다. ${summary}`,
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
      previewNote:
        '템플릿 미리보기입니다. 이 페이지의 내용은 예시 데이터이고 컴파일러에서 가져온 것이 아닙니다.',
      line: (n: number) => `${n}행`,
      atCommit: (sha: string) => `커밋 ${sha} 기준`,
      members: (n: number) => `export ${n}개`,
      kindMeta: '종류',
      kinds: {
        function: '함수',
        constant: '상수',
        interface: '인터페이스',
        type: '타입',
        class: '클래스',
      },
      targetNames: { wgsl: 'WGSL (WebGPU)', glsl: `${glsl} (WebGL2)`, cpu: 'CPU 오라클' },
      support: {
        native: '지원',
        emulated: '에뮬레이션',
        stub: '스텁',
        none: '지원 안 함',
        'n/a': '해당 없음',
      },
      categories: apiCategories,
    },
    reference: {
      title: 'TypeShade 언어 참조: "use typeshade" 파일이 쓰는 이름 전체 목록',
      description: `\`"use typeshade"\` 파일에서 쓸 수 있는 이름 ${facts.languageEntries}개를 모았습니다. 타입과 어트리뷰트, 내장 값, 함수, 상수, \`Math\` 멤버가 여기 들어 있습니다.`,
      h1: '언어 참조',
      intro: `\`"use typeshade"\`로 시작하는 파일이 쓰는 언어입니다. 이름 ${facts.languageEntries}개를 커밋 ${facts.pinnedCommit}의 컴파일러 언어 서비스에서 그대로 읽어 왔습니다. 편집기가 호버 설명을 낼 때 보는 표와 같은 표입니다.`,
      audience:
        '셰이더를 쓰는 사람을 위한 참조입니다. 호스트 애플리케이션과 [`fn()`](apiFn) 빌더가 부르는 쪽은 [컴파일러 API 참조](api)에 있습니다.',
      reference: '참조',
      breadcrumbs: '현재 위치',
      note: `이름마다 붙은 시그니처와 설명은 커밋 ${facts.pinnedCommit}의 컴파일러 소스에서 그대로 가져온 영어 원문입니다.`,
      readingH: '항목 읽는 법',
      numberP:
        '매개변수나 반환 위치에 쓰인 `number`는 스칼라가 들어갈 자리입니다. 앰비언트 파일은 GPU 스칼라를 브랜드가 붙은 number로 선언하고 그 브랜드는 선택이라서, 리터럴도 브랜드가 붙은 스칼라도 이 자리에 들어갑니다.',
      widthP:
        '직접 쓰는 선언에는 여전히 너비가 필요합니다. 필드나 매개변수에 `number`만 적으면 거부되며, 그 행과 컴파일러가 낸 메시지는 [TypeScript에서](languageFromTypescript) 페이지에 있습니다.',
      positionsP:
        '`a0`, `a1`처럼 자리로만 붙은 매개변수 이름은 앰비언트 파일이 만들어 낸 것입니다. 호출은 인자를 순서대로 넘기고 이름은 쓰지 않습니다.',
      helpersP:
        '시그니처에는 앰비언트 파일이 스스로 쓰려고 선언한 타입이 나올 수 있습니다. 아래가 그 선언입니다.',
      readingP: `항목 하나에는 편집기가 그 이름으로 읽어 들이는 선언과, 컴파일러가 쓴 설명 한 문장이 들어갑니다. 내장 함수라면 두 백엔드가 각각 내보내는 WGSL과 ${glsl} 코드도 함께 보여 줍니다. 같은 호출을 네 칸짜리 표로 훑어보려면 [내장 함수 표](languageBuiltins)로 가십시오.`,
      sourceP:
        '이 페이지의 항목은 모두 고정된 커밋의 컴파일러에서 읽어 왔고, 여기서 직접 입력한 것은 없습니다.',
      entries: (n: number) => `이름 ${n}개`,
      signature: '시그니처',
      emits: '출력',
      wgsl: 'WGSL',
      glsl,
      noForm: '이 대상에는 형태가 없습니다.',
      preEmit: '두 백엔드가 돌기 전에 `f32` 레인 두 개로 바뀝니다.',
      inTable: '내장 함수 표',
      validIn: '쓰이는 곳',
      anyStage: '컴파일러가 이 아이디를 파이프라인의 어느 스테이지에도 묶어 두지 않습니다.',
      stageRule: (stage: string, direction: string) => `${stage} ${direction}`,
      stages: { vertex: '버텍스', fragment: '프래그먼트', compute: '컴퓨트' },
      directions: { input: '입력', output: '출력' },
      // 영어와 같은 이유로 60자 안에서 들어가는 만큼만 꾸밈말을 붙입니다.
      kindTitle: (name: string) => {
        const suffixes = [
          ', "use typeshade" 파일에서 쓰는 이름을 모은 TypeShade 언어 참조',
          ', TypeShade 언어 참조에서 쓰는 이름 목록',
          ', TypeShade 언어 참조',
        ];
        return name + (suffixes.find((suffix) => (name + suffix).length <= 60) ?? '');
      },
      entry: {
        // 영어와 같은 이유로 60자 안에서 들어가는 만큼만 꾸밈말을 붙입니다. 이름이 가장 짧은 `E`부터
        // 가장 긴 `textureSampleCompareLevel`까지 재어 보면 45자에서 60자 사이에 들어갑니다.
        title: (name: string, kind: string) => {
          const suffixes = [
            `: "use typeshade" 파일에서 쓰는 ${kind} 이름 하나, TypeShade 언어 참조`,
            `: TypeShade 언어 참조에 실린 ${kind} 이름과 그 시그니처`,
            `: TypeShade 언어 참조에 실린 ${kind} 이름`,
            `: TypeShade 언어 참조의 ${kind}`,
          ];
          return (
            name +
            (suffixes.find((suffix) => (name + suffix).length <= 60) ??
              suffixes[suffixes.length - 1]!)
          );
        },
        description: (name: string, kind: string, summary: string) =>
          `${name}, TypeShade 언어 참조의 ${kind}입니다. ${summary}`,
        kindNames: {
          type: '타입',
          attribute: '어트리뷰트',
          builtin: '내장 값',
          function: '함수',
          constant: '상수',
          math: 'Math 멤버',
        },
        kindWords: {
          type: '타입',
          attribute: '어트리뷰트',
          builtin: '내장 값',
          function: '함수',
          constant: '상수',
          math: 'Math 멤버',
        },
        kindMeta: '종류',
        syntax: '구문',
        parameters: '매개변수',
        returnValue: '반환값',
        descriptionHeading: '설명',
        targets: '대상별 출력',
        examples: '예제',
        seeAlso: '함께 보기',
        optional: '선택 사항',
        decoratorNone: '이 데코레이터는 인자 없이 그대로 붙입니다.',
        decoratorBareToo: '인자 없이 그대로 붙이는 형태도 있습니다.',
        decoratorProtocol:
          '선언에는 TypeScript 데코레이터 런타임이 넘겨주는 `target`과 `context`도 적혀 있습니다. 호출에서는 둘 다 쓰지 않습니다.',
        oracleEvaluates: 'CPU 오라클이 f64로 직접 계산합니다.',
        oracleStub:
          'CPU 오라클에는 텍스처 메모리도 이웃 프래그먼트도 없습니다. `{ gpuStubs: true }`로 컴파일한 모듈이 아니면 호출이 예외를 던집니다. 그 옵션을 주면 자리를 채우는 값이 돌아옵니다.',
      },
      kinds: {
        type: {
          name: '타입',
          summary: '값을 선언할 때 쓰는 스칼라와 벡터, 행렬, 그리고 메모리 타입입니다.',
          description: `\`"use typeshade"\` 파일에서 값을 선언할 때 쓰는 타입 ${facts.languageTypes}개입니다. 스칼라와 벡터, 모든 모양의 행렬, 텍스처와 샘플러, 그리고 GPU가 들고 있는 메모리가 여기 있습니다.`,
        },
        attribute: {
          name: '어트리뷰트',
          summary: '진입점을 표시하고 필드를 파이프라인에 연결하는 데코레이터입니다.',
          description: `컴파일러가 실제로 읽고 처리하는 데코레이터 ${facts.languageAttributes}개입니다. 진입점을 표시하거나, 필드를 파이프라인에 연결하거나, 스테이지 사이의 값과 출력의 성질을 정하거나, 진입점이 검사 결과를 보고하는 방식을 정합니다.`,
        },
        builtin: {
          name: '내장 값',
          summary: '파이프라인이 넘겨주는 `@builtin(...)` 아이디와 각각이 속한 스테이지입니다.',
          description: `파이프라인이 셰이더에 넘겨주거나 셰이더에서 돌려받는 \`@builtin(...)\` 아이디 ${facts.languageBuiltinValues}개입니다. WGSL이 정해 둔 타입과 쓰이는 스테이지를 함께 적었습니다.`,
        },
        function: {
          name: '함수',
          summary: '셰이더에서 부르는 함수를 계열별로 묶고, 백엔드가 내는 코드를 함께 실었습니다.',
          description: `셰이더에서 부르는 함수 ${facts.languageFunctions}개를 계열별로 묶었습니다. 시그니처와 함께, 컴파일러가 그 호출에 쓰는 WGSL과 ${glsl} 코드를 나란히 둡니다.`,
        },
        constant: {
          name: '상수',
          summary: '컴파일할 때 값으로 박히는 리터럴과 `discard`입니다.',
          description: `선언 없이 바로 읽는 이름 ${facts.languageConstants}개입니다. 컴파일 시점에 값으로 박히는 수학 리터럴과, 프래그먼트를 버리는 \`discard\`가 여기 듭니다.`,
        },
        math: {
          name: 'Math 멤버',
          summary: '셰이더에서 손댈 수 있는 `Math` 멤버이며, 내장 함수나 리터럴로 이어집니다.',
          description: `셰이더에서 손댈 수 있는 \`Math\` 멤버 ${facts.languageMathMembers}개입니다. 각각 내장 함수 호출이나 박아 넣은 리터럴로 이어져, 익숙한 이름이 대상의 코드가 됩니다.`,
        },
      },
      families: {
        maths: '수학',
        geometry: '기하 연산',
        derivatives: '화면 공간 미분',
        bits: '비트 연산',
        packing: '패킹',
        casts: '캐스트',
        textures: '텍스처와 스토리지',
        atomics: '원자적 연산',
        barriers: '배리어',
        f64: '에뮬레이션 배정밀도',
        constructors: '생성자',
        resources: '배열과 바인딩',
      },
    },
    errors: {
      title: 'TypeShade 오류 코드: 컴파일러가 진단에 붙이는 코드를 모두 모아 코드별로 정리한 목록',
      description: `TypeShade 컴파일러가 내는 프런트엔드 코드 ${facts.errorCodesTs}개와 코어 코드 ${facts.errorCodesSd}개입니다. 코드마다 뜻을 싣고, 프로그램으로 낼 수 있는 코드는 그 프로그램과 고친 모습도 보여 줍니다.`,
      summary: '진단에 붙는 코드와 그 뜻, 고치는 법입니다.',
      h1: '오류 코드',
      intro: `컴파일러가 진단에 붙이는 코드를 모두 모았습니다. 커밋 ${facts.pinnedCommit}의 레지스트리 두 곳에서 읽어 왔습니다. \`"use typeshade"\` 프런트엔드의 코드가 ${facts.errorCodesTs}개, 그 아래 코어 IR 계층의 코드가 ${facts.errorCodesSd}개입니다.`,
      verified: (n: number) =>
        `${n}개 페이지에는 코드를 내는 프로그램과 그 프로그램을 고친 모습이 함께 실려 있습니다. 둘 다 빌드할 때 고정된 컴파일러로 컴파일하므로, 프로그램이 더는 그 코드를 내지 않거나 고친 프로그램에 진단이 남으면 빌드가 멈춥니다. 예제 태그가 붙은 행이 그런 페이지입니다.`,
      note: '레지스트리 설명과 컴파일러 메시지는 컴파일러 원문이라 한국어 페이지에서도 영어로 둡니다.',
      codes: (n: number) => `코드 ${n}개`,
      frontEndH: '프런트엔드 코드',
      frontEndP:
        '`TS80xx` 코드는 프런트엔드의 `TS_CODES`에 들어 있습니다. `"use typeshade"` 파일은 IR을 만들기 전에 이 코드들로 먼저 검사받습니다.',
      coreH: '코어 코드',
      coreP:
        '`SDxxxx` 코드는 `typeshade/dev`가 내보내는 `CODES` 카탈로그에 들어 있습니다. 코어 IR 계층은 [`fn()`](apiFn) 빌더에서도 `"use typeshade"` 파일에서도 이 코드를 냅니다. 다만 같은 실수 가운데 상당수는 프런트엔드가 자기 코드로 먼저 거부합니다.',
      numberingH: '번호 매기기',
      numberingP:
        '프런트엔드 레지스트리는 번호를 매기는 방식을 파일 머리 주석에 직접 적어 두었습니다.',
      exampleTag: '예제',
      groups: {
        file: '파일',
        types: '타입과 이름',
        functions: '함수와 클래스',
        controlFlow: '제어 흐름',
        entries: '진입점과 입출력',
        resources: '리소스와 메모리',
        f64: '에뮬레이션 배정밀도',
        targets: '대상',
        builder: '빌더 호출',
        lint: '린트 규칙',
        portable: '이식형 커널',
        retired: '폐기된 번호',
        other: '그 밖의 코드',
      },
      entry: {
        // 영어와 같은 이유로 45자에서 60자 사이에 드는 첫 후보를 씁니다.
        title: (head: string, summary: string) => {
          const candidates = [
            ...(summary ? [`${head}: ${summary}, TypeShade 오류 코드`, `${head}: ${summary}`] : []),
            `${head}: TypeShade 컴파일러가 진단에 붙이는 오류 코드와 그 뜻, 고치는 법`,
            `${head}: TypeShade 컴파일러가 진단에 붙이는 오류 코드 한 가지`,
            `${head}: TypeShade 컴파일러가 진단에 붙이는 오류 코드`,
            `${head}: TypeShade 컴파일러의 오류 코드`,
            `${head}: TypeShade 오류 코드`,
          ];
          return (
            candidates.find((t) => t.length >= 45 && t.length <= 60) ??
            candidates[candidates.length - 1]!
          );
        },
        description: (head: string, line: string) =>
          `${head}, TypeShade 컴파일러의 오류 코드입니다. ${line}`,
        fill: '이 페이지에는 레지스트리 원문과 컴파일러가 이 코드를 내는 곳, 고치는 법이 있습니다.',
        kindTs: '프런트엔드 코드',
        kindSd: '코어 코드',
        kindRetired: '폐기된 번호',
        kindMeta: '종류',
        undocumented:
          '레지스트리에는 이 상수에 대한 문서 주석이 없습니다. 그래서 위 설명은 컴파일러가 이 코드와 함께 내는 메시지를 보고 이 사이트가 쓴 것입니다.',
        whenH: '발생 조건',
        exampleH: '예제',
        fixH: '고치는 법',
        frontEndH: '프런트엔드에서',
        seeAlsoH: '함께 보기',
        sourceH: '소스',
        ruleH: () => '이 코드가 적용하는 규칙',
        compiled: '빌드할 때 고정된 컴파일러로 이 프로그램을 컴파일하면 다음 진단이 나옵니다.',
        backend:
          '빌드할 때 고정된 컴파일러로 이 프로그램을 컴파일하면 `TS8015` 진단이 나옵니다. 백엔드가 모듈을 거부했다고 프런트엔드가 알리는 진단입니다. 백엔드가 던진 오류에 이 코드가 들어 있습니다.',
        diagnose:
          '`compile()`은 린트 규칙을 돌리지 않습니다. `typeshade/dev`의 `diagnose()`가 `compile()`이 돌려준 모듈에 린트 규칙을 돌려 다음을 알립니다.',
        deprecations: '이 경고를 켜는 옵션인 `{ deprecations: true }`를 주고 컴파일했습니다.',
        hint: '레지스트리의 힌트:',
        fixed: '같은 프로그램을 고친 모습입니다. 진단 없이 컴파일됩니다.',
        fixedDiagnose:
          '같은 프로그램을 고친 모습입니다. 진단 없이 컴파일되고, `diagnose()`도 더는 이 코드를 알리지 않습니다.',
        lineAt: (line: number) => `${line}행`,
        retired:
          '폐기된 번호입니다. 이 코드를 단 진단은 없고, 레지스트리는 이 번호를 다른 규칙에 다시 주지 않습니다.',
        frontEnd:
          '같은 실수를 한 `"use typeshade"` 파일은 이 검사까지 오지 않습니다. 프런트엔드가 자기 코드로 먼저 거부하기 때문입니다. 빌드할 때 컴파일한 아래 프로그램에는 다음 진단이 나옵니다.',
        builder:
          '이 사이트의 `"use typeshade"` 프로그램 가운데 이 코드를 내는 것이 없어서 이 페이지에는 예제가 없습니다. [`fn()`](apiFn) 빌더는 IR을 직접 만들기 때문에 소스 절에 적힌 줄의 검사에 닿습니다.',
        internal:
          '레지스트리는 이 코드를 내부 불변식이라고 부릅니다. 이 코드가 나왔다면 컴파일러 자체가 잘못된 것이고, 어떤 프로그램도 이 코드를 내도록 되어 있지 않습니다.',
        unwritten: '이 커밋에는 아직 이 코드의 예제가 없습니다.',
        sourceP: (commit: string) =>
          `커밋 ${commit}에서 컴파일러가 이 코드를 내는 곳입니다. 파일마다 한 줄씩 적었습니다.`,
        sites: (n: number) => `${n}곳`,
        noSites: '컴파일러 소스는 레지스트리 밖 어디에서도 이 코드를 쓰지 않습니다.',
        index: '오류 코드',
        builderPage: '`fn()` 빌더',
      },
      lines: {
        MISSING_DIRECTIVE:
          'TypeShade로 컴파일하는 파일이 `"use typeshade"` 지시문으로 시작하지 않습니다.',
        UNKNOWN_TYPE: '컴파일러가 모르는 타입 이름입니다.',
        TYPE_MISMATCH:
          '연산자나 선언, 반환, 인자처럼 두 값이 만나는 자리에서 타입이 서로 맞지 않습니다.',
        UNKNOWN_FN: '파일이 선언하지도 가져오지도 않은 함수를 부릅니다.',
        CONST_ASSIGN: '`const`나 읽기 전용 리소스처럼 바뀔 수 없는 이름에 값을 대입합니다.',
        LOOP_BOUND:
          '컴파일러가 종료를 증명할 수 없는 `for` 루프입니다. 카운터를 경계와 비교하지 않거나, 본문이 경계를 씁니다.',
        LOOP_INFINITE:
          '끝나지 않는 것이 확실한 루프입니다. `break`나 `return`이 없는 `while (true)`, 또는 카운터를 경계에서 멀어지게 하는 증가입니다.',
        LOOP_INDUCTION:
          '`for` 루프의 카운터가 `i32`나 `u32` 타입의 `let` 하나가 아니거나, 갱신이 상수만큼 움직이지 않습니다.',
        BREAK_OUTSIDE: '감싸는 루프나 `switch`가 없는 곳에 `break`를 썼습니다.',
        STRUCT_FIELD:
          '구조체 리터럴이나 진입점의 입출력이 선언과 맞지 않습니다. 필드가 빠졌거나, 구조체에 없는 필드가 있거나, `@location`이 서로 어긋난 경우입니다.',
        HOST_API: '셰이더 파일 안에서 `window`나 `fetch` 같은 JavaScript 호스트 API를 가리킵니다.',
        HOST_STMT: '`try`, `throw`, `await`처럼 셰이더에 대응하는 형태가 없는 JavaScript 문입니다.',
        TOP_LEVEL:
          '파일 최상위에 컴파일러가 선언으로 받을 수 없는 것이 있습니다. 선언이 아닌 문이거나, 거부하는 형태의 모듈 수준 선언입니다.',
        BACKEND:
          '프런트엔드가 받아들인 모듈을 백엔드가 출력하지 못하고 거부했습니다. 메시지는 백엔드가 쓴 그대로입니다.',
        INDEX_OOB: '상수 인덱스가 대상의 길이를 벗어납니다.',
      },
    },
    rules: {
      title:
        'TypeShade 설계 규칙: 셰이더 언어가 따르는 규칙과 그 근거, 검증 방식을 장별로 모은 목록',
      description: `TypeShade 언어를 설계한 규칙 ${facts.rules}개입니다. 규칙마다 근거와 출처, 검증 방식, 그 규칙을 적용하는 오류 코드를 함께 싣습니다.`,
      summary:
        '언어가 담을 수 있는 것과 언어가 바뀌는 방식을 정한 규칙을 한 페이지에 하나씩 싣습니다.',
      h1: '설계 규칙',
      intro: `컴파일러 설계 문서 \`docs/language-design.md\`의 규칙을 모두 모았습니다. 커밋 ${facts.pinnedCommit}의 추적 트리에서 읽어 왔습니다. 규칙은 \`"use typeshade"\` 파일을 쓰는 사람이나 컴파일러 자신을 제약합니다. 규칙 하나에는 요구 사항 하나와 그 이유, 출처, 컴파일러가 규칙을 적용하는 곳이 들어 있습니다.`,
      verifiedP: '추적 트리에 기록된 규칙별 검증 방식입니다.',
      note: '규칙 본문과 그 아래 항목은 설계 문서에 적힌 컴파일러 원문이라 한국어 페이지에서도 영어로 둡니다.',
      rulesCount: (n: number) => `규칙 ${n}개`,
      kinds: {
        test: '테스트',
        code: '구현만',
        pending: '적용 전',
        review: '리뷰',
      },
      kindCounts: {
        test: `규칙 ${facts.rulesTest}개: 테스트나 게이트 스크립트, CI 워크플로가 규칙을 가리킵니다.`,
        code: `규칙 ${facts.rulesCode}개: 구현만 규칙을 따르고, 아직 확인하는 테스트는 없습니다.`,
        pending: `규칙 ${facts.rulesPending}개: 설계 문서 부록 B에 아직 적용하지 않은 규칙으로 올라 있습니다.`,
        review: `규칙 ${facts.rulesReview}개: 리뷰로 지키며, 확인하는 파일은 없습니다.`,
      },
      chapters: {
        1: '소개',
        2: '표면 이름의 출처',
        3: '텍스트 구조와 이름',
        4: '타입',
        5: '리터럴과 타입 결정',
        6: '선언과 리소스',
        7: '표현식과 문',
        8: '함수와 진입점',
        9: '내장 함수와 TypeShade 확장',
        10: '확장과 기능',
        11: '대상과 오라클',
        12: '진단',
        13: '변경 관리',
      } as Record<number, string>,
      chapterH: (n: number, title: string) => `${n}. ${title}`,
      entry: {
        // 영어와 같은 이유로 45자에서 60자 사이에 드는 첫 후보를 씁니다.
        title: (rule: string, chapter: string) => {
          const candidates = [
            `규칙 ${rule}: ${chapter}, TypeShade 셰이더 언어 설계 규칙과 그 근거, 출처, 검증 방식`,
            `규칙 ${rule}: ${chapter}, TypeShade 셰이더 언어 설계 규칙과 그 근거, 검증 방식`,
            `규칙 ${rule}: ${chapter}, TypeShade 셰이더 언어 설계 규칙과 그 근거`,
            `규칙 ${rule}: TypeShade 셰이더 언어 설계 규칙과 그 근거, 출처, 검증 방식`,
          ];
          return (
            candidates.find((t) => t.length >= 45 && t.length <= 60) ??
            candidates[candidates.length - 1]!
          );
        },
        heading: (rule: string) => `규칙 ${rule}`,
        description: (rule: string, chapter: string, line: string) =>
          `TypeShade 언어 설계 규칙 ${rule}(${chapter})입니다. ${line}`,
        fill: '이 페이지에는 근거와 출처, 규칙을 지키는 파일과 오류 코드가 있습니다.',
        kindLine: (n: number, title: string) => `${n}장, ${title}`,
        kindMeta: '검증 방식',
        rationaleH: '근거',
        derivesH: '출처',
        verifiedH: '검증 방식',
        explainedH: '설명하는 절',
        codesH: '적용하는 오류 코드',
        seeAlsoH: '함께 보기',
        sourceH: '소스',
        how: {
          test: '테스트로 확인합니다. 테스트나 게이트 스크립트, CI 워크플로가 이 규칙을 가리키고, 아래 파일 가운데 하나라도 규칙을 더는 가리키지 않으면 추적 검사가 실패합니다.',
          code: '구현만 이 규칙을 따르고, 아직 확인하는 테스트는 없습니다. 아래 파일이 `Implements:` 태그로 규칙을 가리킵니다.',
          pending:
            '아직 적용하지 않은 규칙입니다. 설계 문서 부록 B에 올라 있고, 확인하는 파일은 없습니다.',
          review:
            '리뷰로 지킵니다. 확인하는 파일은 없고, 규칙 스스로 리뷰가 지킨다고 적어 두었습니다.',
        },
        enforcedP: '컴파일러가 이 규칙을 적용하는 곳을 규칙이 직접 적은 내용입니다.',
        filesP: (commit: string) =>
          `커밋 ${commit}에서 이 규칙을 확인하는 파일입니다. 파일마다 규칙을 처음 가리키는 줄로 연결했습니다.`,
        evidence: '컴파일러의 자체 테스트가 확인',
        explainedP: (commit: string) =>
          `커밋 ${commit}의 표면 문서에서 이 규칙을 설명하는 절입니다.`,
        section: (n: number, title: string) => `§${n} ${title}`,
        codesP:
          '규칙이 Enforced by 항목에서 가리키는 진단 코드와, 레지스트리 설명에서 이 규칙을 가리키는 진단 코드입니다.',
        sourceP: (commit: string) => `커밋 ${commit}의 규칙 원문:`,
        designDoc: '설계 문서',
        item: '추적 항목',
      },
    },
  },
  playground: {
    h1: 'Playground',
    intro:
      'TypeShade TypeScript 파일을 작성하고 브라우저에서 컴파일한 뒤, 나온 WGSL과 진단을 확인하십시오.',
    fileName: 'hello.shade.ts',
    help: 'Monaco 편집기에서 TypeShade를 작성하고 여기서 컴파일합니다.',
    run: '컴파일',
    reset: '예제 복원',
    editor: 'TypeShade 소스',
    output: '컴파일러 출력',
    wgslTab: 'WGSL',
    resultTab: '결과',
    glslVertexTab: 'GLSL 버텍스',
    glslFragmentTab: 'GLSL 프래그먼트',
    noGlsl: '이 모듈은 GLSL을 내지 않습니다.',
    diagnostics: '진단',
    idle: '컴파일 대기 중',
    ready: '컴파일 성공',
    errors: '컴파일 오류',
    loading: '편집기를 불러옵니다',
    clean: '진단 없음.',
    noOutput: 'WGSL 출력이 없습니다.',
    directive: '파일 맨 위에 "use typeshade" 지시어를 쓰면 컴파일합니다.',
    unavailable: '편집기를 불러오지 못했습니다. 연결을 확인하고 페이지를 새로 고치십시오.',
    starting: '언어 서비스를 시작합니다',
    serviceFailed: '언어 서비스가 멈췄습니다. 페이지를 새로 고치십시오.',
    sourceTypescript: 'TypeScript',
    sourceTypeshade: 'TypeShade',
    reflection: '리플렉션',
    entryPoints: '진입점',
    resources: '리소스',
    inputs: '입력',
    outputs: '출력',
    returns: '반환값',
    runCpu: 'CPU에서 실행',
    running: '실행 중',
    cpuIdle: '진입점을 실행하면 반환하는 값이 나옵니다.',
    noResources: '이 모듈은 바인딩하는 리소스가 없습니다.',
    noEntryPoints: '이 모듈에는 진입점이 없습니다.',
    requiredFeatures: '필요한 기능',
    args: '인자',
    argsInvalid: '그 인자는 숫자나 숫자 목록이 아닙니다.',
    cpuNoResources:
      'CPU 오라클은 진입점 인자만 받습니다. 유니폼이나 스토리지 바인딩을 읽는 진입점은 아직 여기서 실행할 수 없습니다.',
    canvas: 'CPU 캔버스',
    engine: '그리는 방식',
    engineGpu: 'GPU',
    engineCpu: 'CPU 오라클',
    gpuIdle: '버텍스 진입점과 프래그먼트 진입점이 있는 모듈을 컴파일하면 그려집니다.',
    gpuWebgpu: 'WebGPU에서 실행 중입니다.',
    gpuWebgl2: 'WebGL2에서 실행 중입니다.',
    gpuNone:
      '이 브라우저에는 WebGPU도 WebGL2도 없어서 아무것도 그리지 못했습니다. CPU 오라클은 그대로 돕니다.',
    gpuNoWebgpu:
      'WebGPU를 골랐지만 이 브라우저에는 WebGPU 장치가 없어서 아무것도 그리지 못했습니다. GPU를 고르면 WebGL2로 넘어갑니다.',
    gpuNoWebgl2:
      'WebGL2를 골랐지만 이 브라우저에는 WebGL2 컨텍스트가 없어서 아무것도 그리지 못했습니다.',
    gpuNoGlsl:
      '이 모듈은 GLSL ES 3.00 형태가 없어서 WebGL2로 실행할 것이 없습니다. WebGPU는 이 모듈의 WGSL을 실행합니다.',
    gpuNoGlslFeatures:
      'GLSL ES 3.00에는 이 모듈에 필요한 {features}이(가) 없어서 WebGL2로 실행할 것이 없습니다. WebGPU는 이 모듈의 WGSL을 실행합니다.',
    gpuNoFeature:
      '이 GPU는 이 모듈에 필요한 WebGPU 기능 {features}을(를) 제공하지 않아 아무것도 그리지 못했습니다.',
    gpuFailed: '{backend}에서 이 프로그램을 실행하지 못했습니다: {reason}',
    gpuNeedsStages:
      '그리려면 버텍스 진입점과 프래그먼트 진입점이 함께 있어야 합니다. 이 모듈에는 그 짝이 없습니다.',
    gpuNeedsAttributes:
      '캔버스는 꼭짓점 세 개를 그리고 버텍스 버퍼는 바인딩하지 않습니다. 이 모듈은 {fields}을(를) 버퍼에서 읽으므로 여기서는 GPU로 실행할 수 없습니다.',
    gpuNeedsBindings:
      '바인딩 패널에 {names}에 넣을 값이 없어서 이 모듈은 여기서 실행할 수 없습니다.',
    computeNeedsWebgpu:
      '컴퓨트 진입점은 WebGPU나 CPU 오라클에서 실행됩니다. GLSL ES 3.00에는 컴퓨트 단계가 없습니다.',
    computeRan:
      '{entry}을(를) {backend}에서 호출 {invocations}회로 실행했고 {ms} ms 걸렸습니다. 캔버스는 이 진입점이 쓴 값을 그래프로 보여 줍니다.',
    bindings: {
      title: '바인딩',
      empty: '이 모듈은 바인딩하는 것이 없습니다.',
      runtime: '페이지가 프레임마다 채움',
      overrides: '오버라이드',
      source: '소스',
      sources: {
        checker: 'UV 체커',
        gradient: '그러데이션',
        noise: '노이즈',
        solid: '단색',
        faces: '큐브 면',
        image: '내 이미지',
      },
      dropImage: '이미지 파일',
      depthRamp: '왼쪽 위의 0에서 오른쪽 아래의 1로 이어지는 깊이 램프입니다.',
      filter: '필터',
      address: '주소 모드',
      compare: '비교',
      preset: '프리셋',
      presets: { identity: '단위 행렬', camera: '원점을 보는 카메라', turn: 'Y축 회전' },
      fill: '채우기',
      elements: '요소 수',
      written: '디스패치 후',
      size: '크기',
      noControl: '컨트롤이 없는 바인딩:',
      hostOwned:
        '호스트가 소유한 바인딩입니다. 여기서는 페이지가 대신 값을 넣으며, 이 값은 바꿀 수 있습니다.',
      vertices:
        '버텍스 진입점은 이 입력을 버퍼에서 읽습니다. 페이지는 삼각형의 세 꼭짓점을 넘기고, 입력마다 이름에 맞는 값을 채웁니다.',
    },
    draw: 'CPU로 그리기',
    stop: '중지',
    canvasIdle: '프래그먼트 진입점을 픽셀마다 한 번씩, GPU 없이 실행합니다.',
    resolution: '해상도',
    canvasTooBig:
      '이 브라우저는 이만큼 큰 캔버스를 할당하지 못해 이 해상도로는 그릴 수 없습니다. 더 작은 값을 고르세요.',
    canvasProgress: '타일 {done}/{total}, 실행 {running}, 대기 {waiting}',
    canvasDrawn: '{px}픽셀, {ms} ms, 워커 {workers}개',
    canvasNeedsVertex:
      '그리려면 vertex_index로 도는 버텍스 진입점과 프래그먼트 진입점이 함께 있어야 합니다. 이 모듈에는 그 짝이 없어 덮을 삼각형이 없습니다.',
    canvasFlat: '버텍스 진입점이 돌려준 세 꼭짓점 사이에 넓이가 없어서 덮을 삼각형이 없습니다.',
    canvasFlatInputs:
      '캔버스는 버텍스 진입점을 인덱스 0, 1, 2로 실행하며 {fields}에 넣을 값이 없어 0으로 두었습니다. 그렇게 받은 세 꼭짓점 사이에는 넓이가 없습니다.',
    cpuFailed: 'CPU 오라클이 이 진입점을 실행하지 못했습니다.',
    entryCount: (n: number) => `진입점 ${n}개`,
    exampleLabel: '예제',
    copy: '복사',
    copied: '복사됨',
    share: '링크 복사',
    shared: '링크 복사됨',
    preludeNote:
      '이 파일에는 `@vertex` 진입점이 없어서, 화면 전체를 덮는 삼각형 뒤에 놓고 컴파일합니다. 그 삼각형이 프래그먼트 단계에 0에서 1까지 도는 `uv`를 넘깁니다. 탭과 캔버스에는 그렇게 만든 프로그램이 나옵니다.',
    emit: {
      title: '생성 옵션',
      optimization: 'WGSL 최적화',
      levels: { O0: 'O0 (패스 없음)', O1: 'O1 (값 보존)', O2: 'O2 (기본)' },
      parens: '괄호',
      minify: '최소화',
      numbers: '숫자 리터럴',
      obfuscate: '난독화',
      fp64: 'f64 에뮬레이션',
      precision: `${glsl} float 정밀도`,
      levelNote:
        'O0과 O1에서는 컴파일러가 레벨만 받아 WGSL을 생성하므로, 괄호와 최소화, 숫자 리터럴, 난독화, f64 에뮬레이션은 GLSL 탭에만 적용됩니다. f64 에뮬레이션은 `reflect()`가 따로 받으므로 모든 레벨에서 리플렉션에 반영됩니다.',
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
    copyright: `Copyright © ${facts.year} ${facts.author}`,
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

  live: {
    file: 'live.shade.ts',
    edit: '수정',
    reset: '초기화',
    editorAria: '수정할 수 있는 셰이더 소스',
    loading: '컴파일러를 불러오는 중',
    keptFrame: '마지막으로 컴파일된 프레임을 캔버스가 그대로 두고 있습니다.',
    noFrame: '캔버스가 이 프로그램을 실행하지 못해 직전에 실행되던 프레임을 그대로 두고 있습니다.',
    reserved: (fields: string) => `페이지가 매 프레임 채우는 값이라 컨트롤이 없습니다: ${fields}.`,
    mouseUnits: '`mouse`는 캔버스 왼쪽 아래를 원점으로 0에서 1까지 가며, `uv`와 같은 공간입니다.',
    backend: {
      webgpu: 'WebGPU에서 실행 중.',
      webgl2: `출력된 ${glsl}로 WebGL2에서 실행 중.`,
      none: `이 브라우저에는 WebGPU도 WebGL2도 없어서 위 프레임은 빌드할 때 그렸습니다.`,
    },
    exercisesP: '컨트롤을 움직이거나 한 줄을 고쳐서 다음을 해 보십시오:',
    output: '출력 결과',
    outputNote:
      '컴파일러가 본 모듈 전체입니다. 버텍스 진입점과 그것이 돌려주는 `VsOut` 구조체는 페이지가 붙였고, 나머지는 위 파일입니다.',
    wgsl: 'WGSL',
    glslVertex: `${glsl} 버텍스`,
    glslFragment: `${glsl} 프래그먼트`,
    uniforms: '유니폼 블록',
    field: '필드',
    type: '타입',
    offset: '오프셋',
    lineAt: '{line}행',
    component: ['x', 'y', 'z', 'w'],
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
    title: 'TypeScript로 쓰는 셰이더 언어입니다.',
    searchTitle: 'TypeShade',
    lede: `TypeShade는 TypeScript의 문법과 타입, 편집기를 그대로 쓰는 독립된 언어입니다. \`"use typeshade"\`로 시작하는 파일 하나가 WebGPU용 WGSL과 WebGL2용 ${glsl}을 냅니다. 저장소의 예제 ${facts.examples}개 가운데 ${facts.bothTargets}개가 파일 하나로 둘 다 냅니다.`,
    playground: 'Playground 열기',
    quickStart: '빠른 시작',
    stageAria: '그것을 그리는 파일 옆에서 실행되는 셰이더',
    first: {
      title: '굽은 띠',
      caption:
        '왼쪽 파일을 오른쪽에 그립니다. 한 줄을 고치거나 컨트롤을 움직이면 그림이 따라옵니다.',
      warp: '띠가 휘는 정도',
      ink: '첫 번째 색',
      paper: '두 번째 색',
    },
    targets: {
      h: '파일 하나, 출력 둘',
      p: '컴파일러는 `hello.shade.ts`를 하나의 중간 표현으로 내린 뒤 거기서 두 출력을 냅니다. 이 파일이 프로그램 전부이고, 옆 창에는 호스트가 WebGPU나 WebGL2에 넘기는 WGSL과 GLSL ES 3.00 프래그먼트가 탭 하나씩으로 들어 있습니다.',
      source: 'hello.shade.ts',
      wgsl: 'WGSL',
      glsl: `${glsl} 프래그먼트`,
    },
    gallery: {
      h: '더 많은 셰이더',
      p: `컴파일러에는 지도 렌더링 패스부터 컴퓨트 커널까지 예제 ${facts.examples}개가 들어 있습니다. 각 타일은 빌드할 때 그 셰이더가 그린 화면이고, 누르면 그 예제를 실행하는 페이지로 갑니다.`,
      all: '예제 전체',
      tile: (title: string) => ({
        neutral: `${title}. 빌드할 때 그린 화면입니다.`,
        webgpu: `${title}. WebGPU에서 실행 중입니다.`,
        webgl2: `${title}. WebGL2에서 실행 중입니다.`,
        none: `${title}. 빌드할 때 그린 화면입니다. 이 브라우저에는 WebGPU도 WebGL2도 없습니다.`,
        reduced: `${title}. 시스템이 움직임 줄이기를 켜 두어 한 프레임만 그렸습니다.`,
      }),
    },
    map: {
      h: 'TypeScript에서 그대로 이어지는 것',
      p: 'GPU 코드에는 리소스, 값 레이아웃, 엔트리 포인트 세 가지가 있습니다. TypeShade는 각각에 TypeScript가 이미 가진 자리를 주고, 나머지 언어는 GPU에 맞는 범위에서 그대로 둡니다. 전체 규칙은 [언어 가이드](guide)에 있습니다.',
      rows: [
        [
          '"use typeshade"',
          '이 지시어가 언어의 경계입니다',
          '파일의 첫 문장, JavaScript 지시어가 놓이는 자리에 씁니다. 이 줄이 없는 파일은 셰이더로 컴파일되지 않고, 있는 파일은 그 아래 모든 코드가 TypeShade로 검사되어 컴파일러의 중간 표현으로 내려갑니다.',
        ],
        [
          'f32, vec3, mat4, sin(x)',
          'GPU 타입과 builtin은 전역입니다',
          '`f32`, `vec3`, `mat4`와 `sin`, `vec4(...)` 같은 builtin은 import 없이 씁니다. `Math.sin`과 `Math.PI`는 같은 연산의 별칭입니다. 검사기는 코드를 내기 전에 편집기 안에서 셰이더 규칙을 적용합니다.',
        ],
        [
          'class VsIn { @location(0) uv: vec2 }',
          'type이나 class가 값 레이아웃입니다',
          '메타데이터가 없는 데이터는 `type` 별칭으로 쓰고, 필드마다 `@location`이나 `@builtin`이 필요하면 `class`로 씁니다. 클래스의 필드가 두 타깃이 받는 구조체의 레이아웃이 됩니다.',
        ],
        [
          'new Circle(center, 0.3).coverage(p)',
          '클래스는 TypeScript 클래스 그대로입니다',
          '필드, 생성자와 `new`, 메서드와 static 함수, `super`와 `abstract`가 있는 `extends`, 제네릭 클래스와 함수, 믹스인 패턴까지 컴파일됩니다. 메서드는 구조체를 첫 매개변수로 받는 함수로 내려가고, 제네릭은 타입 인자 조합마다 한 번씩 컴파일됩니다. [예제 페이지](examples)에 각각의 파일이 있습니다.',
        ],
        [
          'declare const u: uniform<Camera>',
          'declare가 호스트가 채우는 리소스를 선언합니다',
          '`uniform<T>`는 유니폼 블록을 읽고, `declare let` 뒤의 `storage<T>`는 쓸 수 있습니다. 초기값은 없습니다. 슬롯은 호스트의 것이고 파일의 선언 순서를 따르며, [`reflect()`](apiReflect)가 그 레이아웃을 알려 줍니다.',
        ],
        [
          '@fragment export function fs(v: VsOut): vec4',
          '데코레이터가 붙은 export가 엔트리 포인트입니다',
          '`@vertex`, `@fragment`, `@compute([64, 1, 1])`가 스테이지를 정하고, 없는 함수는 헬퍼입니다. 스테이지 입력은 `@builtin("vertex_index")`나 `@location` 같은 명시적 매개변수로 받습니다. 숨은 전역 변수는 없습니다.',
        ],
      ],
    },
    oracle: {
      h: 'CPU 결과와 대조합니다',
      p: '같은 모듈을 CPU에서 f64로 실행하고, [테스트](checks)가 컴파일러의 산술을 그 결과와 맞춰 봅니다. 출력은 푸시할 때마다 Tint에서 컴파일하고 WebGL2에서 링크합니다. 아래는 같은 파일에서 나온 그라데이션 패스를 두 백엔드가 각각 그린 화면입니다.',
      webgpu: {
        neutral: '생성된 WGSL로 빌드할 때 그린 그라데이션 패스입니다.',
        webgpu: '생성된 WGSL로 WebGPU가 그리는 그라데이션 패스입니다.',
        webgl2: 'WebGL2가 그리는 그라데이션 패스입니다. 이 브라우저에는 WebGPU가 없습니다.',
        none: '빌드할 때 그린 그라데이션 패스입니다. 이 브라우저에는 WebGPU도 WebGL2도 없습니다.',
      },
      webgl2: {
        neutral: `생성된 ${glsl}으로 빌드할 때 그린 그라데이션 패스입니다.`,
        webgpu: `생성된 ${glsl}으로 WebGL2가 그리는 그라데이션 패스입니다.`,
        webgl2: `생성된 ${glsl}으로 WebGL2가 그리는 그라데이션 패스입니다.`,
        none: '빌드할 때 그린 그라데이션 패스입니다. 이 브라우저에는 WebGL2가 없습니다.',
      },
    },
    install: {
      h: '설치',
      p: `출시 전입니다. ${facts.nextVersion}은 아직 npm에 없으므로 저장소를 git 서브모듈로 추가하고 거기서 import합니다. 첫 파일은 [빠른 시작](quickStart)에서 따라갈 수 있습니다.`,
    },
  },
  quickStart: {
    host: {
      hostH: '호스트 애플리케이션에 연결하기',
      boundaryH: 'TypeShade와 호스트의 경계',
      nextLearnH: '다음 학습',
      p0: '파일이 `"use typeshade"`로 시작하면 그 파일은 셰이더 컴파일 단위입니다. 아래 예제는 TypeShade의 실제 authoring surface입니다.',
      boundaryP:
        'TypeShade 코드는 TypeScript처럼 작성하지만, `"use typeshade"`가 붙은 파일에서는 셰이더 언어 규칙이 적용됩니다. TypeScript 타입과 문법은 authoring surface를 만들고, TypeShade의 GPU 타입·리소스·shader stage 규칙이 실제 셰이더 의미를 결정합니다.',
      boundaryBullets: [
        '`"use typeshade"`가 언어 경계를 선언합니다.',
        'entry point의 GPU 입력은 `@builtin(...)` 같은 명시적인 매개변수로 표현합니다.',
        '`uniform<T>`와 `storage<T>` 같은 리소스 타입은 GPU 리소스의 의미를 표현합니다.',
      ],
      hostWgslLabel: '호스트가 WGSL을 소비하는 위치',
      hostP1:
        'TypeShade는 렌더링 런타임이 아닙니다. TypeScript에서 셰이더를 작성하고 컴파일한 뒤, 호스트 애플리케이션이 생성된 WGSL 또는 GLSL ES 3.00 문자열을 WebGPU나 WebGL2에 넘깁니다.',
      hostP2:
        'TypeShade가 담당하는 것은 언어 의미와 셰이더 코드 생성입니다. device, pipeline, bind group, buffer, texture, command encoder 같은 GPU 런타임 객체의 생성과 수명 관리는 호스트가 담당합니다.',
      nextLearnP: '이제 TypeScript에서 익숙한 개념을 TypeShade의 GPU 의미로 연결해 보세요.',
      nextLinks: [
        { linkKey: 'languageTypes', label: 'Types: 타입과 GPU struct' },
        { linkKey: 'languageFunctions', label: 'Functions: helper와 entry point' },
        { linkKey: 'languageControlFlow', label: 'Control flow: GPU 실행 흐름' },
        { linkKey: 'languageGpuTypes', label: 'GPU types: scalar, vector, matrix, array' },
        { linkKey: 'languageResources', label: 'Resources: uniform과 storage' },
        { linkKey: 'languageStages', label: 'Shader stages: compute, vertex, fragment' },
      ],
      nextLearnAllLink: '전체 Language Guide 보기',
    },
    title: 'Use TypeShade: 설치하고 첫 셰이더 작성하기',
    description:
      'TypeShade를 git 서브모듈로 추가한 뒤, "use typeshade"로 시작하는 파일을 컴파일합니다. 출시 전 상태도 함께 적었습니다.',
    h1: 'Use TypeShade',
    installH: '설치',
    p0: 'TypeScript 파일의 첫 문장을 `"use typeshade"`로 시작해 보세요. 이 지시어가 TypeShade 셰이더 언어로 넘어가는 경계를 만들며, 아래 예제는 class와 스테이지 데코레이터가 붙은 함수로 작성한 완전한 첫 셰이더입니다.',
    p1: `TypeShade에는 함수 기반 작성 방식도 있습니다. 같은 패스를 class 대신 [\`fn\`](apiFn)과 [\`module()\`](apiModule)로 선언한 파일이며, import 문부터 WGSL을 내보내는 호출까지 ${quickStartFile.lines}줄입니다.`,
    p2: '실행하면 두 단계의 WGSL이 함께 나옵니다. 프래그먼트 진입점은 여기 있습니다.',
    p3: `같은 함수의 ${glsl} 단계와, [\`reflect()\`](apiReflect)가 복원한 유니폼 레이아웃은 [예제 페이지](examples)에 있습니다. 나머지 API는 [작성 가이드](guide)를 보면 됩니다.`,
    live: {
      h: '라이브 예제',
      p: '`sin`이 x 좌표를 파동으로 바꾸고 `time`이 그 파동을 흘려보냅니다. 아래 파일이 그게 전부이고, 여기서 바로 돕니다. 한 줄을 고치면 다음 입력에 캔버스가 따라옵니다.',
      title: '사인 줄무늬',
      caption: '두 색 사이를 오가며 캔버스를 가로지르는 사인파.',
      anchor:
        '`bands`는 파동이 왼쪽 끝에서 오른쪽 끝까지 몇 번 반복하는지를 정하고, `time`은 그 무늬를 옆으로 밀어냅니다. `phase`에 닿는 값이 `uv.x`뿐이라 세로 한 줄은 한 가지 색입니다.',
      exercises: [
        '`bands`를 범위의 맨 아래까지 내려 파동 하나를 만들어 보십시오. 맨 위까지 올리면 마루가 가는 선으로 좁아집니다.',
        '`phase` 줄에서 `uv.x`를 `uv.y`로 바꿔 보십시오. 줄무늬가 가로로 눕습니다. `uv`는 캔버스를 가로지르는 방향뿐 아니라 위쪽으로도 나아가기 때문입니다.',
        '`Uniforms`에 `speed: f32`를 넣고, `phase` 줄에서 `u.time`에 `u.speed`를 곱해 보십시오. 캔버스 아래에 `speed` 슬라이더가 생기고, 출력 결과의 `struct Uniforms`에도 필드가 하나 늘어납니다. 컨트롤도 WGSL도 컴파일러가 방금 만든 모듈에서 읽어 온 것입니다.',
      ],
      bands: '캔버스를 가로지르는 파동 수',
      low: '골 색',
      high: '마루 색',
    },
    status: {
      h: '상태',
      p: `정식 출시 전입니다. 저장소는 ${facts.mirrorVersion} 버전이고, npm 이름 [typeshade](npm)는 ${facts.nextVersion} 출시용으로 잡아 두었습니다. 매니페스트와 import 이름은 그 태그에서 바뀝니다. 그때까지는 미러 저장소이며, 위 import는 서브모듈 안의 \`${quickStartFile.importPath}\`에서 해석됩니다. 이슈는 환영합니다. 다만 변경은 업스트림에 먼저 들어가고 이 트리는 그것을 fast-forward로 따라가기 때문에, 풀 리퀘스트는 아직 머지할 수 없습니다. ${facts.nextVersion} 소식은 [릴리스 구독](releases)으로 받을 수 있습니다.`,
    },
  },
  motivation: {
    use: {
      title: 'TypeShade란 무엇인가',
      description:
        'TypeScript의 개발 경험에서 출발해 셰이더 언어로 확장되는 TypeShade와 use typeshade의 의미를 설명합니다.',
      h1: 'TypeScript에서 시작하는 셰이더 언어',
      sections: [
        [
          'TypeShade는 무엇을 바꾸나요?',
          'TypeShade는 TypeScript 코드를 GPU에서 그대로 실행하는 런타임이 아닙니다. TypeScript의 익숙한 문법과 개발 도구를 출발점으로 삼고, GPU 프로그램에 필요한 타입과 의미론을 가진 별도의 컴파일 언어로 해석합니다.',
        ],
        [
          '`use typeshade`는 언어 경계입니다',
          '`"use typeshade"`는 파일 수준에서 TypeShade 프로그램임을 선언합니다. 이 한 줄을 기준으로 컴파일러는 일반 애플리케이션 코드와 다른 TypeShade 셰이더 의미론을 적용합니다. 따라서 TypeShade를 처음 배울 때 가장 먼저 이해해야 하는 문법입니다.',
        ],
        [
          'TypeScript에서 무엇이 그대로 익숙한가요?',
          '함수, 타입 주석, 모듈, 표현식과 제어 흐름처럼 이미 알고 있는 언어 개념이 TypeShade의 작성 경험을 구성합니다. 하지만 TypeScript의 모든 기능을 그대로 실행할 수 있다는 뜻은 아닙니다. TypeShade는 GPU 실행 모델에 맞지 않는 기능을 제한하고, 차이가 있는 곳을 정적 진단으로 드러냅니다.',
        ],
        [
          'TypeScript와 TypeShade의 차이는 어디에 있나요?',
          'TypeScript가 일반 프로그램의 타입과 실행을 설명한다면 TypeShade는 GPU 프로그램의 값, 벡터와 행렬, 리소스, 엔트리 포인트, 타깃별 제약까지 설명합니다. 같은 `function`이나 `if`를 보더라도 최종 프로그램은 GPU의 실행 모델을 따라야 합니다.',
        ],
        [
          '컴파일 결과는 무엇인가요?',
          'TypeShade 소스는 하나의 중간 표현으로 내려간 뒤 호스트가 사용할 셰이더 소스로 출력됩니다. 현재 WebGPU에는 WGSL을, WebGL2에는 GLSL ES 3.00을 생성합니다. 애플리케이션에는 TypeShade 런타임을 배포하지 않고 생성된 결과를 호스트가 소비합니다.',
        ],
        [
          '어디서부터 배우면 되나요?',
          '처음이라면 Quick start에서 `"use typeshade"` 파일 하나를 만든 다음 Language guide에서 타입, 값과 표현식, 함수, 제어 흐름과 GPU 의미론을 순서대로 배우세요. 이미 컴파일러를 이해하고 있다면 그 다음에 Verification과 API reference로 내려가면 됩니다.',
        ],
      ],
      familiarH: 'TypeScript 지식이 출발점이 됩니다',
      familiarP:
        'TypeShade는 익숙한 언어 개념을 버리지 않습니다. 대신 GPU에서 의미가 달라지는 지점을 명확하게 구분합니다.',
      rows: [
        ['함수', '함수 선언과 호출', '셰이더 함수와 엔트리 포인트 규칙이 추가됩니다.'],
        ['타입', '타입 주석과 추론', 'GPU-native 타입과 벡터·행렬 타입이 추가됩니다.'],
        ['모듈', 'import / export', '셰이더 컴파일 단위와 출력 가능한 모듈 규칙이 적용됩니다.'],
        ['제어 흐름', 'if / for 등의 문법', 'GPU 실행 모델과 타깃 제약을 만족해야 합니다.'],
        ['실행', 'JavaScript 런타임', '컴파일 결과를 WebGPU/WebGL2 호스트가 실행합니다.'],
      ],
      furtherH: 'TypeScript와 JavaScript를 함께 참고하세요',
      furtherP:
        'TypeShade 문서는 언어의 차이를 설명하는 데 집중합니다. 익숙하지 않은 TypeScript 또는 JavaScript 개념은 원문 문서를 함께 보면 더 빠르게 배울 수 있습니다.',
      further: [
        [
          'TypeScript Handbook — Everyday Types',
          'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html',
          '타입 주석, union, literal 등 TypeScript 타입의 기본 개념',
        ],
        [
          'TypeScript Handbook — Functions',
          'https://www.typescriptlang.org/docs/handbook/2/functions.html',
          '함수 선언, 매개변수, 반환 타입과 호출 규칙',
        ],
        [
          'MDN — JavaScript Guide',
          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
          'JavaScript의 표현식, 제어 흐름, 함수와 모듈에 대한 언어 배경',
        ],
      ],
      columns: ['개념', 'TypeScript에서 익숙한 부분', 'TypeShade에서 추가되는 의미'],
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
    description:
      'TypeShade의 CI가 푸시마다 실행하는 것: f64 CPU 오라클, Tint와 실제 WebGL2 컨텍스트에서 실행되는 컴파일 게이트, 출력마다의 골든 파일.',
    h1: '검증 방식',
    ciH: '푸시마다 하는 검사',
    intro: '저장소의 CI는 푸시와 풀 리퀘스트마다 [CI 워크플로](ciGates)에서 다음을 실행합니다.',
    items: [
      '같은 모듈을 f64 산술로 실행되는 CPU 함수로도 컴파일합니다. 이것이 기준값을 내는 오라클입니다. 기본 모드에서는 동등 비교만 먼저 f32로 반올림해 GPU와 맞추고, 연산마다 반올림하는 f32 모드는 따로 켭니다. 테스트는 이 함수를 알려진 답과 맞춰 보고, 생성된 JavaScript라는 두 번째 CPU 백엔드와도 맞춰 봅니다. 둘은 비트 단위로 같아야 합니다. 오라클은 드라이버의 반올림에 대해서는 아무것도 말해 주지 않습니다. 이 저장소에서는 GPU 출력을 오라클과 맞춰 보지 않습니다. [src/core/oracle.ts](oracle)',
      `컴파일 게이트는 등록된 예제를 전부 출력합니다. WGSL은 헤드리스 Chromium 안의 Tint에 넘기고, 렌더링 가능한 예제의 ${glsl} 두 단계는 실제 WebGL2 컨텍스트에서 컴파일하고 링크합니다. 컴파일될 수 없는 셰이더도 각 컴파일러에 하나씩 넘깁니다. 어느 쪽이든 그것을 받아들이면 게이트는 실패하고, 예제에 대한 판정은 무효가 됩니다. [scripts/compile-gate.ts](compileGate)`,
      '골든 파일에는 모든 예제의 출력 바이트가 들어 있어서, 백엔드가 조금이라도 바뀌면 리뷰에서 diff로 드러납니다. [emit-goldens.test.ts](goldens)',
    ],
    pairH: '두 백엔드에서 같은 패스',
    pairIntro:
      '첫 페이지의 gradient 패스를 백엔드마다 한 번씩 그렸습니다. 두 백엔드의 픽셀 비교는 아직 커밋되어 있지 않습니다.',
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

  concepts: {
    title: 'TypeScript와 WebGPU 개념 연결',
    description:
      'TypeScript의 타입, 함수, 모듈이 TypeShade의 GPU 값, 진입점, 셰이더 모듈로 어떻게 이어지는지, 그리고 WebGPU가 어디에서 시작되는지 설명합니다.',
    h1: 'TypeScript와 WebGPU 개념 연결',
    lead: 'TypeShade는 TypeScript 개발 경험에서 출발해 GPU 전용 의미론을 더합니다. 이미 아는 개념을 셰이더를 작성하는 데 필요한 개념으로 연결해 봅니다.',
    startH: 'TypeScript 파일에서 시작합니다',
    startP:
      '`"use typeshade"`는 파일을 TypeShade 컴파일 단위로 선택합니다. 함수, 매개변수, 반환 타입, 객체, import와 export처럼 익숙한 TypeScript 형태는 그대로 이어집니다.',
    modelH: '머릿속 모델',
    adds: 'TypeShade 추가 사항',
    model: [
      [
        'TypeScript 타입',
        '타입 주석은 값의 형태를 설명하고 잘못된 프로그램을 도구가 발견하도록 합니다.',
        '`f32`, `u32`, `vec2`, `vec3`, `vec4` 같은 GPU 값 타입과 셰이더 연산 규칙입니다.',
      ],
      [
        '함수',
        '함수는 매개변수, 반환 타입, 본문을 가집니다.',
        '`@vertex`, `@fragment` 같은 스테이지 데코레이터로 진입점을 표시합니다.',
      ],
      [
        '모듈',
        '`import`와 `export`로 재사용 가능한 프로그램 경계를 만듭니다.',
        'GPU 코드로 내릴 수 있도록 셰이더 모듈에 필요한 제약을 적용합니다.',
      ],
      [
        'Web API',
        '디바이스, 파이프라인, 버퍼와 렌더링은 호스트 애플리케이션이 소유합니다.',
        '셰이더 소스와 리플렉션 메타데이터를 제공하며 WebGPU나 WebGL 호스트 API를 대체하지 않습니다.',
      ],
    ],
    fitH: 'WebGPU는 어디에 있나요?',
    fitP: 'TypeShade를 브라우저 그래픽 API 위에 놓인 작성·컴파일 계층으로 생각하면 됩니다. TypeShade가 셰이더 코드를 만들고, 애플리케이션은 여전히 `GPUDevice`를 만들고 파이프라인을 구성하고 리소스를 바인딩하고 작업을 제출합니다.',
    fitLinks: [
      ['TypeScript 문서 ↗', 'https://www.typescriptlang.org/docs/'],
      ['MDN WebGPU API ↗', 'https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API'],
      [
        'MDN JavaScript 지시문 ↗',
        'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode',
      ],
    ],
    playgroundLink: 'Playground에서 직접 작성 →',
    orderH: '이 순서로 배우세요',
    orderItems: [
      '타입, 함수, 모듈 등 TypeScript의 형태를 익힙니다.',
      '`"use typeshade"`를 추가하고 GPU 타입을 익힙니다.',
      '진입점 데코레이터와 리소스 선언을 추가합니다.',
      'Playground에서 편집하면서 진단과 생성된 WGSL을 확인합니다.',
      '마지막으로 컴파일러와 백엔드 내부로 들어갑니다.',
    ],

    /** /guide/concepts/ 아래 네 페이지. TypeScript 개발자가 이미 아는 것에서 셰이더에
     *  필요한 것까지 이어지는 학습 경로이며, 각 페이지는 src/components/pages의 컴포넌트와
     *  src/pages/guide/concepts의 한 줄짜리 라우트 파일로 이루어집니다. */
    cpuAndGpu: {
      title: 'CPU와 GPU 실행 모델',
      description:
        'GPU가 인보케이션 하나에 무엇을 건네는지, 셰이더에 힙과 문자열과 재귀가 없는 이유는 무엇인지, 그 사실에서 어떤 TypeShade 규칙이 나오는지 설명합니다.',
      h1: 'CPU와 GPU',
      lead: 'TypeShade 파일은 편집기에게는 TypeScript이고 컴파일러에게는 GPU 프로그램입니다. 언어 가이드가 적어 둔 제약은 취향의 문제가 아닙니다. 하나하나가 하드웨어의 동작에서 나오므로, 이 페이지는 사실을 먼저 적고 규칙을 그다음에 적습니다.',
      invocationH: '인보케이션',
      invocationP:
        'TypeScript 함수는 호출할 때 한 번 실행됩니다. 진입점은 다릅니다. GPU가 부르며, 한 번 그릴 때 버텍스마다 한 번, 프리미티브가 덮는 프래그먼트마다 한 번, 디스패치의 작업 항목마다 한 번 실행됩니다. 이렇게 한 번 실행되는 단위를 인보케이션이라고 부릅니다. 인보케이션은 서로 나란히 돌아가며 서로의 값을 읽지 못합니다. 자기가 몇 번째인지 알려 주는 것도 함수 바깥에는 없습니다.',
      invocationRule:
        '여기에서 규칙이 나옵니다. 스테이지 데코레이터가 셋 가운데 어느 쪽이 부르는지 밝히고, `@builtin(...)` 매개변수가 인보케이션에게 자기 자리를 알려 줍니다. 데코레이터는 [셰이더 스테이지](languageStages)가, 매개변수는 [함수](languageFunctions)가 적어 두었습니다.',
      memoryH: '메모리',
      memoryP:
        '인보케이션은 레지스터와, 호스트가 그리기 전에 바인딩해 둔 버퍼와 텍스처 위에서 움직입니다. 그 아래에 힙이 없으므로 셰이더는 메모리를 할당할 곳도, 길이가 늘어나는 배열도, 문자열을 만들 방법도 없습니다. TypeShade 파일의 클래스는 GPU 구조체의 바이트 배치를 설명하고, 그 바이트는 호스트가 채웁니다.',
      memoryRule:
        '여기에서 규칙이 나옵니다. `new`는 정체성을 가진 객체가 아니라 값을 만들고, 클래스 필드의 순서가 호스트가 쓰는 바이트의 레이아웃이 되며, 리소스는 모두 `declare`로 들어옵니다. 구조체 작성 인터페이스는 [타입](languageTypes)이, 선언은 [리소스](languageResources)가 적어 두었습니다.',
      callsH: '호출',
      callsP:
        '셰이더에는 돌아갈 호출 스택이 없고, 호출 그래프는 드라이버가 보기 전에 평탄화됩니다. 자기 자신을 직접 부르거나 다른 함수를 거쳐 부르는 함수는 평탄화할 대상을 남기지 못합니다.',
      callsRule:
        '여기에서 규칙이 나옵니다. 재귀는 컴파일러가 거부하고, 헬퍼 함수는 컴파일러가 끝까지 따라갈 수 있는 평범한 함수입니다. 호출이 무엇일 수 있는지는 [함수](languageFunctions)가 적어 두었습니다.',
      loopsH: '루프',
      loopsP:
        '한 스테이지의 인보케이션들은 루프를 함께 지나가고, 먼저 빠져나온 쪽은 나머지를 기다립니다. 횟수를 세는 루프는 본문이 바꾸지 않는 상한과 카운터를 비교하며 그 상한 쪽으로 나아가고, 컴파일러는 바로 이 점을 검사합니다. 상한 자체는 프로그램이 실행 중에 알게 되는 값이어도 됩니다.',
      loopsRule:
        '여기에서 규칙이 나옵니다. `for`는 본문이 움직이지 않는 상한까지 세고, `while`은 조건이나 `break`가 정한 곳에서 끝납니다. 어떤 조건과 반복이 컴파일되는지는 [제어 흐름](languageControlFlow)이 적어 두었습니다.',
      typesH: '값 타입',
      typesP:
        'GPU 레지스터의 폭과 배치는 셰이더를 컴파일할 때 정해집니다. 그래서 변수는 선언된 자리부터 스코프 끝까지 값 타입 하나를 담습니다. 값 타입 두 개를 합친 유니온도 없고, 실행 중에 둘 사이를 고를 방법도 없습니다.',
      typesRule:
        '여기에서 규칙이 나옵니다. 모든 값은 `f32`, `u32`, `vec4`처럼 적어 둔 GPU 타입을 가집니다. 타입 작성 인터페이스는 [타입](languageTypes)이, 값 자체는 [GPU 타입](languageGpuTypes)이 적어 두었습니다.',
      tableH: '사실과 규칙',
      tableP:
        '위의 사실들과 거기에서 나오는 규칙, 그리고 그 규칙을 적어 둔 언어 가이드의 페이지입니다.',
      tableColumns: ['GPU가 하는 일', 'TypeShade가 요구하는 것', '적어 둔 곳'],
      tableRows: [
        [
          '버텍스, 프래그먼트, 작업 항목마다 진입점을 한 번씩 부릅니다',
          '진입점에 스테이지 데코레이터를 달고, builtin 입력마다 매개변수를 둡니다',
          '[셰이더 스테이지](languageStages)',
        ],
        [
          '인보케이션에 레지스터와 바인딩된 리소스를 주고, 그 아래에 힙은 없습니다',
          '늘어나는 배열도 문자열도 없습니다. `new`는 값을 만들고, 클래스는 레이아웃이며 리소스는 `declare`입니다',
          '[리소스](languageResources)',
        ],
        [
          '호출 스택 없이 실행합니다',
          '컴파일러가 평탄화할 수 있는 호출 그래프를 요구하므로 재귀가 없습니다',
          '[함수](languageFunctions)',
        ],
        [
          '한 스테이지의 인보케이션들을 루프에 함께 통과시킵니다',
          '컴파일러가 읽을 수 있는 루프 상한을 요구합니다',
          '[제어 흐름](languageControlFlow)',
        ],
        [
          '레지스터 하나에 폭이 정해진 값을 담습니다',
          '변수마다 값 타입 하나를 적어 둡니다',
          '[GPU 타입](languageGpuTypes)',
        ],
      ],
      furtherH: '더 읽을 자료',
      furtherItems: [
        '[WGSL 명세](specWgsl)에 이 사실들이 나온 실행 모델이 적혀 있습니다. 인보케이션이 무엇인지, 무엇을 담을 수 있는지도 그곳에 있습니다.',
        '[MDN WebGPU API](mdnWebgpu)는 같은 모델을 브라우저 쪽에서 JavaScript 개발자를 위해 풀어 놓은 문서입니다.',
      ],
      nextP:
        '이 경로의 다음 글은 [파이프라인](conceptsPipeline)입니다. 스테이지마다 무엇을 건네받고 무엇을 만들어 내는지 다룹니다.',
    },

    pipeline: {
      title: '셰이더 파이프라인 구조',
      description:
        '버텍스 스테이지, 프래그먼트 스테이지, 컴퓨트 스테이지가 각각 무엇을 건네받고 무엇을 만들어 내는지, 그리고 진입점 시그니처가 그 자리에 어떻게 대응하는지 설명합니다.',
      h1: '파이프라인',
      lead: '셰이더는 혼자 돌아가지 않습니다. GPU 파이프라인의 정해진 자리 가운데 한 곳에 놓이고, 그 자리가 진입점이 무엇을 건네받고 무엇을 돌려주어야 하는지 결정합니다. 이 페이지는 TypeShade가 코드를 생성하는 자리들을 설명하고, 문법은 언어 가이드에 맡깁니다.',
      stagesH: '스테이지',
      stagesP: '각 행은 호스트가 구성한 파이프라인의 스테이지 하나입니다.',
      stagesColumns: ['스테이지', '건네받는 것', '만들어 내는 것'],
      stagesRows: [
        [
          '버텍스',
          '그릴 때의 버텍스 하나입니다. 그 버텍스의 번호와, 호스트가 버텍스 버퍼에 배치해 둔 필드를 받습니다.',
          '클립 공간 위치와, 프래그먼트 스테이지가 읽을 값을 만들어 냅니다.',
        ],
        [
          '프래그먼트',
          '버텍스 스테이지가 만든 값을 이 프래그먼트에 맞게 가중한 결과와, 프래그먼트 자신의 위치를 받습니다.',
          '파이프라인이 선언한 색상 어태치먼트마다 값 하나를 만들어 냅니다.',
        ],
        [
          '컴퓨트',
          '디스패치 격자 안의 자기 좌표와, 호스트가 바인딩해 둔 리소스를 받습니다.',
          '돌려주는 값은 없습니다. 컴퓨트 진입점은 들고 있는 리소스에 씁니다.',
        ],
      ],
      entryH: '진입점',
      entryP:
        '진입점의 시그니처는 그 스테이지 인터페이스를 그대로 적어 둔 것입니다. `@builtin(...)` 매개변수는 스테이지가 인보케이션에게 건네는 값이며, 버텍스 번호나 프래그먼트 위치가 여기에 해당합니다. 구조체 매개변수는 버텍스 스테이지에서는 버텍스마다의 입력이고, 프래그먼트 스테이지에서는 보간된 값입니다. 반환 타입은 스테이지가 파이프라인에 돌려주는 값이라서, 버텍스 진입점은 위치를 돌려주고 프래그먼트 진입점은 색을 돌려줍니다. 데코레이터와 표기는 [셰이더 스테이지](languageStages)에 있고, 이 페이지는 의미만 다룹니다.',
      entryNote:
        '그래서 시그니처 한 줄만 읽어도 그 함수가 어느 스테이지에 속하는지, 파이프라인이 무엇을 공급해야 하는지, 파이프라인이 무엇을 돌려받는지 알 수 있습니다.',
      interpolationH: '보간',
      interpolationP:
        '버텍스 스테이지와 프래그먼트 스테이지 사이에서 래스터라이저가 프리미티브가 덮는 프래그먼트를 가려냅니다. 그리고 프래그먼트마다, 버텍스들이 만든 값을 각 버텍스에서 얼마나 가까운지에 따라 가중해 프래그먼트 스테이지에 건넵니다. 이 과정을 보간이라고 합니다. 버텍스 진입점은 버텍스마다 값을 쓰고 프래그먼트 진입점은 프래그먼트마다 값을 읽으므로, 이름은 같아도 서로 다른 값입니다.',
      interpolationNote:
        '실수 `@location` 필드는 `@interpolate`로 다른 방식을 지정하지 않는 한 이렇게 가중됩니다. 정수는 가중할 수 없으므로 컴파일러는 따로 적지 않아도 두 타깃 모두 `id`에 `flat` 한정자를 붙이고, 프래그먼트는 프리미티브의 버텍스 하나가 낸 값을 그대로 읽습니다. `tint`에 적은 `@interpolate("flat")`도 같은 처리를 요청합니다. 필드 데코레이터는 [타입](languageTypes)이 적어 두었습니다.',
      computeH: '컴퓨트',
      computeP:
        '컴퓨트 스테이지 앞에는 래스터라이저가 없고 뒤에는 어태치먼트가 없습니다. 호스트가 작업 항목의 격자를 디스패치하면, 진입점은 그 격자 안의 자기 좌표를 builtin 매개변수로 읽고, 만들어 낸 값은 모두 스토리지 리소스를 거쳐 나갑니다. 쓰기 가능한 리소스를 어떻게 선언하는지는 [리소스](languageResources)가 적어 두었습니다.',
      furtherH: '더 읽을 자료',
      furtherItems: [
        '[WebGPU 명세](specWebgpu)가 이 스테이지들이 속한 렌더 파이프라인과 컴퓨트 파이프라인을 정의합니다.',
        '[MDN GPURenderPipeline](mdnRenderPipeline)과 [MDN GPUComputePassEncoder](mdnComputePass)에서 그 파이프라인을 움직이는 호스트 코드를 볼 수 있습니다.',
      ],
      nextP:
        '이 경로의 다음 글은 [WebGPU와 WebGL2](conceptsWebgpu)입니다. 호스트 애플리케이션과 컴파일러가 일을 어떻게 나누는지 다룹니다.',
    },

    webgpuAndWebgl2: {
      title: 'WebGPU와 WebGL2',
      description:
        '호스트 애플리케이션이 소유하는 것과 TypeShade가 소유하는 것, 컴파일러의 리플렉션이 바인드 그룹 레이아웃으로 이어지는 경로, 그리고 WebGL2에서 달라지는 지점을 설명합니다.',
      h1: 'WebGPU와 WebGL2',
      lead: 'TypeShade는 셰이더 텍스트와, 호스트가 거기에 리소스를 바인딩할 때 필요한 데이터를 만들어 냅니다. GPU 쪽의 나머지는 애플리케이션 몫입니다. 디바이스, 파이프라인, 바인드 그룹, 버퍼, 텍스처가 모두 여기에 들어갑니다. 어느 쪽이 무엇을 소유하는지 알면 첫 TypeShade 프로그램에 필요한 것은 거의 다 아는 셈입니다.',
      ownsH: '소유 관계',
      ownsP: 'WebGPU 애플리케이션이 만드는 객체마다 한 행입니다.',
      ownsColumns: ['객체', '애플리케이션이 하는 일', 'TypeShade가 보태는 것'],
      ownsRows: [
        [
          '디바이스',
          '어댑터와 `GPUDevice`를 요청하고 페이지가 살아 있는 동안 들고 있습니다.',
          '없습니다. TypeShade 코드는 WebGPU 객체를 건드리지 않습니다.',
        ],
        [
          '파이프라인',
          '렌더 파이프라인이나 컴퓨트 파이프라인을 만들고 스테이지마다 진입점 이름을 지정합니다.',
          '모듈의 셰이더 텍스트와, 그 안의 진입점 이름을 모두 제공합니다.',
        ],
        [
          '바인드 그룹 레이아웃',
          '바인딩마다 그룹, 번호, 종류, 그리고 그 바인딩을 보는 스테이지를 적습니다.',
          '`reflect()`가 컴파일된 모듈에서 같은 내용을 읽어 돌려줍니다.',
        ],
        [
          '버퍼',
          '버퍼를 할당하고 바이트를 씁니다.',
          '유니폼 구조체의 필드마다 오프셋과 크기와 타입을 알려 줍니다.',
        ],
        [
          '텍스처와 샘플러',
          '둘을 만들어 바인드 그룹에 넣습니다.',
          '셰이더가 선언한 바인딩과, 거기에서 기대하는 타입을 알려 줍니다.',
        ],
      ],
      reflectionH: '리플렉션',
      reflectionP: `\`reflect()\`는 컴파일된 모듈을 읽어 그 바인딩을 돌려줍니다. 셰이더가 선언한 그룹과 번호, 주소 공간, 셰이더에 필요한 접근 권한이 들어 있고, 유니폼 구조체라면 ${facts.layoutStandards.join('과 ')} 레이아웃에 따른 필드별 오프셋과 크기도 함께 있습니다. 호스트는 그 목록으로 바인드 그룹 레이아웃 항목을 만들고, 그 오프셋대로 유니폼 버퍼를 채웁니다. 셰이더를 컴파일할 때 쓰인 수치를 호스트가 그대로 쓰므로 양쪽이 어긋나지 않습니다.`,
      reflectionNote:
        '셰이더에서 필드 이름을 바꾸면 다음 빌드에서 리플렉션이 따라 바뀌고, 리플렉션을 읽는 호스트 코드도 함께 따라옵니다.',
      runtimeH: '런타임 없음',
      runtimeP: `컴파일러는 셰이더 텍스트가 만들어지는 곳에서 돌아갑니다. 빌드, 테스트, 그리고 [언어 서비스](languageService)를 거친 편집기가 그런 곳입니다. 브라우저에 도달하는 것은 생성된 셰이더 소스와, 애플리케이션이 원래 쓰던 호스트 코드뿐입니다. TypeShade가 설치하는 런타임 의존성은 ${facts.runtimeDeps}개, \`compile()\`과 언어 서비스가 소스를 읽을 때 쓰는 TypeScript뿐입니다. 시작할 때 만들어야 할 TypeShade 객체도 없으며 살려 둘 객체도 없습니다.`,
      webgl2H: 'WebGL2에서 달라지는 것',
      webgl2P: '같은 소스가 WebGL2용으로도 컴파일되고, 호스트 쪽 모습은 달라집니다.',
      webgl2Items: [
        '바인드 그룹이 없습니다. 유니폼 블록은 링크된 프로그램의 바인딩 지점에 묶이고 샘플러는 유니폼 위치로 설정하므로, 호스트는 같은 리플렉션을 다른 모양으로 씁니다.',
        `컴퓨트 스테이지가 없습니다. \`@compute\` 진입점이 있는 모듈은 WGSL을 생성하고 ${glsl} 생성은 거부합니다.`,
        `정밀도는 소스의 몫입니다. 생성된 ${glsl} 프로그램은 선언들 위에 기본 정밀도를 적어 두며, WGSL에는 그럴 필요가 없습니다.`,
        'GPU 기능은 호스트가 컨텍스트에 확장을 요청해서 켭니다. 지시문이 있는 확장이라면 생성된 소스도 그 확장을 선언합니다. 컴파일러가 이 두 몫을 어떻게 나누는지는 [컴파일러 내부](internals)가 설명합니다.',
      ],
      furtherH: '더 읽을 자료',
      furtherItems: [
        '[MDN WebGPU API](mdnWebgpu)와 [MDN GPUBindGroupLayout](mdnBindGroupLayout)이 이 페이지가 이름을 댄 호스트 객체입니다.',
        '[MDN WebGL2RenderingContext](mdnWebgl2)는 그 이전 세대의 컨텍스트이며, WebGL2 경로가 쓰는 유니폼과 샘플러 호출이 여기에 있습니다.',
        '[WebGPU 명세](specWebgpu)와 [WebGL2 명세](specWebgl2)가 두 호스트 API를 정의합니다.',
      ],
      nextP:
        '이 경로의 다음 글은 [WGSL과 GLSL](conceptsWgsl)입니다. 소스 하나가 두 타깃에서 무엇으로 컴파일되는지 그대로 보여 줍니다.',
    },

    wgslAndGlsl: {
      title: `WGSL과 ${glsl}`,
      description:
        'TypeShade 소스 하나가 컴파일되는 두 셰이더 언어, 작은 셰이더 하나의 생성 결과, 그리고 두 타깃이 갈라지는 지점을 설명합니다.',
      h1: `WGSL과 ${glsl}`,
      lead: `\`"use typeshade"\` 파일 하나가 WebGPU에는 WGSL로, WebGL2에는 ${glsl}로 도착합니다. 이 페이지의 코드 블록은 페이지를 빌드하는 동안 바로 위의 파일에서 컴파일한 결과이며, 사용한 컴파일러는 ${facts.pinnedCommit}에 고정된 판입니다.`,
      sourceH: '소스',
      sourceP:
        '삼각형 하나입니다. 버텍스 진입점이 위치를 정하고 프래그먼트 진입점이 색을 칠합니다. 구조체 두 개가 스테이지마다 출력 모양을 지정합니다.',
      sourceLabel: 'hello.shade.ts',
      wgslH: 'WGSL',
      wgslP:
        'WGSL은 WebGPU 디바이스가 받아들이는 언어이고, 모듈 하나가 모든 스테이지를 담습니다. 구조체는 구조체로 남고, 진입점은 각자의 스테이지 속성을 그대로 지니며, builtin 입력은 그 값을 받는 매개변수의 속성으로 남습니다.',
      wgslLabel: '생성된 WGSL 모듈',
      glslH: `${glsl}`,
      glslP:
        'WebGL2 프로그램은 버텍스 셰이더 하나와 프래그먼트 셰이더 하나를 링크해 만들기 때문에, 컴파일러는 스테이지마다 별도의 프로그램을 생성합니다. 각 프로그램은 버전 줄과 기본 정밀도로 시작하고, 버텍스 번호는 언어가 예약해 둔 이름으로 들어오며, 프래그먼트 출력은 선언된 out 변수가 됩니다.',
      glslVertexLabel: `생성된 ${glsl} 버텍스 셰이더`,
      glslFragmentLabel: `생성된 ${glsl} 프래그먼트 셰이더`,
      diffH: '타깃이 갈라지는 지점',
      diffP: '차이마다 그 차이를 다루는 가이드 페이지의 이름을 붙였습니다.',
      diffColumns: ['달라지는 것', 'WGSL', `${glsl}`],
      diffRows: [
        [
          '[셰이더 스테이지](languageStages)',
          '`@compute` 진입점은 워크그룹 크기를 담은 컴퓨트 셰이더를 생성합니다.',
          '이 타깃에는 컴퓨트 스테이지가 없어서, 컴퓨트를 선언한 모듈은 WGSL만 생성합니다.',
        ],
        [
          '[정밀도](languageGpuTypes)',
          '타입이 자기 폭을 지니므로 프로그램은 아무것도 선언하지 않습니다.',
          '프로그램이 부동소수점과 정수의 기본 정밀도를 먼저 선언합니다.',
        ],
        [
          '[builtin 입력](languageStages)',
          'builtin은 그 값을 받는 매개변수의 속성으로 남습니다.',
          'builtin은 언어가 예약해 둔 이름이 되고, 매개변수는 사라집니다.',
        ],
        [
          '[스테이지 출력](languageTypes)',
          '스테이지는 필드마다 location을 지닌 구조체를 돌려줍니다.',
          '스테이지는 선언된 out 변수에 쓰고, 위치는 예약된 변수로 갑니다.',
        ],
        [
          '[확장](internals)',
          'GPU 기능은 모듈 맨 위의 선언으로 켭니다.',
          'GPU 기능은 전처리기 줄로 켜고, 호스트도 컨텍스트에 해당 확장을 요청합니다.',
        ],
      ],
      furtherH: '더 읽을 자료',
      furtherItems: [
        '[WGSL 명세](specWgsl)가 두 타깃 가운데 첫 번째를 정의합니다.',
        `[${glsl} 명세](specGlslEs)와 [WebGL2 명세](specWebgl2)가 두 번째를 정의합니다.`,
        '[MDN WebGPU API](mdnWebgpu)와 [MDN WebGL2RenderingContext](mdnWebgl2)에서 호스트가 각각을 드라이버에 어떻게 넘기는지 볼 수 있습니다.',
      ],
      nextP:
        '다음은 [예제](examples)입니다. 컴파일러 레지스트리의 예제마다 어떤 타깃을 생성하는지 적혀 있습니다.',
    },
  },

  languageService: {
    title: '에디터와 언어 서버가 쓰는 TypeShade 언어 서비스',
    description:
      'Playground 뒤에서 일하는 에디터 중립 계층입니다. TypeScript와 TypeShade 진단, 자동 완성, 호버, 이름 바꾸기, 컴파일 결과를 문서 API 하나로 답합니다.',
    h1: '언어 서비스',
    intro:
      '컴파일러 프런트엔드와 에디터 사이에는 텍스트와 위치를 받아 데이터를 돌려주는 계층이 있습니다. 이것이 언어 서비스입니다. DOM이나 Node API는 건드리지 않습니다. 지금은 Playground가 Monaco 에디터를 통해 진단, 자동 완성, 호버를 여기에서 읽고, 나중에는 VS Code와 다른 에디터를 위한 언어 서버가 같은 계층을 읽습니다. 그래서 둘이 서로 어긋날 수 없습니다.',
    layersH: '계층',
    layersP:
      '프런트엔드는 `"use typeshade"` 파일을 파싱하고 타입, 구조체, 바인딩을 검사한 뒤 소스 위치가 붙은 진단을 보고합니다. 언어 서비스는 두 층 위에 놓입니다. 하나는 그 프런트엔드이고, 다른 하나는 TypeShade 전역을 선언한 앰비언트 선언 위에서 돌아가는 TypeScript 언어 서비스입니다. 문서를 `uri`로 들고 있다가 그 문서에 관한 요청에 답합니다. 어댑터는 그 위에서 의미와 무관한 일만 맡습니다. Playground의 Monaco 어댑터는 좌표를 바꾸고 에디터의 마커를 관리하며, LSP 서버는 같은 답을 JSON-RPC로 옮길 뿐입니다. TypeShade에 관한 판단은 서비스 안에 두고, 어댑터는 형식만 바꿉니다.',
    requestsH: '요청',
    requestsP: '에디터가 보내는 요청은 문서 API 하나로 답합니다.',
    requests: [
      [
        '진단',
        'TypeScript 진단과 TypeShade 진단을 한 목록으로 돌려줍니다. 항목마다 `typeshade` 또는 `typescript`라는 `source`와 코드가 붙어 있어 어댑터가 둘을 구분할 수 있고, TypeScript 구문 오류는 TypeScript 코드로 한 번만 나타납니다.',
      ],
      [
        '자동 완성',
        '범위 안의 심볼과 키워드, 그리고 문맥에 맞는 TypeShade 항목을 제안합니다. `@` 뒤에는 속성 이름, `@builtin("` 안에는 내장 입력 이름, 타입 자리에는 GPU 타입 이름, 그리고 벡터와 진입 함수의 스니펫입니다.',
      ],
      [
        '호버',
        '심볼의 요약 정보를 보여 줍니다. TypeScript가 `number`라고 할 자리에 TypeShade 타입 이름을 쓰고, GPU 타입, 속성, 내장 입력의 설명을 붙입니다.',
      ],
      ['시그니처 도움말', '커서 아래 함수의 시그니처와 지금 입력하는 매개변수입니다.'],
      ['정의와 참조', '심볼이 선언된 곳과 쓰인 곳을 서비스가 들고 있는 모든 문서에서 찾습니다.'],
      [
        '문서 심볼',
        '문서의 함수, 구조체, 필드, 리소스를 개요로 정리하고, 진입 함수에는 스테이지를 표시합니다.',
      ],
      [
        '이름 바꾸기',
        '심볼을 쓰는 모든 문서에 적용할 편집 목록을 돌려줍니다. 그 위치의 이름을 바꿀 수 있는지 먼저 확인합니다.',
      ],
      [
        '시맨틱 토큰',
        '문서 순서대로 늘어놓은 토큰입니다. GPU 타입, 진입 함수, 리소스, `@builtin(...)` 안의 이름에는 종류를 표시합니다.',
      ],
      [
        '컴파일 결과',
        '문서를 컴파일한 WGSL 또는 GLSL을 출력 창이 요청할 때만 만듭니다. 진단은 셰이더 텍스트를 만들지 않으므로 키 입력마다 백엔드가 돌지 않습니다.',
      ],
    ],
    documentsH: '문서와 위치',
    documentsP1:
      '`typeshade/language-service` 하위 경로에서 `createTypeshadeLanguageService`를 가져오고, 문서를 `uri`와 텍스트, 선택적인 버전으로 엽니다. 내용이 바뀔 때마다 전체 텍스트로 갱신하고, 에디터가 문서를 닫으면 함께 닫습니다. 다른 메서드는 모두 `uri`를 받고, 필요한 경우 위치를 함께 받습니다. 서비스 안에는 비동기 동작이 없으며, 오래된 버전의 결과를 버리는 일은 어댑터가 맡습니다.',
    documentsP2:
      '위치는 줄과 문자의 쌍이며 둘 다 영에서 시작하고, 문자는 UTF-16 코드 단위로 셉니다. 범위는 끝을 포함하지 않는 반개구간입니다. LSP가 쓰는 규약 그대로이므로 언어 서버는 필드를 그대로 넘기면 됩니다. Monaco는 하나부터 세기 때문에 Playground의 어댑터가 자기 쪽에서 하나를 더하고, 돌아올 때 다시 뺍니다. 두 좌표계가 만나는 곳은 그 어댑터 하나뿐입니다.',
    packagingH: '패키지 구성',
    packagingP:
      '이 서비스는 `typescript` 위에서 돌아가며, 패키지는 이것을 필수 피어 의존성으로 둡니다. `compile()`이 `"use typeshade"` 파일을 TypeScript 파서로 읽기 때문에 기본 진입점에도 필요합니다. 그래서 컴파일러만 가져오는 프로그램도 TypeScript를 함께 설치하고, `typeshade/language-service`는 같은 패키지를 그대로 씁니다.',
    exampleH: '예제',
    exampleP:
      '호스트가 문서 하나를 열고, 진단과 한 위치의 호버를 요청하고, 출력 창을 위해 컴파일합니다.',
    furtherH: '더 읽을 자료',
    furtherP:
      '[Playground](playground)는 브라우저에서 돌아가는 이 서비스입니다. 컴파일러 저장소의 [설계 문서](languageServiceDesign)는 고정한 커밋 기준으로 규약, 어댑터 계약, 작업 순서를 기록합니다.',
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
          linkKey: 'quickStart',
        },
        {
          title: '2. 값과 타입',
          text: 'TypeScript의 type/class가 GPU value layout으로 어떻게 내려가는지 봅니다.',
          label: 'Types',
          linkKey: 'languageTypes',
        },
        {
          title: '3. 계산을 함수로',
          text: 'helper function과 stage entry를 조합해 실제 shader 계산을 구성합니다.',
          label: 'Functions',
          linkKey: 'languageFunctions',
        },
        {
          title: '4. GPU 데이터',
          text: 'vector, matrix, array와 host-owned resource를 연결합니다.',
          label: 'Resources',
          linkKey: 'languageResources',
        },
        {
          title: '5. 실제 예제',
          text: '저장소의 예제를 읽으며 여러 개념을 하나의 shader로 조합합니다.',
          label: 'Source examples',
          linkKey: 'examplesDir',
        },
      ],
    },
    title: `TypeShade 예제 ${facts.totalExamples}개, GLSL 출력, 에뮬레이션 f64`,
    description: `TypeShade 예제 ${facts.totalExamples}개와 그 결과를 표준 출력으로 내보내는 명령, gradient 패스의 ${glsl} 출력, 에뮬레이션 배정밀도의 딥 줌 데모.`,
    h1: '예제',
    intro: `저장소에는 실행할 수 있는 예제가 ${facts.totalExamples}개 있고, 작성 인터페이스 두 가지로 나뉩니다. ${facts.examples}개는 \`fn()\` 빌더로 만들었으며 지도용 패스, ShaderToy 시절의 화면 공간 효과, 에뮬레이션 배정밀도 계열, 컴퓨트 커널 하나를 다룹니다. 그 가운데 ${facts.fp64Examples}개는 에뮬레이션 배정밀도를 씁니다. 빌더로 만든 예제는 [examples/index.ts](examplesIndex)가 내보내고, [예제 디렉터리](examplesDir)에서 둘러볼 수 있습니다.`,
    categories: { cartographic: '지도', generic: '화면 공간', compute: '컴퓨트' },
    columns: { example: '예제', category: '분류', blurb: '설명' },
    tableCaption: `아래 ${facts.examples}개 예제 가운데 ${facts.bothTargets}개는 WGSL과 ${glsl}을 모두 냅니다. ${facts.wgslOnlyExample.title}은 ${glsl}으로 낼 버텍스나 프래그먼트 단계가 없어서 WGSL 전용으로 표시했습니다. WebGL2 경로는 옵션으로 켜는 에뮬레이션입니다.`,
    wgslOnly: 'WGSL 전용',
    noStill: '그림 없음: 이 예제는 페이지가 그릴 수 있는 것이 아닙니다.',
    blurbs: {
      graticule: '지도라면 다 그리는 경위선 격자.',
      hillshade: '음영 기복.',
      'fp64-deep-zoom': '에뮬레이션 배정밀도(f32 두 개로 만든 df64).',
      'fp64-checker-plane': '월드 평면 위의 1단위 체커보드.',
      'fp64-loran': 'LORAN 방식의 해도 격자.',
      'fp64-mercator-tiles': '타일 엔진이 쓰는 그 계산식.',
      'fp64-rtc': '행성 규모 엔진이 시점 기준으로 렌더링하는 이유.',
      'color-ramp': '데이터로 색을 정하는 단계구분도 색상 램프.',
      'discard-cutout':
        '가운데 원 바깥에서는 픽셀을 버리고 안쪽에서는 채움 색을 돌려주는 프래그먼트 헬퍼입니다. 프래그먼트 IO 구조체 생성자에 인자로 한 번 넣습니다.',
      plasma: '사인파를 여러 개 더해 만든 고전 플라스마에 RGB 팔레트로 색을 입혔습니다.',
      voronoi: '움직이는 셀룰러 노이즈.',
      julia: '탈출 시간으로 그리는 줄리아 프랙탈.',
      mandelbrot: '탈출 시간을 매끄럽게 이어 칠한 만델브로 집합.',
      'fbm-clouds': '프랙탈 브라운 운동.',
      'domain-warp': 'fbm 출력을 다시 fbm에 넣습니다.',
      'raymarch-sphere':
        '구의 부호 있는 거리 필드입니다. 카메라 광선에서 스피어 트레이싱으로 찾고, 궤도를 도는 광원으로 블린퐁 셰이딩합니다.',
      'raymarch-boxes': '도메인 반복.',
      tunnel: '데모신 시절의 터널.',
      metaballs: '음함수로 그린 방울.',
      ocean: '원리부터 계산해 그린 바다 풍경.',
      starfield: '텍스처 없이 그린 밤하늘.',
      truchet: '타일 하나.',
      kaleidoscope: '극좌표로 접는 거울 반사.',
      heart:
        '하트 곡선 (x²+y²-1)³ = x²y³입니다. 부호로 안쪽을 채우고 fwidth로 가장자리를 다듬었으며, 뾰족하게 만든 사인파 박동에 맞춰 뛰고 박자에 맞춰 빛납니다.',
      'fp64-mandelbrot': 'f32 두 개로 만든 배정밀도의 고전 데모.',
      'fp64-julia': '같은 배정밀도 기법을 줄리아 집합으로 보인 예제.',
      'fp64-burning-ship':
        '버닝 십 프랙탈입니다. 제곱하기 전에 |Re z|, |Im z|로 접고, 바늘처럼 뾰족한 부분을 확대합니다.',
      'fp64-newton':
        'z³ = 1을 푸는 뉴턴 방법입니다. 색은 그 픽셀이 어느 세제곱근으로 수렴하는지 나타냅니다.',
      'fp64-mandelbrot-de':
        '거리 추정(d = ½·|z|·ln|z|/|dz|)으로 만델브로 경계를 그립니다. 정밀도는 식 중간에서 나눕니다.',
      'fp64-clock': '오래 켜 두면 생기는 애니메이션 버그.',
      'fp64-cancellation': '수치해석 교과서의 그 그래프를 GPU로 그립니다.',
      'fp64-sine-sweep': '큰 기준값에 화면에서 조금씩 움직이는 값을 더한 x로 sin(x)를 구합니다.',
      gradient: '섞는 비율을 조절할 수 있는 세로 방향 두 색 그러데이션.',
      'override-quality': '파이프라인에서 덮어쓸 수 있는 `quality` 상수.',
      'texture-array-lod': '타일 아틀라스를 `texture_2d_array<f32>` 바인딩 하나로 씁니다.',
      'compute-reduction':
        '@workgroup_size가 붙은 컴퓨트 커널입니다. 입력 스토리지 버퍼의 한 구간을 reduce()로 접어 출력 원소 하나로 만듭니다.',
    },
    shade: {
      h: 'TypeScript 소스로 쓴 예제',
      p: `같은 디렉터리에 있는 예제 ${facts.shadeExamples}개는 \`"use typeshade"\`로 시작하는 TypeScript 파일이고, \`compile()\`이 파일의 바이트를 그대로 읽어 컴파일합니다. 파일마다 언어의 한 부분을 보여 주므로 여기서도 그 기준으로 묶었습니다. 이 가운데 ${facts.shadeRenderable}개는 ${glsl} 형태가 있고, 나머지는 WGSL만 생성합니다. 페이지가 그릴 수 있는 예제에는 그림이 붙습니다.`,
      groups: {
        stages: '스테이지와 IO 구조체',
        resources: '리소스',
        values: '값과 제어 흐름',
        classes: '클래스와 제네릭',
        compute: '모듈 상태와 컴퓨트',
        twins: '소스 트윈',
      },
      titles: {
        hello: '헬로 삼각형',
        'hello-vsout': '헬로 varying',
        'hello-vsin': '헬로 버텍스 속성',
        'bare-position': '위치만 돌려주는 버텍스',
        'twin-structs': '같은 IO 구조체 둘',
        'hello-uniform': '헬로 유니폼',
        'hello-uniform-struct': '헬로 유니폼 블록',
        'hello-camera': '헬로 카메라 유니폼',
        'textured-quad': '텍스처, 샘플러, 오버라이드',
        'array-length': '런타임 배열 길이',
        'storage-texture': '스토리지 텍스처',
        'shadow-compare': '비교로 읽는 그림자 맵',
        'cube-env': '큐브와 3D 텍스처, 바이어스와 그레이디언트',
        'cube-array-gather': 'WGSL에만 있는 텍스처',
        'msaa-resolve': '직접 리졸브하는 멀티샘플 텍스처',
        'module-const': '모듈 상수',
        'palette-const': '모듈의 벡터 상수와 배열 상수',
        'array-literal-ramp': '배열 리터럴',
        'convert-grid': '변환하는 생성자',
        'normal-matrix': 'mat4 너머의 행렬',
        'fp64-lane-stripes': '에뮬레이션 배정밀도',
        'bitfield-bands': '비트 필드 띠',
        'block-scope': '블록 스코프',
        'pick-composite': '구조체와 배열을 고르는 조건식',
        cutout: '컷아웃 (소스 언어)',
        'default-args': '매개변수 기본값',
        'bit-bump': '내장 함수 한 바퀴',
        'bool-select': '불 벡터',
        'ray-class': '클래스 메서드',
        'orbit-inout': '자기 객체를 바꾸는 메서드',
        'particle-step': '객체를 바꾸는 메서드들',
        'shape-inheritance': '상속',
        'mixin-surface': '믹스인 패턴',
        'generic-helpers': '단형화로 만드는 제네릭',
        'generic-class': '단형화로 만드는 제네릭 클래스',
        'tuple-and-brand': '튜플과 브랜드 별칭',
        'class-syntax': '게터, 세터, 비공개 이름, 매개변수 프로퍼티',
        'rng-method': '자기 객체를 바꾸고 값을 돌려주는 메서드',
        'class-builder': '빌더 체인, 접근자의 super, 서브클래스가 물려받는 정적 멤버',
        'class-parts':
          '객체 안의 객체, 객체를 담은 const, 함수를 담은 필드, 계약으로서의 인터페이스',
        closures: '주변 변수를 읽고 쓰는 로컬 함수',
        'higher-order': '함수를 받는 함수',
        'inferred-returns': '본문이 정하는 반환 타입',
        'loops-over-data': '데이터를 도는 루프',
        'path-tracer': '경로 추적기',
        'workgroup-tile-2d': '이차원 워크그룹',
        'private-state': '인보케이션별 상태',
        'workgroup-scratch': '워크그룹 스크래치 메모리',
        'workgroup-reduce': '워크그룹 리덕션',
        'atomic-histogram': '원자적 히스토그램',
        'compute-reduction-twin': '컴퓨트 리덕션 (소스 트윈)',
        'hillshade-twin': 'hillshade (소스 트윈)',
        'plasma-twin': '플라스마 (소스 트윈)',
        'julia-twin': '줄리아 집합 (소스 트윈)',
        'mandelbrot-twin': '만델브로 집합 (소스 트윈)',
        'domain-warp-twin': '도메인 워핑 (소스 트윈)',
        'tunnel-twin': '터널 (소스 트윈)',
        'ocean-twin': '바다 수평선 (소스 트윈)',
        'starfield-twin': '별밭 (소스 트윈)',
        'kaleidoscope-twin': '만화경 (소스 트윈)',
        'gradient-twin': '그레이디언트 패스 (소스 트윈)',
        'voronoi-twin': '보로노이 (소스 트윈)',
        'fp64-deep-zoom-twin': 'fp64 딥 줌 (소스 트윈)',
        'fp64-checker-plane-twin': 'fp64 체커 평면 (소스 트윈)',
        'fp64-loran-twin': 'fp64 쌍곡선 항법 (소스 트윈)',
        'fp64-rtc-twin': 'fp64 중심 기준 좌표 (소스 트윈)',
        'fp64-julia-twin': 'fp64 줄리아 집합 (소스 트윈)',
        'fp64-burning-ship-twin': 'fp64 버닝 십 (소스 트윈)',
        'fp64-newton-twin': 'fp64 뉴턴 프랙탈 (소스 트윈)',
        'fp64-mandelbrot-de-twin': 'fp64 거리 추정 (소스 트윈)',
        'fp64-clock-twin': 'fp64 오래 켜 둔 시계 (소스 트윈)',
        'fp64-cancellation-twin': 'fp64 파국적 상쇄 (소스 트윈)',
        'fp64-sine-sweep-twin': 'fp64 사인 스윕 (소스 트윈)',
        'id-pick': '정수 varying과 고를 수 없는 보간',
        'clip-planes': '사용자 클립 평면',
        'uniform-array': '목록을 담은 유니폼',
        'sample-branch': '분기 안의 샘플링과 그것을 허용하는 지시어',
        'integer-math': '정수 abs와 dot',
        'packing-bitcast': '패킹, bitcast, 생성자',
        'packed-bytes': '패킹된 4x8 정수 내장 함수',
        'compute-sync': '비교 후 교환, 유니폼 로드, 텍스처 배리어',
      },
      descriptions: {
        hello: '가장 작은 완전한 TypeShade 프로그램입니다.',
        'hello-vsout':
          '삼각형을 다시 그리되, 이번에는 버텍스 스테이지에서 프래그먼트 스테이지로 `uv` varying을 넘깁니다. 두 스테이지가 `VsOut` 클래스 하나를 함께 씁니다.',
        'hello-vsin': '`vertex_index` 대신 버퍼에서 버텍스 입력을 받습니다.',
        'bare-position': '가장 작은 렌더 쌍입니다.',
        'twin-structs':
          '필드가 똑같은 IO 구조체 둘, 곧 버텍스 출력과 프래그먼트 입력입니다. 객체 리터럴이 어느 쪽을 만드는지는 리터럴이 놓인 세 자리가 각각 정합니다.',
        'hello-uniform': '`declare const scale: uniform<f32>` 한 줄뿐입니다.',
        'hello-uniform-struct': 'GLSL ES 3.00 형태가 있는 쪽의 유니폼입니다.',
        'hello-camera':
          '`mat4`와 `vec3`를 담은 `Camera` 클래스를 `uniform<Camera>` 뒤에 두고, 평범한 헬퍼 함수가 읽습니다.',
        'textured-quad':
          '전체 화면 삼각형이 `sampler`를 거쳐 `texture_2d<f32>`를 샘플링하고, `override<f32>` 특수화 상수 두 개로 색을 입힙니다.',
        'array-length':
          '런타임 크기 스토리지 배열을 도는 커널이라면 반드시 필요한 경계 검사입니다.',
        'storage-texture':
          '컴퓨트 진입점이 텍셀 좌표로 직접 쓰는 이미지입니다. 샘플러도 필터링도 없습니다.',
        'shadow-compare':
          '`sampler_comparison`을 거쳐 깊이 텍스처를 `textureSampleCompare`와 `textureSampleCompareLevel`로 읽습니다. 평범한 2D 그림자 맵과 캐스케이드 배열 양쪽에서 씁니다.',
        'cube-env':
          '환경 맵은 방향으로 찾는 `texture_cube<f32>`, 컬러 그레이딩 표는 셰이딩한 색으로 색인하는 `texture_3d<f32>`입니다. `textureSampleBias`와 `textureSampleGrad`를 쓰고, 점광원의 그림자는 광원에서 나가는 방향으로 비교하는 `texture_depth_cube`입니다.',
        'cube-array-gather':
          '색상 램프는 `texture_1d<f32>`, 환경 맵 둘은 레이어로 고르는 `texture_cube_array<f32>`입니다. `textureGatherCompare`로 퍼센티지 클로저 필터를 손으로 짜고, `textureGather`로 텍셀 네 개에서 채널 하나를 모으며, 점광원의 그림자는 `texture_depth_cube_array`입니다.',
        'msaa-resolve':
          'MSAA 렌더 타깃을 `texture_multisampled_2d<f32>`로 두고 `textureLoad(t, coords, sampleIndex)`로 샘플을 하나씩 읽어 `textureNumSamples`만큼 평균을 구합니다. 깊이 어태치먼트는 `texture_depth_multisampled_2d`입니다.',
        'module-const':
          '컴파일러가 허용하는 모든 스칼라 타입으로 모듈 범위 상수를 하나씩 선언합니다.',
        'palette-const':
          '전체 화면 삼각형을 모듈 범위의 `array<vec4, 3>` 팔레트와 `array<f32, 3>` 구간값으로 띠 지어 칠하고, 앞서 선언한 스칼라 상수로 만든 `vec3` 상수도 함께 씁니다.',
        'array-literal-ramp':
          '전체 화면 삼각형의 꼭짓점은 `array<f32, 3>` 목록 두 개에서 오고, 색은 `array<i32, 3>`으로 가중한 `array<vec3, 3>` 구간값에서 옵니다.',
        'convert-grid':
          '전체 화면 삼각형의 꼭짓점은 `vec2(vec2u(...))`에서 오고, 색은 `f32`에서 `u32`로 갔다가 다시 `f32`로 돌아오는 왕복에서 옵니다.',
        'normal-matrix': '`matCxR`는 모두 타입입니다.',
        'fp64-lane-stripes': '소스로 쓴 `f64` 인터페이스입니다.',
        'bitfield-bands':
          '전체 화면 삼각형의 색을 `switch`로 고릅니다. 띠 번호는 `&=`, `|=`, `<<=`, `>>=`, `^=`로 만들고, `let x: f32`는 값을 넣기 전에 먼저 선언하며, varying은 `{ pos, uv }` 축약형으로 돌려줍니다.',
        'block-scope':
          '`i`를 도는 반복문 둘이 이어지고, 반복문 본문의 `p` 옆에 `if` 분기의 `p`가 있으며, 안쪽 `p`가 바깥쪽을 가립니다.',
        'pick-composite': '분기 둘은 구조체, 다른 둘은 고정 길이 배열이고, 실행 중에 고릅니다.',
        cutout:
          '프래그먼트 진입점이 부르는 헬퍼 안에서 `discard`를 씁니다. `fwidth`가 테두리를 부드럽게 하고, `saturate`, `exp2`, `**`가 감쇠 곡선을 만듭니다.',
        'default-args': '매개변수에 기본값을 둔 헬퍼 셋입니다. 호출마다 생략하는 인자가 다릅니다.',
        'bit-bump':
          '`reflect`, `refract`, `faceForward`가 범프에 빛을 주고, `transpose`와 `determinant`가 호스트 행렬을 읽으며, 비트 내장 함수(`firstLeadingBit`, `reverseBits`, `countOneBits`, `extractBits`, `insertBits`)가 화면에 띠를 만듭니다. 띠가 시작하는 자리는 `fwidthCoarse`가 표시합니다.',
        'bool-select': '벡터 둘을 비교하면 결과는 불 벡터입니다.',
        'ray-class':
          '생성자와 메서드 하나, 정적 함수 하나를 둔 `class Ray`, 그리고 `hit(ray)` 메서드가 광선을 따라간 거리를 돌려주는 `class Sphere`입니다.',
        'orbit-inout':
          '`class Body`의 `step`, `turn`, `advance`가 `this`에 값을 넣으므로, 각 메서드는 자기 객체를 참조로 받습니다.',
        'particle-step':
          '`class Particle`의 `step`, `bounce`, `tick`이 `this`에 값을 넣고, 스토리지 요소 위에서 호출됩니다.',
        'shape-inheritance':
          '구체 메서드 하나와 추상 메서드 하나를 둔 `abstract class Shape`, 이를 상속한 클래스 둘, 그리고 그 하위 클래스를 다시 상속해 `super`를 부르는 클래스 하나입니다.',
        'mixin-surface':
          '본문이 `return class extends Base { ... }` 하나뿐인 `function Tinted(Base)`를 서로 다른 도형 클래스 둘에 적용합니다.',
        'generic-helpers':
          '제네릭 헬퍼 셋입니다. 파일이 부를 때 쓴 인자 타입 조합마다 한 번씩 컴파일됩니다.',
        'generic-class':
          'f32와 vec3에 쓴 `class Slot<T>`입니다. 모듈에는 `Slot_f32`와 `Slot_vec3`가 서로 다른 구조체로 들어가고, 저마다 생성자와 모든 메서드의 복사본을 따로 갖습니다.',
        'tuple-and-brand':
          '튜플은 타입이 길이를 정해 둔 목록이고 `array<T, N>`이 바로 그것이므로, `[f32, f32]`는 곧 `array<f32, 2>`입니다.',
        'class-syntax': 'TypeScript 클래스를 쓰는 방식 그대로 작성한 `class Ring`입니다.',
        'rng-method':
          '`next()`가 생성기의 상태를 앞으로 옮기고 뽑은 값을 돌려주는 `class Rng`입니다.',
        'class-builder':
          '모든 `return`이 `return this`인 메서드는 자기 객체를 돌려주므로 `a.at(p).tinted(c)`는 호출을 차례로 `a`에서 실행하고, `new Disc().at(p).sized(r)`는 `new`가 만든 값을 임시 변수에 담습니다(규칙 8.10).',
        'class-parts':
          '`ring.advance(dt)`는 자신이 담은 `Mover`의 `step`을 불러 고리를 옮깁니다. 그래서 `step`이 어느 클래스의 것이든 `advance`는 자기 객체를 바꾸고 참조로 받습니다(규칙 8.10).',
        closures:
          '`ring`은 TypeScript 클로저처럼 프래그먼트 진입점의 `p`와 `width`를 읽고 그 `glow`에 더합니다.',
        'higher-order':
          '`cover`와 `around4`는 거리 필드를 함수 `f: Field`로 받고, 제네릭 함수가 타입 인자 조합마다 한 번 컴파일되듯 호출이 넘기는 함수마다 한 번씩 컴파일됩니다(규칙 8.18).',
        'inferred-returns':
          '반환 타입을 적은 함수가 하나도 없고, TypeScript가 추론하듯 저마다 본문이 돌려주는 것을 돌려줍니다(규칙 8.19).',
        'loops-over-data':
          '데이터를 다루는 프로그램이 쓰는 세 가지 루프를 Tint와 실제 WebGL2 컨텍스트로 확인합니다.',
        'path-tracer': '평범한 TypeScript로 쓴 작은 경로 추적기입니다.',
        'workgroup-tile-2d': '`@compute([8, 8])`는 WGSL의 `@workgroup_size(8, 8)`입니다.',
        'private-state':
          '최상위의 평범한 `let seed: u32`는 WGSL의 `var<private>`입니다. 인보케이션마다 복사본이 하나씩 있고, 그 인보케이션의 모든 함수가 함께 씁니다.',
        'workgroup-scratch':
          '`let tile: workgroup<array<f32, 64>>`는 WGSL의 `var<workgroup>`입니다. 워크그룹마다 복사본이 하나씩 있어 그 안의 인보케이션들이 함께 쓰며, 여기서는 인보케이션이 한 칸씩 차지하는 스크래치로 씁니다. 원자적 값의 워크그룹 배열과 인보케이션별 카운터도 함께 둡니다.',
        'workgroup-reduce':
          '인보케이션 64개가 값 64개를 워크그룹 메모리로 하나에 모읍니다. `workgroupBarrier()`가 라운드 순서를 잡습니다.',
        'atomic-histogram':
          '여러 인보케이션이 `atomicAdd(bins[bin], 1)`로 같은 칸에 동시에 값을 더합니다. 한 번의 호출은 쪼갤 수 없는 한 걸음이고, 스토리지 구조체의 필드와 `storage<atomic<u32>>` 선언이 위치를 적는 나머지 두 가지 모양을 보여 주며, 원자 연산이 돌려주는 값은 더하기 전에 들어 있던 값입니다.',
        'compute-reduction-twin': '`compute-reduction.ts`를 소스 언어로 다시 쓴 예제입니다.',
        'hillshade-twin': '`hillshade.ts`를 소스 언어로 다시 쓴 예제입니다.',
        'plasma-twin': '`shadertoy-plasma.ts`를 소스 언어로 다시 쓴 예제입니다.',
        'julia-twin': '`julia.ts`를 소스 언어로 다시 쓴 예제입니다.',
        'mandelbrot-twin': '`mandelbrot.ts`를 소스 언어로 다시 쓴 예제입니다.',
        'domain-warp-twin': '`domain-warp.ts`를 소스 언어로 다시 쓴 예제입니다.',
        'tunnel-twin': '`tunnel.ts`를 소스 언어로 다시 쓴 예제입니다.',
        'ocean-twin': '`ocean.ts`를 소스 언어로 다시 쓴 예제입니다.',
        'starfield-twin': '`starfield.ts`를 소스 언어로 다시 쓴 예제입니다.',
        'kaleidoscope-twin': '`kaleidoscope.ts`를 소스 언어로 다시 쓴 예제입니다.',
        'gradient-twin':
          '`gradient-pass.ts`를 `fn()` / `module()`로 만드는 대신 소스 언어로 다시 쓴 예제입니다.',
        'voronoi-twin':
          '`voronoi.ts`를 소스 언어로 다시 쓴 예제이며, 이슈 #40을 지키는 게이트입니다.',
        'fp64-deep-zoom-twin': '`fp64-deep-zoom.ts`를 소스 언어로 다시 쓴 예제입니다.',
        'fp64-checker-plane-twin': '`fp64-checker-plane.ts`를 소스 언어로 다시 쓴 예제입니다.',
        'fp64-loran-twin': '`fp64-loran.ts`를 소스 언어로 다시 쓴 예제입니다.',
        'fp64-rtc-twin': '`fp64-rtc.ts`를 소스 언어로 다시 쓴 예제입니다.',
        'fp64-julia-twin': '`fp64-julia.ts`를 소스 언어로 다시 쓴 예제입니다.',
        'fp64-burning-ship-twin': '`fp64-burning-ship.ts`를 소스 언어로 다시 쓴 예제입니다.',
        'fp64-newton-twin': '`fp64-newton.ts`를 소스 언어로 다시 쓴 예제입니다.',
        'fp64-mandelbrot-de-twin': '`fp64-mandelbrot-de.ts`를 소스 언어로 다시 쓴 예제입니다.',
        'fp64-clock-twin': '`fp64-clock.ts`를 소스 언어로 다시 쓴 예제입니다.',
        'fp64-cancellation-twin': '`fp64-cancellation.ts`를 소스 언어로 다시 쓴 예제입니다.',
        'fp64-sine-sweep-twin': '`fp64-sine-sweep.ts`를 소스 언어로 다시 쓴 예제입니다.',
        'id-pick': 'WGSL 방식의 진입점 입출력입니다.',
        'clip-planes':
          '`@builtin("clip_distances")`로 사용자 클립 평면 네 개를 둡니다. 래스터라이저가 래스터화하기 전에 읽는 버텍스 출력입니다.',
        'uniform-array': '`array<f32, 4>`를 담은 `uniform`입니다.',
        'sample-branch': 'WGSL은 `textureSample`을 균일한 제어 흐름에서만 부르게 합니다.',
        'integer-math':
          '레지스트리가 이식 가능하다고 했지만 실제로는 그렇지 않았던 내장 함수 둘입니다.',
        'packing-bitcast': 'WGSL에는 있지만 이 표면에 없던 이식 가능한 내장 함수들입니다.',
        'packed-bytes':
          '`u32` 하나를 바이트 네 개로 읽거나 네 개를 다시 써 넣는 내장 함수 여덟 개입니다.',
        'compute-sync': 'WGSL에는 있지만 이 표면에 없던 동기화 내장 함수 세 개입니다.',
      },
    },
    page: {
      // 영어와 같은 방식입니다. 60자 상한에 들어가는 가장 긴 꼬리말을 고르고, 꼬리말 사이 간격을
      // 15자 이하로 두어 어떤 예제 이름이 와도 45자 아래로 내려가지 않게 했습니다.
      title: (name: string) => {
        const suffixes = [
          ', TypeShade 예제 소스와 컴파일러가 낸 셰이더 코드를 한 화면에서 봅니다',
          ', TypeShade 예제와 컴파일러가 낸 셰이더 코드',
          ', TypeShade 셰이더 예제',
          ' 예제, TypeShade',
        ];
        const fitting = suffixes.find((suffix) => (name + suffix).length <= 60);
        return fitting ? name + fitting : name;
      },
      description: (name: string, blurb: string) => `TypeShade 예제 ${name}. ${blurb}`,
      descriptionPad: `소스와 WGSL 출력, ${glsl} 단계까지 한 페이지에 모았습니다.`,
      source: '소스',
      tabs: '소스와 출력 결과',
      canvas: (name: string) => ({
        neutral: `${name}. 빌드할 때 그린 화면입니다.`,
        webgpu: `${name}. WebGPU에서 실행 중입니다.`,
        webgl2: `${name}. WebGL2에서 실행 중입니다.`,
        none: `${name}. 빌드할 때 그린 화면입니다. 이 브라우저에는 WebGPU도 WebGL2도 없습니다.`,
        reduced: `${name}. 시스템이 움직임 줄이기를 켜 두어 한 프레임만 그렸습니다.`,
      }),
      emittedNote: `WGSL과 GLSL 탭은 커밋 ${facts.pinnedCommit}의 컴파일러가 직접 낸 출력입니다. 컴파일러의 출력 검사가 구워 둔 골든 파일에서 그대로 읽어 왔습니다([emit-goldens.test.ts](goldens)).`,
      wgsl: 'WGSL',
      glslVertexTab: 'GLSL 버텍스',
      glslFragmentTab: 'GLSL 프래그먼트',
      glslVertex: `${glsl} 버텍스`,
      glslFragment: `${glsl} 프래그먼트`,
      github: 'GitHub의 파일',
      playground: 'Playground에서 열기',
      editable:
        '편집기에는 이 예제의 파일이 들어 있습니다. 내용을 고치면 브라우저에서 다시 컴파일하고, 편집기 옆의 탭이 따라 바뀝니다.',
      builder:
        '이 예제는 `fn()` 빌더 API로 작성해서 [Playground](playground)의 편집기가 받지 않습니다.',
      noPicture: {
        'no-glsl': `이 예제는 ${glsl} 형태가 없고 캔버스는 두 백엔드에서 같은 프로그램을 돌리므로, 이 페이지에는 그림이 없습니다.`,
        control:
          '이 예제를 움직이는 컨트롤에 페이지가 넣을 값이 없어서, 이 페이지에는 그림이 없습니다.',
        texture:
          '이 예제가 읽는 텍스처에 페이지가 넣을 데이터가 없어서, 이 페이지에는 그림이 없습니다.',
        uniform:
          '이 예제가 선언한 유니폼 필드에 페이지가 넣을 값이 없어서, 이 페이지에는 그림이 없습니다.',
        'vertex-buffer':
          '이 예제는 버텍스 속성을 버퍼에서 읽는데 페이지가 그 버퍼를 바인딩하지 않아서, 그림이 없습니다.',
      },
    },
    printIntro:
      '저장소를 받아 둔 디렉터리에서 실행합니다. 첫 번째 명령은 모든 예제의 WGSL, GLSL, 리플렉션을 출력하고, 두 번째는 id로 하나만 출력합니다.',
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
    description:
      'TypeShade의 작성 API를 절마다 설명합니다. 값, 제어 흐름, 레이아웃, 진단, 에뮬레이션 f64, 프로덕션 출력, GLSL 셰이더 옮기기.',
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
      description:
        'TypeScript 개발자가 TypeShade의 문법과 GPU 의미론을 예제와 함께 단계적으로 배우고, JavaScript와 달라지는 실행 규칙까지 이해하는 언어 가이드입니다.',
      h1: 'TypeShade 언어 가이드',
      intro:
        'TypeShade를 문법 목록으로 외우기보다, 이미 알고 있는 TypeScript 개념에서 출발해 GPU에서 그 개념이 어떻게 달라지는지 이해하세요. 각 항목은 문법, 의미, 작은 예제, 실제 shader 사용 순서로 읽는 것을 권장합니다.',
      boundaryH: '1. 먼저 `use typeshade`를 이해하기',
      boundaryP:
        '`"use typeshade"`는 단순한 문자열이 아니라 파일의 언어 경계를 선언합니다. 이 파일에서는 TypeScript의 익숙한 작성 표면을 사용하면서도 TypeShade의 타입, resource, stage, builtin 규칙을 적용합니다.',
      boundaryNote:
        '파일의 첫 directive를 보면 이 코드가 일반 TypeScript 모듈과 같은 방식으로 해석되지 않는다는 것을 알 수 있습니다.',
      syntaxH: '2. TypeScript 문법은 출발점입니다',
      syntaxP:
        '변수, 함수, type alias, class, 조건문, 반복문 같은 표면은 TypeScript 개발자에게 익숙합니다. 그러나 shader는 JavaScript 프로그램처럼 실행되지 않습니다. 컴파일러가 GPU 코드로 내릴 수 있는 값과 연산만 TypeShade 프로그램의 의미를 가집니다.',
      syntaxTableHeader1: 'TypeScript 개념',
      syntaxTableHeader3: '달라지는 의미',
      syntaxTableRows: [
        ['function', 'helper / entry', 'GPU에서 실행 가능한 함수가 됩니다.'],
        ['type', 'GPU value shape', '허용되는 GPU 값과 layout을 기준으로 검사합니다.'],
        ['class', 'GPU struct', 'struct와 그 곁에 쓴 함수들이며, runtime object는 없습니다.'],
        [
          'if / for',
          'GPU control flow',
          'JavaScript runtime 전체가 아니라 컴파일 가능한 흐름입니다.',
        ],
      ],
      gpuH: '3. GPU 개념은 소스에 드러납니다',
      gpuP: 'TypeShade의 중요한 차이는 GPU 인터페이스를 숨기지 않는다는 점입니다. resource는 `declare`로, stage는 decorator가 붙은 top-level function으로, builtin 입력은 `@builtin(...)` parameter로 표현합니다.',
      gpuNote:
        '여기서 `camera`와 `pixels`는 shader가 생성하지 않습니다. `gid` 역시 전역 변수로 주입되지 않고 함수 입력으로 선언됩니다.',
      functionH: '4. 함수는 값의 흐름을 설명합니다',
      functionP:
        'TypeScript에서 parameter와 return type이 함수의 계약을 설명하듯 TypeShade에서도 함수 시그니처가 값의 흐름을 설명합니다. 여기에 stage와 builtin이라는 shader-specific 의미가 추가됩니다.',
      functionNote:
        '`addBias`는 재사용 가능한 helper이고 `paint`는 compute entry입니다. 같은 함수 문법을 사용하지만 pipeline에서 맡는 역할은 다릅니다.',
      resourceH: '5. Resource는 호스트와의 경계입니다',
      resourceP:
        '`uniform<T>`와 `storage<T>`는 JavaScript 객체가 아니라 호스트가 제공하는 GPU resource입니다. `declare`는 shader가 그 값을 생성하지 않는다는 사실을 코드에 남깁니다.',
      resourceNote:
        '`const`와 `let`은 여기서 단순한 변수 스타일이 아니라 resource 접근 모드와 연결됩니다.',
      stageH: '6. Entry function은 pipeline의 시작점입니다',
      stageP:
        '`@vertex`, `@fragment`, `@compute`는 함수가 어느 shader stage의 entry인지 선언합니다. builtin은 자동으로 생기는 전역 변수가 아니라 entry parameter로 받아야 합니다.',
      completeH: '7. 하나의 shader로 합쳐 보기',
      completeP:
        '아래 코드를 한 줄씩 읽어 보세요. language directive에서 시작해 GPU struct, resource, compute stage, builtin parameter가 하나의 프로그램 계약으로 연결됩니다.',
      tsH: '8. TypeScript에서 가져온 것과 바뀐 것',
      tsRows: [
        ['`declare`', '`declare`는 호스트가 제공하는 GPU 리소스를 가리킵니다.'],
        ['함수 매개변수', 'GPU 값이거나 스테이지가 넘겨주는 builtin 입력입니다.'],
        ['클래스', 'GPU 구조체와 필드 메타데이터입니다.'],
        ['숫자', '`f32`, `i32`, `u32`처럼 GPU 숫자 타입을 명시해 적습니다.'],
      ],
      tsNote:
        '즉 TypeShade는 TypeScript 문법을 복제하는 언어가 아니라 TypeScript의 authoring 경험을 GPU 언어의 의미론에 연결하는 언어입니다.',
      refsH: '9. 다음에 읽을 자료',
      refsP:
        'TypeShade의 개념을 처음 배울 때는 TypeScript의 타입과 함수 문서를 함께 읽고, JavaScript의 실행 모델을 확인한 뒤 GPU 개념으로 넘어가면 이해가 빠릅니다.',
      nextH: '10. 학습 순서',
      nextP:
        'Quick start에서 실행 가능한 첫 파일을 만든 뒤 Types, Functions, Control flow, GPU types, Resources, Shader stages 순서로 확장하세요.',
      nextLink: 'Quick start',
    },
    topics: {
      types: {
        title: 'TypeShade 타입',
        description:
          'TypeScript의 type과 class 개념을 TypeShade의 GPU 값, struct, 필드 layout과 연결하는 방법을 설명합니다.',
        h1: 'Types: TypeScript 타입에서 GPU 값으로',
        intro:
          'TypeShade는 TypeScript의 타입 표면을 출발점으로 삼지만 타입의 최종 의미는 GPU 값 모델에 있습니다. 먼저 TypeScript의 structural typing과 type alias를 이해하고, GPU layout metadata가 필요한 경우 class와 field decorator를 사용합니다.',
        ts: 'TypeScript에서 출발하기',
        tsP: 'Type alias는 값의 shape를 이름 붙이는 방법입니다. TypeShade에서도 이 표면을 유지하지만, 사용 가능한 타입과 표현식은 shader semantics가 결정합니다.',
        alias: '1. 타입 별칭은 plain data에 사용',
        aliasP:
          '필드에 decorator가 필요 없다면 type alias가 가장 단순한 표현입니다. 여러 함수의 인자나 반환값에서 같은 GPU value shape를 공유할 때도 유용합니다.',
        struct: '2. class는 struct와 그 함수들',
        structP:
          'TypeShade의 class는 GPU struct이면서 그 곁에 쓴 함수들입니다. 필드는 호스트가 채우는 바이트입니다. 생성자와 메서드와 static 함수는 각각 평범한 함수로 내려가서, `new Ray(o, d)`는 `Ray_new`를 부르고 `r.at(t)`는 `Ray_at(r, t)`를 부릅니다. 그 사이에 살아 있는 객체는 없습니다.',
        attrs: '3. 필드 decorator는 레이아웃을 설명',
        attrsP:
          '필드에는 파이프라인의 자리에 연결하는 `@location`과 `@builtin`을 붙이고, 스테이지 사이를 오가는 값이나 출력의 성질을 정하는 `@interpolate`, `@invariant`, `@blend_src`도 붙일 수 있습니다. `@align`은 읽고 나서 거부하며 `@size`, `@offset`, `@ignore`는 컴파일러가 아는 어트리뷰트가 아닙니다. 받아들이는 전체 집합은 `@vertex`, `@fragment`, `@compute`, `@builtin`, `@location`, `@interpolate`, `@invariant`, `@blend_src`, `@diagnostic`입니다.',
        boundary: '4. TypeScript의 class와 다른 점',
        boundaryItems: [
          '진입점은 최상위 함수이고 메서드가 아닙니다.',
          '필드가 없는 class는 struct가 아니므로 그 함수들은 함수로 씁니다.',
          'getter와 setter는 각각 제 함수로 내려가고, 생성자는 TypeScript처럼 클래스마다 하나입니다.',
          '`new`는 함수 본문 안에서 값을 만들고, 모듈 상수는 객체 리터럴로 씁니다.',
          '데코레이터가 필요한 필드가 없다면 type alias가 더 명확합니다.',
        ],
        mapping: '5. 개념 대응표',
        mappingRows: [
          ['TypeScript', 'TypeShade'],
          ['type alias / object shape', 'GPU value shape'],
          ['class fields', 'GPU struct fields'],
          ['class method', '구조체를 첫 매개변수로 받는 함수'],
          ['`new`', '만들어진 생성자 함수 호출'],
          ['`extends` with `super`', '베이스 필드를 이어 붙이고 본문을 다시 내림'],
          ['decorator metadata', 'GPU layout / stage metadata'],
          ['runtime object', '해당하지 않음'],
          ['structural compatibility', 'shader 타입 검사 범위에서 적용'],
        ],
        example: '6. 실제 entry point와 연결하기',
        exampleP:
          'struct를 정의한 뒤 entry point 매개변수에서 사용할 수 있습니다. 이때 값의 shape와 field metadata가 shader 입력의 의미를 결정합니다.',
        next: '다음: Functions',
      },
      functions: {
        title: 'TypeShade 함수',
        description:
          'TypeScript 함수에서 출발해 TypeShade helper, shader entry, parameter, return type, builtin과 stage metadata를 이해하는 상세 가이드.',
        h1: 'Functions: TypeScript 함수에서 GPU 함수로',
        intro:
          'TypeShade에서 함수는 계산을 이름 붙이고 입력과 출력을 명확하게 만드는 기본 단위입니다. TypeScript에서 함수를 읽는 방법을 그대로 출발점으로 삼되, `"use typeshade"` 파일에서는 함수가 GPU IR로 내려갈 수 있는 계산이어야 한다는 차이를 이해해야 합니다.',
        anatomy: '1. 함수의 구조',
        anatomyP:
          '함수는 이름, parameter 목록, return type, body로 구성됩니다. TypeShade는 이 익숙한 구조를 유지하면서 parameter와 return type에 GPU 의미를 부여합니다.',
        anatomyNote:
          '여기서 <code>value</code>는 입력 parameter이고 <code>f32</code>는 입력과 결과의 GPU 타입입니다. <code>return</code>은 함수가 계산한 값을 호출자에게 돌려줍니다.',
        params: '2. Parameter와 return type',
        paramsP:
          'parameter는 함수가 읽는 입력이고 return type은 계산 결과의 GPU value shape를 설명합니다. 타입은 단순한 문서가 아니라 컴파일러가 표현식의 유효성을 판단하는 정보입니다.',
        paramsTable: [
          ['부분', '역할'],
          ['`a`, `b`', 'GPU 입력 값입니다.'],
          ['`amount: f32`', '스칼라 입력이며 컴파일러가 연산 타입을 확인합니다.'],
          ['`: vec4`', '호출자에게 반환할 GPU 값의 shape입니다.'],
        ],
        helper: '3. Helper function',
        helperP:
          'stage decorator가 없는 top-level function은 다른 shader 함수에서 호출할 수 있는 helper입니다. 반복되는 계산을 이름 있는 함수로 분리하면 shader를 읽고 검증하기 쉬워집니다.',
        helperNote:
          'helper는 pipeline entry가 아니므로 stage decorator가 없습니다. 이 구조는 계산을 작은 단위로 나누고 entry의 역할을 읽기 쉽게 만듭니다.',
        call: '4. 함수 호출',
        callP:
          '함수 호출은 일반적인 TypeScript 호출처럼 보이지만 호출 대상과 argument는 TypeShade의 GPU 타입 체계에 속해야 합니다. 일반 JavaScript API를 호출한다고 생각하면 안 됩니다.',
        callNote:
          '호출은 일반 함수 호출처럼 보이지만, `addBias`의 입력과 반환값은 TypeShade가 이해하는 GPU 타입이어야 합니다.',
        entry: '5. Shader entry function',
        entryP:
          'pipeline이 실행을 시작하는 함수는 top-level `export function`에 stage decorator를 붙여 선언합니다. `@compute`, `@vertex`, `@fragment`가 각각 GPU 실행 단계와 연결됩니다.',
        entryNote:
          '`export`는 TypeScript module 개념과 함께 entry를 compiler가 발견할 수 있게 합니다. stage decorator는 그 exported function이 어느 pipeline stage인지 추가로 설명합니다.',
        builtin: '6. Builtin은 parameter로 받습니다',
        builtinP:
          'GPU가 제공하는 stage input은 숨겨진 전역 변수가 아니라 함수 signature에 명시합니다. 이렇게 하면 함수의 입력이 코드만 읽어도 드러나고 helper와 entry의 경계도 분명해집니다.',
        builtinTable: [
          ['표현', '의미'],
          ['`@builtin("global_invocation_id")`', 'GPU가 제공하는 compute 입력을 지정합니다.'],
          ['`gid: vec3u`', '그 입력의 TypeShade 타입과 local 이름입니다.'],
          ['`gid.x`', '현재 invocation의 x component를 읽습니다.'],
        ],
        compute: '7. Compute entry를 읽는 법',
        computeP:
          '`@compute([64, 1, 1])`는 workgroup 크기를 선언하고, `gid`는 `global_invocation_id` builtin을 받는 parameter입니다. `gid.x`를 통해 현재 invocation의 x 좌표를 읽습니다.',
        computeNote:
          '이 함수를 읽을 때는 먼저 stage와 workgroup 크기를 보고, 다음으로 parameter를 통해 어떤 GPU 입력이 들어오는지 확인한 뒤 body에서 계산을 따라가면 됩니다.',
        graphics: '8. Vertex와 fragment entry',
        graphicsP:
          'vertex와 fragment도 같은 함수 모델을 사용합니다. stage decorator가 실행 단계를 결정하고 parameter와 return type이 pipeline interface를 설명합니다.',
        graphicsNote:
          'vertex의 `vid`와 `vin`은 서로 다른 입력입니다. 하나는 GPU builtin이고 다른 하나는 사용자 정의 struct 입력입니다. fragment의 `pid` 역시 signature에 명시되어 있으므로 함수만 읽어도 필요한 입력을 알 수 있습니다.',
        scope: '9. 함수와 scope',
        scopeP:
          '함수 안의 local variable은 호출마다 계산되는 값입니다. resource나 stage builtin처럼 함수 바깥에서 제공되는 값과 local 값을 구분해서 읽어야 합니다.',
        scopeNote:
          '`factor`는 함수 안에서만 존재하는 local value입니다. 반대로 `camera`나 `pixels` 같은 resource는 host와 연결된 shader interface이며, builtin parameter는 GPU stage가 제공하는 입력입니다.',
        boundary: '10. TypeScript 함수와의 차이',
        boundaryItems: [
          '임의의 JavaScript runtime API를 호출하지 않습니다.',
          '동적 객체 생성과 일반적인 runtime side effect를 shader 계산으로 가정하지 않습니다.',
          'entry point는 class method가 아니라 top-level exported function입니다.',
          'builtin은 implicit global이 아니라 명시적인 parameter입니다.',
          'parameter와 return type은 GPU value semantics에 맞아야 합니다.',
        ],
        example: '11. 작은 함수에서 실제 entry까지',
        exampleP:
          '아래 예제는 helper가 계산을 담당하고 entry가 builtin과 resource를 연결하는 전형적인 구조입니다.',
        exampleNote:
          '이 예제의 핵심은 함수 자체보다 경계입니다. `addBias`는 재사용 가능한 계산이고, `paint`는 stage와 builtin을 선언하면서 실제 GPU invocation과 resource를 연결합니다.',
        next: '다음: Control flow',
      },
      controlFlow: {
        title: 'TypeShade 제어 흐름',
        description:
          'TypeScript에서 익숙한 조건문과 반복문의 개념을 TypeShade의 GPU 실행 모델로 연결하고, 실제 셰이더에서 컴파일 가능한 분기와 반복을 안전하게 작성하는 방법을 단계적으로 설명합니다.',
        h1: 'Control flow: 익숙한 흐름, 명시적인 GPU 실행',
        intro:
          'TypeShade는 TypeScript의 조건문과 반복문 표면을 활용하지만, 코드는 GPU에서 실행됩니다. 따라서 JavaScript runtime의 동적 동작이 아니라 컴파일 가능한 계산을 기준으로 제어 흐름을 이해해야 합니다.',
        ts: '1. TypeScript의 흐름에서 출발하기',
        tsP: 'if/else와 for 같은 구문은 익숙하지만, TypeShade에서는 각 조건식과 반복식이 GPU 코드로 낮아질 수 있어야 합니다. 문법이 같다는 것이 JavaScript runtime semantics 전체를 가져온다는 뜻은 아닙니다.',
        branch: '2. 조건 분기',
        branchP:
          'if/else는 계산 경로를 표현합니다. 분기 안에서도 TypeShade가 이해하는 값과 resource만 사용합니다.',
        loop: '3. 반복',
        loopP:
          '반복문은 GPU에서 컴파일 가능한 형태로 사용합니다. 배열 길이나 런타임 객체를 기준으로 동적으로 실행 구조를 바꾸는 JavaScript 패턴은 피합니다.',
        boundary: '4. JavaScript와의 경계',
        boundaryItems: [
          '동적 배열 메서드로 실행 길이를 바꾸는 패턴은 사용하지 않습니다.',
          '일반 runtime 객체에 의존하지 않습니다.',
          '조건과 반복은 GPU에서 계산 가능한 값과 범위로 제한합니다.',
          'TypeScript에서 유효한 제어 흐름이라고 해서 TypeShade shader semantics에서도 자동으로 유효한 것은 아닙니다.',
        ],
        next: '다음: GPU types',
      },
      gpuTypes: {
        title: 'TypeShade GPU 타입',
        description:
          'TypeScript의 타입 표면과 TypeShade의 scalar, vector, matrix, array GPU 값을 연결하는 방법을 설명합니다.',
        h1: 'GPU types: TypeScript 표면에서 GPU 값으로',
        intro:
          'TypeShade의 타입은 TypeScript 문법으로 작성하지만 TypeScript의 모든 런타임 값 타입을 그대로 가져오지는 않습니다. 이 페이지에서는 GPU에서 실제 계산되는 값의 종류를 중심으로 봅니다.',
        mapping: '1. TypeScript 타입과 GPU 타입의 관계',
        mappingP:
          'TypeScript의 `number`처럼 넓은 런타임 타입을 그대로 shader 값으로 취급하기보다 `f32`, `i32`, `u32`처럼 GPU 표현을 명시합니다. `vec*`, `mat*`도 JavaScript 객체가 아니라 GPU arithmetic value입니다.',
        scalar: '2. 스칼라',
        scalarP:
          '단일 숫자 값은 GPU scalar 타입으로 표현합니다. 리소스와 struct field의 타입을 명시할 때 사용합니다.',
        vector: '3. 벡터',
        vectorP:
          'vec2, vec3, vec4는 여러 scalar 값을 하나의 GPU 값으로 묶습니다. shader 계산과 vertex/fragment 데이터에서 자주 사용합니다.',
        matrix: '4. 행렬',
        matrixP:
          'mat4 같은 matrix 타입은 변환 계산에 사용합니다. TypeScript 객체가 아니라 GPU arithmetic value입니다.',
        arrays: '5. 배열',
        arraysP:
          'array는 여러 GPU 값을 하나의 타입으로 표현합니다. resource element type과 함께 사용하면 host가 제공하는 buffer shape를 명확하게 설명할 수 있습니다.',
        live: '6. 라이브 예제',
        liveP:
          '아래 진입점은 줄마다 GPU 타입이 하나씩 나옵니다. 위치는 `vec2`, 거리와 반지름은 `f32`, 색은 `vec3`입니다.',
        liveTitle: '원반',
        liveCaption: '원반 하나입니다. vec2가 자리를, f32가 크기를, vec3이 색을 정합니다.',
        liveAnchor:
          '`d`는 픽셀에서 원반 테두리까지의 거리입니다. 안쪽은 음수, 테두리 위는 0, 바깥쪽은 양수입니다. `edge`는 그 `f32` 하나를 마스크로 바꾸고, `mix`는 그 마스크를 읽어 색을 고릅니다.',
        liveExercises: [
          '`p` 줄의 `vec2(ratio, 1.)`을 `vec2(1., 1.)`로 바꿔 보십시오. 원반이 늘어나 타원이 됩니다. `ratio`가 x 성분에만 곱해지고 있었고, 성분마다 다르게 다루는 것이 `vec2`로 할 수 있는 일입니다.',
          '`return` 줄을 `return vec4(vec3(fract(d * 10.)), 1.)`로 바꿔 보십시오. 나타나는 고리가 바로 `d`입니다. `vec3`은 그 `f32` 하나를 색 채널 세 개에 그대로 펼칩니다.',
          '`length(p)`를 `max(abs(p.x), abs(p.y))`로 바꾸면 원반이 정사각형이 되고, `abs(p.x) + abs(p.y)`로 바꾸면 마름모가 됩니다. 원하는 모양을 재는 `f32`를 직접 써 보십시오.',
        ],
        liveCenter: 'uv 공간 기준 위치',
        liveRadius: 'uv 단위 반지름',
        liveTint: '원반 색',
        next: '다음: Resources',
      },
      resources: {
        title: 'TypeShade 리소스',
        description:
          'TypeScript의 선언과 타입 표면에서 출발해 uniform과 storage 리소스의 GPU 의미와 호스트 계약을 이해합니다.',
        h1: 'Resources: TypeScript 선언에서 GPU 리소스로',
        intro:
          'TypeShade resource는 셰이더가 소유하는 JavaScript 객체가 아니라 호스트가 채우는 binding slot입니다. 제품 코드에서는 `declare`로 이 경계를 명시합니다.',
        mapping: '1. TypeScript 선언과 대응하기',
        mappingP:
          'TypeScript의 `declare`가 런타임 값을 만들지 않고 타입 수준의 존재를 설명하듯, TypeShade의 `declare`는 호스트가 제공하는 GPU resource를 소스에 표현합니다. 다만 TypeShade에서는 `uniform<T>`와 `storage<T>`가 GPU 메모리 의미까지 지정합니다.',
        decl: '2. `declare`로 resource 선언',
        declP: 'initializer 없이 resource의 타입과 접근 권한을 선언합니다.',
        access: '3. const와 let은 접근 권한을 나타냅니다',
        accessP:
          'uniform은 읽기 전용이므로 `declare const`만 허용됩니다. storage는 `const`면 read-only, `let`이면 read-write입니다.',
        slots: '4. binding 순서와 호스트 계약',
        slotsP:
          'resource slot은 파일의 declare 순서와 연결됩니다. 실제 binding 번호를 코드에 흩뿌리기보다 컴파일러와 호스트의 reflection 결과를 계약으로 사용하는 방향이 기본입니다.',
        invalid: '5. 자주 하는 실수',
        invalidItems: [
          '`declare const x: f32`처럼 `uniform<T>`나 `storage<T>` 없이 선언하지 않습니다.',
          '`declare let x: uniform<T>`는 허용되지 않습니다.',
          'read-only resource에 대입하지 않습니다.',
          'resource를 class의 bind group처럼 모델링하지 않습니다.',
        ],
        next: '다음: Shader stages',
      },
      stages: {
        title: 'TypeShade 셰이더 스테이지',
        description:
          'TypeScript 함수와 모듈 개념에서 출발해 compute, vertex, fragment entry point와 명시적인 builtin parameter를 이해합니다.',
        h1: 'Shader stages: GPU 실행 지점을 명시하기',
        intro:
          'TypeShade의 entry point는 class가 아니라 top-level exported function입니다. decorator가 함수의 shader stage와 필요한 metadata를 표시합니다.',
        mapping: '1. TypeScript 함수와 모듈에서 출발하기',
        mappingP:
          'TypeScript에서 `export function`은 모듈의 공개 함수입니다. TypeShade에서는 여기에 stage decorator를 더하면 pipeline entry point라는 GPU 의미가 생깁니다. decorator가 없는 함수는 재사용 가능한 helper로 남습니다.',
        compute: '2. Compute',
        computeP:
          '`@compute`는 workgroup 크기를 함께 표현합니다. `global_invocation_id` 같은 compute builtin은 암시적 전역 변수가 아니라 명시적인 함수 parameter로 받습니다.',
        graphics: '3. Vertex와 fragment',
        graphicsP:
          '`@vertex`와 `@fragment`는 그래픽스 pipeline의 entry point를 표현합니다. 입력과 출력은 TypeShade value type과 명시적인 builtin parameter로 선언합니다.',
        helper: '4. Helper function',
        helperP:
          'decorator가 없는 함수는 entry가 아니라 helper입니다. entry point를 class method로 만들거나 `this`를 pipeline 객체로 취급하지 않습니다.',
        next: '언어 개요로 돌아가기',
      },
    },

    // 구성 요소 대응 페이지 네 개. 표 자체는 컴파일러 레지스트리에서 생성하므로
    // 여기에는 표를 둘러싼 문장만 둡니다.
    mapping: {
      fromTypescript: {
        title: 'TypeScript 문법과 그 변환 결과',
        description: `"use typeshade" 파일에서 TypeScript 문법 ${facts.constructRows}가지가 각각 무엇이 되는지 정리합니다. 선언, 함수, 클래스, 제어 흐름, 그리고 컴파일러가 생성하는 셰이더 코드를 함께 싣습니다.`,
        h1: 'TypeScript 문법',
        intro: `TypeShade는 셰이더 컴파일러가 검사하는 TypeScript 문법입니다. 문법 하나는 셰이더 코드로 하향 변환되거나, 이유가 붙은 거절을 받습니다. 카드마다 오른쪽 칸에 놓인 코드는 고정된 커밋의 컴파일러가 낸 것입니다. 아래 섹션 페이지에 ${facts.constructRows}가지를 나눠 실었습니다.`,
        readingH: '카드 하나를 읽는 법',
        readingP:
          '카드 머리에는 문법의 이름이 있고, 언어가 거절하는 문법에는 표시가 하나 붙습니다. 이름 아래 문장은 그것이 무엇이 되는지 말합니다. 왼쪽 칸은 TypeScript이며, 이 페이지를 빌드할 때 컴파일하는 `"use typeshade"` 프로그램에서 그대로 가져옵니다. 오른쪽 칸은 생성된 WGSL이고, 그 프로그램에서 이름으로 잘라 낸 부분입니다. 거절되는 카드에는 그 자리에 컴파일러가 낸 코드와 메시지가 들어갑니다.',
        guidesP:
          '카드 하나는 무슨 일이 일어나는지만 말합니다. 왜 그런지는 앞선 페이지들이 설명합니다. [타입](languageTypes), [함수](languageFunctions), [제어 흐름](languageControlFlow), [GPU 타입](languageGpuTypes), [리소스](languageResources)를 보십시오. 내장 함수는 [별도의 표](languageBuiltins)에 있습니다.',
        paneTs: 'TypeScript',
        paneWgsl: '생성된 WGSL',
        paneDiagnostic: '컴파일러 진단',
        refused: '거절',
        pagesH: '섹션',
        constructs: (n: number) => `구성 요소 ${n}가지`,
        pages: {
          declarations: {
            title: '선언과 그 변환 결과',
            description:
              '"use typeshade" 파일에서 상수와 변수, enum, 타입 별칭, 인터페이스, 네임스페이스가 각각 무엇이 되고 무엇이 생성되는지 싣습니다.',
          },
          functions: {
            title: '함수와 그 변환 결과',
            description:
              '헬퍼와 화살표 함수, 오버로드, 재귀, 진입점, 그리고 컴파일러가 거절하는 호출을 하나씩 짚고, 각각에 대해 생성된 셰이더 코드를 함께 놓습니다.',
          },
          classes: {
            title: '클래스와 그 변환 결과',
            description:
              '생성자와 메서드, 정적 멤버, 상속, 믹스인, 제네릭이 각각 무엇이 되는지, 컴파일러가 쓰는 구조체와 함수를 옆에 나란히 놓고 보여 줍니다.',
          },
          controlFlow: {
            title: '제어 흐름과 그 변환 결과',
            description:
              '조건과 횟수가 정해진 루프, while, switch, 삼항 연산, break, continue, discard를 생성 코드와 함께 놓고, 거절되는 루프도 보여 줍니다.',
          },
          expressions: {
            title: '식과 타입, 그리고 그 변환 결과',
            description:
              '타입 주장과 구조 분해, 전개, 리터럴, 그리고 실행 중에 만들 수 없는 값을 각각 생성 코드나 거절 메시지와 함께 놓습니다.',
          },
          double: {
            title: 'TypeShade 파일의 배정밀도 에뮬레이션',
            description:
              '두 타깃 모두 64비트 부동소수점이 없어서 배정밀도 값은 단정밀도 워드 쌍입니다. 컴파일러가 무엇을 다시 쓰고 어떤 호출로 연산을 대신하는지 봅니다.',
          },
        },
        sections: {
          declarations: {
            h: '선언',
            p: '선언은 상수나 변수나 레이아웃에 이름을 붙입니다. 셋 중 무엇이냐에 따라 생성되는 코드가 있는지 없는지가 갈립니다.',
          },
          functions: {
            h: '함수',
            p: '모든 함수는 모듈의 함수입니다. 함수 값도, 가둬 둘 환경도, 호출 스택도 없습니다.',
          },
          classes: {
            h: '클래스',
            p: '클래스는 함수를 두른 구조체입니다. 디스패치가 정적이라 상속과 믹스인과 제네릭은 파일을 컴파일하는 동안 다 정해집니다.',
          },
          controlFlow: {
            h: '제어 흐름',
            p: '루프는 GPU가 끝낼 수 있는 모양이어야 하고, 두 값 중 하나를 고르는 식은 타깃에 연산자가 있는 모양이어야 합니다.',
          },
          expressions: {
            h: '식과 타입',
            p: '타입 주장은 지워집니다. GPU에 대응하는 말이 있는 모양은 남습니다. TypeScript가 실행 시점에 만들 값은 적힌 자리에서 거절합니다.',
          },
          double: {
            h: '배정밀도 에뮬레이션',
            p: `두 타깃 모두 64비트 부동소수점이 없습니다. \`f64\`는 \`f32\` 두 워드 쌍이며, 백엔드가 보기 전에 \`vec2<f32>\`와 \`df64_\` 호출로 바뀝니다. [fp64-lane-stripes](shadeLaneStripes)가 ${split[0]} 경로와 ${split[1]} 경로를 나란히 그립니다.`,
          },
        },
        rows: {
          constScalar: {
            name: '스칼라 `const`',
            p: '모듈 상수입니다. 스칼라는 선언 자리에서 값 하나로 접힙니다. [module-const](shadeModuleConst)',
          },
          constVector: {
            name: '벡터 `const`',
            p: '벡터나 배열 상수는 값을 식으로 지니고, 백엔드가 그 식을 평가합니다. [palette-const](shadePaletteConst)',
          },
          letNoInit: {
            name: '지역 `let`',
            p: '변경 가능한 지역 변수입니다. 타입은 표기가 정하고, WGSL은 영으로 채워 둡니다. [bitfield-bands](shadeBitfieldBands)',
          },
          moduleLet: {
            name: '모듈 `let`',
            p: '모듈 변수입니다. 호출마다 하나씩 생깁니다. [private-state](shadePrivateState)',
          },
          varRefused: { name: '`var`', p: '호출별 변수는 `let`, 모듈 상수는 `const`입니다.' },
          enumRow: {
            name: '`enum`',
            p: '멤버마다 모듈 상수가 하나씩 생깁니다. 이름은 `Enum_Member`, 타입은 `i32`입니다.',
          },
          constEnum: {
            name: '`const enum`',
            p: '같은 상수가 생깁니다. 여기서 `const enum`은 다르지 않습니다.',
          },
          typeAlias: {
            name: '`type` 별칭',
            p: '대상을 가리키는 다른 이름입니다. 타입이 올 수 있는 자리마다 풀립니다.',
          },
          interfaceRow: {
            name: '`interface`',
            p: '구조체입니다. 같은 필드를 쓴 class와 결과가 같습니다.',
          },
          classStruct: {
            name: '구조체가 되는 클래스',
            p: '구조체입니다. 필드가 호스트의 메모리 레이아웃을 정합니다. [ray-class](shadeRayClass)',
          },
          namespaceRow: {
            name: '`namespace`',
            p: '멤버는 `Ns_member`로 펼쳐지고, namespace 자체는 아무것도 생성하지 않습니다.',
          },
          topFunction: {
            name: '최상위 함수',
            p: '이름과 매개변수와 반환 타입이 같은 모듈 함수가 됩니다.',
          },
          localFunction: {
            name: '지역 함수',
            p: '모듈의 함수가 됩니다. 이름은 이를 선언한 함수에서 따옵니다.',
          },
          closure: {
            name: '이름 캡처',
            p: '로컬 함수는 바깥 함수에서 읽는 이름을 매개변수로 받고, 쓰는 이름은 참조로 받습니다.',
          },
          defaultArgs: {
            name: '기본 인자',
            p: '매개변수는 모두 남고, 빠뜨린 인자는 호출 지점에 적힙니다. [default-args](shadeDefaultArgs)',
          },
          overloads: {
            name: '오버로드 시그니처',
            p: '시그니처는 건너뛰고 구현 하나만 하향 변환합니다.',
          },
          recursion: {
            name: '재귀 호출',
            p: 'WGSL에는 호출 스택이 없고, 검사는 호출 그래프를 읽습니다.',
          },
          callStatement: {
            name: '문으로 쓴 호출',
            p: '문 하나가 됩니다. 값을 돌려주는 내장 함수가 홀로 서면 계산하는 것이 없어 최적화가 지웁니다.',
          },
          phonyAssign: {
            name: '효과가 있는 호출',
            p: '값을 돌려주면서 효과도 있는 내장 함수에는 WGSL의 `_ =` 대입이 붙습니다. Tint가 반환값을 반드시 쓰도록 요구하기 때문입니다. [atomic-histogram](shadeAtomicHistogram)',
          },
          mathAlias: {
            name: '`Math` 이름',
            p: '`Math.sin`은 `sin`과 같은 내장 함수이고, `Math.PI`는 값으로 접힙니다.',
          },
          constructorNew: {
            name: '`constructor`와 `new`',
            p: '`new`는 `Ray_new` 호출입니다. 구조체를 지어 돌려줍니다.',
          },
          method: {
            name: '메서드',
            p: '첫 매개변수가 구조체인 함수가 되고, `this`는 그 매개변수로 읽힙니다.',
          },
          staticFn: {
            name: '`static` 메서드',
            p: '수신자가 없는 함수가 되며, 클래스 이름을 앞에 답니다.',
          },
          thisAssign: {
            name: '`this`를 바꾸는 메서드',
            p: `객체를 바꾸는 메서드는 WGSL에서 포인터로, ${glsl}에서 \`inout\`으로 객체를 받습니다. [orbit-inout](shadeOrbitInout)`,
          },
          extendsSuper: {
            name: '`extends`와 `super`',
            p: '기반 클래스의 필드가 앞에 오고, 물려받은 메서드는 다시 하향 변환됩니다. `super`는 자기 함수가 됩니다. [shape-inheritance](shadeShapeInheritance)',
          },
          abstractRow: {
            name: '`abstract` 클래스',
            p: 'abstract 클래스에는 구조체가 없습니다. 하위 클래스가 저마다 필드와 메서드 복사본을 가집니다.',
          },
          implementsRow: {
            name: '`implements`',
            p: 'TypeScript만 검사합니다. 구조체는 그 클래스 자신의 필드입니다.',
          },
          accessModifiers: {
            name: '접근 제어자',
            p: '받아들이지만 셰이더에는 아무 뜻이 없습니다. 강제하는 쪽은 TypeScript입니다.',
          },
          getter: {
            name: '게터와 세터',
            p: '각각 모듈의 함수 `Disc_get_area`와 `Disc_set_area`가 되고, 읽기와 쓰기가 그 함수를 부릅니다. [class-syntax](shadeClassSyntax)',
          },
          mixin: {
            name: '믹스인 함수',
            p: '함수는 컴파일하는 동안 실행됩니다. 멤버는 클래스에 끼워 넣고, `Tinted`는 어디에도 생성되지 않습니다. [mixin-surface](shadeMixinSurface)',
          },
          genericFunction: {
            name: '제네릭 함수',
            p: '파일이 쓰는 타입 인자 조합마다 함수가 하나씩 생기고, `pick`이라는 이름은 없습니다. [generic-helpers](shadeGenericHelpers)',
          },
          genericClass: {
            name: '제네릭 클래스',
            p: '타입 인자 조합마다 구조체가 하나씩 생기고, 메서드도 조합마다 따로 생깁니다. [generic-class](shadeGenericClass)',
          },
          ifRow: { name: '`if`', p: '적은 그대로 `if`입니다.' },
          forRow: {
            name: '횟수를 세는 `for`',
            p: '횟수를 세는 루프입니다. 정수 변수와 상수 증가가 있고, 종료 조건은 본문이 쓰지 않는 경계와 변수를 비교합니다. [block-scope](shadeBlockScope)',
          },
          forRuntime: {
            name: '런타임 경계까지 도는 `for`',
            p: '시작값과 경계는 실행 중에야 알게 되는 값이어도 되고, 반복 횟수에 상한이 없습니다.',
          },
          whileRow: {
            name: '`while`',
            p: '컴파일러가 카운터를 붙인 루프가 됩니다. 본문이 경계로 다가가는지는 아무것도 검사하지 않습니다.',
          },
          switchRow: {
            name: '`switch`',
            p: '`switch`가 됩니다. TypeScript가 요구하는 `break`는 사라지고, 본문은 다음 case로 흘러가지 않습니다. [bitfield-bands](shadeBitfieldBands)',
          },
          ternaryScalar: {
            name: '스칼라 삼항 연산',
            p: `WGSL에서는 \`select\`가 되고, ${glsl}에서는 삼항 연산자가 됩니다.`,
          },
          ternaryStruct: {
            name: '구조체 삼항 연산',
            p: '두 타깃 모두 이런 연산자가 없어서, 값을 슬롯 하나와 `if`로 끌어올립니다. [pick-composite](shadePickComposite)',
          },
          breakRow: {
            name: '`break`',
            p: '`break`입니다. 횟수가 정해진 루프를 일찍 빠져나오는 방법입니다. [julia-twin](shadeJuliaTwin)',
          },
          continueRow: {
            name: '`continue`',
            p: '`continue`입니다. 루프가 감싸지 않은 `switch` 안에서는 거절합니다.',
          },
          discardRow: {
            name: '`discard`',
            p: '`discard`입니다. 프래그먼트 진입점이나 그 진입점이 부르는 함수에 씁니다. [cutout](shadeCutout)',
          },
          destructuring: {
            name: '구조 분해',
            p: '이름마다 선언이 하나씩, 적힌 순서대로 풀립니다.',
          },
          spread: {
            name: '객체 스프레드',
            p: '구조체의 필드마다 읽기가 하나씩 생기고, 뒤에 적은 필드가 그 위를 덮습니다.',
          },
          arrayLiteral: {
            name: '배열 리터럴',
            p: '배열 초기자입니다. 선언이 `array<T, N>`을 밝힌 자리에서만 씁니다. [array-literal-ramp](shadeArrayLiteralRamp)',
          },
          tuple: {
            name: '튜플',
            p: '튜플은 타입이 길이를 고정한 배열입니다. 반환 자리에서도 그렇습니다. [tuple-and-brand](shadeTupleAndBrand)',
          },
          literalUnion: {
            name: '리터럴 유니온',
            p: '멤버가 모두 한 타입을 가리키는 유니온은 그 타입을 가리킵니다.',
          },
          brand: {
            name: '브랜드 타입',
            p: '브랜드는 지워지고 매개변수는 `f32`입니다. [tuple-and-brand](shadeTupleAndBrand)',
          },
          typeClaims: {
            name: '타입 주장',
            p: '타입에 대한 주장일 뿐 변환이 아니라서, 피연산자가 생성하는 코드를 그대로 생성합니다.',
          },
          power: { name: '거듭제곱 연산자', p: '두 타깃 모두 `pow`입니다.' },
          logicalScalar: {
            name: '`bool`에 쓰는 `&&`',
            p: '두 타깃이 모두 가진 연산자이며, 한 번에 `bool` 하나를 다룹니다.',
          },
          logicalVector: {
            name: '마스크에 쓰는 `&&`',
            p: '마스크는 `all`이나 `any`나 `select`로 묶으십시오. [bool-select](shadeBoolSelect)',
          },
          optionalMember: {
            name: '선택 필드',
            p: '구조체 필드는 호스트가 채우는 메모리에 언제나 있습니다.',
          },
          stringValue: {
            name: '문자열 값',
            p: 'GPU에 문자열은 없습니다. 경우를 enum으로 적으십시오.',
          },
          numberType: { name: '`number`', p: 'GPU의 수에는 너비가 있습니다.' },
          booleanType: { name: '`boolean`', p: '셰이더 표기는 `bool`입니다.' },
          integerLiteral: {
            name: '정수 리터럴',
            p: '리터럴은 그 자리가 밝힌 타입을 따르고, 그 타입으로 접힙니다.',
          },
          increment: { name: '증감 연산자', p: '값이 한 걸음 옮겨 간 결과를 대입합니다.' },
          f64Scalar: {
            name: '`f64` 스칼라',
            p: '`f32` 두 워드의 쌍이 되고, 연산마다 `df64_` 호출이 붙습니다. [fp64-lane-stripes](shadeLaneStripes)',
          },
          f64Literal: {
            name: '`f64` 리터럴',
            p: '`f64`라고 밝힌 자리의 리터럴은 배정밀도 값을 그대로 지닙니다.',
          },
          f64Vector: {
            name: '`f64` 벡터',
            p: '배정밀도 벡터입니다. hi 평면과 lo 평면으로 하향 변환됩니다. `vec2d`는 `vec2f64`의 짧은 표기입니다.',
          },
          f64Builtin: {
            name: '`f64` 내장 함수',
            p: '스칼라에서 내장 함수 열 개, 벡터에서 열세 개가 에뮬레이션 본체를 가집니다.',
          },
          f64Refused: {
            name: '`f64` 본체가 없는 내장 함수',
            p: '호출 자리에서 거절하며, 그 열 개와 좁히는 방법을 함께 알려 줍니다.',
          },
          f64Guard: {
            name: '유니폼 안의 `f64`',
            p: '`_fp64` 텍스처가 주입됩니다. 호스트가 `1.0`으로 채우고, 리플렉션이 다른 바인딩처럼 보여 줍니다.',
          },
          f64Varying: {
            name: '스테이지 사이의 `f64`',
            p: '배정밀도 값은 필요한 스테이지에서 읽거나, 경계에서 `f32`로 좁히십시오.',
          },
        },
        sourceP:
          '이 페이지의 프로그램은 사이트를 빌드할 때 고정된 커밋에서 모두 컴파일합니다. 컴파일되지 않는 코드가 생기면 빌드가 멈춥니다. 문법 자체는 [작성 인터페이스 문서](surfaceSource)에 있습니다.',
      },
      fromWgsl: {
        title: 'WGSL을 TypeShade로: 타입, 리소스, 진입점',
        description:
          'WGSL 작성 인터페이스를 구성 요소별로 훑고 각각의 TypeShade 표기를 보여 줍니다. 스칼라, 벡터, 텍스처, 주소 공간, 스테이지 속성, 문을 다룹니다.',
        h1: 'WGSL을 TypeShade로',
        intro:
          '이미 WGSL을 쓰는 사람이 이 사이트에서 찾는 것은 하나입니다. 눈앞에 있는 구성 요소를 TypeShade로 어떻게 적느냐입니다. 이 페이지는 그 방향으로 읽힙니다. 왼쪽에 WGSL 형태, 오른쪽에 `"use typeshade"` 파일에 적을 코드, 그리고 둘이 맞아떨어지지 않는 자리에는 설명을 답니다.',
        readingH: '표 읽는 법',
        readingP: `오른쪽 칸은 커밋 ${facts.pinnedCommit}의 컴파일러가 실제로 받아들이는 소스이고, 왼쪽 칸은 그 컴파일러가 같은 소스에 대해 생성한 WGSL입니다. 두 칸 모두 이 페이지를 빌드할 때 측정합니다. 컴파일러가 더 이상 그렇게 쓰지 않게 되면 다음 고정 시점에 바뀐 행으로 여기에 도착합니다.`,
        colWgsl: 'WGSL',
        colSource: 'TypeShade',
        colType: '타입',
        colNote: '설명',
        colInstead: '대신 적을 것',
        pagesH: '섹션',
        pages: {
          types: {
            title: 'WGSL 스칼라와 벡터, 행렬의 표기',
            description:
              'WGSL 타입 표면을 TypeShade 표기와 나란히 놓습니다. 스칼라와 벡터, 행렬, 배열과 atomic, 텍스처와 샘플러를 다룹니다.',
          },
          resources: {
            title: 'WGSL 리소스와 주소 공간의 TypeShade 표기',
            description:
              '리소스는 declare로 적고, 주소 공간과 접근 모드는 타입 주석에 씌우는 래퍼 타입입니다. 슬롯 번호는 파일에 적은 순서가 정합니다.',
          },
          entries: {
            title: 'WGSL 진입점과 속성의 TypeShade 표기',
            description:
              '스테이지 속성과 워크그룹 크기, 버텍스 진입점이 내야 하는 값, 파이프라인이 주는 builtin 이름, 그리고 WGSL에 없는 이름을 다룹니다.',
          },
          statements: {
            title: 'WGSL의 문과 식, 그리고 그 TypeShade 표기',
            description:
              '문은 TypeScript의 문이고, 하나하나가 옆에 놓인 WGSL과 같은 뜻입니다. 생성된 코드는 이 페이지를 빌드할 때 컴파일한 파일 하나에서 나옵니다.',
          },
        },
        typesH: '타입',
        typesP:
          '타입은 WGSL이 타입을 적는 자리, 곧 선언과 매개변수와 필드와 반환 위치에 그대로 적습니다. WGSL이 타입 인자를 받는 자리에서는 요소 타입이 이름 안으로 들어가므로 `vec3<u32>`는 `vec3u`가 되고, 꺾쇠 안에서 틀릴 것이 남지 않습니다.',
        scalarsH: '스칼라',
        f64P: '배정밀도에는 대응하는 WGSL 타입이 없습니다. 선언에는 `f64`라고 적고, 생성기가 돌기 전에 한 패스가 이를 모두 `f32` 레인 두 개와 그 위의 함수 라이브러리로 하향 변환합니다. 배정밀도 곱셈 하나는 WGSL에서 호출 한 번이 됩니다.',
        vectorsH: '벡터',
        vectorsP:
          '`vec2`와 `vec4`도 위의 세 가지와 같은 방식으로 읽습니다. `vec3`와 `vec3f`는 같은 타입이고, `vec3d`와 `vec3f64`도 마찬가지입니다.',
        matricesH: '행렬',
        matricesP:
          '정사각 행렬에는 두 타깃이 모두 주는 짧은 이름도 있어서 `mat4`와 `mat4x4`는 같은 선언입니다. `C`와 `R`의 뜻도 WGSL과 같아서 앞이 열, 뒤가 행입니다.',
        arraysH: '배열과 atomic',
        arraysP:
          '튜플은 타입이 길이를 고정한 목록이고, 크기를 아는 배열이 바로 그것입니다. 그래서 `[f32, f32]`와 `array<f32, 2>`는 같은 타입에 닿습니다. 길이가 실행 시점에 정해지는 배열과 atomic은 각각 스토리지 바인딩 안에 놓입니다.',
        texturesH: '텍스처와 샘플러',
        texturesP:
          '텍스처와 샘플러는 주소 공간 래퍼 없이 그냥 적습니다. 핸들은 어느 주소 공간에도 놓이지 않기 때문입니다. 샘플링 텍스처는 `f32`나 `i32`나 `u32`를 받고, 그 요소 타입이 WGSL 표기와 적용 가능한 읽기 방식을 함께 결정합니다. 스토리지 텍스처는 포맷과 접근 모드를 문자열 리터럴 타입으로 받으므로 이 컴파일러보다 `tsc`가 먼저 검사합니다.',
        resourcesH: '리소스와 주소 공간',
        resourcesP:
          '리소스는 `declare`로 적습니다. 다른 쪽이 제공하는 값을 가리키는 TypeScript의 표현이 그것입니다. 주소 공간과 접근 모드는 타입 주석의 래퍼 타입이 나타내고, 나머지는 `const`와 `let`의 차이가 맡습니다. 셰이더가 쓰는 `storage` 바인딩은 `declare let`입니다.',
        slotsP:
          '`@group`이나 `@binding`은 적지 않습니다. 슬롯 번호는 파일 안 `declare`의 등장 순서이고, 위의 WGSL이 그 결과입니다. 텍스처와 샘플러도 같은 방식으로 다음 슬롯을 가져갑니다.',
        stagesH: '진입점과 속성',
        stagesP:
          '스테이지 속성은 export한 함수에 붙이는 데코레이터입니다. 셋 중 아무것도 붙지 않은 함수는 헬퍼입니다. `@compute`가 받는 값은 워크그룹 크기 하나뿐이고 목록으로 적습니다. 컴파일러는 첫 번째 숫자만 나르며, y나 z가 1이 아닌 형태는 거부합니다.',
        returnsP:
          '버텍스 진입점은 반드시 위치를 만들어 내야 합니다. 반환 타입이 `vec4`이면 그 자체가 position builtin을 답니다. 구조체를 반환하면 위치는 필드 하나가 나르고, 프로그램이 원하는 만큼 `@location` varying을 덧붙입니다. position 필드가 없는 구조체 반환, `void` 반환, `vec4`가 아닌 단일 타입은 각각 거부되며 어떤 필드나 타입을 적어야 하는지 함께 알려 줍니다.',
        builtinValuesH: 'builtin 값',
        builtinValuesP: `\`@builtin(...)\`의 이름 목록은 WGSL의 것이고 ${facts.wgslBuiltinIds}개를 문자열로 그대로 넘깁니다. 그래서 WGSL 속성은 같은 이름에서 따옴표만 뺀 모양입니다. 매개변수 타입이 이 이름들만 담은 닫힌 유니온이라, 오타는 작성자가 적은 줄에서 \`tsc\` 오류가 됩니다. WGSL은 id 하나를 빼고 모두 타입을 고정하므로, 타입 칸이 곧 이 속성이 말해야 하는 타입입니다.`,
        clipDistancesP: '타입이 고정되지 않은 유일한 id입니다. 배열 길이는 작성자가 정합니다.',
        absentH: 'WGSL에 없는 이름',
        absentP:
          'GLSL 작성자가 손이 가는 이름 셋에는 대응하는 WGSL builtin이 없습니다. 프런트엔드는 선언 자리에서 각각을 거부하고 받아들이는 이름들을 함께 보여 줍니다. 오른쪽 칸은 백엔드가 속성 이름 뒤에 이어 붙이는 문장이고, 대신 무엇을 쓰면 되는지 말해 줍니다.',
        statementsH: '문과 식',
        statementsP:
          '문은 TypeScript의 것이고, 각각이 옆의 WGSL과 같은 뜻입니다. 생성된 텍스트는 빌드 시점에 컴파일한 파일 하나에서 가져왔으므로 괄호와 접힌 상수도 생성기가 쓴 그대로입니다.',
        functionsH: '내장 함수',
        functionsP:
          '컴파일러가 표기할 수 있는 내장 함수와 각각에 대해 생성하는 WGSL 텍스트는 [내장 함수 표](languageBuiltins)에 있습니다. 파일이 직접 선언한 함수는 같은 이름의 내장 함수보다 우선합니다.',
        refusals: {
          'scalars.f16':
            '이 인터페이스에는 타입 이름이 없습니다. `"use typeshade"` 옆에 `"enable f16"`을 적으면 WGSL의 `enable f16;`이 생성되고, 리플렉션에는 호스트가 `shader-f16`으로 요청할 기능이 실립니다. 그래도 값을 선언할 `f16`은 아직 없습니다.',
          'scalars.f64':
            'WGSL에는 64비트 부동소수점이 없습니다. 아래 패스가 생성기보다 먼저 선언을 바꿔 놓습니다.',
          'vectors.vec3d': 'WGSL에는 64비트 벡터도 없어서 같은 패스가 이것도 바꿔 놓습니다.',
        },
        notes: {
          'stages.vertex': '진입점 하나에 스테이지 데코레이터 하나를 export한 함수에 붙입니다.',
          'stages.fragment':
            '프래그먼트 진입점은 아무것도 반환하지 않아도 됩니다. 스토리지 바인딩에만 쓰는 프로그램이 그런 모양입니다.',
          'stages.compute':
            '목록이 워크그룹 크기입니다. 목록 없는 `@compute`는 `[64, 1, 1]`입니다.',
          'stages.location': 'location은 진입점 매개변수와 클래스 필드와 반환 자리에 붙습니다.',
          'stages.vertexBare':
            '반환 타입이 `vec4`이면 그 자체가 position builtin을 답니다. 그래서 가장 작은 버텍스 셰이더에는 구조체도 매개변수도 필요 없습니다.',
          'stages.vertexStruct':
            '구조체를 반환하면 위치는 필드 하나가 나르고, 그 옆에 프로그램이 원하는 만큼 varying을 덧붙입니다.',
          'stages.fragmentReturn':
            '프래그먼트가 단일 값을 반환하면 너비와 상관없이 location 0을 가져갑니다. 그래서 `f32`, `vec2`, `vec3`, `vec4`가 모두 드로 버퍼 포맷이 됩니다. 구조체 반환은 렌더 타깃이 여럿일 때 쓰는 형태입니다.',
          'statements.let':
            'WGSL의 `let`은 그대로 있는 값이고, TypeScript에서 그 뜻을 말하는 것이 `const`입니다.',
          'statements.var':
            'WGSL의 `var`는 바뀌는 지역 변수입니다. 초기값 없는 `let b: f32`가 그것을 선언하고 값은 나중 대입에 맡깁니다. 첫 대입 전에 읽으면 WGSL은 영으로 채운 값을 주고 GLSL은 정해지지 않은 값을 주므로, 읽기 전에 대입하십시오.',
          'statements.for':
            '`for`는 횟수가 세어지는 형태여야 합니다. 정수 유도 변수와 상수 증감이 있고, 종료 조건은 본문이 쓰지 않는 경계와 변수를 비교합니다. 시작값과 경계는 런타임 값이어도 되고, 반복 횟수에 상한이 없습니다. 증감에는 `+=`, `-=`, `*=`, `/=`를 쓸 수 있습니다.',
          'statements.while':
            '`while`이 `loop` 자리를 대신합니다. 열린 루프라서 조건이 거짓이 되거나 `break`나 `return`을 만나면 끝나고, `while (true)`는 본문에 둘 중 하나가 있어야 합니다.',
          'statements.switch':
            'case는 TypeScript가 요구하는 `break`로 끝내고, 하향 변환이 그것을 떼어 냅니다. 어느 case도 다음으로 흘러가지 않으며, 레이블은 한 번만 쓸 수 있는 정수 상수입니다. 본문 하나 위에 레이블 두 개를 겹쳐 쓰면 선택자가 둘인 case 하나가 되며, WGSL에서는 `case 0, 1:`로 나옵니다.',
          'statements.select':
            'WGSL에는 삼항 연산자가 없어서 스칼라와 벡터 조건식은 `select`가 됩니다. 첫 인자가 조건이 고르지 않은 쪽입니다. 구조체나 배열을 고르는 조건식은 슬롯과 `if`로 풀립니다. 그 경우에는 어느 타깃에도 연산자가 없기 때문입니다.',
          'statements.call': '결과를 버리고 동작만 보고 부르는 함수입니다.',
          'statements.phony':
            '같은 방식으로 결과를 버린 내장 함수 호출에는 가짜 대입이 붙습니다. Tint가 그런 내장 함수를 모두 `@must_use`로 읽기 때문입니다.',
          'statements.discard': '같은 낱말이고 같은 문입니다.',
          'statements.struct':
            'WGSL 구조체는 클래스입니다. 객체 모양의 타입 별칭과 인터페이스도 같은 선언에 닿습니다.',
          'statements.fn': '스테이지 데코레이터가 붙지 않은 함수는 모듈의 헬퍼입니다.',
        },
      },
      fromGlsl: {
        title: `${glsl}을 TypeShade로: 타입과 유니폼 블록`,
        description: `${glsl} 작성 인터페이스를 구성 요소별로 훑고 각각의 TypeShade 표기를 보여 줍니다. 샘플러, 유니폼 블록, varying, builtin 변수, 함수를 다룹니다.`,
        h1: `${glsl}을 TypeShade로`,
        intro: `WebGL2용 셰이더는 ${glsl}로 씁니다. 그 대부분에는 두 타깃에 같은 프로그램을 생성하는 TypeShade 표기가 있습니다. 이 페이지는 그 방향으로 읽히며, 어떤 구성 요소가 WebGPU에만 있고 어떤 구성 요소를 컴파일러가 양쪽에서 거부하는지도 함께 말합니다.`,
        readingH: '표 읽는 법',
        readingP: `오른쪽 칸은 커밋 ${facts.pinnedCommit}의 컴파일러가 실제로 받아들이는 소스이고, 왼쪽 칸은 그 컴파일러가 같은 소스에 대해 생성한 ${glsl}입니다. 이 타깃에 형태가 없는 행에서는 없는 표기를 지어내는 대신 컴파일러가 직접 내는 문장을 그 칸에 싣습니다.`,
        colGlsl: glsl,
        colSource: 'TypeShade',
        colNote: '설명',
        colMessage: '컴파일러의 말',
        colInstead: '대신 적을 것',
        colCapability: '기능',
        colDirective: '소스 지시문',
        colExtension: 'WebGL2 확장',
        noDirective: '없습니다. 프로그램을 링크하기 전에 호스트가 확장을 켭니다.',
        pagesH: '섹션',
        pages: {
          types: {
            title: `${glsl} 타입과 그 TypeShade 표기`,
            description: `${glsl} 타입 표면을 TypeShade 표기와 나란히 놓습니다. 스칼라와 벡터, 행렬, 배열, 샘플러, 그리고 이 타깃이 거부하는 타입을 다룹니다.`,
          },
          uniforms: {
            title: `${glsl}의 유니폼과 버퍼, 그 TypeShade 표기`,
            description:
              '유니폼 바인딩은 생성기가 블록으로 내보내는 구조체이고, varying은 양쪽 모두에서 필드입니다. 이 타깃이 아는 기능은 하나에 한 행씩입니다.',
          },
          variables: {
            title: `${glsl}의 builtin 변수와 그 TypeShade 표기`,
            description:
              'gl_ 전역 변수는 매개변수나 클래스 필드나 반환 자리에 붙는 builtin 속성이고, 그것이 어느 전역 변수가 될지는 생성기가 정합니다.',
          },
          functions: {
            title: `${glsl}의 함수와 연산자, 그 TypeShade 표기`,
            description:
              '호출은 중립 이름 하나로 다니고 백엔드마다 자기 표기를 씁니다. GLSL 작성자가 찾는 미분과 텍스처, 비트, 나머지 형태를 싣습니다.',
          },
        },
        typesH: '타입',
        typesP:
          '스칼라와 벡터 이름은 WGSL의 것입니다. 소스 하나가 두 타깃을 모두 맡아야 하기 때문입니다. GLSL 생성기가 그 이름을 이 타깃의 말로 옮기므로, 선언에 `f32`라고 적은 것이 생성된 셰이더에서는 `float`가 됩니다.',
        scalarsH: '스칼라',
        vectorsH: '벡터',
        vectorsP:
          '`vec2`와 `vec4`도 같은 방식으로 읽고, 각각의 정수형과 부호 없는 정수형과 불리언 형태도 마찬가지입니다. 배정밀도 벡터는 어느 타깃에도 형태가 없어서 생성기가 돌기 전에 `f32` 레인으로 하향 변환됩니다.',
        arraysH: '행렬과 배열',
        matricesH: '행렬',
        matricesP:
          '정사각 행렬은 드라이버 오류 메시지가 쓰는 짧은 이름을 그대로 씁니다. 나머지 여섯 가지 모양은 이 타깃이 적는 방식과 똑같이 `matCxR`로, 앞이 열이고 뒤가 행입니다.',
        arraysP:
          '튜플은 타입이 길이를 고정한 목록이므로 `[f32, f32]`와 `array<f32, 2>`는 같은 타입에 닿습니다. 실행해 봐야 길이를 아는 배열은 스토리지 버퍼이고 이 타깃에는 그 형태가 없어서, 그런 모듈은 데이터 텍스처에서 읽도록 다시 쓰입니다.',
        samplersH: '샘플러',
        samplersP:
          '이 타깃은 텍스처와 샘플러를 결합 샘플러 하나로 합치고, WebGPU는 둘을 따로 둡니다. TypeShade 파일은 둘을 WebGPU 방식으로 선언하고 GLSL 생성기가 합치므로, 샘플러 인자는 모든 읽기에서 사라지고 그 자리를 차지하던 바인딩도 호스트가 바인딩하는 레이아웃에서 빠집니다.',
        shadowP:
          '깊이 텍스처는 그 합치기의 예외입니다. 결합 타입이 모듈이 그것을 어떻게 읽느냐에 달려 있어서 바인딩 생성 단계가 결정합니다. 이 인터페이스가 허용하는 깊이 텍스처 읽기는 모두 비교이고, 그래서 항상 shadow 형태가 됩니다.',
        noFormH: 'GLSL 형태가 없는 타입',
        noFormP:
          '아래 타입은 모두 생성기가 거부하며, 옆 칸은 생성기가 던지는 문장 그대로입니다. 그런 타입을 든 모듈도 WGSL은 생성하므로, 셰이더를 WebGPU 전용으로 만드는 줄이 바로 이것들입니다.',
        uniformsH: '유니폼과 버퍼',
        uniformsP:
          '유니폼 바인딩은 구조체이고, 생성기는 이것을 std140 블록으로 생성합니다. 스토리지 버퍼는 이 타깃에 아예 형태가 없어서, 그런 모듈은 기능 게이트가 돌기 전에 데이터 텍스처에서 읽도록 다시 쓰입니다.',
        varyingsH: 'varying',
        varyingsP:
          '버텍스 스테이지에서 프래그먼트 스테이지로 넘어가는 값은 양쪽 모두에서 `@location(n)` 필드입니다. 이 타깃은 그 둘을 이름으로 잇고 WebGPU는 번호로 이으므로, 생성된 GLSL에서 맞아야 하는 것은 필드 이름입니다.',
        capabilitiesH: '확장과 기능',
        capabilitiesP: `\`#extension\` 줄은 GPU 기능의 한쪽 절반이고, 호스트의 \`getExtension\` 호출이 나머지 절반입니다. 이 타깃의 프로파일에는 행이 ${facts.glslCapabilities}개 있고 그중 하나만 소스에 지시문을 넣습니다. 행이 아예 없는 기능은 텍스트를 쓰기도 전에 이 타깃에서 모듈을 차단합니다.`,
        enablesP:
          '`"use typeshade"` 파일에는 이 네 가지를 적을 방법이 없습니다. `"enable ..."`은 WGSL 확장 이름을 받는데 넷 중 어느 것도 WGSL 확장이 아니므로, 이런 기능이 필요한 모듈은 `fn()` 인터페이스의 `module({ enables: [...] })`로 조립합니다. 스토리지 바인딩, 컴퓨트 진입점, `@builtin("clip_distances")`처럼 모듈의 모양에서 따라오는 기능은 파일에서 도출되며, 그중 어느 것도 이 표에 행이 없습니다.',
        variablesH: 'builtin 변수',
        variablesP:
          '`gl_*` 전역 변수는 매개변수나 클래스 필드나 반환 자리에 붙는 `@builtin(...)` 속성입니다. 어떤 값인지는 속성이 말하고 그것이 어느 전역 변수가 될지는 생성기가 정합니다. 파일 하나가 두 타깃에 모두 닿는 방식이 이것입니다.',
        absentH: '어느 생성기도 받지 않는 변수',
        absentP:
          '둘은 이 인터페이스에 이름이 없습니다. 프런트엔드가 선언 자리에서 그 표기를 거부하며, 아래 문장은 같은 이름에 대해 WGSL 백엔드가 내는 말이고 대신 무엇을 쓰면 되는지 알려 줍니다.',
        functionsH: '함수와 연산자',
        functionsP:
          '호출은 중립 이름 하나로 컴파일러를 통과하고 백엔드마다 자기 표기를 씁니다. 그래서 적어야 할 이름은 오른쪽 칸의 것입니다. 아래는 GLSL 작성자가 특히 많이 찾는 이름들입니다.',
        operatorsP:
          '연산자도 같은 방식으로 갈립니다. 벡터 두 개를 비교할 때는 연산자로 적고 이 타깃에는 함수로 도착하며, 성분마다 고르는 연산은 양쪽 모두 `select`입니다.',
        operatorsH: '연산자',
        restP:
          '컴파일러가 표기할 수 있는 내장 함수와 두 타깃에서 각각 생성하는 텍스트는 [내장 함수 표](languageBuiltins)에 있습니다.',
        edslH: 'fn() 표기',
        edslP:
          '이 페이지가 다루는 것은 `"use typeshade"` 인터페이스입니다. 컴파일러에는 `fn()`과 `uniformStruct()` 같은 함수로 이루어진 내장 인터페이스도 있고, 같은 GLSL 구성 요소를 그 표기와 나란히 놓은 글이 [GLSL 셰이더 옮기기](internalsGlslShader)입니다. 이 페이지의 WGSL 쪽은 [WGSL을 TypeShade로](languageFromWgsl)입니다.',
        refusals: {
          'uniforms.precision': '적을 것이 없습니다.',
        },
        notes: {
          'uniforms.block':
            '클래스가 블록이고 `declare`가 그 인스턴스입니다. 필드 순서가 곧 레이아웃입니다.',
          'uniforms.loose':
            '`glUniform*`로 값을 넣는 기본 블록 유니폼은 여기에 표기가 없습니다. 그래서 스칼라나 벡터나 행렬 하나를 담은 유니폼 바인딩은 WebGPU에만 닿습니다.',
          'uniforms.storage': '버퍼가 데이터 텍스처가 되고, 호스트는 같은 숫자를 텍셀로 올립니다.',
          'uniforms.fetch':
            '버퍼를 인덱스로 읽는 자리가 이 함수 호출이 됩니다. 생성기는 이 함수를 부르는 모듈에만 정의를 넣습니다.',
          'uniforms.define':
            '특수화 상수에는 GLSL 형태가 없어서, 기본값을 전처리기 치환으로 적어 둡니다. 호스트는 스테이지를 컴파일하기 전에 그 값을 덮어쓸 수 있습니다.',
          'uniforms.precision':
            '생성기가 스테이지마다 맨 위에 한정자를 넣고, `floatPrecision` 옵션이 float 줄을 `highp`로 할지 `mediump`로 할지 정합니다. 정수 줄은 `highp`로 둡니다. 데이터 텍스처를 거쳐 되읽는 값에는 정수 범위가 온전히 필요하기 때문입니다.',
          'varyings.out': '버텍스 진입점이 반환하는 구조체의 필드에 적습니다.',
          'varyings.in': '그 값을 읽는 프래그먼트 진입점 매개변수에 같은 이름으로 적습니다.',
          'varyings.target':
            '프래그먼트가 단일 값을 반환하면 location 0을 가져가고, 출력 이름은 생성기가 직접 붙입니다.',
          'variables.glPosition':
            '버텍스 출력에 붙는 같은 id입니다. `vec4` 하나를 반환하는 버텍스 진입점은 아무것도 적지 않아도 이것을 답니다.',
          'variables.glFragCoord':
            '프래그먼트 입력에 붙는 같은 id입니다. y 원점이 다릅니다. 이 타깃은 창 아래쪽부터 세고 WebGPU는 위쪽부터 세므로, `.y`를 읽는 셰이더는 스스로 뒤집어야 합니다.',
          'variables.glVertexID':
            '인덱스가 여기서는 `u32`이고 저기서는 `int`이라, 읽기를 선언한 타입으로 감쌉니다.',
          'variables.glInstanceID': '같은 이유로 같은 방식으로 감쌉니다.',
          'variables.glFrontFacing': '양쪽 모두 `bool`이라 읽기에 캐스트가 붙지 않습니다.',
          'variables.glFragDepth':
            '프래그먼트 진입점이 반환하는 구조체의 필드로, 색상 옆에 적습니다.',
          'functions.dpdx': 'WGSL 이름으로 부르는 같은 미분입니다.',
          'functions.dpdy': '축만 다른 같은 미분입니다.',
          'functions.dpdxCoarse':
            'coarse와 fine 변형은 WGSL에서는 이름을 유지하고 여기서는 하나로 합쳐집니다. 이 타깃에는 축마다 미분이 하나뿐이기 때문입니다.',
          'functions.dpdyFine': '같은 방식으로 합쳐집니다.',
          'functions.mod':
            '나누는 수 쪽으로 내림한 나머지이고, 이 타깃의 `mod`가 이미 그것입니다. `%` 연산자는 다른 쪽입니다.',
          'functions.textureSample':
            '결합 샘플러가 이미 샘플러를 들고 있으므로 샘플러 인자가 사라집니다.',
          'functions.textureLoad': '정수 좌표와 밉 레벨로 텍셀 하나를 읽습니다.',
          'functions.textureDimensions':
            '크기가 부호 없는 값으로 돌아오므로, 생성기가 이 타깃의 부호 있는 답을 감쌉니다.',
          'functions.faceForward': '표기만 다릅니다.',
          'functions.inverseSqrt': '이것도 표기만 다릅니다.',
          'functions.round': '두 타깃이 함께 쓰는 반올림은 절반을 짝수 쪽으로 보내는 방식입니다.',
          'functions.countOneBits':
            '이 타깃에는 비트 내장 함수가 하나도 없어서, 생성기가 여기에 있는 시프트와 마스크로 작은 함수를 정의합니다.',
          'functions.firstLeadingBit':
            '그런 함수가 하나 더 있고, 부르는 모듈에만 정의가 들어갑니다.',
          'operators.mod': '나누는 수 쪽으로 내림한 나머지라 부호가 나누는 수를 따릅니다.',
          'operators.remainder':
            '잘라 내는 나머지라 부호가 나뉘는 수를 따릅니다. 이 타깃에는 실수에 쓰는 `%`가 없어서 생성기가 식을 풀어서 적습니다.',
          'operators.lessThan':
            '벡터 비교는 이 타깃에서는 함수이고 저쪽에서는 연산자입니다. 그래서 소스에는 연산자로 적습니다.',
          'operators.equal': '같은 방식이고, TypeScript가 받는 것은 엄격 비교 쪽입니다.',
          'operators.select':
            '스칼라 선택은 여기서는 삼항 연산자이고 WGSL에서는 `select`라, 이름 하나가 양쪽을 맡습니다.',
          'operators.vectorSelect':
            '불리언 벡터로 성분마다 고르는 연산은 이 타깃에서 `mix`이고, GLSL 작성자가 이미 쓰던 모양이 그것입니다.',
        },
      },
      builtins: {
        title: `내장 함수와 WGSL, ${glsl} 표기`,
        description: `컴파일러가 표기할 수 있는 내장 함수 ${facts.builtins}개를 모두 모아, 각 함수가 WGSL과 ${glsl}로 어떤 코드가 되는지 계열별로 정리했습니다.`,
        h1: '내장 함수',
        intro: `내장 함수는 GPU에 이미 들어 있는 함수입니다. 호출은 컴파일러 안에서 중립 이름 하나로 다니고, 백엔드가 타깃마다 자기 표기를 씁니다. 그래서 한 번 작성한 호출이 두 벌로 생성됩니다. 레지스트리에 담긴 이름은 ${facts.builtins}개입니다.`,
        readingH: '한 행을 읽는 법',
        readingP: `첫째 칸은 호출이 달고 다니는 이름이며, 인자가 들어갈 자리마다 플레이스홀더를 하나씩 넣었습니다. 다음 두 칸은 WGSL 백엔드와 ${glsl} 백엔드가 그 호출에 대해 쓰는 코드로, 고정된 커밋의 컴파일러 표기표를 그대로 실행해 얻었습니다. 이 가운데 ${facts.portableBuiltins}개는 두 타깃에서 표기가 같고, ${facts.glslAbsentBuiltins}개는 ${glsl}에 형태가 아예 없어 그 칸에 컴파일러가 낸 메시지를 싣습니다. ${facts.mathAliasBuiltins}개는 \`Math.\` 이름으로도 부를 수 있으며, 수학과 캐스트 표의 마지막 칸이 그 이름을 보여 줍니다.`,
        idsP: `이 이름 가운데 몇 개는 컴파일러가 고르는 것이라 손으로 적지 않습니다. 레이어 텍스처 읽기, 깊이 비교, 스토리지 fetch, 부호 없는 좌표로 하는 텍셀 읽기는 저마다 자기 이름을 받습니다. 그래야 호출의 인자 순서가 어떤 텍스처에 쓰였는지에 따라 달라지지 않습니다. 부호 없는 값의 \`abs\`와 정수 \`dot\`도 따로 이름을 받습니다. ${glsl}에는 둘 다 그 타입의 오버로드가 없기 때문입니다.`,
        precedenceH: '파일이 직접 선언한 이름',
        precedenceP:
          '파일이 선언한 함수가 같은 이름의 내장 함수를 이깁니다. 그런 이름은 내장 함수가 되기 전에는 작성자의 함수를 가리켰고, 기능을 더한다고 해서 이미 돌아가던 프로그램의 뜻이 바뀌면 안 되기 때문입니다.',
        colName: 'TypeShade',
        colWgsl: 'WGSL',
        colGlsl: glsl,
        colMath: 'Math 이름',
        colBuiltin: '내장 함수',
        colHelper: 'GLSL 함수',
        noForm: '이 타깃에는 형태가 없습니다.',
        preEmit: '두 백엔드가 돌기 전에 `f32` 레인 두 개로 바뀝니다.',
        families: {
          maths: '수학',
          geometry: '기하 연산',
          derivatives: '화면 공간 미분',
          bits: '비트 연산',
          packing: '패킹',
          casts: '캐스트',
          textures: '텍스처와 스토리지',
          atomics: '원자적 연산',
          barriers: '배리어',
          f64: '에뮬레이션 배정밀도',
        },
        bitsP: `${glsl}에는 비트 내장 함수가 하나도 없습니다. 그래서 위 칸은 GLSL 생성기가 정의하는 작은 함수를 부릅니다. 그 정의는 해당 타깃에 있는 시프트와 마스크, 비교만으로 쓰여 있습니다. 하나도 부르지 않는 모듈은 정의도 싣지 않습니다.`,
        helpersH: 'GLSL 헬퍼 함수',
        helpersP: `스토리지 버퍼는 ${glsl}에 형태가 없어서, 스토리지를 읽는 코드는 데이터 텍스처를 읽는 코드로 바뀝니다. 아래가 그 읽기를 대신하는 함수들이며, 모듈이 부르는 함수의 정의는 GLSL 생성기가 함께 생성합니다.`,
        sourceP:
          '이 페이지의 모든 행은 고정된 커밋의 [표기 레지스트리](intrinsicRegistry)에서 읽어 온 것이고, 여기서 손으로 적은 것은 없습니다.',
      },
    },
  },

  notFound: {
    title: '페이지를 찾을 수 없음, TypeShade',
    description: 'typeshade.dev의 이 주소에는 아무것도 없습니다.',
    h1: '이 주소에는 아무것도 없습니다.',
    p: '페이지가 옮겨졌을 수 있습니다. 첫 페이지와 작성 가이드는 그대로 있습니다.',
    links: '[첫 페이지로 돌아가거나](home) [작성 가이드](guide)를 읽어 보십시오.',
  },
};
