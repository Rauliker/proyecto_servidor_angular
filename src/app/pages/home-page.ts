import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import {
  Household,
  HouseholdExpense,
  HouseholdMember,
  HouseholdTask,
  HouseholdUser,
} from '../models/household';
import { AuthService } from '../services/auth.service';
import { HouseholdService } from '../services/household.service';
import { AuthState } from '../services/auth-state.service';

type View = 'overview' | 'tasks' | 'expenses' | 'households' | 'members';

@Component({
  imports: [CurrencyPipe, FormsModule],
  selector: 'app-home-page',
  templateUrl: './home-page.html',
})
export class HomePage implements OnInit {
  private readonly api = inject(HouseholdService);
  private readonly auth = inject(AuthService);
  private readonly authState = inject(AuthState);
  private readonly router = inject(Router);

  protected readonly view = signal<View>('overview');
  protected readonly households = signal<Household[]>([]);
  protected readonly tasks = signal<HouseholdTask[]>([]);
  protected readonly expenses = signal<HouseholdExpense[]>([]);
  protected readonly members = signal<HouseholdMember[]>([]);
  protected readonly users = signal<HouseholdUser[]>([]);
  protected readonly errorMessage = signal('');
  protected readonly notice = signal('');
  protected readonly isLoading = signal(false);
  protected readonly selectedId = signal<number | null>(null);
  protected householdName = '';
  protected invitationCode = '';
  protected taskTitle = '';
  protected taskDescription = '';
  protected taskDueDate = '';
  protected taskAssignee = '';
  protected expenseConcept = '';
  protected expenseAmount: number | null = null;
  protected expenseCategory = '';
  protected expenseDate = new Date().toISOString().slice(0, 10);
  protected expensePayer = '';
  private usersLoaded = false;

  protected get selectedHousehold(): Household | undefined {
    return this.households().find((household) => household.idPiso === this.selectedId());
  }

  protected get pendingCount(): number {
    return this.tasks().filter((task) => !task.completada).length;
  }

  protected get totalExpenses(): number {
    return this.expenses().reduce((total, expense) => total + Number(expense.cantidad), 0);
  }

  ngOnInit(): void {
    this.loadHouseholds();
  }

  protected selectView(view: View): void {
    this.view.set(view);
  }

  protected onHouseholdChange(value: string): void {
    const id = Number(value);
    this.selectedId.set(Number.isFinite(id) ? id : null);
    if (id) {
      sessionStorage.setItem('selectedHouseholdId', String(id));
      this.loadHouseholdData(id);
    }
  }

  protected createHousehold(): void {
    const nombre = this.householdName.trim();
    if (!nombre || this.isLoading()) return;
    this.run(this.api.createHousehold(nombre), (household) => {
      if (!this.isValidHouseholdId(household?.idPiso)) {
        this.errorMessage.set('La API devolvió un piso sin un idPiso válido.');
        return;
      }
      this.householdName = '';
      this.households.update((current) => [...current, household]);
      this.selectedId.set(household.idPiso);
      this.loadHouseholdData(household.idPiso);
      this.notice.set('Piso creado correctamente.');
    });
  }

  protected joinHousehold(): void {
    const codigoInvitacion = this.invitationCode.trim();
    if (!codigoInvitacion || this.isLoading()) return;
    this.run(
      this.api.joinHousehold(codigoInvitacion).pipe(switchMap(() => this.api.getHouseholds())),
      (households) => {
        this.invitationCode = '';
        this.updateHouseholds(households);
        this.notice.set('Te has unido al piso correctamente.');
      },
    );
  }

  protected leaveHousehold(household: Household): void {
    if (
      this.isLoading() ||
      !confirm(`¿Quieres salir del piso «${household.nombre}»?`)
    ) {
      return;
    }

    const userId = this.authState.userId();
    if (!userId) {
      this.errorMessage.set('No se pudo identificar al usuario de la sesión.');
      return;
    }

    this.run(
      this.api.getMembers().pipe(
        map((members) => {
          const membership = members.find(
            (member) =>
              Number(member.idPiso) === household.idPiso &&
              Number(member.idUsuario) === userId,
          );
          const memberId = Number(membership?.idMiembroPiso);
          if (!Number.isSafeInteger(memberId) || memberId <= 0) {
            throw new Error('No se encontró tu membresía en este piso.');
          }
          return memberId;
        }),
        switchMap((memberId) => this.api.leaveHousehold(memberId)),
      ),
      () => {
        const remainingHouseholds = this.households().filter(
          (item) => item.idPiso !== household.idPiso,
        );
        this.households.set(remainingHouseholds);
        this.notice.set('Has salido del piso.');

        if (this.selectedId() !== household.idPiso) return;

        this.tasks.set([]);
        this.expenses.set([]);
        this.members.set([]);
        const nextHousehold = remainingHouseholds[0];
        if (nextHousehold) {
          this.selectedId.set(nextHousehold.idPiso);
          sessionStorage.setItem('selectedHouseholdId', String(nextHousehold.idPiso));
          this.loadHouseholdData(nextHousehold.idPiso);
        } else {
          this.selectedId.set(null);
          sessionStorage.removeItem('selectedHouseholdId');
        }
      },
    );
  }

  protected createTask(): void {
    const idPiso = this.selectedId();
    const titulo = this.taskTitle.trim();
    if (!idPiso || !titulo || this.isLoading()) return;
    this.run(
      this.api.createTask({
        idPiso,
        idUsuarioAsignado: this.taskAssignee ? Number(this.taskAssignee) : null,
        titulo,
        descripcion: this.taskDescription.trim(),
        fechaLimite: this.taskDueDate || undefined,
        completada: false,
      }),
      (task) => {
        this.tasks.update((current) => [...current, task]);
        this.taskTitle = '';
        this.taskDescription = '';
        this.taskDueDate = '';
        this.taskAssignee = '';
        this.notice.set('Tarea creada correctamente.');
      },
    );
  }

  protected toggleTask(task: HouseholdTask): void {
    this.run(this.api.updateTask({ ...task, completada: !task.completada }), (updated) => {
      this.tasks.update((current) =>
        current.map((item) => (item.idTarea === updated.idTarea ? updated : item)),
      );
      this.notice.set('Estado de la tarea actualizado.');
    });
  }

  protected deleteTask(task: HouseholdTask): void {
    if (!confirm(`¿Eliminar la tarea «${task.titulo}»?`)) return;
    this.run(this.api.deleteTask(task.idTarea), () => {
      this.tasks.update((current) => current.filter((item) => item.idTarea !== task.idTarea));
      this.notice.set('Tarea eliminada.');
    });
  }

  protected createExpense(): void {
    const idPiso = this.selectedId();
    if (
      !idPiso ||
      !this.expenseConcept.trim() ||
      !this.expenseAmount ||
      !this.expensePayer ||
      this.isLoading()
    ) {
      return;
    }
    this.run(
      this.api.createExpense({
        idPiso,
        idUsuarioPagador: Number(this.expensePayer),
        concepto: this.expenseConcept.trim(),
        cantidad: this.expenseAmount,
        categorias: this.expenseCategory.trim(),
        fecha: this.expenseDate,
      }),
      (expense) => {
        this.expenses.update((current) => [...current, expense]);
        this.expenseConcept = '';
        this.expenseAmount = null;
        this.expenseCategory = '';
        this.expensePayer = '';
        this.notice.set('Gasto registrado correctamente.');
      },
    );
  }

  protected deleteExpense(expense: HouseholdExpense): void {
    if (!confirm(`¿Eliminar el gasto «${expense.concepto}»?`)) return;
    this.run(this.api.deleteExpense(expense.idGasto), () => {
      this.expenses.update((current) => current.filter((item) => item.idGasto !== expense.idGasto));
      this.notice.set('Gasto eliminado.');
    });
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }

  protected memberName(
    id: number | string | null | undefined,
    directName?: string,
    nestedName?: { nombre?: string; Nombre?: string; userName?: string; UserName?: string },
  ): string {
    if (!id) return 'Sin asignar';
    const userId = Number(id);
    const member = this.members().find((item) => Number(item.idUsuario) === userId);
    const user = member?.usuario ?? member?.Usuario;
    return (
      this.users().find((item) => Number(item.idUsuario) === userId)?.userName ||
      member?.userName ||
      user?.userName ||
      user?.UserName ||
      nestedName?.userName ||
      nestedName?.UserName ||
      directName ||
      nestedName?.nombre ||
      nestedName?.Nombre ||
      member?.nombre ||
      user?.nombre ||
      user?.Nombre ||
      `Usuario ${id}`
    );
  }

  protected expenseCategoryOf(expense: HouseholdExpense): string {
    return expense.categorias || expense.categoria || 'Sin categoría';
  }

  private loadHouseholds(): void {
    this.run(this.api.getHouseholds(), (households) => this.updateHouseholds(households));
  }

  private updateHouseholds(households: Household[]): void {
    const validHouseholds = households.filter((household) =>
      this.isValidHouseholdId(household.idPiso),
    );
    this.households.set(validHouseholds);
    const savedId = Number(sessionStorage.getItem('selectedHouseholdId'));
    const selected =
      validHouseholds.find((household) => household.idPiso === savedId) ?? validHouseholds[0];
    if (selected) {
      this.selectedId.set(selected.idPiso);
      this.loadHouseholdData(selected.idPiso);
    } else {
      this.selectedId.set(null);
      if (households.length > 0) {
        this.errorMessage.set('La API devolvió pisos sin un idPiso válido.');
      }
    }
  }

  private loadHouseholdData(householdId: number): void {
    if (!this.isValidHouseholdId(householdId)) {
      this.errorMessage.set('No se pueden cargar los datos: el piso no tiene un idPiso válido.');
      return;
    }
    this.errorMessage.set('');
    this.api.getTasks(householdId).subscribe({
      next: (tasks) => this.tasks.set(tasks),
      error: (error: HttpErrorResponse) => this.handleError(error),
    });
    this.api.getExpenses(householdId).subscribe({
      next: (expenses) => this.expenses.set(expenses),
      error: (error: HttpErrorResponse) => this.handleError(error),
    });
    this.api.getMembers().subscribe({
      next: (members) =>
        this.members.set(members.filter((member) => member.idPiso === householdId)),
      error: (error: HttpErrorResponse) => this.handleError(error),
    });
    if (!this.usersLoaded) {
      this.api.getUsers().subscribe({
        next: (users) => {
          this.users.set(users);
          this.usersLoaded = true;
        },
        error: (error: HttpErrorResponse) => this.handleError(error),
      });
    }
  }

  private isValidHouseholdId(id: number | null | undefined): id is number {
    return typeof id === 'number' && Number.isInteger(id) && id > 0;
  }

  private run<T>(request: import('rxjs').Observable<T>, onSuccess: (value: T) => void): void {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.notice.set('');
    request.subscribe({
      next: (value) => {
        onSuccess(value);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error);
        this.isLoading.set(false);
      },
    });
  }

  private handleError(error: HttpErrorResponse | Error): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.errorMessage.set(error.message);
      return;
    }
    this.errorMessage.set(
      error.status === 0
        ? error.error instanceof Error
          ? error.error.message
          : 'No se pudo conectar con la API local. Comprueba que el backend esté activo en localhost:8080 y permita CORS desde localhost:4200.'
        : error.status === 401
          ? 'Tu sesión ha caducado. Inicia sesión de nuevo.'
          : error.status === 403
            ? 'No tienes permiso para realizar esta operación.'
            : 'No se pudieron cargar o guardar los datos. Comprueba el contrato de la API e inténtalo de nuevo.',
    );
  }
}
