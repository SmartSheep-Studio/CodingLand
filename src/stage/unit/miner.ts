import type { MapChunk } from "../map/chunk"
import { ResourcePoint } from "./resource"
import { type StagePopupOptions } from "../object"
import { Inventory, InventorySlot } from "../inventory/inventory"
import { Unit } from "./unit"

/**
 * Resource Miner
 *
 * Behaviour: Produce resource every 30 tick (Upgradable)
 *
 * Requirement: Place in map chunk slot 1, slot 0 must be a resource point.
 *
 * Party: Friendly, Controllable
 */
export class ResourceMiner extends Unit {
  public type = "codingland.buildings.miner"
  public attributes = { party: "player" }
  public level = 1

  public health: number
  public maxHealth = 20

  constructor(chunk: HTMLElement) {
    super()
    this.health = this.maxHealth
    this.visible = true
    this.mountElement(chunk)
  }

  public get valid(): boolean {
    const chunk = this.parent as MapChunk
    if (chunk.children.length < 2) {
      return false
    } else {
      return chunk.children[0] instanceof ResourcePoint
    }
  }

  public get product(): string {
    const chunk = this.parent as MapChunk
    if (this.valid) {
      return (chunk.children[0] as ResourcePoint).resource
    } else {
      throw new Error("Invalid miner, isn't place in a resource point.")
    }
  }

  public get outputCount(): number {
    // Every level produce 2 more resource
    return 10 + (this.level - 1) * 2
  }

  private countdown = 30

  public get maxCountdown(): number {
    // Every level reduce 1 tick countdown
    return 30 - Math.min(Math.max((this.level - 1) * 1, 0), 25)
  }

  get texture(): string {
    return `<span class="mdi mdi-pickaxe"></span>`
  }

  renderActions(): StagePopupOptions {
    const chunk = this.parent as MapChunk

    return {
      icon: this.texture,
      title: "Resource Miner",
      content: () => import("@/components/actions/miner.vue"),
      subtitle: `Level ${this.level}`,
      caller: this,
      attributes: { established: chunk.children[1] instanceof ResourceMiner },
      callbacks: {
        "destroy": () => {
          this.dispose()
          console.debug(`[Actions] Successfully destroy a resource miner at ${chunk.position.toString()}!`)
        }
      }
    }
  }

  render() {
    if (this.element) {
      this.element.style.position = "absolute"
      this.element.style.bottom = "0"
      this.element.style.right = "4px"
      this.element.style.width = `16px`
      this.element.style.textAlign = "right"
      this.element.style.fontSize = "16px"
      this.element.innerHTML = this.texture
      if (!this.valid) {
        this.element.style.color = "#f44336"
      }
    }
  }

  update() {
    super.update()
    if (this.countdown > 0) {
      this.countdown--
    } else {
      if (this.valid) {
        new Inventory().addItem(new InventorySlot(this.product, this.outputCount))
        this.emitEvent("codingland.produce.resource", this.product, this.outputCount)
      }
      this.countdown = this.maxCountdown
    }
  }
}
