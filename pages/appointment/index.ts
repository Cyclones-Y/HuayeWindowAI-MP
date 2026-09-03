import { gateway } from '../../services/index'
import { ensureSession } from '../../services/auth'
import type { LeadForm } from '../../types/index'
import { validateLead, type LeadErrors } from '../../utils/validation'

function tomorrow(): string {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

Page({
  data: {
    form: {
      contactName: '',
      phone: '',
      community: '',
      preferredDate: '',
      preferredTime: '',
      note: '',
    } as LeadForm,
    errors: {} as LeadErrors,
    timeOptions: ['上午 09:00-12:00', '下午 13:30-17:30', '晚上 18:00-20:00'],
    timeIndex: -1,
    minDate: tomorrow(),
    submitting: false,
    submitted: false,
  },

  onTextInput(event: WechatMiniprogram.Input) {
    const field = String(event.currentTarget.dataset.field) as keyof LeadForm
    this.setData({
      [`form.${field}`]: event.detail.value,
      [`errors.${field}`]: '',
    })
  },

  onDateChange(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ 'form.preferredDate': event.detail.value, 'errors.preferredDate': '' })
  },

  onTimeChange(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    const timeIndex = Number(event.detail.value)
    this.setData({
      timeIndex,
      'form.preferredTime': this.data.timeOptions[timeIndex],
      'errors.preferredTime': '',
    })
  },

  async submitAppointment() {
    if (this.data.submitting) return
    const errors = validateLead(this.data.form)
    if (Object.keys(errors).length > 0) {
      this.setData({ errors })
      wx.showToast({ title: '请检查预约信息', icon: 'none' })
      return
    }
    if (!(await ensureSession())) return
    this.setData({ submitting: true })
    try {
      await gateway.submitLead(this.data.form)
      this.setData({ submitted: true })
    } catch {
      wx.showToast({ title: '预约信息保存失败，请重试', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  goHome() {
    wx.switchTab({ url: '/pages/home/index' })
  },

  viewRecords() {
    wx.switchTab({ url: '/pages/profile/index' })
  },
})
