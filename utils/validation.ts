import type { LeadForm } from '../types/index'

export type LeadErrors = Partial<Record<keyof LeadForm, string>>

export function validateLead(form: LeadForm): LeadErrors {
  const errors: LeadErrors = {}
  if (!form.contactName.trim()) errors.contactName = '请填写联系人姓名'
  if (!/^1\d{10}$/.test(form.phone)) errors.phone = '请填写 11 位中国大陆手机号'
  if (!form.community.trim()) errors.community = '请填写小区或所在区域'
  if (!form.preferredDate) errors.preferredDate = '请选择期望日期'
  if (!form.preferredTime) errors.preferredTime = '请选择方便联系的时间'
  return errors
}
