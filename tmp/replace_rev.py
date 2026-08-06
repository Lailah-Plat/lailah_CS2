import os

with open('src/components/FinanceDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """  const handleAddRevenue = async (e: React.FormEvent) => {
     e.preventDefault();
     const total = parseFloat(newRevenue.total);
     if (isNaN(total)) return;
     try {
       const res = await fetch('/api/finance/revenue', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           title: newRevenue.title,
           type: newRevenue.type,
           amountIncludingVat: total,
           providerId: userRole === 'provider' ? Number(currentProviderId) : null
         })
       });
       if (res.ok) {
         await fetchStats();
       } else {
         const base = total / 1.15;
         const vat = total - base;
         setRevenues([{
            id: `RV-${Math.floor(Math.random()*10000)}`,
            date: new Date().toISOString().split('T')[0],
            title: newRevenue.title,
            type: newRevenue.type,
            amount: base,
            vat: vat,
            total: total,
            provider: userRole === 'provider' ? currentProvider : 'admin',
            providerId: userRole === 'provider' ? Number(currentProviderId) : null
          }, ...revenues]);
        }
      } catch (err) {
        console.error("Failed adding revenue online:", err);
      }
      setIsAddRevenueModalOpen(false);
      setNewRevenue({ title: '', type: 'أخرى', total: '' });
   };"""

replacement = """  const handleAddRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(newRevenue.total);
    if (isNaN(total)) return;
    try {
      const token = localStorage.getItem('token') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }

      const res = await fetch('/api/finance/revenue', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: newRevenue.title,
          type: newRevenue.type,
          amountIncludingVat: total,
          providerId: null,
          collectionMethod: newRevenue.collectionMethod,
          referenceNumber: newRevenue.referenceNumber,
          payerName: newRevenue.payerName,
          description: newRevenue.description,
          notes: newRevenue.notes,
          attachmentUrl: newRevenue.attachmentUrl,
          isExternal: newRevenue.isExternal
        })
      });
      if (res.ok) {
        await fetchStats();
      } else {
        const errData = await res.json().catch(() => ({}));
        if (errData.error) {
          alert(errData.error);
        } else {
          alert('فشل في إضافة الإيراد');
        }
      }
    } catch (err) {
      console.error("Failed adding revenue online:", err);
    }
    setIsAddRevenueModalOpen(false);
    setNewRevenue({
      title: '',
      type: 'إيرادات خارجية عامة',
      total: '',
      referenceNumber: '',
      payerName: '',
      collectionMethod: 'bank',
      description: '',
      notes: '',
      attachmentUrl: '',
      isExternal: true
    });
  };"""

if target in content:
    with open('src/components/FinanceDashboard.tsx', 'w', encoding='utf-8') as f:
        f.write(content.replace(target, replacement))
    print("SUCCESS")
else:
    # Let's try matching with normalized carriage returns
    normalized_content = content.replace('\r\n', '\n')
    normalized_target = target.replace('\r\n', '\n')
    if normalized_target in normalized_content:
        with open('src/components/FinanceDashboard.tsx', 'w', encoding='utf-8') as f:
            f.write(normalized_content.replace(normalized_target, replacement))
        print("SUCCESS NORMALIZED")
    else:
        print("NOT FOUND EVEN NORMALIZED")
