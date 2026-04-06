import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { SensorService } from '../../services/sensor';
import { Chart, registerables } from 'chart.js';
import { interval, Subscription } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('graficoTemp') canvas!: ElementRef;

  chart: any;
  leituras: any[] = [];
  private timerSubscription!: Subscription;

  // Objeto que alimenta os cards do topo (Resumo)
  resumo = {
    temperatura: 0,
    umidade: 0,
    co2: 0,
    tvoc: 0,
    v_bat: 0,
    luminosidade: 0,
  };

  constructor(private sensorService: SensorService) {}

  ngOnInit(): void {
    this.carregarDados();

    // Atualiza a cada 5 segundos para refletir os dados da ESP32 em tempo real
    this.timerSubscription = interval(5000).subscribe(() => {
      this.carregarDados();
    });
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  carregarDados() {
    this.sensorService.getLeituras().subscribe({
      next: (dados) => {
        if (dados && dados.length > 0) {
          // 1. Ordena por data (mais antigo para o mais novo para o gráfico)
          this.leituras = dados.sort(
            (a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime(),
          );

          // 2. Calcula o resumo baseado na leitura MAIS RECENTE
          const ultimaLeitura = this.leituras[this.leituras.length - 1];
          this.atualizarCardsResumo(ultimaLeitura);

          // 3. Renderiza o gráfico
          setTimeout(() => this.renderizarGrafico(), 100);
        }
      },
      error: (err: any) => console.error('Erro na API:', err),
    });
  }

  atualizarCardsResumo(data: any) {
    this.resumo = {
      temperatura: data.temp_sht40 || 0,
      umidade: data.umidade_sht40 || 0,
      co2: data.co2 || 0,
      tvoc: data.tvoc || 0,
      v_bat: data.tensao_bateria || 0,
      luminosidade: data.luminosidade || 0,
    };
  }

  renderizarGrafico() {
    if (!this.canvas) return;

    // Labels do eixo X (Hora:Minuto)
    const labels = this.leituras.map((item) =>
      new Date(item.data_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    );

    // Dados do eixo Y
    const temps = this.leituras.map((item) => item.temp_sht40);

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Temperatura SHT40 (°C)',
            data: temps,
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13, 110, 253, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 500 }, // Animação suave na atualização
        plugins: {
          legend: { display: true },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: '#f0f0f0' },
          },
          x: {
            grid: { display: false },
          },
        },
      },
    });
  }
}
