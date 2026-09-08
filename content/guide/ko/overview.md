---
id: overview
source: 550b106fec890c141527ffc08571eebb19cd8b91a493902963043db6f1283f1c
sourceLine: 1
---
# `@xgis/shader-dsl`로 셰이더 작성하기

이 문서는 `@xgis/shader-dsl`로 셰이더를 **작성하는** 방법을 다루는 개발자 가이드입니다. 이 DSL은
TSL 방식(three.js Shading Language)의 그래프입니다. TypeScript로 타입이 정해진 값 표현식과
명령형 문장을 작성하면, 하나의 중간 표현(IR)이 같은 소스에서 두 가지를 생성합니다. GPU에서 실행하는
**WGSL**과, CPU에서 같은 계산을 다시 수행해 기준값을 내는 **CPU 오라클**입니다.

최근 작업의 목표는 형식적인 절차를 없애는 것이었습니다. 이제는 WGSL 변수 이름, 반환 타입
토큰, `callFn('name', …)` 문자열, `.field('name', type)` 접근자, 리터럴을 감싸는 `f32()`
래퍼를 직접 손으로 작성하지 않아도 됩니다. 이 가이드는 이렇게 자리 잡은 작성 인터페이스를
다룹니다.

> **임포트 경로.** 패키지가 공개적으로 내보내는 배럴에서 가져와 작성합니다. 이 배럴은
> `core/**`의 작성과 생성 인터페이스 전체를 다시 내보냅니다. IR, 단일 진실 공급원(SoT) 레이아웃
> 선언자, WGSL/GLSL 백엔드, 린트 패스, CPU 오라클, `reflect()`가 여기에 포함됩니다:
>
> ```ts
> import { fn, module, vec4, If, Switch, when, emitModule, reflect, … } from '@xgis/shader-dsl'
> import { ioStruct, uniformStruct, structDecl, builtin, location, storageBuffer, resource } from '@xgis/shader-dsl'
> ```
>
> 애플리케이션의 셰이더 그래프는 이 패키지를 사용하는 프로젝트 안에 있으며, 다른 프로젝트와
> 마찬가지로 이 배럴을 통해 작성합니다. 이 패키지는 작성 인터페이스만 배포할 뿐, 프로젝트의
> 셰이더는 담지 않습니다. 패키지 내부에서는 IR은 `core/ir` 배럴에서, 레이아웃 헬퍼는
> `core/sot`에서 각각 다시 내보냅니다. 하위 파일은 절대 직접 가져오지 말고 항상 배럴을
> 거쳐야 합니다.
>
> **리플렉션.** `reflect(module)`은 파이프라인 메타데이터, 즉 바인드 그룹, std140/std430
> 구조체 바이트 레이아웃, 버텍스 속성, 진입점 시그니처를 타깃에 상관없는 객체로 복원합니다.
> std140/std430 오프셋 엔진은 `wgslLayout(struct, kind)`로 따로도 노출됩니다. 두 함수 모두
> IR을 읽기만 할 뿐 생성 경로에서는 실행되지 않습니다. `core/reflect.ts`를 참고하십시오.
