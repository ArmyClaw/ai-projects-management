import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 获取技能列表
 * GET /api/v1/skills
 * 
 * 查询参数：
 * - page: 页码（默认 1）
 * - pageSize: 每页数量（默认 10，最大 100）
 * - authorId: 作者ID筛选（可选）
 * - tags: 标签筛选（可选，逗号分隔）
 * - visibility: 可见性筛选（可选）
 */
export async function getSkillsRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get<{
    Querystring: {
      page?: string
      pageSize?: string
      authorId?: string
      tags?: string
      visibility?: string
    }
  }>('/api/v1/skills', {
    schema: {
      description: '获取技能列表',
      tags: ['skills'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', description: '页码', default: '1' },
          pageSize: { type: 'string', description: '每页数量', default: '10' },
          authorId: { type: 'string', description: '作者ID筛选' },
          tags: { type: 'string', description: '标签筛选（逗号分隔）' },
          visibility: { type: 'string', enum: ['PRIVATE', 'COMMUNITY', 'PUBLIC'], description: '可见性筛选' }
        }
      },
      response: {
        200: {
          description: '成功返回技能列表',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                skills: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      description: { type: 'string' },
                      tags: { type: 'array', items: { type: 'string' } },
                      visibility: { type: 'string' },
                      authorId: { type: 'string' },
                      authorName: { type: 'string' },
                      usageCount: { type: 'number' },
                      avgScore: { type: 'number' },
                      createdAt: { type: 'string' },
                      updatedAt: { type: 'string' }
                    }
                  }
                },
                total: { type: 'number' },
                page: { type: 'number' },
                pageSize: { type: 'number' },
                totalPages: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { page = '1', pageSize = '10', authorId, tags, visibility } = request.query

    const pageNum = Math.max(1, parseInt(page))
    const size = Math.min(100, Math.max(1, parseInt(pageSize)))
    const skip = (pageNum - 1) * size

    // 构建查询条件
    const where: { authorId?: string; visibility?: string; tags?: { hasEvery: string[] } } = {}

    if (authorId) {
      where.authorId = authorId
    }

    if (visibility) {
      where.visibility = visibility
    }

    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim())
      where.tags = { hasEvery: tagArray }
    }

    try {
      const [skills, total] = await Promise.all([
        prisma.skill.findMany({
          where,
          skip,
          take: size,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            description: true,
            tags: true,
            visibility: true,
            authorId: true,
            createdAt: true,
            updatedAt: true,
            stats: true,
            author: {
              select: { name: true }
            }
          }
        }),
        prisma.skill.count({ where })
      ])

      const totalPages = Math.ceil(total / size)

      const data = {
        skills: skills.map(skill => ({
          id: skill.id,
          name: skill.name,
          description: skill.description,
          tags: skill.tags,
          visibility: skill.visibility,
          authorId: skill.authorId,
          authorName: skill.author.name,
          usageCount: (skill.stats as { usageCount?: number })?.usageCount || 0,
          avgScore: (skill.stats as { avgScore?: number })?.avgScore || 0,
          createdAt: skill.createdAt.toISOString(),
          updatedAt: skill.updatedAt.toISOString()
        })),
        total,
        page: pageNum,
        pageSize: size,
        totalPages
      }

      return { success: true, data }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500)
      return { success: false, error: 'Failed to fetch skills' }
    }
  })
}

/**
 * 获取技能详情
 * GET /api/v1/skills/:id
 */
export async function getSkillByIdRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get<{
    Params: { id: string }
  }>('/api/v1/skills/:id', {
    schema: {
      description: '获取技能详情',
      tags: ['skills'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '技能ID' }
        }
      },
      response: {
        200: {
          description: '成功返回技能详情',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                visibility: { type: 'string' },
                license: { type: 'string' },
                definition: { type: 'object' },
                author: { type: 'object' },
                stats: { type: 'object' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params

    try {
      const skill = await prisma.skill.findUnique({
        where: { id },
        include: {
          author: {
            select: { id: true, name: true, avatar: true }
          }
        }
      })

      if (!skill) {
        reply.status(404)
        return { success: false, error: 'Skill not found' }
      }

      return {
        success: true,
        data: {
          id: skill.id,
          name: skill.name,
          description: skill.description,
          tags: skill.tags,
          visibility: skill.visibility,
          license: skill.license,
          definition: skill.definition,
          author: skill.author,
          stats: skill.stats,
          createdAt: skill.createdAt.toISOString(),
          updatedAt: skill.updatedAt.toISOString()
        }
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500)
      return { success: false, error: 'Failed to fetch skill' }
    }
  })
}

/**
 * 创建技能
 * POST /api/v1/skills
 */
export async function createSkillRoute(fastify: FastifyInstance): Promise<void> {
  fastify.post<{
    Body: {
      name: string
      description: string
      tags: string[]
      visibility?: 'PRIVATE' | 'COMMUNITY' | 'PUBLIC'
      license?: string
      definition: any
    }
  }>('/api/v1/skills', {
    schema: {
      description: '创建新技能',
      tags: ['skills'],
      body: {
        type: 'object',
        required: ['name', 'description', 'definition'],
        properties: {
          name: { type: 'string', description: '技能名称' },
          description: { type: 'string', description: '技能描述' },
          tags: { type: 'array', items: { type: 'string' }, description: '技能标签' },
          visibility: { type: 'string', enum: ['PRIVATE', 'COMMUNITY', 'PUBLIC'], description: '可见性' },
          license: { type: 'string', description: '开源许可证' },
          definition: {
            type: 'object',
            description: '技能定义',
            properties: {
              prompts: { type: 'array' },
              workflow: { type: 'array' },
              qualityStandard: { type: 'object' }
            }
          }
        }
      },
      response: {
        201: {
          description: '技能创建成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                visibility: { type: 'string' },
                createdAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { name, description, tags, visibility = 'COMMUNITY', license = 'MIT', definition } = request.body

    // 验证必填字段
    if (!name || !description || !definition) {
      reply.status(400)
      return { success: false, error: 'Missing required fields: name, description, definition' }
    }

    // 验证definition结构
    if (!definition.prompts || !definition.workflow || !definition.qualityStandard) {
      reply.status(400)
      return { success: false, error: 'Invalid skill definition: missing prompts, workflow, or qualityStandard' }
    }

    try {
      // TODO: 获取当前用户ID（从JWT token中解析）
      const authorId = 'temp-user-id'

      const skill = await prisma.skill.create({
        data: {
          name,
          description,
          tags,
          visibility,
          license,
          definition,
          authorId,
          stats: { usageCount: 0, successRate: 0, avgScore: 0 }
        }
      })

      reply.status(201)
      return {
        success: true,
        data: {
          id: skill.id,
          name: skill.name,
          description: skill.description,
          tags: skill.tags,
          visibility: skill.visibility,
          createdAt: skill.createdAt.toISOString()
        }
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500)
      return { success: false, error: 'Failed to create skill' }
    }
  })
}

/**
 * 更新技能
 * PUT /api/v1/skills/:id
 */
export async function updateSkillRoute(fastify: FastifyInstance): Promise<void> {
  fastify.put<{
    Params: { id: string }
    Body: {
      name?: string
      description?: string
      tags?: string[]
      visibility?: 'PRIVATE' | 'COMMUNITY' | 'PUBLIC'
      definition?: any
    }
  }>('/api/v1/skills/:id', {
    schema: {
      description: '更新技能',
      tags: ['skills'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '技能ID' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '技能名称' },
          description: { type: 'string', description: '技能描述' },
          tags: { type: 'array', items: { type: 'string' }, description: '技能标签' },
          visibility: { type: 'string', enum: ['PRIVATE', 'COMMUNITY', 'PUBLIC'], description: '可见性' },
          definition: { type: 'object', description: '技能定义' }
        }
      },
      response: {
        200: {
          description: '技能更新成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                visibility: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params
    const updateData = request.body

    try {
      const existingSkill = await prisma.skill.findUnique({ where: { id } })

      if (!existingSkill) {
        reply.status(404)
        return { success: false, error: 'Skill not found' }
      }

      // TODO: 验证是否是技能作者
      // const currentUserId = getUserIdFromToken(request)
      // if (existingSkill.authorId !== currentUserId) {
      //   reply.status(403)
      //   return { success: false, error: 'Not authorized to update this skill' }
      // }

      // 如果更新definition，验证结构
      if (updateData.definition) {
        if (!updateData.definition.prompts || !updateData.definition.workflow || !updateData.definition.qualityStandard) {
          reply.status(400)
          return { success: false, error: 'Invalid skill definition' }
        }
      }

      const skill = await prisma.skill.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      })

      return {
        success: true,
        data: {
          id: skill.id,
          name: skill.name,
          description: skill.description,
          tags: skill.tags,
          visibility: skill.visibility,
          updatedAt: skill.updatedAt.toISOString()
        }
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500)
      return { success: false, error: 'Failed to update skill' }
    }
  })
}

/**
 * 删除技能
 * DELETE /api/v1/skills/:id
 */
export async function deleteSkillRoute(fastify: FastifyInstance): Promise<void> {
  fastify.delete<{
    Params: { id: string }
  }>('/api/v1/skills/:id', {
    schema: {
      description: '删除技能',
      tags: ['skills'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '技能ID' }
        }
      },
      response: {
        200: {
          description: '技能删除成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params

    try {
      const existingSkill = await prisma.skill.findUnique({ where: { id } })

      if (!existingSkill) {
        reply.status(404)
        return { success: false, error: 'Skill not found' }
      }

      // TODO: 验证是否是技能作者
      // const currentUserId = getUserIdFromToken(request)
      // if (existingSkill.authorId !== currentUserId) {
      //   reply.status(403)
      //   return { success: false, error: 'Not authorized to delete this skill' }
      // }

      await prisma.skill.delete({ where: { id } })

      return {
        success: true,
        message: 'Skill deleted successfully'
      }
    } catch (error) {
      fastify.log.error(error)
      reply.status(500)
      return { success: false, error: 'Failed to delete skill' }
    }
  })
}
