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
    icon: '⟡',
    title: '发布项目',
    desc: '定义目标、预算与验收标准'
  },
  {
    icon: '◎',
    title: '认领任务',
    desc: '匹配技能，快速投入协作'
  },
  {
    icon: '◈',
    title: '用 Skill 完成',
    desc: '经验驱动交付，保证质量'
  }
]
</script>

<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">AI Project Manager</p>
          <h1>让经验以 Skill 的方式沉淀到项目里</h1>
          <p class="subtitle">更清晰的协作路径，更稳定的交付质量。</p>
          <div class="actions">
            <n-button type="primary" size="large">我是发起人</n-button>
            <n-button size="large" class="ghost-btn">我是参与者</n-button>
          </div>
          <div class="meta">
            <span>更少的沟通损耗</span>
            <span>更明确的职责边界</span>
            <span>更透明的结果</span>
          </div>
        </div>
        <div class="hero-card">
          <div class="card-header">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
          <div class="card-body">
            <div class="chip">项目进度 78%</div>
            <div class="progress-track">
              <div class="progress-bar"></div>
            </div>
            <div class="stat-grid">
              <div>
                <p class="stat-label">活跃项目</p>
                <p class="stat-value">12</p>
              </div>
              <div>
                <p class="stat-label">进行中任务</p>
                <p class="stat-value">36</p>
              </div>
              <div>
                <p class="stat-label">已完成</p>
                <p class="stat-value">128</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="features">
      <div class="container">
        <div class="section-header">
          <h2>简约而清晰的协作体验</h2>
          <p>用结构化流程减少模糊地带，让协作更顺滑。</p>
        </div>
        <n-grid :cols="3" :x-gap="20">
          <n-gi v-for="feat in features" :key="feat.title">
            <n-card class="feature-card">
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
  background:
    radial-gradient(600px 300px at 15% 15%, rgba(255, 242, 233, 0.9) 0%, rgba(255, 242, 233, 0) 60%),
    radial-gradient(500px 220px at 85% 0%, rgba(255, 236, 220, 0.8) 0%, rgba(255, 236, 220, 0) 60%),
    linear-gradient(140deg, #f9e6d6 0%, #f8dac8 40%, #f2cbb5 100%);
  color: #3a2a1f;
  padding: 84px 0 96px;
  position: relative;
  overflow: hidden;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  align-items: center;
  gap: 40px;
}

.hero-copy {
  text-align: left;
}

.eyebrow {
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #9a7f72;
  margin-bottom: 14px;
}

.hero h1 {
  font-family: "Georgia", "Times New Roman", "STSong", serif;
  font-size: 36px;
  margin-bottom: 14px;
}

.subtitle {
  font-size: 18px;
  color: #6f564a;
  margin-bottom: 28px;
}

.actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.ghost-btn {
  background: #fff7f0;
  border: 1px solid #f2d4c2;
}

.meta {
  display: flex;
  gap: 16px;
  margin-top: 20px;
  color: #9a7f72;
  font-size: 13px;
}

.meta span {
  padding: 6px 10px;
  background: rgba(255, 247, 240, 0.8);
  border-radius: 999px;
}

.hero-card {
  background: #fffaf6;
  border-radius: 18px;
  box-shadow: 0 18px 40px rgba(90, 54, 35, 0.12);
  border: 1px solid #f2d4c2;
  overflow: hidden;
}

.card-header {
  display: flex;
  gap: 6px;
  padding: 12px 16px;
  border-bottom: 1px solid #f2d4c2;
  background: #fff3e8;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #f2c0a8;
}

.card-body {
  padding: 20px 24px;
}

.chip {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: #ffe7d6;
  color: #8a5d47;
  font-size: 12px;
  margin-bottom: 14px;
}

.progress-track {
  width: 100%;
  height: 8px;
  background: #f4e2d5;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 18px;
}

.progress-bar {
  width: 78%;
  height: 100%;
  background: linear-gradient(90deg, #e39a72, #d67959);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-label {
  color: #9a7f72;
  font-size: 12px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #3a2a1f;
}

.features {
  padding: 64px 0;
  background: #fff7f0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 28px;
  gap: 20px;
}

.section-header h2 {
  font-size: 22px;
  color: #3a2a1f;
}

.section-header p {
  color: #8a6f62;
}

.feature-item {
  text-align: center;
}

.feature-item .icon {
  font-size: 28px;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: #fff1e6;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.feature-card {
  border-radius: 16px;
  border: 1px solid #f2d4c2;
  background: #fffaf6;
  box-shadow: 0 10px 24px rgba(90, 54, 35, 0.08);
}

@media (max-width: 960px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .hero-copy {
    text-align: center;
  }

  .actions,
  .meta {
    justify-content: center;
    flex-wrap: wrap;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
