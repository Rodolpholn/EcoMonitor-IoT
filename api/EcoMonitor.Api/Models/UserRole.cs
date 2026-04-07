using Postgrest.Attributes;
using Postgrest.Models;
using System;

namespace EcoMonitor.Api.Models
{
    [Table("user_roles")]
    public class UserRole : BaseModel
    {
        // O false indica que o ID não é gerado automaticamente pelo banco (nós enviamos o do Auth)
        [PrimaryKey("id", false)]
        public string Id { get; set; } = string.Empty;

        [Column("role")]
        public string Role { get; set; } = string.Empty;
    }
}