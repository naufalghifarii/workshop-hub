import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import {
  LayoutDashboard,
  Building2,
  Users,
  Car,
  FileText,
  TrendingUp,
  Package,
  Cog,
} from 'lucide-react';

interface DashboardStats {
  workshops: number;
  customers: number;
  vehicles: number;
  invoices: number;
  services: number;
  packages: number;
  spareparts: number;
  totalRevenue: number;
}

const Dashboard = () => {
  const { profile, role, isStaffOrOwner } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    workshops: 0,
    customers: 0,
    vehicles: 0,
    invoices: 0,
    services: 0,
    packages: 0,
    spareparts: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          workshopsRes,
          vehiclesRes,
          servicesRes,
          packagesRes,
          sparepartsRes,
          invoicesRes,
        ] = await Promise.all([
          supabase.from('workshops').select('workshop_id', { count: 'exact', head: true }),
          supabase.from('vehicles').select('vehicle_id', { count: 'exact', head: true }),
          supabase.from('services').select('service_id', { count: 'exact', head: true }),
          supabase.from('packages').select('package_id', { count: 'exact', head: true }),
          supabase.from('spareparts').select('sparepart_id', { count: 'exact', head: true }),
          supabase.from('invoice_services').select('invoice_parent_id, total_amount'),
        ]);

        const customersRes = isStaffOrOwner
          ? await supabase.from('profiles').select('id', { count: 'exact', head: true })
          : { count: 0 };

        const totalRevenue = invoicesRes.data?.reduce(
          (sum, inv) => sum + (Number(inv.total_amount) || 0),
          0
        ) || 0;

        setStats({
          workshops: workshopsRes.count || 0,
          customers: customersRes.count || 0,
          vehicles: vehiclesRes.count || 0,
          invoices: invoicesRes.data?.length || 0,
          services: servicesRes.count || 0,
          packages: packagesRes.count || 0,
          spareparts: sparepartsRes.count || 0,
          totalRevenue,
        });

        // Fetch recent invoices
        const { data: invoices } = await supabase
          .from('invoice_services')
          .select(`
            *,
            vehicles (plate_number, brand, model),
            workshops (name)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentInvoices(invoices || []);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isStaffOrOwner]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-8 text-primary-foreground">
          <div className="relative z-10">
            <p className="text-primary-foreground/70 mb-1">
              Selamat datang kembali,
            </p>
            <h1 className="text-3xl font-display font-bold mb-2">
              {profile?.name || 'User'}
            </h1>
            <p className="text-primary-foreground/70 text-sm">
              {isStaffOrOwner
                ? 'Kelola workshop Anda dengan mudah dan efisien'
                : 'Pantau riwayat servis kendaraan Anda'}
            </p>
          </div>
          <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10">
            <LayoutDashboard className="w-48 h-48" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isStaffOrOwner && (
            <>
              <StatCard
                title="Total Workshop"
                value={stats.workshops}
                icon={Building2}
                iconClassName="bg-info/10 text-info"
              />
              <StatCard
                title="Total Customer"
                value={stats.customers}
                icon={Users}
                iconClassName="bg-success/10 text-success"
              />
            </>
          )}
          <StatCard
            title="Kendaraan"
            value={stats.vehicles}
            icon={Car}
            iconClassName="bg-accent/10 text-accent"
          />
          <StatCard
            title="Total Invoice"
            value={stats.invoices}
            icon={FileText}
            iconClassName="bg-primary/10 text-primary"
          />
          {isStaffOrOwner && (
            <>
              <StatCard
                title="Layanan"
                value={stats.services}
                icon={Cog}
                iconClassName="bg-warning/10 text-warning"
              />
              <StatCard
                title="Paket"
                value={stats.packages}
                icon={Package}
                iconClassName="bg-info/10 text-info"
              />
              <StatCard
                title="Sparepart"
                value={stats.spareparts}
                icon={Cog}
                iconClassName="bg-success/10 text-success"
              />
              <StatCard
                title="Total Pendapatan"
                value={formatCurrency(stats.totalRevenue)}
                icon={TrendingUp}
                iconClassName="bg-accent/10 text-accent"
                trend={{ value: 12, isPositive: true }}
              />
            </>
          )}
        </div>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Invoice Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : recentInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada invoice
              </div>
            ) : (
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div
                    key={invoice.invoice_parent_id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.vehicles?.brand} {invoice.vehicles?.model} - {invoice.vehicles?.plate_number}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-accent">
                        {formatCurrency(Number(invoice.total_amount))}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(invoice.date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
