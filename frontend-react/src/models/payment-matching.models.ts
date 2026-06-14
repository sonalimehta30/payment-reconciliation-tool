export type MatchStatus = 'Matched' | 'OnlySystem' | 'OnlyProvider' | 'AmountMismatch'

export interface PaymentMatchRecordDto {
  id: string
  orderId: string
  currency: string
  systemAmount?: number | null
  providerAmount?: number | null
  status: MatchStatus
  resolved: boolean
  resolutionSide?: string | null
}

export interface MatchSummaryDto {
  total: number
  matched: number
  onlySystem: number
  onlyProvider: number
  amountMismatch: number
}

export interface MatchResponseDto {
  sessionId: string
  summary: MatchSummaryDto
  records: PaymentMatchRecordDto[]
}
