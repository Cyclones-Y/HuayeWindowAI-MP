import { createEmptyDraft } from './store/session'
import type { DraftState } from './types/index'

App<IAppOption>({
  globalData: {
    draft: createEmptyDraft(),
  },
})

export interface IAppOption {
  globalData: {
    draft: DraftState
  }
}
