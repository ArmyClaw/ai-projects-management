import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import authRoutes from '../src/routes/auth.js';

// 模拟用户数据
const mockUsers: Array<{ id: string; email: string; username: string; passwordHash: string }> = [];

describe('Auth API Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    
    // 注册路由
    app.register(authRoutes, { prefix: '/api/v1/auth' });
    
    await app.ready();
  });

  afterEach(async () => {
    // 清理测试数据
    mockUsers.length = 0;
  });

  // ============================================
  // POST /api/v1/auth/register - 用户注册
  // ============================================

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123!'
        }
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.user).toHaveProperty('id');
      expect(body.data.user.email).toBe('test@example.com');
      expect(body.data.user.username).toBe('testuser');
      expect(body.data).not.toHaveProperty('password');
    });

    it('should return 400 for duplicate email', async () => {
      // 先注册一个用户
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'duplicate@example.com',
          username: 'user1',
          password: 'Password123!'
        }
      });

      // 尝试用相同邮箱注册
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'duplicate@example.com',
          username: 'user2',
          password: 'Password123!'
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'invalid-email',
          username: 'testuser',
          password: 'Password123!'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for weak password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com',
          username: 'testuser',
          password: '123'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com'
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  // ============================================
  // POST /api/v1/auth/login - 用户登录
  // ============================================

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      // 先注册用户
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'login@example.com',
          username: 'loginuser',
          password: 'Password123!'
        }
      });

      // 登录
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'login@example.com',
          password: 'Password123!'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('token');
      expect(body.data).toHaveProperty('user');
    });

    it('should return 401 for incorrect password', async () => {
      // 先注册用户
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'wrongpass@example.com',
          username: 'wrongpassuser',
          password: 'Password123!'
        }
      });

      // 尝试错误密码登录
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'wrongpass@example.com',
          password: 'WrongPassword!'
        }
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('should return 401 for non-existent user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'Password123!'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 400 for missing credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {}
      });

      expect(response.statusCode).toBe(400);
    });
  });

  // ============================================
  // GET /api/v1/auth/me - 获取当前用户信息
  // ============================================

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 without authentication token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  // ============================================
  // POST /api/v1/auth/refresh - 刷新Token
  // ============================================

  describe('POST /api/v1/auth/refresh', () => {
    it('should return 400 with empty body', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: {}
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
