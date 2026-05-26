using System.Globalization;
using Microsoft.EntityFrameworkCore;
using PaymentsMatching.Api.Data;
using PaymentsMatching.Api.DTOs;
using PaymentsMatching.Api.Models;

namespace PaymentsMatching.Api.Services;

public sealed class MatchService
{
    private readonly AppDbContext _dbContext;
    private readonly CsvParserService _csvParserService;

    public MatchService(AppDbContext dbContext, CsvParserService csvParserService)
    {
        _dbContext = dbContext;
        _csvParserService = csvParserService;
    }

    public async Task<MatchResponseDto> RunMatchAsync(IFormFile systemFile, IFormFile providerFile)
    {
        var systemRows = await _csvParserService.ParseAsync(systemFile);
        var providerRows = await _csvParserService.ParseAsync(providerFile);

        var systemMap = systemRows.ToDictionary(RecordKey, StringComparer.OrdinalIgnoreCase);
        var providerMap = providerRows.ToDictionary(RecordKey, StringComparer.OrdinalIgnoreCase);
        var allKeys = new SortedSet<string>(systemMap.Keys, StringComparer.OrdinalIgnoreCase);
        allKeys.UnionWith(providerMap.Keys);

        var previousRecords = await _dbContext.MatchResults.AsNoTracking().ToListAsync();
        var previousMap = previousRecords.ToDictionary(result => RecordKey(result), StringComparer.OrdinalIgnoreCase);

        var records = allKeys.Select(key => CreateMatchResultRecord(
            key,
            systemMap.GetValueOrDefault(key),
            providerMap.GetValueOrDefault(key),
            previousMap.GetValueOrDefault(key))).ToList();

        await ReplaceAllMatchResultsAsync(records);

        return BuildResponse(records);
    }

    public async Task<MatchResponseDto> GetMatchesAsync(string? filter)
    {
        var query = _dbContext.MatchResults.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(filter))
        {
            filter = filter.Trim().ToLowerInvariant();
            query = filter switch
            {
                "resolved" => query.Where(result => result.Resolved),
                "unresolved" => query.Where(result => !result.Resolved),
                _ => query,
            };
        }

        var records = await query.OrderBy(r => r.OrderId).ThenBy(r => r.Currency).ToListAsync();
        return BuildResponse(records);
    }

    public async Task<PaymentMatchRecordDto> ResolveAsync(ResolveRequestDto request)
    {
        if (!Guid.TryParse(request.RecordId, out var recordId))
        {
            throw new KeyNotFoundException($"Match result with id '{request.RecordId}' was not found.");
        }

        var record = await _dbContext.MatchResults.FindAsync(recordId);

        if (record is null)
        {
            throw new KeyNotFoundException($"Match result with id '{request.RecordId}' was not found.");
        }

        if (!Enum.TryParse<ResolutionSide>(request.ResolutionSide, ignoreCase: true, out var resolutionSide))
        {
            throw new InvalidOperationException("ResolutionSide must be either System or Provider.");
        }

        record.Resolved = true;
        record.ResolutionSide = resolutionSide;

        await _dbContext.SaveChangesAsync();

        return MapToDto(record);
    }

    private static string RecordKey(PaymentRecord record)
        => $"{record.OrderId.Trim()}|{record.Currency.Trim().ToUpperInvariant()}";

    private static string RecordKey(MatchResult record)
        => $"{record.OrderId.Trim()}|{record.Currency.Trim().ToUpperInvariant()}";

    private static MatchResult CreateMatchResultRecord(string key, PaymentRecord? systemRecord, PaymentRecord? providerRecord, MatchResult? previousRecord)
    {
        var parts = key.Split('|');
        var orderId = parts[0];
        var currency = parts[1];
        var systemAmount = systemRecord?.Amount;
        var providerAmount = providerRecord?.Amount;
        var status = DetermineStatus(systemRecord, providerRecord);

        return new MatchResult
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            Currency = currency,
            SystemAmount = systemAmount,
            ProviderAmount = providerAmount,
            Status = status,
            Resolved = previousRecord?.Resolved ?? false,
            ResolutionSide = previousRecord?.ResolutionSide,
            CreatedAt = DateTime.UtcNow,
        };
    }

    private static MatchStatus DetermineStatus(PaymentRecord? systemRecord, PaymentRecord? providerRecord)
    {
        if (systemRecord is not null && providerRecord is not null)
        {
            return systemRecord.Amount == providerRecord.Amount ? MatchStatus.MATCHED : MatchStatus.AMOUNTMISMATCH;
        }

        return systemRecord is not null ? MatchStatus.ONLYSYSTEM : MatchStatus.ONLYPROVIDER;
    }

    private async Task ReplaceAllMatchResultsAsync(List<MatchResult> records)
    {
        _dbContext.MatchResults.RemoveRange(_dbContext.MatchResults);
        await _dbContext.SaveChangesAsync();
        await _dbContext.MatchResults.AddRangeAsync(records);
        await _dbContext.SaveChangesAsync();
    }

    private static MatchResponseDto BuildResponse(IEnumerable<MatchResult> records)
    {
        var list = records.Select(MapToDto).ToArray();
        return new MatchResponseDto
        {
            Summary = new MatchSummaryDto
            {
                Total = list.Length,
                Matched = list.Count(r => r.Status == MatchStatus.MATCHED),
                OnlySystem = list.Count(r => r.Status == MatchStatus.ONLYSYSTEM),
                OnlyProvider = list.Count(r => r.Status == MatchStatus.ONLYPROVIDER),
                AmountMismatch = list.Count(r => r.Status == MatchStatus.AMOUNTMISMATCH),
            },
            Records = list,
        };
    }

    private static PaymentMatchRecordDto MapToDto(MatchResult result)
        => new PaymentMatchRecordDto
        {
            Id = result.Id.ToString(),
            OrderId = result.OrderId,
            Currency = result.Currency,
            SystemAmount = result.SystemAmount,
            ProviderAmount = result.ProviderAmount,
            Status = result.Status,
            Resolved = result.Resolved,
            ResolutionSide = result.ResolutionSide?.ToString(),
        };
}
