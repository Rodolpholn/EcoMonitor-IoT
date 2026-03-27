import { Component, OnInit, OnDestroy, signal, ViewChild, ElementRef } from '@angular/core';
import { SensorService } from './services/sensor';
import { Chart, registerables } from 'chart.js';
import { interval, Subscription } from 'rxjs'; // <--- Necessário para o Timer

Chart.register(...registerables);

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  @ViewChild('graficoTemp') canvas!: ElementRef;
  chart: any;
  leituras: any[] = [];

  // Criamos uma assinatura para poder cancelar o timer quando fechar a página
  private timerSubscription!: Subscription;

  constructor(private sensorService: SensorService) {}

  ngOnInit(): void {
    // 1. Carrega os dados assim que abre a página
    this.carregarDados();

    // 2. Configura a atualização automática a cada 5 segundos
    this.timerSubscription = interval(5000).subscribe(() => {
      this.carregarDados();
    });
  }

  // 3. Limpa o timer ao destruir o componente (evita lentidão no PC)
  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  carregarDados() {
    this.sensorService.getLeituras().subscribe({
      next: (dados) => {
        // Ordena os dados por data para o gráfico não ficar "vai e vem"
        this.leituras = dados.sort(
          (a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime(),
        );

        // Renderiza o gráfico
        setTimeout(() => this.renderizarGrafico(), 100);
      },
      error: (err: any) => console.error('Erro na API:', err),
    });
  }

  renderizarGrafico() {
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
        animation: false, // Desativar a animação torna a atualização mais suave
        plugins: {
          legend: { display: true },
        },
      },
    });
  }
}
