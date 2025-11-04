import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SymptomService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getSymptoms() {
    return this.http.get(`${this.baseUrl}/api/symptoms`);
  }

  predictSymptoms(payload: unknown) {
    return this.http.post(`${this.baseUrl}/api/predict`, payload);
  }
}
