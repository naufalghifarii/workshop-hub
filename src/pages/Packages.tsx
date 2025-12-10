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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Package, Pencil, Trash2, Clock } from 'lucide-react';

interface PackageItem {
  package_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number | null;
  created_at: string;
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

  useEffect(() => {
    if (!isStaffOrOwner) {
      navigate('/dashboard');
      return;
    }
    fetchPackages();
  }, [isStaffOrOwner, navigate]);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPackage) {
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
        const { error } = await supabase.from('packages').insert({
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price) || 0,
          duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        });

        if (error) throw error;
        toast.success('Paket berhasil ditambahkan');
      }

      setDialogOpen(false);
      setEditingPackage(null);
      setFormData({ name: '', description: '', price: '', duration_minutes: '' });
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
      key: 'price',
      header: 'Harga',
      render: (pkg: PackageItem) => (
        <span className="font-semibold text-accent">
          {formatCurrency(pkg.price)}
        </span>
      ),
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingPackage ? 'Edit Paket' : 'Tambah Paket'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label htmlFor="price">Harga (Rp) *</Label>
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
              <div className="flex justify-end gap-3 pt-4">
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
