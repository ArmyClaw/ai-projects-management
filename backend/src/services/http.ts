import { FastifyReply } from "fastify";
import { ValidationErrorDetail } from "../types/domain.js";

export const ok = (reply: FastifyReply, data: unknown) =>
  reply.send({
    ok: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });

export const fail = (
  reply: FastifyReply,
  code: string,
  message: string,
  details: ValidationErrorDetail[] = [],
  statusCode = 422,
) =>
  reply.status(statusCode).send({
    ok: false,
    error: { code, message, details },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
