export type ParityStatus = 'stub' | 'partial' | 'parity'

export type ParityFunction = {
  id: string
  c: string
  ts: string
  done: boolean
}

export type ParityModule = {
  id: string
  upstream: string
  typescript: string
  status: ParityStatus
  notes: string
  functions?: ParityFunction[]
}

export type ParityMilestone = {
  id: string
  title: string
  started: boolean
  modules: ParityModule[]
}

export type ParityData = {
  upstreamPin: {
    path: string
    tag: string
    commit: string
  }
  statuses: ParityStatus[]
  milestones: ParityMilestone[]
}
