export interface Household {
  idPiso: number;
  nombre: string;
  codigoInvitacion?: string;
}

export interface HouseholdUser {
  idUsuario: number;
  nombre?: string;
  userName?: string;
}

export interface HouseholdMember {
  idMiembroPiso: number;
  idPiso: number;
  idUsuario: number;
  rol: string;
  nombre?: string;
  userName?: string;
  email?: string;
  usuario?: {
    nombre?: string;
    userName?: string;
    Nombre?: string;
    UserName?: string;
    email?: string;
  };
  Usuario?: {
    nombre?: string;
    userName?: string;
    Nombre?: string;
    UserName?: string;
    email?: string;
  };
}

export interface HouseholdTask {
  idTarea: number;
  idPiso: number;
  idUsuarioAsignado?: number | null;
  nombreUsuarioAsignado?: string;
  usuarioAsignado?: {
    nombre?: string;
    Nombre?: string;
    userName?: string;
    UserName?: string;
  };
  titulo: string;
  descripcion?: string;
  fechaLimite?: string;
  completada: boolean;
}

export interface HouseholdExpense {
  idGasto: number;
  idPiso: number;
  idUsuarioPagador: number;
  nombreUsuarioPagador?: string;
  usuarioPagador?: {
    nombre?: string;
    Nombre?: string;
    userName?: string;
    UserName?: string;
  };
  concepto: string;
  cantidad: number;
  categorias?: string;
  categoria?: string;
  fecha: string;
}
