import { ref, onMounted } from 'vue'
import { fetchTasks } from '../services/tarkovApi'
import { processTaskData } from '../services/taskProcessor'
import type { ProcessedTask } from '../types/tasks'

export function useTarkovTasks() {
  const tasks = ref<ProcessedTask[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const loadTasks = async () => {
    loading.value = true
    error.value = null
    
    try {
      const data = await fetchTasks()
      tasks.value = processTaskData(data)
      console.log(`Loaded ${tasks.value.length} tasks`)
    } catch (e) {
      error.value = e as Error
      console.error('Failed to load tasks:', e)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    loadTasks()
  })

  return {
    tasks,
    loading,
    error,
    loadTasks
  }
}
