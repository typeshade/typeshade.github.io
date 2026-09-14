---
id: values-and-mutation
source: 89f4a325c1d6696f50016f7e50d7680463c5d90df66e46a8ed551447ff6101e4
sourceLine: 323
---

이 절을 다 읽고 나면 중간값을 작성하고, 코드에 타입이 필요한 자리에 타입을 지정하고, 값을
변경하고, 어떤 값에 따로 이름을 붙여야 하는지 판단할 수 있습니다.

### 타입 토큰

**타입 토큰**은 셰이더 타입 하나를 가리키는 값입니다. 이름은 모두 `T`로 끝납니다. 함수
매개변수, 구조체 필드, 바인딩되는 리소스, 배열의 요소 타입처럼 선언 자리에 타입이 필요할 때
토큰을 씁니다. 토큰은 타입을 가리킬 뿐이므로 값 대신 쓸 수는 없습니다. 다만 아래에 나오는
`arrayLit`과 `.at`처럼 값을 만드는 함수 가운데 몇몇은 토큰을 인자로 받습니다.

```ts
const scale = fn('scale', { v: vec2fT, k: f32T }, ({ v, k }) => v.mul(k))
```

`f32T`는 부동소수점 스칼라입니다. 타입을 가져올 피연산자가 없는 그냥 숫자도 기본으로 이
타입이 됩니다. `u32T`와 `i32T`는 정수 스칼라이고, `boolT`는 비교 연산의 결과 타입입니다.
`vec2fT`, `vec3fT`, `vec4fT`는 부동소수점 벡터이며, 부호 없는 벡터는 `vec2uT`, `vec3uT`,
`vec4uT`, 부호 있는 벡터는 `vec2iT`, `vec4iT`입니다. `arrayT(elem, n)`은 토큰 하나를 받아
고정 길이 배열 타입을 만듭니다.

### 평범한 const 바인딩

중간값은 모두 평범한 JavaScript `const`로 작성합니다. 다른 것으로 감쌀 필요가 없습니다.

```ts
const ab = b.sub(a)
const len2 = dot(ab, ab)
```

이 `const`에는 노드 하나가 들어 있고, 노드는 자기가 어떻게 만들어졌는지 기억합니다. 그래서
같은 이름을 두 번 쓰면 같은 식을 두 번 쓴 것과 같습니다. 각 값을 인라인 표현식으로 둘지,
공유하는 `let`(공통부분식 캐시)으로 둘지, `var`로 둘지는 생성 패스가 값마다 정합니다. 이
판단을 작성자가 소스에 적어 두지는 않습니다.

GLSL 타깃은 여기에 값을 앞으로 끌어내는 처리(hoist)를 하나 더 합니다. 구조체 생성자의
인자가 `discard`를 실행할 수 있는 함수에서 나온 값이면, 생성자를 호출하기 직전에 그 값을
지역 변수에 담아 둡니다. GLSL을 생성할 때마다 자동으로 하는 일이므로 소스에 표시할 것은
없고, WGSL 출력은 달라지지 않습니다.

### Let과 Var

값에 이름이 꼭 있어야 할 때는 두 함수 가운데 하나로 이름을 붙입니다. `Let(value)`는 값을
한 번 바인딩하고 읽기 전용 노드를 돌려줍니다. `Var(init)`은 가변 변수를 선언합니다. 타입은
초깃값에서 가져오며, 타입 토큰을 직접 넘길 수도 있습니다. 토큰을 넘길 때는 초깃값을 생략해도
됩니다. 둘 다 첫 인자로 이름 문자열을 받을 수 있고, 이 이름이 생성된 소스에 그대로 쓰입니다.
이름을 생략하면 함수 안에서 겹치지 않는 자동 이름(`_v0`, `_v1`)이 붙으므로, 생성된 소스를
읽을 자리에는 이름을 넘겨줍니다.

```ts
const d = Let('d', length(p).sub(1)) // let d = …;   bound once, read only
const t = Var('t', f32(0)) // var t: f32 = 0.0;
const hits = Var('hits', u32T) // var hits: u32;
```

`Let` 바인딩과 함수 매개변수, 모듈 상수는 모두 읽기 전용 노드입니다. 값을 읽는 메서드는 다
있지만 값을 쓰는 메서드는 없으므로, 여기에 대입하면 그 줄에서 바로 `tsc` 오류가 납니다.
값을 변경할 생각이면 `Var`로 선언합니다.

루프 안에서 변수를 변경한다면 `Let`을 쓸지는 더 이상 취향의 문제가 아닙니다. 변경되는
변수를 읽는 값은 읽을 때마다 달라지므로 부분식 캐시가 공유하지 못합니다. 그래서 그 변수에서
파생한 값을 두 번 읽으면, `Let`으로 묶어 두지 않는 한 쓰는 자리마다 같은 식을 다시
생성합니다. `fwidth` 같은 미분 함수에 이름이 필요한 이유는 다릅니다. WGSL은 이 호출을 균일한
제어 흐름 안에 두도록 요구하므로, 그 값을 읽는 분기 바깥에서 `Let`으로 묶습니다.

### assign으로 변경하기

JavaScript는 `=`를 오버로드할 수 없으므로, 변경은 값을 쓸 대상이 가진 메서드로 합니다. 그
메서드는 `.assign(v)` 하나뿐이고, 노드에 복합 대입 메서드는 없습니다. `add`는 순수
표현식이므로 `x += v`는 `x.assign(x.add(v))`로 씁니다.

```ts
const min_dist = f32(1e10) // a plain const…
min_dist.assign(min(min_dist, d)) // …becomes a var because something assigns to it
winding.assign(winding.add(1)) // no addAssign; the pure op plus assign
o.pos.assign(vec4(pos, 0, 1)) // a struct field is a target too
```

평범한 `const`에 대입하기만 해도 생성된 소스에서는 변수가 됩니다. 대입할 것을 미리 알고
`Var`로 선언해 둘 필요는 없습니다.

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

몇몇 연산은 독립 함수로 제공합니다. `select(cond, a, b)`는 `.select`의 독립 함수 버전으로,
코드에서 조건이 맨 앞에 오지 않는 편이 읽기 좋을 때 씁니다. `mod(x, y)`는 floor 방식의
나머지 연산입니다. 도메인 반복이나 각도 폴딩처럼 피연산자가 음수일 수 있는 자리에서는 이
함수를 씁니다. `.mod` 메서드는 `%`와 같아서 음수 피연산자에서는 결과가 다릅니다. `radians`와
`degrees`는 각도를 변환해 주므로, 변환 상수를 직접 적거나 반올림할 일이 없습니다.

```ts
const inside = d.lt(0).and(u.ge(0))
const shade = select(inside, 1, 0)
const cell = mod(p.x, 2).sub(1)
const lonRad = radians(lon)
const latDeg = degrees(latRad)
```

### 숫자 리터럴

그냥 숫자는 옆에 있는 피연산자의 타입으로 승격되므로, 대부분 래퍼를 쓸 필요가 없습니다.

```ts
x.add(1) // f32 x → x + 1.0
flags.bitAnd(1) // u32 flags → flags & 1u
mode.eq(2) // u32 → mode == 2u
vec4(pos, 0, 1) // components lift to the vector's element type
vec2u(0, 1) // → u32 components
```

벡터·구조체 생성자 안에서도, `min`, `max`, `clamp`, `mix`, `pow`, `smoothstep` 안에서도 같은
승격이 일어납니다. 타입을 추론할 근거가 없는 자리에는 `f32(0.5)`나 `u32(16)`처럼 타입을
명시합니다. 홀로 쓰이는 상수, 수학 내장 함수의 타입을 정하는 첫 번째 인자,
`f32(1).sub(v)`처럼 메서드를 호출할 리터럴이 그런 자리입니다.

음수 리터럴도 같은 방식으로 승격됩니다. `x.mul(-6)`, `.add(-0.25)`, `vec3(-1, 0, 1)`은 두
타깃 모두에서 부호 붙은 리터럴로 나가므로, 부호는 숫자에 붙여 씁니다.

### 모듈 상수

모듈 상수는 한 번만 선언하며, 두 타깃 모두에 `const`로 나가고, 기준값을 내는 CPU 오라클도
같은 값으로 계산합니다. GPU 값과 CPU 값이 달라야 하는 스칼라는 `constDecl`로 선언합니다.
셰이더에는 잘라낸 값을 보이고 오라클에는 전체 정밀도 값을 보여야 하는 상수가 여기에
해당합니다.

```ts
const PI = constDecl('PI', f32T, { wgsl: 3.14159265, cpu: Math.PI })
const area = fn('area', { r: f32T }, ({ r }) => r.mul(r).mul(PI.node))
```

`constDecl`은 두 부분으로 이루어진 핸들(handle)을 돌려줍니다. `PI.decl`은 모듈에 넣는
선언이고, `PI.node`는 함수 본문에서 읽는, 타입이 붙은 참조입니다. 그래서 상수 이름을
바꾸거나 잘못 적으면 그 상수를 쓰는 자리마다 `tsc` 오류가 납니다.

색상, 팔레트, 구조체처럼 스칼라가 아닌 상수는 `constExpr`로 선언하며, 컴파일러가 상수
폴딩할 수 있는 리터럴 노드를 넘깁니다. `arrayLit(elem, ...items)`은 여기에 넘길 배열
리터럴을 만듭니다.

```ts
const SKY = constExpr('SKY', vec4fT, vec4(0.4, 0.6, 0.9, 1))
const PALETTE = constExpr('PALETTE', arrayT(vec4fT, 3), arrayLit(vec4fT, c0, c1, c2))
```

`PI.decl`과 `constExpr`의 결과는 모듈의 `consts` 배열에 넣습니다. `constDecl`로 선언한
상수는 `PI.node`로 읽습니다. `constExpr`로 선언한 상수는 `constRef('SKY', vec4fT)`로
읽는데, 이름이 문자열이라 잘못 적어도 타입 검사기가 잡아 주지 못합니다.
