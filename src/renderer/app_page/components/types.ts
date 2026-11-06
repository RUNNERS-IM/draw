// 그림판 화면 코드가 함께 쓰는 타입.
// Figure 는 도구마다 갈라 나누지 않고 한 모양으로 둔다. 원본 DrawPen 코드가 type 값을 보고 칸을 바로 읽기 때문이다.
// x, y. 펜 획은 세 번째 칸에 필압을 함께 둘 수 있다.
export type Point = number[]

export type Figure = {
  id: number
  type: string
  colorIndex: number
  widthIndex: number
  points: Point[]
  rainbowColorDeg: number
  ratio: number
  strokeIndex: number
  edgeIndex: number
  text: string
  width: number
  height: number
  scale: number
  createdAt: number
  [key: string]: any
}

export type FigureInfo = any

export type ColorOption = {
  id: string
  color: string
  title: string
  isLightColor: boolean
  isRainbow: boolean
}

export type Callback = (...args: any[]) => any
