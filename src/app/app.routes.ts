import { Routes } from '@angular/router';
import { BudgetTableComponent } from './components/budget-table/budget-table.component';

export const routes: Routes = [

  {
    path: 'sheet',
    component: BudgetTableComponent,
  },
  { path: '', redirectTo: 'sheet', pathMatch: 'full' },
];
