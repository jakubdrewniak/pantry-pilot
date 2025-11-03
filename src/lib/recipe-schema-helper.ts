/**
 * Helper functions for converting Zod schemas to JSON Schema format
 * for use with OpenRouter's structured output feature
 */

import { zodToJsonSchema } from 'zod-to-json-schema'
import { RecipeSchema } from '@/lib/validation/recipes'
import type { ResponseFormat } from './openrouter-service'

/**
 * Converts RecipeSchema to JSON Schema format compatible with OpenRouter
 *
 * This automatically converts the Zod RecipeSchema to JSON Schema 7-compatible
 * format that OpenRouter can use for structured output validation.
 * This ensures a single source of truth - the RecipeSchema definition.
 *
 * @returns JSON Schema object for recipe validation
 */
function createRecipeJsonSchema(): Record<string, unknown> {
  // Convert Zod schema to JSON Schema
  const jsonSchema = zodToJsonSchema(RecipeSchema, {
    name: 'Recipe',
    target: 'jsonSchema7',
    $refStrategy: 'none',
  })

  // Convert to plain object and extract schema from definitions if needed
  let schema = JSON.parse(JSON.stringify(jsonSchema)) as Record<string, unknown>

  // Extract actual schema from definitions (OpenRouter doesn't support $ref)
  if ('$ref' in schema && 'definitions' in schema) {
    const definitions = schema.definitions as Record<string, unknown>
    schema = (definitions.Recipe || schema) as Record<string, unknown>
  }

  // Remove metadata
  delete schema.$schema
  delete schema.definitions

  // Normalize schema for OpenRouter compatibility
  function normalize(obj: Record<string, unknown>): void {
    // Convert exclusiveMinimum to minimum
    if (typeof obj.exclusiveMinimum === 'number') {
      obj.minimum = obj.exclusiveMinimum + Number.EPSILON
      delete obj.exclusiveMinimum
    }

    // Process nested properties first
    if (obj.properties && typeof obj.properties === 'object') {
      const properties = obj.properties as Record<string, unknown>
      for (const key in properties) {
        if (typeof properties[key] === 'object' && properties[key] !== null) {
          normalize(properties[key] as Record<string, unknown>)
        }
      }
    }

    // Process array items
    if (obj.items && typeof obj.items === 'object' && obj.items !== null) {
      normalize(obj.items as Record<string, unknown>)
    }

    // OpenRouter requires ALL properties to be in required array
    if (obj.properties && typeof obj.properties === 'object') {
      const properties = obj.properties as Record<string, unknown>
      const required = (obj.required as string[]) || []
      const allKeys = Object.keys(properties)
      const missing = allKeys.filter(k => !required.includes(k))
      if (missing.length > 0) {
        obj.required = [...required, ...missing]
      }
    }
  }

  normalize(schema)
  return schema
}

/**
 * Creates a ResponseFormat configuration for recipe generation
 *
 * @returns ResponseFormat with JSON schema for recipes
 */
export function createRecipeResponseFormat(): ResponseFormat {
  return {
    type: 'json_schema',
    json_schema: {
      name: 'recipe',
      strict: true,
      schema: createRecipeJsonSchema(),
    },
  }
}
