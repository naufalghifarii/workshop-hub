import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Plus, Trash2, Save, ArrowLeft } from 'lucide-react';

interface Workshop {
  workshop_id: string;
  name: string;
}

interface Vehicle {
  vehicle_id: string;
  plate_number: string;
  brand: string;
  model: string;
  profiles: { name: string } | null;
}

interface Item {
  id: string;
  name: string;
  price: number;
}

interface InvoiceItem {
  key: string; // unique key for UI list
  type: 'package' | 'service' | 'sparepart';
  id: string; // database id of the item
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  package_id?: string; // if part of a package
}

const InvoiceEdit = () => {
  const { isStaffOrOwner } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  
  // Available items
  const [packages, setPackages] = useState<Item[]>([]);
  const [services, setServices] = useState<Item[]>([]);
  const [spareparts, setSpareparts] = useState<Item[]>([]);

  // Form State
  const [selectedWorkshop, setSelectedWorkshop] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [discount, setDiscount] = useState<string>('0');
  const [notes, setNotes] = useState('');
  
  // Items State
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  
  // Adding Item State
  const [addItemType, setAddItemType] = useState<'package' | 'service' | 'sparepart'>('service');
  const [addItemId, setAddItemId] = useState<string>('');
  const [addItemQty, setAddItemQty] = useState<string>('1');

  useEffect(() => {
    if (!isStaffOrOwner) {
      navigate('/dashboard');
      return;
    }
    fetchInitialData();
  }, [isStaffOrOwner, navigate]);

  const fetchInitialData = async () => {
    try {
      const { data: wsData } = await supabase.from('workshops').select('workshop_id, name');
      setWorkshops(wsData || []);

      const { data: vRaw } = await supabase.from('vehicles').select('vehicle_id, plate_number, brand, model, user_id');
      
      let vehiclesData: Vehicle[] = [];
      
      if (vRaw) {
        const userIds = [...new Set(vRaw.map(v => v.user_id).filter(Boolean))];
        let profilesMap = new Map<string, { name: string }>();
        
        if (userIds.length > 0) {
          const { data: pData } = await supabase
            .from('profiles')
            .select('user_id, name')
            .in('user_id', userIds);
            
          if (pData) {
            pData.forEach(p => {
              profilesMap.set(p.user_id, { name: p.name });
            });
          }
        }

        vehiclesData = vRaw.map(v => ({
          vehicle_id: v.vehicle_id,
          plate_number: v.plate_number,
          brand: v.brand,
          model: v.model,
          profiles: v.user_id ? profilesMap.get(v.user_id) || null : null
        }));
      }

      setVehicles(vehiclesData);

      const { data: pkgData } = await supabase.from('packages').select('package_id, name, price');
      const pkgs = pkgData?.map(p => ({ id: p.package_id, name: p.name, price: p.price })) || [];
      setPackages(pkgs);

      const { data: svcData } = await supabase.from('services').select('service_id, name, price');
      const svcs = svcData?.map(s => ({ id: s.service_id, name: s.name, price: s.price })) || [];
      setServices(svcs);

      const { data: spData } = await supabase.from('spareparts').select('sparepart_id, name, price');
      const parts = spData?.map(s => ({ id: s.sparepart_id, name: s.name, price: s.price })) || [];
      setSpareparts(parts);
      
      // Load existing invoice data after loading masters
      if (id) {
          fetchInvoiceData(id, pkgs, svcs, parts);
      }

    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Gagal memuat data');
    }
  };
  
  const fetchInvoiceData = async (invoiceId: string, availablePackages: Item[], availableServices: Item[], availableSpareparts: Item[]) => {
      try {
          const { data: invoice, error } = await supabase
            .from('invoice_services')
            .select(`
                *,
                invoice_service_details (
                    quantity, subtotal, package_id, service_id, sparepart_id
                )
            `)
            .eq('invoice_parent_id', invoiceId)
            .single();
            
          if (error) throw error;
          
          if (invoice) {
              setSelectedWorkshop(invoice.workshop_id || '');
              setSelectedVehicle(invoice.vehicle_id || '');
              setInvoiceDate(invoice.date || new Date().toISOString().split('T')[0]);
              setDiscount(invoice.discount?.toString() || '0');
              setNotes(invoice.notes || '');
              
              const loadedItems: InvoiceItem[] = [];
              
              invoice.invoice_service_details.forEach((detail: any) => {
                  let type: 'package' | 'service' | 'sparepart' = 'service';
                  let item: Item | undefined;
                  let itemId = '';
                  
                  if (detail.package_id) {
                      type = 'package';
                      itemId = detail.package_id;
                      item = availablePackages.find(p => p.id === itemId);
                  } else if (detail.service_id) {
                      type = 'service';
                      itemId = detail.service_id;
                      item = availableServices.find(s => s.id === itemId);
                  } else if (detail.sparepart_id) {
                      type = 'sparepart';
                      itemId = detail.sparepart_id;
                      item = availableSpareparts.find(sp => sp.id === itemId);
                  }
                  
                  if (item) {
                      loadedItems.push({
                          key: Math.random().toString(36).substr(2, 9),
                          type,
                          id: itemId,
                          name: item.name,
                          price: item.price, // Note: This uses current price, not historical. Ideally we might want historical.
                          quantity: detail.quantity,
                          subtotal: detail.subtotal,
                          package_id: undefined // We don't easily know if this was a sub-part of a package from this query alone without more logic, but for editing we treat them as individual items unless we group them.
                          // Limitation: Determining if a sparepart was part of a package bundle is tricky if not explicitly stored. 
                          // For now, we load them as individual items.
                      });
                  }
              });
              
              setInvoiceItems(loadedItems);
          }
      } catch (error) {
          console.error("Error fetching invoice", error);
          toast.error("Gagal memuat data invoice");
          navigate('/invoices');
      }
  };

  const handleAddItem = async () => {
    if (!addItemId) return;

    let selectedItem: Item | undefined;
    if (addItemType === 'package') selectedItem = packages.find(i => i.id === addItemId);
    else if (addItemType === 'service') selectedItem = services.find(i => i.id === addItemId);
    else selectedItem = spareparts.find(i => i.id === addItemId);

    if (!selectedItem) return;

    const qty = parseInt(addItemQty) || 1;
    const newItems: InvoiceItem[] = [];

    // Add main item
    newItems.push({
      key: Math.random().toString(36).substr(2, 9),
      type: addItemType,
      id: selectedItem.id,
      name: selectedItem.name,
      price: selectedItem.price,
      quantity: qty,
      subtotal: selectedItem.price * qty,
    });

    // If package, fetch and add included spareparts
    if (addItemType === 'package') {
      try {
        const { data: pkgParts } = await supabase
          .from('package_spareparts')
          .select('quantity, spareparts(sparepart_id, name, price)')
          .eq('package_id', addItemId);

        if (pkgParts) {
          pkgParts.forEach((part: any) => {
             if (part.spareparts) {
               const partQty = (part.quantity || 1) * qty;
               newItems.push({
                 key: Math.random().toString(36).substr(2, 9),
                 type: 'sparepart',
                 id: part.spareparts.sparepart_id,
                 name: `${part.spareparts.name} (Paket: ${selectedItem?.name})`,
                 price: part.spareparts.price,
                 quantity: partQty,
                 subtotal: part.spareparts.price * partQty,
                 package_id: selectedItem?.id, // Link to package for tracking
               });
             }
          });
        }
      } catch (error) {
        console.error("Error fetching package parts", error);
        toast.error("Gagal memuat sparepart paket");
      }
    }

    setInvoiceItems([...invoiceItems, ...newItems]);
    setAddItemId('');
    setAddItemQty('1');
  };

  const handleRemoveItem = (key: string) => {
    setInvoiceItems(invoiceItems.filter(i => i.key !== key));
  };

  const calculateSubtotal = () => {
    return invoiceItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountVal = parseFloat(discount) || 0;
    return Math.max(0, subtotal - discountVal);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = async () => {
    if (!selectedVehicle || !selectedWorkshop) {
      toast.error('Pilih kendaraan dan bengkel');
      return;
    }
    if (invoiceItems.length === 0) {
      toast.error('Tambahkan item invoice');
      return;
    }
    if (!id) return;

    setLoading(true);
    try {
      // 1. Update Invoice Parent
      const { error: invError } = await supabase
        .from('invoice_services')
        .update({
          workshop_id: selectedWorkshop,
          vehicle_id: selectedVehicle,
          date: invoiceDate,
          total_amount: calculateTotal(),
          discount: parseFloat(discount) || 0,
          notes: notes,
        })
        .eq('invoice_parent_id', id);

      if (invError) throw invError;

      // 2. Clear old Invoice Details
      const { error: deleteError } = await supabase
        .from('invoice_service_details')
        .delete()
        .eq('invoice_parent_id', id);
        
      if (deleteError) throw deleteError;

      // 3. Create new Invoice Details
      const details = invoiceItems.map(item => ({
        invoice_parent_id: id,
        item_type: item.type, // Note: We need to map to columns package_id, etc.
        package_id: item.type === 'package' ? item.id : null,
        service_id: item.type === 'service' ? item.id : null,
        sparepart_id: item.type === 'sparepart' ? item.id : null,
        quantity: item.quantity,
        subtotal: item.subtotal
      }));

      const { error: detailsError } = await supabase
        .from('invoice_service_details')
        .insert(details.map(({ item_type, ...rest }) => rest));

      if (detailsError) throw detailsError;

      toast.success('Invoice berhasil diperbarui');
      navigate('/invoices');

    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Gagal memperbarui invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-4xl mx-auto">
        <div className="mb-6">
            <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent" onClick={() => navigate('/invoices')}>
                <ArrowLeft className="w-4 h-4" /> Kembali
            </Button>
            <PageHeader
            title="Edit Invoice"
            description="Ubah data transaksi servis"
            icon={FileText}
            />
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Umum</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bengkel</Label>
                <Select value={selectedWorkshop} onValueChange={setSelectedWorkshop}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Bengkel" />
                  </SelectTrigger>
                  <SelectContent>
                    {workshops.map(w => (
                      <SelectItem key={w.workshop_id} value={w.workshop_id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Kendaraan Pelanggan</Label>
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cari Plat Nomor / Pelanggan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map(v => (
                      <SelectItem key={v.vehicle_id} value={v.vehicle_id}>
                        {v.plate_number} - {v.brand} {v.model} ({v.profiles?.name || 'Unknown'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Item Invoice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Item Form */}
              <div className="flex flex-col md:flex-row gap-3 items-end bg-muted/30 p-4 rounded-lg">
                <div className="space-y-2 w-full md:w-32">
                  <Label>Tipe</Label>
                  <Select value={addItemType} onValueChange={(v: any) => {
                      setAddItemType(v);
                      setAddItemId('');
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">Jasa</SelectItem>
                      <SelectItem value="sparepart">Sparepart</SelectItem>
                      <SelectItem value="package">Paket</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex-1">
                  <Label>Item</Label>
                  <Select value={addItemId} onValueChange={setAddItemId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Item..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(addItemType === 'package' ? packages : addItemType === 'service' ? services : spareparts).map(i => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.name} - {formatCurrency(i.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 w-24">
                  <Label>Jumlah</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={addItemQty} 
                    onChange={e => setAddItemQty(e.target.value)} 
                  />
                </div>
                <Button onClick={handleAddItem} disabled={!addItemId}>
                  <Plus className="w-4 h-4 mr-2" /> Tambah
                </Button>
              </div>

              {/* Items Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left">Item</th>
                      <th className="p-3 text-left">Tipe</th>
                      <th className="p-3 text-right">Harga</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Subtotal</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.length === 0 ? (
                      <tr>
                         <td colSpan={6} className="p-8 text-center text-muted-foreground">Belum ada item</td>
                      </tr>
                    ) : (
                      invoiceItems.map((item) => (
                        <tr key={item.key} className="border-t">
                          <td className="p-3">
                              <span className="font-medium">{item.name}</span>
                          </td>
                          <td className="p-3 capitalize text-muted-foreground">{item.type}</td>
                          <td className="p-3 text-right">{formatCurrency(item.price)}</td>
                          <td className="p-3 text-center">{item.quantity}</td>
                          <td className="p-3 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                          <td className="p-3">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveItem(item.key)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-muted/50 font-medium">
                    <tr>
                      <td colSpan={4} className="p-3 text-right">Subtotal</td>
                      <td className="p-3 text-right">{formatCurrency(calculateSubtotal())}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="p-3 text-right">Diskon</td>
                      <td className="p-3 text-right">
                         <Input 
                            type="number" 
                            min="0"
                            className="h-8 w-32 ml-auto text-right"
                            value={discount}
                            onChange={(e) => setDiscount(e.target.value)}
                         />
                      </td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="p-3 text-right font-bold">Total</td>
                      <td className="p-3 text-right text-lg text-accent font-bold">{formatCurrency(calculateTotal())}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="space-y-2">
                <Label>Catatan</Label>
                <Textarea 
                    placeholder="Catatan tambahan untuk invoice ini..." 
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
             <Button variant="outline" onClick={() => navigate('/invoices')}>Batal</Button>
             <Button size="lg" onClick={handleSubmit} disabled={loading}>
                <Save className="w-4 h-4 mr-2" /> Simpan Perubahan
             </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InvoiceEdit;
