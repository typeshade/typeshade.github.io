---
id: control-flow
source: 5d7c48acb7feb6c132a960347ab1d34926c3fc660003ef9763b7e135de46f28d
sourceLine: 770
---

이 절을 읽고 나면 TypeShade 셰이더 본문에서 TypeScript와 비슷한 분기와 반복을 GPU 제어 흐름으로 작성하고, 문 형태와 값 형태를 구분해 적절한 디스패치와 조기 종료를 선택할 수 있습니다. 문 형태는 `If`와 `Loop`처럼 작성 중인 본문에 코드를 쌓아 올릴 뿐, 바인딩할 수 있는 값을 돌려주지 않습니다. 값 형태는 `when`과 `matchEnum`처럼 내부에서 같은 분기를 만들어 내고, 그 결과를 `const`에 바인딩할 수 있는 노드로 돌려줍니다. 분기가 값을 고르기 위해 있다면 값 형태를 쓰고, 무언가를 하기 위해 있다면 문 형태를 씁니다.

### If, elif, else

`If(cond, body)`는 `bool` 노드 하나와 인자 없는 클로저 하나를 받습니다. 본문은 가장 안쪽에
열려 있는 스코프에 코드를 바로 써넣으므로, 빌더 객체를 따로 넘겨 줄 필요가 없습니다. 결과에
`.elif(cond, body)`와 `.else(body)`를 이어서 씁니다.

```ts
If(p.idx.eq(1), () => {
  pos.assign(vec2(3, -1))
})
  .elif(p.idx.eq(2), () => {
    pos.assign(vec2(-1, 3))
  })
  .else(() => {
    pos.assign(vec2(-1, -1))
  })
```

이 셋은 값을 돌려주지 않는 문(statement)입니다. 본문이 TypeScript의 `return value`로 끝나도
그 값은 체인의 결과로 읽히지 않으며, 이런 코드는 조용히 버려지는 대신 `SD0115` 오류로
거부됩니다. 값이 갈 곳이 없어 분기가 빈 블록으로 생성되기 때문입니다. 분기 안에서 함수를
빠져나가려면 `Return`이나 `ReturnIf`를 쓰며, 둘 다 이 절의 끝에서 다룹니다. 분기가 값을 고르기
위해 있다면 뒤에서 나오는 `when`을 씁니다.

`.not()`은 논리 부정이므로, 거짓인 경우를 가드로 다룰 때는 `If(hit.eq(bool(false)), …)` 대신
`If(hit.not(), …)`처럼 씁니다.

### Loop

`Loop`는 C 스타일 for문입니다. 정해진 반복 횟수만 있으면 되는 경우가 대부분이며, 그럴 때는
짧은 형태로 충분합니다.

```ts
Loop(64, (i) => {
  acc.addAssign(i.f32())
})
```

카운터는 `0u`에서 시작해 지정한 횟수까지 하나씩 늘어납니다. 카운터가 영이 아닌 값에서
시작하거나 거꾸로 세거나 리터럴이 아닌 값과 비교해야 한다면 세 부분으로 된 형태를 씁니다. 이
형태는 카운터 초깃값과 조건, 본문을 받고, 증가값은 선택 사항으로 기본값이 `+1`입니다. 어느
형태든 맨 앞에 이름 문자열을 넘기면 생성되는 소스에서 그 이름이 카운터 이름이 되며, 이
문자열도 선택 사항입니다.

```ts
Loop(
  u32(0),
  (i) => i.lt(64), // the condition receives the counter…
  (i) => {
    // …and so does the body, so declare (i) here too
    acc.addAssign(i.f32())
  },
)
```

두 형태는 같은 루프를 나타내며 같은 `for` 헤더로 생성됩니다. 그냥 숫자는 비교 대상인 카운터의
타입을 그대로 따르므로, `u32` 카운터에서는 `i.lt(64)`가 `i < 64u`로 생성되고 따로 `u32(64)`라고
쓸 필요가 없습니다.

두 콜백 모두 카운터를 인자로 받습니다. 본문을 `() => {}`로 써 놓고 안에서 `i`를 쓰면
JavaScript 클로저 문법으로는 문제가 없지만, 그 자리에 `i`는 정의되어 있지 않으므로 `tsc`가
작성한 줄에서 `Cannot find name 'i'`를 보고합니다. 카운터는 변경 가능한 노드로 들어오므로
본문 안에서 카운터에 대입해도 됩니다.

본문을 만드는 도중 오류가 던져지면 어느 본문에서 나온 오류인지도 함께 담기므로, 메시지는
`in Loop body`처럼 함수 이름과 본문 종류로 시작합니다.

### Break, continue, discard

작업을 도중에 끝내는 종료자는 세 가지입니다. `Break()`는 가장 가까운 루프 또는 현재 switch의
case를 빠져나갑니다. `Continue()`는 가장 가까운 루프의 다음 반복으로 넘어갑니다. `Discard()`는
색이나 깊이를 쓰지 않고 현재 프래그먼트 호출을 끝내며, 프래그먼트 스테이지에서만 씁니다.
루프 안에 중첩된 `If`나 `Switch` 본문은 루프 경계가 아니므로, 그 안에 쓴 `Break()`는 바깥
루프를 빠져나갑니다.

```ts
const dists = Var('dists', arrayT(f32T, 64))

Loop(
  u32(0),
  (i) => i.lt(count),
  (i) => {
    const d = Let(dists.at(i)) // an array node knows its own element type
    If(d.lt(0), () => Continue()) // no distance recorded, next iteration
    If(d.lt(0.001), () => Break()) // close enough, leave the loop
    nearest.assign(min(nearest, d))
  },
)

If(alpha.lt(0.01), () => {
  Discard()
})
```

### Switch

`Switch(scrut)`는 정수 값 하나를 기준으로 디스패치합니다. 이 기준값을 판별값(scrutinee)이라
하며, `i32` 또는 `u32` 노드입니다. `.case(n, body)`는 case 레이블을 추가하고,
`.default(body)`는 default 분기(생략 가능)를 추가하면서 체인을 닫습니다. 두 타깃 모두에서
실제 `switch`문으로 하향 변환(lowering)됩니다.

`Switch`는 값을 돌려주지 않는 문이므로, 값을 고르는 용도라면 변수를 먼저 선언해 두고 각
분기에서 그 변수에 대입합니다.

```ts
const radiusPx = Var(rawRadius)
Switch(sizeMode)
  .case(1, () => radiusPx.assign(rawRadius.div(viewport.z)))
  .case(2, () => radiusPx.assign(rawRadius.mul(dpr)))
  .default(() => {}) // the default arm may be empty, and it terminates the chain
```

같은 디스패치를 값 형태로 쓰면 `matchExpr(scrutinee, cases, default)`이고, 결과를 노드로
돌려줍니다. 분기는 `[caseValue, value]` 쌍으로 넘기고, default에는 어떤 case에도 걸리지 않을
때 쓸 값을 넘깁니다.

### when으로 값 고르기

`when`은 조건으로 고르는 값 형태입니다. 값만 받으므로 이름도 타입 토큰도 필요 없고, 결과
타입은 분기에서 추론합니다. 인자 모양은 분기가 두 개인 것과 N개인 것 두 가지이며, N개일 때는
조건이 참인 첫 분기를 고릅니다.

```ts
// two arms
const dir = when(
  segLen.lt(1e-6),
  () => vec2(1, 0),
  () => segVec.div(segLen),
)

// N arms: an array of [condition, () => value] pairs, then the else value
const clip = when(
  [
    [projParams.x.lt(0.5), () => transformMat4(mvp, vec4(rel2d, 0, 1))],
    [projParams.x.lt(6.5), () => transformMat4(mvp, vec4(relG, 0, 1))],
  ],
  () => transformMat4(mvp, vec4(ecefRtc, 1)),
)
```

`when`은 내부에서 변수와 if 체인을 선언하고 결과 노드를 돌려주므로, 생성되는 코드는 손으로
`var v; if (…) v = …`라고 쓴 것과 같습니다. 각 분기는 나중에 호출되는 함수이므로 값도 그
분기 안에서 만듭니다. 분기 안에 쓴 `Let`은 그 분기에 들어가고, GPU는 실제로 택한 분기만
실행합니다. `select(cond, a, b)`는 두 분기를 모두 계산한 뒤 하나를 고르는 즉시 평가 방식이라,
계산이 가벼운 값 한 쌍에 어울립니다. 조건이나 범위로 디스패치할 때는 `when`을, 정수 판별값
하나로 디스패치할 때는 `Switch`나 `matchExpr`을 씁니다.

### reduce로 루프 값 누적하기

누산기(accumulator)는 루프의 한 반복에서 다음 반복으로 넘겨 가며 갱신하는 값입니다.
`reduce`는 이 누산기를 대신 관리합니다. 누산기 초깃값을 먼저 받고, 이어서 루프의 카운터
초깃값과 조건, 본문, 증가값(선택 사항)을 받습니다. 본문은 다음 누산기를 반환하고, `reduce`는
마지막 누산기를 돌려주므로 루프가 끝난 뒤 그 값을 쓸 수 있습니다.

```ts
const best = reduce(
  f32(1e10),
  u32(0),
  (i) => i.le(STEPS),
  (acc, i) => {
    const q = bezierPoint(i)
    return min(acc, length(p.sub(q)))
  },
  u32(1),
)
```

`reduce`는 내부에서 변수와 루프, 대입을 선언하므로, `Var`와 `Loop`, `assign`을 직접 조합해 쓴
것과 같은 코드를 생성합니다.

### enumU32로 빠짐없는 디스패치

`enumU32`는 이름과 값의 매핑으로 `u32` enum을 선언하고, `matchEnum`은 그 enum을 멤버마다 분기
하나씩 두고 디스패치합니다. 분기 객체는 멤버 전체를 빠짐없이 다뤄야 합니다. 멤버 하나를
빠뜨리거나 멤버에 없는 키를 넣으면 `tsc`가 보고하므로, 멤버를 추가하면 그 멤버를 처리해야
하는 자리가 모두 드러납니다. 이 디스패치는 손으로 쓴 것과 같은 `matchExpr`로 하향
변환됩니다.

```ts
const Kind = enumU32({ Line: 0, Fill: 1, Stroke: 2 })

const color = matchEnum(seg.kind, Kind, {
  Line: () => lineColor,
  Fill: () => fillColor,
  Stroke: () => strokeColor, // drop an arm and it is a compile error
})
```

`Kind.members.Fill`은 비교에 쓸 수 있는 `Node<'u32'>` 리터럴이고, `Kind.values`에는 case
레이블이 쓰는 원래 정수 값이 들어 있습니다. case 집합이 닫혀 있다면 그냥 `Switch` 대신
`matchEnum`을 씁니다. 빠뜨린 case는 컴파일 오류이므로 픽셀까지 가지 않습니다.

### 조기 반환

제어 흐름 본문 안에 쓴 TypeScript의 `return value`는 조기 종료가 아닙니다. 조기 종료로
취급하면 아무 표시 없이 다음으로 흘러가는 코드처럼 읽히기 때문입니다. 조기 종료는
`Return(value)`로 쓰고, 가드 절이 필요하면 `ReturnIf(cond, value)`를 씁니다.
`ReturnIf(cond, value)`는 `If(cond, () => Return(value))`와 같은 코드를 생성합니다.

```ts
If(winding.ne(0), () => {
  Return(f32(1).sub(min_dist))
})
Return(f32(1).add(min_dist))
```

같은 가드 절을 한 줄로 쓰면 이렇게 됩니다.

```ts
ReturnIf(winding.ne(0), f32(1).sub(min_dist))
Return(f32(1).add(min_dist))
```

`fn` 본문 마지막의 `return value`는 TypeScript 문장 그대로이고 타입 검사도 그대로 받으므로,
이 마지막 반환에는 손댈 것이 없습니다. `Return`과 `ReturnIf`는 `If`나 `Loop`, `Switch`
안에서 빠져나갈 때 씁니다. `diagnose`가 실행하는 단일 종료 규칙은 함수가 마지막 문장으로
반환문 하나만 갖기를 요구합니다. 조기 종료가 의도한 것임을 알리려면 `fn`의 마지막 인자로
`{ allowEarlyReturn: true }`를 넘기며, 그러면 이 규칙은 더 이상 이를 보고하지 않습니다.
