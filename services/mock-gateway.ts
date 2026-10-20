/** 收藏与预约沿用本地逻辑；生成不允许使用计时模拟或静态参考图。 */
import { clearLocalUserData, saveLead, toggleFavorite } from '../store/session'
import type { LeadForm, LocalLead } from '../types/index'
export class MockGateway {
  async favoriteSolution(solutionId: string): Promise<boolean> { return toggleFavorite(solutionId) }
  async submitLead(form: LeadForm): Promise<LocalLead> {
    await new Promise((resolve) => setTimeout(resolve, 420))
    const lead: LocalLead = { ...form, id: `demo-lead-${Date.now()}`, createdAt: Date.now(), statusText: '已提交，等待确认' }
    saveLead(lead)
    return lead
  }
  async clearUserData(): Promise<void> { clearLocalUserData() }
}
