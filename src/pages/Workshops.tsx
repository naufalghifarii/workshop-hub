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
import { Building2, Pencil, Trash2, Phone, MapPin, Clock } from 'lucide-react';

interface Workshop {
  workshop_id: string;
  user_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  open_hours: string | null;
  created_at: string;
}

const Workshops = () => {
  const { user, isStaffOrOwner } = useAuth();
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    open_hours: '',
  });

  useEffect(() => {
    if (!isStaffOrOwner) {
      navigate('/dashboard');
      return;
    }
    fetchWorkshops();
  }, [isStaffOrOwner, navigate]);

  const fetchWorkshops = async () => {
    try {
      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkshops(data || []);
    } catch (error) {
      console.error('Error fetching workshops:', error);
      toast.error('Gagal memuat data workshop');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingWorkshop) {
        const { error } = await supabase
          .from('workshops')
          .update({
            name: formData.name,
            address: formData.address || null,
            phone: formData.phone || null,
            open_hours: formData.open_hours || null,
          })
          .eq('workshop_id', editingWorkshop.workshop_id);

        if (error) throw error;
        toast.success('Workshop berhasil diperbarui');
      } else {
        const { error } = await supabase.from('workshops').insert({
          user_id: user.id,
          name: formData.name,
          address: formData.address || null,
          phone: formData.phone || null,
          open_hours: formData.open_hours || null,
        });

        if (error) throw error;
        toast.success('Workshop berhasil ditambahkan');
      }

      setDialogOpen(false);
      setEditingWorkshop(null);
      setFormData({ name: '', address: '', phone: '', open_hours: '' });
      fetchWorkshops();
    } catch (error) {
      console.error('Error saving workshop:', error);
      toast.error('Gagal menyimpan workshop');
    }
  };

  const handleEdit = (workshop: Workshop) => {
    setEditingWorkshop(workshop);
    setFormData({
      name: workshop.name,
      address: workshop.address || '',
      phone: workshop.phone || '',
      open_hours: workshop.open_hours || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (workshopId: string) => {
    if (!confirm('Yakin ingin menghapus workshop ini?')) return;

    try {
      const { error } = await supabase
        .from('workshops')
        .delete()
        .eq('workshop_id', workshopId);

      if (error) throw error;
      toast.success('Workshop berhasil dihapus');
      fetchWorkshops();
    } catch (error) {
      console.error('Error deleting workshop:', error);
      toast.error('Gagal menghapus workshop');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Nama Workshop',
      render: (workshop: Workshop) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <span className="font-medium">{workshop.name}</span>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Alamat',
      render: (workshop: Workshop) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{workshop.address || '-'}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Telepon',
      render: (workshop: Workshop) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="w-4 h-4" />
          <span>{workshop.phone || '-'}</span>
        </div>
      ),
    },
    {
      key: 'open_hours',
      header: 'Jam Operasional',
      render: (workshop: Workshop) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{workshop.open_hours || '-'}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (workshop: Workshop) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(workshop);
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(workshop.workshop_id);
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
          title="Workshop"
          description="Kelola data workshop Anda"
          icon={Building2}
          action={{
            label: 'Tambah Workshop',
            onClick: () => {
              setEditingWorkshop(null);
              setFormData({ name: '', address: '', phone: '', open_hours: '' });
              setDialogOpen(true);
            },
          }}
        />

        <DataTable
          columns={columns}
          data={workshops}
          loading={loading}
          emptyMessage="Belum ada workshop"
          keyExtractor={(item) => item.workshop_id}
        />

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingWorkshop ? 'Edit Workshop' : 'Tambah Workshop'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Workshop *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nama workshop"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Alamat</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Alamat lengkap"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telepon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="08123456789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="open_hours">Jam Operasional</Label>
                <Input
                  id="open_hours"
                  value={formData.open_hours}
                  onChange={(e) => setFormData({ ...formData, open_hours: e.target.value })}
                  placeholder="Senin-Sabtu 08:00-17:00"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingWorkshop ? 'Simpan' : 'Tambah'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Workshops;
