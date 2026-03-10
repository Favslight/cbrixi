/**
 * lib/adminRoutes.ts
 *
 * ─────────────────────────────────────────────────────────────────
 *  WHAT IS THIS FILE?
 * ─────────────────────────────────────────────────────────────────
 * The function below is a Fastify "route plugin" — a pattern used
 * to group and register related HTTP endpoints on a Fastify server.
 *
 * Fastify is a Node.js web framework (like Express, but faster).
 * If you were running a *separate* Fastify API server alongside
 * this Next.js app, you would call:
 *
 *   app.register(adminRoutes);
 *
 * …inside your Fastify server entry point (e.g. server.ts), and
 * Fastify would then expose POST /admin/login on that server.
 *
 * ─────────────────────────────────────────────────────────────────
 *  HOW IS IT USED IN THIS PROJECT?
 * ─────────────────────────────────────────────────────────────────
 * Since this project is a Next.js app (not a standalone Fastify
 * server), the actual HTTP endpoint is implemented as a Next.js
 * Route Handler in:
 *
 *   src/app/api/admin/login/route.ts
 *
 * That file contains the *same* login logic as `adminLoginHandler`
 * below, adapted to the Next.js Response/Request API.
 *
 * The adminRoutes function is kept here as the canonical definition
 * so that if you ever spin up a dedicated Fastify microservice
 * (e.g. for a mobile app backend), you can register it directly.
 * ─────────────────────────────────────────────────────────────────
 */

// ── Types (Fastify is not installed as a package in this project,
//    so we declare minimal types locally for documentation purposes)
interface FastifyRequest {
  body: unknown;
}
interface FastifyReply {
  status: (code: number) => FastifyReply;
  send: (payload: unknown) => void;
}
interface FastifyInstance {
  post: (path: string, handler: (req: FastifyRequest, reply: FastifyReply) => Promise<void>) => void;
}

// ── Admin credentials (match Next.js API route)
const ADMIN_EMAIL = 'admin@cbrixi.com';
const ADMIN_PASSWORD = 'Cbrixisuperadmin';
const ADMIN_TOKEN = 'cbrixi-super-admin-token-2026';

/**
 * adminLoginHandler
 *
 * The actual handler that processes POST /admin/login requests.
 * It validates the email + password and returns a session token
 * that the frontend stores and sends in the Authorization header
 * for subsequent protected requests.
 *
 * Used by: adminRoutes (Fastify) AND src/app/api/admin/login/route.ts (Next.js)
 */
export const adminLoginHandler = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const { email, password } = req.body as { email: string; password: string };

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    reply.status(200).send({
      success: true,
      token: ADMIN_TOKEN,
      admin: { email: ADMIN_EMAIL, name: 'CBRIXI Admin' },
    });
  } else {
    reply.status(401).send({
      success: false,
      message: 'Invalid admin credentials.',
    });
  }
};

/**
 * adminRoutes — Fastify route plugin
 *
 * Registers all admin-related routes on the Fastify app instance.
 * To use in a Fastify server:
 *
 *   import Fastify from 'fastify';
 *   import { adminRoutes } from './lib/adminRoutes';
 *
 *   const app = Fastify();
 *   app.register(adminRoutes);   // ← registers POST /admin/login
 *   app.listen({ port: 4000 });
 */
export const adminRoutes = async (app: FastifyInstance) => {
  // POST /admin/login — validate credentials and return a session token
  app.post('/admin/login', adminLoginHandler);

  // Future routes to add here:
  // app.get('/admin/products', adminGetProductsHandler);
  // app.post('/admin/products', adminCreateProductHandler);
  // app.delete('/admin/products/:id', adminDeleteProductHandler);
};
