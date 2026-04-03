using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Postgrest.Attributes; // Importante para as colunas
using Postgrest.Models;     // Importante para o BaseModel

namespace EcoMonitor.Api.Models
{
    [Table("sensores_iot")]
    public class SensorModel : BaseModel
    {
        // PrimaryKey: O ID que vem da ESP32
        [PrimaryKey("id", false)] // O 'false' indica que o ID não é gerado pelo banco (nós enviamos)
        public string Id { get; set; } = string.Empty;

        [Column("nome")]
        public string? Nome { get; set; }
        [Column("pos_x")]
        public double PosX { get; set; }

        [Column("pos_y")]
        public double PosY { get; set; }

        [Column("temperatura")]
        public double? Temperatura { get; set; }

        [Column("umidade")]
        public double? Umidade { get; set; }

        [Column("co2")]
        public double? Co2 { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}