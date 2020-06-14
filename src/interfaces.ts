interface Point {
  x: number,
  y: number
}

interface Size {
  width: number,
  height: number
}

interface DeployPayload {
  id: number,
  pos: Point,
  size: Size,
  type: OscillatorType,
  key: number,
  color: string
}

interface UpdatePayload {
  id: number,
  pos?: Point,
  type?: OscillatorType,
  key?: number
}

interface SyncPayload {
  curID: number,
  blocks: Array<DeployPayload>
}

export {
  Point, Size, DeployPayload, UpdatePayload, SyncPayload
}