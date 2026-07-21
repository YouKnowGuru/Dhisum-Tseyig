import Database from 'better-sqlite3';
import { DatabaseManager } from '../database/DatabaseManager';
import type { Employee, ApiResponse } from '../types';
import { AuditService } from './AuditService';

export class EmployeeService {
  private db: Database.Database;
  private audit: AuditService;

  constructor(dbManager: DatabaseManager) {
    this.db = dbManager.getDatabase();
    this.audit = new AuditService(dbManager);
  }

  generateEmpNo(): string {
    const last = this.db.prepare("SELECT employee_no FROM employees ORDER BY id DESC LIMIT 1").get() as any;
    let num = 1;
    if (last?.employee_no) {
      const match = last.employee_no.match(/(\d+)/);
      if (match) {
        num = parseInt(match[1], 10) + 1;
      }
    }
    return `EMP-${String(num).padStart(4, '0')}`;
  }

  create(data: any): ApiResponse {
    try {
      const empNo = this.generateEmpNo();
      this.db.prepare(`
        INSERT INTO employees (
          employee_no, name, position, department, phone, email, salary, join_date,
          pf_rate, gis_amount, tds_rate, hc_rate
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        empNo, data.name, data.position || null, data.department || null, 
        data.phone || null, data.email || null, data.salary || 0, data.joinDate || null,
        data.pf_rate || 0, data.gis_amount || 0, data.tds_rate || 0, data.hc_rate || 0
      );
      this.audit.logAction({
        action: 'EMPLOYEE_CREATE',
        entityType: 'employees',
        newValues: { employeeNo: empNo, name: data.name, salary: data.salary }
      });
      return { success: true, message: 'Employee added' };
    } catch (error: any) {
      return { success: false, message: 'Failed to add: ' + error.message };
    }
  }

  update(id: number, data: any): ApiResponse {
    try {
      this.db.prepare(`
        UPDATE employees 
        SET name = ?, position = ?, department = ?, phone = ?, email = ?, 
            salary = ?, join_date = ?, pf_rate = ?, gis_amount = ?, 
            tds_rate = ?, hc_rate = ?
        WHERE id = ?
      `).run(
        data.name, data.position || null, data.department || null, 
        data.phone || null, data.email || null, data.salary || 0, data.joinDate || null,
        data.pf_rate || 0, data.gis_amount || 0, data.tds_rate || 0, data.hc_rate || 0,
        id
      );
      this.audit.logAction({
        action: 'EMPLOYEE_UPDATE',
        entityType: 'employees',
        entityId: id,
        newValues: { name: data.name, salary: data.salary, position: data.position }
      });
      return { success: true, message: 'Employee updated' };
    } catch (error: any) {
      return { success: false, message: 'Failed to update: ' + error.message };
    }
  }

  getById(id: number): ApiResponse<Employee> {
    try {
      const employee = this.db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
      return { success: true, data: employee as Employee };
    } catch (error: any) {
      return { success: false, message: 'Failed to get employee: ' + error.message };
    }
  }

  getAll(activeOnly = true): ApiResponse<Employee[]> {
    try {
      let query = 'SELECT * FROM employees';
      if (activeOnly) query += ' WHERE is_active = 1';
      query += ' ORDER BY name ASC';
      const employees = this.db.prepare(query).all();
      return { success: true, data: employees as Employee[] };
    } catch (error: any) {
      return { success: false, message: 'Failed to get employees: ' + error.message };
    }
  }

  delete(id: number): ApiResponse {
    try {
      this.db.prepare('UPDATE employees SET is_active = 0 WHERE id = ?').run(id);
      this.audit.logAction({
        action: 'EMPLOYEE_DEACTIVATE',
        entityType: 'employees',
        entityId: id,
        newValues: { is_active: false }
      });
      return { success: true, message: 'Employee deactivated' };
    } catch (error: any) {
      return { success: false, message: 'Failed: ' + error.message };
    }
  }
}
