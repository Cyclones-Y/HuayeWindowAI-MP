import type { WindowSolution } from '../../types/index'

Component({
  properties: {
    solution: {
      type: Object,
      value: {} as WindowSolution,
    },
    selected: {
      type: Boolean,
      value: false,
    },
    compact: {
      type: Boolean,
      value: false,
    },
  },
  methods: {
    onSelect() {
      const { solution } = this.properties as unknown as { solution: WindowSolution }
      this.triggerEvent('select', { id: solution.id })
    },
  },
})
