import { Command } from 'commander'
import pkg from './package.json'
import { compile } from '@react-json-templates/compiler'
// import path from 'path'
import fs from 'fs/promises'

const CWD = process.cwd()
const cache = {}

const program = new Command()

program
  .name('react-json-templates cli')
  .description('CLI to compile rjt templates')
  .version(pkg.version)

program.command('compile')
  .argument('<templates...>', 'templates to compile')
  .option('-o,--out-dir', 'output directory', CWD)
  .action(async (paths: string[], { outDir }: { outDir: string }) => {
    const outputs = paths
      .filter(item => item.endsWith('.rjt'))
      .map(item => ({
        filePath: item + '.tsx', // path.join(outDir, item.replace(CWD, '')),
        generated: compile({
          cache,
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
