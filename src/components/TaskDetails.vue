<script setup lang="ts">
import { computed } from 'vue'
import type { ProcessedTask } from '../types/tasks'
import { getLevelColor } from '../services/taskProcessor'

const props = defineProps<{
  task: ProcessedTask | null
  allTasks: ProcessedTask[]
  isCompleted: boolean
}>()

const emit = defineEmits<{
  close: []
  'toggle-complete': [taskId: string]
  'select-task': [taskId: string]
}>()

// Create a map of task IDs to full task objects for prerequisites
const taskObjectMap = computed(() => {
  const map = new Map<string, ProcessedTask>()
  props.allTasks.forEach(task => {
    map.set(task.id, task)
  })
  return map
})

// Get prerequisite tasks with their full data
const prerequisiteTasks = computed(() => {
  if (!props.task) return []
  return props.task.prerequisites
    .map(prereqId => taskObjectMap.value.get(prereqId))
    .filter(task => task !== undefined) as ProcessedTask[]
})

const handleToggleComplete = () => {
  if (props.task) {
    emit('toggle-complete', props.task.id)
  }
}

const handlePrerequisiteClick = (taskId: string) => {
  emit('select-task', taskId)
}
</script>

<template>
  <div v-if="task" class="task-details">
    <div class="header">
      <div class="header-content">
        <h2>{{ task.name }}</h2>
        <button 
          @click="handleToggleComplete" 
          class="complete-btn"
          :class="{ completed: isCompleted }"
        >
          <span v-if="isCompleted">✓ Completed</span>
          <span v-else>Mark Complete</span>
        </button>
      </div>
      <button @click="emit('close')" class="close-btn">&times;</button>
    </div>
    
    <div class="info-grid">
      <div class="info-item">
        <span class="label">Level Required:</span>
        <span class="value" :style="{ color: getLevelColor(task.level) }">
          {{ task.level }}
        </span>
      </div>
      
      <div class="info-item">
        <span class="label">Trader:</span>
        <span class="value">{{ task.trader }}</span>
      </div>

      <div v-if="task.map" class="info-item">
        <span class="label">Map:</span>
        <span class="value map-name">🗺️ {{ task.map }}</span>
      </div>

      <div v-if="task.kappaRequired" class="info-item">
        <span class="label">Kappa:</span>
        <span class="value badge kappa">✓ Required</span>
      </div>

      <div v-if="task.lightkeeperRequired" class="info-item">
        <span class="label">Lightkeeper:</span>
        <span class="value badge lightkeeper">✓ Required</span>
      </div>
    </div>

    <div v-if="task.prerequisites.length > 0" class="section">
      <h3>Prerequisites</h3>
      <ul class="prerequisite-list">
        <li 
          v-for="prereqTask in prerequisiteTasks" 
          :key="prereqTask.id"
          @click="handlePrerequisiteClick(prereqTask.id)"
          class="prerequisite-item"
        >
          {{ prereqTask.name }}
        </li>
      </ul>
    </div>

    <div v-if="task.objectives.length > 0" class="section">
      <h3>Objectives</h3>
      <ul>
        <li v-for="(obj, index) in task.objectives" :key="index">
          {{ obj }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.task-details {
  background: rgba(42, 42, 42, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 20px;
  color: #fff;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #444;
  gap: 15px;
}

.header-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.header h2 {
  margin: 0;
  font-size: 20px;
  color: #fbbf24;
}

.complete-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  color: #fff;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
  align-self: flex-start;
}

.complete-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.complete-btn.completed {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.complete-btn.completed:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

.close-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 32px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  line-height: 1;
  flex-shrink: 0;
}

.close-btn:hover {
  color: #fff;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.label {
  font-size: 12px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.value {
  font-size: 16px;
  font-weight: 600;
}

.map-name {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.1);
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid rgba(96, 165, 250, 0.3);
  display: inline-block;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
}

.badge.kappa {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #000;
}

.badge.lightkeeper {
  background: linear-gradient(135deg, #fbbf24 0%, #eab308 100%);
  color: #000;
}

.section {
  margin-top: 20px;
}

.section h3 {
  font-size: 14px;
  color: #999;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.prerequisite-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.prerequisite-item {
  padding: 8px 12px;
  background: #1a1a1a;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.5;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  position: relative;
}

.prerequisite-item:hover {
  background: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.5);
  transform: translateX(4px);
}

.prerequisite-item::after {
  content: '→';
  position: absolute;
  right: 12px;
  opacity: 0;
  transition: opacity 0.2s ease;
  color: #fbbf24;
}

.prerequisite-item:hover::after {
  opacity: 1;
}

.section li {
  padding: 8px 12px;
  background: #1a1a1a;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.5;
}
</style>
