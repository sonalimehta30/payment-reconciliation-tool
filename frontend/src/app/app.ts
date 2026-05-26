import { Component, signal } from '@angular/core';
import { PaymentMatchingComponent } from './components/payment-matching/payment-matching';

@Component({
  selector: 'app-root',
  imports: [PaymentMatchingComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly title = signal('Payments Matching');
}
