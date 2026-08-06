import { IEmployeeRepository } from '../employee.repository.js';

export class GetAuditLogsUseCase {
  constructor(private employeeRepository: IEmployeeRepository) {}

  async execute() {
    return this.employeeRepository.findAuditLogs({});
  }
}
