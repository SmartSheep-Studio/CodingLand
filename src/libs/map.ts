import { Material } from "@/libs/material"
import type { IMapGenerator } from "@/libs/map-generator"
import { Entity } from "@/libs/entity"

export type Coordinate = { x: number, y: number }

export class MapTile {
  // Tile relative position
  position: Coordinate

  // Tile material
  material: Material

  // Tile entities
  entities: Entity[] = []

  // Tile mass(weight) use kilogram unit
  mass: number

  constructor(position: Coordinate, material: Material, mass: number) {
    this.position = position
    this.material = material
    this.mass = mass
  }

  static fromJSON(save: any): MapTile {
    const entities: Entity[] = []
    for(const entity of save.entities.values()) {
      entities.push(Entity.fromJSON(entity))
    }
    save.entities = entities
    save.material = Material.fromJSON(save.material)
    return Object.setPrototypeOf(save, MapTile.prototype)
  }
}

export class Map {
  // Tiles of the map
  tiles: MapTile[][]

  // Robots of the map
  robots: { [name: string]: Entity } = {}

  // Map size(width, height)
  size: number[]

  constructor(tiles: MapTile[][] = [], size: number[] = [0, 0]) {
    this.tiles = tiles
    this.size = size
  }

  static fromJSON(save: any): Map {
    const tiles: MapTile[][] = []
    for(const rows of save.tiles) {
      const buffer: MapTile[] = []
      for(const tile of rows) {
        buffer.push(MapTile.fromJSON(tile))
      }
      tiles.push(buffer)
    }
    save.tiles = tiles
    const robots: Entity[] = []
    for(const robot of save.robots.values()) {
      robots.push(Entity.fromJSON(robot))
    }
    save.robots = robots
    return Object.setPrototypeOf(save, Map.prototype)
  }

  forEach(callback: (tile: MapTile) => void) {
    for (const rows of this.tiles) {
      for (const tile of rows) {
        callback(tile)
      }
    }
  }

  randomGenerate(generator: IMapGenerator, width: number, height: number, robots = 1) {
    generator.generate(width, height)
    generator.placeRobot(robots).forEach((v) => this.robots[v.name] = v)
    this.tiles = generator.tiles
    this.size = [width, height]
  }
}