import env from '#start/env'
import { defineConfig } from '@adonisjs/cors'

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */
const allowedOrigins = env.get('CORS_ORIGIN')
  ? env
      .get('CORS_ORIGIN')!
      .split(',')
      .map((o) => o.trim())
  : []

const corsConfig = defineConfig({
  enabled: true,
  origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
