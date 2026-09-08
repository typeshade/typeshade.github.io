---
id: values-and-mutation
source: ac589e7754f443bb899bba036c5f045c5fadfdd9a94a2367b99f65310319933c
sourceLine: 235
---
### 그냥 `const`: `let`/`var`/인라인 여부는 생성 패스가 정합니다

중간값은 모두 평범한 JS `const`로 작성합니다. `Let(...)`이나 `Var(...)`로 감싸지 **않습니다**:

```ts
const ab = b.sub(a)
const len2 = dot(ab, ab)
```

생성 패스는 각 값을 인라인 표현식으로 둘지, 공유되는 WGSL `let`(공통부분식 캐시)으로 둘지,
`var`로 둘지를 정합니다. 나중에 `const`를 **변경**하면(아래 `.assign` 참고), 별도로 표시하지
않아도 **auto-var 패스**가 자동으로 이를 WGSL `var`로 구체화합니다:

```ts
const min_dist = f32(1e10) // plain const…
// …later, inside a loop…
min_dist.assign(min(min_dist, d)) // …auto-materialises as `var`
```

`Let(...)`과 `Var(...)`는 이름이 있는 바인딩을 **강제로** 만들어야 하는 드문 경우를 위해
여전히 남아 있습니다. WGSL에서 제어 흐름이 균일해야만 쓸 수 있는 `fwidth` 같은 미분 함수,
또는 이름을 붙이고 싶은 가변 누산기가 그런 경우입니다. 다만 기본값은 그냥 `const`입니다.

**`Let`이 정말로 필요한 경우** (#838): CSE는 **변경되는** `var`를 읽는
부분식을 끌어올리지 못합니다. 읽는 지점마다 값이 다르기 때문입니다. 그래서 변경 루프
안의 공유 부분식은 값을 구체화해 두지 않으면 쓰는 자리마다 다시 생성됩니다:

```ts
Loop(
  u32(0),
  (i) => i.lt(u32(72)),
  () => {
    const p = ro.add(rd.mul(t)) // t is mutated below → CSE can't cache anything reading it
    const d = Let(length(p).sub(1)) // materialise ONCE; without Let the SDF re-emits per read
    If(d.lt(0.001), () => Break())
    t.assign(t.add(d))
  },
)
```

정리하면, `var`를 변경하는 루프 안에서는 그 `var`에서 파생되어 두 번 이상 읽는 값을 모두
`Let`으로 감쌉니다.

**GLSL 타깃: `discard`를 실행하는 구조체 생성자 인자는 자동으로 끌어올려지며, 별도 표시가
필요 없습니다** (#1840). ANGLE의 D3D11 백엔드는 구조체 생성자 인자 안에 (간접적으로라도)
`discard`를 실행하는 함수 호출이 들어 있는 GLSL ES 3.00 프래그먼트 셰이더를 잘못
컴파일합니다. COMPILE_STATUS와 LINK_STATUS 모두 성공을 보고하지만, 첫 제출 시점에 드로우가
조용히 지오메트리를 누락시킵니다. GLSL 전용 legalize 패스(`glsl-legalize.ts`)가 이 형태를
감지해, 생성자를 호출하기 직전에 그 인자를 새 `_dhN` 지역 변수에 담습니다. 이 처리는 GLSL을
생성할 때마다 이뤄집니다. 평소처럼 그냥 `const`(또는 인라인 호출)로 작성하면 되고, 이를
위해 `Var()`나 `Let()`으로 감쌀 필요는 없습니다. 이 끌어올림은 자동으로, GLSL에서만
일어나므로 WGSL 생성 결과는 바이트 단위로 그대로 유지됩니다.

### `.assign(v)`: 유일한 변경 메서드

JS는 `=` 연산자를 오버로드할 수 없으므로, 변경은 좌변값(lvalue) Node의 메서드로 존재합니다
(three.js TSL의 `.assign`과 같은 방식입니다):

```ts
x.assign(value) // x = value;
winding.assign(winding.add(1)) // compound = the pure op + assign; a Node has no addAssign
o.pos.assign(vec4(pos, 0, 1)) // member targets work too
```

작성 인터페이스에는 독립된 `assign(x, v)` 함수가 **없습니다**. `.assign`은 대상 Node의
메서드로만 존재합니다. Node에는 복합 대입 메서드 `.addAssign`도 **없습니다**. `add`는 순수
표현식이므로, `x += v`는 `x.assign(x.add(v))`로 씁니다. (`fn` 본문에 선택적으로 넘겨주는
`Builder`는 `b.assignOp(target, '+', v)`와 `b.addAssign(target, v)`를 제공하며, 이들은
값은 같고 문장 형태만 다른 복합 `+=` 문을 생성합니다.)

**불변 바인딩을 변경하려 하면 컴파일 오류가 납니다.** `.assign`은 **가변** 노드
타입(`Node`)에만 있습니다. `Var()`가 돌려주는 값은 물론, 리터럴·생성자·산술 연산·접근자처럼
만들어지는 모든 값도 이 타입이므로, 그냥 `const`로 써도 auto-var 패턴이 동작합니다. `Let()`,
함수 매개변수, 모듈 `const`는 읽기 전용 상위 타입 `ReadonlyNode`를 반환하며, 여기에는
`.assign`이 없습니다. 그래서 `someLet.assign(…)`이나 `param.assign(…)`을 쓰면
`device.createShaderModule`을 호출할 것도 없이 `tsc` 단계에서 곧바로 거부됩니다. 읽기
API(`length`, `dot`, `mix`, `.of`, `fn`의 반환값 등)는 `ReadonlyNode`를 받으므로, 불변
바인딩도 값을 읽는 모든 자리에 그대로 흘러 들어갑니다. (이는 타입 차원의 구분일 뿐이며,
생성되는 WGSL 자체는 달라지지 않습니다. RxJS의 `Observable`과 `Subject` 관계를 떠올리면
됩니다.) 값을 변경하려면 `Var()`로 선언합니다.

### 메서드 연산과 문맥 기반 리터럴 승격

산술, 비교, 비트 연산, 스위즐, 인덱스는 모두 Node의 **메서드**입니다:

| 분류       | 메서드                                                                    |
| ---------- | ------------------------------------------------------------------------ |
| 산술       | `.add .sub .mul .div .mod .neg`                                          |
| 비교       | `.lt .gt .le .ge .eq .ne`                                                |
| 논리       | `.and .or`                                                               |
| 비트 연산  | `.bitAnd .bitOr .bitXor .shl .shr`                                       |
| 구성 요소  | `.x .y .z .w` · `.r .g .b .a` · `.rgb .xy .xyz …` · `.swizzle<R>('zxy')` |
| 인덱스     | `.at(i, elemType)`                                                       |
| 삼항       | `cond.select(a, b)` (WGSL `select`)                                      |

> **`.mod` 메서드는 `%`이며, 부동소수점에 대해 trunc-mod(버림 나머지 연산)를
> 계산합니다. WGSL에서는 이 연산이 네이티브로 있고, GLSL ES 3.00에서는 `%`가 정수 전용이라
> GLSL 작성기가 `a - b * trunc(a / b)`로 풀어 씁니다.**
> 부동소수점 FLOOR 나머지 연산이 필요하면 독립 함수
> **`mod(x, y)`** (#839)를 씁니다. 이 함수는 두 타깃에서 동일한 FLOOR-mod 의미를 가집니다
> (WGSL은 `x − y·⌊x/y⌋`로 인라인하고, GLSL은 네이티브 `mod()`를 씁니다). 그래서 음수
> 피연산자도 `[0, y)` 범위로 감싸 들어옵니다. 도메인 반복이나 각도 폴딩에 필요한 동작입니다.
> 이름은 GLSL/TSL의 `mod`를 따랐습니다. C/HLSL에서 trunc-mod를 뜻하는 `fmod`와 이름이
> 겹치지 않도록 의도적으로 골랐습니다. 성분 단위로 동작하며, `y`는 스칼라 하나로 벡터
> `x` 전체에 브로드캐스트될 수 있습니다.

**숫자 리터럴을 그대로 쓰면 피연산자의 타입에 맞춰 문맥 기반으로 승격됩니다.** `f32()` /
`u32()` / `i32()` 래퍼는 굳이 쓰지 않아도 됩니다:

```ts
x.add(1) // f32 x → `x + 1.0`
flags.bitAnd(1) // u32 flags → `flags & 1u`   (typed from the LHS)
mode.eq(2) // u32 → `mode == 2u`
vec4(pos, 0, 1) // numeric components lift to the vec's element (f32)
vec2u(0, 1) // → u32 components
```

같은 승격은 벡터·구조체 생성자(`vec2/vec3/vec4/vec2u/vec2i`, `construct`) 안에서도,
`min/max/clamp/mix/pow/smoothstep` 안에서도 그대로 적용됩니다. 추론할 문맥이 **없는**
경우, 즉 독립된 상수이거나 수학 내장 함수의 타입을 정하는 첫 번째 인자일 때만
`f32(0.5)` / `u32(16)`처럼 타입을 명시적으로 남겨 둡니다.

**음수 리터럴도 똑같이 승격됩니다** (#845). `x.mul(-6)`, `.add(-0.25)`, `vec3(-1, 0, 1)`
모두 두 타깃에서 부호가 있는 리터럴을 그대로(`x * -6.0`) 생성합니다. 일부 예전 예제가
쓰던 방어적인 `.neg()` / `.sub()` 표기는 필요 없습니다. 부호는 숫자 안에 바로 씁니다.

### `radians()` / `degrees()`

각도와 라디안을 서로 바꿀 때는 WGSL 내장 함수를 씁니다. 반올림한 상수를 곱하는 방식은
쓰지 않습니다:

```ts
const lonRad = radians(lon) // was: lon.mul(DEG2RAD)
const latDeg = degrees(latRad) // was: latRad.div(DEG2RAD)
```

(`DEG2RAD`는 abs-Mercator → 도(度) 역변환 경로에서 `(DEG2RAD·EARTH_R)`로 나누는 나눗셈의
분모로만 남아 있습니다. 상수를 접어 없애면 정밀도가 달라지기 때문입니다.)
