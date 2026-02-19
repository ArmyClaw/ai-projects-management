import { createI18n } from 'vue-i18n'

const messages = {
  'zh-CN': {
    nav: {
      home: '首页',
      projects: '项目',
      tasks: '任务大厅',
      skills: 'Skill市场',
      profile: '个人中心'
    },
    project: {
      create: '发布项目',
      list: '项目列表',
      budget: '预算',
      milestones: '环节'
    },
    task: {
      claim: '认领任务',
      submit: '标记完成',
      review: '验收'
    },
    common: {
      submit: '提交',
      cancel: '取消',
      confirm: '确认',
      language: '语言',
      loading: '加载中...',
      noData: '暂无数据'
    }
  },
  'en-US': {
    nav: {
      home: 'Home',
      projects: 'Projects',
      tasks: 'Task Hall',
      skills: 'Skill Market',
      profile: 'Profile'
    },
    project: {
      create: 'Create Project',
      list: 'Project List',
      budget: 'Budget',
      milestones: 'Milestones'
    },
    task: {
      claim: 'Claim Task',
      submit: 'Mark Complete',
      review: 'Review'
    },
    common: {
      submit: 'Submit',
      cancel: 'Cancel',
      confirm: 'Confirm',
      language: 'Language',
      loading: 'Loading...',
      noData: 'No data'
    }
  }
}

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || 'zh-CN',
  fallbackLocale: 'en-US',
  messages
})

export default i18n
