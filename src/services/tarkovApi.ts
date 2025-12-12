import { GraphQLClient } from 'graphql-request'
import type { Task } from '../types/tasks'

const client = new GraphQLClient('https://api.tarkov.dev/graphql')

const TASKS_QUERY = `
  query GetTasks {
    tasks {
      id
      name
      minPlayerLevel
      kappaRequired
      lightkeeperRequired
      trader {
        name
      }
      map {
        name
      }
      taskRequirements {
        task {
          id
        }
      }
      objectives {
        description
      }
    }
  }
`

export async function fetchTasks(): Promise<Task[]> {
  try {
    const data = await client.request<{ tasks: Task[] }>(TASKS_QUERY)
    return data.tasks
  } catch (error) {
    console.error('Error fetching tasks:', error)
    throw error
  }
}
