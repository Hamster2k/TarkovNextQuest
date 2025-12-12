# Project Setup Complete! 🎉

Your Tarkov Quest Tree Visualizer is now running at:
**http://localhost:5173/**

## What Was Built

### Architecture
- **Vue 3** with Composition API and TypeScript
- **D3.js Force-Directed Graph** for task visualization
- **GraphQL Client** fetching from api.tarkov.dev
- Modular component structure with composables

### Key Files Created

#### Core Application
- `src/App.vue` - Main application with layout
- `src/style.css` - Global dark theme styles

#### Components
- `ForceTreeVisualization.vue` - D3.js force graph component
- `TaskDetails.vue` - Sidebar panel for task information
- `LevelLegend.vue` - Color legend and help text

#### Business Logic (Composables)
- `useTarkovTasks.ts` - Data fetching composable
- `useForceSimulation.ts` - D3.js simulation logic

#### Services
- `tarkovApi.ts` - GraphQL query to Tarkov API
- `taskProcessor.ts` - Data transformation utilities

#### Types
- `tasks.ts` - TypeScript interfaces for type safety

## Features Implemented

✅ Fetches all Tarkov quests from API  
✅ Displays tasks as circles sized/colored by level requirement  
✅ Shows task dependencies with arrow links  
✅ Interactive drag, zoom, and pan controls  
✅ Click nodes to see detailed task information  
✅ Hover to highlight and show task names  
✅ Responsive layout with sidebar  
✅ Loading and error states  

## Visualization Details

### Node Encoding
- **Circle Size**: Based on level requirement (larger = higher level)
- **Circle Color**: Color-coded by level ranges
  - Light Blue (1-10)
  - Blue (11-20)
  - Purple (21-30)
  - Orange (31-40)
  - Red (41+)

### Interactions
- **Click**: Select task to view details
- **Drag**: Reposition individual nodes
- **Scroll**: Zoom in/out
- **Pan**: Click and drag background

### Graph Layout
- Uses D3's force simulation with:
  - Link force (task dependencies)
  - Many-body force (node repulsion)
  - Center force (keeps graph centered)
  - Collision force (prevents overlap)

## Next Steps / Enhancements

### Easy Additions
1. **Filtering**: Filter by trader, level range, or completion status
2. **Search**: Find specific tasks by name
3. **Local Storage**: Remember completed tasks
4. **Different Layouts**: Tree, radial, or hierarchical layouts

### Advanced Features
1. **Task Progress Tracking**: Mark tasks as complete
2. **Quest Line Highlighting**: Highlight specific quest chains
3. **Trader Grouping**: Cluster by trader
4. **Zoom to Fit**: Auto-zoom to show all nodes
5. **Export**: Save graph as PNG/SVG

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## How to Customize

### Change Colors
Edit `src/services/taskProcessor.ts` → `getLevelColor()` function

### Adjust Graph Physics
Edit `src/composables/useForceSimulation.ts` → force strengths and distances

### Modify Layout
Edit `src/App.vue` → change grid layout and styling

### Add More Task Data
Edit `src/services/tarkovApi.ts` → expand GraphQL query

## Troubleshooting

If you see errors:
1. Ensure dev server is running (`npm run dev`)
2. Check browser console for API errors
3. Verify API is accessible: https://api.tarkov.dev/graphql
4. Clear browser cache and reload

Enjoy exploring the Tarkov quest dependencies! 🎮
