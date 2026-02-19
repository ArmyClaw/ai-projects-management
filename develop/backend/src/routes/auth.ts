/**
 * 认证路由 - User Authentication Routes
 * 
 * 提供用户注册、登录、Token刷新等认证功能
 * 支持JWT无状态认证
 * 
 * @module routes/auth
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// 类型定义
// ============================================

/** 注册请求体 */
interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

/** 登录请求体 */
interface LoginRequest {
  email: string;
  password: string;
}

/** Token刷新请求体 */
interface RefreshRequest {
  refreshToken: string;
}

/** 用户对象（不包含密码） */
interface UserResponse {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

/** 认证响应 */
interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    refreshToken: string;
    user: UserResponse;
  };
  error?: string;
}

// ============================================
// 模拟用户数据库（生产环境应使用Prisma）
// ============================================

/**
 * 用户存储（内存模拟）
 * 生产环境替换为Prisma + PostgreSQL
 */
const users: Map<string, {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  refreshToken?: string;
}> = new Map();

// ============================================
// 辅助函数
// ============================================

/**
 * 验证邮箱格式
 * @param email 邮箱地址
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证密码强度
 * 要求：至少8位，包含数字和字母
 * @param password 密码
 */
function isStrongPassword(password: string): boolean {
  if (password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
}

/**
 * 简单密码哈希（生产环境应使用bcrypt）
 * @param password 原始密码
 */
function hashPassword(password: string): string {
  // 简单哈希，生产环境使用bcrypt
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `hash_${Math.abs(hash).toString(16)}`;
}

/**
 * 验证密码
 * @param password 原始密码
 * @param hash 存储的哈希值
 */
function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * 生成JWT Token（简化版）
 * 生产环境使用@fastify/jwt
 * @param userId 用户ID
 */
function generateToken(userId: string): string {
  const payload = { userId, iat: Date.now(), exp: Date.now() + 3600000 };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * 生成刷新Token
 * @param userId 用户ID
 */
function generateRefreshToken(userId: string): string {
  const payload = { userId, type: 'refresh', iat: Date.now() };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * 验证Token格式
 * @param token JWT Token
 */
function isValidToken(token: string): boolean {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

// ============================================
// 路由处理函数
// ============================================

/**
 * 用户注册
 * POST /api/v1/auth/register
 * 
 * @param request Fastify请求对象
 * @param reply Fastify响应对象
 */
async function register(
  request: FastifyRequest<{ Body: RegisterRequest }>,
  reply: FastifyReply
): Promise<AuthResponse> {
  const { email, username, password } = request.body;

  // 1. 验证必填字段
  if (!email || !username || !password) {
    return reply.status(400).send({
      success: false,
      error: 'Missing required fields: email, username, password'
    });
  }

  // 2. 验证邮箱格式
  if (!isValidEmail(email)) {
    return reply.status(400).send({
      success: false,
      error: 'Invalid email format'
    });
  }

  // 3. 验证密码强度
  if (!isStrongPassword(password)) {
    return reply.status(400).send({
      success: false,
      error: 'Password must be at least 8 characters and contain both letters and numbers'
    });
  }

  // 4. 检查邮箱是否已存在
  for (const user of users.values()) {
    if (user.email === email) {
      return reply.status(400).send({
        success: false,
        error: 'Email already registered'
      });
    }
  }

  // 5. 创建用户
  const userId = uuidv4();
  const passwordHash = hashPassword(password);
  const user = {
    id: userId,
    email,
    username,
    passwordHash,
    createdAt: new Date()
  };
  users.set(userId, user);

  // 6. 生成Token
  const token = generateToken(userId);
  const refreshToken = generateRefreshToken(userId);
  
  // 保存刷新Token
  users.set(userId, { ...user, refreshToken });

  // 7. 返回响应（不包含密码）
  return reply.status(201).send({
    success: true,
    data: {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt.toISOString()
      }
    }
  });
}

/**
 * 用户登录
 * POST /api/v1/auth/login
 * 
 * @param request Fastify请求对象
 * @param reply Fastify响应对象
 */
async function login(
  request: FastifyRequest<{ Body: LoginRequest }>,
  reply: FastifyReply
): Promise<AuthResponse> {
  const { email, password } = request.body;

  // 1. 验证必填字段
  if (!email || !password) {
    return reply.status(400).send({
      success: false,
      error: 'Missing required fields: email, password'
    });
  }

  // 2. 查找用户
  let foundUser: typeof users extends Map<string, infer V> ? V : never | null = null;
  for (const user of users.values()) {
    if (user.email === email) {
      foundUser = user;
      break;
    }
  }

  if (!foundUser) {
    return reply.status(401).send({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // 3. 验证密码
  if (!verifyPassword(password, foundUser.passwordHash)) {
    return reply.status(401).send({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // 4. 生成Token
  const token = generateToken(foundUser.id);
  const refreshToken = generateRefreshToken(foundUser.id);
  
  // 保存刷新Token
  users.set(foundUser.id, { ...foundUser, refreshToken });

  // 5. 返回响应
  return reply.send({
    success: true,
    data: {
      token,
      refreshToken,
      user: {
        id: foundUser.id,
        email: foundUser.email,
        username: foundUser.username,
        createdAt: foundUser.createdAt.toISOString()
      }
    }
  });
}

/**
 * 获取当前用户信息
 * GET /api/v1/auth/me
 * 
 * @param request Fastify请求对象
 * @param reply Fastify响应对象
 */
async function getMe(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<AuthResponse> {
  // 从请求头获取Token
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      success: false,
      error: 'No token provided'
    });
  }

  const token = authHeader.substring(7);
  
  // 验证Token
  if (!isValidToken(token)) {
    return reply.status(401).send({
      success: false,
      error: 'Invalid or expired token'
    });
  }

  // 解析Token获取用户ID
  const payload = JSON.parse(Buffer.from(token, 'base64').toString());
  const userId = payload.userId;
  
  // 获取用户信息
  const user = users.get(userId);
  if (!user) {
    return reply.status(401).send({
      success: false,
      error: 'User not found'
    });
  }

  return reply.send({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt.toISOString()
    }
  });
}

/**
 * 刷新Token
 * POST /api/v1/auth/refresh
 * 
 * @param request Fastify请求对象
 * @param reply Fastify响应对象
 */
async function refreshToken(
  request: FastifyRequest<{ Body: RefreshRequest }>,
  reply: FastifyReply
): Promise<AuthResponse> {
  const { refreshToken } = request.body;

  if (!refreshToken) {
    return reply.status(400).send({
      success: false,
      error: 'Missing refresh token'
    });
  }

  // 解析刷新Token
  let payload: { userId: string; type: string };
  try {
    payload = JSON.parse(Buffer.from(refreshToken, 'base64').toString());
  } catch {
    return reply.status(401).send({
      success: false,
      error: 'Invalid refresh token'
    });
  }

  if (payload.type !== 'refresh') {
    return reply.status(401).send({
      success: false,
      error: 'Invalid refresh token'
    });
  }

  // 验证用户存在
  const user = users.get(payload.userId);
  if (!user || user.refreshToken !== refreshToken) {
    return reply.status(401).send({
      success: false,
      error: 'Invalid refresh token'
    });
  }

  // 生成新Token
  const newToken = generateToken(user.id);
  const newRefreshToken = generateRefreshToken(user.id);
  
  // 保存新刷新Token
  users.set(user.id, { ...user, refreshToken: newRefreshToken });

  return reply.send({
    success: true,
    data: {
      token: newToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt.toISOString()
      }
    }
  });
}

// ============================================
// 路由导出
// ============================================

/**
 * 认证路由插件
 * 
 * 提供以下端点：
 * - POST /api/v1/auth/register - 用户注册
 * - POST /api/v1/auth/login - 用户登录
 * - GET /api/v1/auth/me - 获取当前用户信息
 * - POST /api/v1/auth/refresh - 刷新Token
 * 
 * @param fastify Fastify实例
 */
export default async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // 用户注册
  fastify.post<{ Body: RegisterRequest }>(
    '/register',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'username', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            username: { type: 'string', minLength: 3, maxLength: 50 },
            password: { type: 'string', minLength: 8 }
          }
        }
      }
    },
    register
  );

  // 用户登录
  fastify.post<{ Body: LoginRequest }>(
    '/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' }
          }
        }
      }
    },
    login
  );

  // 获取当前用户信息
  fastify.get('/me', getMe);

  // 刷新Token
  fastify.post<{ Body: RefreshRequest }>(
    '/refresh',
    {
      schema: {
        body: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' }
          }
        }
      }
    },
    refreshToken
  );
}
