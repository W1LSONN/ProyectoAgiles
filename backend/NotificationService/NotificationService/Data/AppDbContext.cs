using Microsoft.EntityFrameworkCore;

namespace NotificationService.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }
}
