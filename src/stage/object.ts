import { useStage } from "@/stores/stage"
import { StageEventBus } from "./eventbus"

export class Vector {
  public x?: number
  public y?: number

  constructor(x?: number, y?: number) {
    this.x = x
    this.y = y
  }

  clone(): Vector {
    return new Vector(this.x, this.y)
  }

  static rangeRandom(minX: number, maxX: number, minY: number, maxY: number) {
    const x = Math.floor(Math.random() * (maxX - 1 - minX + 1) + minX)
    const y = Math.floor(Math.random() * (maxY - 1 - minY + 1) + minY)
    return new Vector(x, y)
  }

  equals(v: Vector): boolean {
    return v.x === this.x && v.y === this.y
  }

  add(v: Vector): Vector {
    return new Vector((this.x ?? 0) + (v.x ?? 0), (this.y ?? 0) + (v.y ?? 0))
  }

  subtract(v: Vector): Vector {
    return new Vector((this.x ?? 0) - (v.x ?? 0), (this.y ?? 0) - (v.y ?? 0))
  }

  multiply(c: number): Vector {
    return new Vector((this.x ?? 0) * c, (this.y ?? 0) * c)
  }

  divide(c: number): Vector {
    return new Vector((this.x ?? 0) / c, (this.y ?? 0) / c)
  }
}

export class Direction {
  public static Up = new Vector(0, -1)
  public static Right = new Vector(1, 0)
  public static Left = new Vector(-1, 0)
  public static Down = new Vector(0, 1)
}

export class StageObject {
  public type: string = "stage.object"
  public attributes: { [id: string]: any } = {}
  public id: string = `sgT-object-${crypto.randomUUID()}`

  // Element for display
  // Keep `undefined` to skip render lifecycle
  public element?: HTMLElement

  public position: Vector
  public direction: Vector

  public children: StageObject[] = []
  public parent?: StageObject
  public nodeDepth: number = 0

  get visible(): boolean {
    return this.element != null
  }

  set visible(v: boolean) {
    if (v && !this.element) {
      this.element = document.createElement("div")
      this.element.id = this.id
    } else if (this.element) {
      this.unmountElement()
    }
  }

  constructor() {
    this.position = new Vector()
    this.direction = Direction.Up
  }

  doesOverlap(o: StageObject) {
    if (o.visible && o.element && this.visible && this.element) {
      const rect1 = this.element.getBoundingClientRect()
      const rect2 = o.element.getBoundingClientRect()
      return !(
        rect1.top > rect2.bottom ||
        rect1.right < rect2.left ||
        rect1.bottom < rect2.top ||
        rect1.left > rect2.right
      )
    } else {
      return false
    }
  }

  setChild(index: number, o: StageObject) {
    this.children[index]?.dispose()
    this.children[index] = o
    this.children[index].parent = this
    this.children[index].nodeDepth = this.nodeDepth + 1
  }

  addChild(o: StageObject) {
    o.setParent(this)
  }

  setParent(o: StageObject) {
    this.parent = o
    this.nodeDepth = o.nodeDepth + 1
    o.children.push(this)
  }

  mountElement(target?: HTMLElement) {
    if (this.element) {
      const element = target ?? document.getElementById("sgT-stage")
      element?.appendChild(this.element)
    }
  }

  unmountElement() {
    if (this.element) {
      document.getElementById(this.id)?.remove()
    }
  }

  addEventListener(id: string, callback: any) {
    new StageEventBus().addListener(id, callback)
  }

  emitEvent(id: string, ...args: any[]) {
    new StageEventBus().emit(id, ...args)
  }

  dispose() {
    this.unmountElement()
    this.children = []
    if (this.parent) {
      this.parent.children = this.parent.children.filter((node) => node.id !== this.id)
    }
  }

  render() {}

  update() {}
}
