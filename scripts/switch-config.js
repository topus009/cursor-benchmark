const fs = require('fs')
const path = require('path')

const configs = {
  local: 'next.config.local.ts',
  production: 'next.config.prod.ts'
}

const target = process.argv[2]

if (!target || !configs[target]) {
  console.log('❌ Использование: node scripts/switch-config.js [local|production]')
  console.log('   local      - для локального тестирования (без basePath)')
  console.log('   production - для GitHub Pages (с basePath)')
  process.exit(1)
}

const sourceFile = path.join(__dirname, '..', configs[target])
const targetFile = path.join(__dirname, '..', 'next.config.ts')

try {
  // Копируем нужную конфигурацию
  fs.copyFileSync(sourceFile, targetFile)
  console.log(`✅ Переключено на конфигурацию: ${target}`)
  console.log(`   ${configs[target]} → next.config.ts`)
} catch (error) {
  console.error('❌ Ошибка при переключении конфигурации:', error.message)
  process.exit(1)
}
