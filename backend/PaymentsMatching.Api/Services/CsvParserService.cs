using Microsoft.AspNetCore.Http;
using PaymentsMatching.Api.Models;

namespace PaymentsMatching.Api.Services;

public sealed class CsvParserService
{
    private static readonly string[] ExpectedHeaders = { "orderid", "amount", "currency" };

    public async Task<IReadOnlyList<PaymentRecord>> ParseAsync(IFormFile file)
    {
        using var stream = file.OpenReadStream();
        using var reader = new StreamReader(stream, System.Text.Encoding.UTF8);

        var content = await reader.ReadToEndAsync();
        var lines = content
            .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(line => line.Trim())
            .Where(line => line.Length > 0)
            .ToArray();

        if (lines.Length == 0)
        {
            return Array.Empty<PaymentRecord>();
        }

        var header = lines[0].Split(',').Select(value => value.Trim().ToLowerInvariant()).ToArray();

        if (!ExpectedHeaders.All(header.Contains))
        {
            throw new InvalidOperationException("CSV headers must include orderId, amount, and currency.");
        }

        return lines.Skip(1)
            .Select((line, index) => ParseLine(line, index + 2, header))
            .ToArray();
    }

    private static PaymentRecord ParseLine(string line, int lineNumber, string[] header)
    {
        var values = line.Split(',').Select(value => value.Trim()).ToArray();
        var row = header
            .Select((column, index) => new { column, value = values.ElementAtOrDefault(index) ?? string.Empty })
            .ToDictionary(x => x.column, x => x.value, StringComparer.OrdinalIgnoreCase);

        if (!decimal.TryParse(row["amount"], System.Globalization.NumberStyles.Number, System.Globalization.CultureInfo.InvariantCulture, out var amount))
        {
            throw new InvalidOperationException($"Invalid amount value on CSV row {lineNumber}.");
        }

        var orderId = row["orderid"];
        var currency = row["currency"];

        if (string.IsNullOrWhiteSpace(orderId) || string.IsNullOrWhiteSpace(currency))
        {
            throw new InvalidOperationException($"CSV row {lineNumber} must include orderId and currency.");
        }

        return new PaymentRecord(orderId.Trim(), amount, currency.Trim().ToUpperInvariant());
    }
}
