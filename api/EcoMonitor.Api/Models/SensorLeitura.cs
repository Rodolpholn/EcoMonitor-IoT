using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace EcoMonitor.Api.Models
{
    public class SensorLeitura
    {
    [Key]
        public int Id { get; set; }

        // --- Qualidade do Ar ---
        public double Co2 { get; set; }
        public double Tvoc { get; set; }

        // --- Sensores de Temperatura e Umidade (AHT20) ---
        public double TempAht20 { get; set; }
        public double UmidadeAht20 { get; set; }

        // --- Sensores de Temperatura e Umidade (SHT40) ---
        public double TempSht40 { get; set; }
        public double UmidadeSht40 { get; set; }

        // --- Pressão e Ambiente ---
        public double PressaoBmp280 { get; set; }
        public int Luminosidade { get; set; }
        
        // --- Energia ---
        public double TensaoBateria { get; set; }

        // --- Metadados ---
        public DateTime DataHora { get; set; } = DateTime.Now;

        // Campo para facilitar a regra de alerta que o cliente pediu
        public bool AlertaAtivo { get; set; }
    }
}