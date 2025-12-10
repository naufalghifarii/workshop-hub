import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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

const InvoiceCreate = () => {
  const { isStaffOrOwner, user } = useAuth();
  const navigate = useNavigate();
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
      if (wsData && wsData.length > 0) setSelectedWorkshop(wsData[0].workshop_id);

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
      setPackages(pkgData?.map(p => ({ id: p.package_id, name: p.name, price: p.price })) || []);

      const { data: svcData } = await supabase.from('services').select('service_id, name, price');
      setServices(svcData?.map(s => ({ id: s.service_id, name: s.name, price: s.price })) || []);

      const { data: spData } = await supabase.from('spareparts').select('sparepart_id, name, price');
      setSpareparts(spData?.map(s => ({ id: s.sparepart_id, name: s.name, price: s.price })) || []);

    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Gagal memuat data');
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

  const calculateTotal = () => {
    return invoiceItems.reduce((sum, item) => sum + item.subtotal, 0);
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

    setLoading(true);
    try {
      // Generate Invoice Number (Simple timestamp based for now)
      const dateStr = invoiceDate.replace(/-/g, '');
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const invoiceNumber = `INV/${dateStr}/${randomStr}`;

      // 1. Create Invoice Parent
      const { data: invoice, error: invError } = await supabase
        .from('invoice_services')
        .insert({
          workshop_id: selectedWorkshop,
          vehicle_id: selectedVehicle,
          invoice_number: invoiceNumber,
          date: invoiceDate,
          total_amount: calculateTotal(),
          notes: notes,
        })
        .select('invoice_parent_id')
        .single();

      if (invError) throw invError;

      // 2. Create Invoice Details
      const details = invoiceItems.map(item => ({
        invoice_parent_id: invoice.invoice_parent_id,
        item_type: item.type, // Note: We need to map to columns package_id, etc.
        package_id: item.type === 'package' ? item.id : null,
        service_id: item.type === 'service' ? item.id : null,
        sparepart_id: item.type === 'sparepart' ? item.id : null,
        quantity: item.quantity,
        subtotal: item.subtotal
      }));

      // Since the table has specific columns for ids, we map correctly above.
      // But we can't insert 'item_type' if it's not in schema.
      // The schema has: package_id, service_id, sparepart_id.
      // So we just insert those.
      
      const { error: detailsError } = await supabase
        .from('invoice_service_details')
        .insert(details.map(({ item_type, ...rest }) => rest));

      if (detailsError) throw detailsError;

      toast.success('Invoice berhasil dibuat');
      navigate('/invoices');

    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Gagal membuat invoice');
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
            title="Buat Invoice Baru"
            description="Input transaksi servis baru"
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
                      <td colSpan={4} className="p-3 text-right">Total</td>
                      <td className="p-3 text-right text-lg text-accent">{formatCurrency(calculateTotal())}</td>
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
                <Save className="w-4 h-4 mr-2" /> Simpan Invoice
             </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InvoiceCreate;
