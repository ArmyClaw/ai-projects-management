<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { NCard, NButton, NTag, NGrid, NGi, NEmpty, NSpin, NInput, NSpace } from 'naive-ui'
import axios from 'axios'

/**
 * Skill市场视图
 * 
 * 功能：
 * - 展示可用的Skill列表
 * - 显示Skill使用统计
 * - 支持搜索和筛选
 */

interface Skill {
  id: string
  name: string
  description: string
  tags: string[]
  author: {
    name: string
  }
  usageCount: number
  successRate: number
  avgScore: number
  visibility: 'PRIVATE' | 'COMMUNITY' | 'PUBLIC'
}

const skills = ref<Skill[]>([])
const loading = ref(true)
const searchKeyword = ref('')
const error = ref<string | null>(null)

/**
 * 获取Skill列表
 */
async function fetchSkills() {
  loading.value = true
  error.value = null
  
  try {
    const response = await axios.get('http://localhost:4000/api/v1/skills')
    if (response.data.success) {
      skills.value = response.data.data.skills
    }
  } catch (err: any) {
    error.value = err.message || '获取Skill列表失败'
    skills.value = mockSkills
  } finally {
    loading.value = false
  }
}

/**
 * 过滤后的Skill列表
 */
const filteredSkills = computed(() => {
  if (!searchKeyword.value) return skills.value
  const keyword = searchKeyword.value.toLowerCase()
  return skills.value.filter(skill => 
    skill.name.toLowerCase().includes(keyword) ||
    skill.description.toLowerCase().includes(keyword) ||
    skill.tags.some(tag => tag.toLowerCase().includes(keyword))
  )
})

/**
 * 获取可见性标签
 */
function getVisibilityType(visibility: string): 'success' | 'info' | 'warning' {
  const map: Record<string, 'success' | 'info' | 'warning'> = {
    PRIVATE: 'warning',
    COMMUNITY: 'info',
    PUBLIC: 'success'
  }
  return map[visibility] || 'info'
}

/**
 * 获取可见性文本
 */
function getVisibilityText(visibility: string): string {
  const map: Record<string, string> = {
    PRIVATE: '私有',
    COMMUNITY: '社区',
    PUBLIC: '公开'
  }
  return map[visibility] || visibility
}

/**
 * 格式化使用次数
 */
function formatUsageCount(count: number): string {
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k'
  }
  return count.toString()
}

// 模拟数据
const mockSkills: Skill[] = [
  {
    id: 'skill-1',
    name: 'Python RESTful API 开发专家',
    description: '快速开发高质量RESTful API，包含认证、授权、错误处理等最佳实践',
    tags: ['Python', 'FastAPI', 'RESTful'],
    author: { name: '李四' },
    usageCount: 156,
    successRate: 96,
    avgScore: 4.8,
    visibility: 'PUBLIC'
  },
  {
    id: 'skill-2',
    name: 'Vue 3 前端开发模板',
    description: 'Vue 3 + TypeScript + Naive UI 项目模板',
    tags: ['Vue 3', 'TypeScript', 'Naive UI'],
    author: { name: '王五' },
    usageCount: 89,
    successRate: 92,
    avgScore: 4.6,
    visibility: 'COMMUNITY'
  },
  {
    id: 'skill-3',
    name: '数据库设计与优化',
    description: 'PostgreSQL数据库设计、索引优化、查询优化',
    tags: ['PostgreSQL', 'SQL', 'Database'],
    author: { name: '赵六' },
    usageCount: 67,
    successRate: 94,
    avgScore: 4.7,
    visibility: 'COMMUNITY'
  }
]

onMounted(() => {
  fetchSkills()
})
</script>

<template>
  <div class="skills-view">
    <div class="container">
      <!-- 头部 -->
      <header class="header">
        <div class="header-content">
          <h1>Skill市场</h1>
          <p>复用优秀经验，提升开发效率</p>
        </div>
        <n-button type="primary">创建Skill</n-button>
      </header>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <n-input
          v-model:value="searchKeyword"
          placeholder="搜索Skill..."
          clearable
          size="large"
        >
          <template #prefix>
            <span>🔍</span>
          </template>
        </n-input>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <n-spin size="large" />
        <p>加载中...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <n-button @click="fetchSkills">重试</n-button>
      </div>

      <!-- Skill列表 -->
      <div v-else-if="filteredSkills.length > 0" class="skills-grid">
        <n-grid :cols="3" :x-gap="24" :y-gap="24">
          <n-gi v-for="skill in filteredSkills" :key="skill.id">
            <n-card hoverable class="skill-card">
              <template #header>
                <div class="skill-header">
                  <h3>{{ skill.name }}</h3>
                  <n-tag :type="getVisibilityType(skill.visibility)" size="small">
                    {{ getVisibilityText(skill.visibility) }}
                  </n-tag>
                </div>
              </template>
              
              <div class="skill-content">
                <p class="description">{{ skill.description }}</p>
                
                <!-- 技能标签 -->
                <div class="tags">
                  <n-tag 
                    v-for="tag in skill.tags" 
                    :key="tag"
                    size="small"
                    round
                  >
                    {{ tag }}
                  </n-tag>
                </div>

                <!-- 作者信息 -->
                <div class="author">
                  <span class="label">作者：</span>
                  {{ skill.author.name }}
                </div>

                <!-- 统计信息 -->
                <div class="stats">
                  <div class="stat">
                    <span class="value">{{ formatUsageCount(skill.usageCount) }}</span>
                    <span class="label">使用次数</span>
                  </div>
                  <div class="stat">
                    <span class="value">{{ skill.successRate }}%</span>
                    <span class="label">成功率</span>
                  </div>
                  <div class="stat">
                    <span class="value">{{ skill.avgScore }}</span>
                    <span class="label">评分</span>
                  </div>
                </div>
              </div>

              <template #footer>
                <div class="skill-actions">
                  <n-button size="small">查看详情</n-button>
                  <n-button size="small" type="primary">使用此Skill</n-button>
                </div>
              </template>
            </n-card>
          </n-gi>
        </n-grid>
      </div>

      <!-- 空状态 -->
      <n-empty v-else-if="searchKeyword && filteredSkills.length === 0" description="未找到相关Skill" class="empty-state">
        <template #extra>
          <n-button type="primary" @click="searchKeyword = ''">清除搜索</n-button>
        </template>
      </n-empty>

      <n-empty v-else description="暂无Skill" class="empty-state">
        <template #extra>
          <n-button type="primary">创建第一个Skill</n-button>
        </template>
      </n-empty>
    </div>
  </div>
</template>

<style scoped>
.skills-view {
  min-height: 100vh;
  background: #f5f7f9;
  padding: 24px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.header h1 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
}

.header p {
  color: #666;
}

.search-bar {
  max-width: 480px;
  margin-bottom: 32px;
}

.loading,
.error {
  text-align: center;
  padding: 60px 0;
}

.error {
  color: #f56c6c;
}

.skills-grid {
  margin-top: 24px;
}

.skill-card {
  border-radius: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
}

.skill-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skill-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.skill-content {
  padding: 8px 0;
}

.description {
  color: #666;
  margin-bottom: 16px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.author {
  color: #999;
  font-size: 14px;
  margin-bottom: 16px;
}

.author .label {
  color: #666;
}

.stats {
  display: flex;
  gap: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.stat {
  text-align: center;
}

.stat .value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #18a058;
}

.stat .label {
  font-size: 12px;
  color: #999;
}

.skill-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.empty-state {
  padding: 80px 0;
}
</style>
