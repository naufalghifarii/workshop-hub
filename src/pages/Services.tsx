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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Settings, Pencil, Trash2 } from 'lucide-react';

interface Service {
  service_id: string;
  name: string;
  description: string | null;
  price: number;
  created_at: string;
}

const Services = () => {
  const { isStaffOrOwner } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
  });

  useEffect(() => {
    if (!isStaffOrOwner) {
      navigate('/dashboard');
      return;
    }
    fetchServices();
  }, [isStaffOrOwner, navigate]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Gagal memuat data layanan');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update({
            name: formData.name,
            description: formData.description || null,
            price: parseFloat(formData.price) || 0,
          })
          .eq('service_id', editingService.service_id);

        if (error) throw error;
        toast.success('Layanan berhasil diperbarui');
      } else {
        const { error } = await supabase.from('services').insert({
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price) || 0,
        });

        if (error) throw error;
        toast.success('Layanan berhasil ditambahkan');
      }

      setDialogOpen(false);
      setEditingService(null);
      setFormData({ name: '', description: '', price: '' });
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Gagal menyimpan layanan');
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Yakin ingin menghapus layanan ini?')) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('service_id', serviceId);

      if (error) throw error;
      toast.success('Layanan berhasil dihapus');
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Gagal menghapus layanan');
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
      header: 'Nama Layanan',
      render: (service: Service) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-info" />
          </div>
          <div>
            <p className="font-medium">{service.name}</p>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {service.description || '-'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Harga',
      render: (service: Service) => (
        <span className="font-semibold text-accent">
          {formatCurrency(service.price)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (service: Service) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(service);
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(service.service_id);
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
          title="Layanan"
          description="Kelola daftar layanan bengkel"
          icon={Settings}
          action={{
            label: 'Tambah Layanan',
            onClick: () => {
              setEditingService(null);
              setFormData({ name: '', description: '', price: '' });
              setDialogOpen(true);
            },
          }}
        />

        <DataTable
          columns={columns}
          data={services}
          loading={loading}
          emptyMessage="Belum ada layanan"
          keyExtractor={(item) => item.service_id}
        />

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingService ? 'Edit Layanan' : 'Tambah Layanan'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Layanan *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ganti Oli"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi layanan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Harga (Rp) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="50000"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingService ? 'Simpan' : 'Tambah'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Services;
