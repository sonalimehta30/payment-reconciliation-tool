import axios from 'axios'
import type { MatchResponseDto, PaymentMatchRecordDto } from '../models/payment-matching.models'

const API_BASE = import.meta.env.VITE_API_BASE || ''

export async function processFiles(systemFile: File, providerFile: File): Promise<MatchResponseDto> {
  const form = new FormData()
  form.append('systemFile', systemFile)
  form.append('providerFile', providerFile)

  const res = await axios.post<MatchResponseDto>(`${API_BASE}/api/match/process`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

export async function getMatches(sessionId?: string, filter?: string): Promise<PaymentMatchRecordDto[]> {
  const params: Record<string, string> = {}
  if (sessionId) params.sessionId = sessionId
  if (filter) params.filter = filter
  const options = Object.keys(params).length ? { params } : undefined
  const res = await axios.get<PaymentMatchRecordDto[]>(`${API_BASE}/api/match/getMatches`, options)
  return res.data
}

export async function resolveRecord(recordId: string, resolutionSide: string): Promise<PaymentMatchRecordDto> {
  const res = await axios.post<PaymentMatchRecordDto>(`${API_BASE}/api/match/resolve`, { recordId, resolutionSide })
  return res.data
}
