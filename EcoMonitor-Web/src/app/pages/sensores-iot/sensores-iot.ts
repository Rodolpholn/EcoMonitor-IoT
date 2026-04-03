import { Component, HostListener, ElementRef, ViewChild, OnInit } from '@angular/core';
import { SensorService } from '../../services/sensor'; // Certifique-se de que o caminho está correto

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

  // Coordenadas visuais (onde o menu aparece na tela)
  menuX = 0;
  menuY = 0;

  // Coordenadas reais (onde o sensor fica no tabuleiro de 3000px)
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

  // --- CICLO DE VIDA ---
  ngOnInit() {
    this.carregarSensores();
  }

  carregarSensores() {
    this.sensorService.getSensores().subscribe({
      next: (dados) => {
        // Mapeamos posX/posY do C# para x/y que o seu HTML usa para posicionar os ícones
        this.sensoresNaPlanta = dados.map((s) => ({
          ...s,
          x: s.posX,
          y: s.posY,
          // Mantemos a simulação visual caso o banco ainda não tenha leituras reais
          temp: s.temperatura || (22 + Math.random() * 5).toFixed(1),
          umidade: s.umidade || Math.floor(40 + Math.random() * 20),
          co2: s.co2 || Math.floor(400 + Math.random() * 200),
        }));
      },
      error: (err) => console.error('Erro ao buscar sensores do banco:', err),
    });
  }

  // --- LÓGICA DE ZOOM ---
  @HostListener('wheel', ['$event'])
  onMouseWheel(e: WheelEvent) {
    e.preventDefault();
    const step = 0.1;
    if (e.deltaY < 0) {
      this.zoomLevel = Math.min(this.zoomLevel + step, this.maxZoom);
    } else {
      this.zoomLevel = Math.max(this.zoomLevel - step, this.minZoom);
    }
  }

  // --- LÓGICA DE ARRASTAR (PAN) ---
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
    const walkX = (x - this.startX) * 1.5;
    const walkY = (y - this.startY) * 1.5;
    el.scrollLeft = this.scrollLeft - walkX;
    el.scrollTop = this.scrollTop - walkY;
  }

  @HostListener('document:mouseup')
  stopDragging() {
    this.isDragging = false;
    if (this.mapContainer) {
      this.mapContainer.nativeElement.style.cursor = 'crosshair';
    }
  }

  // --- CONTROLE DE CLIQUES E MENUS ---
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

  // --- FUNÇÕES DE INTERFACE (INTEGRADAS COM API) ---
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
        posX: this.sensorX,
        posY: this.sensorY,
        // Temperatura/Umid/CO2 serão preenchidos pela leitura real da ESP32 no banco
      };

      this.sensorService.salvarSensor(payload).subscribe({
        next: () => {
          this.carregarSensores(); // Atualiza a lista vinda do banco
          this.showModal = false;
          this.novoSensor = { id: '', nome: '' };
        },
        error: (err) => alert('Erro ao salvar no banco: ' + err.message),
      });
    } else {
      alert('Preencha todos os campos!');
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
    alert(`Edição de ${this.sensorParaEditar.nome} em desenvolvimento.`);
    this.showSensorMenu = false;
  }

  configurarMapa() {
    alert('Configuração de fundo em desenvolvimento.');
    this.showMenu = false;
  }
}
