import { SubscriptionPlan, ProviderSubscription, ProviderFeatureOverride } from '../../models/SubscriptionModels.js';
import { User } from '../../models/UserModels.js';

export interface ISubscriptionRepository {
  findAllPlans(): Promise<SubscriptionPlan[]>;
  findPlanByName(name: string): Promise<SubscriptionPlan | null>;
  createPlan(data: any): Promise<SubscriptionPlan>;
  updatePlan(plan: SubscriptionPlan, data: any): Promise<SubscriptionPlan>;
  deletePlanById(id: number): Promise<boolean>;
  deletePlanByName(name: string): Promise<boolean>;

  findActiveSubscriptionByProviderId(providerId: number): Promise<ProviderSubscription | null>;
  findOverridesByProviderId(providerId: number): Promise<ProviderFeatureOverride[]>;
  findAllOverrides(): Promise<ProviderFeatureOverride[]>;
  findAllSubscriptions(): Promise<ProviderSubscription[]>;

  findUserById(id: number): Promise<User | null>;
  deactivateActiveSubscriptions(providerId: number): Promise<void>;
  createSubscription(data: any): Promise<ProviderSubscription>;

  deleteOverride(providerId: number, featureKey: string): Promise<boolean>;
  createOverride(data: any): Promise<ProviderFeatureOverride>;
}

export class SequelizeSubscriptionRepository implements ISubscriptionRepository {
  async findAllPlans(): Promise<SubscriptionPlan[]> {
    return SubscriptionPlan.findAll();
  }

  async findPlanByName(name: string): Promise<SubscriptionPlan | null> {
    return SubscriptionPlan.findOne({ where: { name } });
  }

  async createPlan(data: any): Promise<SubscriptionPlan> {
    return SubscriptionPlan.create({
      name: data.name,
      price: Number(data.price || 0),
      description: data.description || '',
      features: typeof data.features === 'string' ? data.features : JSON.stringify(data.features || {}),
      isHidden: Boolean(data.isHidden || false)
    });
  }

  async updatePlan(plan: SubscriptionPlan, data: any): Promise<SubscriptionPlan> {
    plan.price = data.price !== undefined ? Number(data.price) : plan.price;
    plan.description = data.description !== undefined ? data.description : plan.description;
    plan.features = data.features !== undefined ? (typeof data.features === 'string' ? data.features : JSON.stringify(data.features)) : plan.features;
    plan.isHidden = data.isHidden !== undefined ? Boolean(data.isHidden) : plan.isHidden;
    await plan.save();
    return plan;
  }

  async deletePlanById(id: number): Promise<boolean> {
    const deletedCount = await SubscriptionPlan.destroy({ where: { id } });
    return deletedCount > 0;
  }

  async deletePlanByName(name: string): Promise<boolean> {
    const deletedCount = await SubscriptionPlan.destroy({ where: { name } });
    return deletedCount > 0;
  }

  async findActiveSubscriptionByProviderId(providerId: number): Promise<ProviderSubscription | null> {
    return ProviderSubscription.findOne({
      where: { providerId, status: 'active' },
      order: [['id', 'DESC']]
    });
  }

  async findOverridesByProviderId(providerId: number): Promise<ProviderFeatureOverride[]> {
    return ProviderFeatureOverride.findAll({
      where: { providerId }
    });
  }

  async findAllOverrides(): Promise<ProviderFeatureOverride[]> {
    return ProviderFeatureOverride.findAll({
      order: [['id', 'DESC']]
    });
  }

  async findAllSubscriptions(): Promise<ProviderSubscription[]> {
    return ProviderSubscription.findAll({
      order: [['id', 'DESC']]
    });
  }

  async findUserById(idOrEmailOrName: any): Promise<User | null> {
    if (typeof idOrEmailOrName === 'number' || (!isNaN(Number(idOrEmailOrName)) && Number(idOrEmailOrName) > 0)) {
      const userById = await User.findByPk(Number(idOrEmailOrName));
      if (userById) return userById;
    }
    if (typeof idOrEmailOrName === 'string' && idOrEmailOrName.trim()) {
      const term = idOrEmailOrName.trim();
      const userByEmail = await User.findOne({ where: { email: term } });
      if (userByEmail) return userByEmail;
      const userByName = await User.findOne({ where: { name: term } });
      if (userByName) return userByName;
    }
    return null;
  }

  async deactivateActiveSubscriptions(providerId: number): Promise<void> {
    await ProviderSubscription.update(
      { status: 'expired' },
      { where: { providerId, status: 'active' } }
    );
  }

  async createSubscription(data: any): Promise<ProviderSubscription> {
    return ProviderSubscription.create(data);
  }

  async deleteOverride(providerId: number, featureKey: string): Promise<boolean> {
    const deletedCount = await ProviderFeatureOverride.destroy({
      where: { providerId, featureKey }
    });
    return deletedCount > 0;
  }

  async createOverride(data: any): Promise<ProviderFeatureOverride> {
    return ProviderFeatureOverride.create(data);
  }
}
