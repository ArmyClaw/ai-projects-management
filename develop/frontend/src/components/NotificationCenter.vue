<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NBadge, NButton, NDrawer, NDrawerContent, NIcon, NTag, NEmpty } from 'naive-ui'
import { 
  Notifications, 
  Assignment, 
  Payments, 
  Gavel, 
  Info, 
  Delete 
} from '@vicons/ionicons5'
import { useNotificationStore, type Notification } from '../stores/notification'
import { useMessage } from 'naive-ui'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

// 图标组件
const NotificationsIcon = Notifications
const AssignmentIcon = Assignment
const PaymentsIcon = Payments
const GavelIcon = Gavel
const InfoIcon = Info
const DeleteIcon = Delete

// Store
const notificationStore = useNotificationStore()

// 消息
const message = useMessage()

// 状态
const showDrawer = ref(false)
const currentPage = ref(1)
const hasMore = ref(true)

// 计算属性
const notifications = computed(() => notificationStore.notifications)
const unreadCount = computed(() => notificationStore.unreadCount)
const loading = computed(() => notificationStore.loading)
const hasUnread = computed(() => notificationStore.hasUnread)

/**
 * 获取图标组件
 */
function getIconComponent(type: Notification['type']) {
  switch (type) {
    case 'TASK_UPDATE':
      return AssignmentIcon
    case 'SETTLEMENT':
      return PaymentsIcon
    case 'DISPUTE':
      return GavelIcon
    case 'SYSTEM':
      return InfoIcon
    default:
      return NotificationsIcon
  }
}

/**
 * 获取图标颜色
 */
function getIconColor(type: Notification['type']): string {
  switch (type) {
    case 'TASK_UPDATE':
      return '#2080f0'
    case 'SETTLEMENT':
      return '#18a058'
    case 'DISPUTE':
      return '#f0a020'
    case 'SYSTEM':
      return '#808080'
    default:
      return '#2080f0'
  }
}

/**
 * 获取类型标签
 */
function getTypeTag(type: Notification['type']): 'default' | 'success' | 'warning' | 'error' {
  switch (type) {
    case 'TASK_UPDATE':
      return 'default'
    case 'SETTLEMENT':
      return 'success'
    case 'DISPUTE':
      return 'warning'
    case 'SYSTEM':
      return 'default'
    default:
      return 'default'
  }
}

/**
 * 获取类型标签文字
 */
function getTypeLabel(type: Notification['type']): string {
  switch (type) {
    case 'TASK_UPDATE':
      return '任务'
    case 'SETTLEMENT':
      return '结算'
    case 'DISPUTE':
      return '争议'
    case 'SYSTEM':
      return '系统'
    default:
      return '通知'
  }
}

/**
 * 格式化时间
 */
function formatTime(time: string): string {
  return dayjs(time).fromNow()
}

/**
 * 处理通知点击
 */
async function handleNotificationClick(notification: Notification) {
  if (!notification.isRead) {
    await notificationStore.markAsRead(notification.id)
  }
  
  // 如果有关联数据，可以跳转到对应页面
  if (notification.data && notification.data.link) {
    // 跳转到对应页面
    window.location.href = notification.data.link
  }
}

/**
 * 标记全部已读
 */
async function markAllAsRead() {
  const success = await notificationStore.markAllAsRead()
  if (success) {
    message.success('已全部标记为已读')
  }
}

/**
 * 删除通知
 */
async function deleteNotification(id: string) {
  const success = await notificationStore.deleteNotification(id)
  if (success) {
    message.success('删除成功')
  }
}

/**
 * 刷新通知列表
 */
async function refresh() {
  currentPage.value = 1
  await notificationStore.fetchNotifications({ page: 1, pageSize: 20 })
  hasMore.value = notifications.value.length < notificationStore.notifications.length
}

/**
 * 加载更多
 */
async function loadMore() {
  currentPage.value++
  await notificationStore.fetchNotifications({ 
    page: currentPage.value, 
    pageSize: 20 
  })
  hasMore.value = notifications.value.length < notificationStore.notifications.length
}

// 初始化
onMounted(() => {
  notificationStore.fetchNotifications({ page: 1, pageSize: 20 })
})
</script>

<template>
  <div class="notification-center">
    <!-- 通知图标按钮 -->
    <n-badge :value="unreadCount" :max="99" v-if="hasUnread">
      <n-button quaternary circle @click="showDrawer = true">
        <template #icon>
          <n-icon>
            <NotificationsIcon />
          </n-icon>
        </template>
      </n-button>
    </n-badge>
    <n-button v-else quaternary circle @click="showDrawer = true">
      <template #icon>
        <n-icon>
          <NotificationsIcon />
        </n-icon>
      </n-button>
    </n-button>

    <!-- 通知抽屉 - 带过渡动画 -->
    <n-drawer v-model:show="showDrawer" :width="400" placement="right">
      <Transition name="drawer-slide">
        <n-drawer-content v-if="showDrawer" title="通知中心" closable>
          <!-- 工具栏 -->
          <div class="notification-toolbar">
            <n-button size="small" @click="markAllAsRead" :disabled="unreadCount === 0">
              全部已读
            </n-button>
            <n-button size="small" quaternary @click="refresh">
              刷新
            </n-button>
          </div>

          <!-- 通知列表 -->
          <div class="notification-list" v-if="notifications.length > 0">
            <TransitionGroup name="notification-list">
              <div
                v-for="notification in notifications"
                :key="notification.id"
                class="notification-item"
                :class="{ 'is-unread': !notification.isRead }"
                @click="handleNotificationClick(notification)"
              >
                <!-- 通知图标 -->
                <div class="notification-icon">
                  <n-icon :size="24" :color="getIconColor(notification.type)">
                    <component :is="getIconComponent(notification.type)" />
                  </n-icon>
                </div>

                <!-- 通知内容 -->
                <div class="notification-content">
                  <div class="notification-header">
                    <span class="notification-title">{{ notification.title }}</span>
                    <n-tag size="small" :type="getTypeTag(notification.type)">
                      {{ getTypeLabel(notification.type) }}
                    </n-tag>
                  </div>
                  <div class="notification-message">{{ notification.message }}</div>
                  <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
                </div>

                <!-- 删除按钮 -->
                <div class="notification-actions">
                  <n-button quaternary size="small" @click.stop="deleteNotification(notification.id)">
                    <template #icon>
                      <n-icon><DeleteIcon /></n-icon>
                    </template>
                  </n-button>
                </div>
              </div>
            </TransitionGroup>
          </div>

          <!-- 空状态 -->
          <n-empty v-else description="暂无通知" />

          <!-- 加载更多 -->
          <div class="load-more" v-if="hasMore">
            <n-button size="small" :loading="loading" @click="loadMore">
              加载更多
            </n-button>
          </div>
        </n-drawer-content>
      </Transition>
    </n-drawer>
  </div>
</template>

<style scoped>
.notification-center {
  display: inline-flex;
  align-items: center;
}

/* ========================
   抽屉滑入动画
   ======================== */
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: all 0.3s ease;
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.drawer-slide-enter-to,
.drawer-slide-leave-from {
  opacity: 1;
  transform: translateX(0);
}

/* ========================
   通知列表动画
   ======================== */
.notification-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notification-list-enter-active,
.notification-list-leave-active {
  transition: all 0.3s ease;
}

.notification-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.notification-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.notification-list-move {
  transition: transform 0.3s ease;
}

/* ========================
   基础样式
   ======================== */
.notification-toolbar {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 12px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f5f5f5;
}

.notification-item.is-unread {
  background-color: #e6f7ff;
}

.notification-item.is-unread:hover {
  background-color: #bae7ff;
}

.notification-icon {
  margin-right: 12px;
  padding-top: 2px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.notification-title {
  font-weight: 500;
  font-size: 14px;
  color: #333;
}

.notification-message {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

.notification-actions {
  margin-left: 8px;
}

.load-more {
  text-align: center;
  padding: 16px;
}

/* 深色模式适配 */
html.dark .notification-toolbar {
  border-bottom-color: #2d2d44;
}

html.dark .notification-item:hover {
  background-color: #2d2d44;
}

html.dark .notification-item.is-unread {
  background-color: rgba(32, 128, 240, 0.1);
}

html.dark .notification-item.is-unread:hover {
  background-color: rgba(32, 128, 240, 0.2);
}

html.dark .notification-title {
  color: #eaeaea;
}

html.dark .notification-message {
  color: #a0a0a0;
}
</style>
