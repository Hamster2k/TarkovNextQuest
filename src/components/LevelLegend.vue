<script setup lang="ts">
import { computed, ref } from 'vue'
import { getTraderColor, getLevelColor } from '../services/taskProcessor'
import type { ProcessedTask } from '../types/tasks'

const props = defineProps<{
  visibleTraders: Set<string>
  visibleMaps: Set<string>
  filterKappa: boolean
  filterLightkeeper: boolean
  filterUnlocked: boolean
  maxLevel: number
  allTasks: ProcessedTask[]
  completedTasks: Set<string>
}>()

const emit = defineEmits<{
  'toggle-trader': [trader: string]
  'toggle-map': [map: string]
  'toggle-kappa': []
  'toggle-lightkeeper': []
  'toggle-unlocked': []
  'update-max-level': [level: number]
  'show-all-traders': []
  'hide-all-traders': []
  'show-all-maps': []
  'hide-all-maps': []
  'select-task': [taskId: string]
}>()

// Search state
const searchQuery = ref('')
const searchExpanded = ref(false)

// Collapsible section states
const tradersExpanded = ref(true)
const mapsExpanded = ref(true)
const filtersExpanded = ref(true)

const traders = [
  { name: 'Prapor', color: getTraderColor('Prapor') },
  { name: 'Therapist', color: getTraderColor('Therapist') },
  { name: 'Fence', color: getTraderColor('Fence') },
  { name: 'Skier', color: getTraderColor('Skier') },
  { name: 'Peacekeeper', color: getTraderColor('Peacekeeper') },
  { name: 'Mechanic', color: getTraderColor('Mechanic') },
  { name: 'Ragman', color: getTraderColor('Ragman') },
  { name: 'Jaeger', color: getTraderColor('Jaeger') },
  { name: 'Lightkeeper', color: getTraderColor('Lightkeeper') },
  { name: 'Ref', color: getTraderColor('Ref') }
]

// Common Tarkov maps
const maps = [
  'Customs', 'Woods', 'Shoreline', 'Interchange', 'Reserve', 
  'Lighthouse', 'Streets of Tarkov', 'Ground Zero', 'Factory', 
  'The Lab', 'Any'
]

const toggleTrader = (traderName: string) => {
  emit('toggle-trader', traderName)
}

const toggleMap = (mapName: string) => {
  emit('toggle-map', mapName)
}

const isVisible = (traderName: string) => {
  return props.visibleTraders.has(traderName)
}

const isMapVisible = (mapName: string) => {
  return props.visibleMaps.has(mapName)
}

// Check if a task is unlocked (all prerequisites are completed)
const isTaskUnlocked = (task: ProcessedTask) => {
  // If no prerequisites, task is unlocked
  if (task.prerequisites.length === 0) {
    return true
  }
  // Task is unlocked if all prerequisites are completed
  return task.prerequisites.every(prereqId => props.completedTasks.has(prereqId))
}

// Get currently visible tasks based on all filters
const visibleTasks = computed(() => {
  return props.allTasks.filter(task => {
    // Apply level filter
    if (task.level > props.maxLevel) {
      return false
    }
    
    // Apply trader filter
    const traderMatch = props.visibleTraders.has(task.trader)
    
    // Apply map filter
    const mapMatch = task.map 
      ? props.visibleMaps.has(task.map)
      : props.visibleMaps.has('Any')
    
    // Apply Kappa/Lightkeeper filters
    let requirementMatch = true
    if (props.filterKappa || props.filterLightkeeper) {
      if (props.filterKappa && props.filterLightkeeper) {
        requirementMatch = task.kappaRequired || task.lightkeeperRequired
      } else if (props.filterKappa) {
        requirementMatch = task.kappaRequired
      } else if (props.filterLightkeeper) {
        requirementMatch = task.lightkeeperRequired
      }
    }

    // Apply unlocked filter
    if (props.filterUnlocked && !isTaskUnlocked(task)) {
      return false
    }
    
    return traderMatch && mapMatch && requirementMatch
  })
})

// Count uncompleted tasks for each trader
const getTraderCount = (traderName: string) => {
  return visibleTasks.value.filter(task => 
    task.trader === traderName && !props.completedTasks.has(task.id)
  ).length
}

// Count uncompleted tasks for each map
const getMapCount = (mapName: string) => {
  return visibleTasks.value.filter(task => {
    const taskMap = task.map || 'Any'
    return taskMap === mapName && !props.completedTasks.has(task.id)
  }).length
}

const handleLevelChange = (event: Event) => {
  const value = Number((event.target as HTMLInputElement).value)
  emit('update-max-level', value)
}

const showAllTraders = () => {
  emit('show-all-traders')
}

const hideAllTraders = () => {
  emit('hide-all-traders')
}

const showAllMaps = () => {
  emit('show-all-maps')
}

const hideAllMaps = () => {
  emit('hide-all-maps')
}

// Search functionality
const searchResults = computed(() => {
  if (!searchQuery.value.trim()) {
    return []
  }
  
  const query = searchQuery.value.toLowerCase()
  return props.allTasks
    .filter(task => task.name.toLowerCase().includes(query))
    .sort((a, b) => {
      // Sort by completion status (uncompleted first), then by level
      const aCompleted = props.completedTasks.has(a.id)
      const bCompleted = props.completedTasks.has(b.id)
      
      if (aCompleted !== bCompleted) {
        return aCompleted ? 1 : -1
      }
      
      return a.level - b.level
    })
    .slice(0, 10) // Limit to 10 results
})

const selectTask = (taskId: string) => {
  emit('select-task', taskId)
  // Clear search after selecting
  searchQuery.value = ''
  searchExpanded.value = false
}

const clearSearch = () => {
  searchQuery.value = ''
}
</script>

<template>
  <div class="level-legend">
    <!-- Search Section -->
    <div class="legend-section search-section">
      <h3 @click="searchExpanded = !searchExpanded" class="collapsible-header">
        <span class="toggle-icon">{{ searchExpanded ? '▼' : '►' }}</span>
        Search Quests
      </h3>
      <div v-if="searchExpanded" class="search-container">
        <div class="search-input-wrapper">
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="Search by quest name..."
            class="search-input"
            @focus="searchExpanded = true"
          />
          <button 
            v-if="searchQuery" 
            @click="clearSearch" 
            class="clear-search-btn"
          >
            ✕
          </button>
        </div>
        <div v-if="searchResults.length > 0" class="search-results">
          <div 
            v-for="task in searchResults" 
            :key="task.id"
            @click="selectTask(task.id)"
            class="search-result-item"
            :class="{ completed: completedTasks.has(task.id) }"
          >
            <div class="result-name">{{ task.name }}</div>
            <div class="result-meta">
              <span class="result-level" :style="{ color: getLevelColor(task.level) }">
                Lv {{ task.level }}
              </span>
              <span class="result-trader">{{ task.trader }}</span>
              <span v-if="completedTasks.has(task.id)" class="result-completed">✓</span>
            </div>
          </div>
        </div>
        <div v-else-if="searchQuery.trim()" class="no-results">
          No quests found
        </div>
      </div>
    </div>

    <div class="legend-section">
      <h3 @click="tradersExpanded = !tradersExpanded" class="collapsible-header">
        <span class="toggle-icon">{{ tradersExpanded ? '▼' : '►' }}</span>
        Traders 
        <span class="legend-subtitle">(click to toggle)</span>
      </h3>
      <div v-if="tradersExpanded" class="toggle-all-buttons">
        <button @click.stop="showAllTraders" class="toggle-all-btn">Show All</button>
        <button @click.stop="hideAllTraders" class="toggle-all-btn">Hide All</button>
      </div>
      <div v-if="tradersExpanded" class="legend-items">
        <div 
          v-for="trader in traders" 
          :key="trader.name" 
          class="legend-item"
          :class="{ inactive: !isVisible(trader.name) }"
          @click="toggleTrader(trader.name)"
        >
          <div 
            class="legend-circle" 
            :style="{ backgroundColor: trader.color }"
          ></div>
          <span>{{ trader.name }}</span>
          <span class="count">{{ getTraderCount(trader.name) }}</span>
        </div>
      </div>
    </div>

    <div class="legend-section">
      <h3 @click="mapsExpanded = !mapsExpanded" class="collapsible-header">
        <span class="toggle-icon">{{ mapsExpanded ? '▼' : '►' }}</span>
        Maps 
        <span class="legend-subtitle">(click to toggle)</span>
      </h3>
      <div v-if="mapsExpanded" class="toggle-all-buttons">
        <button @click.stop="showAllMaps" class="toggle-all-btn">Show All</button>
        <button @click.stop="hideAllMaps" class="toggle-all-btn">Hide All</button>
      </div>
      <div v-if="mapsExpanded" class="legend-items">
        <div 
          v-for="map in maps" 
          :key="map" 
          class="legend-item map-item"
          :class="{ inactive: !isMapVisible(map) }"
          @click="toggleMap(map)"
        >
          <div class="legend-square">{{ map.charAt(0) }}</div>
          <span>{{ map }}</span>
          <span class="count">{{ getMapCount(map) }}</span>
        </div>
      </div>
    </div>

    <div class="legend-section filters">
      <h3 @click="filtersExpanded = !filtersExpanded" class="collapsible-header">
        <span class="toggle-icon">{{ filtersExpanded ? '▼' : '►' }}</span>
        Filters
      </h3>
      <div v-if="filtersExpanded" class="filter-items">
        <div class="level-slider-container">
          <label class="level-slider-label">
            <span>Max Level: {{ maxLevel }}</span>
          </label>
          <input 
            type="range" 
            min="1" 
            max="79"
            :value="maxLevel"
            @input="handleLevelChange"
            class="level-slider"
          />
          <div class="level-slider-marks">
            <span>1</span>
            <span>20</span>
            <span>40</span>
            <span>60</span>
            <span>79</span>
          </div>
        </div>
        
        <label class="filter-item" :class="{ active: filterKappa }">
          <input 
            type="checkbox" 
            :checked="filterKappa"
            @change="emit('toggle-kappa')"
          />
          <span class="filter-badge kappa">Kappa Required</span>
        </label>
        <label class="filter-item" :class="{ active: filterLightkeeper }">
          <input 
            type="checkbox" 
            :checked="filterLightkeeper"
            @change="emit('toggle-lightkeeper')"
          />
          <span class="filter-badge lightkeeper">Lightkeeper Required</span>
        </label>
        <label class="filter-item" :class="{ active: filterUnlocked }">
          <input 
            type="checkbox" 
            :checked="filterUnlocked"
            @change="emit('toggle-unlocked')"
          />
          <span class="filter-badge unlocked">Only Unlocked</span>
        </label>
      </div>
    </div>

    <p class="legend-help">
      🎯 Tasks positioned between level circles • Click to view details • Drag to reposition • Scroll to zoom
    </p>
  </div>
</template>

<style scoped>
.level-legend {
  background: rgba(42, 42, 42, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 15px 20px;
  color: #fff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.level-legend h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #fbbf24;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.collapsible-header {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  transition: all 0.2s ease;
}

.collapsible-header:hover {
  color: #fcd34d;
}

.toggle-icon {
  font-size: 10px;
  transition: transform 0.2s ease;
}

.legend-section {
  margin-bottom: 20px;
}

.legend-section:last-of-type {
  margin-bottom: 0;
}

.search-section {
  border-bottom: 1px solid #444;
  padding-bottom: 15px;
}

.search-container {
  margin-top: 12px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 10px 35px 10px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: rgba(251, 191, 36, 0.6);
  background: rgba(0, 0, 0, 0.5);
}

.search-input::placeholder {
  color: #999;
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #999;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  transition: color 0.2s ease;
}

.clear-search-btn:hover {
  color: #fbbf24;
}

.search-results {
  margin-top: 10px;
  max-height: 400px;
  overflow-y: auto;
  border-radius: 4px;
}

.search-result-item {
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-result-item:hover {
  background: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.5);
  transform: translateX(4px);
}

.search-result-item.completed {
  opacity: 0.6;
}

.result-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #fff;
}

.result-meta {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #999;
  align-items: center;
}

.result-level {
  font-weight: 600;
}

.result-trader {
  color: #aaa;
}

.result-completed {
  color: #10b981;
  font-weight: bold;
  margin-left: auto;
}

.no-results {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.legend-section.filters {
  padding-top: 15px;
  border-top: 1px solid #444;
}

.legend-subtitle {
  font-size: 11px;
  color: #999;
  font-weight: normal;
  text-transform: none;
  letter-spacing: normal;
}

.toggle-all-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.toggle-all-btn {
  flex: 1;
  padding: 6px 12px;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  color: #fbbf24;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  font-family: inherit;
}

.toggle-all-btn:hover {
  background: rgba(251, 191, 36, 0.2);
  border-color: rgba(251, 191, 36, 0.5);
  transform: translateY(-1px);
}

.toggle-all-btn:active {
  transform: translateY(0);
}

.legend-items {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  user-select: none;
}

.legend-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.legend-item.inactive {
  opacity: 0.3;
}

.legend-item.inactive:hover {
  opacity: 0.5;
}

.legend-circle {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #fff;
  transition: all 0.2s ease;
}

.legend-item.inactive .legend-circle {
  border-color: #666;
  background: transparent !important;
}

.legend-square {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid #60a5fa;
  background: rgba(96, 165, 250, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  color: #60a5fa;
  transition: all 0.2s ease;
}

.legend-item.inactive .legend-square {
  border-color: #666;
  background: transparent;
  color: #666;
}

.legend-item span {
  font-size: 13px;
  color: #ccc;
  transition: color 0.2s ease;
}

.legend-item span.count {
  margin-left: auto;
  font-size: 11px;
  font-weight: bold;
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.legend-item.inactive span {
  color: #666;
  text-decoration: line-through;
}

.legend-item.inactive span.count {
  background: rgba(102, 102, 102, 0.2);
  color: #666;
  text-decoration: none;
}

.filter-items {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
  user-select: none;
}

.filter-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.filter-item.active {
  background: rgba(251, 191, 36, 0.15);
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.filter-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #fbbf24;
}

.filter-badge {
  font-size: 13px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.filter-badge.kappa {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #000;
}

.filter-badge.lightkeeper {
  background: linear-gradient(135deg, #fbbf24 0%, #eab308 100%);
  color: #000;
}

.filter-badge.unlocked {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
}

.level-slider-container {
  width: 100%;
  margin-bottom: 15px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.level-slider-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
  color: #fbbf24;
  font-weight: 600;
}

.level-slider {
  width: 100%;
  height: 6px;
  background: #444;
  border-radius: 3px;
  outline: none;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}

.level-slider::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: #fbbf24;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.level-slider::-webkit-slider-thumb:hover {
  background: #fcd34d;
  transform: scale(1.1);
}

.level-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #fbbf24;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.level-slider::-moz-range-thumb:hover {
  background: #fcd34d;
  transform: scale(1.1);
}

.level-slider-marks {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  padding: 0 2px;
}

.level-slider-marks span {
  font-size: 10px;
  color: #666;
}

.legend-help {
  margin: 12px 0 0 0;
  font-size: 12px;
  color: #999;
  padding-top: 12px;
  border-top: 1px solid #444;
}
</style>
