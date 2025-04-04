// mindar.patch.js
import { readFileSync, writeFileSync } from 'fs'

const filePath = './node_modules/mind-ar/dist/mindar-image-three.prod.js'
const content = readFileSync(filePath, 'utf8')

const patchedContent = content.replace(/sRGBEncoding/g, 'SRGBColorSpace').replace(/LinearEncoding/g, 'LinearSRGBColorSpace')

writeFileSync(filePath, patchedContent)
