Component({
  data: {
    selected: 0,
    tabs: [
      {
        pagePath: '/pages/home/index',
        text: '首页',
        iconPath: '/assets/icons/home.png',
        selectedIconPath: '/assets/icons/home-active.png',
      },
      {
        pagePath: '/pages/solutions/index',
        text: '方案',
        iconPath: '/assets/icons/layout-grid.png',
        selectedIconPath: '/assets/icons/layout-grid-active.png',
      },
      {
        pagePath: '/pages/profile/index',
        text: '我的',
        iconPath: '/assets/icons/user.png',
        selectedIconPath: '/assets/icons/user-active.png',
      },
    ],
  },

  methods: {
    switchTab(event: WechatMiniprogram.TouchEvent) {
      const { index, path } = event.currentTarget.dataset as { index: number; path: string }
      if (index === this.data.selected) return
      wx.switchTab({ url: path })
    },
  },
})
