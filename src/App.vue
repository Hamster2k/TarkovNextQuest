<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ForceTreeVisualization from './components/ForceTreeVisualization.vue'
import TaskDetails from './components/TaskDetails.vue'
import LevelLegend from './components/LevelLegend.vue'
import RecommendedQuest from './components/RecommendedQuest.vue'
import { useTarkovTasks } from './composables/useTarkovTasks'
import type { ProcessedTask } from './types/tasks'

const { tasks, loading, error } = useTarkovTasks()
const selectedTask = ref<ProcessedTask | null>(null)

// Track which traders are visible (all visible by default)
const visibleTraders = ref<Set<string>>(new Set([
  'Prapor', 'Therapist', 'Fence', 'Skier', 'Peacekeeper', 
  'Mechanic', 'Ragman', 'Jaeger', 'Lightkeeper', 'Ref'
]))

// Track which maps are visible (all visible by default, including "Any" for tasks without specific maps)
const visibleMaps = ref<Set<string>>(new Set([
  'Customs', 'Woods', 'Shoreline', 'Interchange', 'Reserve', 
  'Lighthouse', 'Streets of Tarkov', 'Ground Zero', 'Factory', 
  'The Lab', 'Any'
]))

// Track filter states for Kappa and Lightkeeper
const filterKappa = ref(false)
const filterLightkeeper = ref(false)

// Track unlocked filter (only show tasks player can do)
const filterUnlocked = ref(false)

// Track max level filter (default to 79, the max level in Tarkov)
const maxLevel = ref(79)

// Track completed tasks
const completedTasks = ref<Set<string>>(new Set())

// Load completed tasks from localStorage on mount
onMounted(() => {
  const saved = localStorage.getItem('tarkov-completed-tasks')
  if (saved) {
    try {
      const completed = JSON.parse(saved)
      completedTasks.value = new Set(completed)
    } catch (e) {
      console.error('Failed to load completed tasks', e)
    }
  }
})

// Save completed tasks to localStorage whenever it changes
const saveCompletedTasks = () => {
  localStorage.setItem('tarkov-completed-tasks', JSON.stringify(Array.from(completedTasks.value)))
}

// Get all tasks that depend on a given task
const getTaskDependents = (taskId: string): string[] => {
  return tasks.value
    .filter(task => task.prerequisites.includes(taskId))
    .map(task => task.id)
}

// Recursively complete all prerequisites of a task
const completePrerequisites = (taskId: string, completed: Set<string>) => {
  const task = tasks.value.find(t => t.id === taskId)
  if (!task) return

  // Complete all prerequisites
  task.prerequisites.forEach(prereqId => {
    if (!completed.has(prereqId)) {
      completed.add(prereqId)
      // Recursively complete prerequisites of prerequisites
      completePrerequisites(prereqId, completed)
    }
  })
}

// Recursively uncomplete all tasks that depend on a given task
const uncompleteDependents = (taskId: string, completed: Set<string>) => {
  const dependents = getTaskDependents(taskId)
  
  dependents.forEach(dependentId => {
    if (completed.has(dependentId)) {
      completed.delete(dependentId)
      // Recursively uncomplete dependents of dependents
      uncompleteDependents(dependentId, completed)
    }
  })
}

// Toggle task completion
const toggleTaskCompletion = (taskId: string) => {
  const newCompleted = new Set(completedTasks.value)
  
  if (newCompleted.has(taskId)) {
    // Uncompleting: remove this task and all dependent tasks
    newCompleted.delete(taskId)
    uncompleteDependents(taskId, newCompleted)
  } else {
    // Completing: add this task and all prerequisite tasks
    newCompleted.add(taskId)
    completePrerequisites(taskId, newCompleted)
  }
  
  completedTasks.value = newCompleted
  saveCompletedTasks()
}

// Check if a task is completed
const isTaskCompleted = (taskId: string) => {
  return completedTasks.value.has(taskId)
}// Check if a task is unlocked (all prerequisites are completed)
const isTaskUnlocked = (task: ProcessedTask) => {
  // If no prerequisites, task is unlocked
  if (task.prerequisites.length === 0) {
    return true
  }
  // Task is unlocked if all prerequisites are completed
  return task.prerequisites.every(prereqId => completedTasks.value.has(prereqId))
}

// Find the recommended next quest
const recommendedQuest = computed(() => {
  // Get all unlocked, uncompleted tasks
  let candidates = tasks.value.filter(task => {
    // Must be unlocked and not completed
    if (!isTaskUnlocked(task) || completedTasks.value.has(task.id)) {
      return false
    }
    
    // Apply Kappa and Lightkeeper filters (matching the main filter logic)
    if (filterKappa.value || filterLightkeeper.value) {
      if (filterKappa.value && filterLightkeeper.value) {
        // Both checked: show tasks required for either Kappa OR Lightkeeper
        if (!task.kappaRequired && !task.lightkeeperRequired) {
          return false
        }
      } else if (filterKappa.value) {
        // Only Kappa: show only Kappa-required tasks
        if (!task.kappaRequired) {
          return false
        }
      } else if (filterLightkeeper.value) {
        // Only Lightkeeper: show only Lightkeeper-required tasks
        if (!task.lightkeeperRequired) {
          return false
        }
      }
    }
    
    return true
  })
  
  // Sort by level (lowest first), then by name for consistency
  candidates.sort((a, b) => {
    if (a.level !== b.level) {
      return a.level - b.level
    }
    return a.name.localeCompare(b.name)
  })
  
  // Return the lowest level task
  return candidates.length > 0 ? candidates[0] : null
})

// Filter tasks based on visible traders, maps, and requirement filters
const filteredTasks = computed(() => {
  let result = tasks.value.filter(task => {
    // Filter by level
    if (task.level > maxLevel.value) {
      return false
    }
    
    // Filter by trader
    const traderMatch = visibleTraders.value.has(task.trader)
    
    // Filter by map (include tasks without a map if "Any" is visible)
    const mapMatch = task.map 
      ? visibleMaps.value.has(task.map)
      : visibleMaps.value.has('Any')
    
    return traderMatch && mapMatch
  })
  
  // Apply Kappa and Lightkeeper filters
  // When filters are enabled, show ONLY tasks required for them
  if (filterKappa.value || filterLightkeeper.value) {
    result = result.filter(task => {
      if (filterKappa.value && filterLightkeeper.value) {
        // Both checked: show tasks required for either Kappa OR Lightkeeper
        return task.kappaRequired || task.lightkeeperRequired
      } else if (filterKappa.value) {
        // Only Kappa: show only Kappa-required tasks
        return task.kappaRequired
      } else if (filterLightkeeper.value) {
        // Only Lightkeeper: show only Lightkeeper-required tasks
        return task.lightkeeperRequired
      }
      return true
    })
  }

  // Apply unlocked filter (only show tasks with completed prerequisites)
  if (filterUnlocked.value) {
    result = result.filter(task => isTaskUnlocked(task))
  }
  
  return result
})

const handleNodeClick = (task: ProcessedTask) => {
  selectedTask.value = task
}

const handleSelectRecommendedQuest = (task: ProcessedTask) => {
  selectedTask.value = task
}

const closeDetails = () => {
  selectedTask.value = null
}

const toggleTrader = (traderName: string) => {
  const newVisible = new Set(visibleTraders.value)
  if (newVisible.has(traderName)) {
    newVisible.delete(traderName)
  } else {
    newVisible.add(traderName)
  }
  visibleTraders.value = newVisible
}

const toggleMap = (mapName: string) => {
  const newVisible = new Set(visibleMaps.value)
  if (newVisible.has(mapName)) {
    newVisible.delete(mapName)
  } else {
    newVisible.add(mapName)
  }
  visibleMaps.value = newVisible
}

const toggleKappa = () => {
  filterKappa.value = !filterKappa.value
}

const toggleLightkeeper = () => {
  filterLightkeeper.value = !filterLightkeeper.value
}

const toggleUnlocked = () => {
  filterUnlocked.value = !filterUnlocked.value
}

const updateMaxLevel = (level: number) => {
  maxLevel.value = level
}

const showAllTraders = () => {
  visibleTraders.value = new Set([
    'Prapor', 'Therapist', 'Fence', 'Skier', 'Peacekeeper', 
    'Mechanic', 'Ragman', 'Jaeger', 'Lightkeeper', 'Ref'
  ])
}

const hideAllTraders = () => {
  visibleTraders.value = new Set()
}

const showAllMaps = () => {
  visibleMaps.value = new Set([
    'Customs', 'Woods', 'Shoreline', 'Interchange', 'Reserve', 
    'Lighthouse', 'Streets of Tarkov', 'Ground Zero', 'Factory', 
    'The Lab', 'Any'
  ])
}

const hideAllMaps = () => {
  visibleMaps.value = new Set()
}
</script>

<template>
  <div id="app">
    <header>
      <h1>🎯 Tarkov Next Quest</h1>
      <p class="subtitle">Quest recommendation based on your preferences and progress</p>
    </header>

    <main class="container">
      <div v-if="loading" class="status-message">
        <div class="spinner"></div>
        <p>Loading tasks from Tarkov API...</p>
      </div>

      <div v-else-if="error" class="status-message error">
        <p>❌ Error loading tasks: {{ error.message }}</p>
      </div>

      <ForceTreeVisualization 
        v-else
        :tasks="filteredTasks"
        :completed-tasks="completedTasks"
        :max-level="maxLevel"
        :selected-task-id="selectedTask?.id ?? null"
        :recommended-task-id="recommendedQuest?.id ?? null"
        @node-click="handleNodeClick"
        @toggle-completion="toggleTaskCompletion"
      />

      <div class="overlay-left">
        <RecommendedQuest 
          :quest="recommendedQuest ?? null"
          @select-quest="handleSelectRecommendedQuest"
          @complete-quest="toggleTaskCompletion"
        />
        
        <LevelLegend 
          :visible-traders="visibleTraders"
          :visible-maps="visibleMaps"
          :filter-kappa="filterKappa"
          :filter-lightkeeper="filterLightkeeper"
          :filter-unlocked="filterUnlocked"
          :max-level="maxLevel"
          :all-tasks="tasks"
          :completed-tasks="completedTasks"
          @toggle-trader="toggleTrader"
          @toggle-map="toggleMap"
          @toggle-kappa="toggleKappa"
          @toggle-lightkeeper="toggleLightkeeper"
          @toggle-unlocked="toggleUnlocked"
          @update-max-level="updateMaxLevel"
          @show-all-traders="showAllTraders"
          @hide-all-traders="hideAllTraders"
          @show-all-maps="showAllMaps"
          @hide-all-maps="hideAllMaps"
        />
      </div>

      <div v-if="selectedTask" class="overlay-right">
        <TaskDetails 
          :task="selectedTask" 
          :all-tasks="tasks" 
          :is-completed="isTaskCompleted(selectedTask.id)"
          @close="closeDetails"
          @toggle-complete="toggleTaskCompletion"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  background: #0f0f0f;
  color: #fff;
  display: flex;
  flex-direction: column;
}

header {
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  padding: 20px 40px;
  border-bottom: 2px solid #fbbf24;
  z-index: 10;
  position: relative;
}

header h1 {
  margin: 0;
  font-size: 32px;
  color: #fbbf24;
}

.subtitle {
  margin: 8px 0 0 0;
  color: #999;
  font-size: 14px;
}

.container {
  position: relative;
  flex: 1;
  width: 100%;
  height: calc(100vh - 84px);
  overflow: hidden;
}

.overlay-left {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 100;
  max-height: calc(100vh - 124px);
  overflow-y: auto;
  max-width: 400px;
}

.overlay-right {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  max-height: calc(100vh - 124px);
  overflow-y: auto;
  width: 350px;
}

.status-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: rgba(26, 26, 26, 0.95);
  border-radius: 8px;
  gap: 20px;
  z-index: 50;
  backdrop-filter: blur(10px);
}

.status-message.error {
  color: #ef4444;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #333;
  border-top-color: #fbbf24;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1200px) {
  .overlay-left {
    max-width: 350px;
  }

  .overlay-right {
    width: 300px;
  }
}

@media (max-width: 900px) {
  .overlay-left {
    position: relative;
    top: 0;
    left: 0;
    max-width: 100%;
    margin: 10px;
  }

  .overlay-right {
    position: relative;
    top: 0;
    right: 0;
    width: calc(100% - 20px);
    margin: 10px;
  }

  .container {
    height: auto;
    min-height: calc(100vh - 84px);
  }
}
</style>
