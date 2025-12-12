<script setup lang="ts">
import { ref, onMounted, toRef } from 'vue'
import { useForceSimulation } from '../composables/useForceSimulation'
import type { ProcessedTask } from '../types/tasks'

const props = defineProps<{
  tasks: ProcessedTask[]
  completedTasks: Set<string>
  maxLevel: number
  selectedTaskId: string | null
  recommendedTaskId: string | null
}>()

const emit = defineEmits<{
  'node-click': [task: ProcessedTask]
  'toggle-completion': [taskId: string]
}>()

const svgRef = ref<SVGSVGElement | null>(null)
const tasksRef = toRef(props, 'tasks')
const completedTasksRef = toRef(props, 'completedTasks')
const maxLevelRef = toRef(props, 'maxLevel')
const selectedTaskIdRef = toRef(props, 'selectedTaskId')
const recommendedTaskIdRef = toRef(props, 'recommendedTaskId')
const { initSimulation } = useForceSimulation(
  svgRef, 
  tasksRef, 
  completedTasksRef, 
  maxLevelRef, 
  selectedTaskIdRef,
  recommendedTaskIdRef,
  emit
)

onMounted(() => {
  if (props.tasks.length > 0) {
    initSimulation()
  }
})

// No need to watch here - the composable handles it internally now
</script>

<template>
  <div class="visualization-container">
    <svg ref="svgRef" width="100%" height="100%"></svg>
    <div v-if="tasks.length === 0" class="empty-state">
      <p>Loading tasks...</p>
    </div>
  </div>
</template>

<style scoped>
.visualization-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #1a1a1a;
  overflow: hidden;
}

svg {
  display: block;
  width: 100%;
  height: 100%;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #999;
  font-size: 18px;
}
</style>
