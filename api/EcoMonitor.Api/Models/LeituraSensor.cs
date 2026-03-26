using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EcoMonitor.Api.Models
{
    public class LeituraSensor
    {
        public int Id { get; set; }
    public double Temperatura { get; set; }
    public double Umidade { get; set; }
    public bool LedLigado { get; set; }
    public DateTime DataHora { get; set; } = DateTime.Now;
    }
}