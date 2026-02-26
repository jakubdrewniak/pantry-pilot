# Shadcn UI Components

This project uses @shadcn/ui for user interface components. These are beautifully designed, accessible components that can be customized for your application.

## Style configuration

This project uses the **"new-york"** style variant with **"neutral"** base color and CSS variables for theming, per `components.json`.

## Finding installed components

Components are available in the `src/components/ui` folder, according to the aliases from the `components.json` file.

## Using a component

Import using the configured `@/` alias:

```tsx
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
```

## Installing additional components

Use the shadcn CLI (note: `npx shadcn-ui@latest` is deprecated):

```bash
npx shadcn@latest add [component-name]
```

Available components include: Accordion, Alert, AlertDialog, AspectRatio, Avatar, Calendar, Checkbox, Collapsible, Command, ContextMenu, DataTable, DatePicker, Dropdown Menu, Form, Hover Card, Menubar, Navigation Menu, Popover, Progress, Radio Group, ScrollArea, Select, Separator, Sheet, Skeleton, Slider, Switch, Table, Textarea, Sonner (Toast), Toggle, Tooltip.
