import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { MatchRunResponse, PaymentMatchRecord } from '../models/payment-matching.models';

@Injectable({
  providedIn: 'root',
})
export class PaymentMatchingService {
  private readonly http = inject(HttpClient);

  private get apiUrl(): string {
    const overrideUrl = typeof window !== 'undefined' ? (window as any)['API_BASE_URL'] : undefined;

    if (typeof overrideUrl === 'string' && overrideUrl.trim().length > 0) {
      return overrideUrl.replace(/\/$/, '') + '/api/match';
    }

    if (typeof window !== 'undefined' && window.location.hostname) {
      // hardcoded port for backend API - in a real app this would be handled via environment variables or a config file
      const origin = `${window.location.protocol}//${window.location.hostname}:5146`;
      return `${origin}/api/match`;
    }

    return 'http://localhost:5000/api/match';
  }

  async runMatch(systemFile: File, providerFile: File): Promise<MatchRunResponse> {
    const formData = new FormData();
    formData.append('systemFile', systemFile, systemFile.name);
    formData.append('providerFile', providerFile, providerFile.name);

    return firstValueFrom(this.http.post<MatchRunResponse>(this.apiUrl, formData));
  }

  async resolveMatch(
    recordId: string,
    resolutionSide: 'System' | 'Provider',
  ): Promise<PaymentMatchRecord> {
    return firstValueFrom(
      this.http.post<PaymentMatchRecord>(`${this.apiUrl}/resolve`, {
        recordId,
        resolutionSide,
      }),
    );
  }
}
