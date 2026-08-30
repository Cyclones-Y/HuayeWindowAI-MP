import type { WindowSolution } from '../types/index'

const SHARED_GLASS = [
  { code: 'DOUBLE_HOLLOW', name: '双层中空玻璃' },
  { code: 'LOW_E', name: 'Low-E 节能玻璃' },
]

export const WINDOW_SOLUTIONS: WindowSolution[] = [
  {
    id: 'solution-living-panorama',
    name: '客厅全景静音窗',
    subtitle: '大视野与密封性能兼顾',
    room: 'LIVING_ROOM',
    needs: ['QUIET', 'INSULATION', 'VENTILATION'],
    frameColors: [
      { code: 'SPACE_GRAY', name: '太空灰', color: '#454b48' },
      { code: 'MATTE_BLACK', name: '哑光黑', color: '#242826' },
      { code: 'PORCELAIN_WHITE', name: '瓷泳白', color: '#e9e7df' },
    ],
    glassOptions: SHARED_GLASS,
    priceHint: '量尺后按实际尺寸报价',
    beforeImage: '/assets/cases/living-before.jpg',
    afterImage: '/assets/cases/living-after.jpg',
    thumbnail: '/assets/cases/living-after.jpg',
    features: ['窄边大视野', '多道密封', '内开内倒'],
  },
  {
    id: 'solution-bedroom-quiet',
    name: '卧室深静隔音窗',
    subtitle: '面向临街卧室的安静方案',
    room: 'BEDROOM',
    needs: ['QUIET', 'INSULATION', 'SAFETY'],
    frameColors: [
      { code: 'DARK_COFFEE', name: '深咖灰', color: '#554f48' },
      { code: 'MATTE_BLACK', name: '哑光黑', color: '#242826' },
    ],
    glassOptions: [
      { code: 'TRIPLE_LAMINATED', name: '三玻两腔玻璃' },
      { code: 'LAMINATED_HOLLOW', name: '夹胶中空玻璃' },
    ],
    priceHint: '量尺后按隔音配置报价',
    beforeImage: '/assets/cases/bedroom-before.jpg',
    afterImage: '/assets/cases/bedroom-after.jpg',
    thumbnail: '/assets/cases/bedroom-after.jpg',
    features: ['加强隔音', '保温密封', '安全防护'],
  },
  {
    id: 'solution-balcony-seal',
    name: '阳台封窗通景方案',
    subtitle: '封好阳台，也保留通透感',
    room: 'BALCONY',
    needs: ['SAFETY', 'INSULATION', 'VENTILATION'],
    frameColors: [
      { code: 'SPACE_GRAY', name: '太空灰', color: '#454b48' },
      { code: 'MATTE_BLACK', name: '哑光黑', color: '#242826' },
    ],
    glassOptions: SHARED_GLASS,
    priceHint: '量尺后确认转角与开扇配置',
    beforeImage: '/assets/cases/balcony-before.jpg',
    afterImage: '/assets/cases/balcony-after.jpg',
    thumbnail: '/assets/cases/balcony-after.jpg',
    features: ['通景大玻璃', '转角加固', '灵活通风'],
  },
]

export function findSolution(id: string): WindowSolution | undefined {
  return WINDOW_SOLUTIONS.find((solution) => solution.id === id)
}
