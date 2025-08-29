const fs = require('fs');
const path = require('path');

function removeCursorIcons() {
  try {
    const htmlFilePath = path.join(__dirname, '..', 'cursor-models.html');
    let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

    // Заменяем все иконки Cursor на текст "В Cursor"
    htmlContent = htmlContent.replace(
      /<span class="codicon codicon-remote" style="font-size: 12px; opacity: 0.6; margin-left: 4px; color: #4f46e5;" title="Доступно в Cursor"><\/span>/g,
      '<div style="font-size: 10px; color: var(--cursor-text-secondary); opacity: 0.7; margin-top: 2px;">В Cursor</div>'
    );

    // Записываем обновленный файл
    fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');

    console.log('✅ Иконки Cursor заменены на текст "В Cursor"!');
    console.log('📁 Файл обновлен: cursor-models.html');

  } catch (error) {
    console.error('❌ Ошибка при замене иконок:', error);
  }
}

if (require.main === module) {
  console.log('🚀 Заменяем иконки Cursor на текст...');
  removeCursorIcons();
}
