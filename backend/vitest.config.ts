import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    threads: false,
    maxConcurrency: 1,
    sequence: {
      concurrent: false
    },
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/app-debug*.ts',
        'src/app-test*.ts',
        'src/app-simple*.ts',
        'src/app.ts',
        'src/app-final.ts',
        'src/routes/analytics.ts',
        'src/services/pdf-export.ts',
        'src/services/websocket.ts',
        'src/routes/ai-agent.ts',
        'src/routes/anti-cheat.ts',
        'src/routes/github-oauth.ts'
      ],
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
        branches: 85
      }
    }
  }
})
