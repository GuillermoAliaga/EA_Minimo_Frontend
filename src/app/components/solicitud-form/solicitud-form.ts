import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  ISolicitud,
  SolicitudesStatus,
  SolicitudesType,
} from '../../models';
import { AuthService } from '../../services/auth.service';
import { SolicitudesService } from '../../services/solicitudes.service';
import { apiErrorMessage } from '../../utils/api-error';

@Component({
  selector: 'app-solicitudes-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './solicitudes-form.html',
  styleUrl: './solicitudes-form.css',
})
export class SolicitudesForm implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  auth = inject(AuthService);
  private solicitudService = inject(SolicitudesService);
  private router = inject(Router);

  id = input<string>();
  loading = signal(false);
  saving = signal(false);
  loadFailed = signal(false);
  error = signal('');

  readonly types: SolicitudesType[] = ['RESERVA', 'PETICION'];
  readonly statuses: SolicitudesStatus[] = ['PENDIENTE', 'ACEPTADA', 'RECHAZADA'];

  form = this.fb.group({
    activity_id: ['', [Validators.required, Validators.pattern(/^[a-f\d]{24}$/i)]],
    solicitudes: ['RESERVA' as SolicitudesType, Validators.required],
    comments: ['', [Validators.maxLength(500)]],
    status: ['PENDIENTE' as SolicitudesStatus, Validators.required],
  });

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;

    this.loading.set(true);
    this.solicitudService.getSolicitud(id).subscribe({
      next: ({ solicitud }) => {
        this.fillForm(solicitud);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(apiErrorMessage(err));
        this.loadFailed.set(true);
        this.loading.set(false);
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const id = this.id();

    const request = id
      ? this.solicitudService.updateSolicitud(id, {
          status: value.status,
          comments: value.comments.trim(),
          solicitudes: value.solicitudes,
        })
      : this.solicitudService.createSolicitud({
          activity_id: value.activity_id.trim(),
          solicitudes: value.solicitudes,
          comments: value.comments.trim() || undefined,
        });

    this.saving.set(true);
    this.error.set('');
    
    request.subscribe({
      next: () => this.router.navigate(['/solicitudes'], { replaceUrl: true }),
      error: (err: HttpErrorResponse) => {
        this.error.set(apiErrorMessage(err));
        this.saving.set(false);
      },
    });
  }

  private fillForm(solicitud: ISolicitud): void {
    const actId = typeof solicitud.activity_id === 'string' 
      ? solicitud.activity_id 
      : solicitud.activity_id?._id || '';

    this.form.patchValue({
      activity_id: actId,
      solicitudes: solicitud.solicitudes,
      comments: solicitud.comments ?? '',
      status: solicitud.status,
    });

  }
}
