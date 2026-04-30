export const translations = {
  en: {
    common: {
      book_now: 'Book Now',
      learn_more: 'Learn More',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      close: 'Close',
      sign_in: 'Sign In',
      sign_up: 'Sign Up',
      sign_out: 'Sign Out',
      dashboard: 'Dashboard',
      my_bookings: 'My Bookings',
      favorites: 'Favorites',
      profile: 'Profile',
      settings: 'Settings'
    },
    services: {
      cleaning: 'Cleaning Services',
      cooking: 'Cooking Services',
      gardening: 'Gardening Services',
      personal: 'Personal Care',
      maintenance: 'Home Maintenance',
      title: 'Our Services',
      subtitle: 'Professional care services tailored to your needs'
    },
    booking: {
      title: 'Book a Service',
      select_date: 'Select Date',
      select_time: 'Select Time',
      select_provider: 'Select Provider',
      confirm: 'Confirm Booking',
      total: 'Total',
      special_instructions: 'Special Instructions',
      your_address: 'Your Address'
    },
    status: {
      pending: 'Pending',
      confirmed: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled'
    },
    feedback: {
      title: 'Share Your Feedback',
      rating: 'Rating',
      review: 'Your Review',
      submit: 'Submit Feedback',
      thank_you: 'Thank you for your feedback!'
    },
    provider: {
      availability: 'Availability Schedule',
      add_window: 'Add Time Window',
      save: 'Save Availability',
      day: 'Day',
      start: 'Start Time',
      end: 'End Time',
      break: 'Break (min)'
    },
    home: {
      hero_title: 'Quality Care at Your Fingertips',
      hero_subtitle: 'Connect with trusted care providers',
      get_started: 'Get Started',
      go_to_dashboard: 'Go to Dashboard',
      our_services: 'Our Services',
      top_providers: 'Top Rated Providers Near You',
      become_provider: 'Become a Care Provider',
      join_network: 'Join our network of trusted care professionals',
      apply_now: 'Apply Now'
    }
  },
  zh: {
    common: {
      book_now: '立即预约',
      learn_more: '了解更多',
      loading: '加载中...',
      error: '错误',
      success: '成功',
      save: '保存',
      cancel: '取消',
      confirm: '确认',
      back: '返回',
      next: '下一步',
      close: '关闭',
      sign_in: '登录',
      sign_up: '注册',
      sign_out: '退出',
      dashboard: '控制面板',
      my_bookings: '我的预约',
      favorites: '收藏',
      profile: '个人资料',
      settings: '设置'
    },
    services: {
      cleaning: '清洁服务',
      cooking: '烹饪服务',
      gardening: '园艺服务',
      personal: '个人护理',
      maintenance: '家居维修',
      title: '我们的服务',
      subtitle: '为您量身定制的专业护理服务'
    },
    booking: {
      title: '预约服务',
      select_date: '选择日期',
      select_time: '选择时间',
      select_provider: '选择服务商',
      confirm: '确认预约',
      total: '总计',
      special_instructions: '特殊要求',
      your_address: '您的地址'
    },
    status: {
      pending: '待确认',
      confirmed: '已确认',
      completed: '已完成',
      cancelled: '已取消'
    },
    feedback: {
      title: '分享您的反馈',
      rating: '评分',
      review: '您的评价',
      submit: '提交反馈',
      thank_you: '感谢您的反馈！'
    },
    provider: {
      availability: '可用时间设置',
      add_window: '添加时间段',
      save: '保存设置',
      day: '星期',
      start: '开始时间',
      end: '结束时间',
      break: '休息(分钟)'
    },
    home: {
      hero_title: '优质护理服务，触手可及',
      hero_subtitle: '连接值得信赖的护理服务提供者',
      get_started: '开始使用',
      go_to_dashboard: '进入控制面板',
      our_services: '我们的服务',
      top_providers: '您附近的热门服务商',
      become_provider: '成为护理服务商',
      join_network: '加入我们值得信赖的专业护理网络',
      apply_now: '立即申请'
    }
  }
}

export type Language = 'en' | 'zh'

export function t(lang: Language, key: string): string {
  const keys = key.split('.')
  let result: any = translations[lang]
  for (const k of keys) {
    result = result?.[k]
    if (!result) break
  }
  return result || key
}

// Create a React hook for translations
export function useTranslations(lang: Language) {
  return (key: string) => t(lang, key)
}