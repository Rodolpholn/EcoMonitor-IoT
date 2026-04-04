using Postgrest.Attributes;
using Postgrest.Models;
using System.Text.Json.Serialization;

namespace EcoMonitor.Api.Models
{
    [Table("sensores_iot")]
    public class SensorModel : BaseModel
    {
        [PrimaryKey("id", false)]
        [JsonPropertyName("id")] // Força o JSON a aceitar 'id' minúsculo
        public string Id { get; set; } = string.Empty;

        [Column("nome")]
        [JsonPropertyName("nome")]
        public string? Nome { get; set; }

        [Column("pos_x")]
        [JsonPropertyName("pos_x")] // Mapeia 'pos_x' do JSON para esta propriedade
        public double? PosX { get; set; }

        [Column("pos_y")]
        [JsonPropertyName("pos_y")]
        public double? PosY { get; set; }

        [Column("temperatura")]
        [JsonPropertyName("temperatura")]
        public double? Temperatura { get; set; }

        [Column("umidade")]
        [JsonPropertyName("umidade")]
        public double? Umidade { get; set; }

        [Column("co2")]
        [JsonPropertyName("co2")]
        public double? Co2 { get; set; }
    }
}