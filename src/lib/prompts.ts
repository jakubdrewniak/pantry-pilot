/**
 * System prompts for AI recipe generation
 *
 * Centralized location for all system prompts used in recipe generation.
 * This makes it easy to refactor, test, and maintain prompts.
 */

/**
 * System prompt for recipe generation
 *
 * Instructs the AI to generate recipes in a structured format that matches
 * the Recipe schema. The prompt emphasizes clarity, practical instructions,
 * and accurate ingredient quantities.
 */
export const RECIPE_GENERATION_SYSTEM_PROMPT = `You are an expert culinary assistant specializing in creating practical, delicious recipes. Your task is to generate recipes that are:

1. **Clear and actionable**: Instructions should be step-by-step and easy to follow
2. **Accurate**: Ingredient quantities should be realistic and precise
3. **Practical**: Recipes should be achievable for home cooks
4. **Complete**: Include all necessary ingredients and clear instructions

When generating a recipe:
- Use common, accessible ingredients
- Provide specific quantities with appropriate units (e.g., "2 cups", "500g", "1 tablespoon")
- Break down instructions into clear, numbered steps
- Include prep time and cook time when relevant
- Suggest a meal type (breakfast, lunch, dinner, snack, dessert) when appropriate

Always return your response as valid JSON matching the required schema structure.`

/**
 * Builds a user prompt for recipe generation
 *
 * @param hint - User's hint or description of desired recipe
 * @param pantryItems - Optional list of pantry items to use in the recipe
 * @returns Formatted user prompt
 */
export function buildRecipeGenerationPrompt(
  hint: string,
  pantryItems?: Array<{ name: string; quantity: number; unit: string | null }>
): string {
  let prompt = `Generate a recipe based on the following: ${hint}`

  if (pantryItems && pantryItems.length > 0) {
    const itemsList = pantryItems
      .map(item => {
        const quantity = item.quantity > 0 ? `${item.quantity} ` : ''
        const unit = item.unit ? `${item.unit} of ` : ''
        return `- ${quantity}${unit}${item.name}`
      })
      .join('\n')

    prompt += `\n\nPlease prioritize using these available pantry items:\n${itemsList}\n\nYou can suggest additional ingredients that are commonly available, but try to maximize the use of the provided pantry items.`
  }

  prompt +=
    '\n\nReturn the recipe as a JSON object with the following structure:\n' +
    '- title: A descriptive name for the recipe\n' +
    '- ingredients: Array of objects with name, quantity (number), and optional unit\n' +
    '- instructions: Step-by-step cooking instructions as a string\n' +
    '- mealType: Optional meal type (e.g., "breakfast", "lunch", "dinner", "snack", "dessert")\n' +
    '- prepTime: Optional preparation time in minutes\n' +
    '- cookTime: Optional cooking time in minutes'

  return prompt
}
