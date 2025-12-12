<script setup lang="ts">
import type { ProcessedTask } from '../types/tasks'
import { getLevelColor } from '../services/taskProcessor'

const props = defineProps<{
  quest: ProcessedTask | null
}>()

const emit = defineEmits<{
  'select-quest': [task: ProcessedTask]
  'complete-quest': [taskId: string]
}>()

const handleClick = () => {
  if (props.quest) {
    emit('select-quest', props.quest)
  }
}

const handleComplete = (event: Event) => {
  event.stopPropagation() // Prevent triggering the card click
  if (props.quest) {
    emit('complete-quest', props.quest.id)
  }
}
</script>

<template>
  <div v-if="quest" class="recommended-quest">
    <div class="header">
      <span class="icon">⭐</span>
      <span class="title">Recommended Next Quest</span>
    </div>
    <div class="quest-info" @click="handleClick">
      <div class="quest-name">{{ quest.name }}</div>
      <div class="quest-details">
        <span class="level" :style="{ color: getLevelColor(quest.level) }">
          Level {{ quest.level }}
        </span>
        <span class="separator">•</span>
        <span class="trader">{{ quest.trader }}</span>
      </div>
    </div>
    <div class="actions">
      <button class="view-btn" @click="handleClick">
        View Details →
      </button>
      <button class="complete-btn" @click="handleComplete">
        ✓ Complete
      </button>
    </div>
  </div>
</template>

<style scoped>
.recommended-quest {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 15px;
  transition: all 0.3s ease;
  border: 2px solid rgba(251, 191, 36, 0.3);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  margin-bottom: 15px;
}

.recommended-quest:hover {
  border-color: rgba(251, 191, 36, 0.6);
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.25) 0%, rgba(245, 158, 11, 0.15) 100%);
  box-shadow: 0 6px 12px rgba(251, 191, 36, 0.2);
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.icon {
  font-size: 18px;
}

.title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #fbbf24;
}

.quest-info {
  margin-bottom: 12px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.quest-info:hover {
  background: rgba(255, 255, 255, 0.05);
}

.quest-name {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 5px;
}

.quest-details {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.level {
  font-weight: 600;
}

.separator {
  color: #666;
}

.trader {
  color: #ccc;
}

.actions {
  display: flex;
  gap: 8px;
}

.view-btn,
.complete-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.view-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(251, 191, 36, 0.5);
  transform: translateY(-1px);
}

.complete-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
}

.complete-btn:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}
</style>
