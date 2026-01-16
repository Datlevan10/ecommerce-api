import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config'

dotenv.config();

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://postgres:631976@localhost:5432/ecommerce_db"
  }
})