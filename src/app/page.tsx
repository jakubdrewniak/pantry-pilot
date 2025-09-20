import { Button } from "@/components/ui/button"
import { ChefHat, Sparkles, Heart } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <ChefHat className="h-16 w-16 text-blue-600 dark:text-blue-400" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Pantry Pilot
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Streamline meal planning with AI-powered recipe generation
          </p>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              Step 2 Complete! 🎉
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Additional dependencies installed and configured
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-800 dark:text-white">✅ Installed Packages:</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• next-themes (dark mode support)</li>
                  <li>• class-variance-authority (component variants)</li>
                  <li>• clsx & tailwind-merge (utility functions)</li>
                  <li>• lucide-react (icons)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-gray-800 dark:text-white">✅ TypeScript Types:</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• @types/node</li>
                  <li>• @types/react</li>
                  <li>• @types/react-dom</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="default" size="lg" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Get Started
            </Button>
            <Button variant="outline" size="lg" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Learn More
            </Button>
          </div>

          <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            <p>Tech Stack: Next.js 15 • React 19 • TypeScript • Tailwind CSS • ESLint v9</p>
          </div>
        </div>
      </div>
    </div>
  );
}
