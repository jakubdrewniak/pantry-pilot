/**
 * OpenRouter singleton instance
 *
 * Provides a pre-configured OpenRouterService instance for use throughout the application.
 * Configured with environment variables and sensible defaults.
 *
 * @example
 * ```ts
 * import { openRouter } from '@/lib/openrouter'
 *
 * const response = await openRouter.generateChatCompletion({
 *   messages: [{ role: "user", content: "Hello!" }]
 * });
 * ```
 */

import { OpenRouterService } from './openrouter-service'

/**
 * Singleton instance of OpenRouterService
 *
 * Initialized with:
 * - API key from environment variables
 * - Default model: openai/gpt-4o
 * - Default parameters: temperature 0.7, max_tokens 1024
 */
export const openRouter = new OpenRouterService({
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultModel: process.env.OPENROUTER_DEFAULT_MODEL || 'openai/gpt-4o',
  defaultParams: {
    temperature: 0.7,
    max_tokens: 1024,
  },
})
