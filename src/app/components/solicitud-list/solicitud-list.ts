import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ISolicitud } from '../../models';
import { SolicitudesService } from '../../services/solicitudes.service';
import { apiErrorMessage } from '../../utils/api-error';
import { ConfirmModal } from '../confirm-modal/confirm-modal';
import { Pagination } from '../pagination/pagination';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-solicitudes-list',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, ConfirmModal, Pagination],
  templateUrl: './solicitudes-list.html',
  styleUrl: './solicitudes-list.css',
})
export class SolicitudesList implements OnInit {
  private solicitudService = inject(SolicitudesService);

  @ViewChild(ConfirmModal) private confirmModal?: ConfirmModal;

  solicitudes = signal<ISolicitud[]>([]);
  page = signal(1);
  totalPages = signal(1);
  loading = signal(true);
  deleting = signal(false);
  error = signal('');
  search = signal('');
  sortBy = signal('createdAt');
  sortOrder = signal<'asc' | 'desc'>('desc');
  
  showDeleted = signal(false);
  statusFilter = signal<string>('');
  typeFilter = signal<string>('');
  
  selectedIds = signal<Set<string>>(new Set());
  pendingDelete = signal<{ ids: string[]; permanent: boolean } | null>(null);

  ngOnInit(): void {
    this.loadSolicitudes();
  }

  loadSolicitudes(): void {
    this.loading.set(true);
    this.error.set('');

    this.solicitudService
      .getSolicitudes(
        {
          page: this.page(),
          limit: PAGE_SIZE,
          sortBy: this.sortBy(),
          sortOrder: this.sortOrder(),
          search: this.search(),
          status: this.statusFilter() || undefined,
          type: this.typeFilter() || undefined,
        },
        this.showDeleted()
      )
      .subscribe({
        next: (response) => {
          const totalPages = Math.max(response.totalPages, 1);
          if (response.data.length === 0 && this.page() > totalPages) {
            this.page.set(totalPages);
            this.loadSolicitudes();
            return;
          }
          this.solicitudes.set(response.data);
          this.totalPages.set(totalPages);
          this.selectedIds.set(new Set());
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(apiErrorMessage(err));
          this.loading.set(false);
        },
      });
  }

  sort(column: string): void {
    if (this.sortBy() === column) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(column);
      this.sortOrder.set('asc');
    }
    this.page.set(1);
    this.loadSolicitudes();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.loadSolicitudes();
  }

  onSearchChange(search: string): void {
    this.search.set(search);
    this.page.set(1);
    this.loadSolicitudes();
  }

  onDeletedFilterChange(showDeleted: boolean): void {
    this.showDeleted.set(showDeleted);
    this.page.set(1);
    this.loadSolicitudes();
  }

  onStatusFilterChange(status: string): void {
    this.statusFilter.set(status);
    this.page.set(1);
    this.loadSolicitudes();
  }

  onTypeFilterChange(type: string): void {
    this.typeFilter.set(type);
    this.page.set(1);
    this.loadSolicitudes();
  }

  isAllSelected(): boolean {
    return (
      this.solicitudes().length > 0 &&
      this.solicitudes().every((item) => this.selectedIds().has(item._id!))
    );
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedIds.set(
      checked ? new Set(this.solicitudes().map((item) => item._id!)) : new Set(),
    );
  }

  toggleSelected(id: string, event: Event): void {
    const selected = new Set(this.selectedIds());
    if ((event.target as HTMLInputElement).checked) selected.add(id);
    else selected.delete(id);
    this.selectedIds.set(selected);
  }

  requestDelete(ids: string[], permanent: boolean): void {
    this.pendingDelete.set({ ids, permanent });
    const message = permanent
      ? `Se eliminarán definitivamente ${ids.length} solicitud(es). Esta acción no se puede deshacer.`
      : `Se realizará el borrado lógico de ${ids.length} solicitud(es).`;

    this.confirmModal?.openWith(
      permanent ? 'Confirmar eliminación definitiva' : 'Confirmar borrado lógico',
      message,
      permanent ? 'Eliminar definitivamente' : 'Borrar',
    );
  }

  confirmDelete(): void {
    const pending = this.pendingDelete();
    if (!pending || this.deleting()) return;

    this.deleting.set(true);
    this.error.set('');

    const requests = pending.ids.map((id) =>
      pending.permanent
        ? this.solicitudService.hardDeleteSolicitud(id)
        : this.solicitudService.softDeleteSolicitud(id),
    );

    forkJoin(requests).subscribe({
      next: () => {
        this.pendingDelete.set(null);
        this.selectedIds.set(new Set());
        this.deleting.set(false);
        this.loadSolicitudes();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(apiErrorMessage(err));
        this.deleting.set(false);
      },
    });
  }

  targetActivityId(solicitud: ISolicitud): string {
    return typeof solicitud.activity_id === 'string'
      ? solicitud.activity_id
      : solicitud.activity_id?._id || '';
  }
}