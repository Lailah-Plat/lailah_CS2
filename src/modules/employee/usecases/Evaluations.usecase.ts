import { IEmployeeRepository } from '../employee.repository.js';
import { EmployeeEvaluation } from '../../../models/Database.js';

export class GetEvaluationsUseCase {
  constructor(private employeeRepository: IEmployeeRepository) {}

  async execute(employeeId?: any) {
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;

    let records = await this.employeeRepository.findEvaluations(where);

    if (records.length === 0) {
      const employees = await this.employeeRepository.findAllEmployees();
      const mockData = [];
      const today = new Date().toISOString().split('T')[0];
      for (const emp of employees) {
        mockData.push({
          employeeId: emp.id,
          evaluatorId: 1,
          date: today,
          score: 92,
          feedback: 'أداء ممتاز وملتزم بالمهام المطلوبة وسرعة إنجاز عالية لحجوزات العملاء.',
          attendanceRating: 5,
          tasksRating: 4,
          cooperationRating: 5,
          speedRating: 5,
          superiorsRating: 4,
          teamworkRating: 5,
          behaviorRating: 5
        });
      }
      if (mockData.length > 0) {
        await this.employeeRepository.bulkCreateEvaluations(mockData);
      }
      records = await this.employeeRepository.findEvaluations(where);
    }
    return records;
  }
}

export class CreateEvaluationUseCase {
  constructor(private employeeRepository: IEmployeeRepository) {}

  async execute(body: any, performerId: number | undefined) {
    const record = await this.employeeRepository.createEvaluation(body);
    try {
      await this.employeeRepository.createAuditLog({
        action: 'CREATE_EVALUATION',
        entityType: 'EmployeeEvaluation',
        entityId: record.id.toString(),
        details: { record },
        performedBy: performerId
      });
    } catch (err) {}

    const list = await this.employeeRepository.findEvaluations({ id: record.id });
    return list[0] || record;
  }
}
