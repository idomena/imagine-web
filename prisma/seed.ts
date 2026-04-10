/**
 * ============================================================
 *  Category seed — runs against the BACKEND's Prisma setup.
 * ============================================================
 *
 *  This file belongs in your BACKEND (Fastify / Prisma) repo,
 *  NOT in this Next.js frontend repo.
 *
 *  Steps to seed your Railway Postgres database:
 *  ─────────────────────────────────────────────
 *  1. Copy this file into your backend project at  prisma/seed.ts
 *
 *  2. Make sure your backend's package.json has:
 *
 *       "prisma": {
 *         "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
 *       }
 *
 *     (If you use tsx:  "seed": "tsx prisma/seed.ts" )
 *
 *  3. Set DATABASE_URL in your local .env to point at the Railway DB.
 *     You can get the connection string from:
 *       Railway dashboard → your Postgres service → Connect tab
 *       (use the "External" URL while running locally)
 *
 *  4. Run:
 *       npx prisma db seed
 *
 *     Or, to re-generate the client first:
 *       npx prisma generate && npx prisma db seed
 *
 *  The seed uses `upsert` so it is safe to run multiple times —
 *  existing rows are updated, nothing is duplicated.
 * ============================================================
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// 10 professional AI-app categories
// ---------------------------------------------------------------------------
const CATEGORIES = [
  {
    name:        'Finance',
    slug:        'finances',
    description: 'Budgeting, investing, expense tracking, and financial planning tools.',
  },
  {
    name:        'AI & Technology',
    slug:        'ai-tech',
    description: 'Cutting-edge AI apps, developer tools, and emerging tech utilities.',
  },
  {
    name:        'Sports & Health',
    slug:        'sports-health',
    description: 'Fitness tracking, nutrition, mental wellness, and sports analytics.',
  },
  {
    name:        'Entertainment & Fun',
    slug:        'entertainment',
    description: 'Games, media discovery, social experiences, and fun AI experiments.',
  },
  {
    name:        'Education & Learning',
    slug:        'learning',
    description: 'Study aids, language learning, tutoring, and knowledge tools.',
  },
  {
    name:        'Productivity',
    slug:        'productivity',
    description: 'Task managers, summarisers, schedulers, and workflow automators.',
  },
  {
    name:        'Creative & Design',
    slug:        'creative',
    description: 'Image generation, UI design, writing assistants, and creative tools.',
  },
  {
    name:        'Business & Marketing',
    slug:        'business',
    description: 'CRM, SEO, ad copy, analytics, and go-to-market tools for teams.',
  },
]

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\nSeeding ${CATEGORIES.length} categories…\n`)
  console.log('  (upsert on slug — safe to re-run, no duplicates created)\n')

  for (const cat of CATEGORIES) {
    const record = await prisma.category.upsert({
      where:  { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: cat,
    })
    console.log(`  ✓  ${record.name.padEnd(26)} id: ${record.id}`)
  }

  console.log(`\n✅  Done — ${CATEGORIES.length} categories seeded.\n`)
}

main()
  .catch(err => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
