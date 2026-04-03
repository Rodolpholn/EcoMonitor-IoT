using System;
using Postgrest.Attributes;
using Postgrest.Models;

namespace EcoMonitor.Api.Models
{
    [Table("sensores_iot")]
    public class SensorModel : BaseModel
    {
        // PrimaryKey: O ID que vem da ESP32 ou Angular
        // O 'false' é essencial porque estamos enviando o ID manualmente (ex: "teste")
        [PrimaryKey("id", false)] 
        public string Id { get; set; } = string.Empty;

        [Column("nome")]
        public string? Nome { get; set; }

        // IMPORTANTE: Use double? (nullable) para evitar Erro 500 se o valor vier nulo do banco
        [Column("pos_x")]
        public double? PosX { get; set; }

        [Column("pos_y")]
        public double? PosY { get; set; }

        [Column("temperatura")]
        public double? Temperatura { get; set; }

        [Column("umidade")]
        public double? Umidade { get; set; }

        [Column("co2")]
        public double? Co2 { get; set; }

        // Removi o UpdatedAt por enquanto, pois não vi essa coluna no seu print do Supabase.
        // Se você quiser usar, precisa criar a coluna 'updated_at' (timestamp) lá no Supabase primeiro.
    }
}