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
- 🖱️ Добавляет иконку Cursor рядом с названиями моделей
- 💾 Сохраняет все данные в базу данных

### Дополнительные команды:
```bash
# Восстановление иконок Cursor рядом с названиями моделей
npm run restore:cursor-icons

# Замена иконок Cursor на текст "В Cursor"
npm run remove:cursor-icons

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
│   ├── parse-models.js       # Парсер моделей из HTML
│   ├── check-models.js       # Проверка импортированных моделей
│   ├── add-cursor-icons.js   # Добавление иконок Cursor к моделям
│   ├── remove-cursor-icons.js # Замена иконок на текст "В Cursor"
│   └── update-models.js      # Обновление существующих моделей в БД
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
