export interface Household {
  idPiso: number;
  nombre: string;
  codigoInvitacion?: string;
}

export interface HouseholdMember {
  idMiembroPiso: number;
  idPiso: number;
  idUsuario: number;
  rol: string;
  usuario?: {
    nombre?: string;
    userName?: string;
    email?: string;
  };
}

export interface HouseholdTask {
  idTarea: number;
  idPiso: number;
  idUsuarioAsignado?: number | null;
  titulo: string;
  descripcion?: string;
  fechaLimite?: string;
  completada: boolean;
}

export interface HouseholdExpense {
  idGasto: number;
  idPiso: number;
  idUsuarioPagador: number;
  concepto: string;
  cantidad: number;
  categorias?: string;
  categoria?: string;
  fecha: string;
}
