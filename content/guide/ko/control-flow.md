---
id: control-flow
source: 1233b392e7e8d867e36d88c3412c51663412279e61dbebaa8002187df9ba35a7
sourceLine: 376
---

### `If / elif / else`: 문

```ts
If(pin.vis.lt(0), () => {
  Discard()
})

If(p.idx.eq(1), () => {
  pos.assign(vec2(3, -1))
})
  .elif(p.idx.eq(2), () => {
    pos.assign(vec2(-1, 3))
  })
  .else(() => {
    /* … */
  })
```

`If` / `elif` / `else`의 본문은 인자를 받지 않는 클로저 `() => …`이며, 가장 안쪽에 있는 활성
스코프에 곧바로 코드를 작성합니다(`Builder`를 따로 넘겨받지 않습니다). 이 본문은 문입니다.
값을 반환해서 그대로 흘려보내는 방식으로 쓰면 안 되며, 도중에 빠져나가려면 `Return()` /
`ReturnIf()`를 씁니다.

### `Loop`: C 스타일 for문

```ts
Loop(
  u32(0),
  (i) => i.lt(u32(64)), // cond receives the counter…
  (i) => {
    // …and so does the BODY — declare `(i)` here too (#837)
    acc.assign(acc.add(toF32(i)))
  },
)
```

[`Loop`](./src/core/ir/builder.ts)는 맨 앞에 선택적으로 이름 문자열을 받아 WGSL 카운터의
이름으로 삼으며, `step`의 기본값은 `+1`입니다. 콜백 두 개 모두 카운터를 인자로 받습니다.
`() => {}`처럼만 써 놓고 본문에서 `i`를 참조하면 JS 클로저 문법으로는 컴파일되지만 `i`는
스코프 안에 없습니다. `tsc`가 이를 잡아내고(`Cannot find name 'i'`), 트랜스파일만 하는
러너(vitest)는 빌드 시점에 `while building fn '…': in Loop body: i is not defined`로
드러냅니다(#843). `Continue()` / `Break()`가 루프의 종료 수단이며, 카운터는 변경 가능한
`Node`입니다(루프 변수를 다시 대입하는 것은 WGSL에서 허용되는 문법입니다).

### `Switch`: 문 디스패치

`If` 체인과 같은 모양으로 이어 쓰는 빌더입니다. 값을 디스패치하려면 `Var`를 미리 선언해 두고
각 case 분기에서 대입합니다. 명령형 코드에서 이미 익숙한 형태입니다.

```ts
const radiusPx = Var(rawRadius)
Switch(sizeMode)
  .case(1, () => radiusPx.assign(rawRadius.div(viewport.z)))
  .case(2, () => radiusPx.assign(…))
  .default(() => {})        // default is optional but terminates the chain
```

```ts
Switch(seg.kind)
  .case(0, () => {
    min_dist.assign(min(min_dist, dist_to_segment(uv, seg.p0, seg.p1)))
    winding.assign(winding.add(winding_line(uv, seg.p0, seg.p1)))
  })
  .case(1, () => { … })
  .default(() => {})
```

### 값 조합자: `when` / `reduce`

변경 대신 분기로 초기화한 값을 원한다면 값 조합자를 씁니다. 값 조합자는 값만 받습니다.
변수 이름도 타입 토큰도 필요 없으며, 타입은 분기에서 추론됩니다. `when`은 조건으로
디스패치하는 유일한 조합자이고(2분기와 N분기 모두 지원합니다), `Switch`/`matchExpr`
(판별값 기준)과 `select`(즉시 평가되는 2방향 선택)의 조건 쪽 짝입니다.

```ts
// 2-arm
const dir = when(
  segLen.lt(1e-6),
  () => vec2(1, 0),
  () => segVec.div(segLen),
)

// N-arm: array of [condition, () => value] arms, then the else value (first true wins)
const clip = when(
  [
    [projParams.x.lt(0.5), () => transformMat4(mvp, vec4(rel2d, 0, 1))],
    [projParams.x.lt(6.5), () => transformMat4(mvp, vec4(relG, 0, 1))],
  ],
  () => transformMat4(mvp, vec4(ecefRtc, 1)),
)

// loop fold — body RETURNS the next accumulator (no Var + assign at the call site)
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

`when`/`reduce`는 내부적으로 변수와 제어 흐름을 직접 만들어 내고 결과 `Node`를 반환하므로,
생성되는 코드는 손으로 쓴 `var v; if (…) v = …` 형태와 똑같습니다. 판별값 하나로 정리되지
않는 진짜 조건/범위 디스패치에는 `when`을 씁니다. 정수 판별값 디스패치에는 `Switch`/
`matchExpr`을 씁니다(`ifExpr`/`condExpr`은 `when`의 사용이 중단된 별칭입니다).

### `enumU32` / `matchEnum`: 빠짐없는 정수 디스패치

정수 케이스가 고정된 집합을 디스패치할 때는 `enumU32`를 선언하고 `matchEnum`을 씁니다.
분기 객체는 멤버 전체를 빠짐없이 다뤄야 합니다. 하나라도 빠뜨리거나 알 수 없는 키를
추가하면 `tsc` 컴파일 오류가 나므로, 멤버를 추가할 때마다 처리하지 않은 자리가 모두
드러납니다. 손으로 쓴 형태가 생성하는 것과 같은 `matchExpr`(switch)로 하향 변환되며,
바이트 단위까지 똑같습니다.

```ts
const Kind = enumU32({ Line: 0, Fill: 1, Stroke: 2 })

const color = matchEnum(seg.kind, Kind, {
  Line: () => lineColor,
  Fill: () => fillColor,
  Stroke: () => strokeColor, // drop an arm → compile error
})
// Kind.members.Fill is a Node<'u32'> literal; Kind.struct/values feed the case labels.
```

case 집합이 닫혀 있다면 맨몸 `Switch`/`matchExpr` 대신 `matchEnum`을 씁니다. case를
빠뜨리는 런타임·시각적 버그를 컴파일 오류로 바꿔 주기 때문입니다(디스패치판으로 보면,
`Let`에 `.assign`을 쓰는 함정이 타입 오류가 되는 것과 같은 이치입니다).

### 조기 반환: `Return` / `ReturnIf`

제어 흐름 본문에서는 네이티브 `return value`로 조기 종료를 표현하지 않습니다. 그렇게 쓰면
조용히 흘러 넘어가는 코드처럼 읽히기 때문입니다. 조기 반환은 명시적으로 드러내야 합니다.

```ts
Return(value) // return value;
ReturnIf(winding.ne(0), f32(1).sub(min_dist)) // if (winding != 0) { return …; }
```

`fn` 본문의 마지막 `return value`는 네이티브 TS입니다(본문의 종결 `return`). 이 마지막
반환은 문제없이 타입 검사를 받습니다. `Return()` / `ReturnIf()`는 `If` / `Loop` / `Switch`
안에서 조기에 빠져나갈 때 씁니다(조기 `Return`을 쓰는 `fn`은 `opts.allowEarlyReturn`이
있어야 합니다).

[`Loop`](./src/core/ir/builder.ts)는 C 스타일 for문이며, `Continue()` / `Break()` /
`Discard()`가 루프와 프래그먼트의 종료 수단입니다.
