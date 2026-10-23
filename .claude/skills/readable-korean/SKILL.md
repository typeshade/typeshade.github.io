---
name: readable-korean
description: Write and review readable Korean technical documentation, translations, headings, and UI copy. Use for requests about translationese, unnatural Korean, obscure terminology, excessive translation, word choice, or Wikipedia-like tone. Prefer neutral explanatory prose, familiar terms, and English where it makes a technical explanation clearer.
---

# Readable Korean technical writing

## Outcome

Write text a Korean reader can understand on the first reading. Use Korean Wikipedia as a
reference for neutral, factual explanations and ordinary word choice. This is a writing style,
not a request to reproduce Wikipedia's article structure or editorial policies.

Apply this skill when drafting or reviewing Korean technical prose, translating an explanation,
choosing a heading, or correcting awkward wording. Read the surrounding paragraph and the
reader's task before changing a phrase. Preserve the technical meaning.

For this repository, this skill governs Korean word choice and register. The site maintenance
skill still governs localization storage, source parity, layout and verification. The owner's
current wording preferences take precedence over earlier style conventions.

## Register and tone

- Use neutral explanatory endings such as `~이다`, `~한다`, `~된다`, and `~있다` in published
  explanations. This is written explanatory Korean, not conversational banmal addressed to a reader.
- State the definition or main fact first. Then explain the mechanism, example and limitation.
- Give each paragraph one subject. Split a sentence when its conditions or modifiers hide the main point.
- Prefer direct statements with a clear subject. Use a passive construction when the actor is
  unknown or irrelevant; do not replace every passive mechanically.
- Avoid praise, persuasion, rhetorical questions, teacher-like prompts, exaggerated emphasis
  and assurances such as "쉽게 이해할 수 있다" without an actual explanation.
- Avoid ceremonial words such as `해당`, `상기`, `본 기능`, and `수행되어진다` when a plain noun
  or verb works. Judge the sentence in context, not through an absolute word blacklist.
- Do not vary endings merely to meet a count. Repeated `~한다` can be appropriate. Improve a
  monotonous paragraph by changing its structure or removing repetition.
- Keep the register consistent within a passage. Existing polite copy can be revised when that
  passage is edited; this skill alone does not request a site-wide rewrite.
- Procedures use short action steps, for example `파일을 연다.` and `설정을 저장한다.` UI labels
  use familiar nouns or action labels. Error messages state the problem and a useful next action.
- The assistant's conversation can remain professional, polite Korean. This skill's default
  explanatory register applies to the published content being written.

## Terminology and English

Choose the term readers actually encounter. Prefer these options in order of usefulness,
not by a requirement to translate every token:

1. A familiar Korean term, such as `셰이더`, `컴파일`, `버퍼`, or `배열`.
2. The established English name when translating it obscures the meaning or disconnects it
   from APIs, standards, tools, documentation or searches.
3. A short Korean explanation alongside the English term when the concept is unfamiliar.

Keep identifiers, API names, language names, option values and error codes exact. Do not add
code formatting to ordinary English prose merely because it is English. Preserve the code
spans required by the source and the repository's translation parity checks.

English terms, phrases, or technical explanations may remain English when that is clearer.
Give enough Korean context for the intended reader to follow. An exact English quotation
keeps its wording and attribution. Distinguish a deliberate English passage from a missing
translation; do not use this permission to leave an inaccessible page unexplained.

Do not invent a Korean term, transliteration or abbreviation just to remove English. Do not
replace a familiar Korean term with English to sound technical. A bilingual gloss is useful
at first mention when it explains something; it need not appear on every occurrence.

Consult nearby usage, the project glossary and authoritative developer documentation. Treat
the glossary as a consistency aid. If a prescribed rendering is awkward or inaccurate,
review its context and update the relevant entry with the wording decision. Do not claim a
term is common or standard without evidence when that claim matters.

## Headings and labels

Name the content of the section with a short, natural heading. Use the topic when it gives
more information than a generic label. A real reader question can be a heading when it is
how that audience asks; do not translate English question syntax mechanically.

| Awkward in this context | Preferred wording | Use |
| --- | --- | --- |
| 언제 쓰는가 | 활용 | A section about uses |
| 계산과 판단 예 | 예제 | A worked example or decision example |
| 실무에서 확인할 점 | 주의사항 | Limits and caveats |
| 움직이며 이해하기 | 함수 그래프 | A graph of the function |
| 입력과 한계 | 입력 범위와 주의사항 | Inputs and constraints |
| 예제의 계산 과정 | 계산 과정 | The calculation shown in an example |

These are contextual examples, not global find-and-replace rules. Preserve existing heading
IDs and links when changing the visible label.

## Sentence examples

| Translationese or inflated wording | Clearer wording |
| --- | --- |
| 이 기능을 통해 값을 생성하는 것이 가능하다. | 이 기능은 값을 생성한다. |
| 해당 설정은 정밀도의 향상을 제공한다. | 이 설정은 기본 정밀도를 지정한다. |
| GPU는 많은 수의 연산을 가지고 있다. | GPU는 여러 연산을 병렬로 처리한다. |
| 기본 정밀도는 모든 변수를 highp로 만든다. | 기본 정밀도는 해당 범위에서 정밀도를 따로 지정하지 않은 선언에 적용된다. |

The second and fourth examples require checking the API or language specification. A fluent
sentence can still be wrong. Do not assert a broader guarantee than the source supports.

For an unfamiliar term, prefer an explanation such as `workgroup은 함께 실행되도록 묶인
셰이더 인보케이션의 단위이다.` over a newly coined translation. Whether `워크그룹` or
`workgroup` reads better depends on the audience and established usage in the document.

## Workflow

1. Identify the reader, the question and the facts the passage must convey.
2. Read the surrounding text and the technical source. Separate definitions, operations and limits.
3. Rewrite the meaning in natural Korean. Keep code, numbers, qualifiers and support conditions accurate.
4. Choose terminology by actual usage. Keep English when it improves recognition or accuracy.
5. Remove translationese, repeated claims and unnecessary modifiers. Check that a pronoun has a clear referent.
6. Read the result as a Korean document, without comparing sentence order with English.
7. Compare it with the source for lost conditions, changed certainty, omissions and added claims.
8. Review headings, tables, controls and mobile line breaks in their actual context.
9. Run the relevant repository checks. Explain and resolve a false positive through the proper
   configuration or rule; do not distort prose or weaken factual parity merely to satisfy a heuristic.

## Review checklist

- Can a reader identify the subject and main claim on the first reading?
- Is the term familiar to the audience, or briefly explained where introduced?
- Did a forced translation make an English term harder to recognize?
- Does the passage use a neutral, consistent explanatory register?
- Does the heading name the content rather than talk at the reader?
- Are conditions, exceptions, argument order, units and guarantees preserved?
- Did a rewrite imply an unmeasured performance benefit or unsupported behavior?
- Are UI labels concise and understandable at the actual viewport width?
- Are links and fragment IDs still valid after a heading change?

Present the revised text first when a rewrite is requested. Report unresolved ambiguity or a
material terminology decision briefly. A request to create this skill does not itself ask
for every existing page to be rewritten.
