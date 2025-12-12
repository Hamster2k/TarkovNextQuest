export interface Task {
  id: string
  name: string
  minPlayerLevel: number
  kappaRequired: boolean
  lightkeeperRequired: boolean
  trader: {
    name: string
  }
  map: {
    name: string
  } | null
  taskRequirements: Array<{
    task: {
      id: string
    }
  }>
  objectives: Array<{
    description: string
  }>
}

export interface ProcessedTask {
  id: string
  name: string
  level: number
  trader: string
  map: string | null
  kappaRequired: boolean
  lightkeeperRequired: boolean
  prerequisites: string[]
  objectives: string[]
}

export interface TaskNode extends ProcessedTask {
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
}

export interface TaskLink {
  source: string | TaskNode
  target: string | TaskNode
}
