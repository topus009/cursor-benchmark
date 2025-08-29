import * as cron from 'node-cron'
import { CursorModelsService } from './cursor-models.service'
import { BenchmarkService } from './benchmark.service'

export class SchedulerService {
  private cursorService: CursorModelsService
  private benchmarkService: BenchmarkService
  private isRunning: boolean = false

  constructor() {
    this.cursorService = new CursorModelsService()
    this.benchmarkService = new BenchmarkService()
  }

  /**
   * Запускает планировщик с cron jobs
   */
  start() {
    console.log('Starting scheduler service...')

    // Синхронизация моделей каждый час
    cron.schedule('0 * * * *', async () => {
      if (!this.isRunning) {
        await this.runModelSync()
      }
    })

    // Синхронизация бенчмарков каждые 6 часов
    cron.schedule('0 */6 * * *', async () => {
      if (!this.isRunning) {
        await this.runBenchmarkSync()
      }
    })

    // Полная синхронизация каждый день в 2:00
    cron.schedule('0 2 * * *', async () => {
      if (!this.isRunning) {
        await this.runFullSync()
      }
    })

    console.log('Scheduler service started successfully')
  }

  /**
   * Останавливает планировщик
   */
  stop() {
    console.log('Stopping scheduler service...')
    cron.getTasks().forEach(task => task.stop())
  }

  /**
   * Запускает синхронизацию моделей
   */
  async runModelSync() {
    try {
      this.isRunning = true
      console.log('Starting scheduled model sync...')

      await this.cursorService.syncModels()

      console.log('Model sync completed successfully')
    } catch (error) {
      console.error('Error in scheduled model sync:', error)
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Запускает синхронизацию бенчмарков
   */
  async runBenchmarkSync() {
    try {
      this.isRunning = true
      console.log('Starting scheduled benchmark sync...')

      await this.benchmarkService.syncAllBenchmarks()

      console.log('Benchmark sync completed successfully')
    } catch (error) {
      console.error('Error in scheduled benchmark sync:', error)
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Запускает полную синхронизацию
   */
  async runFullSync() {
    try {
      this.isRunning = true
      console.log('Starting full sync...')

      // Синхронизируем модели
      await this.cursorService.syncModels()

      // Синхронизируем бенчмарки
      await this.benchmarkService.syncAllBenchmarks()

      console.log('Full sync completed successfully')
    } catch (error) {
      console.error('Error in full sync:', error)
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Получает статус планировщика
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextModelSync: this.getNextRunTime('0 * * * *'),
      nextBenchmarkSync: this.getNextRunTime('0 */6 * * *'),
      nextFullSync: this.getNextRunTime('0 2 * * *')
    }
  }

  /**
   * Вычисляет время следующего запуска cron задачи
   */
  private getNextRunTime(cronExpression: string): Date | null {
    try {
      // В реальном проекте здесь был бы расчет точного времени
      // Пока возвращаем примерные значения
      const now = new Date()

      if (cronExpression === '0 * * * *') {
        // Каждый час
        const nextHour = new Date(now)
        nextHour.setHours(now.getHours() + 1, 0, 0, 0)
        return nextHour
      }

      if (cronExpression === '0 */6 * * *') {
        // Каждые 6 часов
        const nextSync = new Date(now)
        const hours = now.getHours()
        const nextHours = Math.ceil((hours + 1) / 6) * 6
        nextSync.setHours(nextHours, 0, 0, 0)
        return nextSync
      }

      if (cronExpression === '0 2 * * *') {
        // Каждый день в 2:00
        const nextDay = new Date(now)
        nextDay.setDate(now.getDate() + 1)
        nextDay.setHours(2, 0, 0, 0)
        return nextDay
      }

      return null
    } catch (error) {
      console.error('Error calculating next run time:', error)
      return null
    }
  }
}

// Создаем глобальный экземпляр планировщика
export const scheduler = new SchedulerService()
