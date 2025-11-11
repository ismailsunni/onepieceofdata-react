# One Piece of Data - React

A modern React-based data exploration application for the One Piece universe.

## Features

- 🎨 Built with React 18 and TypeScript
- 💨 Powered by Vite for fast development
- 🎯 Styled with TailwindCSS
- ✅ ESLint and Prettier for code quality
- 📦 Ready for GitHub Pages deployment

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd onepieceofdata-react
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Project Structure

```
src/
├── components/     # Reusable React components
├── styles/         # CSS and styling files
├── App.tsx         # Main application component
├── main.tsx        # Application entry point
└── index.css       # Global styles with Tailwind directives
```

## Tech Stack

- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Deployment

This project uses **GitHub Actions** for automatic deployment to GitHub Pages.

### Automatic Deployment

Every push to the `master` branch automatically triggers a deployment. The workflow:
1. Checks out your code
2. Installs dependencies
3. Builds the production bundle
4. Deploys to GitHub Pages

### First-Time Setup

To enable GitHub Pages, you need to configure it once in your repository:

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. The site will be available at: `https://ismailsunni.github.io/onepieceofdata-react/`

That's it! Every future push to `master` will automatically deploy your changes.

## Learning React

This project structure is beginner-friendly and demonstrates:

- **Component-based architecture** - See `Header.tsx` and `Card.tsx`
- **Props and TypeScript interfaces** - Check the `Card` component
- **TailwindCSS styling** - Utility classes for responsive design
- **Project organization** - Clean folder structure

## Next Steps

- Add routing with React Router
- Integrate with Supabase for data
- Create data tables with TanStack Table
- Add data visualization with Recharts

## License

ISC
