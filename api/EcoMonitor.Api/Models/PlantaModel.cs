using Postgrest.Attributes;
using Postgrest.Models;

namespace EcoMonitor.Api.Models
{
    [Table("configuracoes_planta")]
    public class PlantaModel : BaseModel
    {
        // O "false" aqui é CRUCIAL para o Upsert funcionar com ID fixo
        [PrimaryKey("id", false)] 
        public int Id { get; set; }

        [Column("imagem_url")] 
        public string ImagemUrl { get; set; } = string.Empty;
    }
}