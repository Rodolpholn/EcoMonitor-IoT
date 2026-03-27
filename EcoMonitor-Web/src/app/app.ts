import { Component, OnInit, signal } from '@angular/core';
import { SensorService } from './services/sensor'; // Garanta que o caminho está assim
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = signal('EcoMonitor-Web');

  leituras: any[] = [];

  constructor(private sensorService: SensorService) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados() {
    this.sensorService.getLeituras().subscribe({
      next: (dados) => {
        this.leituras = dados;
        console.log('Dados carregados:', dados);
      },
      error: (err: any) => {
        // Adicionei ': any' aqui para sumir o erro do terminal
        console.error('Erro ao conectar com a API:', err);
      },
    });
  }
}
