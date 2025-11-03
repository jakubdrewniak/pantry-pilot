/**
 * OpenRouterService - Integration layer for OpenRouter API
 *
 * Provides a high-level, fully-typed interface for generating LLM chat completions
 * through the OpenRouter service. Encapsulates authorization, serialization,
 * response format handling, model versioning, and comprehensive error handling.
 *
 * @example
 * ```ts
 * const service = new OpenRouterService({
 *   apiKey: process.env.OPENROUTER_API_KEY!,
 *   defaultModel: "openai/gpt-4o",
 *   defaultParams: { temperature: 0.7, max_tokens: 1024 }
 * });
 *
 * const response = await service.generateChatCompletion({
 *   messages: [
 *     { role: "system", content: "You are a helpful assistant." },
 *     { role: "user", content: "Hello!" }
 *   ]
 * });
 * ```
 */

import { z } from 'zod'

/**
 * OpenRouter API message format
 */
export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Response format configuration for structured JSON output
 */
export interface ResponseFormat {
  type: 'json_schema' | 'text'
  json_schema?: {
    name: string
    strict: true
    schema: Record<string, unknown> // JSONSchema7-compatible
  }
}

/**
 * Arguments for chat completion request
 */
export interface ChatArgs {
  messages: Message[]
  model?: string
  responseFormat?: ResponseFormat
  params?: Record<string, unknown>
}

/**
 * Standard OpenRouter chat completion response
 */
export interface ChatCompletion {
  id: string
  model: string
  choices: Array<{
    message: Message
    finish_reason: string | null
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * Constructor options for OpenRouterService
 */
export interface OpenRouterServiceOptions {
  apiKey: string
  baseUrl?: string
  defaultModel?: string
  defaultParams?: {
    temperature?: number
    max_tokens?: number
    [key: string]: unknown
  }
}

/**
 * Base error class for OpenRouter service errors
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false
  ) {
    super(message)
    this.name = 'OpenRouterError'
    Object.setPrototypeOf(this, OpenRouterError.prototype)
  }
}

/**
 * Authentication error (401) - invalid or missing API key
 */
export class OpenRouterAuthError extends OpenRouterError {
  constructor(message: string = 'Invalid or missing API key') {
    super(message, 401, false)
    this.name = 'OpenRouterAuthError'
    Object.setPrototypeOf(this, OpenRouterAuthError.prototype)
  }
}

/**
 * Rate limit error (429) - too many requests
 */
export class OpenRouterRateLimitError extends OpenRouterError {
  constructor(
    message: string = 'Rate limit exceeded',
    public readonly resetAt?: number
  ) {
    super(message, 429, true)
    this.name = 'OpenRouterRateLimitError'
    Object.setPrototypeOf(this, OpenRouterRateLimitError.prototype)
  }
}

/**
 * Network error - connection issues, timeouts, DNS failures
 */
export class OpenRouterNetworkError extends OpenRouterError {
  constructor(message: string = 'Network error occurred') {
    super(message, undefined, true)
    this.name = 'OpenRouterNetworkError'
    Object.setPrototypeOf(this, OpenRouterNetworkError.prototype)
  }
}

/**
 * Parse error - JSON schema validation failed
 */
export class OpenRouterParseError extends OpenRouterError {
  constructor(
    message: string = 'Failed to parse response',
    public readonly rawResponse?: string
  ) {
    super(message, undefined, false)
    this.name = 'OpenRouterParseError'
    Object.setPrototypeOf(this, OpenRouterParseError.prototype)
  }
}

/**
 * Server error (5xx) - OpenRouter service issues
 */
export class OpenRouterServerError extends OpenRouterError {
  constructor(message: string = 'OpenRouter server error', statusCode?: number) {
    super(message, statusCode, statusCode ? statusCode >= 500 && statusCode < 600 : true)
    this.name = 'OpenRouterServerError'
    Object.setPrototypeOf(this, OpenRouterServerError.prototype)
  }
}

/**
 * Client error (4xx) - invalid request parameters
 */
export class OpenRouterClientError extends OpenRouterError {
  constructor(message: string = 'Invalid request', statusCode?: number) {
    super(message, statusCode || 400, false)
    this.name = 'OpenRouterClientError'
    Object.setPrototypeOf(this, OpenRouterClientError.prototype)
  }
}

/**
 * OpenRouterService class
 *
 * Provides a typed interface to the OpenRouter API with:
 * - Consistent error handling
 * - JSON schema validation
 * - Model and parameter management
 */
export class OpenRouterService {
  /**
   * Private API key - never logged or exposed
   */
  readonly #apiKey: string

  /**
   * Base URL for OpenRouter API
   */
  readonly #baseUrl: string

  /**
   * Default model to use if not specified in requests
   */
  #defaultModel: string | undefined

  /**
   * Default parameters for all requests
   */
  readonly #defaultParams: Record<string, unknown>

  /**
   * Request timeout in milliseconds (30 seconds)
   */
  readonly #timeout: number = 30000

  /**
   * System prompt (can be set dynamically)
   */
  #systemPrompt: string | undefined

  /**
   * Creates a new OpenRouterService instance
   *
   * @param options - Configuration options
   * @throws {Error} If apiKey is missing or empty
   *
   * @example
   * ```ts
   * const service = new OpenRouterService({
   *   apiKey: process.env.OPENROUTER_API_KEY!,
   *   defaultModel: "openai/gpt-4o",
   *   defaultParams: { temperature: 0.7 }
   * });
   * ```
   */
  constructor(options: OpenRouterServiceOptions) {
    // Validate API key presence
    if (!options.apiKey || options.apiKey.trim().length === 0) {
      throw new Error('OpenRouterService: apiKey is required and cannot be empty')
    }

    this.#apiKey = options.apiKey
    this.#baseUrl = options.baseUrl || 'https://openrouter.ai/api/v1'
    this.#defaultModel = options.defaultModel
    this.#defaultParams = options.defaultParams || {}

    // Validate baseUrl is HTTPS (except for localhost in development)
    if (!this.#baseUrl.startsWith('https://') && !this.#baseUrl.includes('localhost')) {
      throw new Error(
        'OpenRouterService: baseUrl must use HTTPS for security (localhost allowed for development)'
      )
    }
  }

  /**
   * Builds HTTP headers for OpenRouter API requests
   *
   * @private
   * @param responseFormat - Optional response format to determine if JSON schema header is needed
   * @returns Headers object with Authorization, Content-Type, and optional OpenRouter-Response-Format
   */
  #buildHeaders(responseFormat?: ResponseFormat): HeadersInit {
    const headers: HeadersInit = {
      Authorization: `Bearer ${this.#apiKey}`,
      'Content-Type': 'application/json',
    }

    if (responseFormat?.type === 'json_schema') {
      headers['OpenRouter-Response-Format'] = 'json'
    }

    return headers
  }

  /**
   * Builds request body for OpenRouter API
   *
   * @private
   * @param args - Chat completion arguments
   * @returns Formatted request body
   */
  #buildBody(args: ChatArgs): Record<string, unknown> {
    const messages = [...args.messages]

    // Prepend system prompt if set
    if (this.#systemPrompt) {
      const hasSystemMessage = messages.some(msg => msg.role === 'system')
      if (!hasSystemMessage) {
        messages.unshift({ role: 'system', content: this.#systemPrompt })
      }
    }

    const body: Record<string, unknown> = {
      model: args.model || this.#defaultModel,
      messages,
    }

    const mergedParams = {
      ...this.#defaultParams,
      ...args.params,
    }

    Object.assign(body, mergedParams)

    if (args.responseFormat?.type === 'json_schema') {
      body.response_format = {
        type: 'json_schema',
        json_schema: args.responseFormat.json_schema,
      }
    }

    return body
  }

  /**
   * Handles errors from OpenRouter API and converts them to domain errors
   *
   * @private
   * @param error - Error response or network error
   * @param response - Fetch Response object if available
   * @param responseText - Optional response text (if already read)
   * @returns Appropriate OpenRouterError instance
   */
  #handleError(error: unknown, response?: Response, responseText?: string): OpenRouterError {
    // Network errors (timeout, DNS, connection failures)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new OpenRouterNetworkError('Network request failed. Please check your connection.')
    }

    if (!response) {
      return new OpenRouterNetworkError('No response received from OpenRouter API')
    }

    const status = response.status

    let errorMessage = `Invalid request (${status}). Please check your parameters.`

    let errorText = responseText

    if (!errorText) {
      // Try to read response if not already provided
      try {
        // Note: This might fail if body is already consumed
        errorText = '' // Will be set by async read if needed
      } catch {
        // Ignore - we'll use default error message
      }
    }

    if (errorText) {
      console.error('OpenRouter API error - raw response:', errorText)

      try {
        const errorData = JSON.parse(errorText)
        errorMessage =
          errorData.error?.message || errorData.message || errorData.error || errorMessage
        console.error('OpenRouter API error details:', {
          status,
          error: errorData,
          errorMessage,
          fullResponse: errorText,
        })
      } catch (parseError) {
        // If JSON parsing fails, use raw text
        errorMessage = errorText || errorMessage
        console.error('OpenRouter API error (unparseable JSON):', {
          status,
          responseText: errorText,
          parseError,
        })
      }
    } else {
      console.error('OpenRouter API error - no response text available:', {
        status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      })
    }

    // Authentication errors
    if (status === 401) {
      return new OpenRouterAuthError(
        'Invalid or missing API key. Please check your OPENROUTER_API_KEY.'
      )
    }

    // Rate limit errors
    if (status === 429) {
      const resetHeader = response.headers.get('X-Ratelimit-Reset')
      const resetAt = resetHeader ? parseInt(resetHeader, 10) * 1000 : undefined
      return new OpenRouterRateLimitError('Rate limit exceeded. Please try again later.', resetAt)
    }

    // Client errors (4xx)
    if (status >= 400 && status < 500) {
      return new OpenRouterClientError(errorMessage, status)
    }

    // Server errors (5xx)
    if (status >= 500) {
      return new OpenRouterServerError(`OpenRouter server error (${status})`, status)
    }

    // Unknown error
    return new OpenRouterError(`Unexpected error (${status})`, status, false)
  }

  /**
   * Parses and validates the response from OpenRouter API
   *
   * @private
   * @param response - Raw fetch Response
   * @param responseFormat - Optional response format for JSON schema validation
   * @param zodSchema - Optional Zod schema for additional validation (if provided, used instead of json_schema)
   * @returns Parsed ChatCompletion
   * @throws {OpenRouterParseError} If JSON parsing or schema validation fails
   */
  async #parseResponse(
    response: Response,
    responseFormat?: ResponseFormat,
    zodSchema?: z.ZodTypeAny
  ): Promise<ChatCompletion> {
    const text = await response.text()

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`
      try {
        const errorData = JSON.parse(text)
        errorMessage = errorData.error?.message || errorData.message || errorMessage
      } catch {
        errorMessage = text || errorMessage
      }

      throw this.#handleError(new Error(errorMessage), response, text)
    }

    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      throw new OpenRouterParseError('Failed to parse JSON response from OpenRouter', text)
    }

    if (
      !data ||
      typeof data !== 'object' ||
      !('choices' in data) ||
      !Array.isArray((data as { choices: unknown }).choices)
    ) {
      throw new OpenRouterParseError('Invalid response structure from OpenRouter', text)
    }

    const completion = data as ChatCompletion

    if (responseFormat?.type === 'json_schema' && responseFormat.json_schema) {
      const messageContent = completion.choices[0]?.message?.content

      if (!messageContent) {
        throw new OpenRouterParseError('No content in response for JSON schema validation', text)
      }

      try {
        const parsedContent = JSON.parse(messageContent)

        if (zodSchema) {
          zodSchema.parse(parsedContent)
        } else {
          // Fallback: basic validation that content is an object
          if (typeof parsedContent !== 'object' || parsedContent === null) {
            throw new Error('Response content must be a valid JSON object')
          }
        }
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          console.error('JSON schema validation failed:', validationError.errors)
        }
        throw new OpenRouterParseError(
          `JSON schema validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown error'}`,
          messageContent
        )
      }
    }

    return completion
  }

  /**
   * Performs HTTP request with timeout and error handling
   *
   * @private
   * @param body - Request body
   * @param responseFormat - Optional response format for header configuration
   * @returns Fetch Response
   * @throws {OpenRouterNetworkError} On timeout or network errors
   */
  async #makeRequest(
    body: Record<string, unknown>,
    responseFormat?: ResponseFormat
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.#timeout)

    try {
      const response = await fetch(`${this.#baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.#buildHeaders(responseFormat),
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new OpenRouterNetworkError(`Request timeout after ${this.#timeout}ms`)
      }

      throw this.#handleError(error)
    }
  }

  /**
   * Generates a chat completion using OpenRouter API
   *
   * @param args - Chat completion arguments
   * @param zodSchema - Optional Zod schema for additional validation (recommended when using JSON schema)
   * @returns Promise resolving to ChatCompletion
   * @throws {OpenRouterError} Various error types based on failure scenario
   *
   * @example
   * ```ts
   * const response = await service.generateChatCompletion({
   *   messages: [
   *     { role: "system", content: "You are a chef." },
   *     { role: "user", content: "Make a pasta recipe." }
   *   ],
   *   model: "openai/gpt-4o-mini",
   *   responseFormat: {
   *     type: "json_schema",
   *     json_schema: {
   *       name: "recipe",
   *       strict: true,
   *       schema: {  <JSON Schema> }
   *     }
   *   }
   * }, RecipeSchema);
   * ```
   */
  async generateChatCompletion(args: ChatArgs, zodSchema?: z.ZodTypeAny): Promise<ChatCompletion> {
    if (!args.messages || args.messages.length === 0) {
      throw new OpenRouterClientError('At least one message is required')
    }

    if (!args.model && !this.#defaultModel) {
      throw new OpenRouterClientError('Model must be specified either in request or as default')
    }

    // Sanitize user messages (basic XSS prevention)
    const sanitizedMessages = args.messages.map(msg => {
      if (msg.role === 'user') {
        // Remove HTML tags and script content
        const sanitized = msg.content
          .replace(/<[^>]*>/g, '')
          .replace(/javascript:/gi, '')
          .trim()
        return { ...msg, content: sanitized }
      }
      return msg
    })

    const body = this.#buildBody({ ...args, messages: sanitizedMessages })

    try {
      const response = await this.#makeRequest(body, args.responseFormat)
      return await this.#parseResponse(response, args.responseFormat, zodSchema)
    } catch (error) {
      if (error instanceof OpenRouterError) {
        throw error
      }

      throw this.#handleError(error)
    }
  }

  /**
   * Sets the system prompt for all subsequent requests
   *
   * @param prompt - System prompt text
   *
   * @example
   * ```ts
   * service.setSystemPrompt("You are a culinary expert.");
   * ```
   */
  setSystemPrompt(prompt: string): void {
    this.#systemPrompt = prompt
  }

  /**
   * Changes the default model at runtime
   *
   * @param model - Model identifier (e.g., "openai/gpt-4o")
   *
   * @example
   * ```ts
   * service.setDefaultModel("mistral/mistral-medium");
   * ```
   */
  setDefaultModel(model: string): void {
    this.#defaultModel = model
  }
}
