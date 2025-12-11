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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Pencil, Trash2, Mail, Phone, Shield } from 'lucide-react';

interface Customer {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  role?: string;
}

const Customers = () => {
  const { isStaffOrOwner, isOwner } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    role: 'customer',
  });

  useEffect(() => {
    if (!isStaffOrOwner) {
      navigate('/dashboard');
      return;
    }
    fetchCustomers();
  }, [isStaffOrOwner, navigate]);

  const fetchCustomers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for each profile
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const customersWithRoles = (profiles || []).map((profile) => ({
        ...profile,
        role: roles?.find((r) => r.user_id === profile.user_id)?.role || 'customer',
      }));

      setCustomers(customersWithRoles);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Gagal memuat data customer');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: formData.name,
            phone: formData.phone || null,
            address: formData.address || null,
          })
          .eq('id', editingCustomer.id);

        if (error) throw error;

        // Update role if owner
        if (isOwner && formData.role) {
          // Delete existing roles first to ensure 1:1 mapping behavior
          const { error: deleteError } = await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', editingCustomer.user_id);

          if (deleteError) throw deleteError;

          // Insert new role
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: editingCustomer.user_id,
              role: formData.role as 'owner' | 'staff' | 'customer',
            });
            
          if (insertError) throw insertError;
        }

        toast.success('Customer berhasil diperbarui');
      }

      setDialogOpen(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Gagal menyimpan customer');
    }
  };

  const handleDelete = async (id: string, userId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data customer ini?')) return;

    try {
      // Delete role first if owner
      if (isOwner) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);
        
        if (roleError) throw roleError;
      }

      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (profileError) throw profileError;

      toast.success('Customer berhasil dihapus');
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Gagal menghapus customer');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      role: customer.role || 'customer',
    });
    setDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'staff':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Nama',
      render: (customer: Customer) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {customer.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium">{customer.name}</p>
            <p className="text-sm text-muted-foreground">{customer.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Telepon',
      render: (customer: Customer) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="w-4 h-4" />
          <span>{customer.phone || '-'}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (customer: Customer) => (
        <Badge variant={getRoleBadgeVariant(customer.role || 'customer')} className="capitalize">
          <Shield className="w-3 h-3 mr-1" />
          {customer.role || 'customer'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (customer: Customer) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(customer);
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(customer.id, customer.user_id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <PageHeader
          title="Customer"
          description="Kelola data customer"
          icon={Users}
        />

        <DataTable
          columns={columns}
          data={customers}
          loading={loading}
          emptyMessage="Belum ada customer"
          keyExtractor={(item) => item.id}
        />

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Edit Customer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nama customer"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={formData.email}
                  disabled
                  className="bg-muted"
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
                <Label htmlFor="address">Alamat</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Alamat lengkap"
                />
              </div>
              {isOwner && (
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">Simpan</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Customers;
