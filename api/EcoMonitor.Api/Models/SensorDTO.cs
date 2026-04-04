using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json.Serialization;

namespace EcoMonitor.Api.Models
{
    public class SensorDTO
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("nome")]
        public string? Nome { get; set; }

        [JsonPropertyName("pos_x")]
        public double? PosX { get; set; }

        [JsonPropertyName("pos_y")]
        public double? PosY { get; set; }

        [JsonPropertyName("temperatura")]
        public double? Temperatura { get; set; }

        [JsonPropertyName("umidade")]
        public double? Umidade { get; set; }

        [JsonPropertyName("co2")]
        public double? Co2 { get; set; }
    }
}