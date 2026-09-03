import { ApiError } from '../../services/http-client'
import { loginWithPhoneCode } from '../../services/auth'

interface PhoneAuthorizationDetail {
  code?: string
  errMsg?: string
}

Page({
  data: {
    loading: false,
    privacyChecking: true,
    privacyReady: false,
    showPrivacyDialog: false,
    privacyContractName: '《华业门窗小程序隐私保护指引》',
    statusText: '',
    statusType: 'info',
  },

  authorized: false,

  onLoad() {
    this.checkPrivacySetting()
  },

  /**
   * 手机号属于隐私接口。页面在开放能力按钮可点击前主动确认隐私状态，
   * 避免 getPhoneNumber 因隐私授权处于 pending 而直接返回失败。
   */
  checkPrivacySetting() {
    wx.getPrivacySetting({
      success: ({ needAuthorization, privacyContractName }) => {
        this.setData({
          privacyChecking: false,
          privacyReady: !needAuthorization,
          showPrivacyDialog: needAuthorization,
          privacyContractName: privacyContractName || this.data.privacyContractName,
          statusText: needAuthorization ? '请先完成隐私授权，再进行手机号验证' : '',
          statusType: 'info',
        })
      },
      fail: () => {
        this.setData({
          privacyChecking: false,
          privacyReady: false,
          statusText: '暂时无法读取隐私授权状态，请点击下方入口重试',
          statusType: 'error',
        })
      },
    })
  },

  showPrivacyNotice() {
    this.setData({ showPrivacyDialog: true })
  },

  /**
   * 只有 open-type="agreePrivacyAuthorization" 的真实用户点击才能完成平台隐私授权，
   * 因此不能用普通 bindtap 或本地布尔值替代这一事件。
   */
  agreePrivacyAuthorization() {
    this.setData({
      privacyReady: true,
      showPrivacyDialog: false,
      statusText: '隐私授权已完成，可继续验证微信手机号',
      statusType: 'success',
    })
  },

  declinePrivacyAuthorization() {
    this.setData({
      privacyReady: false,
      showPrivacyDialog: false,
      statusText: '需要同意隐私保护指引后才能使用手机号登录',
      statusType: 'warning',
    })
  },

  openPrivacyContract() {
    // 用户首先看到运营者提供的完整规则；微信平台隐私合同仍可在该页面继续查看。
    wx.navigateTo({ url: '/pages/privacy/index' })
  },

  async authorizePhone(event: WechatMiniprogram.CustomEvent<PhoneAuthorizationDetail>) {
    if (this.data.loading) return
    const phoneCode = event.detail.code
    if (!phoneCode) {
      const errMsg = event.detail.errMsg || ''

      // 隐私授权失败时重新展示明确的同意入口，不让用户只看到模糊的“授权失败”。
      if (errMsg.includes('privacy permission is not authorized')) {
        this.setData({
          privacyReady: false,
          showPrivacyDialog: true,
          statusText: '请先同意隐私保护指引，再继续手机号验证',
          statusType: 'warning',
        })
        return
      }

      const isUserDenied = errMsg.includes('user deny') || errMsg.includes('user cancel')
      if (!isUserDenied) {
        // errMsg 不包含手机号或身份数据，可以用于开发阶段判断主体权限、基础库或系统异常。
        console.warn('[login] getPhoneNumber did not return a code:', errMsg || 'empty response')
      }
      this.setData({
        statusText: isUserDenied
          ? '你已取消手机号授权，可再次点击按钮重新授权'
          : '当前暂无法使用手机号快捷登录，请稍后再试',
        statusType: 'warning',
      })
      return
    }

    this.setData({ loading: true, statusText: '已获得授权，正在安全登录…', statusType: 'info' })
    try {
      await loginWithPhoneCode(phoneCode)
      this.authorized = true
      this.setData({ statusText: '登录成功，正在返回…', statusType: 'success' })
      this.getOpenerEventChannel?.().emit?.('authorized')
      wx.navigateBack()
    } catch (error) {
      const statusText = error instanceof ApiError ? error.message : '登录失败，请重新授权'
      this.setData({ statusText, statusType: 'error' })
    } finally {
      this.setData({ loading: false })
    }
  },

  cancelLogin() {
    wx.navigateBack()
  },

  onUnload() {
    if (!this.authorized) this.getOpenerEventChannel?.().emit?.('cancelled')
  },

  // 遮罩层阻止触摸穿透到底部页面，避免弹窗展示时发生误操作。
  preventTouchMove() {},
})
