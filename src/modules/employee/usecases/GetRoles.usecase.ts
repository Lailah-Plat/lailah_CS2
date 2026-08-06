import { IEmployeeRepository } from '../employee.repository.js';

export class GetRolesUseCase {
  constructor(private employeeRepository: IEmployeeRepository) {}

  async execute() {
    return this.employeeRepository.findAllRoles();
  }
}
