# AI Models Performance Dashboard

🚀 **Живая демо-версия**: [Открыть сайт](https://your-username.github.io/cursor-benchmark/)

## 📊 О проекте

Интерактивный дашборд для сравнения производительности AI моделей в Cursor с автоматическим сбором данных из различных источников бенчмарков.

## ✨ Особенности

- **Сравнение моделей**: Красивая таблица с фильтрами и сортировкой для сравнения AI моделей
- **Статические данные**: 59+ моделей с полными техническими характеристиками
- **Множественные источники**: Данные из Aider, HumanEval, внутренних тестов Cursor
- **Пользовательские оценки**: Система рейтингов и отзывов от пользователей
- **Современный UI**: React + Next.js + Tailwind CSS
- **Статическая версия**: Полностью статический сайт для GitHub Pages

## 🎯 Метрики производительности

- Скорость ответа (response time)
- Качество кода (pass rate)
- Успешность выполнения задач (success rate)
- Пользовательские рейтинги (speed, quality, cost)
- Ценообразование (input/output pricing)

## 🛠 Технологии

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, Lucide Icons
- **Tables**: TanStack Table
- **Charts**: Recharts
- **Deployment**: GitHub Pages

## 🚀 Быстрый старт

### Локальная разработка с базой данных

```bash
# Клонирование репозитория
git clone https://github.com/your-username/cursor-benchmark.git
cd cursor-benchmark

# Установка зависимостей
npm install

# Настройка базы данных
npm run db:generate
npm run db:push

# Запуск в режиме разработки с БД
npm run dev
```

### Локальная разработка со статическими данными

```bash
# Запуск в режиме разработки со статическими данными
npm run dev:static
```

### Сборка статической версии

```bash
# Сборка для GitHub Pages
npm run build:static

# Статические файлы будут в папке ./out
```

### Режимы работы

Проект поддерживает два режима работы:

1. **Режим базы данных** (по умолчанию для разработки):
   - Использует SQLite + Prisma
   - Поддерживает API endpoints
   - Автоматическая синхронизация данных
   - Запуск: `npm run dev`

2. **Статический режим** (для GitHub Pages):
   - Использует предварительно экспортированные данные
   - Полностью статический сайт
   - Запуск: `npm run dev:static` или `npm run build:static`

## 📁 Структура проекта

```
cursor-benchmark/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Главная страница
│   │   └── layout.tsx         # Layout компонент
│   ├── components/            # React компоненты
│   │   ├── ModelsComparisonTable.tsx
│   │   ├── DashboardHeader.tsx
│   │   └── SyncStatus.tsx
│   └── lib/                  # Утилиты и сервисы
├── static-models-data.json   # Статические данные моделей
├── .github/workflows/        # GitHub Actions
└── out/                      # Собранная статическая версия
```

## 🎨 Визуальные индикаторы

- **🖱️ Синяя иконка Code** - модель доступна в Cursor IDE
- **🧠 Фиолетовая иконка Brain** - модель имеет reasoning способности
- **🤖 Зеленая иконка Bot** - модель имеет agent capabilities
- **🚀 Зеленая иконка** - отличное соотношение цена/качество
- **✅ Синяя иконка** - хорошее соотношение цена/качество
- **⚠️ Оранжевая иконка** - дорого или низкое качество

## 📊 Статистика

- **59 моделей** всего в базе данных
- **29 моделей** доступны в Cursor IDE
- **17 моделей** имеют reasoning способности
- **23 модели** имеют agent capabilities
- **3 модели** реально бесплатные (DeepSeek)
- **13 моделей** имеют реальные данные Aider Benchmark

## 🔄 Автоматическое развертывание

Проект автоматически собирается и развертывается на GitHub Pages при каждом push в main/master ветку.

## 🤝 Contributing

1. Fork проект
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Создайте Pull Request

## 📝 Лицензия

Этот проект распространяется под лицензией MIT.

## 🔮 Планы развития

- [ ] Интеграция с реальными API Cursor
- [ ] Расширенные графики и аналитика
- [ ] Экспорт данных в различные форматы
- [ ] API для внешних интеграций
- [ ] Мобильное приложение
- [ ] Поддержка дополнительных источников бенчмарков

## 📞 Контакты

- GitHub: [cursor-benchmark](https://github.com/your-username/cursor-benchmark)
- Live Demo: [GitHub Pages](https://your-username.github.io/cursor-benchmark/)

---

⭐ **Если проект понравился, поставьте звезду!**
