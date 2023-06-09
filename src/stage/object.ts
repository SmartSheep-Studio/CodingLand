import { StageEventBus } from "./eventbus"

export interface StagePopupOptions {
  icon?: string,
  title: string,
  subtitle: string,
  content?: any,
  caller: StageObject,
  attributes?: any,
  callbacks: { [id: string]: () => void }
}

export class StageQueue<T> {
  public elements: T[]

  constructor() {
    this.elements = []
  }

  push(element: T) {
    this.elements.push(element)
    return true
  }

  shift(): T {
    return this.elements.shift() as T
  }

  size(): number {
    return this.elements.length
  }
}

export class Vector {
  public static Null = new Vector()
  public static Zero = new Vector(0, 0)

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

  isEmpty(): boolean {
    return this.x == null || this.y == null
  }

  toString(): string {
    const [x, y] = this.extract()
    return `(${x}, ${y})`
  }

  extract(): number[] {
    return [this.x ?? 0, this.y ?? 0]
  }

  equals(v: Vector): boolean {
    return v.x === this.x && v.y === this.y
  }

  clamp(max: Vector, min = new Vector(0, 0)): Vector {
    const x = Math.min(Math.max(this.x ?? 0, min.x ?? 0), max.x ?? 0)
    const y = Math.min(Math.max(this.y ?? 0, min.y ?? 0), max.y ?? 0)
    return new Vector(x, y)
  }

  floor(): Vector {
    const vector = this.clone()
    vector.x = Math.floor(vector.x ?? 0)
    vector.y = Math.floor(vector.y ?? 0)
    return vector
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
  // [Up Left]        [Up]        [Up Right]
  public static UpLeft = new Vector(-1, -1)
  public static Up = new Vector(0, -1)
  public static UpRight = new Vector(1, -1)
  // [Left]         [Center]         [Right]
  public static Left = new Vector(-1, 0)
  public static Center = new Vector(0, 0)
  public static Right = new Vector(1, 0)
  // [Down Left]     [Down]     [Down Right]
  public static DownLeft = new Vector(-1, 1)
  public static Down = new Vector(0, 1)
  public static DownRight = new Vector(1, 1)
}

export class StageObject {
  public type: string = "stage.object"
  public attributes: { [id: string]: any } = {}
  public id: string = `sgt-object-${crypto.randomUUID()}`

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
    this.direction = Vector.Zero
  }

  setChild(index: number, o: StageObject) {
    this.children[index]?.dispose()
    this.children[index] = o
    this.children[index].parent = this
    this.children[index].nodeDepth = this.nodeDepth + 1
    this.children[index].mount()
  }

  addChild(o: StageObject) {
    o.setParent(this)
    o.mount()
  }

  setParent(o: StageObject) {
    this.parent = o
    this.nodeDepth = o.nodeDepth + 1
    o.children.push(this)
    this.mount()
  }

  mountElement(target?: HTMLElement) {
    if (this.element) {
      this.element.classList.add("sgt-object")
      this.element.addEventListener("contextmenu", (e: Event) => {
        const args = this.renderActions()

        new StageEventBus().emit("codingland.popups.show.actions", args)

        e.stopPropagation()
        e.preventDefault()
      })

      const element = target ?? document.getElementById("sgt-stage")
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
    if (this.element) {
      this.element.style.opacity = "0"
      setTimeout(() => this.unmountElement(), 100)
    }
    this.children = []
    if (this.parent) {
      this.parent.children = this.parent.children.filter((node) => node.id !== this.id)
    }
  }

  renderActions(): StagePopupOptions {
    return {
      icon: `<span class="mdi mdi-help-rhombus"></span>`,
      title: "Object",
      subtitle: `#${this.id.replace("sgt-object", "").replace(/-/g, "").substring(0, 12)}`,
      caller: this,
      callbacks: {}
    }
  }

  mount() {
  }

  render() {
  }

  update() {
  }
}
