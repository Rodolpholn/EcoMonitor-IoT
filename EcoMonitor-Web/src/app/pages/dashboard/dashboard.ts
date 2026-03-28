import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { SensorService } from '../../services/sensor'; // Verifique se este caminho está correto
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

  constructor(private sensorService: SensorService) {}

  ngOnInit(): void {
    // 1. Chama a função assim que o componente inicia
    this.carregarDados();

    // 2. Configura o intervalo de 5 segundos
    this.timerSubscription = interval(5000).subscribe(() => {
      this.carregarDados();
    });
  }

  ngOnDestroy(): void {
    // Limpa o timer para não pesar o navegador
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  // A função carregarDados entra aqui, dentro da classe:
  carregarDados() {
    console.log('Buscando dados na API...');
    this.sensorService.getLeituras().subscribe({
      next: (dados) => {
        console.log('Dados recebidos:', dados);
        this.leituras = dados.sort(
          (a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime(),
        );
        setTimeout(() => this.renderizarGrafico(), 100);
      },
      error: (err: any) => console.error('Erro na API:', err),
    });
  }

  renderizarGrafico() {
    if (!this.canvas) return;

    const labels = this.leituras.map((item) => new Date(item.dataHora).toLocaleTimeString());
    const temperaturas = this.leituras.map((item) => item.temperatura);

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Temperatura (°C)',
            data: temperaturas,
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13, 110, 253, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: true },
        },
      },
    });
  }
}
