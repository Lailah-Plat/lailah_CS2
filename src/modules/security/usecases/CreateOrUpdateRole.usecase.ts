import { ISecurityRepository } from '../security.repository.js';
import { Role } from '../../../models/Database.js';

export class CreateOrUpdateRoleUseCase {
  constructor(private securityRepository: ISecurityRepository) {}

  async execute(data: any): Promise<{ role: Role; isNew: boolean }> {
    const { id, name, permissions, status } = data;
    if (id) {
      const existingRole = await this.securityRepository.findRoleById(Number(id));
      if (existingRole) {
        const updated = await this.securityRepository.updateRole(existingRole, { name, permissions, status });
        return { role: updated, isNew: false };
      }
    }
    const newRole = await this.securityRepository.createRole({ name, permissions, status });
    return { role: newRole, isNew: true };
  }
}
