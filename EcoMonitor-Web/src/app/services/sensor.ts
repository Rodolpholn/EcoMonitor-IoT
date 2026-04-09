import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SensorService {
  // Mantendo a sua URL do Railway
  private apiUrl = 'https://ecomonitor-iot-production.up.railway.app/api/sensores';

  constructor(private http: HttpClient) {}

  // 1. Busca os sensores para desenhar no MAPA (PosX, PosY)
  getSensores(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // 2. Método para o DASHBOARD cadastrar um novo sensor na planta
  // Alterado para bater no endpoint /Cadastrar do seu Controller C#
  salvarSensor(sensor: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/Cadastrar`, sensor);
  }

  // 3. Exclui um sensor da planta baixa
  excluirSensor(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // 4. Busca o histórico de leituras (Dashboard)
  getLeituras(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
