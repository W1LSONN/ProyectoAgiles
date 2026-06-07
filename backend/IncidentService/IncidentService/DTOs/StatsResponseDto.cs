namespace IncidentService.DTOs;

public class StatsResponseDto
{
    public GlobalStatsDto Globales { get; set; } = new();
    public List<ZonaStatsDto> PorZona { get; set; } = new();
    public List<TipoStatsDto> PorTipo { get; set; } = new();
    public List<HoraStatsDto> PorHora { get; set; } = new();
}

public class GlobalStatsDto
{
    public int Total { get; set; }
    public int Activos { get; set; }
    public int Asumidos { get; set; }
    public int Cerrados { get; set; }
    public int Prev_total { get; set; }
    public int Prev_activos { get; set; }
}

public class ZonaStatsDto
{
    public string Nombre { get; set; } = string.Empty;
    public int Total { get; set; }
}

public class TipoStatsDto
{
    public string Nombre { get; set; } = string.Empty;
    public int Valor { get; set; }
}

public class HoraStatsDto
{
    public string Hora { get; set; } = string.Empty;
    public int Total { get; set; }
}