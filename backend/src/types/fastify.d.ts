import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    authUser?: {
      id: string;
      handle: string;
      displayName: string;
      avatar: string;
    };
  }
}
