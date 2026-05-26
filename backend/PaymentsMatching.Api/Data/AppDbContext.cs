using Microsoft.EntityFrameworkCore;
using PaymentsMatching.Api.Models;

namespace PaymentsMatching.Api.Data;

public sealed class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<MatchResult> MatchResults => Set<MatchResult>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<MatchResult>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.OrderId, e.Currency }).IsUnique();
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.ResolutionSide).HasConversion<string?>();
        });

        base.OnModelCreating(modelBuilder);
    }
}
