<template>
  <div class="milestone-manager">
    <!-- 工具栏 -->
    <div class="toolbar">
      <n-button type="primary" @click="showCreateModal = true">
        <template #icon>
          <n-icon><PlusOutlined /></n-icon>
        </template>
        添加里程碑
      </n-button>
      <n-select
        v-model:value="statusFilter"
        :options="statusOptions"
        placeholder="状态筛选"
        clearable
        style="width: 150px"
        @update:value="fetchMilestones"
      />
    </div>

    <!-- 里程碑列表 -->
    <div class="milestone-list">
      <n-empty v-if="loading && !milestones.length" description="加载中..." />
      <n-empty v-else-if="!milestones.length" description="暂无里程碑" />
      
      <div v-else class="milestone-items">
        <div
          v-for="milestone in milestones"
          :key="milestone.id"
          class="milestone-item"
          :class="{ completed: milestone.status === 'COMPLETED', overdue: isOverdue(milestone) }"
        >
          <div class="milestone-status">
            <n-tag :type="getStatusType(milestone.status)" size="small">
              {{ getStatusText(milestone.status) }}
            </n-tag>
          </div>
          
          <div class="milestone-content">
            <div class="milestone-name">{{ milestone.name }}</div>
            <div class="milestone-description" v-if="milestone.description">
              {{ milestone.description }}
            </div>
            <div class="milestone-date">
              <n-icon><CalendarOutlined /></n-icon>
              截止日期: {{ formatDate(milestone.dueDate) }}
            </div>
          </div>
          
          <div class="milestone-actions">
            <n-button
              v-if="milestone.status === 'PENDING'"
              type="success"
              size="small"
              @click="completeMilestone(milestone)"
            >
              完成
            </n-button>
            <n-button
              v-if="milestone.status !== 'COMPLETED'"
              type="error"
              size="small"
              @click="deleteMilestone(milestone)"
            >
              删除
            </n-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建里程碑弹窗 -->
    <n-modal v-model:show="showCreateModal" preset="dialog" title="添加里程碑">
      <n-form ref="formRef" :model="formData" :rules="formRules" label-placement="left" label-width="80">
        <n-form-item label="名称" path="name">
          <n-input v-model:value="formData.name" placeholder="请输入里程碑名称" />
        </n-form-item>
        <n-form-item label="描述" path="description">
          <n-input
            v-model:value="formData.description"
            type="textarea"
            placeholder="请输入里程碑描述（可选）"
            :rows="3"
          />
        </n-form-item>
        <n-form-item label="截止日期" path="dueDate">
          <n-date-picker v-model:value="formData.dueDate" type="date" style="width: 100%" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showCreateModal = false">取消</n-button>
        <n-button type="primary" @click="handleCreate" :loading="submitting">创建</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  NButton,
  NIcon,
  NSelect,
  NEmpty,
  NTag,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NDatePicker,
  useMessage
} from 'naive-ui'
import { PlusOutlined, CalendarOutlined } from '@vicons/antd'
import type { Milestone, CreateMilestoneRequest } from '@/services/api'
import { getProjectMilestones, createProjectMilestone } from '@/services/api'

interface Props {
  projectId: string
}

const props = defineProps<Props>()

const message = useMessage()

const loading = ref(false)
const submitting = ref(false)
const milestones = ref<Milestone[]>([])
const statusFilter = ref<string | null>(null)
const showCreateModal = ref(false)

const statusOptions = [
  { label: '待完成', value: 'PENDING' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已逾期', value: 'OVERDUE' }
]

const formData = ref<CreateMilestoneRequest>({
  name: '',
  description: '',
  dueDate: Date.now()
})

const formRules = {
  name: { required: true, message: '请输入里程碑名称', trigger: 'blur' },
  dueDate: { required: true, message: '请选择截止日期', trigger: 'change' }
}

const fetchMilestones = async () => {
  loading.value = true
  try {
    milestones.value = await getProjectMilestones(props.projectId, statusFilter.value || undefined)
  } catch (error) {
    message.error('获取里程碑列表失败')
  } finally {
    loading.value = false
  }
}

const handleCreate = async () => {
  if (!formData.value.name.trim()) {
    message.warning('请输入里程碑名称')
    return
  }

  submitting.value = true
  try {
    const newMilestone = await createProjectMilestone(props.projectId, {
      name: formData.value.name,
      description: formData.value.description,
      dueDate: new Date(formData.value.dueDate).toISOString()
    })
    milestones.value.push(newMilestone)
    showCreateModal.value = false
    formData.value = { name: '', description: '', dueDate: Date.now() }
    message.success('里程碑创建成功')
  } catch (error) {
    message.error('创建里程碑失败')
  } finally {
    submitting.value = false
  }
}

const completeMilestone = async (milestone: Milestone) => {
  // 这里可以调用API更新状态
  milestone.status = 'COMPLETED'
  message.success('里程碑已完成')
}

const deleteMilestone = async (milestone: Milestone) => {
  // 这里可以调用API删除
  const index = milestones.value.findIndex(m => m.id === milestone.id)
  if (index > -1) {
    milestones.value.splice(index, 1)
    message.success('里程碑已删除')
  }
}

const isOverdue = (milestone: Milestone): boolean => {
  if (milestone.status === 'COMPLETED') return false
  return new Date(milestone.dueDate) < new Date()
}

const getStatusType = (status: string): 'default' | 'success' | 'warning' | 'error' => {
  switch (status) {
    case 'COMPLETED':
      return 'success'
    case 'OVERDUE':
      return 'error'
    default:
      return 'warning'
  }
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'COMPLETED':
      return '已完成'
    case 'OVERDUE':
      return '已逾期'
    default:
      return '待完成'
  }
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

onMounted(() => {
  fetchMilestones()
})
</script>

<style scoped>
.milestone-manager {
  padding: 16px;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.milestone-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.milestone-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #eee;
  transition: all 0.3s;
}

.milestone-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.milestone-item.completed {
  opacity: 0.7;
  background: #f6ffed;
  border-color: #b7eb8f;
}

.milestone-item.overdue {
  background: #fff2f0;
  border-color: #ffa39e;
}

.milestone-status {
  flex-shrink: 0;
}

.milestone-content {
  flex: 1;
  min-width: 0;
}

.milestone-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.milestone-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  white-space: pre-wrap;
}

.milestone-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #999;
}

.milestone-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
</style>
