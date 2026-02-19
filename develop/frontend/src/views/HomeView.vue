<script setup lang="ts">
import { NButton, NCard, NGrid, NGi } from 'naive-ui'

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
  background: linear-gradient(135deg, #18a058 0%, #36ad6a 100%);
  color: #fff;
  padding: 80px 0;
  text-align: center;
}

.hero h1 {
  font-size: 36px;
  margin-bottom: 16px;
}

.subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 32px;
}

.actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.features {
  padding: 60px 0;
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
  color: #666;
}
</style>
