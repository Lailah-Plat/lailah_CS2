import { Revenue, Expense, Invoice, Settlement, LedgerEntry } from '../../../models/Database.js';
import { Op } from 'sequelize';

export function getYearSuffix(): string {
  const year = new Date().getFullYear();
  return String(year).slice(-2);
}

export async function generateRevenueNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yy = getYearSuffix();
  
  // Count the number of revenues created since the start of the current year
  const count = await Revenue.count({
    where: {
      createdAt: {
        [Op.gte]: new Date(`${currentYear}-01-01T00:00:00.000Z`)
      }
    }
  });
  
  const seq = String(count + 1).padStart(10, '0');
  return `REV-${yy}-${seq}`;
}

export async function generateExpenseNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yy = getYearSuffix();
  
  const count = await Expense.count({
    where: {
      createdAt: {
        [Op.gte]: new Date(`${currentYear}-01-01T00:00:00.000Z`)
      }
    }
  });
  
  const seq = String(count + 1).padStart(10, '0');
  return `EXP-${yy}-${seq}`;
}

export async function generateInvoiceNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yy = getYearSuffix();
  
  const count = await Invoice.count({
    where: {
      createdAt: {
        [Op.gte]: new Date(`${currentYear}-01-01T00:00:00.000Z`)
      }
    }
  });
  
  const seq = String(count + 1).padStart(10, '0');
  return `INV-${yy}${seq}`;
}

export async function generateSettlementNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yy = getYearSuffix();
  
  const count = await Settlement.count({
    where: {
      createdAt: {
        [Op.gte]: new Date(`${currentYear}-01-01T00:00:00.000Z`)
      }
    }
  });
  
  const seq = String(count + 1).padStart(10, '0');
  return `SET-${yy}-${seq}`;
}

let ledgerCounter = 0;
export async function generateLedgerNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yy = getYearSuffix();
  
  let count = 0;
  try {
    count = await LedgerEntry.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(`${currentYear}-01-01T00:00:00.000Z`)
        }
      }
    });
  } catch (e) {}
  
  ledgerCounter++;
  const uniqueSeq = String(count + ledgerCounter + Math.floor(Math.random() * 100000));
  const seq = uniqueSeq.padStart(10, '0').slice(-10);
  return `LDG-${yy}-${seq}`;
}
