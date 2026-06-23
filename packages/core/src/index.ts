export type {
  GameState,
  GamePhase,
  GameEvent,
  MissionReport,
  SquadState,
  UnitState,
  MapNode,
  ItemStack,
  PlayerCommand,
  SquadId,
  Doctrine,
  MissionType,
  MissionTarget,
} from './types.js'
export { createGame } from './game.js'
export type { Game } from './game.js'
export { MAP_NODES, MAP_EDGES, objectiveLabel, getHqPosition } from './content.js'
export { computeUnitReadiness } from './readiness.js'
export { MISSION_TYPE_CONFIGS } from './config.js'
