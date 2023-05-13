#!/usr/bin/env node

import { Command } from 'commander'
import pkg from '@react-json-templates/cli/package.json'
import { compile } from '@react-json-templates/compiler'
// import path from 'path'
import fs from 'fs/promises'
import { globSync } from 'glob'

const CWD = process.cwd()

const program = new Command()

program
  .name('rjt')
  .description('react-json-templates CLI')
  .version(pkg.version)

program
  .command('compile')
  .description('Compile rjt templates')
  .argument('<templates...>', 'templates to compile')
  .option('-e,--extension <extension>', 'extension of the generated files', 'ts')
  .option('-o,--out-dir', 'output directory', CWD)
  .action(async (paths: string[], { extension, outDir }: { extension: string, outDir: string }) => {
    const outputs = globSync(paths).map(item => ({
      filePath: item.replace(/\.rjt$/, `.${extension}`), // path.join(outDir, item.replace(CWD, '')),
      generated: compile({
        filePath: item,
        compilerConfig: {
          sourceType: 'module',
          plugins: ['typescript', 'jsx']
        }
      })
    }))

    await Promise.all(
      outputs.map(async item => { await fs.writeFile(item.filePath, item.generated) })
    )
  })

program.parse()
