using Microsoft.EntityFrameworkCore;
using FifaTournament.Api.Models;

namespace FifaTournament.Api.Data
{
    public class FifaTournamentContext : DbContext
    {
        public FifaTournamentContext(DbContextOptions<FifaTournamentContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Team> Teams { get; set; }
        public DbSet<Tournament> Tournaments { get; set; }
        public DbSet<TournamentTeam> TournamentTeams { get; set; }
        public DbSet<TournamentUser> TournamentUsers { get; set; }
        public DbSet<Match> Matches { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User entity configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasIndex(e => new { e.ExternalProvider, e.ExternalId }).IsUnique();
                
                entity.HasOne(u => u.Team)
                    .WithOne(t => t.Owner)
                    .HasForeignKey<Team>(t => t.OwnerId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Team entity configuration
            modelBuilder.Entity<Team>(entity =>
            {
                entity.HasIndex(e => e.Name).IsUnique();
            });

            // Tournament entity configuration
            modelBuilder.Entity<Tournament>(entity =>
            {
                entity.HasOne(t => t.CreatedBy)
                    .WithMany()
                    .HasForeignKey(t => t.CreatedById)
                    .OnDelete(DeleteBehavior.Restrict);
                
                entity.Property(t => t.EntryFee)
                    .HasPrecision(18, 2);
                
                entity.Property(t => t.PrizePool)
                    .HasPrecision(18, 2);
            });

            // TournamentTeam entity configuration
            modelBuilder.Entity<TournamentTeam>(entity =>
            {
                entity.HasIndex(e => new { e.TournamentId, e.TeamId }).IsUnique();
                
                entity.HasOne(tt => tt.Tournament)
                    .WithMany(t => t.TournamentTeams)
                    .HasForeignKey(tt => tt.TournamentId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne(tt => tt.Team)
                    .WithMany(t => t.TournamentTeams)
                    .HasForeignKey(tt => tt.TeamId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // TournamentUser entity configuration
            modelBuilder.Entity<TournamentUser>(entity =>
            {
                entity.HasIndex(e => new { e.TournamentId, e.UserId }).IsUnique();
                
                entity.HasOne(tu => tu.Tournament)
                    .WithMany(t => t.TournamentUsers)
                    .HasForeignKey(tu => tu.TournamentId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne(tu => tu.User)
                    .WithMany(u => u.TournamentUsers)
                    .HasForeignKey(tu => tu.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Match entity configuration
            modelBuilder.Entity<Match>(entity =>
            {
                entity.HasOne(m => m.Tournament)
                    .WithMany(t => t.Matches)
                    .HasForeignKey(m => m.TournamentId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne(m => m.HomeTeam)
                    .WithMany(t => t.HomeMatches)
                    .HasForeignKey(m => m.HomeTeamId)
                    .OnDelete(DeleteBehavior.NoAction);
                
                entity.HasOne(m => m.AwayTeam)
                    .WithMany(t => t.AwayMatches)
                    .HasForeignKey(m => m.AwayTeamId)
                    .OnDelete(DeleteBehavior.NoAction);
                
                entity.HasOne(m => m.WinnerTeam)
                    .WithMany()
                    .HasForeignKey(m => m.WinnerTeamId)
                    .OnDelete(DeleteBehavior.NoAction);
                
                entity.HasOne(m => m.RecordedBy)
                    .WithMany()
                    .HasForeignKey(m => m.RecordedById)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Seed data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // This can be used to seed initial data if needed
        }

        public override int SaveChanges()
        {
            UpdateTimestamps();
            return base.SaveChanges();
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            UpdateTimestamps();
            return await base.SaveChangesAsync(cancellationToken);
        }

        private void UpdateTimestamps()
        {
            var entries = ChangeTracker.Entries()
                .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

            foreach (var entry in entries)
            {
                if (entry.Entity is User user)
                {
                    if (entry.State == EntityState.Added)
                        user.CreatedAt = DateTime.UtcNow;
                    user.UpdatedAt = DateTime.UtcNow;
                }
                else if (entry.Entity is Team team)
                {
                    if (entry.State == EntityState.Added)
                        team.CreatedAt = DateTime.UtcNow;
                    team.UpdatedAt = DateTime.UtcNow;
                }
                else if (entry.Entity is Tournament tournament)
                {
                    if (entry.State == EntityState.Added)
                        tournament.CreatedAt = DateTime.UtcNow;
                    tournament.UpdatedAt = DateTime.UtcNow;
                }
            }
        }
    }
}
