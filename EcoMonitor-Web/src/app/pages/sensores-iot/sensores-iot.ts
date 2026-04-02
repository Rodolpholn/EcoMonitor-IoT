import { Component, HostListener, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-sensores-iot',
  standalone: false,
  templateUrl: './sensores-iot.html',
  styleUrl: './sensores-iot.scss',
})
export class SensoresIot {
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

    // CRÍTICO: Não inicia arrasto se clicar em menus ou botões
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

    // Posição para o Menu flutuante
    this.menuX = event.clientX - rect.left;
    this.menuY = event.clientY - rect.top;

    // Posição para salvar o sensor (considerando scroll e zoom)
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
    // Só fecha se não clicar dentro de um menu
    if (!target.closest('.context-menu')) {
      this.showMenu = false;
      this.showSensorMenu = false;
    }
  }

  // --- FUNÇÕES DE INTERFACE ---

  addEquipamento() {
    // Fecha os menus primeiro
    this.showMenu = false;
    this.showSensorMenu = false;

    // Delay para garantir que o clique foi processado e abrir o modal limpo
    setTimeout(() => {
      this.showModal = true;
      this.novoSensor = { id: '', nome: '' };
    }, 50);
  }

  salvarEquipamento() {
    if (this.novoSensor.id && this.novoSensor.nome) {
      this.sensoresNaPlanta.push({
        id: this.novoSensor.id,
        nome: this.novoSensor.nome,
        x: this.sensorX,
        y: this.sensorY,
        // Dados simulados da API conforme solicitado
        temp: (22 + Math.random() * 5).toFixed(1),
        umidade: Math.floor(40 + Math.random() * 20),
        co2: Math.floor(400 + Math.random() * 200),
      });
      this.showModal = false;
      this.novoSensor = { id: '', nome: '' };
    } else {
      alert('Preencha todos os campos!');
    }
  }

  excluirSensor() {
    if (confirm(`Deseja remover o sensor ${this.sensorParaEditar.nome}?`)) {
      this.sensoresNaPlanta = this.sensoresNaPlanta.filter((s) => s !== this.sensorParaEditar);
    }
    this.showSensorMenu = false;
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
