const fs = require('fs');
const path = require('path');

async function updateHTMLData() {
    try {
        console.log('🔄 Обновление данных в HTML файле...\n');

        // Проверяем наличие файлов
        const jsonPath = path.join(__dirname, '..', 'static-models-data.json');
        const htmlPath = path.join(__dirname, '..', 'static-models-comparison.html');

        if (!fs.existsSync(jsonPath)) {
            console.error('❌ Файл static-models-data.json не найден!');
            return;
        }

        if (!fs.existsSync(htmlPath)) {
            console.error('❌ Файл static-models-comparison.html не найден!');
            return;
        }

        // Читаем данные из JSON
        console.log('📖 Читаем данные из JSON файла...');
        const jsonData = fs.readFileSync(jsonPath, 'utf8');
        const data = JSON.parse(jsonData);

        // Читаем HTML файл
        console.log('📖 Читаем HTML файл...');
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');

        // Заменяем данные в script теге
        const scriptTagPattern = /<script id="models-data" type="application\/json">\s*\{[\s\S]*?\}\s*<\/script>/;
        const newScriptTag = `<script id="models-data" type="application/json">
${JSON.stringify(data, null, 2)}
    </script>`;

        if (scriptTagPattern.test(htmlContent)) {
            htmlContent = htmlContent.replace(scriptTagPattern, newScriptTag);
            console.log('✅ Данные в HTML файле обновлены!');
        } else {
            console.log('⚠️ Script тег с данными не найден, добавляем новый...');
            // Ищем место для вставки (перед основным script)
            const insertPattern = /<\/style>\s*\n\s*(?=<!-- Data embedded)/;
            if (insertPattern.test(htmlContent)) {
                htmlContent = htmlContent.replace(insertPattern, '</style>\n\n    ' + newScriptTag + '\n\n    ');
            } else {
                console.error('❌ Не удалось найти место для вставки данных в HTML файл');
                return;
            }
        }

        // Сохраняем обновленный HTML файл
        fs.writeFileSync(htmlPath, htmlContent, 'utf8');

        console.log('💾 HTML файл обновлен!');
        console.log(`📊 Обновлено ${data.stats.total} моделей`);
        console.log(`📅 Дата экспорта: ${new Date(data.exportedAt).toLocaleString()}`);

    } catch (error) {
        console.error('❌ Ошибка при обновлении HTML файла:', error.message);
    }
}

// Функция для очистки данных из HTML (оставляет только структуру)
function cleanHTMLData() {
    try {
        console.log('🧹 Очистка данных из HTML файла...\n');

        const htmlPath = path.join(__dirname, '..', 'static-models-comparison.html');

        if (!fs.existsSync(htmlPath)) {
            console.error('❌ Файл static-models-comparison.html не найден!');
            return;
        }

        let htmlContent = fs.readFileSync(htmlPath, 'utf8');

        // Заменяем данные на пустой объект
        const emptyData = {
            models: [],
            providers: [],
            categories: [],
            stats: {
                total: 0,
                withCursor: 0,
                withReasoning: 0,
                withAgent: 0,
                free: 0,
                premium: 0
            },
            exportedAt: new Date().toISOString()
        };

        const scriptTagPattern = /<script id="models-data" type="application\/json">\s*\{[\s\S]*?\}\s*<\/script>/;
        const newScriptTag = `<script id="models-data" type="application/json">
${JSON.stringify(emptyData, null, 2)}
    </script>`;

        if (scriptTagPattern.test(htmlContent)) {
            htmlContent = htmlContent.replace(scriptTagPattern, newScriptTag);
            fs.writeFileSync(htmlPath, htmlContent, 'utf8');
            console.log('✅ Данные в HTML файле очищены!');
        } else {
            console.log('⚠️ Script тег с данными не найден');
        }

    } catch (error) {
        console.error('❌ Ошибка при очистке HTML файла:', error.message);
    }
}

// Основная логика
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.includes('--clean') || args.includes('-c')) {
        cleanHTMLData();
    } else {
        updateHTMLData();
    }
}

module.exports = { updateHTMLData, cleanHTMLData };
