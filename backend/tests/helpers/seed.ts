import { prisma } from '../setup'
import { v4 as uuidv4 } from 'uuid'

export async function createUser(overrides: Partial<Parameters<typeof prisma.user.create>[0]['data']> = {}) {
  return prisma.user.create({
    data: {
      email: `user_${uuidv4()}@example.com`,
      name: 'Test User',
      role: 'PARTICIPANT',
      status: 'ACTIVE',
      ...overrides
    }
  })
}

export async function createProject(overrides: Partial<Parameters<typeof prisma.project.create>[0]['data']> = {}) {
  const initiator = overrides.initiatorId
    ? await prisma.user.findUnique({ where: { id: overrides.initiatorId } })
    : await createUser()

  return prisma.project.create({
    data: {
      title: 'Test Project',
      description: 'Test project description',
      mode: 'COMMUNITY',
      status: 'ACTIVE',
      budget: 1000,
      initiatorId: initiator!.id,
      ...overrides
    }
  })
}

export async function createTask(overrides: Partial<Parameters<typeof prisma.task.create>[0]['data']> = {}) {
  const project = overrides.projectId
    ? await prisma.project.findUnique({ where: { id: overrides.projectId } })
    : await createProject()

  return prisma.task.create({
    data: {
      title: 'Test Task',
      description: 'Task description',
      requiredSkills: ['typescript'],
      budget: 100,
      status: 'OPEN',
      projectId: project!.id,
      ...overrides
    }
  })
}

export async function createMilestone(overrides: Partial<Parameters<typeof prisma.milestone.create>[0]['data']> = {}) {
  const project = overrides.projectId
    ? await prisma.project.findUnique({ where: { id: overrides.projectId } })
    : await createProject()

  return prisma.milestone.create({
    data: {
      projectId: project!.id,
      name: 'Milestone 1',
      description: 'Milestone description',
      order: 1,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
      ...overrides
    }
  })
}

export async function createPoints(userId?: string, amount = 100) {
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : await createUser()
  await prisma.user.update({
    where: { id: user!.id },
    data: { totalPoints: amount }
  })

  return prisma.point.create({
    data: {
      userId: user!.id,
      amount
    }
  })
}

export async function createSettlement(overrides: Partial<Parameters<typeof prisma.settlement.create>[0]['data']> = {}) {
  const user = overrides.userId ? await prisma.user.findUnique({ where: { id: overrides.userId } }) : await createUser()
  return prisma.settlement.create({
    data: {
      userId: user!.id,
      amount: 200,
      platformFee: 10,
      netAmount: 190,
      type: 'TASK_COMPLETE',
      status: 'COMPLETED',
      ...overrides
    }
  })
}
