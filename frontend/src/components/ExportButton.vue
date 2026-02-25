<template>
  <n-dropdown
    :options="exportOptions"
    @select="handleExport"
    placement="bottom-end"
  >
    <n-button :loading="loading">
      <template #icon>
        <n-icon><DownloadOutlined /></n-icon>
      </template>
      导出
      <template #suffix>
        <!-- <n-icon><ChevronDownOutlined /></n-icon> -->
      </template>
    </n-button>
  </n-dropdown>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import {
  NButton,
  NDropdown,
  NIcon,
  useMessage,
  type DropdownOption
} from 'naive-ui'
import { 
  DownloadOutlined, 
  // ChevronDownOutlined,
  FilePdfOutlined,
  FileExcelOutlined 
} from '@vicons/antd'
import { exportToPdf, exportToExcel, type ExportType } from '@/services/api'

// 图标组件
const FilePdfIcon = () => h(NIcon, null, { default: () => h(FilePdfOutlined) })
const FileExcelIcon = () => h(NIcon, null, { default: () => h(FileExcelOutlined) })

interface Props {
  exportType: ExportType
  projectId?: string
  projectIds?: string[]
  userId?: string
  filename?: string
}

const props = withDefaults(defineProps<Props>(), {
  filename: 'report'
})

const message = useMessage()
const loading = ref(false)

const exportOptions: DropdownOption[] = [
  {
    label: '导出为 PDF',
    key: 'pdf',
    icon: () => h(FilePdfIcon)
  },
  {
    label: '导出为 Excel',
    key: 'excel',
    icon: () => h(FileExcelIcon)
  }
]

const handleExport = async (key: string) => {
  if (loading.value) return
  
  loading.value = true
  
  try {
    if (key === 'pdf') {
      await exportToPdf({
        type: props.exportType,
        projectId: props.projectId,
        projectIds: props.projectIds,
        userId: props.userId,
        filename: props.filename
      })
      message.success('PDF导出成功')
    } else if (key === 'excel') {
      await exportToExcel({
        type: props.exportType,
        projectId: props.projectId,
        projectIds: props.projectIds,
        userId: props.userId,
        filename: props.filename
      })
      message.success('Excel导出成功')
    }
  } catch (error) {
    message.error('导出失败，请稍后重试')
    console.error('Export error:', error)
  } finally {
    loading.value = false
  }
}
</script>
