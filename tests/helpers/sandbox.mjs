// Load the browser globals the site actually ships, unmodified.
//
// js/*.js are classic scripts that assign to globals (const X = (() => {...})()),
// and the project has no build step, so bundlers/test frameworks are off the table.
// vm gives us those same files with a minimal browser stub instead of a parallel
// copy of the logic that could drift from what ships.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { URL, URLSearchParams } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '../..');

const readJs = name => fs.readFileSync(path.join(ROOT, 'js', `${name}.js`), 'utf8');
export const readData = name => JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data', name), 'utf8')
);

export function makeContext({ search = '', languages = ['en-US'], storage = {} } = {}) {
  const store = new Map(Object.entries(storage));
  const documentStub = {
    documentElement: { lang: '' },
    getElementById: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
  };
  return vm.createContext({
    URL,
    URLSearchParams,
    console,
    Promise,
    fetch: async url => ({
      ok: true,
      json: async () => readData(path.basename(url).includes('rates') ? 'rates.json' : 'baseline.json'),
      text: async () => '',
    }),
    document: documentStub,
    navigator: { language: languages[0], languages },
    localStorage: {
      getItem: key => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: key => store.delete(key),
    },
    window: { location: { search } },
  });
}

/**
 * Run the given js/ modules in order inside one context, then return the named
 * globals. Top-level `const` in a vm script is a global lexical binding: it is
 * visible to later scripts in the same context but not a property of the object,
 * so we have to read it back with an expression evaluated in that context.
 *
 * `expose` names the globals to hand back (js/levels.js -> LevelsModule).
 */
export function loadModules(names, { expose = [], ...contextOptions } = {}) {
  const context = makeContext(contextOptions);
  for (const name of names) {
    vm.runInContext(readJs(name), context, { filename: `js/${name}.js` });
  }
  const wanted = expose.length ? expose : names.map(defaultGlobalName);
  const modules = vm.runInContext(
    `({ ${wanted.map(w => `${w}: typeof ${w} === 'undefined' ? null : ${w}`).join(', ')} })`,
    context
  );
  const missing = wanted.filter(w => modules[w] === null);
  if (missing.length) throw new Error(`Not defined by the loaded scripts: ${missing.join(', ')}`);
  return { context, ...modules };
}

function defaultGlobalName(file) {
  if (file === 'i18n') return 'I18n';
  return file.replace(/^\w/, c => c.toUpperCase()) + 'Module';
}
