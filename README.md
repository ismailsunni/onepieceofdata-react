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
- `npm run deploy` - Deploy to GitHub Pages

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

This project is configured for GitHub Pages deployment:

1. Update the `base` in `vite.config.ts` to match your repository name
2. Run the deployment command:
```bash
npm run deploy
```

The app will be deployed to `https://<username>.github.io/<repo-name>/`

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
