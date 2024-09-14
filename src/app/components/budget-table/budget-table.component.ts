import { NgIf, NgFor, CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, QueryList, ViewChildren, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-budget-table',
  standalone: true,
  imports: [NgIf, NgFor, CommonModule,FormsModule],
  templateUrl: './budget-table.component.html',
  styleUrl: './budget-table.component.scss',
})
export class BudgetTableComponent {
  @ViewChildren('inputRef') inputs!: QueryList<ElementRef>;

  monthsInYear: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Signal to hold the selected period (month and year)
  periods = signal<{ month: string, year: string }[]>([ { month: 'April', year: '2024' },
  { month: 'August', year: '2024' }]);

  incomeCategories = signal<any[]>([]);
  expenseCategories = signal<any[]>([]);
  totalIncome = signal<number[]>([]);
  totalExpenses = signal<number[]>([]);

  profitLoss = signal<number[]>([]);
  openingBalance = signal<number[]>([]);
  closingBalance = signal<number[]>([]);
  incomeCategorydeleteArray: any[]=[];
  expenseCategorydeleteArray: any[]=[];

  constructor() {

    effect(() => {
      console.log(this.incomeCategories());
      
      this.totalIncome.set(this.calculateTotal(this.incomeCategories()));
      this.totalExpenses.set(this.calculateTotal(this.expenseCategories()));
      this.updateSummaryFields()
    }, { allowSignalWrites: true });
  }
  updatePeriods(startMonth: string, endMonth: string) {
    const startIdx = this.monthsInYear.indexOf(startMonth);
    const endIdx = this.monthsInYear.indexOf(endMonth);

    // Ensure valid selection
    if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
      console.error('Invalid month selection');
      return;
    }

    const selectedMonths = this.monthsInYear.slice(startIdx, endIdx + 1).map((month) => ({
      month: month,
      year: '2024', 
    }));

    this.periods.set(selectedMonths);
    this.incomeCategories.set([]);
    this.expenseCategories.set([]);
    this.initCategories();
    console.log(this.periods().length,"this.periods().length");
    
  }

  initCategories(): void {
    this.addIncomeCategory('', this.createEmptyAmounts(),'general Income');
    this.addExpenseCategory('', this.createEmptyAmounts(),'expense Income');
 
  }
  createEmptyAmounts(): number[] {
    
    return new Array(this.periods().length).fill(0);
  }
  addIncomeCategory(name: string, amounts: number[],parentName?:string) {
    this.incomeCategories.update((categories) => {
      const parentIndex = categories.findIndex(category => category.parentName === parentName);
  
      if (parentIndex !== -1) {
        categories[parentIndex].categories.push({ name, amounts: [...amounts] });
      } else {
        categories.push({
          parentName,
          categories: [{ name, amounts: [...amounts] }]
        });
      }
      console.log(categories);
      
      return [...categories];
    });
  }
  removeIncomeCategory(categoryIndex: number, index: number): void {
    this.incomeCategories.update((categories) => {
      const updatedCategories = [...categories];
  
      updatedCategories[categoryIndex].categories = updatedCategories[categoryIndex].categories.filter((_: any, i: number) => i !== index);
      
      if (updatedCategories[categoryIndex].categories.length === 0) {
        updatedCategories.splice(categoryIndex, 1); 
      }
  
      return updatedCategories;
    });
  }
  removeExpenseCategory(categoryIndex: number, index: number): void {
    this.expenseCategories.update((categories) => {
      const updatedCategories = [...categories];
  
      updatedCategories[categoryIndex].categories = updatedCategories[categoryIndex].categories.filter((_: any, i: number) => i !== index);
      
      if (updatedCategories[categoryIndex].categories.length === 0) {
        updatedCategories.splice(categoryIndex, 1); 
      }
  
      return updatedCategories;
    });
  }

  addExpenseCategory(name: string, amounts: any[],parentName?:string) {
    this.expenseCategories.update((categories) => {
      const parentIndex = categories.findIndex(category => category.parentName === parentName);
  
      if (parentIndex !== -1) {
        categories[parentIndex].categories.push({ name, amounts: [...amounts] });
      } else {
        categories.push({
          parentName,
          categories: [{ name, amounts: [...amounts] }]
        });
      }
      console.log(categories);
      
      return [...categories]; 
    });
  }
  calculatesubTotal(categories: any[]): number[] {
    const totals = Array(this.periods().length).fill(0);
    categories.forEach((category) => {
      category.categories.forEach((categor: { amounts: number[]; }) => {
        categor.amounts.forEach((amount: number, index: number) => {
          totals[index] += amount;
        });
      });
    
    });
    return totals;
  }

  calculateTotal(categories: any[]): number[] {
    const totals = Array(this.periods().length).fill(0);
    categories.forEach((category) => {
      category.categories.forEach((categor: { amounts: number[]; }) => {
        categor.amounts.forEach((amount: number, index: number) => {
          totals[index] += amount;
        });
      });
    
    });
    return totals;
  }
  updateSummaryFields(): void {
    const totalIncome = this.totalIncome();
    const totalExpenses = this.totalExpenses();
    
    const profitLoss = totalIncome.map((income, index) => income - totalExpenses[index]);
    this.profitLoss.set(profitLoss);

    const openingBalance = [0]; 
    const closingBalance = [];

    for (let i = 0; i < totalIncome.length; i++) {
      if (i === 0) {
        closingBalance[i] = profitLoss[i];
      } else {
        openingBalance[i] = closingBalance[i - 1];
        closingBalance[i] = openingBalance[i] + profitLoss[i];
      }
    }

    this.openingBalance.set(openingBalance);
    this.closingBalance.set(closingBalance);
  }


   onAmountChange(type: 'income' | 'expense', mainIndex:number,categoryIndex: number, amountIndex: number, value: string) {
    const updatedValue = Number(value);

    if (type === 'income') {
      this.incomeCategories.update((categories) => {
        const newCategories = [...categories];
        newCategories[mainIndex].categories[categoryIndex].amounts[amountIndex] = updatedValue;
        return newCategories;
      });
    } else {
      this.expenseCategories.update((categories) => {
        const newCategories = [...categories];
        newCategories[mainIndex].categories[categoryIndex].amounts[amountIndex] = updatedValue;
        return newCategories;
      });
    }
  }
  selection(category:string,index:number,catIndex:number) {
      if(category == 'income'){
        this.removeIncomeCategory(catIndex,index)
    }else{
      if(!this.expenseCategorydeleteArray.includes(index)){
        this.expenseCategorydeleteArray.push(index)
      }else{
        this.expenseCategorydeleteArray = this.expenseCategorydeleteArray.filter((item: number) => item !== index);


      }
    }
    console.log(this.expenseCategorydeleteArray,this.incomeCategorydeleteArray);
    
  }

  focusNextRow(i: number, j: number, k: number, section: string) {
    const nextRowIndex = i + 1;
    this.setFocus(nextRowIndex, j, k, section);
  }

  focusPreviousRow(i: number, j: number, k: number, section: string) {
    const previousRowIndex = i - 1;
    this.setFocus(previousRowIndex, j, k, section);
  }

  focusNextCol(i: number, j: number, k: number, section: string) {
    const nextColIndex = k + 1;
    this.setFocus(i, j, nextColIndex, section);
  }

  focusPreviousCol(i: number, j: number, k: number, section: string) {
    const previousColIndex = k - 1;
    this.setFocus(i, j, previousColIndex, section);
  }

  setFocus(rowIndex: number, colIndex: number, cellIndex: number, section: string) {
    const flatIndex = this.calculateFlatIndex(rowIndex, colIndex, cellIndex);
    const inputToFocus = this.inputs.toArray()[flatIndex];

    if (inputToFocus) {
      inputToFocus.nativeElement.focus();
    }
  }

  calculateFlatIndex(rowIndex: number, colIndex: number, cellIndex: number): number {
    return rowIndex * 3 + colIndex * 2 + cellIndex;  
  }
}
