import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChefHat, Sparkles, Heart, CheckCircle } from "lucide-react"

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Step 2 Complete! 🎉
                </CardTitle>
                <CardDescription>
                  Core dependencies and utilities configured
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">✅ Installed Packages:</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">next-themes</Badge>
                      <Badge variant="secondary">class-variance-authority</Badge>
                      <Badge variant="secondary">clsx</Badge>
                      <Badge variant="secondary">tailwind-merge</Badge>
                      <Badge variant="secondary">lucide-react</Badge>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">✅ TypeScript Types:</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">@types/node</Badge>
                      <Badge variant="outline">@types/react</Badge>
                      <Badge variant="outline">@types/react-dom</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  Step 3 Complete! ✨
                </CardTitle>
                <CardDescription>
                  shadcn/ui components and configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">✅ shadcn/ui Setup:</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="default">components.json</Badge>
                      <Badge variant="default">New York style</Badge>
                      <Badge variant="default">Neutral theme</Badge>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">✅ Components Created:</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge>Button</Badge>
                      <Badge>Card</Badge>
                      <Badge>Badge</Badge>
                      <Badge>Input</Badge>
                      <Badge>Label</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="max-w-md mx-auto mb-8">
            <CardHeader>
              <CardTitle>Demo Form</CardTitle>
              <CardDescription>
                Test the new shadcn/ui components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Enter your name" />
              </div>
              <Button className="w-full">Submit</Button>
            </CardContent>
          </Card>

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
