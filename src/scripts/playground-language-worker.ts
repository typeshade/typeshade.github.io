// The Playground's language worker. It holds the one thing the page must not: the TypeShade
// front end and the TypeScript compiler it is built on, about a megabyte gzipped, which is
// what a language service costs and what a main thread cannot carry without stuttering on
// every keystroke.
//
// It owns one `createTypeshadeLanguageService` and answers the page's questions against it.
// An `update` stores the text and answers nothing; a query answers for the document at the
// version it names, and the reply carries that version back so the page can drop an answer
// about a document it no longer holds. Every method of the service is synchronous, so each
// message is one call and one reply, in order.
import { compile } from '../../vendor/shader-dsl/src/compiler/ts/compile.ts';
import {
  createTypeshadeLanguageService,
  type TypeshadeLanguageService,
} from '../../vendor/shader-dsl/src/language-service/index.ts';
import type { Analysis, LanguageReply, LanguageRequest } from './playground-language.ts';

let service: TypeshadeLanguageService | undefined;
/** The text of every open document, since the service keeps its own copy and does not hand
 *  it back, and an analysis compiles the text again for the module. */
const texts = new Map<string, string>();

const reply = (message: LanguageReply): void => {
  (self as unknown as Worker).postMessage(message);
};

/**
 * The diagnostics, and the module when they allow one. The service lowers the document once
 * for its diagnostics and keeps that analysis for hover, symbols and tokens, but it does not
 * expose the IR it built, so a clean document is compiled a second time here for the module
 * the page's panes and canvas are drawn from. That is one extra lowering per settled edit,
 * off the main thread, and never when an error means there is nothing to emit anyway.
 */
function analyse(languageService: TypeshadeLanguageService, uri: string): Analysis {
  const diagnostics = languageService.getDiagnostics(uri);
  const hasDirective = !diagnostics.some((diagnostic) => diagnostic.code === 'TS8001');
  const failed = diagnostics.some((diagnostic) => diagnostic.severity === 'error');
  if (failed || !hasDirective) return { diagnostics, hasDirective };
  const text = texts.get(uri);
  if (text === undefined) return { diagnostics, hasDirective };
  const result = compile(text);
  if (result.diagnostics.some((diagnostic) => diagnostic.category === 'error')) return { diagnostics, hasDirective };
  return { diagnostics, hasDirective, module: result.module };
}

self.addEventListener('message', (event: MessageEvent<LanguageRequest>) => {
  const request = event.data;
  try {
    service ??= createTypeshadeLanguageService();

    if (request.kind === 'update') {
      if (texts.has(request.uri)) service.updateDocument(request.uri, request.text, request.version);
      else service.openDocument(request.uri, request.text, request.version);
      texts.set(request.uri, request.text);
      return;
    }

    const { id, uri, version } = request;
    switch (request.kind) {
      case 'analysis':
        reply({ id, version, ok: true, result: analyse(service, uri) });
        return;
      case 'hover':
        reply({ id, version, ok: true, result: service.getHover(uri, request.position) });
        return;
      case 'completions':
        reply({ id, version, ok: true, result: service.getCompletions(uri, request.position) });
        return;
      case 'definition':
        reply({ id, version, ok: true, result: service.getDefinition(uri, request.position) });
        return;
      case 'references':
        reply({
          id,
          version,
          ok: true,
          result: service.getReferences(uri, request.position, { includeDeclaration: request.includeDeclaration }),
        });
        return;
      case 'symbols':
        reply({ id, version, ok: true, result: service.getDocumentSymbols(uri) });
        return;
      case 'signatureHelp':
        reply({ id, version, ok: true, result: service.getSignatureHelp(uri, request.position) });
        return;
      case 'prepareRename':
        reply({ id, version, ok: true, result: service.prepareRename(uri, request.position) });
        return;
      case 'rename':
        reply({ id, version, ok: true, result: service.rename(uri, request.position, request.newName) });
        return;
      case 'semanticTokens':
        reply({ id, version, ok: true, result: service.getSemanticTokens(uri) });
        return;
    }
  } catch (error) {
    if (request.kind === 'update') return;
    reply({
      id: request.id,
      version: request.version,
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
