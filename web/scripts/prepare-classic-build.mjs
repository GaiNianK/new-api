import fs from 'node:fs'
import path from 'node:path'

const webDir = path.resolve(import.meta.dirname, '..')
const classicDir = path.join(webDir, 'classic')
const rootPackage = JSON.parse(fs.readFileSync(path.join(webDir, 'package.json'), 'utf8'))
const classicPath = path.join(classicDir, 'package.json')
const classicPackage = JSON.parse(fs.readFileSync(classicPath, 'utf8'))
const catalogFallbacks = {
  '@lobehub/icons': '^5.10.1',
  axios: '^1.18.1',
  clsx: '^2.1.1',
  dayjs: '^1.11.21',
  'qrcode.react': '^4.2.0',
  react: '^19.2.7',
  'react-dom': '^19.2.7',
  'react-icons': '^5.7.0',
  'react-markdown': '^10.1.0',
  'remark-gfm': '^4.0.1',
  'sse.js': '^2.8.0',
  '@rsbuild/core': '^2.1.4',
  '@rsbuild/plugin-react': '^2.1.0',
  prettier: '^3.6.2',
}

for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
  for (const [name, version] of Object.entries(classicPackage[section] ?? {})) {
    if (version !== 'catalog:') continue
    const resolved = rootPackage.dependencies?.[name] ?? rootPackage.devDependencies?.[name] ?? catalogFallbacks[name]
    if (!resolved) throw new Error('Missing catalog dependency: ' + name)
    classicPackage[section][name] = resolved
  }
}

fs.writeFileSync(classicPath, JSON.stringify(classicPackage, null, 2) + '\n')
