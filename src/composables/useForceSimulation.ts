import { ref, watch, onUnmounted } from 'vue'
import * as d3 from 'd3'
import type { Ref } from 'vue'
import type { ProcessedTask, TaskNode, TaskLink } from '../types/tasks'
import { createGraphData, getLevelColor, getLevelRadius, getTraderColor } from '../services/taskProcessor'

export function useForceSimulation(
  svgRef: Ref<SVGSVGElement | null>,
  tasks: Ref<ProcessedTask[]>,
  completedTasks: Ref<Set<string>>,
  maxLevel: Ref<number>,
  emit: any
) {
  const simulation = ref<d3.Simulation<TaskNode, TaskLink> | null>(null)
  const width = ref(1200)
  const height = ref(800)
  const nodesSelection = ref<d3.Selection<SVGGElement, TaskNode, SVGGElement, unknown> | null>(null)
  const linksSelection = ref<d3.Selection<SVGLineElement, TaskLink, SVGGElement, unknown> | null>(null)
  const levelCirclesGroup = ref<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
  const currentNodes = ref<TaskNode[]>([])
  const currentLinks = ref<TaskLink[]>([])

  const initSimulation = () => {
    if (!svgRef.value || tasks.value.length === 0) return

    // Stop any existing simulation before creating a new one
    if (simulation.value) {
      simulation.value.stop()
      simulation.value = null
    }

    const svg = d3.select(svgRef.value)
    svg.selectAll('*').remove() // Clear previous content

    // Get container dimensions
    const container = svgRef.value.parentElement
    if (container) {
      width.value = container.clientWidth
      height.value = container.clientHeight
    }

    svg.attr('viewBox', `0 0 ${width.value} ${height.value}`)

    // Create graph data
    const { nodes, links } = createGraphData(tasks.value)

    // Calculate center and radius spacing for level circles
    const centerX = width.value / 2
    const centerY = height.value / 2
    const maxLevelValue = 79 // Tarkov max level
    const baseRadius = 100 // Tripled from 100 for much larger center circle
    const radiusStep = Math.min(900, (Math.min(width.value, height.value) / 2 - 100) / maxLevelValue) * 10 // Reduced by factor of 10 from 45

    // Create zoom behavior
    const g = svg.append('g')
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.02, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })
    
    // Disable double-click zoom by filtering out dblclick events
    svg.call(zoom as any)
      .on('dblclick.zoom', null)

    // Create arrow marker for links (must be in defs before use)
    svg.append('defs').selectAll('marker')
      .data(['end'])
      .enter().append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#fbbf24')

    // Create level circles (0-79) - render first so they're in background
    const levelCircles = g.append('g').attr('class', 'level-circles')
    levelCirclesGroup.value = levelCircles
    
    for (let level = 0; level <= maxLevelValue; level++) {
      const radius = baseRadius + (level * radiusStep)
      
      levelCircles.append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', radius)
        .attr('fill', 'none')
        .attr('stroke', getLevelColor(level === 0 ? 1 : level))
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.3)
        .attr('data-level', level)
        .style('display', level <= maxLevel.value ? 'block' : 'none')
      
      // Add level label
      levelCircles.append('text')
        .attr('x', centerX)
        .attr('y', centerY - radius - 5)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('fill', getLevelColor(level === 0 ? 1 : level))
        .style('font-weight', 'bold')
        .attr('data-level', level)
        .style('display', level <= maxLevel.value ? 'block' : 'none')
        .text(level)
    }

    // Group tasks by level and calculate positions
    const tasksByLevel = new Map<number, TaskNode[]>()
    nodes.forEach(node => {
      if (!tasksByLevel.has(node.level)) {
        tasksByLevel.set(node.level, [])
      }
      tasksByLevel.get(node.level)!.push(node)
    })

    // Position nodes radially between their level circle and the previous one (initial positions only)
    nodes.forEach((node) => {
      const tasksAtLevel = tasksByLevel.get(node.level)!
      const taskIndex = tasksAtLevel.indexOf(node)
      const tasksCount = tasksAtLevel.length
      
      // Calculate radius between current level and previous level
      const currentLevelRadius = baseRadius + (node.level * radiusStep)
      const prevLevelRadius = baseRadius + ((node.level - 1) * radiusStep)
      
      // Special handling for level 0 - use a small radius instead of 0
      let nodeRadius: number
      if (node.level === 0) {
        nodeRadius = baseRadius * 0.5 // Place level 0 tasks on a small circle
      } else {
        nodeRadius = (currentLevelRadius + prevLevelRadius) / 2
      }
      
      // Distribute tasks evenly around the circle
      const angleStep = (2 * Math.PI) / tasksCount
      const angle = taskIndex * angleStep - Math.PI / 2 // Start from top
      
      // Set initial position only (no fx/fy so simulation can move them)
      node.x = centerX + nodeRadius * Math.cos(angle)
      node.y = centerY + nodeRadius * Math.sin(angle)
    })

    console.log('Created', nodes.length, 'nodes and', links.length, 'links')

    // Convert link source/target IDs to node references
    const nodeMap = new Map<string, TaskNode>()
    nodes.forEach(node => nodeMap.set(node.id, node))
    
    links.forEach(link => {
      if (typeof link.source === 'string') {
        link.source = nodeMap.get(link.source)!
      }
      if (typeof link.target === 'string') {
        link.target = nodeMap.get(link.target)!
      }
    })

    // Create links
    const link = g.append('g')
      .attr('class', 'links-group')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#fbbf24')
      .attr('stroke-opacity', d => {
        const target = d.target as TaskNode
        
        // Count incoming connections to target
        const incomingCount = links.filter(l => 
          (l.target as TaskNode).id === target.id
        ).length
        
        // Calculate level distance
        const source = d.source as TaskNode
        const levelDistance = Math.abs(target.level - source.level)
        
        // Reduce opacity based on incoming connection count (collector tasks)
        // More connections = more transparent (min 0.05, max 0.3)
        const connectionOpacity = Math.max(0.05, 0.3 - (incomingCount / 30))
        
        // Further reduce opacity for longer-distance links
        // Closer levels = more opaque, distant levels = more transparent
        const distanceOpacity = Math.max(0.3, 1 - (levelDistance / 20))
        
        return connectionOpacity * distanceOpacity
      })
      .attr('stroke-width', 1)
      .attr('marker-end', 'url(#arrowhead)')

    // Store links selection and data
    linksSelection.value = link
    currentLinks.value = links

    // Create node groups
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .call(d3.drag<SVGGElement, TaskNode>()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded) as any
      )

    // Store nodes selection and data
    nodesSelection.value = node
    currentNodes.value = nodes

    // Add circles to nodes
    node.append('circle')
      .attr('r', d => getLevelRadius(d.level))
      .attr('fill', d => {
        // Dim completed tasks
        if (completedTasks.value.has(d.id)) {
          return '#555' // Gray for completed tasks
        }
        return getTraderColor(d.trader)
      })
      .attr('stroke', d => {
        // Green border for completed tasks
        if (completedTasks.value.has(d.id)) {
          return '#10b981'
        }
        return '#fff'
      })
      .attr('stroke-width', d => completedTasks.value.has(d.id) ? 3 : 2)
      .style('cursor', 'pointer')
      .style('opacity', d => completedTasks.value.has(d.id) ? 0.6 : 1)
      .on('click', (_event, d) => {
        emit('node-click', d)
      })
      .on('dblclick', (_event, d) => {
        emit('toggle-completion', d.id)
      })
      .on('mouseover', function(_event, d) {
        d3.select(this)
          .attr('stroke', '#fbbf24')
          .attr('stroke-width', 3)
        
        // Highlight connected links
        link.style('stroke-opacity', function(l) {
          const linkSource = (l.source as TaskNode).id
          const linkTarget = (l.target as TaskNode).id
          if (linkSource === d.id || linkTarget === d.id) {
            return 0.8 // Highlight connected links
          }
          return 0.05 // Fade other links
        })
        .style('stroke-width', function(l) {
          const linkSource = (l.source as TaskNode).id
          const linkTarget = (l.target as TaskNode).id
          if (linkSource === d.id || linkTarget === d.id) {
            return 2
          }
          return 1
        })
        
        // Show tooltip or label
        d3.select(this.parentNode as SVGGElement)
          .append('text')
          .attr('class', 'node-label')
          .attr('dy', -15)
          .attr('text-anchor', 'middle')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .style('fill', '#fff')
          .style('pointer-events', 'none')
          .text(d.name)
      })
      .on('mouseout', function(_event, d) {
        d3.select(this)
          .attr('stroke', completedTasks.value.has(d.id) ? '#10b981' : '#fff')
          .attr('stroke-width', completedTasks.value.has(d.id) ? 3 : 2)
        
        // Restore original link opacity
        link.style('stroke-opacity', function(l) {
          const target = l.target as TaskNode
          
          // Recalculate original opacity
          const incomingCount = links.filter(link => 
            (link.target as TaskNode).id === target.id
          ).length
          
          const source = l.source as TaskNode
          const levelDistance = Math.abs(target.level - source.level)
          
          const connectionOpacity = Math.max(0.05, 0.3 - (incomingCount / 30))
          const distanceOpacity = Math.max(0.3, 1 - (levelDistance / 20))
          
          return connectionOpacity * distanceOpacity
        })
        .style('stroke-width', 1)
        
        d3.select(this.parentNode as SVGGElement)
          .select('.node-label')
          .remove()
      })

    // Add labels for larger nodes
    node.append('text')
      .attr('dy', 4)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#fff')
      .style('pointer-events', 'none')
      .text(d => {
        // Show "A" for tasks without a specific map or on "any" map
        if (!d.map || d.map.toLowerCase().includes('any')) {
          return 'A'
        }
        // Show first letter of the map name
        return d.map.charAt(0).toUpperCase()
      })

    // Create custom force to constrain nodes between their level circles
    function radialForce() {
      function force(_alpha: number) {
        nodes.forEach(node => {
          if (node.fx != null && node.fy != null) return // Skip fixed nodes (using != to check both null and undefined)
          
          const dx = node.x! - centerX
          const dy = node.y! - centerY
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          // Calculate min and max radius for this level
          const currentLevelRadius = baseRadius + (node.level * radiusStep)
          const prevLevelRadius = node.level === 0 ? 0 : baseRadius + ((node.level - 1) * radiusStep)
          
          let minRadius: number, maxRadius: number
          if (node.level === 0) {
            minRadius = 0
            maxRadius = baseRadius * 0.7
          } else {
            const padding = radiusStep * 0.15
            minRadius = prevLevelRadius + padding
            maxRadius = currentLevelRadius - padding
          }
          
          // Constrain distance strictly to bounds
          let targetDistance = distance
          
          if (distance < minRadius) {
            targetDistance = minRadius
          } else if (distance > maxRadius) {
            targetDistance = maxRadius
          }
          
          // Apply strong correction if outside bounds
          if (distance !== targetDistance && distance > 0) {
            const scale = targetDistance / distance
            node.x = centerX + dx * scale
            node.y = centerY + dy * scale
            node.vx = node.vx! * 0.5 // Dampen velocity when correcting
            node.vy = node.vy! * 0.5
          }
        })
      }
      return force
    }

    // Custom charge force that only applies between nodes at the same level
    function sameLevelChargeForce() {
      function force(alpha: number) {
        const strength = 5000 // Strong repulsion to spread nodes out
        
        for (let i = 0; i < nodes.length; i++) {
          const nodeA = nodes[i]
          if (!nodeA || nodeA.fx != null && nodeA.fy != null) continue // Skip fixed nodes
          
          for (let j = i + 1; j < nodes.length; j++) {
            const nodeB = nodes[j]
            if (!nodeB || nodeB.fx != null && nodeB.fy != null) continue // Skip fixed nodes
            
            // Only apply force if nodes are at the same level
            if (nodeA.level !== nodeB.level) continue
            
            const dx = nodeB.x! - nodeA.x!
            const dy = nodeB.y! - nodeA.y!
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            if (distance === 0) continue
            
            // Apply repulsion force
            const forceStrength = (strength * alpha) / (distance * distance)
            const fx = (dx / distance) * forceStrength
            const fy = (dy / distance) * forceStrength
            
            nodeA.vx! -= fx
            nodeA.vy! -= fy
            nodeB.vx! += fx
            nodeB.vy! += fy
          }
        }
      }
      return force
    }

    // Create force simulation with custom radial constraints
    simulation.value = d3.forceSimulation(nodes)
      .force('link', d3.forceLink<TaskNode, TaskLink>(links)
        .id(d => d.id)
        .distance(d => {
          // Calculate distance based on level difference
          const source = d.source as TaskNode
          const target = d.target as TaskNode
          const levelDiff = Math.abs(target.level - source.level)
          return levelDiff * radiusStep * 0.8 // Links should span the radial distance between levels
        })
        .strength(d => {
          // Reduce link strength based on degree (number of connections)
          const target = d.target as TaskNode
          
          // Count connections for target node
          const targetConnections = links.filter(l => 
            (l.source as TaskNode).id === target.id || (l.target as TaskNode).id === target.id
          ).length
          
          // Base strength reduced by degree - nodes with many connections pull less
          const baseStrength = 0.3 // Increased from 0.05 for stronger link pull
          const strengthReduction = Math.min(targetConnections / 20, 1) // More aggressive: reduced from 50 to 20, cap increased to 95%
          
          return baseStrength * (1 - strengthReduction)
        })
      )
      .force('charge', sameLevelChargeForce()) // Custom charge that only affects same-level nodes
      .force('radial', radialForce())
      .force('collision', d3.forceCollide().radius((d) => getLevelRadius((d as TaskNode).level) + 2))
      .alphaMin(0.001) // Keep simulation barely active instead of stopping completely
      .alphaDecay(0.005) // Even slower cooling
      .velocityDecay(0.6) // Increased friction to stabilize faster
      .on('tick', ticked)

    // Render function
    function ticked() {
      // Hard constraint: clamp node positions to their level bounds
      nodes.forEach(node => {
        if (node.fx != null && node.fy != null) return // Skip dragged nodes (using != to check both null and undefined)
        
        const dx = node.x! - centerX
        const dy = node.y! - centerY
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        // Calculate min and max radius for this level
        const currentLevelRadius = baseRadius + (node.level * radiusStep)
        const prevLevelRadius = node.level === 0 ? 0 : baseRadius + ((node.level - 1) * radiusStep)
        
        let minRadius: number, maxRadius: number
        if (node.level === 0) {
          minRadius = 0
          maxRadius = baseRadius * 0.8
        } else {
          const padding = radiusStep * 0.2
          minRadius = prevLevelRadius + padding
          maxRadius = currentLevelRadius - padding
        }
        
        // Clamp to bounds
        let wasClamped = false
        if (distance < minRadius && distance > 0) {
          const scale = minRadius / distance
          node.x = centerX + dx * scale
          node.y = centerY + dy * scale
          wasClamped = true
        } else if (distance > maxRadius) {
          const scale = maxRadius / distance
          node.x = centerX + dx * scale
          node.y = centerY + dy * scale
          wasClamped = true
        }
        
        // If we clamped position, heavily dampen velocity
        if (wasClamped) {
          node.vx = node.vx! * 0.1
          node.vy = node.vy! * 0.1
        }
      })
      
      link
        .attr('x1', d => (d.source as TaskNode).x!)
        .attr('y1', d => (d.source as TaskNode).y!)
        .attr('x2', d => (d.target as TaskNode).x!)
        .attr('y2', d => (d.target as TaskNode).y!)

      node.attr('transform', d => `translate(${d.x},${d.y})`)
    }

    function dragStarted(event: any, d: TaskNode) {
      if (!event.active) {
        simulation.value?.alphaTarget(0.3).restart() // Restart simulation with moderate heat
      }
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event: any, d: TaskNode) {
      // Constrain drag position to node's level bounds
      const dx = event.x - centerX
      const dy = event.y - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // Calculate min and max radius for this level
      const currentLevelRadius = baseRadius + (d.level * radiusStep)
      const prevLevelRadius = d.level === 0 ? 0 : baseRadius + ((d.level - 1) * radiusStep)
      
      let minRadius: number, maxRadius: number
      if (d.level === 0) {
        minRadius = 0
        maxRadius = baseRadius * 0.8
      } else {
        const padding = radiusStep * 0.2
        minRadius = prevLevelRadius + padding
        maxRadius = currentLevelRadius - padding
      }
      
      // Clamp the drag position to bounds
      let constrainedDistance = distance
      if (distance < minRadius && distance > 0) {
        constrainedDistance = minRadius
      } else if (distance > maxRadius) {
        constrainedDistance = maxRadius
      }
      
      if (distance > 0 && constrainedDistance !== distance) {
        const scale = constrainedDistance / distance
        d.fx = centerX + dx * scale
        d.fy = centerY + dy * scale
      } else {
        d.fx = event.x
        d.fy = event.y
      }
    }

    function dragEnded(event: any, d: TaskNode) {
      if (!event.active) {
        simulation.value?.alphaTarget(0) // Reset to 0, let natural decay take over
      }
      
      // Before releasing fixed position, ensure node is within bounds
      const dx = d.x! - centerX
      const dy = d.y! - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // Calculate min and max radius for this level
      const currentLevelRadius = baseRadius + (d.level * radiusStep)
      const prevLevelRadius = d.level === 0 ? 0 : baseRadius + ((d.level - 1) * radiusStep)
      
      let minRadius: number, maxRadius: number
      if (d.level === 0) {
        minRadius = 0
        maxRadius = baseRadius * 0.8
      } else {
        const padding = radiusStep * 0.2
        minRadius = prevLevelRadius + padding
        maxRadius = currentLevelRadius - padding
      }
      
      // Clamp position before releasing
      if (distance < minRadius && distance > 0) {
        const scale = minRadius / distance
        d.x = centerX + dx * scale
        d.y = centerY + dy * scale
      } else if (distance > maxRadius) {
        const scale = maxRadius / distance
        d.x = centerX + dx * scale
        d.y = centerY + dy * scale
      }
      
      // Reset velocity to prevent immediate movement after release
      d.vx = 0
      d.vy = 0
      
      // Clear fixed position
      d.fx = null
      d.fy = null
    }
  }

  const updateNodeStyles = () => {
    // Only update node styles based on completion state without recreating simulation
    if (!nodesSelection.value) return

    nodesSelection.value.selectAll('circle')
      .attr('fill', d => {
        const taskNode = d as TaskNode
        if (completedTasks.value.has(taskNode.id)) {
          return '#555' // Gray for completed tasks
        }
        return getTraderColor(taskNode.trader)
      })
      .attr('stroke', d => {
        const taskNode = d as TaskNode
        if (completedTasks.value.has(taskNode.id)) {
          return '#10b981'
        }
        return '#fff'
      })
      .attr('stroke-width', d => completedTasks.value.has((d as TaskNode).id) ? 3 : 2)
      .style('opacity', d => completedTasks.value.has((d as TaskNode).id) ? 0.6 : 1)
  }

  const updateLevelCircles = () => {
    // Update visibility of level circles based on maxLevel
    if (!levelCirclesGroup.value) return

    levelCirclesGroup.value.selectAll('circle')
      .style('display', function() {
        const level = Number(d3.select(this).attr('data-level'))
        return level <= maxLevel.value ? 'block' : 'none'
      })

    levelCirclesGroup.value.selectAll('text')
      .style('display', function() {
        const level = Number(d3.select(this).attr('data-level'))
        return level <= maxLevel.value ? 'block' : 'none'
      })
  }

  const updateSimulation = () => {
    initSimulation()
  }

  // Watch for task list changes (filters) - need full reinit
  watch(tasks, (newTasks, oldTasks) => {
    if (newTasks.length > 0 && newTasks !== oldTasks) {
      // Check if it's a filter change (different tasks) vs just a reference change
      const newIds = new Set(newTasks.map(t => t.id))
      const oldIds = new Set(oldTasks?.map(t => t.id) || [])
      
      const idsChanged = newIds.size !== oldIds.size || 
                         ![...newIds].every(id => oldIds.has(id))
      
      if (idsChanged) {
        // Task list changed (filters), need full reinit
        updateSimulation()
      }
    }
  }, { deep: false }) // Don't need deep watch for task array changes

  // Watch for completion changes - only update styles
  watch(completedTasks, () => {
    updateNodeStyles()
  }, { deep: true })

  // Watch for max level changes - only update circle visibility
  watch(maxLevel, () => {
    updateLevelCircles()
  })

  onUnmounted(() => {
    simulation.value?.stop()
  })

  return {
    initSimulation,
    updateSimulation,
    updateNodeStyles
  }
}
