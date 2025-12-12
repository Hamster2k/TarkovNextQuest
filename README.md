# Tarkov Next Quest 🎯

An interactive quest dependency visualization for Escape from Tarkov, built with Vue 3, TypeScript, and D3.js force-directed graphs.

![Tarkov Quest Tree Visualization](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript)
![D3.js](https://img.shields.io/badge/D3.js-7.9-f9a03c?logo=d3.js)

## ✨ Features

### 🗺️ Interactive Force-Directed Graph
- **79 level circles** with dynamic visibility
- **Radial layout** organizing quests by level requirement
- **Smart link opacity** (reduces clutter for hub quests like Collector)
- **Drag nodes** to rearrange (constrained to level circles)
- **Zoom and pan** for detailed exploration
- **Hover highlighting** for quest connections

### 🎮 Quest Management
- **Track completion** - Double-click quests to mark complete
- **Automatic prerequisites** - Completing a quest auto-completes all prerequisites
- **Recursive dependencies** - Uncompleting a quest auto-uncompletes dependents
- **Progress persistence** - LocalStorage saves your progress
- **Recommended quest** - Smart suggestions for what to do next

### 🔍 Advanced Filtering
- **Trader filters** - Show/hide quests by trader (10 traders)
- **Map filters** - Filter by location (11 maps + "Any")
- **Level slider** - Hide quests above your current level (1-79)
- **Kappa requirement** - Filter quests needed for Kappa container
- **Lightkeeper requirement** - Filter Lightkeeper-specific quests
- **Only Unlocked** - Show only quests you can currently start

### 📊 Visual Features
- **Trader-based colors** - Each trader has a unique color
- **Completion indicators** - Gray nodes with green borders
- **Task counts** - Real-time count of incomplete quests per filter
- **Map badges** - See which map each quest takes place on
- **Level indicators** - Visual level circles with color coding
- **Glass morphism UI** - Modern, semi-transparent overlay panels

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/TarkovNextQuest.git
cd TarkovNextQuest

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the app.

### Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

## 🐳 Docker Deployment

Deploy with Docker for production:

```bash
# Build and start with Docker Compose
docker-compose up -d

# Access at http://localhost:3000
```

See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) for detailed deployment instructions.

## 🛠️ Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe development
- **D3.js** - Force-directed graph visualization
- **Vite** - Lightning-fast build tool
- **GraphQL** - Tarkov.dev API integration
- **Docker** - Containerized deployment with nginx

## 📁 Project Structure

```
src/
├── components/
│   ├── ForceTreeVisualization.vue  # D3 graph container
│   ├── TaskDetails.vue             # Quest info sidebar
│   ├── LevelLegend.vue             # Filter controls
│   └── RecommendedQuest.vue        # Smart quest suggestions
├── composables/
│   ├── useForceSimulation.ts       # D3 force simulation logic
│   └── useTarkovTasks.ts           # API data fetching
├── services/
│   ├── tarkovApi.ts                # GraphQL queries
│   └── taskProcessor.ts            # Data transformation
├── types/
│   └── tasks.ts                    # TypeScript interfaces
└── App.vue                         # Root component
```

## 🎨 Key Features Explained

### Force Simulation
- **Radial constraints** keep nodes on their level circles
- **Same-level charge force** spreads nodes apart for clarity
- **Dynamic link strength** reduces pull from highly-connected nodes
- **Smart opacity** fades links based on connection count and level distance
- **Position preservation** maintains layout when toggling completion

### Filter System
- **Computed reactivity** - All filters work together seamlessly
- **Real-time counts** - Badge numbers update as you filter
- **Unlocked logic** - Intelligently checks prerequisite completion
- **Collapsible sections** - Organize controls into logical groups

### Quest Recommendation
- **Level-based priority** - Suggests lowest level available quest
- **Kappa/Lightkeeper aware** - Respects your filter preferences
- **Unlocked-only** - Only suggests quests you can actually start
- **Quick complete** - One-click completion from recommendation card

## 📊 Data Source

Quest data is fetched from the [Tarkov.dev API](https://tarkov.dev/), a community-maintained database of Escape from Tarkov game data.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Quest data provided by [Tarkov.dev](https://tarkov.dev/)
- Force-directed graph visualization powered by [D3.js](https://d3js.org/)
- Built with [Vue 3](https://vuejs.org/) and [Vite](https://vitejs.dev/)

## 📸 Screenshots

> Add screenshots of your application here

---

**Note:** This is a fan-made tool and is not affiliated with Battlestate Games or Escape from Tarkov.
