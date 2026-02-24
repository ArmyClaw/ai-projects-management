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
      milestones: '环节',
      myProjects: '我的项目',
      initiator: '发起人',
      progress: '进度',
      viewDetail: '查看详情',
      manage: '管理',
      noProjects: '暂无项目',
      firstProject: '发起第一个项目'
    },
    task: {
      claim: '认领任务',
      submit: '标记完成',
      review: '验收',
      taskHall: '任务大厅',
      available: '可认领',
      claimed: '已认领',
      allTasks: '全部任务',
      noTasks: '暂无任务',
      claimNow: '立即认领',
      noMatchingTasks: '暂时没有符合条件任务'
    },
    skill: {
      market: 'Skill市场'
    },
    common: {
      submit: '提交',
      cancel: '取消',
      confirm: '确认',
      language: '语言',
      loading: '加载中...',
      noData: '暂无数据',
      retry: '重试',
      loadFailed: '加载失败'
    },
    home: {
      title: '优秀的人的经验，以Skill方式用于项目各环节',
      subtitle: '这是未来人机协作完成项目的方式',
      initiator: '我是发起人',
      participant: '我是参与者',
      publishProject: '发布项目',
      claimTask: '认领任务',
      completeWithSkill: '用Skill完成',
      publishDesc: '发起你的项目，设置预算和验收标准',
      claimDesc: '展示你的技能，参与感兴趣的项目',
      completeDesc: '经验驱动交付，高质量产出'
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
      milestones: 'Milestones',
      myProjects: 'My Projects',
      initiator: 'Initiator',
      progress: 'Progress',
      viewDetail: 'View Details',
      manage: 'Manage',
      noProjects: 'No Projects',
      firstProject: 'Start Your First Project'
    },
    task: {
      claim: 'Claim Task',
      submit: 'Mark Complete',
      review: 'Review',
      taskHall: 'Task Hall',
      available: 'Available',
      claimed: 'Claimed',
      allTasks: 'All Tasks',
      noTasks: 'No Tasks',
      claimNow: 'Claim Now',
      noMatchingTasks: 'No matching tasks available'
    },
    skill: {
      market: 'Skill Market'
    },
    common: {
      submit: 'Submit',
      cancel: 'Cancel',
      confirm: 'Confirm',
      language: 'Language',
      loading: 'Loading...',
      noData: 'No data',
      retry: 'Retry',
      loadFailed: 'Load failed'
    },
    home: {
      title: 'Excellent human experience, used in project phases through Skills',
      subtitle: 'This is the future of human-machine collaboration on projects',
      initiator: 'I am an Initiator',
      participant: 'I am a Participant',
      publishProject: 'Publish Project',
      claimTask: 'Claim Task',
      completeWithSkill: 'Complete with Skill',
      publishDesc: 'Launch your project, set budget and acceptance criteria',
      claimDesc: 'Showcase your skills and participate in projects you are interested in',
      completeDesc: 'Experience-driven delivery, high-quality output'
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
