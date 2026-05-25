import { Injectable } from '@angular/core';

import {
  MatchRunResponse,
  PaymentCsvRow,
  PaymentMatchRecord,
  PaymentStatus,
  ResolutionSide,
} from '../models/payment-matching.models';

@Injectable({
  providedIn: 'root',
})
export class PaymentMatchingService {
  async runMatch(systemFile: File, providerFile: File): Promise<MatchRunResponse> {
    const [systemRows, providerRows] = await Promise.all([
      this.parseCsv(systemFile),
      this.parseCsv(providerFile),
    ]);

    const providerMap = new Map(providerRows.map((row) => [this.buildMatchKey(row), row]));
    const systemMap = new Map(systemRows.map((row) => [this.buildMatchKey(row), row]));

    const allKeys = new Set([...systemMap.keys(), ...providerMap.keys()]);
    const records: PaymentMatchRecord[] = Array.from(allKeys).map((key) => {
      const systemRow = systemMap.get(key) ?? null;
      const providerRow = providerMap.get(key) ?? null;

      const status = this.getStatus(systemRow, providerRow);
      const resolved = false;
      const resolutionSide: ResolutionSide = null;

      return {
        id: `${key}-${Math.random().toString(36).slice(2, 9)}`,
        orderId: systemRow?.orderId ?? providerRow?.orderId ?? key.split('|')[0],
        currency: systemRow?.currency ?? providerRow?.currency ?? key.split('|')[1],
        systemAmount: systemRow?.amount ?? null,
        providerAmount: providerRow?.amount ?? null,
        status,
        resolved,
        resolutionSide,
      };
    });

    const summary = {
      total: records.length,
      matched: records.filter((row) => row.status === 'MATCHED').length,
      onlySystem: records.filter((row) => row.status === 'ONLYSYSTEM').length,
      onlyProvider: records.filter((row) => row.status === 'ONLYPROVIDER').length,
      amountMismatch: records.filter((row) => row.status === 'AMOUNTMISMATCH').length,
    };

    return { summary, records };
  }

  resolveRecord(records: PaymentMatchRecord[], recordId: string, resolutionSide: 'System' | 'Provider'): PaymentMatchRecord[] {
    return records.map((record) =>
      record.id === recordId
        ? {
            ...record,
            resolved: true,
            resolutionSide,
          }
        : record,
    );
  }

  private async parseCsv(file: File): Promise<PaymentCsvRow[]> {
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      return [];
    }

    const header = lines[0].split(',').map((value) => value.trim().toLowerCase());
    const expectedHeaders = ['orderid', 'amount', 'currency'];

    const headersMatch = expectedHeaders.every((headerName) => header.includes(headerName));

    if (!headersMatch) {
      throw new Error('CSV headers must include orderId, amount, and currency.');
    }

    return lines.slice(1).map((line) => {
      const values = line.split(',');
      const row = Object.fromEntries(
        header.map((column, index) => [column, values[index]?.trim()]),
      ) as Record<string, string>;

      return {
        orderId: row['orderid'],
        amount: Number(row['amount']),
        currency: row['currency'],
      };
    });
  }

  private buildMatchKey(row: PaymentCsvRow): string {
    return `${row.orderId}|${row.currency}`;
  }

  private getStatus(systemRow: PaymentCsvRow | null, providerRow: PaymentCsvRow | null): PaymentStatus {
    if (systemRow && providerRow) {
      return systemRow.amount === providerRow.amount ? 'MATCHED' : 'AMOUNTMISMATCH';
    }

    if (systemRow) {
      return 'ONLYSYSTEM';
    }

    return 'ONLYPROVIDER';
  }
}
