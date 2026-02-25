import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

const candidatePaths: string[] = []
const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST

if (isTest) {
  candidatePaths.push(path.resolve(process.cwd(), '.env.test'))
}

candidatePaths.push(
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env')
)

for (const envPath of candidatePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false })
    break
  }
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/ai_project'
}

const runningInDocker = fs.existsSync('/.dockerenv')
if (!runningInDocker && process.env.DATABASE_URL?.includes('@postgres:')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace('@postgres:', '@localhost:')
}
