using Microsoft.EntityFrameworkCore;

namespace IncidentService.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }
}
