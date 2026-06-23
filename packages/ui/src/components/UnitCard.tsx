import { computeUnitReadiness, type UnitState } from '@paws/core'
import { readinessBarClass } from '../utils/format'

const ROLE_EMOJI: Record<string, string> = {
  Medic: '🩺',
  Engineer: '🔧',
  Scout: '👁',
  Geologist: '⛏',
}

const SLOT_LABEL: Record<string, string> = {
  weapon: 'WPN',
  armor: 'ARM',
  medkit: 'MED',
  toolkit: 'TKT',
  scanner: 'SCN',
  drill: 'DRILL',
}

const ITEM_EMOJI: Record<string, string> = {
  ammo: '🔫',
  medkit: '💊',
  materials: '📦',
  scrap: '⚙️',
  fuel: '⛽',
}

interface Props {
  unit: UnitState
}

export function UnitCard({ unit }: Props) {
  const readiness = computeUnitReadiness(unit.id, unit.slots)
  const totalWeight = unit.backpack.reduce((sum, s) => sum + s.qty, 0)

  return (
    <article className="unit-card">
      <div className="unit-card__portrait">{ROLE_EMOJI[unit.role] ?? '🐱'}</div>
      <h3 className="unit-card__name">{unit.name}</h3>
      <p className="unit-card__role">{unit.role}</p>
      <div className="unit-card__slots">
        {unit.slots.map((s) => (
          <span
            key={s.slotId}
            className={`slot-icon ${s.itemId ? 'slot-icon--filled' : ''}`}
          >
            {SLOT_LABEL[s.slotId] ?? s.slotId}
          </span>
        ))}
      </div>

      {/* Backpack */}
      {unit.backpack.length > 0 && (
        <div className="unit-card__backpack">
          <span className="backpack-label">🎒</span>
          <div className="backpack-items">
            {unit.backpack.slice(0, 3).map((item) => (
              <span key={item.itemId} className="backpack-item">
                {ITEM_EMOJI[item.itemId] ?? '📦'} {item.itemId}:{item.qty}
              </span>
            ))}
            {unit.backpack.length > 3 && (
              <span className="backpack-more">+{unit.backpack.length - 3}</span>
            )}
          </div>
        </div>
      )}

      {/* Weight */}
      {totalWeight > 0 && (
        <div className="unit-card__weight">⚖ {totalWeight}</div>
      )}

      <div className="unit-card__readiness-label">
        <span>Readiness</span>
        <span>{readiness}%</span>
      </div>
      <div className="progress-bar">
        <div
          className={readinessBarClass(readiness)}
          style={{ width: `${readiness}%` }}
        />
      </div>
    </article>
  )
}
