namespace PaymentsMatching.Api.DTOs;

public sealed class ResolveRequestDto
{
    public string RecordId { get; set; } = null!;
    public string ResolutionSide { get; set; } = null!;
}
