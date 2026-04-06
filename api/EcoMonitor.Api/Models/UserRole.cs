using Postgrest.Attributes;
using Postgrest.Models;
using System;

namespace EcoMonitor.Api.Models
{
    [Table("user_roles")]
    public class UserRole : BaseModel
    {
        [PrimaryKey("id", false)]
        public string Id { get; set; }

        [Column("role")]
        public string Role { get; set; }
    }
}
