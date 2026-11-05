import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageParams, PaginatedResponse, ISolicitud, SolicitudesStatus } from '../models';
import { toHttpParams } from '../utils/page-params';
@Injectable({
  providedIn: 'root',
})
export class SolicitudesService {
private http = inject(HttpClient);
private apiUrl = `${environment.apiUrl}/solicitudes`;

getSolicitudes(params: PageParams = {}, showDeleted: boolean = false): Observable<PaginatedResponse<ISolicitud>> {
    const queryParams = {
      ...params,
      search: params.search?.trim(),
      showDeleted: showDeleted 
    };

    return this.http.get<PaginatedResponse<ISolicitud>>(this.apiUrl, {
      params: toHttpParams(queryParams),
    });
  }


getSolicitud(id: string): Observable<{ solicitud: ISolicitud }> {
    return this.http.get<{ solicitud: ISolicitud }>(`${this.apiUrl}/${id}`);
  }

  createSolicitud(payload: { activity_id: string; solicitudes: string; comments?: string }): Observable<{ solicitud: ISolicitud }> {
    return this.http.post<{ solicitud: ISolicitud }>(this.apiUrl, payload);
  }

updateSolicitud(id: string, payload: Partial<{ solicitudes: string; status: SolicitudesStatus; comments?: string }>): Observable<{ solicitud: ISolicitud }> {
    return this.http.put<{ solicitud: ISolicitud }>(`${this.apiUrl}/${id}`, payload);
  }

  softDeleteSolicitud(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  hardDeleteSolicitud(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/hard/${id}`);
  }


}