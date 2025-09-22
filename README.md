# Pantry Pilot

A modern web application for streamlining meal planning with AI-powered recipe generation. Users can track pantry inventory, create and edit recipes in Markdown, generate recipes based on available ingredients using AI, and compile shopping lists. Real-time collaboration allows invited users to jointly manage pantries and shopping lists.

## 🚀 Quick Start

### Prerequisites

- Node.js 20.19.0 (use `.nvmrc` for automatic version management)
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd pantry-pilot
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Node version (optional, with nvm)**

   ```bash
   nvm use
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── globals.css      # Global styles and Tailwind imports
│   ├── layout.tsx       # Root layout with ThemeProvider
│   └── page.tsx         # Welcome page
├── components/          # React components
│   ├── layout/          # Layout components (header, footer, etc.)
│   ├── ui/              # shadcn/ui components
│   └── theme-provider.tsx # Dark mode provider
├── db/                  # Database configuration and Supabase setup
├── lib/                 # Utility functions and helpers
├── types/               # TypeScript interfaces and DTOs
└── middleware.ts        # Next.js middleware for routing/auth
```

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 3** - Utility-first CSS framework
- **shadcn/ui** - Modern component library

### Backend & Database

- **Supabase** - Backend-as-a-Service (PostgreSQL, Auth, Realtime)
- **Next.js API Routes** - Serverless functions

### AI Integration

- **OpenRouter.ai** - LLM-powered recipe generation

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit quality checks
- **commitlint** - Conventional commit enforcement

## 🏃 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Format code with Prettier
npm run format

# Prepare husky hooks (runs automatically)
npm run prepare
```

### Code Quality

This project uses several tools to maintain code quality:

- **ESLint**: Configured with Next.js and TypeScript rules
- **Prettier**: Consistent code formatting
- **Husky**: Git hooks for pre-commit quality checks
- **lint-staged**: Runs ESLint and Prettier on staged files
- **commitlint**: Enforces conventional commit format

### Commit Convention

This project uses [Conventional Commits](https://conventionalcommits.org/) format:

```bash
# Examples:
git commit -m "feat: add user authentication"
git commit -m "fix: resolve login form validation bug"
git commit -m "docs: update API documentation"
git commit -m "style: format components with Prettier"
```

## 🎨 UI Components

The project uses [shadcn/ui](https://ui.shadcn.com/) for consistent, accessible components:

- **Button** - Customizable button component with variants
- **Card** - Content containers with header/footer support
- **Input** - Form inputs with proper styling
- **Badge** - Status indicators and tags
- **Label** - Accessible form labels

Components are built with:

- **Tailwind CSS** for styling
- **Radix UI** for accessibility and behavior
- **class-variance-authority** for variant management
- **Lucide React** for icons

## 🌙 Theme Support

The application supports both light and dark themes:

- Automatic system preference detection
- Manual theme switching capability
- CSS variables for consistent theming

## 🔧 Configuration Files

- `components.json` - shadcn/ui CLI configuration
- `tailwind.config.ts` - Tailwind CSS customization
- `eslint.config.js` - ESLint flat configuration
- `commitlint.config.js` - Commit message conventions
- `next.config.ts` - Next.js configuration
- `postcss.config.mjs` - PostCSS with Tailwind and Autoprefixer

## 🚀 Deployment

### Environment Variables

Create a `.env.local` file with required environment variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenRouter AI Configuration
OPENROUTER_API_KEY=your_openrouter_api_key
```

### Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write clear, concise commit messages
- Test your changes thoroughly
- Update documentation as needed

## 📄 License

This project is private and proprietary.

---

**Built with ❤️ using Next.js, React, and TypeScript**
