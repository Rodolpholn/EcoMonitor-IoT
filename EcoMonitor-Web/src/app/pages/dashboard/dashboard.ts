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
  isOnline = false; // Controle de status real
  private timerSubscription!: Subscription;

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
    this.timerSubscription = interval(5000).subscribe(() => this.carregarDados());
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) this.timerSubscription.unsubscribe();
  }

  carregarDados() {
    this.sensorService.getLeituras().subscribe({
      next: (dados) => {
        if (dados && dados.length > 0) {
          // Ordena e filtra apenas as últimas 24 leituras para não poluir o gráfico
          this.leituras = dados
            .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime())
            .slice(-24);

          const ultimaLeitura = this.leituras[this.leituras.length - 1];
          this.atualizarCardsResumo(ultimaLeitura);
          this.verificarStatusConexao(ultimaLeitura.data_hora);

          // Renderização segura do gráfico
          requestAnimationFrame(() => this.renderizarGrafico());
        }
      },
      error: (err) => console.error('Erro na API:', err),
    });
  }

  verificarStatusConexao(dataHoraUltima: string) {
    const ultima = new Date(dataHoraUltima).getTime();
    const agora = new Date().getTime();
    const diferencaMinutos = (agora - ultima) / (1000 * 60);
    this.isOnline = diferencaMinutos < 10; // Offline se não enviar dados há mais de 10 min
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
    if (!this.canvas || this.leituras.length === 0) return;

    const labels = this.leituras.map((item) => {
      const d = new Date(item.data_hora);
      return isNaN(d.getTime())
        ? '---'
        : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });

    const temps = this.leituras.map((item) => item.temp_sht40);

    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = temps;
      this.chart.update('none'); // Update sem animação agressiva para fluidez
      return;
    }

    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Temperatura (°C)',
            data: temps,
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13, 110, 253, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#0d6efd',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: '#f0f0f0' }, ticks: { callback: (v) => v + '°' } },
          x: { grid: { display: false } },
        },
      },
    });
  }
}
