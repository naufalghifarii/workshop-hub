import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Car, Pencil, Trash2, Calendar, Gauge } from 'lucide-react';

interface Vehicle {
  vehicle_id: string;
  user_id: string;
  plate_number: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  mileage: number | null;
  created_at: string;
  profiles?: {
    name: string;
    email: string;
  };
}

interface Profile {
  user_id: string;
  name: string;
  email: string;
}

const Vehicles = () => {
  const { user, isStaffOrOwner } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    user_id: '',
    plate_number: '',
    brand: '',
    model: '',
    year: '',
    mileage: '',
  });

  useEffect(() => {
    fetchVehicles();
    if (isStaffOrOwner) {
      fetchProfiles();
    }
  }, [isStaffOrOwner]);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately for staff
      if (isStaffOrOwner && data) {
        const userIds = [...new Set(data.map(v => v.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, name, email')
          .in('user_id', userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
        const vehiclesWithProfiles = data.map(v => ({
          ...v,
          profiles: profilesMap.get(v.user_id) || null
        }));
        setVehicles(vehiclesWithProfiles as Vehicle[]);
      } else {
        setVehicles((data || []) as Vehicle[]);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Gagal memuat data kendaraan');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .order('name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const vehicleData = {
      user_id: isStaffOrOwner && formData.user_id ? formData.user_id : user.id,
      plate_number: formData.plate_number,
      brand: formData.brand || null,
      model: formData.model || null,
      year: formData.year ? parseInt(formData.year) : null,
      mileage: formData.mileage ? parseInt(formData.mileage) : null,
    };

    try {
      if (editingVehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('vehicle_id', editingVehicle.vehicle_id);

        if (error) throw error;
        toast.success('Kendaraan berhasil diperbarui');
      } else {
        const { error } = await supabase.from('vehicles').insert(vehicleData);

        if (error) throw error;
        toast.success('Kendaraan berhasil ditambahkan');
      }

      setDialogOpen(false);
      setEditingVehicle(null);
      setFormData({
        user_id: '',
        plate_number: '',
        brand: '',
        model: '',
        year: '',
        mileage: '',
      });
      fetchVehicles();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast.error('Gagal menyimpan kendaraan');
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      user_id: vehicle.user_id,
      plate_number: vehicle.plate_number,
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      year: vehicle.year?.toString() || '',
      mileage: vehicle.mileage?.toString() || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (vehicleId: string) => {
    if (!confirm('Yakin ingin menghapus kendaraan ini?')) return;

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('vehicle_id', vehicleId);

      if (error) throw error;
      toast.success('Kendaraan berhasil dihapus');
      fetchVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('Gagal menghapus kendaraan');
    }
  };

  const columns = [
    {
      key: 'plate_number',
      header: 'Plat Nomor',
      render: (vehicle: Vehicle) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Car className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="font-semibold">{vehicle.plate_number}</p>
            <p className="text-sm text-muted-foreground">
              {vehicle.brand} {vehicle.model}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'year',
      header: 'Tahun',
      render: (vehicle: Vehicle) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{vehicle.year || '-'}</span>
        </div>
      ),
    },
    {
      key: 'mileage',
      header: 'Kilometer',
      render: (vehicle: Vehicle) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Gauge className="w-4 h-4" />
          <span>{vehicle.mileage?.toLocaleString() || '-'} km</span>
        </div>
      ),
    },
    ...(isStaffOrOwner
      ? [
          {
            key: 'owner',
            header: 'Pemilik',
            render: (vehicle: Vehicle) => (
              <div>
                <p className="font-medium">{vehicle.profiles?.name || '-'}</p>
                <p className="text-sm text-muted-foreground">{vehicle.profiles?.email}</p>
              </div>
            ),
          },
        ]
      : []),
    {
      key: 'actions',
      header: 'Aksi',
      render: (vehicle: Vehicle) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(vehicle);
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(vehicle.vehicle_id);
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
          title="Kendaraan"
          description={isStaffOrOwner ? 'Kelola semua data kendaraan' : 'Kelola kendaraan Anda'}
          icon={Car}
          action={{
            label: 'Tambah Kendaraan',
            onClick: () => {
              setEditingVehicle(null);
              setFormData({
                user_id: user?.id || '',
                plate_number: '',
                brand: '',
                model: '',
                year: '',
                mileage: '',
              });
              setDialogOpen(true);
            },
          }}
        />

        <DataTable
          columns={columns}
          data={vehicles}
          loading={loading}
          emptyMessage="Belum ada kendaraan"
          keyExtractor={(item) => item.vehicle_id}
        />

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingVehicle ? 'Edit Kendaraan' : 'Tambah Kendaraan'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isStaffOrOwner && (
                <div className="space-y-2">
                  <Label htmlFor="user_id">Pemilik</Label>
                  <Select
                    value={formData.user_id}
                    onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pemilik" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.user_id} value={profile.user_id}>
                          {profile.name} ({profile.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="plate_number">Plat Nomor *</Label>
                <Input
                  id="plate_number"
                  value={formData.plate_number}
                  onChange={(e) => setFormData({ ...formData, plate_number: e.target.value.toUpperCase() })}
                  placeholder="B 1234 ABC"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Merek</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Toyota"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Avanza"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Tahun</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="2023"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mileage">Kilometer</Label>
                  <Input
                    id="mileage"
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                    placeholder="50000"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingVehicle ? 'Simpan' : 'Tambah'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Vehicles;
