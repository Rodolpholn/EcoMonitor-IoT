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

  // Coordenadas para posicionamento
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
            // Normalização rigorosa: prioriza posX/posY do DTO
            x: s.posX ?? s.pos_x ?? 0,
            y: s.posY ?? s.pos_y ?? 0,
            id: s.id || s.Id,
          }));
          console.log('Sensores carregados na planta:', this.sensoresNaPlanta);
        }
      },
      error: (err) => console.error('Erro buscar sensores:', err),
    });
  }

  // --- MÉTODOS DE INTERAÇÃO (DRAG & ZOOM) ---
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

  // --- CAPTURA DE POSIÇÃO NO CLIQUE ---
  onRightClick(event: MouseEvent) {
    event.preventDefault();
    if (!this.isAdmin) return;

    const el = this.mapContainer.nativeElement;
    const rect = el.getBoundingClientRect();

    // 1. Posição relativa ao visor (viewport)
    const relX = event.clientX - rect.left;
    const relY = event.clientY - rect.top;

    // 2. Considera o scroll interno e o zoom para achar a coordenada real na imagem
    this.sensorX = (el.scrollLeft + relX) / this.zoomLevel;
    this.sensorY = (el.scrollTop + relY) / this.zoomLevel;

    // Menu visual (não precisa de zoom/scroll pois é absoluto na tela)
    this.menuX = relX;
    this.menuY = relY;

    console.log(
      `Clique detectado: Visual(X:${this.menuX}, Y:${this.menuY}) | Real na Planta(X:${this.sensorX}, Y:${this.sensorY})`,
    );

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
      // Enviamos posX/posY (PascalCase) para o DTO e pos_x/pos_y (snake_case) por garantia
      const payload = {
        id: this.novoSensor.id.trim(),
        nome: this.novoSensor.nome,
        posX: Number(this.sensorX.toFixed(2)),
        posY: Number(this.sensorY.toFixed(2)),
        pos_x: Number(this.sensorX.toFixed(2)),
        pos_y: Number(this.sensorY.toFixed(2)),
      };

      console.log('Enviando payload para a API:', payload);

      this.sensorService.salvarSensor(payload).subscribe({
        next: () => {
          this.showModal = false;
          this.novoSensor = { id: '', nome: '' };
          // Pequeno delay para o Supabase processar antes do refresh
          setTimeout(() => this.carregarSensores(), 500);
        },
        error: (err) => {
          console.error('Erro na API ao salvar:', err);
          alert('Erro ao salvar. Verifique se o ID já existe no sistema.');
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
