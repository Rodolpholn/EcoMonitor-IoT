using Postgrest.Attributes;
using Postgrest.Models;
using System;

namespace EcoMonitor.Api.Models
{
    [Table("user_roles")]
    public class UserRole : BaseModel
    {
        // O "true" garante que o ID vindo do Auth seja enviado na inserção
        [PrimaryKey("id", true)]
        public string Id { get; set; } = string.Empty;

        [Column("role")]
        public string Role { get; set; } = string.Empty;
    }
}