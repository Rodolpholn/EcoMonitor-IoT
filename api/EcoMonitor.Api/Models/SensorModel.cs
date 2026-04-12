using Postgrest.Attributes;
using Postgrest.Models;
using System.Text.Json.Serialization; // ADICIONADO

namespace EcoMonitor.Api.Models
{
    [Table("sensores_iot")]
    public class SensorModel : BaseModel
    {
        [PrimaryKey("id", false)]
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [Column("nome")]
        [JsonPropertyName("nome")]
        public string? Nome { get; set; }

        [Column("pos_x")]
        [JsonPropertyName("pos_x")] // GARANTE A CONVERSÃO DO FRONTEND
        public double? PosX { get; set; }

        [Column("pos_y")]
        [JsonPropertyName("pos_y")] // GARANTE A CONVERSÃO DO FRONTEND
        public double? PosY { get; set; }

        [Column("co2")]
        [JsonPropertyName("co2")]
        public double? Co2 { get; set; }

        [Column("tvoc")]
        [JsonPropertyName("tvoc")]
        public double? Tvoc { get; set; }

        [Column("updated_at")]
        [JsonPropertyName("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        [Column("temp_aht20")]
        [JsonPropertyName("temp_aht20")]
        public double? TempAht20 { get; set; }

        [Column("umidade_aht20")]
        [JsonPropertyName("umidade_aht20")]
        public double? UmidadeAht20 { get; set; }

        [Column("pressao_bmp280")]
        [JsonPropertyName("pressao_bmp280")]
        public double? PressaoBmp280 { get; set; }

        [Column("temp_sht40")]
        [JsonPropertyName("temp_sht40")]
        public double? TempSht40 { get; set; }

        [Column("umidade_sht40")]
        [JsonPropertyName("umidade_sht40")]
        public double? UmidadeSht40 { get; set; }

        [Column("temp_sht41")]
        [JsonPropertyName("temp_sht41")]
        public double? TempSht41 { get; set; }

        [Column("luminosidade")]
        [JsonPropertyName("luminosidade")]
        public double? Luminosidade { get; set; }

        [Column("tensao_bateria")]
        [JsonPropertyName("tensao_bateria")]
        public double? TensaoBateria { get; set; }

        [Column("corrente_compressor")]
        [JsonPropertyName("corrente_compressor")]
        public double? CorrenteCompressor { get; set; }

        [Column("tensao_compressor")]
        [JsonPropertyName("tensao_compressor")]
        public double? TensaoCompressor { get; set; }

        [Column("sensor_porta")]
        [JsonPropertyName("sensor_porta")]
        public bool? SensorPorta { get; set; }

        [Column("temp_max")]
        [JsonPropertyName("temp_max")]
        public double? TempMax { get; set; }

        [Column("temp_min")]
        [JsonPropertyName("temp_min")]
        public double? TempMin { get; set; }

        [Column("umidade_max")]
        [JsonPropertyName("umidade_max")]
        public double? UmidadeMax { get; set; }

        [Column("umidade_min")]
        [JsonPropertyName("umidade_min")]
        public double? UmidadeMin { get; set; }
    }
}