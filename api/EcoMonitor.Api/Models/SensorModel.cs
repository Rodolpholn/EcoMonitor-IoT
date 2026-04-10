using Postgrest.Attributes;
using Postgrest.Models;

namespace EcoMonitor.Api.Models
{
    [Table("sensores_iot")]
    public class SensorModel : BaseModel
    {
        [PrimaryKey("id", false)]
        public string Id { get; set; } = string.Empty;

        [Column("nome")]
        public string? Nome { get; set; }

        [Column("pos_x")]
        public double? PosX { get; set; }

        [Column("pos_y")]
        public double? PosY { get; set; }

        [Column("co2")]
        public double? Co2 { get; set; }

        [Column("tvoc")]
        public double? Tvoc { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        [Column("temp_aht20")]
        public double? TempAht20 { get; set; }

        [Column("umidade_aht20")]
        public double? UmidadeAht20 { get; set; }

        [Column("pressao_bmp280")]
        public double? PressaoBmp280 { get; set; }

        [Column("temp_sht40")]
        public double? TempSht40 { get; set; }

        [Column("umidade_sht40")]
        public double? UmidadeSht40 { get; set; }

        [Column("temp_sht41")]
        public double? TempSht41 { get; set; }

        [Column("luminosidade")]
        public double? Luminosidade { get; set; }

        [Column("tensao_bateria")]
        public double? TensaoBateria { get; set; }

        [Column("corrente_compressor")]
        public double? CorrenteCompressor { get; set; }

        [Column("tensao_compressor")]
        public double? TensaoCompressor { get; set; }

        [Column("sensor_porta")]
        public bool? SensorPorta { get; set; }

        [Column("temp_max")]
        public double? TempMax { get; set; }

        [Column("temp_min")]
        public double? TempMin { get; set; }

        [Column("umidade_max")]
        public double? UmidadeMax { get; set; }

        [Column("umidade_min")]
        public double? UmidadeMin { get; set; }
    }
}