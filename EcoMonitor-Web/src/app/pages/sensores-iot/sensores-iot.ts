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
  }

  carregarSensores() {
    this.sensorService.getSensores().subscribe({
      next: (dados) => {
        // Garantimos que 'dados' é um array antes de mapear
        if (dados && Array.isArray(dados)) {
          this.sensoresNaPlanta = dados.map((s) => ({
            ...s,
            // Proteção: caso a API mande posX ou pos_x (lowercase)
            x: s.posX ?? s.pos_x ?? 0,
            y: s.posY ?? s.pos_y ?? 0,

            // Simulação visual de sensores se os valores reais forem 0 ou nulos
            temp:
              s.temperatura > 0 ? s.temperatura.toFixed(1) : (22 + Math.random() * 5).toFixed(1),
            umidade: s.umidade > 0 ? s.umidade : Math.floor(40 + Math.random() * 20),
            co2: s.co2 > 0 ? s.co2 : Math.floor(400 + Math.random() * 200),
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

    // Cálculo exato da posição no mapa 3000px compensando zoom e scroll
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
        posX: Number(this.sensorX.toFixed(2)),
        posY: Number(this.sensorY.toFixed(2)),
        temperatura: 0.0,
        umidade: 0.0,
        co2: 0.0,
        updatedAt: new Date().toISOString(),
      };

      this.sensorService.salvarSensor(payload).subscribe({
        next: () => {
          this.carregarSensores(); // Recarrega do Supabase
          this.showModal = false;
          this.novoSensor = { id: '', nome: '' };
        },
        error: (err) => {
          console.error('Erro detalhado:', err);
          // Alerta mais amigável
          const msg = err.error?.message || err.statusText || 'Erro de conexão com a API';
          alert(`Erro ao salvar no banco: ${msg}`);
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
