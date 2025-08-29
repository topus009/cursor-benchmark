const fs = require('fs');
const path = require('path');

function addCursorIconsToHTML() {
  try {
    const htmlFilePath = path.join(__dirname, '..', 'cursor-models.html');
    let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

    // Заменяем текст "В Cursor" на иконку Cursor
    htmlContent = htmlContent.replace(
      /<div style="font-size: 10px; color: var\(--cursor-text-secondary\); opacity: 0\.7; margin-top: 2px;">В Cursor<\/div>/g,
      '<span class="codicon codicon-remote" style="font-size: 14px; opacity: 0.8; margin-left: 6px; color: #4f46e5;" title="Доступно в Cursor"></span>'
    );

    // Записываем обновленный файл
    fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');

    console.log('✅ Иконки Cursor успешно восстановлены!');
    console.log('📁 Файл обновлен: cursor-models.html');

  } catch (error) {
    console.error('❌ Ошибка при замене текста на иконки:', error);
  }
}

if (require.main === module) {
  console.log('🚀 Заменяем текст "В Cursor" на иконки...');
  addCursorIconsToHTML();
}
