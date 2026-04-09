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
  historicoGrafico: any[] = [];
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
    private cdr: ChangeDetectorRef,
  ) {}

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
          // 1. Normalização Robusta: Converte para objeto Date imediatamente
          const dadosNormalizados = dados.map((item: any) => {
            let rawDate = item.updated_at || item.updatedAt || item.UpdatedAt || item.created_at;
            let dateObj: Date;

            if (typeof rawDate === 'string') {
              // Substitui espaço por T para garantir compatibilidade ISO (Postgres -> JS)
              dateObj = new Date(rawDate.replace(' ', 'T'));
            } else {
              dateObj = new Date(rawDate);
            }

            return { ...item, safeDate: dateObj };
          });

          // 2. Ordenação e Seleção de Leituras
          this.leituras = [...dadosNormalizados]
            .sort((a, b) => a.safeDate.getTime() - b.safeDate.getTime())
            .slice(-50);

          const ultimaLeitura = this.leituras[this.leituras.length - 1];

          // 3. Atualizar Histórico do Gráfico (Evitando duplicatas por Timestamp)
          dadosNormalizados.forEach((d: any) => {
            const jaExiste = this.historicoGrafico.some(
              (h) => h.safeDate.getTime() === d.safeDate.getTime(),
            );
            if (!jaExiste) {
              this.historicoGrafico.push(d);
            }
          });

          this.historicoGrafico.sort((a, b) => a.safeDate.getTime() - b.safeDate.getTime());
          if (this.historicoGrafico.length > 50) {
            this.historicoGrafico = this.historicoGrafico.slice(-50);
          }

          // 4. Lógica de Interface
          this.atualizarCardsResumo(ultimaLeitura);
          this.checkSystemStatus(ultimaLeitura.safeDate);

          requestAnimationFrame(() => {
            this.renderizarGrafico();
            this.cdr.detectChanges();
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

  checkSystemStatus(lastReadingDate: Date) {
    if (!lastReadingDate || isNaN(lastReadingDate.getTime())) {
      this.isOnline = false;
      return;
    }
    const lastUpdate = lastReadingDate.getTime();
    const now = new Date().getTime();

    // Tolerância de 60 segundos
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
    if (!this.canvas || this.historicoGrafico.length === 0) return;

    // Criamos as labels formatadas como string para o Eixo X
    const labels = this.historicoGrafico.map((item) => {
      const d = item.safeDate;
      return d instanceof Date && !isNaN(d.getTime())
        ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '---';
    });

    const temps = this.historicoGrafico.map((item) => item.TempSht40 || item.temp_sht40 || 0);

    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = temps;
      this.chart.update('none');
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
            pointRadius: 4,
            pointHoverRadius: 7,
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
            callbacks: {
              title: (tooltipItems: any) => {
                // Aqui pegamos a label que já formatamos lá em cima
                return 'Hora da Captura: ' + tooltipItems[0].label;
              },
              label: (context: any) => {
                return 'Temperatura: ' + context.parsed.y.toFixed(2) + ' °C';
              },
            },
          },
        },
        scales: {
          y: {
            grid: { color: '#f0f0f0' },
            ticks: { callback: (v) => v + '°' },
          },
          x: {
            grid: { display: false },
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 10,
              font: { size: 10 },
            },
          },
        },
      },
    });
  }
}
