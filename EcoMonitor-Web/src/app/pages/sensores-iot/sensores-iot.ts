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
  showModalAlertas = false;
  isOnline = true; // Controla o status de comunicação com a API

  // Coordenadas para posicionamento
  menuX = 0;
  menuY = 0;
  sensorX = 0;
  sensorY = 0;

  zoomLevel = typeof window !== 'undefined' && window.innerWidth < 768 ? window.innerWidth / 3400 : 1.0;
  minZoom = typeof window !== 'undefined' && window.innerWidth < 768 ? window.innerWidth / 3400 : 0.5;
  maxZoom = 2.5;

  isDragging = false;
  startX = 0;
  startY = 0;
  scrollLeft = 0;
  scrollTop = 0;

  // Variáveis para o Pinch to Zoom (Gestos de Pinça no Mobile)
  isPinching = false;
  initialPinchDistance = 0;
  initialZoom = 1;

  novoSensor = { id: '', nome: '' };
  sensorParaEditar: any = null;
  sensoresNaPlanta: any[] = [];

  isEditing = false;
  idAntigo = '';

  alertaSelecionadoId = '';
  alertaForm = {
    tempMax: null as number | null,
    tempMin: null as number | null,
    umidadeMax: null as number | null,
    umidadeMin: null as number | null,
  };

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
            this.centralizarEZoomMapa();
        }
      },
      error: (err) => console.error('Erro planta:', err),
    });
  }

  // --- AJUSTE INICIAL DO MAPA (PROPORCIONAL E CENTRALIZADO) ---
  centralizarEZoomMapa() {
    setTimeout(() => {
      if (!this.mapContainer) return;
      const el = this.mapContainer.nativeElement;

      // Se for tela de celular, calcula a proporção exata para caber a planta toda na tela
      if (window.innerWidth < 768) {
        // A planta inteira tem 3400px de largura base no seu SCSS (3000 + 400 de respiro)
        // Dividindo a largura da tela por 3400, temos o fator exato para encaixar perfeitamente!
        const scaleToFit = window.innerWidth / 3400;
        this.zoomLevel = scaleToFit;
        this.minZoom = scaleToFit; // Bloqueia tirar zoom além do tamanho da tela
      } else {
        this.zoomLevel = 1.0;
        this.minZoom = 0.5;
      }

      // Aguarda o Angular aplicar o novo zoom (style.transform) na tela
      setTimeout(() => {
        // As dimensões do overlay no seu SCSS são:
        // min-width: 3000px + 400px (padding de respiro) = 3400px
        // min-height: 2000px + 400px (padding de respiro) = 2400px
        const contentWidth = 3400 * this.zoomLevel;
        const contentHeight = 2400 * this.zoomLevel;

        // Centraliza o scroll perfeitamente no meio do mapa
        el.scrollLeft = (contentWidth - el.clientWidth) / 2;
        el.scrollTop = (contentHeight - el.clientHeight) / 2;
      }, 50);
    }, 100);
  }

  carregarSensores() {
    this.sensorService.getSensores().subscribe({
      next: (dados) => {
        this.isOnline = true;
        if (dados && Array.isArray(dados)) {
          this.sensoresNaPlanta = dados.map((s) => ({
            ...s,
            // Normalização consistente para o template
            x: s.pos_x ?? s.posX ?? s.PosX ?? 0,
            y: s.pos_y ?? s.posY ?? s.PosY ?? 0,
            id: s.id || s.Id,
          }));
          console.log('Sensores renderizados:', this.sensoresNaPlanta);
        }
      },
      error: (err) => {
        this.isOnline = false;
        console.error('Erro buscar sensores:', err);
      },
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

  startDragging(e: any) {
    const target = e.target as HTMLElement;
    const isTouch = e.type === 'touchstart';

    // 1. Identifica movimento de Pinça (2 dedos na tela) para o Zoom Mobile
    if (isTouch && e.touches.length === 2) {
      this.isPinching = true;
      this.initialPinchDistance = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      this.initialZoom = this.zoomLevel;
      return;
    }

    // 2. Identifica o toque simples (1 dedo) ou clique do Mouse para Arrasto
    if ((isTouch && e.touches.length === 1) || (!isTouch && e.button === 0)) {
      if (!target.closest('.context-menu') && !target.closest('.sensor-icon')) {
        this.isDragging = true;
        const el = this.mapContainer.nativeElement;
        const pageX = isTouch ? e.touches[0].pageX : e.pageX;
        const pageY = isTouch ? e.touches[0].pageY : e.pageY;

        this.startX = pageX - el.offsetLeft;
        this.startY = pageY - el.offsetTop;
        this.scrollLeft = el.scrollLeft;
        this.scrollTop = el.scrollTop;
        el.style.cursor = 'grabbing';
      }
    }
  }

  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:touchmove', ['$event'])
  onMouseMove(e: any) {
    const isTouch = e.type === 'touchmove';

    // Lógica do Zoom por Pinça
    if (isTouch && this.isPinching && e.touches.length === 2) {
      const currentDistance = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      const scale = currentDistance / this.initialPinchDistance;
      this.zoomLevel = Math.max(this.minZoom, Math.min(this.initialZoom * scale, this.maxZoom));
      return;
    }

    if (!this.isDragging) return;

    // Lógica do Arrasto (Drag)
    const pageX = isTouch ? e.touches[0].pageX : e.pageX;
    const pageY = isTouch ? e.touches[0].pageY : e.pageY;

    const el = this.mapContainer.nativeElement;
    el.scrollLeft = this.scrollLeft - (pageX - el.offsetLeft - this.startX) * 1.5;
    el.scrollTop = this.scrollTop - (pageY - el.offsetTop - this.startY) * 1.5;
  }

  @HostListener('document:mouseup', ['$event'])
  @HostListener('document:touchend', ['$event'])
  stopDragging(e?: any) {
    this.isDragging = false;
    if (e && e.type === 'touchend' && e.touches && e.touches.length < 2) {
      this.isPinching = false;
    }
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
    this.isEditing = false;
    this.idAntigo = '';
    this.showModal = true;
    this.novoSensor = { id: '', nome: '' };
  }

  salvarEquipamento() {
    if (this.novoSensor.id && this.novoSensor.nome) {
      if (this.isEditing) {
        const payload = {
          id_antigo: this.idAntigo,
          id_novo: this.novoSensor.id.trim(),
          nome: this.novoSensor.nome,
        };

        this.sensorService.editarSensor(payload).subscribe({
          next: () => {
            this.showModal = false;
            this.isEditing = false;
            this.novoSensor = { id: '', nome: '' };
            setTimeout(() => this.carregarSensores(), 800);
          },
          error: (err) => {
            console.error('Erro ao editar sensor:', err);
            alert('Não foi possível editar. Verifique se o novo ID já existe.');
          },
        });
      } else {
        // CORREÇÃO: Enviando payload limpo apenas com snake_case para o C#
        const payload = {
          id: this.novoSensor.id.trim(),
          nome: this.novoSensor.nome,
          pos_x: Number(this.sensorX.toFixed(2)),
          pos_y: Number(this.sensorY.toFixed(2))
        };

        console.log('Enviando para cadastro:', payload);

        this.sensorService.salvarSensor(payload).subscribe({
          next: () => {
            this.showModal = false;
            this.novoSensor = { id: '', nome: '' };
            setTimeout(() => this.carregarSensores(), 800);
          },
          error: (err) => {
            console.error('Erro ao salvar sensor:', err);
            // Pega o detalhe do erro vindo do ModelState do C#
            const detalhe = err.error?.detalhe || 'Verifique se o ID já existe.';
            alert('Não foi possível salvar: ' + detalhe);
          },
        });
      }
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
    if (!this.sensorParaEditar) return;
    this.showSensorMenu = false;
    this.isEditing = true;
    this.idAntigo = this.sensorParaEditar.id;

    this.novoSensor = { id: this.sensorParaEditar.id, nome: this.sensorParaEditar.nome };
    this.showModal = true;
  }

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
          alert('Erro ao salvar imagem da planta.');
        },
      });
    }
  }

  removerPlanta() {
    if (confirm('Deseja realmente remover a imagem da planta?')) {
      this.http.post(`${this.apiUrl}/Planta/update`, { imagemUrl: '' }).subscribe({
        next: () => {
          this.imagemPlantaUrl = '';
          alert('Imagem da planta removida com sucesso.');
        },
        error: (err) => {
          console.error('Erro ao remover planta:', err);
          alert('Erro ao remover imagem da planta.');
        },
      });
    }
  }

  // --- GESTÃO DE ALERTAS ---
  abrirModalAlertas() {
    this.showMenu = false;
    this.showSensorMenu = false;
    this.showModalAlertas = true;

    if (this.sensorParaEditar) {
      this.alertaSelecionadoId = this.sensorParaEditar.id;
      this.carregarAlertaSelecionado();
    } else {
      this.alertaSelecionadoId = '';
      this.alertaForm = { tempMax: null, tempMin: null, umidadeMax: null, umidadeMin: null };
    }
  }

  carregarAlertaSelecionado() {
    const sensor = this.sensoresNaPlanta.find((s) => s.id === this.alertaSelecionadoId);
    if (sensor) {
      this.alertaForm.tempMax = sensor.tempMax ?? sensor.temp_max ?? null;
      this.alertaForm.tempMin = sensor.tempMin ?? sensor.temp_min ?? null;
      this.alertaForm.umidadeMax = sensor.umidadeMax ?? sensor.umidade_max ?? null;
      this.alertaForm.umidadeMin = sensor.umidadeMin ?? sensor.umidade_min ?? null;
    }
  }

  salvarAlertas() {
    if (!this.alertaSelecionadoId) return;
    const payload = {
      id: this.alertaSelecionadoId.trim(),
      temp_max: this.alertaForm.tempMax,
      temp_min: this.alertaForm.tempMin,
      umidade_max: this.alertaForm.umidadeMax,
      umidade_min: this.alertaForm.umidadeMin,
    };

    this.http.post(`${this.apiUrl}/Sensores/Alertas`, payload).subscribe({
      next: () => {
        this.showModalAlertas = false;
        setTimeout(() => this.carregarSensores(), 800);
      },
      error: (err) => {
        console.error('Erro ao salvar alertas:', err);
        alert('Erro ao salvar alertas.');
      },
    });
  }

  isEmAlerta(s: any): boolean {
    const tMax = s.tempMax ?? s.temp_max;
    const tMin = s.tempMin ?? s.temp_min;
    const uMax = s.umidadeMax ?? s.umidade_max;
    const uMin = s.umidadeMin ?? s.umidade_min;

    if (
      tMax != null &&
      ((s.temp_aht20 != null && s.temp_aht20 > tMax) ||
        (s.temp_sht40 != null && s.temp_sht40 > tMax) ||
        (s.temp_sht41 != null && s.temp_sht41 > tMax))
    )
      return true;
    if (
      tMin != null &&
      ((s.temp_aht20 != null && s.temp_aht20 < tMin) ||
        (s.temp_sht40 != null && s.temp_sht40 < tMin) ||
        (s.temp_sht41 != null && s.temp_sht41 < tMin))
    )
      return true;
    if (
      uMax != null &&
      ((s.umidade_aht20 != null && s.umidade_aht20 > uMax) ||
        (s.umidade_sht40 != null && s.umidade_sht40 > uMax))
    )
      return true;
    if (
      uMin != null &&
      ((s.umidade_aht20 != null && s.umidade_aht20 < uMin) ||
        (s.umidade_sht40 != null && s.umidade_sht40 < uMin))
    )
      return true;
    return false;
  }

  isSensorOffline(s: any): boolean {
    const updatedAt = s.updatedAt ?? s.updated_at;
    if (!updatedAt) return true;

    let dateStr = String(updatedAt);
    if (!dateStr.endsWith('Z') && !dateStr.match(/[+-]\d{2}:?\d{2}$/)) {
      dateStr += 'Z';
    }

    const lastUpdate = new Date(dateStr).getTime();
    const now = new Date().getTime();

    const diffMinutes = (now - lastUpdate) / (1000 * 60);
    return diffMinutes > 15;
  }
}
