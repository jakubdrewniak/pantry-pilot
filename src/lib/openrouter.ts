/**
 * OpenRouter singleton instance
 *
 * Provides a pre-configured OpenRouterService instance for use throughout the application.
 * Configured with environment variables and sensible defaults.
 * Uses lazy initialization to avoid build-time errors.
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
 * Cached singleton instance
 */
let instance: OpenRouterService | null = null

/**
 * Lazily initialized OpenRouterService singleton
 *
 * Creates the instance on first access, ensuring environment variables
 * are available at runtime rather than build time.
 *
 * @throws {Error} If OPENROUTER_API_KEY is not set at runtime
 */
function getOpenRouterInstance(): OpenRouterService {
  if (!instance) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error(
        'OPENROUTER_API_KEY environment variable is required but not set. ' +
          'Please configure it in your .env.local file or environment.'
      )
    }

    instance = new OpenRouterService({
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultModel: process.env.OPENROUTER_DEFAULT_MODEL || 'openai/gpt-4o',
      defaultParams: {
        temperature: 0.7,
        max_tokens: 1024,
      },
    })
  }

  return instance
}

/**
 * Singleton instance of OpenRouterService with lazy initialization
 *
 * Access this property to get the OpenRouterService instance.
 * The instance is created on first access, not at module load time.
 *
 * This ensures:
 * - No build-time requirement for OPENROUTER_API_KEY
 * - Environment variables are read at runtime (server-side only)
 * - Same transparent API for all consumers
 */
export const openRouter = new Proxy({} as OpenRouterService, {
  get(_target, prop) {
    const instance = getOpenRouterInstance()
    const value = instance[prop as keyof OpenRouterService]

    // Bind methods to the instance to preserve 'this' context
    if (typeof value === 'function') {
      return value.bind(instance)
    }

    return value
  },
})
