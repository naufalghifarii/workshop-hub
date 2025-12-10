import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Cog, Pencil, Trash2, Box } from 'lucide-react';

interface Sparepart {
  sparepart_id: string;
  name: string;
  brand: string | null;
  price: number;
  stock: number | null;
  created_at: string;
}

const Spareparts = () => {
  const { isStaffOrOwner } = useAuth();
  const navigate = useNavigate();
  const [spareparts, setSpareparts] = useState<Sparepart[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSparepart, setEditingSparepart] = useState<Sparepart | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    price: '',
    stock: '',
  });

  useEffect(() => {
    if (!isStaffOrOwner) {
      navigate('/dashboard');
      return;
    }
    fetchSpareparts();
  }, [isStaffOrOwner, navigate]);

  const fetchSpareparts = async () => {
    try {
      const { data, error } = await supabase
        .from('spareparts')
        .select('*')
        .order('name');

      if (error) throw error;
      setSpareparts(data || []);
    } catch (error) {
      console.error('Error fetching spareparts:', error);
      toast.error('Gagal memuat data sparepart');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSparepart) {
        const { error } = await supabase
          .from('spareparts')
          .update({
            name: formData.name,
            brand: formData.brand || null,
            price: parseFloat(formData.price) || 0,
            stock: formData.stock ? parseInt(formData.stock) : 0,
          })
          .eq('sparepart_id', editingSparepart.sparepart_id);

        if (error) throw error;
        toast.success('Sparepart berhasil diperbarui');
      } else {
        const { error } = await supabase.from('spareparts').insert({
          name: formData.name,
          brand: formData.brand || null,
          price: parseFloat(formData.price) || 0,
          stock: formData.stock ? parseInt(formData.stock) : 0,
        });

        if (error) throw error;
        toast.success('Sparepart berhasil ditambahkan');
      }

      setDialogOpen(false);
      setEditingSparepart(null);
      setFormData({ name: '', brand: '', price: '', stock: '' });
      fetchSpareparts();
    } catch (error) {
      console.error('Error saving sparepart:', error);
      toast.error('Gagal menyimpan sparepart');
    }
  };

  const handleEdit = (sparepart: Sparepart) => {
    setEditingSparepart(sparepart);
    setFormData({
      name: sparepart.name,
      brand: sparepart.brand || '',
      price: sparepart.price.toString(),
      stock: sparepart.stock?.toString() || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (sparepartId: string) => {
    if (!confirm('Yakin ingin menghapus sparepart ini?')) return;

    try {
      const { error } = await supabase
        .from('spareparts')
        .delete()
        .eq('sparepart_id', sparepartId);

      if (error) throw error;
      toast.success('Sparepart berhasil dihapus');
      fetchSpareparts();
    } catch (error) {
      console.error('Error deleting sparepart:', error);
      toast.error('Gagal menghapus sparepart');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStockBadgeVariant = (stock: number | null) => {
    if (!stock || stock === 0) return 'destructive';
    if (stock < 10) return 'secondary';
    return 'default';
  };

  const columns = [
    {
      key: 'name',
      header: 'Nama Sparepart',
      render: (sparepart: Sparepart) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <Cog className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="font-medium">{sparepart.name}</p>
            <p className="text-sm text-muted-foreground">
              {sparepart.brand || '-'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stok',
      render: (sparepart: Sparepart) => (
        <Badge variant={getStockBadgeVariant(sparepart.stock)} className="gap-1">
          <Box className="w-3 h-3" />
          {sparepart.stock ?? 0} unit
        </Badge>
      ),
    },
    {
      key: 'price',
      header: 'Harga',
      render: (sparepart: Sparepart) => (
        <span className="font-semibold text-accent">
          {formatCurrency(sparepart.price)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (sparepart: Sparepart) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(sparepart);
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(sparepart.sparepart_id);
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
          title="Sparepart"
          description="Kelola inventori sparepart"
          icon={Cog}
          action={{
            label: 'Tambah Sparepart',
            onClick: () => {
              setEditingSparepart(null);
              setFormData({ name: '', brand: '', price: '', stock: '' });
              setDialogOpen(true);
            },
          }}
        />

        <DataTable
          columns={columns}
          data={spareparts}
          loading={loading}
          emptyMessage="Belum ada sparepart"
          keyExtractor={(item) => item.sparepart_id}
        />

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingSparepart ? 'Edit Sparepart' : 'Tambah Sparepart'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Sparepart *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Oli Mesin"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Merek</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Castrol"
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
                    placeholder="85000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stok</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="50"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingSparepart ? 'Simpan' : 'Tambah'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Spareparts;
