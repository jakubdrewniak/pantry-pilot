import Link from 'next/link'
import { BookOpen, ChefHat, ShoppingCart, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const tiles = [
  {
    name: 'Recipes',
    href: '/recipes',
    icon: BookOpen,
    description: 'Browse, create, and AI-generate recipes from your pantry ingredients',
  },
  {
    name: 'Pantry',
    href: '/pantry',
    icon: ChefHat,
    description: 'Track your pantry inventory and available ingredients',
  },
  {
    name: 'Shopping',
    href: '/shopping',
    icon: ShoppingCart,
    description: 'Build shopping lists from recipes and share with your household',
  },
  {
    name: 'Household',
    href: '/household',
    icon: Users,
    description: 'Invite members and collaborate on pantry and shopping lists',
  },
]

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">Welcome to Pantry Pilot</h1>
        <p className="mt-2 text-muted-foreground">What would you like to do today?</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(({ name, href, icon: Icon, description }) => (
          <Link key={href} href={href}>
            <Card className="h-full cursor-pointer transition-colors hover:bg-accent">
              <CardHeader>
                <Icon className="mb-2 h-8 w-8 text-primary" aria-hidden="true" />
                <CardTitle>{name}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
