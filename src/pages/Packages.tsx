import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Package, Pencil, Trash2, Clock, Plus, X } from 'lucide-react';

interface PackageItem {
  package_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number | null;
  created_at: string;
  package_spareparts?: {
    quantity: number | null;
    spareparts: {
      price: number;
    } | null;
  }[];
}

interface Sparepart {
  sparepart_id: string;
  name: string;
  price: number;
}

interface SelectedSparepart {
  sparepart_id: string;
  name: string;
  quantity: number;
  price: number;
}

const Packages = () => {
  const { isStaffOrOwner } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_minutes: '',
  });

  // Spare parts management state
  const [availableSpareparts, setAvailableSpareparts] = useState<Sparepart[]>([]);
  const [selectedSpareparts, setSelectedSpareparts] = useState<SelectedSparepart[]>([]);
  const [currentSparepartId, setCurrentSparepartId] = useState<string>('');
  const [currentSparepartQty, setCurrentSparepartQty] = useState<string>('1');

  useEffect(() => {
    if (!isStaffOrOwner) {
      navigate('/dashboard');
      return;
    }
    fetchPackages();
    fetchSpareparts();
  }, [isStaffOrOwner, navigate]);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select(`
          *,
          package_spareparts (
            quantity,
            spareparts (
              price
            )
          )
        `)
        .order('name');

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Gagal memuat data paket');
    } finally {
      setLoading(false);
    }
  };

  const fetchSpareparts = async () => {
    try {
      const { data, error } = await supabase
        .from('spareparts')
        .select('sparepart_id, name, price')
        .order('name');

      if (error) throw error;
      setAvailableSpareparts(data || []);
    } catch (error) {
      console.error('Error fetching spareparts:', error);
    }
  };

  const fetchPackageSpareparts = async (packageId: string) => {
    try {
      const { data, error } = await supabase
        .from('package_spareparts')
        .select('sparepart_id, quantity, spareparts(name, price)')
        .eq('package_id', packageId);

      if (error) throw error;

      const formattedSpareparts: SelectedSparepart[] = (data || []).map((item: any) => ({
        sparepart_id: item.sparepart_id,
        name: item.spareparts?.name || 'Unknown',
        quantity: item.quantity,
        price: item.spareparts?.price || 0,
      }));

      setSelectedSpareparts(formattedSpareparts);
    } catch (error) {
      console.error('Error fetching package spareparts:', error);
      toast.error('Gagal memuat sparepart paket');
    }
  };

  const handleAddSparepart = () => {
    if (!currentSparepartId) return;

    const sparepart = availableSpareparts.find(s => s.sparepart_id === currentSparepartId);
    if (!sparepart) return;

    const quantity = parseInt(currentSparepartQty) || 1;
    
    // Check if already added
    const existingIndex = selectedSpareparts.findIndex(s => s.sparepart_id === currentSparepartId);
    
    if (existingIndex >= 0) {
      // Update quantity
      const updated = [...selectedSpareparts];
      updated[existingIndex].quantity += quantity;
      setSelectedSpareparts(updated);
    } else {
      // Add new
      setSelectedSpareparts([
        ...selectedSpareparts,
        {
          sparepart_id: sparepart.sparepart_id,
          name: sparepart.name,
          quantity: quantity,
          price: sparepart.price,
        }
      ]);
    }

    setCurrentSparepartId('');
    setCurrentSparepartQty('1');
  };

  const handleRemoveSparepart = (id: string) => {
    setSelectedSpareparts(selectedSpareparts.filter(s => s.sparepart_id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let packageId = editingPackage?.package_id;

    try {
      if (editingPackage) {
        // Update package details
        const { error } = await supabase
          .from('packages')
          .update({
            name: formData.name,
            description: formData.description || null,
            price: parseFloat(formData.price) || 0,
            duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
          })
          .eq('package_id', editingPackage.package_id);

        if (error) throw error;
        toast.success('Paket berhasil diperbarui');
      } else {
        // Insert new package
        const { data, error } = await supabase.from('packages').insert({
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price) || 0,
          duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        }).select('package_id').single();

        if (error) throw error;
        packageId = data.package_id;
        toast.success('Paket berhasil ditambahkan');
      }

      // Handle spare parts
      if (packageId) {
        // First delete existing
        const { error: deleteError } = await supabase
          .from('package_spareparts')
          .delete()
          .eq('package_id', packageId);
        
        if (deleteError) throw deleteError;

        // Then insert new ones
        if (selectedSpareparts.length > 0) {
          const { error: insertError } = await supabase
            .from('package_spareparts')
            .insert(
              selectedSpareparts.map(s => ({
                package_id: packageId,
                sparepart_id: s.sparepart_id,
                quantity: s.quantity
              }))
            );
          
          if (insertError) throw insertError;
        }
      }

      setDialogOpen(false);
      setEditingPackage(null);
      setFormData({ name: '', description: '', price: '', duration_minutes: '' });
      setSelectedSpareparts([]);
      fetchPackages();
    } catch (error) {
      console.error('Error saving package:', error);
      toast.error('Gagal menyimpan paket');
    }
  };

  const handleEdit = (pkg: PackageItem) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price.toString(),
      duration_minutes: pkg.duration_minutes?.toString() || '',
    });
    fetchPackageSpareparts(pkg.package_id);
    setDialogOpen(true);
  };

  const handleDelete = async (packageId: string) => {
    if (!confirm('Yakin ingin menghapus paket ini?')) return;

    try {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('package_id', packageId);

      if (error) throw error;
      toast.success('Paket berhasil dihapus');
      fetchPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error('Gagal menghapus paket');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateSparepartTotal = (packageSpareparts: PackageItem['package_spareparts']) => {
    if (!packageSpareparts) return 0;
    return packageSpareparts.reduce((sum, item) => {
      const price = item.spareparts?.price || 0;
      const quantity = item.quantity || 0;
      return sum + (price * quantity);
    }, 0);
  };

  const columns = [
    {
      key: 'name',
      header: 'Nama Paket',
      render: (pkg: PackageItem) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="font-medium">{pkg.name}</p>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {pkg.description || '-'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'duration',
      header: 'Durasi',
      render: (pkg: PackageItem) => (
        <Badge variant="secondary" className="gap-1">
          <Clock className="w-3 h-3" />
          {pkg.duration_minutes ? `${pkg.duration_minutes} menit` : '-'}
        </Badge>
      ),
    },
    {
      key: 'service_price',
      header: 'Harga Jasa',
      render: (pkg: PackageItem) => (
        <span className="text-muted-foreground">
          {formatCurrency(pkg.price)}
        </span>
      ),
    },
    {
      key: 'sparepart_price',
      header: 'Total Sparepart',
      render: (pkg: PackageItem) => {
        const total = calculateSparepartTotal(pkg.package_spareparts);
        return (
          <span className="text-muted-foreground">
            {formatCurrency(total)}
          </span>
        );
      },
    },
    {
      key: 'total_price',
      header: 'Total Estimasi',
      render: (pkg: PackageItem) => {
        const sparepartTotal = calculateSparepartTotal(pkg.package_spareparts);
        return (
          <span className="font-semibold text-accent">
            {formatCurrency(pkg.price + sparepartTotal)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (pkg: PackageItem) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(pkg);
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(pkg.package_id);
            }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <PageHeader
          title="Paket Layanan"
          description="Kelola paket layanan bengkel"
          icon={Package}
          action={{
            label: 'Tambah Paket',
            onClick: () => {
              setEditingPackage(null);
              setFormData({ name: '', description: '', price: '', duration_minutes: '' });
              setSelectedSpareparts([]);
              setDialogOpen(true);
            },
          }}
        />

        <DataTable
          columns={columns}
          data={packages}
          loading={loading}
          emptyMessage="Belum ada paket"
          keyExtractor={(item) => item.package_id}
        />

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingPackage ? 'Edit Paket' : 'Tambah Paket'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">Informasi Dasar</h3>
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Paket *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Paket Service Ringan"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi paket"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Harga Jasa (Rp) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="150000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration_minutes">Durasi (menit)</Label>
                    <Input
                      id="duration_minutes"
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                      placeholder="60"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Sparepart Termasuk</h3>
                  <Badge variant="outline">{selectedSpareparts.length} item</Badge>
                </div>
                
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-2">
                    <Label>Pilih Sparepart</Label>
                    <Select value={currentSparepartId} onValueChange={setCurrentSparepartId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih sparepart..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSpareparts.map((item) => (
                          <SelectItem key={item.sparepart_id} value={item.sparepart_id}>
                            {item.name} - {formatCurrency(item.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-2">
                    <Label>Jumlah</Label>
                    <Input
                      type="number"
                      value={currentSparepartQty}
                      onChange={(e) => setCurrentSparepartQty(e.target.value)}
                      min="1"
                    />
                  </div>
                  <Button type="button" onClick={handleAddSparepart} disabled={!currentSparepartId}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {selectedSpareparts.length > 0 && (
                  <div className="space-y-2 bg-muted/30 p-3 rounded-lg">
                    {selectedSpareparts.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-background p-2 rounded border">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm">{item.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            x{item.quantity}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => handleRemoveSparepart(item.sparepart_id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t mt-2">
                      <span className="text-sm font-semibold">Total Sparepart</span>
                      <span className="text-sm font-semibold">
                        {formatCurrency(selectedSpareparts.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingPackage ? 'Simpan' : 'Tambah'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Packages;
