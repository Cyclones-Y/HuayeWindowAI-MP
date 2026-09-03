import { createEmptyDraft } from './store/session'
import { restoreSession } from './services/auth'
import type { DraftState } from './types/index'

App<IAppOption>({
  onLaunch() {
    // 启动只恢复本地会话，不主动弹手机号授权；受保护操作再调用 ensureSession。
    restoreSession()
  },
  globalData: {
    draft: createEmptyDraft(),
  },
})

export interface IAppOption {
  globalData: {
    draft: DraftState
  }
}
