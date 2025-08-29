# AI Models Performance Dashboard

Дашборд для сравнения производительности AI моделей в Cursor с автоматическим сбором данных из различных источников бенчмарков.

## 🚀 Особенности

- **Сравнение моделей**: Красивая таблица с фильтрами и сортировкой для сравнения AI моделей
- **Автоматический сбор данных**: Синхронизация данных из официальных источников и бенчмарков
- **Множественные источники**: Поддержка данных из Aider, HumanEval, внутренних тестов Cursor
- **Пользовательские оценки**: Система рейтингов и отзывов от пользователей
- **Автообновление**: Планировщик с cron jobs для регулярной синхронизации
- **Современный UI**: React + Next.js + Tailwind CSS

## 📊 Метрики производительности

- Скорость ответа (response time)
- Качество кода (pass rate)
- Успешность выполнения задач (success rate)
- Пользовательские рейтинги (speed, quality, cost)
- Ценообразование (input/output pricing)

## 🛠 Технологии

- **Frontend**: Next.js 15, React 18, TypeScript
- **UI**: Tailwind CSS, Lucide Icons
- **Database**: SQLite + Prisma ORM
- **Tables**: TanStack Table
- **Charts**: Recharts
- **Scheduling**: Node-cron

## 🚀 Быстрый старт

### 1. Клонирование и установка

```bash
git clone <repository-url>
cd cursor-benchmark
npm install
```

### 2. Настройка базы данных

```bash
# Генерация Prisma клиента
npm run db:generate

# Создание и применение миграций
npm run db:push

# Запуск админки Prisma Studio
npm run db:studio
```

### 3. Запуск сервера разработки

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

### 4. Импорт моделей из Cursor

Проект включает автоматизированный парсер для импорта моделей из Cursor:

```bash
# Парсинг и импорт моделей из HTML файла
npm run parse:models

# Проверка импортированных моделей
npm run check:models
```

Парсер автоматически:
- 📄 Парсит HTML файл `cursor-models.html`
- 🔍 Определяет провайдера каждой модели (OpenAI, Anthropic, Google и т.д.)
- ⭐ Корректно определяет бесплатные модели (только те, что реально бесплатны в интернете)
- 💰 Отмечает премиум модели (MAX Only)
- 📊 Классифицирует модели по категориям (coding, chat, reasoning)
- 🖱️ **Только модели из HTML файла помечаются как доступные в Cursor IDE**
- 🧠 **Распознает модели с reasoning способностями** по наличию класса `codicon-brain` в HTML
- 💾 Сохраняет все данные в базу данных с правильными флагами

### Дополнительные команды:
```bash
# Восстановление иконок Cursor рядом с названиями моделей
npm run restore:cursor-icons

# Замена иконок Cursor на текст "В Cursor"
npm run remove:cursor-icons

# Добавление тестовых данных для демонстрации сортировки
npm run add:test-data

# Анализ моделей с неполными данными
npm run analyze:missing

# Заполнение базы данных известными данными
npm run fill:known-data

# Обновление Aider benchmarks данными с официального сайта
npm run update:aider

# Обновление Agent Capabilities для моделей
npm run update:agents
```

### 🎨 Визуальные индикаторы в интерфейсе:

- **🖱️ Синяя иконка Code** - модель доступна в Cursor IDE
- **🧠 Фиолетовая иконка Brain** - модель имеет reasoning способности
- **🤖 Зеленая иконка Bot** - модель имеет agent capabilities
- **Модели могут иметь несколько иконок одновременно**

### 🔄 Сортировка данных:

Таблица поддерживает сортировку по всем колонкам:
- **Performance** - комплексная оценка производительности (рейтинг + качество кода + скорость)
- **Pricing** - цена за токен (бесплатные модели отображаются первыми, ограничено до 4 знаков после запятой)
- **Aider Benchmark** - результаты бенчмарка Aider (лучшие модели сверху, без данных - в конец)
- **Agent Capabilities** - модели с agent capabilities (tool use, function calling, multi-step reasoning)
- **Model** - название модели
- **Provider** - провайдер модели
- **Context** - размер контекстного окна

### 🎛️ Фильтры:

- **Поиск по названию** - текстовое поле для поиска моделей по имени
- Фильтр по категориям убран для упрощения интерфейса

### 📊 Формат отображения данных:

- **Цены**: ограничены до 4 знаков после запятой (например: $0.0015)
- **Aider Benchmark**: проценты с одним знаком после запятой (например: 84.9%)
- **Performance**: комплексный скор на основе рейтингов и бенчмарков
- **Context Window**: размер в тысячах токенов (например: 128K)

### 🤖 Agent Capabilities:

**Agent capabilities** включают способности модели к автономной работе:
- **Tool Use** - использование внешних инструментов и API
- **Function Calling** - вызов функций и интеграция с системами
- **Multi-step Reasoning** - многошаговое планирование и рассуждение
- **Code Generation** - генерация и модификация кода
- **Self-reflection** - анализ собственной работы и корректировка
- **Real-time Knowledge** - доступ к актуальной информации

**Модели с agent capabilities по провайдерам:**
- **Anthropic**: Claude 3.5 Sonnet, Claude 3.7 Sonnet (продвинутые возможности)
- **OpenAI**: GPT-4, GPT-4o, o1, o3 (мощные reasoning модели)
- **Google**: Gemini 2.5 Pro, Gemini 1.5 Pro (vision + tools)
- **xAI**: Grok-4 (real-time knowledge + tools)
- **Cursor**: Cursor Small (оптимизирован для кода)

### 📋 Статистика после анализа и заполнения данных:

- **32 модели** доступны в Cursor IDE (только из списка `cursor-models.html`)
- **20 моделей** имеют reasoning способности (с классом `codicon-brain`)
- **23 модели** имеют agent capabilities (на основе анализа источников)
- **4 модели** реально бесплатные (DeepSeek)
- **58 моделей** с полными техническими данными (pricing + context window)
- **59 моделей** всего в базе данных
- **13 моделей** имеют реальные данные Aider Benchmark с официального сайта
- **Тестовые данные** добавлены для демонстрации сортировки

### 🔍 Результаты поиска данных:

**✅ Успешно заполнено:**
- **28 моделей** получили pricing и context window данные
- **0 моделей** без context window (100% покрытие)
- **1 модель** без pricing (Cursor Small - бесплатная)

**📝 Для ручного поиска остались:**
- Пользовательские рейтинги (56 моделей) - добавляются через интерфейс
- Специфические данные для новых моделей при добавлении через API

## 📁 Структура проекта

```
cursor-benchmark/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API маршруты
│   │   │   ├── models/        # API моделей
│   │   │   ├── benchmarks/    # API бенчмарков
│   │   │   ├── ratings/       # API оценок
│   │   │   └── scheduler/     # API планировщика
│   │   ├── admin/             # Админ панель
│   │   └── page.tsx           # Главная страница
│   ├── components/            # React компоненты
│   │   ├── admin/            # Компоненты админки
│   │   ├── ModelsComparisonTable.tsx
│   │   ├── DashboardHeader.tsx
│   │   └── SyncStatus.tsx
│   ├── lib/                  # Утилиты и сервисы
│   │   ├── prisma.ts         # Prisma клиент
│   │   ├── services/         # Бизнес-логика
│   │   │   ├── cursor-models.service.ts
│   │   │   ├── benchmark.service.ts
│   │   │   └── scheduler.service.ts
│   │   └── utils.ts          # Вспомогательные функции
│   └── generated/            # Сгенерированные файлы Prisma
├── prisma/
│   └── schema.prisma         # Схема базы данных
├── scripts/
│   ├── parse-models.js       # Парсер моделей из HTML с анализом reasoning
│   ├── check-models.js       # Проверка импортированных моделей
│   ├── add-cursor-icons.js   # Добавление иконок Cursor к моделям
│   ├── remove-cursor-icons.js # Замена иконок на текст "В Cursor"
│   ├── update-models.js      # Обновление существующих моделей в БД
│   ├── add-test-data.js      # Добавление тестовых данных для сортировки
│   ├── analyze-missing-data.js # Анализ моделей с неполными данными
│   ├── fill-known-data.js    # Заполнение известными данными из интернета
│   ├── update-aider-benchmarks.js # Обновление Aider benchmarks с официального сайта
│   └── update-agent-capabilities.js # Обновление Agent Capabilities из надежных источников
├── cursor-models.html        # HTML файл с моделями Cursor
└── package.json
```

## 🔧 API Endpoints

### Модели
- `GET /api/models` - Получить все модели
- `POST /api/models` - Синхронизировать модели

### Бенчмарки
- `GET /api/benchmarks` - Получить бенчмарки
- `POST /api/benchmarks` - Синхронизировать бенчмарки

### Оценки
- `GET /api/ratings` - Получить оценки пользователей
- `POST /api/ratings` - Создать оценку

### Планировщик
- `GET /api/scheduler` - Получить статус планировщика
- `POST /api/scheduler` - Управление планировщиком

## 🗄 Схема базы данных

### Основные таблицы:
- **AIModel**: Информация о моделях
- **BenchmarkResult**: Результаты бенчмаркинга
- **BenchmarkSource**: Источники бенчмарков
- **UserRating**: Пользовательские оценки
- **SystemConfig**: Системные настройки

## 🔄 Система обновления данных

### Автоматическая синхронизация:
- **Модели**: Каждый час
- **Бенчмарки**: Каждые 6 часов
- **Полная синхронизация**: Каждый день в 2:00

### Ручная синхронизация:
- Через админ панель (`/admin`)
- Через API endpoints
- Через кнопки в интерфейсе

## 🎯 Источники данных

### Официальные:
- [Cursor Models](https://cursor.sh/docs/models)
- [Monnef Comparison](https://by-ai-monnef-9ff5d9c2460ae15d70e737f77eab719c6e8a4c64c2f99ca1c2.gitlab.io/2025/cursor_models_comparison/)

### Бенчмарки (25+ источников):

#### Coding Benchmarks:
- [Aider Benchmarks](https://aider.chat/docs/benchmarks/) - Real-world coding tasks
- [HumanEval](https://github.com/openai/human-eval) - Programming problems
- [MBPP](https://github.com/google-research/google-research/tree/master/mbpp) - Basic programming problems
- [CodeForces](https://codeforces.com/) - Competitive programming

#### Knowledge & Reasoning:
- [MMLU](https://github.com/hendrycks/test) - Massive multitask language understanding
- [ARC](https://allenai.org/data/arc) - AI2 Reasoning Challenge
- [HellaSwag](https://rowanzellers.com/hellaswag/) - Commonsense reasoning
- [Winogrande](https://winogrande.allenai.org/) - Winograd Schema Challenge

#### Math & Science:
- [GSM8K](https://github.com/openai/grade-school-math) - Grade school math
- [MATH](https://github.com/hendrycks/math) - Competition mathematics
- [GPQA](https://github.com/idavidrein/gpqa) - Google-Proof Q&A
- [AGIEval](https://github.com/microsoft/AGIEval) - AGI evaluation

#### Multilingual & Chat:
- [XQuAD](https://github.com/deepmind/xquad) - Cross-lingual QA
- [XNLI](https://github.com/facebookresearch/XNLI) - Cross-lingual NLI
- [MT-Bench](https://github.com/lm-sys/FastChat) - Multi-turn conversations
- [Chatbot Arena](https://chat.lmsys.org/) - Human preference evaluation

#### Leaderboards & Comprehensive:
- [Open LLM Leaderboard](https://huggingface.co/spaces/HuggingFaceH4/open_llm_leaderboard)
- [Chatbot Arena Leaderboard](https://huggingface.co/spaces/lmsys/chatbot-arena-leaderboard)

### Дополнительно:
- Внутренние тесты Cursor
- Пользовательские оценки и отзывы

## 🚢 Деплой

### Vercel (рекомендуется)
```bash
npm run build
vercel --prod
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork проект
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Создайте Pull Request

## 📝 Лицензия

Этот проект распространяется под лицензией MIT. См. файл `LICENSE` для подробностей.

## 📞 Контакты

- GitHub: [ссылка на репозиторий]
- Email: ваш-email@example.com

## 🔮 Планы развития

- [ ] Интеграция с реальными API Cursor
- [ ] Расширенные графики и аналитика
- [ ] Экспорт данных в различные форматы
- [ ] API для внешних интеграций
- [ ] Мобильное приложение
- [ ] Поддержка дополнительных источников бенчмарков
