import { Component, HostListener, ElementRef, ViewChild, OnInit } from '@angular/core';
import { SensorService } from '../../services/sensor';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-sensores-iot',
  standalone: false,
  templateUrl: './sensores-iot.html',
  styleUrl: './sensores-iot.scss',
})
export class SensoresIot implements OnInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  // URLs e Configurações
  private apiUrl = 'https://ecomonitor-iot-production.up.railway.app/api';
  imagemPlantaUrl: string = '';

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
  ) {}

  ngOnInit() {
    this.carregarSensores();
    this.carregarConfiguracaoPlanta();

    // Atualiza os dados a cada 5 segundos
    setInterval(() => this.carregarSensores(), 5000);
  }

  // --- CARREGAR CONFIGURAÇÃO DA PLANTA ---
  carregarConfiguracaoPlanta() {
    // Chamada padrão do Angular
    this.http.get<any>(`${this.apiUrl}/Planta`).subscribe({
      next: (res) => {
        console.log('Dados brutos recebidos:', res);

        // Verificamos se o objeto existe e se a propriedade está lá
        // O C# (JsonResult) vai enviar como "Id" e "ImagemUrl"
        if (res && res.ImagemUrl !== undefined) {
          this.imagemPlantaUrl = res.ImagemUrl;
          console.log('Planta carregada com sucesso!');
        } else if (res && res.imagemUrl !== undefined) {
          this.imagemPlantaUrl = res.imagemUrl;
        }
      },
      error: (err) => {
        // Se der SyntaxError aqui, o problema é um caractere invisível no banco
        console.error('Erro ao processar planta:', err);
        this.imagemPlantaUrl = '';
      },
    });
  }

  carregarSensores() {
    this.sensorService.getSensores().subscribe({
      next: (dados) => {
        if (dados && Array.isArray(dados)) {
          this.sensoresNaPlanta = dados.map((s) => ({
            ...s,
            x: s.pos_x ?? s.posX ?? 0,
            y: s.pos_y ?? s.posY ?? 0,
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
      error: (err) => console.error('Erro ao buscar sensores:', err),
    });
  }

  // --- LÓGICA DE UPLOAD DA PLANTA ---
  configurarMapa() {
    this.showMenu = false;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64Image = reader.result as string;
          this.imagemPlantaUrl = base64Image;

          // Payload com iniciais Maiúsculas (PascalCase) para bater com o Model C#
          const payload = {
            Id: 1,
            ImagemUrl: base64Image,
          };

          this.http.post(`${this.apiUrl}/Planta/update`, payload).subscribe({
            next: () => console.log('Planta salva com sucesso no banco.'),
            error: (err) => console.error('Erro ao persistir planta:', err),
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  // --- REMOVER PLANTA ---
  removerPlanta() {
    this.showMenu = false;
    if (confirm('Deseja remover a planta atual?')) {
      this.imagemPlantaUrl = '';

      const payload = {
        Id: 1,
        ImagemUrl: '',
      };

      this.http.post(`${this.apiUrl}/Planta/update`, payload).subscribe({
        next: () => console.log('Planta removida com sucesso.'),
        error: (err) => console.error('Erro ao remover planta:', err),
      });
    }
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
    if (
      e.button === 0 &&
      !target.closest('.context-menu') &&
      !target.closest('.modal-popup') &&
      !target.closest('.sensor-icon')
    ) {
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
    this.showModal = true;
    this.novoSensor = { id: '', nome: '' };
  }

  salvarEquipamento() {
    if (this.novoSensor.id && this.novoSensor.nome) {
      const payload = {
        id: this.novoSensor.id,
        nome: this.novoSensor.nome,
        pos_x: Number(this.sensorX.toFixed(2)),
        pos_y: Number(this.sensorY.toFixed(2)),
      };
      this.sensorService.salvarSensor(payload).subscribe({
        next: () => {
          this.carregarSensores();
          this.showModal = false;
        },
        error: (err) => console.error('Erro ao salvar sensor:', err),
      });
    }
  }

  excluirSensor() {
    if (confirm(`Remover ${this.sensorParaEditar.nome}?`)) {
      this.sensorService.excluirSensor(this.sensorParaEditar.id).subscribe({
        next: () => {
          this.carregarSensores();
          this.showSensorMenu = false;
        },
        error: (err) => console.error('Erro ao excluir:', err),
      });
    }
  }

  editarSensor() {
    this.showSensorMenu = false;
    alert('Edição de dados em breve.');
  }
}
