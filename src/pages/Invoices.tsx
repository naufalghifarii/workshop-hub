import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Eye, Printer, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Invoice {
  invoice_parent_id: string;
  invoice_number: string;
  date: string;
  total_amount: number;
  notes: string | null;
  vehicles?: { plate_number: string; brand: string; model: string } | null;
  workshops?: { name: string } | null;
}

const Invoices = () => {
  const { isStaffOrOwner } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoice_services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices((data || []) as Invoice[]);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Gagal memuat data invoice');
    } finally {
      setLoading(false);
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
      key: 'invoice_number',
      header: 'No. Invoice',
      render: (invoice: Invoice) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <span className="font-semibold">{invoice.invoice_number}</span>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Tanggal',
      render: (invoice: Invoice) => new Date(invoice.date).toLocaleDateString('id-ID'),
    },
    {
      key: 'total_amount',
      header: 'Total',
      render: (invoice: Invoice) => (
        <span className="font-semibold text-accent">{formatCurrency(invoice.total_amount)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (invoice: Invoice) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/invoices/${invoice.invoice_parent_id}`);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <PageHeader
          title="Invoice"
          description="Riwayat invoice servis"
          icon={FileText}
          action={isStaffOrOwner ? {
            label: 'Buat Invoice',
            onClick: () => navigate('/invoices/new'),
            icon: Plus,
          } : undefined}
        />

        <DataTable
          columns={columns}
          data={invoices}
          loading={loading}
          emptyMessage="Belum ada invoice"
          keyExtractor={(item) => item.invoice_parent_id}
        />
      </div>
    </DashboardLayout>
  );
};

export default Invoices;
