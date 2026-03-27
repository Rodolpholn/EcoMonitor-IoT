import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SensorService {
  // Verifique se sua API está rodando nesta porta
  private apiUrl = 'http://localhost:5020/api/sensor';

  constructor(private http: HttpClient) {}

  // Esta função vai buscar a lista de temperaturas do MySQL
  getLeituras(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
