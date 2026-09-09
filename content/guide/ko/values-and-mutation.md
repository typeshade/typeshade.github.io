---
id: values-and-mutation
source: 74f64a4d6ddc6db4ecedff56b7365c58c655e3157d305ae5a954eb708c220fba
sourceLine: 322
---

이 절을 다 읽고 나면 중간값을 작성하고, 코드에 타입이 필요한 자리에 타입을 지정하고, 값을
변경하고, 어떤 값에는 따로 이름을 붙여야 하는지 구분할 수 있습니다.

### 타입 토큰

**타입 토큰**은 셰이더 타입 하나를 가리키는 값입니다. 이름은 모두 `T`로 끝납니다. 선언
자리에 타입이 필요할 때, 즉 함수 매개변수, 구조체 필드, 바인딩되는 리소스, 배열의 요소
타입을 적을 때 토큰을 씁니다. 토큰은 타입을 가리킬 뿐 값을 대신하지 않습니다. 다만 아래에
나오는 `arrayLit`과 `.at`처럼 일부 값 생성 함수는 토큰을 인자로 받기도 합니다.

```ts
const scale = fn('scale', { v: vec2fT, k: f32T }, ({ v, k }) => v.mul(k))
```

`f32T`는 부동소수점 스칼라를 가리키며, 타입을 가져올 피연산자가 없을 때 그냥 숫자가
기본으로 쓰는 타입이기도 합니다. `u32T`와 `i32T`는 정수 스칼라이고, `boolT`는 모든
비교 연산이 만들어 내는 타입입니다. `vec2fT`, `vec3fT`, `vec4fT`는 부동소수점 벡터입니다.
부호 없는 짝은 `vec2uT`, `vec3uT`, `vec4uT`이고, 부호 있는 짝은 `vec2iT`, `vec4iT`입니다.
`arrayT(elem, n)`은 다른 토큰으로부터 고정 길이 배열 타입을 만듭니다.

### 평범한 const 바인딩

중간값은 모두 평범한 JavaScript `const`로 작성합니다. 따로 감쌀 것이 없습니다.

```ts
const ab = b.sub(a)
const len2 = dot(ab, ab)
```

이 `const`는 노드 하나를 담고 있고, 노드는 자신이 어떻게 만들어졌는지 기억합니다. 그래서
같은 이름을 두 번 쓰면 같은 식을 두 번 쓰는 셈이 됩니다. 생성 패스는 그다음 각 값을 인라인
표현식으로 둘지, 공유되는 `let`(공통부분식 캐시)으로 둘지, `var`로 둘지를 값마다 정합니다.
이 판단은 작성자가 직접 적어 둘 몫이 아닙니다.

GLSL 타깃은 여기에 자체적인 끌어올림을 한 가지 더 적용합니다. 구조체 생성자의 인자값이
`discard`를 실행할 수 있는 함수에서 나온 것이라면, 생성자를 호출하기 직전에 그 값을 지역
변수에 담아 둡니다. 이 처리는 GLSL을 생성할 때마다 일어나므로 소스에 따로 표시할 것이
없고, WGSL 출력에는 영향을 주지 않습니다.

### Let과 Var

이름이 반드시 있어야 하는 값에는 두 함수로 이름을 붙입니다. `Let(value)`는 값을 한 번
바인딩하고 읽기 전용 노드를 돌려줍니다. `Var(init)`은 가변 변수를 선언합니다. 타입은
초깃값에서 가져오거나 타입 토큰을 직접 넘길 수 있고, 이때 초깃값은 있어도 되고 없어도
됩니다. 둘 다 맨 앞에 이름 문자열을 선택적으로 받으며, 이 문자열이 생성된 소스 안의
이름이 됩니다. 이름을 생략하면 함수마다 고유한 자동 이름(`_v0`, `_v1`)이 붙으므로, 생성된
소스를 읽고 싶은 자리에는 이름을 넘겨줍니다.

```ts
const d = Let('d', length(p).sub(1)) // let d = …;   bound once, read only
const t = Var('t', f32(0)) // var t: f32 = 0.0;
const hits = Var('hits', u32T) // var hits: u32;
```

`Let` 바인딩과 함수 매개변수, 모듈 상수는 모두 읽기 전용 노드입니다. 값을 읽는 메서드만
모두 갖추고 값을 쓰는 메서드는 하나도 없어서, 여기에 값을 대입하면 작성한 그 줄에서 바로
`tsc` 오류가 납니다. 값을 변경하려면 `Var`로 선언합니다.

변수를 변경하는 루프 안에서는 `Let`을 쓰는지가 더 이상 취향의 문제가 아닙니다. 부분식
캐시는 변경되는 변수를 읽는 값을 공유하지 못합니다. 읽을 때마다 값이 달라지기 때문입니다.
그래서 그 변경되는 변수에서 파생되어 두 번 읽히는 값은 `Let`으로 묶어 두지 않는 한 쓰는
자리마다 다시 생성됩니다. `fwidth` 같은 미분 함수는 다른 이유로 이름이 필요합니다. WGSL은
이 호출이 제어 흐름이 균일한 곳에서 나오길 요구하므로, 그 값을 읽는 분기 바깥에서 `Let`으로
묶어 둡니다.

### assign으로 변경하기

JavaScript는 `=` 연산자를 오버로드할 수 없으므로, 변경은 값을 쓰는 대상의 메서드로
존재합니다. `.assign(v)`가 그 유일한 메서드입니다. 독립 함수 `assign(x, v)`는 없고, 노드에는
복합 대입 메서드도 없습니다. `add`는 순수 표현식이므로 `x += v`는 `x.assign(x.add(v))`로
씁니다.

```ts
const min_dist = f32(1e10) // a plain const…
min_dist.assign(min(min_dist, d)) // …becomes a var because something assigns to it
winding.assign(winding.add(1)) // no addAssign; the pure op plus assign
o.pos.assign(vec4(pos, 0, 1)) // a struct field is a target too
```

평범한 `const`에 값을 대입하기만 해도 생성된 소스에서는 변수가 됩니다. 이를 미리 내다보고
`Var`를 선언해 둘 필요는 없습니다.

### 연산자 메서드

산술, 비교, 비트 연산, 구성 요소 접근, 인덱스는 모두 노드의 메서드입니다. 변경이 메서드인
것과 같은 이유입니다.

| 분류       | 메서드                                                                    |
| ---------- | ------------------------------------------------------------------------ |
| 산술       | `.add .sub .mul .div .mod .neg`                                          |
| 비교       | `.lt .gt .le .ge .eq .ne`                                                |
| 논리       | `.and .or`                                                               |
| 비트 연산  | `.bitAnd .bitOr .bitXor .shl .shr`                                       |
| 구성 요소  | `.x .y .z .w` · `.r .g .b .a` · `.rgb .xy .xyz …` · `.swizzle<R>('zxy')` |
| 인덱스     | `.at(i, elemType)`                                                       |
| 삼항       | `cond.select(a, b)`                                                      |

일부 연산은 독립 함수로 존재합니다. `select(cond, a, b)`는 `.select`를 독립 함수로 옮겨
쓴 것으로, 조건을 먼저 읽고 싶은 값으로 두고 싶지 않을 때 씁니다. `mod(x, y)`는 floor
나머지 연산으로, 피연산자가 음수일 수 있는 자리, 이를테면 도메인 반복이나 각도 폴딩에서
찾게 되는 함수입니다. `.mod` 메서드는 `%`이며 음수 피연산자에서는 다르게 동작합니다.
`radians`와 `degrees`는 각도를 변환해 주므로, 변환 상수를 직접 적거나 반올림할 필요가
없습니다.

```ts
const inside = d.lt(0).and(u.ge(0))
const shade = select(inside, 1, 0)
const cell = mod(p.x, 2).sub(1)
const lonRad = radians(lon)
const latDeg = degrees(latRad)
```

### 숫자 리터럴

그냥 숫자는 옆에 있는 피연산자의 타입으로 승격되므로, 대부분의 경우 래퍼가 필요
없습니다.

```ts
x.add(1) // f32 x → x + 1.0
flags.bitAnd(1) // u32 flags → flags & 1u
mode.eq(2) // u32 → mode == 2u
vec4(pos, 0, 1) // components lift to the vector's element type
vec2u(0, 1) // → u32 components
```

같은 승격은 벡터·구조체 생성자 안에서도, `min`, `max`, `clamp`, `mix`, `pow`,
`smoothstep` 안에서도 그대로 적용됩니다. 추론할 대상이 없는 자리, 즉 독립된 상수이거나
수학 내장 함수의 타입을 정하는 첫 번째 인자이거나 `f32(1).sub(v)`처럼 메서드를 호출하고
싶은 리터럴이라면 `f32(0.5)`나 `u32(16)`처럼 타입을 명시적으로 남겨 둡니다.

음수 리터럴도 같은 방식으로 승격됩니다. `x.mul(-6)`, `.add(-0.25)`, `vec3(-1, 0, 1)`은
모두 두 타깃에서 부호가 있는 리터럴을 그대로 생성하므로, 부호는 숫자 안에 씁니다.

### 모듈 상수

모듈 상수는 한 번 선언되고, 두 타깃 모두에서 `const`로 생성되며, CPU 오라클에서도 그대로
계산됩니다. GPU 값과 CPU 값이 서로 다른 스칼라, 즉 셰이더에는 절단된 값이 보이고
오라클에는 전체 정밀도 값이 보여야 하는 상수는 `constDecl`로 선언합니다.

```ts
const PI = constDecl('PI', f32T, { wgsl: 3.14159265, cpu: Math.PI })
const area = fn('area', { r: f32T }, ({ r }) => r.mul(r).mul(PI.node))
```

`constDecl`은 반쪽 두 개로 이루어진 핸들을 돌려줍니다. `PI.decl`은 모듈이 지니는
선언이고, `PI.node`는 함수 본문 안에서 읽는, 정적 타입이 붙은 참조입니다. 그래서 상수
이름을 바꾸거나 잘못 적으면 그 값을 쓰는 자리마다 `tsc` 오류가 납니다.

스칼라가 아닌 상수, 즉 색상, 팔레트, 구조체는 컴파일러가 접을 수 있는 리터럴 노드로부터
`constExpr`로 선언합니다. `arrayLit(elem, ...items)`은 그 리터럴 노드로 넘길 배열
리터럴을 만듭니다.

```ts
const SKY = constExpr('SKY', vec4fT, vec4(0.4, 0.6, 0.9, 1))
const PALETTE = constExpr('PALETTE', arrayT(vec4fT, 3), arrayLit(vec4fT, c0, c1, c2))
```

`PI.decl`과 `constExpr`의 결과는 모듈의 `consts` 배열에 넣습니다. `constDecl`로 선언한
값은 `PI.node`로 읽습니다. `constExpr`로 선언한 상수는 `constRef('SKY', vec4fT)`로
읽는데, 이때 이름은 문자열이라 타입 검사기가 대신 확인해 주지 못합니다.
