import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ReusableTableComponent,
  TableAction,
  TableColumn,
} from './components/reusable-table/reusable-table';
import {
  MatchFilter,
  MatchSummary,
  PaymentMatchRecord,
} from './models/payment-matching.models';
import { PaymentMatchingService } from './services/payment-matching.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, ReusableTableComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly paymentMatchingService = inject(PaymentMatchingService);

  readonly title = signal('Payments Matching');
  readonly systemFile = signal<File | null>(null);
  readonly providerFile = signal<File | null>(null);
  readonly records = signal<PaymentMatchRecord[]>([]);
  readonly summary = signal<MatchSummary | null>(null);
  readonly selectedFilter = signal<MatchFilter>('all');
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly filteredRecords = computed(() => {
    const filter = this.selectedFilter();
    const records = this.records();

    if (filter === 'resolved') {
      return records.filter((record) => record.resolved);
    }

    if (filter === 'unresolved') {
      return records.filter((record) => !record.resolved);
    }

    return records;
  });

  readonly tableColumns: TableColumn<PaymentMatchRecord>[] = [
    {
      key: 'orderId',
      label: 'Order ID',
      value: (row) => row.orderId,
      className: 'fw-semibold',
    },
    {
      key: 'currency',
      label: 'Currency',
      value: (row) => row.currency,
    },
    {
      key: 'status',
      label: 'Status',
      value: (row) => this.formatStatus(row.status),
    },
    {
      key: 'systemAmount',
      label: 'System Amount',
      value: (row) => this.formatAmount(row.systemAmount),
    },
    {
      key: 'providerAmount',
      label: 'Provider Amount',
      value: (row) => this.formatAmount(row.providerAmount),
    },
    {
      key: 'resolved',
      label: 'Resolved',
      value: (row) => (row.resolved ? 'Yes' : 'No'),
    },
    {
      key: 'resolutionSide',
      label: 'Resolution Side',
      value: (row) => row.resolutionSide ?? '—',
    },
  ];

  readonly tableActions = computed<TableAction<PaymentMatchRecord>[]>(() => [
    {
      id: 'accept-system',
      label: 'Accept System',
      variant: 'outline-primary',
      visible: (row) => !row.resolved,
      disabled: (row) => row.systemAmount === null || row.status === 'MATCHED',
      onClick: (row) => this.acceptResolution(row, 'System'),
    },
    {
      id: 'accept-provider',
      label: 'Accept Provider',
      variant: 'outline-success',
      visible: (row) => !row.resolved,
      disabled: (row) => row.providerAmount === null || row.status === 'MATCHED',
      onClick: (row) => this.acceptResolution(row, 'Provider'),
    },
  ]);

  onSystemFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.systemFile.set(input.files?.[0] ?? null);
    this.resetMessages();
  }

  onProviderFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.providerFile.set(input.files?.[0] ?? null);
    this.resetMessages();
  }

  async runMatch(): Promise<void> {
    const systemFile = this.systemFile();
    const providerFile = this.providerFile();

    if (!systemFile || !providerFile) {
      this.errorMessage.set('Please upload both the System CSV and Provider CSV files.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const response = await this.paymentMatchingService.runMatch(systemFile, providerFile);
      this.summary.set(response.summary);
      this.records.set(response.records);
      this.successMessage.set('Match completed. Review the results and resolve any open items.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to process the CSV files.';
      this.errorMessage.set(message);
      this.summary.set(null);
      this.records.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  setFilter(value: MatchFilter): void {
    this.selectedFilter.set(value);
  }

  acceptResolution(record: PaymentMatchRecord, resolutionSide: 'System' | 'Provider'): void {
    this.records.set(this.paymentMatchingService.resolveRecord(this.records(), record.id, resolutionSide));
    this.successMessage.set(`Resolution saved for order ${record.orderId} as ${resolutionSide}.`);
  }

  private formatStatus(status: PaymentMatchRecord['status']): string {
    return status
      .replace(/([A-Z])/g, ' $1')
      .replace(/^\s/, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private formatAmount(amount: number | null): string {
    return amount === null ? '—' : amount.toFixed(2);
  }

  private resetMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
}
