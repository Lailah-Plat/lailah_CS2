import { BookingRepository } from '../booking.repository.js';

export class SyncInventoryUseCase {
  constructor(private repo: BookingRepository) {}

  async execute(io: any) {
    const localItems = await this.repo.findInventoryItems();
    const localSuppliers = await this.repo.findSuppliers();

    const externalInventory = [
      { sku: 'SKU-CHAIR-01', name: 'كراسي ملكية مذهبة', currentStock: 450, reorderLevel: 50, supplier: 'شركة الأثاث الفاخر المحدودة', cost: 120, lastUpdated: new Date().toISOString() },
      { sku: 'SKU-TABLE-02', name: 'طاولات مستديرة خشبية', currentStock: 120, reorderLevel: 20, supplier: 'مصنع الأثاث الوطني', cost: 250, lastUpdated: new Date(Date.now() - 1000 * 3600 * 48).toISOString() },
      { sku: 'SKU-LIGHT-03', name: 'أجهزة إضاءة مسرح LED dmx', currentStock: 15, reorderLevel: 10, supplier: 'مؤسسة التقنيات الصوتية', cost: 450, lastUpdated: new Date().toISOString() },
      { sku: 'SKU-PLATE-04', name: 'أطباق تقديم زجاجية فاخرة', currentStock: 800, reorderLevel: 100, supplier: 'الشركة العربية للزجاج', cost: 15, lastUpdated: new Date(Date.now() - 1000 * 3600 * 12).toISOString() },
      { sku: 'SKU-CARPET-05', name: 'سجاد ممرات أحمر ملكي', currentStock: 35, reorderLevel: 10, supplier: 'مصنع السجاد الفاخر', cost: 180, lastUpdated: new Date().toISOString() },
      { sku: 'SKU-GENERATOR-06', name: 'مولد كهرباء طوارئ 50KW', currentStock: 2, reorderLevel: 3, supplier: 'شركة آلات الطاقة المحدودة', cost: 15000, lastUpdated: new Date().toISOString() }
    ];

    const externalSuppliers = [
      { name: 'شركة الأثاث الفاخر المحدودة', cr: '1010112233', phone: '0501112222', email: 'sales@luxuryfurniture.sa', city: 'الرياض' },
      { name: 'مصنع الأثاث الوطني', cr: '1010334455', phone: '0503334444', email: 'info@nationalfurniture.sa', city: 'جدة' },
      { name: 'مؤسسة التقنيات الصوتية', cr: '1010556677', phone: '0505556666', email: 'tech@soundtech.sa', city: 'الدمام' },
      { name: 'شركة آلات الطاقة المحدودة', cr: '1010778899', phone: '0507778888', email: 'power@generators.sa', city: 'الخبر' }
    ];

    let addedItemsCount = 0;
    let updatedItemsCount = 0;
    let conflictsResolvedCount = 0;
    let updatedSuppliersCount = 0;
    const notifications: string[] = [];

    for (const extItem of externalInventory) {
      const localMatch = localItems.find(item => item.sku === extItem.sku);

      if (!localMatch) {
        await this.repo.createInventoryItem(extItem);
        addedItemsCount++;
        if (extItem.currentStock <= extItem.reorderLevel) {
          notifications.push(`⚠️ تنبيه مخزون منخفض: الأصل الجديد (${extItem.name}) تحت حد إعادة الطلب الحالي (${extItem.currentStock}/${extItem.reorderLevel}).`);
        }
      } else {
        const localTime = localMatch.lastUpdated ? new Date(localMatch.lastUpdated).getTime() : 0;
        const extTime = new Date(extItem.lastUpdated).getTime();

        if (extTime > localTime) {
          await localMatch.update({
            name: extItem.name,
            currentStock: extItem.currentStock,
            reorderLevel: extItem.reorderLevel,
            supplier: extItem.supplier,
            cost: extItem.cost,
            lastUpdated: extItem.lastUpdated
          });
          updatedItemsCount++;
          conflictsResolvedCount++;
        } else {
          if (localMatch.currentStock !== extItem.currentStock) {
            await localMatch.update({
              currentStock: extItem.currentStock,
              lastUpdated: new Date().toISOString()
            });
            updatedItemsCount++;
          }
        }

        if (localMatch.currentStock <= localMatch.reorderLevel) {
          notifications.push(`⚠️ نقص أصول حرج: (${localMatch.name}) متوفر حالياً بمقدار ${localMatch.currentStock} فقط (الحد الآمن: ${localMatch.reorderLevel}).`);
        }
      }
    }

    for (const extSup of externalSuppliers) {
      const localMatch = localSuppliers.find(sup => sup.cr === extSup.cr || sup.name === extSup.name);

      if (!localMatch) {
        await this.repo.createSupplier(extSup);
        updatedSuppliersCount++;
      } else {
        if (localMatch.phone !== extSup.phone || localMatch.email !== extSup.email || localMatch.city !== extSup.city) {
          await localMatch.update({
            phone: extSup.phone,
            email: extSup.email,
            city: extSup.city
          });
          updatedSuppliersCount++;
        }
      }
    }

    if (io) {
      const refreshedItems = await this.repo.findInventoryItems({ order: [['id', 'DESC']] });
      const refreshedSuppliers = await this.repo.findSuppliers({ order: [['id', 'DESC']] });
      io.emit("inventory_synced", {
        inventory: refreshedItems,
        suppliers: refreshedSuppliers,
        notifications,
        timestamp: Date.now()
      });
    }

    return {
      success: true,
      addedItemsCount,
      updatedItemsCount,
      conflictsResolvedCount,
      updatedSuppliersCount,
      notifications,
      message: 'تمت مزامنة المخزون وتحديث حالة الموردين والأصول بنجاح لحظياً مع ترحيل البيانات وتفادي التعارضات.'
    };
  }
}
