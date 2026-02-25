<script setup lang="ts">
import { NButton, NCard, NGrid, NGi } from 'naive-ui'

/**
 * 首页视图
 * 
 * 功能：
 * - 展示项目核心价值
 * - 提供发起人和参与者入口
 */

// 功能特性数据
const features = [
  {
    icon: '🏢',
    title: '发布项目',
    desc: '发起你的项目，设置预算和验收标准'
  },
  {
    icon: '🤝',
    title: '认领任务',
    desc: '展示你的技能，参与感兴趣的项目'
  },
  {
    icon: '⚡',
    title: '用Skill完成',
    desc: '经验驱动交付，高质量产出'
  }
]
</script>

<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <h1>优秀的人的经验，以Skill方式用于项目各环节</h1>
        <p class="subtitle">这是未来人机协作完成项目的方式</p>
        <div class="actions">
          <n-button type="primary" size="large">我是发起人</n-button>
          <n-button size="large">我是参与者</n-button>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="features">
      <div class="container">
        <n-grid :cols="3" :x-gap="24">
          <n-gi v-for="feat in features" :key="feat.title">
            <n-card>
              <div class="feature-item">
                <span class="icon">{{ feat.icon }}</span>
                <h3>{{ feat.title }}</h3>
                <p>{{ feat.desc }}</p>
              </div>
            </n-card>
          </n-gi>
        </n-grid>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
}

.hero {
  background: radial-gradient(1200px 400px at 50% -50%, rgba(255, 241, 230, 0.9) 0%, rgba(255, 241, 230, 0) 60%),
    linear-gradient(135deg, #f6a06c 0%, #e07a47 45%, #d86a56 100%);
  color: #fffaf6;
  padding: 80px 0;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero h1 {
  font-family: "Georgia", "Times New Roman", "STSong", serif;
  font-size: 36px;
  margin-bottom: 16px;
}

.subtitle {
  font-size: 18px;
  color: rgba(255, 250, 246, 0.88);
  margin-bottom: 32px;
}

.actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.features {
  padding: 60px 0;
  background: linear-gradient(180deg, #fff7f0 0%, #fff1e6 100%);
}

.feature-item {
  text-align: center;
}

.feature-item .icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
}

.feature-item h3 {
  font-size: 18px;
  margin-bottom: 8px;
}

.feature-item p {
  color: #6f564a;
}
</style>
