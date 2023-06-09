import { Direction, StageObject, StageQueue, Vector } from "../object"
import { Map } from "../map/map"
import type { MapChunk } from "@/stage/map/chunk"

export type LookupResult = { next: Vector; nextDirection: Vector; history: LookupTask[]; success: boolean }

class LookupTask {
  public position: Vector
  public direction: Vector
  public parent?: LookupTask
  constructor(pos: Vector, dr: Vector, parent?: LookupTask) {
    this.position = pos
    this.direction = dr
    this.parent = parent
  }
}

/**
 * CodingLand Entity Base Class.
 * Easy to build an entity by extend it then mount under the map object.
 *
 * Based by Stage.js StageObject class
 */
export class Entity extends StageObject {
  public type = "codingland.entity"

  public health: number
  public maxHealth = 100

  public scale: number = 0.5

  constructor(map: HTMLElement) {
    super()
    this.health = this.maxHealth
    this.visible = true
    this.element?.classList.add("sgt-entity")
    this.mountElement(map)
  }

  async lookupPath(validator: (chunk: MapChunk) => boolean, ...to: Vector[]): Promise<LookupResult> {
    const from = this.position.clone()
    const map = this.parent as Map

    let step = 0
    let arrived = false
    const visited: boolean[][] = []
    const tasks = new StageQueue<LookupTask>()
    const choices = [Direction.Up, Direction.Down, Direction.Left, Direction.Right]

    tasks.push(new LookupTask(this.position, Vector.Null))

    // Breadth-first Algorithm
    function search(): LookupResult {
      const pin = tasks.shift()
      if (to.filter(p => pin.position.floor().equals(p)).length > 0) {
        let history: LookupTask[] = [pin]
        let pointer = pin.parent

        arrived = true

        // Backtrack
        while (pointer != null) {
          history.push(pointer)
          pointer = pointer.parent
        }

        history = history.reverse()

        if (history.length >= 2) {
          return {
            next: history[1].position,
            nextDirection: history[1].direction,
            success: true,
            history
          }
        } else {
          return {
            next: from,
            nextDirection: Vector.Zero,
            success: true,
            history
          }
        }
      }

      step++
      for (const choice of choices) {
        const pos = pin.position.add(choice).floor()
        const chunk = map.getChunk(pos)
        if (validator(chunk)) {
          continue
        }

        const [x, y] = pos.clamp(map.size).extract()
        if (visited[y] == null) {
          visited[y] = []
        }
        if (!visited[y][x]) {
          tasks.push(new LookupTask(new Vector(x, y), choice, pin))
          visited[y][x] = true
        }
      }

      // Couldn't find target position
      if (tasks.size() <= 0 && !arrived)
        return {
          next: Vector.Null,
          nextDirection: Vector.Null,
          history: [],
          success: false
        }

      return search()
    }

    return search()
  }

  move(direction: Vector): boolean {
    const target = this.position.add(direction)
    const targetChunk = (this.parent as Map).getChunk(target)
    // Detect target place is passable
    // If we could not get target chunk details, means that place is out of map.
    if (targetChunk != null && targetChunk.children[0]?.attributes?.passable !== false) {
      this.position = target
      return true
    } else {
      // Play could not walk straight animation
      const value = direction.multiply(0.5)
      this.position = this.position.add(value)
      setTimeout(() => (this.position = this.position.subtract(value)), 50)
      return false
    }
  }

  takeDamage(damage: number) {
    this.health -= damage
    if (this.element) {
      if (this.element.hasAttribute("under-attack-mask")) {
        clearTimeout(parseInt(this.element.getAttribute("under-attack-mask") as string))
      }
      const cleaner = setTimeout(() => this.element?.removeAttribute("under-attack-mask"), 250)
      this.element.setAttribute("under-attack-mask", cleaner.toString())
    }
  }

  render() {
    if (this.element) {
      this.element.style.position = "absolute"
      this.element.style.width = `${Map.chunkSize * this.scale}px`
      this.element.style.height = `${Map.chunkSize * this.scale}px`
      this.element.style.left = `${(this.position.x ?? 0) * Map.chunkSize}px`
      this.element.style.top = `${(this.position.y ?? 0) * Map.chunkSize}px`
      this.element.style.display = "flex"
      this.element.style.justifyContent = "center"
      this.element.style.placeItems = "center"
      this.element.style.borderRadius = "50px"
      this.element.style.backgroundColor = "#009688"
      this.element.style.boxShadow =
        "0 3px 1px -2px var(--v-shadow-key-umbra-opacity, rgba(0, 0, 0, .2)),0 2px 2px 0 var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, .14)),0 1px 5px 0 var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, .12))"
    }
  }

  update() {
    if(!this.attributes?.invincible && this.health <= 0) {
      this.dispose()
    }
  }
}
