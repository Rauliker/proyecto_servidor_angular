import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Household, HouseholdExpense, HouseholdMember, HouseholdTask } from '../models/household';

@Injectable({ providedIn: 'root' })
export class HouseholdService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getHouseholds(): Observable<Household[]> {
    return this.http.get<Household[]>(`${this.baseUrl}/pisos`);
  }

  createHousehold(nombre: string): Observable<Household> {
    return this.http.post<Household>(`${this.baseUrl}/pisos`, { nombre });
  }

  getTasks(householdId: number): Observable<HouseholdTask[]> {
    return this.http.get<HouseholdTask[]>(`${this.baseUrl}/tareas/piso/${householdId}`);
  }

  createTask(task: Omit<HouseholdTask, 'idTarea'>): Observable<HouseholdTask> {
    return this.http.post<HouseholdTask>(`${this.baseUrl}/tareas`, task);
  }

  updateTask(task: HouseholdTask): Observable<HouseholdTask> {
    return this.http.put<HouseholdTask>(`${this.baseUrl}/tareas/${task.idTarea}`, task);
  }

  deleteTask(taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tareas/${taskId}`);
  }

  getExpenses(householdId: number): Observable<HouseholdExpense[]> {
    return this.http.get<HouseholdExpense[]>(`${this.baseUrl}/gastos/piso/${householdId}`);
  }

  createExpense(expense: Omit<HouseholdExpense, 'idGasto'>): Observable<HouseholdExpense> {
    return this.http.post<HouseholdExpense>(`${this.baseUrl}/gastos`, expense);
  }

  deleteExpense(expenseId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/gastos/${expenseId}`);
  }

  getMembers(): Observable<HouseholdMember[]> {
    return this.http.get<HouseholdMember[]>(`${this.baseUrl}/miembros-pisos`);
  }
}
