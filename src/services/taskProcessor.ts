import type { Task, ProcessedTask, TaskNode, TaskLink } from '../types/tasks'

export function processTaskData(tasks: Task[]): ProcessedTask[] {
  return tasks.map(task => ({
    id: task.id,
    name: task.name,
    level: task.minPlayerLevel,
    trader: task.trader.name,
    map: task.map?.name || null,
    kappaRequired: task.kappaRequired,
    lightkeeperRequired: task.lightkeeperRequired,
    prerequisites: task.taskRequirements?.map(req => req.task.id) || [],
    objectives: task.objectives?.map(obj => obj.description) || []
  }))
}

export function createGraphData(tasks: ProcessedTask[]): {
  nodes: TaskNode[]
  links: TaskLink[]
} {
  const nodes: TaskNode[] = tasks.map(task => ({ ...task }))
  
  const links: TaskLink[] = []
  
  tasks.forEach(task => {
    task.prerequisites.forEach(prereqId => {
      // Check if prerequisite exists in the task list
      if (tasks.some(t => t.id === prereqId)) {
        links.push({
          source: prereqId,
          target: task.id
        })
      }
    })
  })
  
  return { nodes, links }
}

export function getLevelColor(level: number): string {
  if (level <= 10) return '#60a5fa' // Light blue
  if (level <= 20) return '#3b82f6' // Blue
  if (level <= 30) return '#8b5cf6' // Purple
  if (level <= 40) return '#f97316' // Orange
  return '#ef4444' // Red
}

export function getTraderColor(trader: string): string {
  // Map traders to distinct colors
  const traderColors: { [key: string]: string } = {
    'Prapor': '#dc2626',        // Red
    'Therapist': '#06b6d4',     // Cyan
    'Fence': '#65a30d',         // Lime green
    'Skier': '#2563eb',         // Blue
    'Peacekeeper': '#0891b2',   // Teal
    'Mechanic': '#ea580c',      // Orange
    'Ragman': '#7c3aed',        // Purple
    'Jaeger': '#059669',        // Emerald
    'Lightkeeper': '#fbbf24',   // Yellow/Gold
    'Ref': '#ec4899',           // Pink
  }
  
  return traderColors[trader] || '#9ca3af' // Gray for unknown traders
}

export function getLevelRadius(level: number): number {
  // Base radius + scaled by level (increased from 8 to 12 base, max from 12 to 18)
  return 8 + Math.min(level / 5, 18)
}
