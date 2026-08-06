import { ISecurityRepository } from '../security.repository.js';
import { Role } from '../../../models/Database.js';

export class GetRolesUseCase {
  constructor(private securityRepository: ISecurityRepository) {}

  async execute(): Promise<Role[]> {
    return this.securityRepository.getRoles();
  }
}
