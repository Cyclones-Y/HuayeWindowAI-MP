import type { DraftState, LocalHistoryItem, LocalLead, RenderResult, WindowSolution } from '../types/index'
import type { IAppOption } from '../app'

const HISTORY_KEY = 'huaye_demo_history'
const FAVORITES_KEY = 'huaye_demo_favorites'
const LEADS_KEY = 'huaye_demo_leads'

export function createEmptyDraft(): DraftState {
  return {
    photo: null,
    selection: null,
    solution: null,
    frameColorCode: '',
    glassCode: '',
    taskId: '',
  }
}

export function getDraft(): DraftState {
  return getApp<IAppOption>().globalData.draft
}

export function updateDraft(patch: Partial<DraftState>): DraftState {
  const app = getApp<IAppOption>()
  app.globalData.draft = { ...app.globalData.draft, ...patch }
  return app.globalData.draft
}

export function resetDraft(): void {
  getApp<IAppOption>().globalData.draft = createEmptyDraft()
}

function readList<T>(key: string): T[] {
  try {
    return wx.getStorageSync<T[]>(key) || []
  } catch {
    return []
  }
}

function writeList<T>(key: string, value: T[]): void {
  wx.setStorageSync(key, value)
}

export function saveHistory(result: RenderResult, solution: WindowSolution): void {
  const history = readList<LocalHistoryItem>(HISTORY_KEY)
  if (history.some((item) => item.id === result.id)) return
  history.unshift({ ...result, solutionName: solution.name, thumbnail: solution.thumbnail })
  writeList(HISTORY_KEY, history.slice(0, 20))
}

export function getHistory(): LocalHistoryItem[] {
  return readList<LocalHistoryItem>(HISTORY_KEY)
}

export function toggleFavorite(solutionId: string): boolean {
  const favorites = readList<string>(FAVORITES_KEY)
  const exists = favorites.includes(solutionId)
  writeList(FAVORITES_KEY, exists ? favorites.filter((id) => id !== solutionId) : [solutionId, ...favorites])
  return !exists
}

export function isFavorite(solutionId: string): boolean {
  return readList<string>(FAVORITES_KEY).includes(solutionId)
}

export function getFavoriteIds(): string[] {
  return readList<string>(FAVORITES_KEY)
}

export function saveLead(lead: LocalLead): void {
  const leads = readList<LocalLead>(LEADS_KEY)
  leads.unshift(lead)
  writeList(LEADS_KEY, leads.slice(0, 20))
}

export function getLeads(): LocalLead[] {
  return readList<LocalLead>(LEADS_KEY)
}

export function clearLocalUserData(): void {
  wx.removeStorageSync(HISTORY_KEY)
  wx.removeStorageSync(FAVORITES_KEY)
  wx.removeStorageSync(LEADS_KEY)
  resetDraft()
}
