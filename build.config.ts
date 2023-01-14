import { defineBuildConfig } from 'unbuild'
import { babel } from '@rollup/plugin-babel'

/** A map of CJS file imports that have ESM alternatives. */
const esmReplaces: Record<string, string> = {
  '@formatjs/intl-numberformat/src/get_internal_slots.js':
    '@formatjs/intl-numberformat/lib/src/get_internal_slots.js',
  '@formatjs/intl/src/number.js': '@formatjs/intl/lib/src/number.js',
  '@formatjs/intl-numberformat/src/core.js':
    '@formatjs/intl-numberformat/lib/src/core.js',
  '@formatjs/intl-numberformat/src/to_locale_string.js':
    '@formatjs/intl-numberformat/lib/src/to_locale_string.js',
}

export default defineBuildConfig({
  hooks: {
    'rollup:options'(_ctx, options) {
      let outputs = Array.isArray(options.output)
        ? options.output
        : options.output == null
        ? []
        : [options.output]

      for (const output of outputs) {
        if (output.format === 'esm') {
          if (!Array.isArray(output.plugins)) {
            if (output.plugins != null && typeof output.plugins !== 'boolean') {
              output.plugins = [output.plugins]
            } else {
              output.plugins = []
            }

            output.plugins.push({
              name: 'Patch up ESM imports', // NOTE: I hate CJS/ESM :D
              renderChunk(code, _chunk, _options) {
                let newCode = code
                for (const [search, replacement] of Object.entries(
                  esmReplaces,
                )) {
                  newCode = newCode.replace(search, replacement)
                }
                return newCode
              },
            })
          }
        }
      }

      if (!Array.isArray(options.plugins)) {
        if (options.plugins != null && typeof options.plugins !== 'boolean') {
          options.plugins = [options.plugins]
        } else {
          options.plugins = []
        }
      }

      for (let i = 0, l = options.plugins.length; i < l; i++) {
        const plugin = options.plugins[i]
        if (typeof plugin === 'object' && plugin != null) {
          if (!Array.isArray(plugin) && !('then' in plugin)) {
            if (plugin.name === 'esbuild') {
              options.plugins[i] = babel({
                babelHelpers: 'bundled',
                extensions: ['.ts', '.js', '.cjs', '.mjs', '.es', '.es6'],
                comments: false,
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      loose: true,
                      targets: 'defaults, node >= 16.0',
                    },
                  ],
                  '@babel/preset-typescript',
                ],
                plugins: ['@babel/plugin-proposal-nullish-coalescing-operator'],
              })
            }
          }
        }
      }
    },
  },
})
