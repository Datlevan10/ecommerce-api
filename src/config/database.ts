import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:631976@localhost:5432/ecommerce_db"

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
})

export default prisma
