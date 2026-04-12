using Postgrest.Attributes;
using Postgrest.Models;

namespace EcoMonitor.Api.Models
{
    [Table("configuracoes_planta")]
    public class PlantaModel : BaseModel
    {
        // O "true" indica que o C# deve enviar esse ID manualmente no payload
        [PrimaryKey("id", true)] 
        public int Id { get; set; }

        [Column("imagem_url")] 
        public string ImagemUrl { get; set; } = string.Empty;
    }
}