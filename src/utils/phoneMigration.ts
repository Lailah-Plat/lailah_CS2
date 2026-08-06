import { sequelize } from '../models/dbInstance.js';
import { normalizePhone } from './otpSender.js';

/**
 * Normalizes Saudi IBAN to a strict 24-character standard starting with 'SA'
 */
export function normalizeIban(iban: string): string {
  if (!iban) return '';
  
  // Convert to uppercase and strip all spaces, hyphens, brackets, dots, commas
  let cleaned = iban.toUpperCase().replace(/[\s\-\(\)\.\,]/g, '');
  
  // Clean duplicate prefixes like SASA
  while (cleaned.startsWith('SASA')) {
    cleaned = cleaned.substring(2);
  }
  
  // Clean leading zeroes if they are before SA
  while (cleaned.startsWith('0') && !cleaned.startsWith('SA')) {
    cleaned = cleaned.substring(1);
  }
  
  // If it doesn't start with SA but has 22 digits, prepend SA
  if (!cleaned.startsWith('SA')) {
    const digits = cleaned.replace(/[^\d]/g, '');
    if (digits.length === 22) {
      cleaned = 'SA' + digits;
    }
  }
  
  return cleaned;
}

/**
 * Executes a one-time data migration/normalization on server startup
 */
export async function runStartupDataMigration(): Promise<void> {
  console.log('🚀 [Migration] Starting data normalization migration for phone numbers and IBANs...');
  
  const tablesToNormalize = [
    {
      tableName: 'Users',
      idField: 'id',
      phoneField: 'phone',
      ibanField: 'iban',
    },
    {
      tableName: 'PendingRegistrations',
      idField: 'id',
      phoneField: 'phone',
      ibanField: null,
    },
    {
      tableName: 'Halls',
      idField: 'id',
      phoneField: 'phone',
      ibanField: null,
    },
    {
      tableName: 'Suppliers',
      idField: 'id',
      phoneField: 'phone',
      ibanField: null,
    },
    {
      tableName: 'Bookings',
      idField: 'id',
      phoneField: 'customerPhone',
      ibanField: null,
    },
    {
      tableName: 'ForceMajeureRequests',
      idField: 'id',
      phoneField: 'customerPhone',
      ibanField: null,
    },
    {
      tableName: 'Employees',
      idField: 'id',
      phoneField: 'phone',
      ibanField: 'iban',
    }
  ];

  for (const table of tablesToNormalize) {
    try {
      // 1. Check if the table exists
      const isPostgres = sequelize.getDialect() === 'postgres';
      let exists = false;
      
      if (isPostgres) {
        const tableExistsCheck = await sequelize.query(
          `SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = :tableName
          );`,
          {
            replacements: { tableName: table.tableName },
            type: 'SELECT'
          }
        );
        exists = (tableExistsCheck as any)[0]?.exists || false;
      } else {
        // SQLite
        const sqliteCheck = await sequelize.query(
          `SELECT name FROM sqlite_master WHERE type='table' AND name=:tableName;`,
          {
            replacements: { tableName: table.tableName },
            type: 'SELECT'
          }
        );
        exists = sqliteCheck.length > 0;
      }

      if (!exists) {
        console.log(`ℹ️ [Migration] Table ${table.tableName} does not exist yet. Skipping.`);
        continue;
      }

      console.log(`⏳ [Migration] Normalizing data in table ${table.tableName}...`);

      // 2. Fetch all records from the table
      const records = await sequelize.query(
        `SELECT * FROM "${table.tableName}";`,
        { type: 'SELECT' }
      );

      let updatedCount = 0;

      for (const record of (records as any[])) {
        const id = record[table.idField];
        let phoneVal = table.phoneField ? record[table.phoneField] : null;
        let ibanVal = table.ibanField ? record[table.ibanField] : null;

        let needsUpdate = false;
        let nextPhone = phoneVal;
        let nextIban = ibanVal;

        // Normalizing Phone
        if (table.phoneField && phoneVal) {
          const normalized = normalizePhone(phoneVal);
          if (normalized && normalized !== phoneVal) {
            nextPhone = normalized;
            needsUpdate = true;
          }
        }

        // Normalizing IBAN
        if (table.ibanField && ibanVal) {
          const normalized = normalizeIban(ibanVal);
          if (normalized && normalized !== ibanVal) {
            nextIban = normalized;
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          try {
            if (table.phoneField && table.ibanField) {
              await sequelize.query(
                `UPDATE "${table.tableName}" SET "${table.phoneField}" = :phone, "${table.ibanField}" = :iban WHERE "${table.idField}" = :id;`,
                {
                  replacements: { phone: nextPhone, iban: nextIban, id },
                  logging: false
                }
              );
            } else if (table.phoneField) {
              await sequelize.query(
                `UPDATE "${table.tableName}" SET "${table.phoneField}" = :phone WHERE "${table.idField}" = :id;`,
                {
                  replacements: { phone: nextPhone, id },
                  logging: false
                }
              );
            } else if (table.ibanField) {
              await sequelize.query(
                `UPDATE "${table.tableName}" SET "${table.ibanField}" = :iban WHERE "${table.idField}" = :id;`,
                {
                  replacements: { iban: nextIban, id },
                  logging: false
                }
              );
            }
            updatedCount++;
          } catch (updateErr: any) {
            console.error(`❌ [Migration] Failed to update row ID ${id} in ${table.tableName}:`, updateErr.message);
          }
        }
      }

      if (updatedCount > 0) {
        console.log(`✅ [Migration] Successfully normalized ${updatedCount} records in ${table.tableName}.`);
      } else {
        console.log(`ℹ️ [Migration] Table ${table.tableName} is already fully normalized.`);
      }

    } catch (err: any) {
      console.error(`❌ [Migration] Error during table ${table.tableName} normalization:`, err.message || err);
    }
  }

  console.log('✅ [Migration] Data normalization startup run completed.');
}
