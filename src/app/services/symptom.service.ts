import { Injectable } from '@angular/core';
<<<<<<< HEAD
=======
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
>>>>>>> cc936c714219ea7a64619296751987e275583dcc

@Injectable({
  providedIn: 'root'
})
export class SymptomService {
<<<<<<< HEAD

  constructor() { }
=======
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getSymptoms() {
    return this.http.get(`${this.baseUrl}/api/symptoms`);
  }

  predictSymptoms(payload: unknown) {
    return this.http.post(`${this.baseUrl}/api/predict`, payload);
  }
>>>>>>> cc936c714219ea7a64619296751987e275583dcc
}
