namespace PaymentsMatching.Api.Models;

public sealed class PaymentRecord
{
    public PaymentRecord(string orderId, decimal amount, string currency)
    {
        OrderId = orderId;
        Amount = amount;
        Currency = currency;
    }

    public string OrderId { get; }
    public decimal Amount { get; }
    public string Currency { get; }
}
