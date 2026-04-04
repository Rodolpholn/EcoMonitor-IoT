import { Component, HostListener, ElementRef, ViewChild, OnInit } from '@angular/core';
import { SensorService } from '../../services/sensor';

@Component({
  selector: 'app-sensores-iot',
  standalone: false,
  templateUrl: './sensores-iot.html',
  styleUrl: './sensores-iot.scss',
})
export class SensoresIot implements OnInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  showMenu = false;
  showSensorMenu = false;
  showModal = false;

  menuX = 0;
  menuY = 0;
  sensorX = 0;
  sensorY = 0;

  zoomLevel = 1.0;
  minZoom = 0.5;
  maxZoom = 2.5;

  isDragging = false;
  startX = 0;
  startY = 0;
  scrollLeft = 0;
  scrollTop = 0;

  novoSensor = { id: '', nome: '' };
  sensorParaEditar: any = null;
  sensoresNaPlanta: any[] = [];

  constructor(private sensorService: SensorService) {}

  ngOnInit() {
    this.carregarSensores();
    // Atualiza os dados a cada 5 segundos para refletir a ESP32
    setInterval(() => this.carregarSensores(), 5000);
  }

  carregarSensores() {
    this.sensorService.getSensores().subscribe({
      next: (dados) => {
        if (dados && Array.isArray(dados)) {
          this.sensoresNaPlanta = dados.map((s) => ({
            ...s,
            // Mapeia as coordenadas vindas da API para o gráfico
            x: s.pos_x ?? s.posX ?? 0,
            y: s.pos_y ?? s.posY ?? 0,
            // Garante que o HTML receba os valores exatos da API
            temp_aht20: s.temp_aht20,
            umidade_aht20: s.umidade_aht20,
            pressao_bmp280: s.pressao_bmp280,
            temp_sht40: s.temp_sht40,
            umidade_sht40: s.umidade_sht40,
            temp_sht41: s.temp_sht41,
            co2: s.co2,
            tvoc: s.tvoc,
            luminosidade: s.luminosidade,
            tensao_bateria: s.tensao_bateria,
            corrente_compressor: s.corrente_compressor,
            tensao_compressor: s.tensao_compressor,
            sensor_porta: s.sensor_porta,
          }));
        }
      },
      error: (err) => {
        console.error('Erro ao buscar sensores:', err);
      },
    });
  }

  @HostListener('wheel', ['$event'])
  onMouseWheel(e: WheelEvent) {
    e.preventDefault();
    const step = 0.1;
    this.zoomLevel =
      e.deltaY < 0
        ? Math.min(this.zoomLevel + step, this.maxZoom)
        : Math.max(this.zoomLevel - step, this.minZoom);
  }

  // Função para arrastar o mapa
  startDragging(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (e.button === 0 && !target.closest('.context-menu') && !target.closest('.modal-popup')) {
      this.isDragging = true;
      const el = this.mapContainer.nativeElement;
      this.startX = e.pageX - el.offsetLeft;
      this.startY = e.pageY - el.offsetTop;
      this.scrollLeft = el.scrollLeft;
      this.scrollTop = el.scrollTop;
      el.style.cursor = 'grabbing';
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;
    const el = this.mapContainer.nativeElement;
    const x = e.pageX - el.offsetLeft;
    const y = e.pageY - el.offsetTop;
    el.scrollLeft = this.scrollLeft - (x - this.startX) * 1.5;
    el.scrollTop = this.scrollTop - (y - this.startY) * 1.5;
  }

  @HostListener('document:mouseup')
  stopDragging() {
    this.isDragging = false;
    if (this.mapContainer) this.mapContainer.nativeElement.style.cursor = 'crosshair';
  }

  onRightClick(event: MouseEvent) {
    if (this.isDragging) return;
    event.preventDefault();
    const el = this.mapContainer.nativeElement;
    const rect = el.getBoundingClientRect();

    this.menuX = event.clientX - rect.left;
    this.menuY = event.clientY - rect.top;

    this.sensorX = (el.scrollLeft + (event.clientX - rect.left)) / this.zoomLevel;
    this.sensorY = (el.scrollTop + (event.clientY - rect.top)) / this.zoomLevel;

    this.showSensorMenu = false;
    this.showMenu = true;
  }

  onRightClickSensor(event: MouseEvent, sensor: any) {
    event.preventDefault();
    event.stopPropagation();
    const el = this.mapContainer.nativeElement;
    const rect = el.getBoundingClientRect();
    this.menuX = event.clientX - rect.left;
    this.menuY = event.clientY - rect.top;
    this.sensorParaEditar = sensor;
    this.showMenu = false;
    this.showSensorMenu = true;
  }

  @HostListener('document:click', ['$event'])
  closeMenus(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.context-menu')) {
      this.showMenu = false;
      this.showSensorMenu = false;
    }
  }

  addEquipamento() {
    this.showMenu = false;
    this.showSensorMenu = false;
    setTimeout(() => {
      this.showModal = true;
      this.novoSensor = { id: '', nome: '' };
    }, 50);
  }

  salvarEquipamento() {
    if (this.novoSensor.id && this.novoSensor.nome) {
      const payload = {
        id: this.novoSensor.id,
        nome: this.novoSensor.nome,
        pos_x: Number(this.sensorX.toFixed(2)),
        pos_y: Number(this.sensorY.toFixed(2)),
        temperatura: 0.0,
        umidade: 0.0,
        co2: 0.0,
      };

      this.sensorService.salvarSensor(payload).subscribe({
        next: () => {
          this.carregarSensores();
          this.showModal = false;
          this.novoSensor = { id: '', nome: '' };
        },
        error: (err) => {
          console.error('Erro ao salvar:', err);
          alert(`Erro ao salvar no banco.`);
        },
      });
    } else {
      alert('Por favor, informe o ID e o Nome do sensor.');
    }
  }

  excluirSensor() {
    if (confirm(`Deseja remover o sensor ${this.sensorParaEditar.nome}?`)) {
      this.sensorService.excluirSensor(this.sensorParaEditar.id).subscribe({
        next: () => {
          this.carregarSensores();
          this.showSensorMenu = false;
        },
        error: (err) => alert('Erro ao excluir: ' + err.message),
      });
    }
  }

  editarSensor() {
    this.showSensorMenu = false;
    alert(`Edição de ${this.sensorParaEditar.nome} em breve.`);
  }

  configurarMapa() {
    this.showMenu = false;
    alert('Funcionalidade de troca de imagem em breve.');
  }
}
