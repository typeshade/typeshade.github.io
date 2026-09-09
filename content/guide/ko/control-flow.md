---
id: control-flow
source: 21c20dbdc2bc14fb203024393023a0f3b46bc57e5d80b014b7b1dc8c126158ee
sourceLine: 680
---

이 절을 읽고 나면 셰이더 본문 안에서 분기하고 반복하고 디스패치할 수 있고, 문 형태와 값
형태를 구분할 수 있습니다. 문 형태는 `If`와 `Loop`처럼 작성 중인 본문에 코드를 쌓아 올릴
뿐, 바인딩할 수 있는 값을 돌려주지 않습니다. 값 형태는 `when`과 `matchEnum`처럼 내부에서
같은 분기를 만들어 내고, 그 결과를 `const`에 바인딩할 수 있는 노드로 돌려줍니다. 분기가
값을 고르기 위해 있다면 값 형태를 쓰고, 무언가를 하기 위해 있다면 문 형태를 씁니다.

### If, elif, else

`If(cond, body)`는 `bool` 노드 하나와 인자를 받지 않는 클로저 하나를 받습니다. 본문은 가장
안쪽에 있는 열린 스코프에 곧바로 코드를 작성하므로, 따로 전달해야 할 빌더 객체가 없습니다.
결과에 `.elif(cond, body)`와 `.else(body)`를 이어서 씁니다.

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

이 셋은 모두 문입니다. 본문이 네이티브 `return value`로 끝나더라도 그 값이 체인이 만들어
내는 값으로 읽히지는 않습니다. 분기 안에서 함수를 빠져나가려면 `Return`이나 `ReturnIf`를
쓰며, 이 둘은 이 절의 끝에서 다룹니다.

### Loop

`Loop`는 C 스타일의 for문입니다. 카운터의 초깃값과 조건, 본문을 받고, 기본값이 `+1`인
증가값을 선택적으로 받습니다. 맨 앞에 이름 문자열을 선택적으로 넘기면 생성되는 소스에서
카운터 이름으로 쓰입니다.

```ts
Loop(
  u32(0),
  (i) => i.lt(u32(64)), // the condition receives the counter…
  (i) => {
    // …and so does the body, so declare (i) here too
    acc.assign(acc.add(toF32(i)))
  },
)
```

두 콜백 모두 카운터를 인자로 받습니다. `() => {}`처럼만 써 놓고 본문에서 `i`를 언급하는
것은 JavaScript 클로저 문법으로는 문제가 없지만, 그 자리에서 `i`는 정의되어 있지 않습니다.
`tsc`는 작성한 줄에서 `Cannot find name 'i'`라는 오류를 보고합니다. 카운터는 변경 가능한
노드로 전달되므로, 본문 안에서 카운터에 값을 대입해도 됩니다.

본문을 만드는 도중 오류가 발생하면 그 오류가 어느 본문에서 나왔는지 함께 담기므로, 메시지는
함수 이름과 본문 종류로 시작합니다. 예를 들어 `in Loop body`처럼 나타납니다.

### Break, continue, discard

작업을 도중에 끝내는 종료자는 세 가지입니다. `Break()`는 가장 가까운 바깥쪽 루프, 또는
현재 switch의 case를 빠져나갑니다. `Continue()`는 가장 가까운 바깥쪽 루프의 다음 반복으로
건너뜁니다. `Discard()`는 색이나 깊이를 기록하지 않고 현재 프래그먼트 호출을 끝내며,
프래그먼트 스테이지에서만 씁니다. 루프 안에 중첩된 `If`나 `Switch` 본문은 그 자체로 루프의
경계가 되지 않으므로, 이러한 조건문 안의 `Break()`도 그 조건문을 감싸는 루프를 대상으로
삼습니다.

```ts
const dists = Var('dists', arrayT(f32T, 64))

Loop(u32(0), (i) => i.lt(count), (i) => {
  const d = Let(dists.at(i, f32T))
  If(d.lt(0), () => Continue()) // no distance recorded, next iteration
  If(d.lt(0.001), () => Break()) // close enough, leave the loop
  nearest.assign(min(nearest, d))
})

If(alpha.lt(0.01), () => {
  Discard()
})
```

### Switch

`Switch(scrut)`는 정수 값 하나, 즉 판별값을 기준으로 디스패치합니다. 이 판별값은 `i32`
또는 `u32` 노드입니다. `.case(n, body)`는 case 레이블을 추가하고, `.default(body)`는
선택적인 default 분기를 추가하면서 체인을 닫습니다. 두 타깃 모두에서 실제 `switch`문으로
하향 변환됩니다.

`Switch`는 문이므로, 값을 고르는 switch라면 변수를 먼저 선언해 두고 각 분기에서 그 변수에
대입합니다.

```ts
const radiusPx = Var(rawRadius)
Switch(sizeMode)
  .case(1, () => radiusPx.assign(rawRadius.div(viewport.z)))
  .case(2, () => radiusPx.assign(rawRadius.mul(dpr)))
  .default(() => {}) // the default arm may be empty, and it terminates the chain
```

같은 디스패치의 값 형태는 `matchExpr(scrutinee, cases, default)`이며, 결과를 노드로
돌려줍니다. 분기는 `[caseValue, value]` 쌍이고, default는 어떤 case와도 일치하지 않을 때
쓰는 값입니다.

### when으로 값 고르기

`when`은 조건 쪽 값 형태입니다. 값만 받으며, 이름도 타입 토큰도 필요 없고 결과 타입은
분기에서 추론됩니다. 인자 형태는 두 가지로, 분기가 두 개인 형태와 분기가 N개인 형태가
있으며, 조건이 참인 첫 번째 분기가 선택됩니다.

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

`when`은 내부에서 변수와 if 체인을 직접 선언하고 결과 노드를 돌려주므로, 생성되는 코드는
손으로 쓴 `var v; if (…) v = …`와 같습니다. 각 분기는 지연 실행되는 함수이므로, 그 값은
해당 분기 안에서 만들어집니다. 분기 안에 쓴 `Let`은 그 분기 안에 그대로 들어가고, GPU는
실제로 선택된 분기만 실행합니다. `select(cond, a, b)`는 즉시 평가되는 양자택일 방식으로,
두 분기를 모두 평가한 뒤 하나를 고르므로 계산이 가벼운 값 한 쌍에 어울립니다. 조건이나
범위로 디스패치할 때는 `when`을 쓰고, 정수 판별값 하나로 디스패치할 때는 `Switch`나
`matchExpr`을 씁니다.

### reduce로 루프 값 누적하기

누산기란 루프의 한 반복에서 다음 반복으로 이어서 들고 가는 값을 말합니다. `reduce`는 이
누산기를 대신 관리해 줍니다. 누산기의 초깃값을 받은 뒤, 루프의 초기 카운터와 조건, 본문,
선택적인 증가값을 차례로 받습니다. 본문은 다음 누산기를 반환하고, `reduce`는 루프가 끝난
뒤 쓸 수 있도록 마지막 누산기를 돌려줍니다.

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

`reduce`는 내부에서 변수와 루프, 대입을 직접 선언하므로, 이는 `Var`와 `Loop`, `assign`을
손수 조합해서 쓴 것과 같은 코드를 생성합니다.

### enumU32로 빠짐없는 디스패치

`enumU32`는 이름과 값을 매핑해 `u32` enum을 선언하고, `matchEnum`은 멤버마다 분기
하나씩을 두고 이를 디스패치합니다. 분기 객체는 멤버 전체를 빠짐없이 다뤄야 합니다. 하나라도
빠뜨리거나 멤버에 없는 키를 추가하면 `tsc`가 이를 보고하므로, 멤버를 추가할 때마다 그
멤버를 처리해야 하는 자리가 모두 드러납니다. 이 디스패치는 손으로 쓴 형태가 만들어 내는
것과 같은 `matchExpr`로 하향 변환됩니다.

```ts
const Kind = enumU32({ Line: 0, Fill: 1, Stroke: 2 })

const color = matchEnum(seg.kind, Kind, {
  Line: () => lineColor,
  Fill: () => fillColor,
  Stroke: () => strokeColor, // drop an arm and it is a compile error
})
```

`Kind.members.Fill`은 비교에 쓸 수 있는 `Node<'u32'>` 리터럴이고, `Kind.values`에는 case
레이블에 쓰이는 원래 정수 값이 담겨 있습니다. case 집합이 닫혀 있다면 맨몸 `Switch` 대신
`matchEnum`을 우선해서 씁니다. 빠뜨린 case는 컴파일 오류가 되므로, 그 실수는 픽셀까지
이어지지 않습니다.

### 조기 반환

제어 흐름 본문 안에서 네이티브 `return value`는 조기 종료로 취급되지 않습니다. 그렇게
다루면 조용히 흘러 넘어가는 코드처럼 읽히기 때문입니다. 조기 종료는 `Return(value)`로
작성하고, 가드 절이 필요하면 `ReturnIf(cond, value)`를 씁니다. `ReturnIf(cond, value)`는
`If(cond, () => Return(value))`가 생성하는 코드를 그대로 생성합니다.

```ts
If(winding.ne(0), () => {
  Return(f32(1).sub(min_dist))
})
Return(f32(1).add(min_dist))
```

같은 가드 절을 한 줄로 쓰면 다음과 같습니다.

```ts
ReturnIf(winding.ne(0), f32(1).sub(min_dist))
Return(f32(1).add(min_dist))
```

`fn` 본문의 마지막 `return value`는 네이티브 TypeScript이며 그대로 타입 검사를 받으므로,
이 마지막 반환에는 손댈 것이 없습니다. `Return`과 `ReturnIf`는 `If`나 `Loop`, `Switch`
안에서 빠져나갈 때 씁니다. `diagnose`가 실행하는 단일 종료 규칙은 함수가 마지막 문장으로
반환문 하나만 갖기를 요구합니다. 조기 종료가 의도한 것임을 알리려면 `fn`의 마지막 인자로
`{ allowEarlyReturn: true }`를 넘기며, 그러면 이 규칙은 더 이상 이를 보고하지 않습니다.
</content>
</invoke>
