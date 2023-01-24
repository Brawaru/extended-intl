import path from 'path'
import { defineBuildConfig } from 'unbuild'
import { babel } from '@rollup/plugin-babel'
import chalk from 'chalk'
import { generateLocaleData } from './jobs/localeDataGen'

export default defineBuildConfig({
  entries: [
    {
      input: './src/index',
      name: 'index',
      builder: 'rollup',
      declaration: true,
      outDir: './dist',
    },
  ],
  hooks: {
    'build:prepare'(ctx) {
      ctx.options.declaration = ctx.options.entries.some(
        (entry) => entry.declaration,
      )
    },
    'rollup:options'(_ctx, options) {
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
    'rollup:done'(ctx) {
      // eslint-disable-next-line no-console
      console.info(`${chalk.yellow('↯')} Generating locale data...`)

      const outDir = path.join(process.cwd(), 'dist', 'locale-data')

      const writtenFiles = generateLocaleData({ outDir })

      ctx.buildEntries.push({
        path: outDir,
        bytes: writtenFiles.reduce((total, emit) => total + emit[1], 0),
      })
    },
  },
})
