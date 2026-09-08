---
id: quick-reference
source: 8c2ec98cc938a1808596a66dc2f27e93180b3d26090f9307a59effc6c0fcd58c
sourceLine: 1579
---

| 필요한 것                       | 쓰는 법                                                                                                     |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| 함수                            | [`fn`](./src/core/ir/builder.ts): 반환 타입은 추론됩니다                                                     |
| 진입점                          | `fn(name, { vid: builtin('vertex_index', u32T) }, body, { stage: 'vertex' })`                             |
| 모듈                            | `module({ consts, structs, bindings, funcs })`                                                            |
| 중간값                          | 평범한 `const x = expr`                                                                                    |
| 값 변경                         | `x.assign(v)` (자동으로 `var`로 구체화됩니다)                                                                |
| 연산 안의 리터럴                 | 벌거벗은 숫자: `x.add(1)`, `vec4(p, 0, 1)`                                                                  |
| 각도 ↔ 라디안 변환                | `radians(x)` / `degrees(x)`                                                                               |
| 분기(문장)                      | `If(c, …).elif(c, …).else(…)`                                                                             |
| 분기(값)                        | `when(c, ()=>a, ()=>b)` / `when([[c,()=>a]], ()=>b)` (예전 이름: `ifExpr`/`condExpr`)                       |
| 빠짐없는 정수 디스패치            | `enumU32({A:0,B:1})` + `matchEnum(s, E, { A:()=>…, B:()=>… })` (분기 하나라도 빠지면 컴파일 오류)              |
| 정수 디스패치                    | `Switch(s).case(n, …).default(…)`                                                                         |
| 반복으로 값 누적                 | `reduce(init, i0, cond, (acc,i)=>…, step)`                                                                |
| 조기 반환                       | `Return(v)` / `ReturnIf(c, v)`                                                                            |
| IO 구조체                       | `ioStruct(name, { f: builtin(...)/location(...) })` → `.of(n).f`, `.construct({…})`, `.type`, `.decl`     |
| 유니폼                          | `uniformStruct(name, at, fields)` → `.field.f`, `.struct`, `.binding`                                     |
| 스토리지 요소 구조체              | `structDecl(name, fields)` → `.of(n).f`, `.type`, `.decl`                                                 |
| 스토리지 버퍼                    | `storageBuffer(name, Element, at)` → `buf.at(i).f`                                                        |
| 텍스처 / 샘플러                  | `resource(name, type, at)` → `.node`, `.binding`                                                          |
| 공유 상수                       | 핸들(`PI`, `EARTH_R`)을 임포트하고, `constRef('NAME')`은 쓰지 않습니다                                        |
| 손으로 직접 쓴 raw 문            | `rawStmt({ wgsl, glsl })` / `b.raw(…)`: 타깃마다 그대로 출력됩니다. 한쪽이 빠지면 그 백엔드는 안전하게 차단하며 실패합니다 |
| 배정밀도                        | 값을 `f64T`로 선언합니다. 연산자는 그대로 쓰고, 변환에는 `toF64`/`toF32`를 씁니다. 자동 생성되는 `_fp64`에는 1.0을 넣습니다 |
| 스칼라가 아닌 상수                | `constExpr(name, type, valueNode)`: `vec4` / `arrayLit` / 구조체 리터럴                                     |
| 함수 호출                       | `FnHandle`을 임포트해서 직접 호출하고, `callFn('name')`은 쓰지 않습니다                                       |
| 모듈 진단                       | `diagnose(m, { backend })` → `formatReport(report)` (린트와 기능 게이트 검사, 예외를 던지지 않음)                    |
| GPU 확장/기능이 필요할 때         | `module({ enables: ['floatRenderTarget'] })`: 호스트가 `reflect().requiredFeatures`를 보고 활성화합니다      |
| 오류에 소스 위치 표시             | `setSourceTracing(true)` (개발용으로만 쓰고 기본은 꺼져 있으며, 생성 시점에는 절대 켜지 않습니다)               |
