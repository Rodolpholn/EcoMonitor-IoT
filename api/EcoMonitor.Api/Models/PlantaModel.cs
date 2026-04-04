using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Postgrest.Attributes;
using Postgrest.Models;
using System;

namespace EcoMonitor.Api.Models
{
    [Table("configuracoes_planta")]
    public class PlantaModel : BaseModel
    {
        [PrimaryKey("id")] public int Id { get; set; }
    [Column("imagem_url")] public string ImagemUrl { get; set; } = string.Empty;
    }
}