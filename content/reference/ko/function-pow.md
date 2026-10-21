---
entry: function/pow
sources: definition 2a9fd974f58f, exponent-curve ea92ecac8edd, undefined-inputs 32e82b36e5c3, integer-exponents ebbbf953f4f6, accuracy 2225d454fb02, common-uses 5ef6084cb5bf, in-typeshade 7d3ceb5ae028, specifications f2a07aa3ee6f
rules: 1.3 fcW4P8W5BFQ0loGi6vlLvaa1Is6dCmpQ_g9tbwMsfHM=, 7.2 onO98E-yRQ3RftA44lVmgPmSW7ZkCd7rYrJGgFS8EI4=
---

## 정의 {#definition}

`pow(x, y)`는 $x^y$이며, `x`의 `y`제곱입니다. [WGSL](specWgslPow)과 {{fact glslTarget}}([명세](specGlslEs)) 모두 이 함수를 부동소수점 값에서 정의하며, 성분을 하나씩 따로 계산합니다.

모든 호출에 규칙 세 가지가 적용됩니다.

- 두 인자의 타입을 같게 맞추십시오. 밑이 `vec3`이면 지수도 `vec3`로 씁니다(`pow(v, vec3(2.0))`). 벡터 밑에 스칼라 지수를 주는 호출은 두 언어 어디에도 정의되어 있지 않습니다.
- {{fact glslTarget}}에서는 지수를 float 값으로 쓰십시오. `2`가 `int`라서 그 언어에서 `pow(x, 2)`는 올바른 호출이 아닙니다(아래 정수 지수).
- 밑은 $0$ 이상으로 두십시오. 두 명세 모두 $x < 0$이면 결과를 정의하지 않으며, 지수가 정수여도 마찬가지입니다. {{fact glslTarget}} 명세는 $y \le 0$일 때 $x = 0$도 정의하지 않습니다.

|                    | WGSL                                                                     | {{fact glslTarget}}                                           |
| ------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------- |
| 선언               | `fn pow(e1: T, e2: T) -> T`                                              | `genType pow(genType x, genType y)`                           |
| 타입               | `T`는 `f32`, `f16` 또는 그 벡터이며, 상수 식에서는 `AbstractFloat`입니다 | `genType`은 `float`, `vec2`, `vec3`, `vec4` 가운데 하나입니다 |
| `f16`              | [enable 확장](specWgslExtensions) `f16`이 있어야 씁니다                  | `f16`이 없습니다                                              |
| 정수 타입          | `i32`나 `u32` 오버로드가 없습니다                                        | `int` 오버로드가 없고, `int`에서 변환하지도 않습니다          |
| 정의되지 않는 입력 | $x < 0$, 그리고 무한대가 낀 두 입력(아래 무한대 입력)                    | $x < 0$, 그리고 $y \le 0$인 $x = 0$                           |

## 지수 곡선 {#exponent-curve}

$0$과 $1$ 사이에서 `pow`는 곧게 오르는 직선을 곡선으로 휩니다. 지수가 $1$보다 크면 범위의 가운데가 아래로 처지고, $1$보다 작으면 가운데가 위로 올라갑니다. 모든 $k > 0$에서 $0^k = 0$, $1^k = 1$이므로 두 끝은 제자리에 머뭅니다. 셰이더는 이 휘어짐으로 $0$과 $1$ 사이의 값을 다듬습니다.

이 페이지의 예제는 TypeShade 파일입니다. TypeShade는 이 호출을 `pow`로 쓰며, WGSL의 철자({{entry spelling.wgsl}})와 GLSL의 철자({{entry spelling.glsl}})도 같습니다. `uv`는 캔버스를 가로질러 $0$에서 $1$까지 가고, `u.k`는 캔버스 아래 슬라이더가 정하는 유니폼을 읽습니다. 언어의 나머지가 어떻게 대응하는지는 [GLSL에서 옮겨 오기](languageFromGlsl)에 있습니다.

<!-- live: reference-pow-curve
title: 영과 일 사이에서 pow(x, k)가 그리는 곡선
caption: y = pow(x, k) 아래 영역과 사분의 일 간격의 격자선, 그리고 직선 y = x.
anchor: 파란 영역은 `y = pow(uv.x, u.k)` 아래 전부입니다. 어두운 대각선은 `y = x`이며, $k = 1$일 때의 곡선입니다. 모든 곡선은 양 끝에서 대각선과 만납니다. `pow(0.5, 2.)`가 $0.25$이므로, $k = 2$이면 곡선은 $(0.5, 0.25)$를 지납니다.
exercise: `k`를 $1$ 아래로 끌어 보십시오. 곡선이 대각선 위로 올라갑니다. 지수가 $1$보다 작으면 $0$과 $1$ 사이의 값이 모두 커집니다.
exercise: `k`를 $1$보다 크게 둔 채 `y` 줄에 `1. - pow(1. - uv.x, u.k)`를 써 보십시오. 곡선이 ease-out이 되어, 처음에는 가파르게 오르다가 차츰 평평해집니다.
exercise: `y` 줄에 `pow(uv.x, 1. / u.k)`를 써 보십시오. 지수 $1/k$가 지수 $k$를 되돌리므로, 곡선은 대각선을 사이에 두고 앞의 곡선과 대칭이 됩니다.
control k: 지수
-->

## 정의되지 않는 입력 {#undefined-inputs}

### 음수 밑

{{fact glslTarget}} 명세는 $x < 0$이면 결과를 정의하지 않습니다. WGSL은 모든 $x < 0$을 `pow`의 정의역 밖에 둡니다([pow](specWgslPow)). 구현이 결과를 `exp2(y * log2(x))`로 계산할 수 있는데, 음수 $x$에서는 $\log_2 x$에 실수 값이 없기 때문입니다. 두 규칙 모두 모든 $x < 0$을 가리킵니다. 그래서 $(-2)^2 = 4$이지만 `pow(-2.0, 2.0)`도 `pow(-2.0, 0.5)`와 똑같이 정의되지 않습니다.

두 명세 모두 NaN을 약속하지 않습니다. 정의역 밖의 WGSL 호출은 [불확정 값](specWgslIndeterminate)(indeterminate value)을 낼 수 있고, 그 값은 타입의 어떤 값이든 될 수 있으며 NaN일 수도 있습니다([WGSL의 부동소수점](specWgslIeeeOverview)). {{fact glslTarget}}도 구현에 NaN을 만들라고 요구하지 않습니다.

그러니 음수 밑의 결과는 GPU가 내는 값 그대로입니다. 아래 그래프는 가드 없는 호출과 가드를 둔 호출을 보고 있는 이 GPU에서 나란히 그립니다.

<!-- live: reference-pow-negative
title: 음수 밑에서 가드 없는 호출과 가드
caption: 마이너스 일에서 일까지 그린 두 곡선. 가드 없는 호출 pow(x, k)는 주황색, 가드 sign(x) * pow(abs(x), k)는 파란색입니다.
anchor: 가운데보다 오른쪽에서는 `x`가 양수이고, 두 곡선이 한 선으로 겹칩니다. 가운데보다 왼쪽에서는 `x`가 음수이며, 거기서 주황 곡선은 이 GPU가 음수 밑에 돌려주는 값을 보여 줍니다. 주황 곡선이 끊긴 곳은 이 GPU가 NaN이나 그래프 밖의 값을 돌려준 곳입니다.
exercise: `k`를 $2$로 맞춰 보십시오. 왼쪽에서 파란 곡선이 가로축 아래에 놓이지만, 그쪽에서 $x^2$는 양수입니다. 음수 `x`에서 가드가 $x^k$와 같은 경우는 $k$가 홀수일 때뿐입니다.
exercise: `k`를 $2$에 둔 채 `signed` 줄에 `pow(abs(p.x), u.k)`를 써 보십시오. 파란 곡선의 왼쪽 절반이 오른쪽 절반과 대칭이 되고, 곡선은 양쪽 모두에서 $x^2$와 같습니다.
exercise: `k`를 $3$에 두고 `signed` 줄에 `p.x * p.x * p.x`를 써 보십시오. 파란 곡선은 제자리에 있습니다. 그 줄은 곱셈만 쓰므로 모든 `x`에서 정의됩니다.
control k: 지수
-->

### 가드

음수 값이 셰이더에서 무엇을 뜻하는지에 따라 가드를 고르십시오.

| 가드                       | 결과                                                         | 쓰는 곳                                                     |
| -------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------- |
| `pow(max(x, 0.0), y)`      | $y > 0$이면 음수 `x`마다 $0$                                 | $0$ 아래가 없음을 뜻하는 값. 빛을 등진 면에 닿는 빛 같은 것 |
| `sign(x) * pow(abs(x), y)` | 원점에 대해 대칭인 곡선. $y$가 홀수일 때 $x^y$와 같습니다    | 부호가 있는 곡선. $-1$에서 $1$까지 가는 ease 같은 것        |
| `pow(abs(x), y)`           | 양수 쪽을 거울에 비춘 모양. $y$가 짝수일 때 $x^y$와 같습니다 | 크기                                                        |
| `x * x`, `x * x * x`       | 모든 `x`에서 $x^2$와 $x^3$                                   | 작은 정수 지수                                              |

앞의 세 가드는 밑 $0$을 그대로 넘깁니다. $y \le 0$이면 그 호출은 여전히 정의되지 않습니다(아래 밑이 영일 때).

### 밑이 영일 때

{{fact glslTarget}} 명세는 $y \le 0$인 $x = 0$도 정의하지 않습니다. WGSL의 정의역은 이 경우를 따로 들지 않습니다. $x = 0$이면 $\log_2 x$는 $-\infty$입니다. $y = 0$이면 곱 $y \log_2 x$에 정의된 값이 없고, $y < 0$이면 공식이 무한대를 냅니다. WGSL은 구현이 결과를 유한하다고 가정하도록 허용하며, 그때 무한대 결과는 불확정 값이 됩니다([IEEE 부동소수점과 다른 점](specWgslIeee)). 밑이 영이고 $y \le 0$인 호출은 두 타깃 모두에서 정의되지 않는다고 보십시오.

### 무한대 입력

공식 `exp2(y * log2(x))`는 WGSL 정의역 밖의 나머지 두 입력도 설명합니다. $\log_2 1 = 0$이고 영에 무한대 $y$를 곱한 값은 정의되지 않으므로, 무한대 $y$와 함께인 $x = 1$은 정의역 밖입니다. $y = 0$인 무한대 $x$도 영과 무한대의 같은 곱을 냅니다.

### 상수 인자

WGSL에서 `pow`는 `@const` 함수입니다([pow](specWgslPow)). 인자가 리터럴이나 `const` 선언인 호출은 [상수 식](specWgslConstExpr)이 되고, 구현은 셰이더를 만들 때 이를 계산합니다. 넘치거나 NaN 또는 무한대를 내는 상수 식은 셰이더 생성 오류입니다([IEEE 부동소수점과 다른 점](specWgslIeee)). 그래서 상수 `pow(-2.0, 0.5)`는 셰이더 생성을 멈출 수 있고, 실행 시점에 읽은 값으로 하는 같은 호출은 불확정 값을 냅니다.

## 정수 지수 {#integer-exponents}

{{fact glslTarget}}에서 `pow(x, 2)`는 올바른 호출이 아닙니다. 이 언어에는 타입 사이의 암시적 변환이 없고 `2`는 `int`라서, `pow`의 어떤 오버로드도 맞지 않습니다. `pow(x, 2.0)`로 쓰십시오.

WGSL은 `f32`인 `x`에 대해 `pow(x, 2)`를 받아들입니다. 리터럴 `2`는 추상 정수이고 `f32`로 변환됩니다. 명세의 [소개](specWgslIntro)도 `pow(dist, 2)`라고 씁니다.

TypeShade에서 `pow(x, 2)`가 내는 WGSL은 {{compile int-literal}}, GLSL은 {{compile int-literal-glsl}}이고, `x ** 2`가 내는 줄은 {{compile starstar-int-literal}}입니다. 컴파일러는 정수 리터럴 지수를 float로 쓰므로, 컴파일러가 내는 GLSL에는 `int` 지수를 쓰는 호출이 없습니다.

### 곱셈

두 명세는 `x * x`와 `pow(x, 2.0)`에 서로 다른 정확도 규칙을 둡니다. 곱셈의 정확도는 {{accuracy *}}입니다([정확도](specWgslAccuracy)). `pow`는 `exp2(y * log2(x))`의 정확도를 이어받습니다(아래 정확도). 어느 명세도 둘이 같은 값을 낸다거나 컴파일러가 하나를 다른 하나로 바꾼다고 하지 않습니다. TypeShade는 호출을 그대로 둡니다. `pow(x, 2.0)`가 내는 줄은 {{compile square-stays}}입니다. 곱셈을 원하는 곳에는 `x * x`를 쓰십시오.

`x * x`는 음수 `x`를 포함한 모든 `x`에서 정의됩니다. WGSL은 영과 무한대의 곱을 뺀 모든 입력에서 곱셈을 정의하는데([정의역](specWgslDomains)), `x * x`의 두 인수는 한 값입니다.

## 정확도 {#accuracy}

두 명세 모두 `pow`에 고유한 오차 한계를 두지 않습니다. `pow`는 `exp2(y * log2(x))`의 정확도를 이어받으며, 컴파일러가 밝히는 그 정확도는 {{accuracy pow}}입니다([정확도](specWgslAccuracy)). 오차는 그 식의 오차만큼 클 수 있습니다.

`f32`에서 WGSL이 두는 한계는 `exp2`가 {{accuracy exp2}}, `log2`가 {{accuracy log2}}이며, {{fact glslTarget}} 명세도 단정밀도에 같은 수치를 둡니다. `exp2`의 한계는 인자의 크기에 따라 커지므로, $|y \log_2 x|$가 클수록 오차도 커질 수 있습니다. {{fact glslTarget}} 명세는 이 규칙을 `x`와 `y`를 바꾼 `exp2 (x * log2 (y))`로 적는데, 이 페이지는 WGSL이 적는 꼴을 씁니다.

구현은 `pow`를 다른 방법으로, 더 나은 정확도나 극단적인 입력에 더 너그러운 방식으로 계산해도 됩니다([부동소수점 정확도](specWgslFloatAccuracy)). 그래도 WGSL이 `pow`에 정한 정확도는 이어받은 정확도 그대로입니다.

{{fact glslTarget}}에서는 정밀도 한정자가 또 하나의 한계를 둡니다. `mediump`는 $-2^{14}$에서 $2^{14}$까지의 범위와 $2^{-10}$의 상대 정밀도만 지키면 됩니다. $10^5$는 그 범위 밖이므로 `mediump`에서 `pow(10.0, 5.0)`는 넘칠 수 있습니다. TypeShade가 내는 GLSL은 [정밀도 옵션](guideGlslFloatPrecision)이 `mediump`를 고르지 않는 한 그 선언이 {{compile glsl-precision}}입니다.

$x \ge 0$에서 `sqrt(x)`는 $x^{1/2}$이고, `exp2(y)`는 $2^y$입니다. 둘은 고유한 정확도를 가지는데, `sqrt`는 {{accuracy sqrt}}이고 `exp2`는 위의 한계입니다.

## 자주 쓰이는 곳 {#common-uses}

이 사이트의 예제에서 가져온 호출 네 개입니다. 모두 밑을 $0$ 이상으로 둡니다.

- 스페큘러 하이라이트: [bit-bump](examplePowBitBump)의 `pow(max(dot(reflect(fromLight, nf), toEye), 0.), 16.)`
- 감마: [default-args](examplePowDefaultArgs)의 `pow(max(c, vec3(0.)), vec3(1. / gamma))`. 호출이 `gamma`를 빼면 $2.2$를 씁니다.
- 지수 줌: [fp64-julia-twin](examplePowJulia)에서 `pow(10.0, -u.zoom_exp)`는 보이는 영역의 폭입니다.
- 비네팅: [capsule-corp-namek-class](examplePowCapsule)의 `pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.12)`. `q`는 화면을 가로질러 $0$에서 $1$까지 갑니다.

하이라이트를 보면 지수가 하는 일이 드러납니다. 아래 예제는 Blinn-Phong 하이라이트를 그립니다. 표면 법선과 하프 벡터(빛과 눈의 한가운데 방향) 사이의 코사인을 씁니다. 코사인은 하이라이트 한가운데에서 $1$이고 둘레로 갈수록 작아집니다. 코사인 $1$은 어떤 지수에서도 $1$로 남고, 그보다 작은 코사인은 지수가 커질수록 더 가파르게 $0$으로 떨어집니다.

<!-- live: reference-pow-specular
title: 구 위의 스페큘러 하이라이트
caption: 광원 하나가 비추는 구. Blinn-Phong 하이라이트는 코사인을 shininess만큼 거듭제곱한 값입니다.
anchor: 하얀 점이 `highlight`입니다. 법선 `n`과 `halfway` 사이 각의 코사인을 `shininess`만큼 거듭제곱한 값입니다. $1$에 가까운 코사인은 $1$ 근처에 머물고, 그보다 작은 코사인은 모두 $0$을 향해 떨어집니다.
exercise: `shininess`를 범위의 맨 아래에서 맨 위까지 끌어 보십시오. 하이라이트가 넓게 번진 빛에서 작은 점으로 줄어듭니다.
exercise: `ball` 줄의 `diffuse` 자리에 `pow(diffuse, 0.5)`를 써 보십시오. 음영의 경계가 어두운 쪽으로 옮겨 갑니다. 지수가 $1$보다 작으면 $0$과 $1$ 사이의 값이 커집니다.
exercise: `ball` 줄의 오른쪽을 `pow(…, vec3(1. / 2.2))`로 감싸 보십시오. 구가 더 밝아지며, 이것이 감마 인코딩입니다. 밑이 `vec3`이므로 거기에 스칼라 지수 `1. / 2.2`를 쓰면 거부됩니다(아래 TypeShade에서).
control light: 광원 위치
control shininess: 지수
-->

## TypeShade에서 {#in-typeshade}

TypeShade에는 이 호출의 철자가 세 가지 있습니다. `pow(a, b)`, `Math.pow(a, b)`({{ref math/pow}}), 거듭제곱 연산자 `a ** b`입니다. 컴파일러는 세 가지 모두에 같은 호출 하나를 내며, WGSL과 GLSL에서도 같습니다 {{assert sameEmit}}. 컴파일러가 WGSL 형태로 바꾸는 TypeScript 형태를 나열한 {{rule 7.2}}에 `a ** b`가 있습니다. 그래서 첫 예제의 `y` 줄에 `uv.x ** u.k`를 써도 같은 곡선이 그려집니다.

컴파일러는 아래 표의 호출을 거부하고, 편집기도 호출마다 같은 코드와 문구를 보고합니다.

| 쓴 코드                      | 컴파일러가 보고하는 내용           |
| ---------------------------- | ---------------------------------- |
| `v: vec3`일 때 `pow(v, 2.2)` | {{compile vector-scalar}}          |
| `v: vec3`일 때 `v ** 2.2`    | {{compile starstar-vector-scalar}} |
| `a, b: i32`일 때 `pow(a, b)` | {{compile int-operands}}           |
| `a, b: i32`일 때 `a ** b`    | {{compile starstar-int}}           |
| `a **= b`                    | {{compile starstar-assign}}        |

마지막 행은 TypeShade 프런트엔드의 한계이며, 두 타깃 모두 이 대입을 받아들입니다. `a = a ** b`로 쓰면 나오는 줄은 {{compile starstar-rewrite}}입니다.

인자가 모두 상수인 호출은 컴파일러가 정의역을 검사합니다. WGSL이 그런 호출을 셰이더를 만들 때 계산하기 때문입니다(위 상수 인자). 함수 안에서 `pow(-2.0, 0.5)`를 쓰면 컴파일러가 거부하며, 그 진단은 {{compile negative-literal}}입니다. 호출에 값이 있으면 메시지가 그 값을 알려 줍니다. `pow(-2.0, 2.0)`의 진단은 {{compile negative-whole}}입니다. 실행 시점에 읽는 인자가 있는 호출은 상수 식이 아니므로, 컴파일러는 그 정의역을 GPU에 맡깁니다. `pow(x, 0.5)`가 내는 줄은 {{compile runtime-base}}입니다.

CPU 오라클은 TypeShade 셰이더를 CPU에서 실행하며, `pow`를 JavaScript의 `Math.pow`로 계산합니다 {{assert oracleIsMathPow}}. `x`가 $-2$일 때 오라클의 값은 `pow(x, 3.0)`에서 {{oracle pow(-2.0, 3.0)}}, `pow(x, 0.5)`에서 {{oracle pow(-2.0, 0.5)}}입니다. `x`가 $0$일 때는 `pow(x, 0.0)`에서 {{oracle pow(0.0, 0.0)}}, `pow(x, -1.0)`에서 {{oracle pow(0.0, -1.0)}}입니다. {{rule 1.3}}에 따라 오라클은 WGSL이 허용하는 어떤 값이든 낼 수 있고, 음수 밑에서 WGSL은 모든 값을 허용합니다. 그래서 그곳에서는 오라클과 GPU의 값이 다를 수 있습니다. GPU를 오라클과 비교하는 테스트는 $x > 0$이거나 $y > 0$인 $x = 0$이고, 결과가 유한한 곳에서만 성립합니다.

모듈 수준의 `const`도 같은 검사를 거칩니다. `const K: f32 = pow(-2., 0.5)`의 진단은 {{compile module-const-no-value}}이고, `const K: f32 = pow(-2., 2.)`의 진단은 {{compile module-const-value}}입니다.

`compile()`이 돌려주는 결정성 보고서가 적는 `pow`의 정확도는 {{accuracy pow}}입니다.

## 명세 {#specifications}

- [WGSL](specWgsl): [pow](specWgslPow), [WGSL의 부동소수점](specWgslIeeeOverview), [IEEE 부동소수점과 다른 점](specWgslIeee), [부동소수점 정확도](specWgslFloatAccuracy), [구체 식의 정확도](specWgslAccuracy), [식과 내장 함수의 정의역](specWgslDomains), [상수 식](specWgslConstExpr), [불확정 값](specWgslIndeterminate), [enable 확장](specWgslExtensions), [소개](specWgslIntro).
- {{fact glslTarget}}: [명세](specGlslEs)의 지수 함수와 범위와 정밀도.

정의부터 TypeShade에서까지의 절은 이 명세들에 근거하며, 이 페이지가 그리는 값은 모두 {{pin}}에서 계산합니다.
