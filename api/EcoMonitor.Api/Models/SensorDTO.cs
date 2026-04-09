using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json.Serialization;

namespace EcoMonitor.Api.Models
{
    public class SensorDTO
    {
    [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;
    [JsonPropertyName("nome")] public string? Nome { get; set; }

    // Campos de localização
    [JsonPropertyName("pos_x")] 
    public double? PosX { get; set; }

    [JsonPropertyName("pos_y")] 
    public double? PosY { get; set; }
    
    // Novos campos reais da ESP32
    [JsonPropertyName("co2")] public double? Co2 { get; set; }
    [JsonPropertyName("tvoc")] public double? Tvoc { get; set; }

    [JsonPropertyName("updated_at")]
    public DateTime? UpdatedAt { get; set; }
    [JsonPropertyName("temp_aht20")] public double? TempAht20 { get; set; }
    [JsonPropertyName("umidade_aht20")] public double? UmidadeAht20 { get; set; }
    [JsonPropertyName("pressao_bmp280")] public double? PressaoBmp280 { get; set; }
    [JsonPropertyName("temp_sht40")] public double? TempSht40 { get; set; }
    [JsonPropertyName("umidade_sht40")] public double? UmidadeSht40 { get; set; }
    [JsonPropertyName("temp_sht41")] public double? TempSht41 { get; set; }
    [JsonPropertyName("luminosidade")] public double? Luminosidade { get; set; }
    [JsonPropertyName("tensao_bateria")] public double? TensaoBateria { get; set; }
    [JsonPropertyName("corrente_compressor")] public double? CorrenteCompressor { get; set; }
    [JsonPropertyName("tensao_compressor")] public double? TensaoCompressor { get; set; }
    [JsonPropertyName("sensor_porta")] public bool? SensorPorta { get; set; }
    }
}