import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment setup
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup/vitest.setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'tests/setup/**',
        '*.config.*',
        'src/db/database.types.ts', // Generated types
        'src/env.d.ts',
        'next-env.d.ts',
        '.next/',
        'out/',
      ],
    },

    // Test file patterns - find tests colocated with source files
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/', '.next/', 'out/'],

    // Reporter configuration
    reporters: ['verbose'],

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
  },

  // Path resolution (matching tsconfig.json)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
