<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NCard, NButton, NTag, NGrid, NGi, NAvatar, NProgress, NInput, NRate } from 'naive-ui'
import axios, { AxiosError } from 'axios'

/**
 * 个人档案视图
 * 
 * 功能：
 * - 展示用户基本信息
 * - 显示统计数据（已完成项目、成功案例、信用评分）
 * - 展示技能标签
 * - 支持编辑个人资料
 */

interface User {
  id: string
  name: string
  email: string
  avatar: string
  bio: string
  title: string
  location: string
  joinedAt: string
  skills: string[]
  stats: {
    completedProjects: number
    successCases: number
    creditScore: number
    totalEarnings: number
    tasksCompleted: number
    rating: number
  }
}

const user = ref<User | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const isEditing = ref(false)

// 编辑表单
const editForm = ref({
  name: '',
  title: '',
  bio: '',
  location: ''
})

/**
 * 获取用户信息
 */
async function fetchUser() {
  loading.value = true
  error.value = null
  
  try {
    const response = await axios.get('http://localhost:4000/api/v1/users/profile')
    if (response.data.success) {
      user.value = response.data.data.user
      initEditForm()
    }
  } catch (err) {
    const axiosError = err as AxiosError
    error.value = axiosError.message || '获取用户信息失败'
    user.value = mockUser
    initEditForm()
  } finally {
    loading.value = false
  }
}

/**
 * 初始化编辑表单
 */
function initEditForm() {
  if (user.value) {
    editForm.value = {
      name: user.value.name,
      title: user.value.title,
      bio: user.value.bio,
      location: user.value.location
    }
  }
}

/**
 * 开始编辑
 */
function startEdit() {
  initEditForm()
  isEditing.value = true
}

/**
 * 取消编辑
 */
function cancelEdit() {
  isEditing.value = false
}

/**
 * 保存编辑
 */
async function saveEdit() {
  if (!user.value) return
  
  try {
    // 模拟保存
    user.value.name = editForm.value.name
    user.value.title = editForm.value.title
    user.value.bio = editForm.value.bio
    user.value.location = editForm.value.location
    isEditing.value = false
  } catch (err) {
    const axiosError = err as AxiosError
    error.value = axiosError.message || '保存失败'
  }
}

/**
 * 获取信用等级
 */
function getCreditLevel(score: number): { level: string; type: 'success' | 'info' | 'warning' | 'error' } {
  if (score >= 90) return { level: '优秀', type: 'success' }
  if (score >= 70) return { level: '良好', type: 'info' }
  if (score >= 50) return { level: '一般', type: 'warning' }
  return { level: '待提升', type: 'error' }
}

/**
 * 格式化时间
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 模拟用户数据
const mockUser: User = {
  id: 'user-1',
  name: '张三',
  email: 'zhangsan@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ZhangSan',
  bio: '全栈开发者，专注于AI应用开发，拥有5年开发经验。热爱开源贡献，善于解决复杂技术问题。',
  title: '高级全栈工程师',
  location: '北京市',
  joinedAt: new Date(Date.now() - 86400000 * 365).toISOString(),
  skills: ['Vue 3', 'TypeScript', 'Python', 'FastAPI', 'PostgreSQL', 'Docker', 'AI/ML', 'RESTful API'],
  stats: {
    completedProjects: 23,
    successCases: 18,
    creditScore: 92,
    totalEarnings: 156000,
    tasksCompleted: 67,
    rating: 4.8
  }
}

onMounted(() => {
  fetchUser()
})
</script>

<template>
  <div class="profile-view">
    <div class="container">
      <!-- 头部 -->
      <header class="header">
        <div class="header-content">
          <h1>个人档案</h1>
          <p>管理您的个人信息和统计</p>
        </div>
        <n-button 
          v-if="!isEditing" 
          type="primary" 
          @click="startEdit"
        >
          编辑资料
        </n-button>
        <nspace v-else>
          <n-button @click="cancelEdit">取消</n-button>
          <n-button type="primary" @click="saveEdit">保存</n-button>
        </nspace>
      </header>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <n-spin size="large" />
        <p>加载中...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error && !user" class="error">
        <p>{{ error }}</p>
        <n-button @click="fetchUser">重试</n-button>
      </div>

      <!-- 用户信息 -->
      <div v-else-if="user" class="profile-content">
        <n-grid :cols="1" :x-gap="24" :y-gap="24" responsive="screen" :item-responsive="true">
          <!-- 基本信息卡片 -->
          <n-gi>
            <n-card class="info-card">
              <div class="profile-header">
                <n-avatar 
                  :src="user.avatar" 
                  :size="100" 
                  round
                  class="avatar"
                />
                <div class="profile-info">
                  <template v-if="isEditing">
                    <div class="edit-field">
                      <label>昵称</label>
                      <n-input v-model:value="editForm.name" placeholder="请输入昵称" />
                    </div>
                    <div class="edit-field">
                      <label>职位</label>
                      <n-input v-model:value="editForm.title" placeholder="请输入职位" />
                    </div>
                    <div class="edit-field">
                      <label>所在地</label>
                      <n-input v-model:value="editForm.location" placeholder="请输入所在地" />
                    </div>
                    <div class="edit-field">
                      <label>个人简介</label>
                      <n-input 
                        v-model:value="editForm.bio" 
                        type="textarea" 
                        placeholder="请输入个人简介"
                        :rows="3"
                      />
                    </div>
                  </template>
                  <template v-else>
                    <h2>{{ user.name }}</h2>
                    <p class="title">{{ user.title }}</p>
                    <p class="location">📍 {{ user.location }}</p>
                    <p class="bio">{{ user.bio }}</p>
                    <p class="join-date">加入时间：{{ formatDate(user.joinedAt) }}</p>
                  </template>
                </div>
              </div>
            </n-card>
          </n-gi>

          <!-- 统计数据卡片 -->
          <n-gi>
            <n-card class="stats-card">
              <template #header>
                <div class="card-header">
                  <h3>📊 数据统计</h3>
                </div>
              </template>
              
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-icon completed">
                    <span>📁</span>
                  </div>
                  <div class="stat-content">
                    <span class="stat-value">{{ user.stats.completedProjects }}</span>
                    <span class="stat-label">已完成项目</span>
                  </div>
                </div>

                <div class="stat-item">
                  <div class="stat-icon success">
                    <span>🏆</span>
                  </div>
                  <div class="stat-content">
                    <span class="stat-value">{{ user.stats.successCases }}</span>
                    <span class="stat-label">成功案例</span>
                  </div>
                </div>

                <div class="stat-item">
                  <div class="stat-icon credit">
                    <span>⭐</span>
                  </div>
                  <div class="stat-content">
                    <div class="credit-score">
                      <span class="stat-value">{{ user.stats.creditScore }}</span>
                      <n-tag 
                        :type="getCreditLevel(user.stats.creditScore).type" 
                        size="small"
                      >
                        {{ getCreditLevel(user.stats.creditScore).level }}
                      </n-tag>
                    </div>
                    <span class="stat-label">信用评分</span>
                  </div>
                </div>

                <div class="stat-item">
                  <div class="stat-icon earnings">
                    <span>💰</span>
                  </div>
                  <div class="stat-content">
                    <span class="stat-value">¥{{ (user.stats.totalEarnings / 10000).toFixed(1) }}w</span>
                    <span class="stat-label">总收入</span>
                  </div>
                </div>

                <div class="stat-item">
                  <div class="stat-icon tasks">
                    <span>✅</span>
                  </div>
                  <div class="stat-content">
                    <span class="stat-value">{{ user.stats.tasksCompleted }}</span>
                    <span class="stat-label">完成任务</span>
                  </div>
                </div>

                <div class="stat-item">
                  <div class="stat-icon rating">
                    <span>💎</span>
                  </div>
                  <div class="stat-content">
                    <div class="rating-display">
                      <span class="stat-value">{{ user.stats.rating }}</span>
                      <n-rate :value="user.stats.rating" readonly size="small" />
                    </div>
                    <span class="stat-label">综合评分</span>
                  </div>
                </div>
              </div>

              <!-- 信用评分进度条 -->
              <div class="credit-progress">
                <div class="progress-header">
                  <span>信用成长值</span>
                  <span>{{ user.stats.creditScore }}/100</span>
                </div>
                <n-progress
                  type="line"
                  :percentage="user.stats.creditScore"
                  :show-indicator="false"
                  :height="8"
                  :border-radius="4"
                  :fill-border-radius="4"
                  :color="user.stats.creditScore >= 90 ? '#18a058' : user.stats.creditScore >= 70 ? '#2080f0' : '#f0a020'"
                />
              </div>
            </n-card>
          </n-gi>

          <!-- 技能标签卡片 -->
          <n-gi>
            <n-card class="skills-card">
              <template #header>
                <div class="card-header">
                  <h3>🛠️ 技能标签</h3>
                  <n-tag type="info" size="small">共 {{ user.skills.length }} 项</n-tag>
                </div>
              </template>
              
              <div class="skills-content">
                <div class="skills-grid">
                  <n-tag
                    v-for="(skill, index) in user.skills"
                    :key="skill"
                    :type="['default', 'primary', 'success', 'warning', 'info'][index % 5]"
                    size="medium"
                    round
                    class="skill-tag"
                  >
                    {{ skill }}
                  </n-tag>
                </div>

                <!-- 技能认证进度 -->
                <div class="certification-progress">
                  <div class="progress-header">
                    <span>技能认证</span>
                    <span>{{ user.stats.completedProjects }}/{{ user.stats.completedProjects + 5 }} 已认证</span>
                  </div>
                  <n-progress
                    type="line"
                    :percentage="(user.stats.completedProjects / (user.stats.completedProjects + 5)) * 100"
                    :show-indicator="false"
                    :height="6"
                    :border-radius="3"
                    :fill-border-radius="3"
                    color="#18a058"
                  />
                </div>
              </div>
            </n-card>
          </n-gi>

          <!-- 最近活动卡片 -->
          <n-gi>
            <n-card class="activity-card">
              <template #header>
                <div class="card-header">
                  <h3>📈 能力雷达</h3>
                </div>
              </template>
              
              <div class="radar-placeholder">
                <div class="radar-grid">
                  <div class="radar-item" v-for="i in 5" :key="i">
                    <div class="radar-bar" :style="{ width: (70 + Math.random() * 30) + '%' }">
                      <span class="radar-label">{{ ['开发', '设计', '协作', '创新', '效率'][i-1] }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </n-card>
          </n-gi>
        </n-grid>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-view {
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

.loading,
.error {
  text-align: center;
  padding: 60px 0;
}

.error {
  color: #f56c6c;
}

.profile-content {
  margin-top: 24px;
}

/* 基本信息卡片 */
.info-card {
  border-radius: 16px;
}

.profile-header {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.avatar {
  flex-shrink: 0;
  border: 4px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.profile-info {
  flex: 1;
}

.profile-info h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.profile-info .title {
  font-size: 16px;
  color: #18a058;
  font-weight: 500;
  margin: 0 0 8px 0;
}

.profile-info .location {
  color: #666;
  font-size: 14px;
  margin: 0 0 12px 0;
}

.profile-info .bio {
  color: #666;
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.profile-info .join-date {
  color: #999;
  font-size: 13px;
  margin: 0;
}

.edit-field {
  margin-bottom: 16px;
}

.edit-field label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

/* 通用卡片样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.stats-card,
.skills-card,
.activity-card {
  border-radius: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stats-card:hover,
.skills-card:hover,
.activity-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

/* 统计数据 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: transform 0.2s;
}

.stat-item:hover {
  transform: scale(1.02);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.completed {
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
}

.stat-icon.success {
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
}

.stat-icon.credit {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
}

.stat-icon.earnings {
  background: linear-gradient(135deg, #fce4ec, #f8bbd9);
}

.stat-icon.tasks {
  background: linear-gradient(135deg, #f3e5f5, #e1bee7);
}

.stat-icon.rating {
  background: linear-gradient(135deg, #fff8e1, #ffecb3);
}

.stat-content {
  flex: 1;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #333;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.credit-score,
.rating-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.credit-progress {
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

/* 技能卡片 */
.skills-content {
  padding: 8px 0;
}

.skills-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}

.skill-tag {
  transition: transform 0.2s;
}

.skill-tag:hover {
  transform: scale(1.05);
}

.certification-progress {
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.certification-progress .progress-header {
  margin-bottom: 12px;
}

/* 能力雷达 */
.radar-placeholder {
  padding: 16px 0;
}

.radar-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.radar-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.radar-bar {
  height: 32px;
  background: linear-gradient(90deg, #18a058, #36ad6a);
  border-radius: 6px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  min-width: 80px;
  transition: width 0.3s ease;
}

.radar-label {
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}

/* 响应式 */
@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-item {
    flex-direction: column;
    text-align: center;
  }

  .header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
}
</style>
