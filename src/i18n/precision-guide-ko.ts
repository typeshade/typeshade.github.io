import type { precisionGuide as english } from './precision-guide-en.ts';

export const precisionGuide = {
  reportScroll: '좁은 화면에서는 보고서를 가로로 움직여 모든 필드를 읽을 수 있습니다.',
  searchTitle: 'precision highp float; GLSL 정밀도',
  modelSymbols:
    '`base`는 기준값, `increment`는 증가분, `sum`은 반올림된 합입니다. 소수부 비트가 많으면 같은 크기의 값 사이에서 더 작은 차이를 구분합니다.',
  title: 'precision highp float; 뜻과 GLSL 정밀도 선택 가이드 | TypeShade',
  description:
    'GLSL의 precision highp float 선언 뜻, 셰이더 기본 정밀도와 mediump 차이를 배웁니다. 반올림 예제를 조작하고 WebGL 브라우저의 보고값도 확인합니다.',
  h1: 'precision highp float;',
  lead: '`precision highp float;`는 현재 범위에서 이후에 나오는 부동소수점 선언의 기본 정밀도를 정합니다. 정밀도를 따로 지정하지 않은 float 스칼라·벡터·행렬에 `highp`를 적용합니다.',
  meaningH: '선언의 뜻',
  tokens: [
    ['`precision`', '기본 정밀도 선언을 시작합니다.'],
    ['`highp`', '높은 정밀도 등급을 선택합니다.'],
    ['`float`', '부동소수점 형식에 기본값을 적용합니다.'],
  ],
  tokenColumns: ['토큰', '뜻'],
  scope:
    '`mediump`처럼 직접 지정한 한정자가 우선합니다. 새 기본값은 앞서 선언한 변수를 바꾸지 않습니다. 블록 안에서 지정한 기본값은 해당 범위에서만 유효합니다.',
  declarationsLabel: '기본값과 개별 정밀도',
  defaultsH: '셰이더 기본값',
  defaultsP:
    'GLSL ES 1.00과 GLSL ES 3.00은 다음 스테이지 기본값을 사용합니다. 프래그먼트에서 한정자 없는 부동소수점 형식을 선언하려면 앞에 float 기본값을 두거나 선언에 직접 한정자를 지정해야 합니다.',
  defaultColumns: ['스테이지', 'Float 기본값', 'Int 기본값'],
  defaultRows: [
    ['버텍스', '`highp`', '`highp`'],
    ['프래그먼트', '기본값 없음', '`mediump`'],
  ],
  supportP:
    'WebGL 1의 GLSL ES 1.00에서는 프래그먼트 `highp` float를 지원하지 않을 수 있습니다. WebGL 2의 GLSL ES 3.00은 이를 지원해야 합니다. WebGL 2도 GLSL ES 1.00 셰이더를 받으므로 컨텍스트와 언어 버전을 함께 확인하십시오.',
  fallbackLabel: 'WebGL 1과 GLSL ES 1.00의 대체 경로',
  fallbackP:
    '이 조건부 선언은 이전 셰이더 언어용입니다. GLSL ES 3.00 셰이더에서는 highp를 직접 선언합니다. 높은 정밀도가 필요한 알고리즘은 지원하지 않는 기기의 처리 방법도 정해야 합니다.',
  tiersH: '정밀도 등급 선택',
  tierColumns: ['한정자', '검토할 용도', '한계'],
  tierRows: [
    [
      '`lowp`',
      '작은 범위의 값이며 오차를 허용할 수 있는 계산입니다.',
      '필요한 범위와 정밀도를 확인하십시오.',
    ],
    [
      '`mediump`',
      '범위가 제한되고 반올림을 허용하는 색상 계산입니다.',
      '좌표나 중간값에는 더 높은 정밀도가 필요할 수 있습니다.',
    ],
    [
      '`highp`',
      '위치, 큰 좌표, 깊이에 민감한 계산이나 작은 차이를 구할 때 검토합니다.',
      '앞선 계산에서 잃은 정보를 복원하지는 못합니다.',
    ],
  ],
  tiersP:
    '규격은 정밀도 요구 조건을 정하며 기기는 낮은 등급도 더 높은 정밀도로 계산할 수 있습니다. Mediump는 최소 요구 조건이 있는 등급입니다. 저장과 연산이 모든 기기에서 binary16과 같지는 않습니다.',
  performanceP:
    '계산마다 필요한 정밀도를 정한 뒤 실제 출시 기기에서 측정하십시오. 낮은 한정자가 실행 속도나 전력 절감을 보장하지는 않습니다.',
  modelH: '작은 차이의 손실',
  modelP:
    '큰 기준값에 작은 증가분을 더한 뒤 기준값을 빼봅니다. 덧셈의 반올림에서 증가분이 사라질 수 있습니다. 입력을 움직이며 복원된 차이를 비교하십시오.',
  modelNote:
    '정규 이진수에 최근접 짝수 반올림을 적용하는 수학 모델입니다. 넘침과 비정규수는 다루지 않습니다. 두 모델은 실제 GPU의 mediump·highp 결과를 예측하지 않습니다.',
  baseLabel: '기준값',
  incrementLabel: '증가분',
  modelColumns: ['계산식', '성긴 모델', '세밀한 모델'],
  modelResult: '복원된 증가분',
  noScript:
    '초기 입력의 계산 결과는 아래에 있습니다. 입력 변경과 브라우저 조회에는 자바스크립트가 필요합니다.',
  deviceH: '브라우저 지원 정보',
  deviceP:
    '스테이지와 float 정밀도 등급별로 WebGL이 보고하는 정보를 조회합니다. 지원 능력을 묻는 기능이며 식의 실제 결과, 프레임 속도나 전력을 측정하지 않습니다.',
  contextLabel: 'WebGL 컨텍스트',
  inspect: '브라우저 조회',
  deviceIdle: '이 보고서를 위한 WebGL 컨텍스트를 아직 만들지 않았습니다.',
  deviceReady: '선택한 WebGL 컨텍스트가 보고한 지원 정보입니다.',
  deviceUnavailable:
    '이 브라우저에서 선택한 WebGL 컨텍스트를 만들 수 없습니다. 본문과 숫자 모델은 계속 읽을 수 있습니다.',
  deviceError: '정밀도 조회를 완료하지 못했습니다. 다른 컨텍스트나 브라우저를 사용해 보십시오.',
  unsupported: '지원 안 함',
  vertex: '버텍스',
  fragment: '프래그먼트',
  deviceColumns: ['스테이지', '한정자', 'rangeMin', 'rangeMax', 'precision'],
  fieldsP:
    '`rangeMin`과 `rangeMax`는 범위를 나타내는 지수 정보입니다. 최솟값·최댓값 자체가 아닙니다. `precision`은 정밀도 비트 정보이며 규격의 상대 오차 표와 같은 단위로 비교할 수 없습니다.',
  queryP:
    'null은 조회 실패를 나타냅니다. WebGL 1에서 지원하지 않는 프래그먼트 HIGH_FLOAT를 조회하면 영 값들을 돌려줍니다. 양의 precision은 float 조회에서 지원 여부를 확인하는 기준입니다. 정수 조회에서는 precision이 영이어도 정상입니다.',
  queryLabel: '프래그먼트 float 정밀도 조회',
  practicalH: '실제 적용',
  checks: [
    '작은 차이가 중요하면 위치와 큰 좌표를 highp로 계산하십시오. 가능하면 가까운 원점을 쓰는 지역 좌표계를 사용합니다.',
    '최종 색상뿐 아니라 중간 계산도 확인하십시오. 반올림된 값을 highp로 바꾸어도 그 값은 그대로입니다.',
    '두 셰이더 스테이지가 공유하는 uniform은 정밀도 선언도 맞추십시오. 같은 한정자를 직접 쓰면 스테이지 기본값의 차이를 피할 수 있습니다.',
    '대상 기기에서 화질과 성능을 비교하십시오. 데스크톱의 결과가 같아도 모든 모바일 GPU의 오차까지 알 수는 없습니다.',
  ],
  troubleH: '자주 겪는 문제',
  troubleColumns: ['증상', '확인할 내용'],
  troubleRows: [
    [
      '프래그먼트 셰이더가 정밀도 선언 오류를 냅니다.',
      '한정자 없는 선언 앞에 float 기본값을 두거나 선언마다 한정자를 지정하십시오.',
    ],
    [
      '큰 위치에서 움직임이나 텍스처 좌표가 튑니다.',
      '중간 계산의 정밀도와 좌표 크기를 확인하고 지역 좌표의 크기를 줄여보십시오.',
    ],
    [
      '그라데이션에 띠가 보입니다.',
      '계산 정밀도와 렌더 타깃의 양자화를 확인하십시오. Highp 선언이 저장 대상의 정밀도를 높이지는 않습니다.',
    ],
    [
      '이전 프래그먼트 셰이더에서 highp가 거부됩니다.',
      'Float 지원을 조회하고 알고리즘에 맞는 호환 경로를 정하십시오.',
    ],
  ],
  faqH: '궁금한 점',
  faq: [
    [
      'Highp는 배정밀도입니까?',
      'Highp는 64비트 배정밀도를 요청하지 않습니다. GLSL ES 3.00의 highp float는 IEEE 단정밀도 저장 형식을 사용합니다. 내장 함수는 각자 정해진 정확도 규칙을 따릅니다.',
    ],
    [
      '모든 변수의 정밀도가 바뀝니까?',
      'Float 기본값은 해당 범위의 한정자 없는 부동소수점 선언에 적용됩니다. 직접 지정한 한정자, 정수 기본값, 샘플러 정밀도와 텍스처 저장 형식에는 별도 규칙이 있습니다.',
    ],
    [
      'Mediump와 highp가 왜 같아 보입니까?',
      '구현이 둘 다 높은 정밀도로 계산하거나 컴파일러 최적화로 차이가 사라질 수 있습니다. 같은 이미지는 그 기기에서 관찰한 결과입니다.',
    ],
    [
      'Highp 샘플러는 텍스처 정밀도도 높입니까?',
      '샘플러 한정자와 저장된 텍스처 형식은 별도로 정합니다. Float 기본값을 바꾸어도 텍스처에 없는 세부 정보가 생기지는 않습니다.',
    ],
  ],
  typeshadeH: 'TypeShade 설정',
  typeshadeP:
    'TypeShade는 GLSL 스테이지에 highp float 기본값을 생성합니다. 생성 옵션인 `floatPrecision`으로 스테이지에 mediump를 선택할 수 있습니다. 스테이지 전체의 기본값을 바꾸므로 민감한 좌표 계산도 함께 확인하십시오.',
  typeshadeMore:
    '옵션의 자세한 동작은 [컴파일러 정밀도 가이드](guideGlslFloatPrecision)에 있습니다. 대상 언어는 [WGSL과 GLSL](conceptsWgsl)에서 비교합니다.',
  sourcesH: '출처',
  sources: [
    '[GLSL ES 1.00 규격](specGlslEs100)의 정밀도 한정자와 기본 정밀도입니다.',
    '[GLSL ES 3.00 규격](specGlslEs)의 정밀도와 스테이지 기본값입니다.',
    '[WebGL 2 규격](specWebgl2)의 셰이더 언어 버전 지원입니다.',
    '[MDN 정밀도 권고](mdnGlslPrecision)는 기기별 연산과 성능을 설명합니다.',
    '[MDN getShaderPrecisionFormat](mdnShaderPrecision)은 조회 필드와 반환값을 설명합니다.',
  ],
  entryLink:
    '[GLSL 정밀도 가이드](conceptsGlslPrecision)에서 `precision highp float;`의 뜻과 스테이지 기본값을 배우고 브라우저 지원 정보를 확인하십시오.',
  correctionH: '언어 규칙 정정',
  correction:
    '기본 정밀도는 셰이더 스테이지에 따라 다릅니다. 버텍스의 float와 int 기본값은 highp입니다. 프래그먼트의 float 기본값은 없고 int 기본값은 mediump입니다. 직접 지정한 한정자가 우선합니다. 컴파일러는 자체적으로 highp 기본값을 생성합니다. Mediump는 규격의 등급이며 구현이 더 높은 정밀도를 사용할 수 있습니다. 언어 규칙은 [GLSL 정밀도 가이드](conceptsGlslPrecision)에서 확인하십시오.',
} satisfies typeof english;

export const fractionLabel = (bits: number): string => `소수부 ${bits}비트`;
