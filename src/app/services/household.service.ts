import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Household,
  HouseholdExpense,
  HouseholdMember,
  HouseholdTask,
  HouseholdUser,
} from '../models/household';

interface HouseholdApiResponse extends Omit<Household, 'idPiso'> {
  IdPiso: number;
}

@Injectable({ providedIn: 'root' })
export class HouseholdService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getHouseholds(): Observable<Household[]> {
    return this.http
      .get<HouseholdApiResponse[]>(`${this.baseUrl}/pisos`)
      .pipe(map((households) => households.map(({ IdPiso, ...household }) => ({
        ...household,
        idPiso: IdPiso,
      }))));
  }

  createHousehold(nombre: string): Observable<Household> {
    return this.http
      .post<HouseholdApiResponse>(`${this.baseUrl}/pisos`, { nombre })
      .pipe(map(({ IdPiso, ...household }) => ({ ...household, idPiso: IdPiso })));
  }

  joinHousehold(codigoInvitacion: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/miembros-pisos`, { codigoInvitacion });
  }

  leaveHousehold(memberId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/miembros-pisos/${memberId}`);
  }

  getTasks(householdId: number): Observable<HouseholdTask[]> {
    return this.http
      .get<HouseholdTask[]>(`${this.baseUrl}/tareas/piso/${householdId}`)
      .pipe(map((tasks) => tasks.map((task) => this.normalizeTask(task))));
  }

  createTask(task: Omit<HouseholdTask, 'idTarea'>): Observable<HouseholdTask> {
    return this.http
      .post<HouseholdTask>(`${this.baseUrl}/tareas`, task)
      .pipe(map((createdTask) => this.normalizeTask(createdTask)));
  }

  updateTask(task: HouseholdTask): Observable<HouseholdTask> {
    return this.http
      .put<HouseholdTask>(`${this.baseUrl}/tareas/${task.idTarea}`, task)
      .pipe(map((updatedTask) => this.normalizeTask(updatedTask)));
  }

  deleteTask(taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tareas/${taskId}`);
  }

  getExpenses(householdId: number): Observable<HouseholdExpense[]> {
    return this.http
      .get<HouseholdExpense[]>(`${this.baseUrl}/gastos/piso/${householdId}`)
      .pipe(map((expenses) => expenses.map((expense) => this.normalizeExpense(expense))));
  }

  createExpense(expense: Omit<HouseholdExpense, 'idGasto'>): Observable<HouseholdExpense> {
    return this.http
      .post<HouseholdExpense>(`${this.baseUrl}/gastos`, expense)
      .pipe(map((createdExpense) => this.normalizeExpense(createdExpense)));
  }

  deleteExpense(expenseId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/gastos/${expenseId}`);
  }

  getMembers(): Observable<HouseholdMember[]> {
    return this.http
      .get<HouseholdMember[]>(`${this.baseUrl}/miembros-pisos`)
      .pipe(map((members) => members.map((member) => this.normalizeMember(member))));
  }

  getUsers(): Observable<HouseholdUser[]> {
    return this.http.get<HouseholdUser[]>(`${this.baseUrl}/usuarios`);
  }

  private normalizeMember(member: HouseholdMember): HouseholdMember {
    const normalized = member as HouseholdMember & {
      idMiembro?: number;
      IdMiembroPiso?: number;
      IdMiembro?: number;
      IdPiso?: number;
      IdUsuario?: number;
      Nombre?: string;
      UserName?: string;
    };
    const nested = member.usuario ?? member.Usuario;
    return {
      ...member,
      idMiembroPiso:
        member.idMiembroPiso ??
        normalized.idMiembro ??
        normalized.IdMiembroPiso ??
        normalized.IdMiembro!,
      idPiso: member.idPiso ?? normalized.IdPiso!,
      idUsuario: member.idUsuario ?? normalized.IdUsuario!,
      nombre: member.nombre ?? normalized.Nombre ?? nested?.nombre ?? nested?.Nombre,
      userName: member.userName ?? normalized.UserName ?? nested?.userName ?? nested?.UserName,
      usuario: member.usuario ?? member.Usuario,
    };
  }

  private normalizeTask(task: HouseholdTask): HouseholdTask {
    const normalized = task as HouseholdTask & {
      IdTarea?: number;
      IdPiso?: number;
      IdUsuarioAsignado?: number | null;
      NombreUsuarioAsignado?: string;
    };
    return {
      ...task,
      idTarea: task.idTarea ?? normalized.IdTarea!,
      idPiso: task.idPiso ?? normalized.IdPiso!,
      idUsuarioAsignado: task.idUsuarioAsignado ?? normalized.IdUsuarioAsignado ?? null,
      nombreUsuarioAsignado:
        task.nombreUsuarioAsignado ?? normalized.NombreUsuarioAsignado,
    };
  }

  private normalizeExpense(expense: HouseholdExpense): HouseholdExpense {
    const normalized = expense as HouseholdExpense & {
      IdGasto?: number;
      IdPiso?: number;
      IdUsuarioPagador?: number;
      NombreUsuarioPagador?: string;
    };
    return {
      ...expense,
      idGasto: expense.idGasto ?? normalized.IdGasto!,
      idPiso: expense.idPiso ?? normalized.IdPiso!,
      idUsuarioPagador: expense.idUsuarioPagador ?? normalized.IdUsuarioPagador!,
      nombreUsuarioPagador:
        expense.nombreUsuarioPagador ?? normalized.NombreUsuarioPagador,
    };
  }
}
