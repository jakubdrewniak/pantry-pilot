# Deployment Plan for **OpenRouterService**

## 1. Service Description

`OpenRouterService` is an integration layer (backend client) that bridges the Pantry Pilot application with the [openrouter.ai](https://openrouter.ai) API.  
The service exposes high-level methods to generate LLM chat completions, encapsulating authorization, serialization (including **response_format**), model versioning, and error handling.

Benefits:

1. Consistent, fully-typed interface across the TypeScript codebase.
2. Easy model or provider swaps (e.g., OpenAI) thanks to a unified contract.
3. Centralized rate-limit handling, retries, and logging.

---

## 2. Constructor Overview

```ts
class OpenRouterService {
  constructor(options: {
    apiKey: string;           // 🗝️ OpenRouter key from .env
    baseUrl?: string;         // default "https://openrouter.ai/api/v1"
    defaultModel?: string;    // e.g. "openai/gpt-4o"
    defaultParams?: {
      temperature?: number;
      max_tokens?: number;
      [key: string]: unknown;
    };
  }) {...}
}
```

Recommended initialization (Next.js 14 → App Router):

```ts
// src/lib/openrouter.ts
import { OpenRouterService } from '@/lib/openrouter-service'
export const openRouter = new OpenRouterService({
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultModel: 'openai/gpt-4o',
  defaultParams: { temperature: 0.7, max_tokens: 1024 },
})
```

---

## 3. Public Methods & Fields

| Name                     | Signature                                     | Purpose                                                      |
| ------------------------ | --------------------------------------------- | ------------------------------------------------------------ |
| `generateChatCompletion` | `(args: ChatArgs) => Promise<ChatCompletion>` | Primary method – sends a chat and returns the model response |
| `setSystemPrompt`        | `(prompt: string) => void`                    | Dynamically change the system prompt                         |
| `setDefaultModel`        | `(model: string) => void`                     | Change the default model at runtime                          |
| `withRetry`              | `(opts: RetryOptions) => OpenRouterService`   | Fluent API – returns a clone with a retry policy             |

**Types:**

```ts
interface ChatArgs {
  messages: Message[] // system + user + assistant
  model?: string // optionally overrides default
  responseFormat?: ResponseFormat // JSON schema or text
  params?: Record<string, unknown> // temperature, top_p ...
}

interface ResponseFormat {
  type: 'json_schema' | 'text'
  json_schema?: {
    name: string
    strict: true
    schema: Record<string, unknown> // JSONSchema7-compatible
  }
}
```

---

## 4. Private Methods & Fields

| Name              | Purpose                                                                            |
| ----------------- | ---------------------------------------------------------------------------------- |
| `#apiKey`         | Stores the key in the class’s private field; never logged                          |
| `#baseUrl`        | OpenRouter API URL                                                                 |
| `#http`           | Fetch client pre-configured with headers                                           |
| `buildHeaders()`  | Creates `Authorization`, `Content-Type`, etc.                                      |
| `buildBody()`     | Serializes `ChatArgs` into the format required by OpenRouter                       |
| `handleError()`   | Transforms network errors into domain objects `OpenRouterError`                    |
| `parseResponse()` | Validates and returns `ChatCompletion` – when JSON schema is used runs `zod.parse` |

---

## 5. Error Handling

| #   | Scenario                               | Error Type               | Behavior                                      |
| --- | -------------------------------------- | ------------------------ | --------------------------------------------- |
| 1   | Missing/invalid API key                | `OpenRouterAuthError`    | Throw 401, retry is pointless                 |
| 2   | Rate limit exceeded (429)              | `OpenRouterRateLimit`    | Retry with back-off until `X-Ratelimit-Reset` |
| 3   | Network error (timeout, DNS)           | `OpenRouterNetworkError` | Auto-retry ×3 with exponential back-off       |
| 4   | Response JSON schema validation failed | `OpenRouterParseError`   | Log + fallback to raw text                    |
| 5   | 5xx from OpenRouter server             | `OpenRouterServerError`  | Retry depending on status (< 10 s)            |
| 6   | Unsupported model or parameter         | `OpenRouterClientError`  | Reject with 400 explaining correct usage      |

---

## 6. Security Considerations

1. **Secrets in environment** – `OPENROUTER_API_KEY` stored in Vercel Environment Variables, never in repo.
2. **Encrypted transport** – enforce `https://` and TLS 1.2+; test self-signed locally only.
3. **Rate limiting & circuit breaker** – prevent DoS and protect billing.
4. **Input sanitization** – strip user messages of Markdown/HTML before sending.
5. **Strict JSON schema** – mitigates prompt injection or accidental code execution.
6. **Audit logging** – only metadata (model, tokens), no sensitive data.

---

## 7. Step-by-Step Deployment Plan

1. **Environment setup**  
   1.1. Add `OPENROUTER_API_KEY` to `.env.local` (dev) and CI/CD env vars.  
   1.2. Install dependencies: `npm i zod` (validation) \| `npm i ky` (optional HTTP)

2. **Create service file**

   ```bash
   mkdir -p src/lib && touch src/lib/openrouter-service.ts
   ```

3. **Implement constructor**
   - Validate presence of `apiKey`.
   - Initialize private fetch/ky client with 30 s timeout.

4. **Build `generateChatCompletion`**
   - Accepts `ChatArgs`, merges with defaults.
   - Calls `buildBody()` → `#http.post()` → `parseResponse()`.

5. **Handle `response_format`**
   - If `type === "json_schema"`, set header `OpenRouter-Response-Format: json`.
   - After response, parse with `zod` against provided `json_schema`.

6. **Retry & circuit breaker**
   - Simple wrapper: if `handleError()` returns `retryable === true`, retry with back-off.

7. **Unit tests (Vitest)**
   - Mock network with `vi.stubGlobal('fetch', ...)`.
   - Scenarios: success, 429 retry, invalid JSON schema.

8. **Integrate in app**
   - Provide `openRouter` instance via React Context or direct import.
   - Component usage example:
     ```ts
     const { data } = await openRouter.generateChatCompletion({
       messages: [
         { role: 'system', content: systemPrompt },
         { role: 'user', content: userPrompt },
       ],
       responseFormat: {
         type: 'json_schema',
         json_schema: {
           name: 'recipe',
           strict: true,
           schema: {
             type: 'object',
             properties: {
               title: { type: 'string' },
               ingredients: { type: 'array', items: { type: 'string' } },
               steps: { type: 'array', items: { type: 'string' } },
             },
             required: ['title', 'ingredients', 'steps'],
           },
         },
       },
       model: 'openai/gpt-4o-mini',
       params: { temperature: 0.3 },
     })
     ```

9. **(Optional) Monitoring & logging**
   - Create `/api/usage` endpoint returning token usage.
   - Add GitHub Actions alert when nearing billing limit.

10. **(Optional) Production hardening**
    - Cap `max_tokens` at 2048.
    - Enable CORS policy only for app domains.
    - Validate external payloads against XSS/CSRF.

---

### Sample Prompt & Parameter Configurations

| #   | Element             | Example                                                                                             |
| --- | ------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | **System prompt**   | `"You are a culinary expert. Return recipes in English."`                                           |
| 2   | **User prompt**     | `"I have eggs, tomatoes, and basil. Suggest an easy dinner under 15 min."`                          |
| 3   | **response_format** | `{ type: 'json_schema', json_schema: { name: 'recipe', strict: true, schema: {/* see above */} } }` |
| 4   | **Model name**      | `"openai/gpt-4o"` or `"mistral/mistral-medium"`                                                     |
| 5   | **Model params**    | `{ temperature: 0.5, max_tokens: 1024, top_p: 0.9 }`                                                |

> **Tip:** Store constant system prompts in `src/lib/prompts.ts` for easy refactor and testing.

---

## Next Steps

- Consider _streaming_ responses (Server-Sent Events) – OpenRouter supports `stream=1`.
- Add a job queue (e.g., Supabase Edge Function) for batch requests.
- Plan a cache at the _message fingerprint_ level 💡 – identical input ⇒ cache hit, saving tokens.
