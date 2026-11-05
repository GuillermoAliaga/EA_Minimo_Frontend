export type SolicitudesType = 'RESERVA' | 'PETICION';
export type SolicitudesStatus = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';

export interface ISolicitud {
    _id?: string;
    user_id: string | any;      
    activity_id: string | any;  
    solicitudes: SolicitudesType;
    status: SolicitudesStatus;
    comments?: string;
    deleted: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface ISolicitudesResponse {
    data: ISolicitud[];
    totalDocuments: number;
    totalPages: number;
    currentPage: number;
    limit: number;
}