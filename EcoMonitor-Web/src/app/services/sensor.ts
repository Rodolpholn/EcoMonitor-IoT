import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SensorService {
  // Ajustado para a sua porta 5020 e o endpoint que criamos no Controller
  private apiUrl = 'https://ecomonitor-iot-production.up.railway.app/api/sensores';

  constructor(private http: HttpClient) {}

  // 1. Busca os sensores para desenhar no MAPA (PosX, PosY)
  getSensores(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // 2. Salva ou Atualiza um sensor (clique no botão Salvar do Modal)
  salvarSensor(sensor: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, sensor);
  }

  // 3. Exclui um sensor da planta baixa
  excluirSensor(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // 4. Busca o histórico de leituras (o que você já tinha)
  getLeituras(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
