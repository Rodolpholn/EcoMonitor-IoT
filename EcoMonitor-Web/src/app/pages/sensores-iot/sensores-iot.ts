import { Component, HostListener, ElementRef, ViewChild, OnInit } from '@angular/core';
import { SensorService } from '../../services/sensor';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sensores-iot',
  standalone: false,
  templateUrl: './sensores-iot.html',
  styleUrl: './sensores-iot.scss',
})
export class SensoresIot implements OnInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private apiUrl = 'https://ecomonitor-iot-production.up.railway.app/api';
  imagemPlantaUrl: string = '';
  isAdmin = false;
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

  constructor(
    private sensorService: SensorService,
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.authService.sessionReady$.subscribe((session) => {
      this.isAdmin = session.role === 'admin';
    });

    this.carregarSensores();
    this.carregarConfiguracaoPlanta();

    setInterval(() => this.carregarSensores(), 10000);
  }

  carregarConfiguracaoPlanta() {
    this.http.get<any>(`${this.apiUrl}/Planta`).subscribe({
      next: (res) => {
        if (res && (res.ImagemUrl !== undefined || res.imagemUrl !== undefined)) {
          this.imagemPlantaUrl = res.ImagemUrl || res.imagemUrl;
        }
      },
      error: (err) => console.error('Erro planta:', err),
    });
  }

  carregarSensores() {
    this.sensorService.getSensores().subscribe({
      next: (dados) => {
        if (dados && Array.isArray(dados)) {
          this.sensoresNaPlanta = dados.map((s) => ({
            ...s,
            // Normalização: aceita tanto pos_x quanto posX vindo da API
            x: s.posX ?? s.pos_x ?? 0,
            y: s.posY ?? s.pos_y ?? 0,
            id: s.id || s.Id,
          }));
        }
      },
      error: (err) => console.error('Erro buscar sensores:', err),
    });
  }

  // --- MÉTODOS DE INTERAÇÃO ---
  @HostListener('wheel', ['$event'])
  onMouseWheel(e: WheelEvent) {
    if (e.ctrlKey) {
      e.preventDefault();
      const step = 0.1;
      this.zoomLevel =
        e.deltaY < 0
          ? Math.min(this.zoomLevel + step, this.maxZoom)
          : Math.max(this.zoomLevel - step, this.minZoom);
    }
  }

  startDragging(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (e.button === 0 && !target.closest('.context-menu') && !target.closest('.sensor-icon')) {
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
    el.scrollLeft = this.scrollLeft - (e.pageX - el.offsetLeft - this.startX) * 1.5;
    el.scrollTop = this.scrollTop - (e.pageY - el.offsetTop - this.startY) * 1.5;
  }

  @HostListener('document:mouseup')
  stopDragging() {
    this.isDragging = false;
    if (this.mapContainer) this.mapContainer.nativeElement.style.cursor = 'crosshair';
  }

  onRightClick(event: MouseEvent) {
    event.preventDefault();
    if (!this.isAdmin) return;
    const el = this.mapContainer.nativeElement;
    const rect = el.getBoundingClientRect();

    // Calcula as coordenadas reais dentro da planta considerando o scroll e o zoom
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
    if (!this.isAdmin) return;
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
    if (!(event.target as HTMLElement).closest('.context-menu')) {
      this.showMenu = false;
      this.showSensorMenu = false;
    }
  }

  // --- CRUD DE SENSORES ---
  addEquipamento() {
    this.showMenu = false;
    this.showModal = true;
    this.novoSensor = { id: '', nome: '' };
  }

  salvarEquipamento() {
    if (this.novoSensor.id && this.novoSensor.nome) {
      // CORREÇÃO: Enviamos 'posX' e 'posY' (PascalCase/CamelCase) para bater com o C#
      const payload = {
        id: this.novoSensor.id.trim(),
        nome: this.novoSensor.nome,
        pos_x: Number(this.sensorX.toFixed(2)),
        pos_y: Number(this.sensorY.toFixed(2)),
        posX: Number(this.sensorX.toFixed(2)),
        posY: Number(this.sensorY.toFixed(2)),
      };
      console.log('Payload sendo enviado:', payload);

      this.sensorService.salvarSensor(payload).subscribe({
        next: () => {
          this.carregarSensores();
          this.showModal = false;
          this.novoSensor = { id: '', nome: '' }; // Limpa o form
        },
        error: (err) => {
          console.error('Erro ao salvar:', err);
          alert('Erro ao salvar: Verifique se o ID está correto ou se a API está online.');
        },
      });
    }
  }

  excluirSensor() {
    if (!this.sensorParaEditar) return;
    if (confirm(`Remover permanentemente ${this.sensorParaEditar.nome}?`)) {
      const idParaRemover = this.sensorParaEditar.id;
      this.sensoresNaPlanta = this.sensoresNaPlanta.filter((s) => s.id !== idParaRemover);
      this.showSensorMenu = false;

      this.sensorService.excluirSensor(idParaRemover).subscribe({
        next: () => {
          console.log('Sensor deletado com sucesso.');
          setTimeout(() => this.carregarSensores(), 1000);
        },
        error: (err) => {
          console.error('Erro ao excluir:', err);
          alert('Não foi possível excluir do banco.');
          this.carregarSensores();
        },
      });
    }
  }

  editarSensor() {
    alert('Edição em breve.');
  }
}
