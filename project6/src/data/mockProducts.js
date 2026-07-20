import { PRODUCT_PLACEHOLDER_IMAGE } from '../services/productApi.js'

const products = [
  {
    id: 'mock-1',
    name: '무선 탁상 조명',
    price: 34.9,
    image: PRODUCT_PLACEHOLDER_IMAGE,
    category: 'electronics',
    description: '밝기를 간편하게 조절할 수 있는 소형 탁상 조명입니다.',
  },
  {
    id: 'mock-2',
    name: '휴대용 미니 스피커',
    price: 42.5,
    image: PRODUCT_PLACEHOLDER_IMAGE,
    category: 'electronics',
    description: '작은 공간에서 편안하게 음악을 들을 수 있는 스피커입니다.',
  },
  {
    id: 'mock-3',
    name: '데일리 후드 재킷',
    price: 58,
    image: PRODUCT_PLACEHOLDER_IMAGE,
    category: 'clothing',
    description: '가볍게 걸치기 좋은 단정한 디자인의 후드 재킷입니다.',
  },
  {
    id: 'mock-4',
    name: '코튼 라운드 티셔츠',
    price: 21.75,
    image: PRODUCT_PLACEHOLDER_IMAGE,
    category: 'clothing',
    description: '부드러운 촉감과 기본 실루엣을 갖춘 면 티셔츠입니다.',
  },
  {
    id: 'mock-5',
    name: '세라믹 수납 트레이',
    price: 18.25,
    image: PRODUCT_PLACEHOLDER_IMAGE,
    category: 'home',
    description: '작은 생활용품을 정돈하기 좋은 중립적인 색상의 트레이입니다.',
  },
  {
    id: 'mock-6',
    name: '패브릭 쿠션 커버',
    price: 16,
    image: PRODUCT_PLACEHOLDER_IMAGE,
    category: 'home',
    description: '생활 공간에 차분한 질감을 더하는 기본형 쿠션 커버입니다.',
  },
]

export const mockProducts = Object.freeze(
  products.map((product) => Object.freeze(product)),
)
