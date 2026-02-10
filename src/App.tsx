import { useMemo, useState } from 'react'
import './App.css'

type TimelineItem = {
  id: number
  label: string
  start: number
  end: number
}

const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

const baseDate = new Date('2026-01-15T00:00:00Z').getTime()

const filterStart = baseDate + 9 * HOUR_MS
const filterEnd = baseDate + 17 * HOUR_MS

const items: TimelineItem[] = [
  // 1) Starts before filter start and ends after filter end.
  { id: 1, label: 'Case 1', start: filterStart - 2 * HOUR_MS, end: filterEnd + 2 * HOUR_MS },
  // 2) Starts after filter end and ends one hour later.
  { id: 2, label: 'Case 2', start: filterEnd + 1 * HOUR_MS, end: filterEnd + 5 * HOUR_MS },
  // 3) Starts before filter start and ends inside filter range.
  { id: 3, label: 'Case 3', start: filterStart - 2 * HOUR_MS, end: filterStart + 2 * HOUR_MS },
  // 4) Starts inside filter range and ends after filter end.
  { id: 4, label: 'Case 4', start: filterEnd - 2 * HOUR_MS, end: filterEnd + 2 * HOUR_MS },
  // 5) Starts before filter start and ends before filter start one hour later.
  { id: 5, label: 'Case 5', start: filterStart - 5 * HOUR_MS, end: filterStart - 1 * HOUR_MS },
  // 6) Starts and ends fully inside filter range.
  { id: 6, label: 'Case 6', start: filterStart + 2 * HOUR_MS, end: filterStart + 5 * HOUR_MS },
]

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function algoInclusiveOverlap(itemStart: number, itemEnd: number, rangeStart?: number, rangeEnd?: number) {
  // Placeholder algorithm: inclusive overlap.
  if (rangeStart !== undefined && rangeEnd !== undefined) {
    return itemStart <= rangeEnd && itemEnd >= rangeStart
  } else if (rangeStart !== undefined) {
    return itemEnd >= rangeStart
  } else if (rangeEnd !== undefined) {
    return itemStart <= rangeEnd
  } else {
    return false
  }
}

function fullyContainedAlgo(itemStart: number, itemEnd: number, rangeStart?: number, rangeEnd?: number) {
  // Placeholder algorithm: fully contained in range.
  if (rangeStart !== undefined && rangeEnd !== undefined) {
    return itemStart >= rangeStart && itemEnd <= rangeEnd
  } else if (rangeStart !== undefined) {
    return itemStart >= rangeStart
  } else if (rangeEnd !== undefined) {
    return itemEnd <= rangeEnd
  } else {
    return false
  }
}

function App() {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<'inclusive' | 'contained'>('inclusive')
  const [isStartDateOpen, setIsStartDateOpen] = useState(false)
  const [isEndDateOpen, setIsEndDateOpen] = useState(false)

  const [timelineStart, timelineEnd] = useMemo(() => {
    const minStart = Math.min(...items.map((item) => item.start), filterStart)
    const maxEnd = Math.max(...items.map((item) => item.end), filterEnd)
    return [minStart - DAY_MS, maxEnd + DAY_MS]
  }, [])

  const totalRange = timelineEnd - timelineStart

  function toPercent(timestamp: number) {
    return ((timestamp - timelineStart) / totalRange) * 100
  }

  const effectiveFilterStart = isStartDateOpen ? undefined : filterStart
  const effectiveFilterEnd = isEndDateOpen ? undefined : filterEnd

  const filterBarLeft = isStartDateOpen ? 0 : toPercent(filterStart)
  const filterBarRight = isEndDateOpen ? 100 : toPercent(filterEnd)
  const filterBarWidth = Math.max(filterBarRight - filterBarLeft, 0)

  return (
    <main className="demo-page">
      <h1>Date Filter Timeline Demo</h1>
      <p className="subtitle">
        Compare how different filter algorithms classify the same timeline elements.
      </p>

      <section className="controls">
        <label>
          <input
            type="radio"
            name="algorithm"
            checked={selectedAlgorithm === 'inclusive'}
            onChange={() => setSelectedAlgorithm('inclusive')}
          />
          Inclusive Overlap Algo
        </label>
        <label>
          <input
            type="radio"
            name="algorithm"
            checked={selectedAlgorithm === 'contained'}
            onChange={() => setSelectedAlgorithm('contained')}
          />
          Fully Contained Algo
        </label>
        <label>
          <input
            type="checkbox"
            checked={isStartDateOpen}
            onChange={(event) => setIsStartDateOpen(event.target.checked)}
          />
          Open start date
        </label>
        <label>
          <input
            type="checkbox"
            checked={isEndDateOpen}
            onChange={(event) => setIsEndDateOpen(event.target.checked)}
          />
          Open end date
        </label>
      </section>

      <section className="timeline-wrapper">
        <div className="timeline-axis">
          <span>{formatDate(timelineStart)}</span>
          <span>{formatDate(timelineEnd)}</span>
        </div>

        <div className="timeline-content">
          <div className="boundary-lines" aria-hidden="true">
            {!isStartDateOpen && <div className="boundary-line start" style={{ left: `${toPercent(filterStart)}%` }} />}
            {!isEndDateOpen && <div className="boundary-line end" style={{ left: `${toPercent(filterEnd)}%` }} />}
          </div>

          <div className="filter-row">
            <span className="row-label">Filter range</span>
            <div className="lane">
              <div
                className={`filter-bar${isStartDateOpen ? ' open-start' : ''}${isEndDateOpen ? ' open-end' : ''}`}
                style={{
                  left: `${filterBarLeft}%`,
                  width: `${filterBarWidth}%`,
                }}
              />
            </div>
            <span className="row-meta">
              {isStartDateOpen ? 'Open' : formatDate(filterStart)} - {isEndDateOpen ? 'Open' : formatDate(filterEnd)}
            </span>
          </div>

          <div className="items-list">
            {items.map((item) => {
              const result1 = algoInclusiveOverlap(item.start, item.end, effectiveFilterStart, effectiveFilterEnd)
              const result2 = fullyContainedAlgo(item.start, item.end, effectiveFilterStart, effectiveFilterEnd)
              const isInside = selectedAlgorithm === 'inclusive' ? result1 : result2

              return (
                <div className="item-row" key={item.id}>
                  <span className="row-label">{item.label}</span>
                  <div className="lane">
                    <div
                      className={`item-bar ${isInside ? 'inside' : 'outside'}`}
                      style={{
                        left: `${toPercent(item.start)}%`,
                        width: `${toPercent(item.end) - toPercent(item.start)}%`,
                      }}
                    />
                  </div>
                  <span className="row-meta">
                    A1:{result1 ? 'in' : 'out'} | A2:{result2 ? 'in' : 'out'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
