---
id: control-flow
source: d94114062975ea7f651ffd4411b4cdfd28f5ff9ecf97035c4d01194d0f5a49fc
sourceLine: 727
rules: 7.5 4308LIgSysAnlue51NfkW0VyNcY9-VTAPwyWJ1UyQN4=
---

이 페이지를 마치면 셰이더 본문 안에서 분기하고, 반복하고, 디스패치할 수 있습니다. 무엇을 할지
고르는 문(statement)과 어떤 값을 쓸지 고르는 표현식도 구분할 수 있습니다. 모든 형태는
TypeScript의 문법 그대로이며, 각각 같은 모양의 WGSL 문장과 GLSL 문장으로 생성됩니다.

### if, else if, else

`if`는 `bool`을 받습니다. 참으로 취급되는 값(truthiness)이라는 개념은 없습니다. 숫자에 쓴
`if (n)`은 거부되므로 `if (n != 0)`처럼 비교를 적으십시오.

```ts
if (idx == 1) {
  pos = vec2(3., -1.);
} else if (idx == 2) {
  pos = vec2(-1., 3.);
} else {
  pos = vec2(-1., -1.);
}
```

`!`는 논리 부정입니다. 그래서 거짓인 경우를 거르는 가드는 `if (!hit)`로 씁니다.

### for와 while

`for`는 횟수가 정해진 반복입니다. 정수 카운터, 상수 증감 폭, 카운터를 한계값과 비교하는 종료
조건으로 이루어지며, 본문은 한계값에 쓰지 않습니다. 한계값은 프로그램이 실행 중에 알게 되는
값이어도 됩니다. 유니폼, 매개변수, 스토리지 배열의 `.length`가 그런 예입니다.

```ts
let acc = 0.;
for (let i: u32 = 0; i < 64; i++) {
  acc += f32(i);
}
```

시작값이 음수가 아닌 리터럴이고 한계값이 `u32`이면 카운터에 타입을 붙이지 않아도 됩니다. 그
밖의 경우 카운터는 `i32`입니다. 카운터를 한계값에서 멀어지게 하는 증감은 반복이 끝나지 않으므로
`TS8007`로 거부됩니다. `while (cond)`는 카운터가 없는 열린 반복입니다.

```ts
let n: u32 = start;
let steps: u32 = 0;
while (n != 1) {
  n = select(n / 2, 3 * n + 1, (n & 1) == 1);
  steps++;
}
```

컴파일러가 받는 모든 반복 머리와, 나머지를 거부하는 이유는 `docs/use-typeshade-surface.md` §17에
있습니다.

### break, continue, discard

세 문장은 작업을 일찍 끝냅니다. `break`는 가장 가까운 반복이나 현재 switch case를 빠져나갑니다.
`continue`는 가장 가까운 반복의 다음 회차로 건너뜁니다. `discard`는 현재 프래그먼트 호출을
색상이나 깊이를 쓰지 않고 끝내며, 프래그먼트 스테이지에서 씁니다.

```ts
"use typeshade";

declare const dists: storage<array<f32>>;

@fragment
export function fs(@location(0) alpha: f32, @location(1) @interpolate("flat") count: u32): vec4 {
  let nearest = 1e10;
  for (let i: u32 = 0; i < count; i++) {
    const d = dists[i];
    if (d < 0.) {
      continue; // no distance recorded, next iteration
    }
    if (d < 0.001) {
      break; // close enough, leave the loop
    }
    nearest = min(nearest, d);
  }
  if (alpha < 0.01) {
    discard;
  }
  return vec4(nearest, 0., 0., alpha);
}
```

`discard`는 프래그먼트 진입점에서 쓸 수 있습니다. 헬퍼에서도 쓸 수 있지만, 버텍스 진입점이나
컴퓨트 진입점이 그 헬퍼에 닿지 않아야 합니다. 이 검사는 호출 그래프 전체를 따라가며, 거부할 때는
헬퍼와 진입점의 이름을 함께 알려 줍니다.

### switch

`switch`는 정수 값 하나로 디스패치합니다. 이 값을 판별값(scrutinee)이라 하며, `i32`나 `u32`여야
합니다. 각 `case` 라벨은 상수이고, `default`는 생략할 수 있는 나머지 분기입니다. 두 타깃 모두에서
실제 `switch`로 하향 변환됩니다.

```ts
let radiusPx = rawRadius;
switch (sizeMode) {
  case 1:
    radiusPx = rawRadius / viewport.z;
    break;
  case 2:
    radiusPx = rawRadius * dpr;
    break;
  default:
    break;
}
```

case는 `break`나 `return`으로 끝납니다. WGSL에는 다음 case로 이어지는 실행(fall-through)이
없습니다. 그래서 다음 case로 넘어가는 case는 고치는 방법과 함께 거부됩니다.

### 값 고르기

삼항 연산자 `c ? a : b`는 조건에 따라 값을 고릅니다. WGSL의 `select`와 같아서 두 분기를 모두
계산한 뒤 하나를 고릅니다. 계산이 가벼운 값 두 개에 알맞습니다.

```ts
const dir = segLen < 1e-6 ? vec2(1., 0.) : segVec / segLen;
```

분기의 계산이 무겁거나, 조건을 줄줄이 이어 여러 값 가운데 하나를 고른다면 변수를 선언하고 `if`
체인에서 대입하십시오. 그러면 GPU는 선택된 분기만 실행합니다.

```ts
let clip: vec4;
if (projParams.x < 0.5) {
  clip = mvp * vec4(rel2d, 0., 1.);
} else if (projParams.x < 6.5) {
  clip = mvp * vec4(relG, 0., 1.);
} else {
  clip = mvp * vec4(ecefRtc, 1.);
}
```

### reduce로 반복 접기

누산기(accumulator)는 반복의 한 회차에서 다음 회차로 넘겨지는 값입니다. 배열의 `reduce`가 이
값을 대신 넘겨 줍니다. `xs.reduce(f, init)`은 TypeScript가 실행하는 방식대로 `init`에서 시작해
왼쪽에서 오른쪽으로 `acc = f(acc, value, index)`를 실행합니다.

```ts
"use typeshade";

export function nearestOf(p: vec2, pts: array<vec2, 8>): f32 {
  return pts.reduce((acc, q) => min(acc, length(p - q)), 1e10);
}
```

이 호출은 반복문과 그 반복이 갱신하는 변수를 생성합니다. `let`과 `for`와 대입을 직접 쓴 것과
같은 코드입니다. `map`, `forEach`, `some`, `every`도 쓸 수 있고, `map`을 뺀 나머지는 런타임
크기 스토리지 배열에서도 동작합니다(`docs/use-typeshade-surface.md` §63).

### enum으로 디스패치하기

숫자 `enum`은 이름 붙은 정수 상수의 집합을 선언합니다. 각 멤버는 모듈 상수이므로 `case` 라벨에
쓸 수 있습니다.

```ts
"use typeshade";

enum Kind {
  Line,
  Fill,
  Stroke,
}

export function colorOf(kind: i32, line: vec4, fill: vec4, stroke: vec4): vec4 {
  switch (kind) {
    case Kind.Line:
      return line;
    case Kind.Fill:
      return fill;
    default:
      return stroke;
  }
}
```

`Kind.Fill`은 상수 `1`을 읽고, enum 이름을 타입으로 쓰면 `i32`입니다. enum이 선언하지 않은
멤버를 읽으면 그 자리에서 오류가 납니다. 문자열 멤버는 담을 GPU 타입이 없으므로 거부됩니다.

### 조기 반환

분기나 반복 안의 `return`은 TypeScript에서처럼 함수를 빠져나갑니다.

```ts
"use typeshade";

export function sign01(winding: i32, minDist: f32): f32 {
  if (winding != 0) {
    return 1. - minDist;
  }
  return 1. + minDist;
}
```

값을 돌려주는 함수는 모든 경로에서 값을 돌려줘야 합니다. 값을 돌려주는 함수의 끝에 반환 없이
도달하는 경로가 있으면 컴파일 오류가 납니다.
