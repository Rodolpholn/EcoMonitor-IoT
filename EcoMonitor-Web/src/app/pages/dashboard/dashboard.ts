import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
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
  isOnline = false;
  private timerSubscription!: Subscription;

  resumo = {
    temperatura: 0,
    umidade: 0,
    co2: 0,
    tvoc: 0,
    v_bat: 0,
    luminosidade: 0,
  };

  constructor(
    private sensorService: SensorService,
    private cdr: ChangeDetectorRef, // Injetado para forçar atualização da tela
  ) {}

  ngOnInit(): void {
    this.carregarDados();
    // Refresh a cada 5 segundos
    this.timerSubscription = interval(5000).subscribe(() => this.carregarDados());
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) this.timerSubscription.unsubscribe();
  }

  carregarDados() {
    this.sensorService.getLeituras().subscribe({
      next: (dados) => {
        if (dados && dados.length > 0) {
          // 1. Ordenação usando 'updated_at' (padrão do seu Supabase)
          this.leituras = [...dados]
            .sort(
              (a: any, b: any) =>
                new Date(a.updated_at || a.data_hora).getTime() -
                new Date(b.updated_at || b.data_hora).getTime(),
            )
            .slice(-50);

          const ultimaLeitura = this.leituras[this.leituras.length - 1];

          // 2. Atualizar lógica de negócio
          this.atualizarCardsResumo(ultimaLeitura);

          // Usa 'updated_at' para o status de conexão
          this.checkSystemStatus(ultimaLeitura.updated_at || ultimaLeitura.data_hora);

          // 3. Renderizar gráfico e forçar detecção de mudanças no Angular
          requestAnimationFrame(() => {
            this.renderizarGrafico();
            this.cdr.detectChanges(); // Acorda o Angular para atualizar os cards na tela
          });
        }
      },
      error: (err) => {
        console.error('Erro ao buscar dados:', err);
        this.isOnline = false;
        this.cdr.detectChanges();
      },
    });
  }

  checkSystemStatus(lastReadingDate: string) {
    if (!lastReadingDate) {
      this.isOnline = false;
      return;
    }
    const lastUpdate = new Date(lastReadingDate).getTime();
    const now = new Date().getTime();

    // Tolerância de 60 segundos para compensar oscilações de rede
    const diffInSeconds = Math.abs(now - lastUpdate) / 1000;
    this.isOnline = diffInSeconds < 60;
  }

  atualizarCardsResumo(data: any) {
    this.resumo = {
      temperatura: Number(data.TempSht40?.toFixed(1)) || Number(data.temp_sht40?.toFixed(1)) || 0,
      umidade: Number(data.UmidadeSht40?.toFixed(1)) || Number(data.umidade_sht40?.toFixed(1)) || 0,
      co2: Math.round(data.Co2 || data.co2) || 0,
      tvoc: Math.round(data.Tvoc || data.tvoc) || 0,
      v_bat: Number(data.TensaoBateria?.toFixed(1)) || Number(data.tensao_bateria?.toFixed(1)) || 0,
      luminosidade: Math.round(data.Luminosidade || data.luminosidade) || 0,
    };
  }

  renderizarGrafico() {
    if (!this.canvas || this.leituras.length === 0) return;

    // LABELS: Agora usando 'updated_at' para o gráfico "andar" no eixo X
    const labels = this.leituras.map((item) => {
      const d = new Date(item.updated_at || item.data_hora);
      return isNaN(d.getTime())
        ? '---'
        : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    });

    const temps = this.leituras.map((item) => item.TempSht40 || item.temp_sht40);

    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = temps;
      this.chart.update('none'); // Update sem animação para manter a fluidez dos 5s
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
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        scales: {
          y: {
            grid: { color: '#f0f0f0' },
            ticks: { callback: (v) => v + '°' },
          },
          x: {
            grid: { display: false },
            ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
          },
        },
      },
    });
  }
}
