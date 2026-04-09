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

    // Intervalo de atualização para manter os dados da ESP32 atualizados na tela
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
            // Normalização: Tratando formatos camelCase (padrão C#), PascalCase e snake_case
            x: s.pos_x ?? s.posX ?? s.PosX ?? 0,
            y: s.pos_y ?? s.posY ?? s.PosY ?? 0,
            id: s.id || s.Id,
          }));
          console.log('Sensores renderizados:', this.sensoresNaPlanta);
        }
      },
      error: (err) => console.error('Erro buscar sensores:', err),
    });
  }

  // --- MÉTODOS DE INTERAÇÃO (ZOOM E DRAG) ---
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

    const relX = event.clientX - rect.left;
    const relY = event.clientY - rect.top;

    // Calcula a posição real na imagem considerando o scroll e o zoom atual
    this.sensorX = (el.scrollLeft + relX) / this.zoomLevel;
    this.sensorY = (el.scrollTop + relY) / this.zoomLevel;

    this.menuX = relX;
    this.menuY = relY;

    console.log(`Posição capturada para novo sensor: X=${this.sensorX}, Y=${this.sensorY}`);

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
      const payload = {
        id: this.novoSensor.id.trim(),
        nome: this.novoSensor.nome,
        // Padrão que o backend em C# entende nativamente (camelCase)
        posX: Number(this.sensorX.toFixed(2)),
        posY: Number(this.sensorY.toFixed(2)),
        // Mantido como fallback caso alguma outra rota ainda espere esse formato
        pos_x: Number(this.sensorX.toFixed(2)),
        pos_y: Number(this.sensorY.toFixed(2)),
      };

      console.log('Enviando dados para cadastro:', payload);

      this.sensorService.salvarSensor(payload).subscribe({
        next: () => {
          this.showModal = false;
          this.novoSensor = { id: '', nome: '' };
          setTimeout(() => this.carregarSensores(), 800);
        },
        error: (err) => {
          console.error('Erro ao salvar sensor:', err);
          alert('Não foi possível salvar. Verifique se o ID já existe ou se há erro de conexão.');
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
          console.log('Removido com sucesso.');
          setTimeout(() => this.carregarSensores(), 1000);
        },
        error: (err) => {
          console.error('Erro ao excluir:', err);
          alert('Erro ao excluir do banco de dados.');
          this.carregarSensores();
        },
      });
    }
  }

  editarSensor() {
    alert('Edição disponível em breve.');
  }

  // --- MÉTODOS ADICIONADOS PARA RESOLVER ERROS DE COMPILAÇÃO ---
  configurarMapa() {
    const url = prompt('Insira a URL da imagem da planta (ex: https://...):');
    if (url && url.trim()) {
      this.http.post(`${this.apiUrl}/Planta/update`, { imagemUrl: url.trim() }).subscribe({
        next: () => {
          this.imagemPlantaUrl = url.trim();
          alert('Planta atualizada com sucesso!');
        },
        error: (err) => {
          console.error('Erro ao salvar planta:', err);
          alert(
            'Erro ao salvar imagem da planta. Verifique se você tem permissão de administrador.',
          );
        },
      });
    }
  }

  removerPlanta() {
    if (confirm('Deseja realmente remover a imagem da planta?')) {
      // Usa o endpoint POST /update com URL vazia para limpar a planta
      this.http.post(`${this.apiUrl}/Planta/update`, { imagemUrl: '' }).subscribe({
        next: () => {
          this.imagemPlantaUrl = '';
          alert('Imagem da planta removida com sucesso.');
        },
        error: (err) => {
          console.error('Erro ao remover planta:', err);
          alert(
            'Erro ao remover imagem da planta. Verifique se você tem permissão de administrador.',
          );
        },
      });
    }
  }
}
