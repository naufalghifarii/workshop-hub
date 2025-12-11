import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Printer, ArrowLeft, Pencil } from 'lucide-react';

interface InvoiceDetail {
  invoice_parent_id: string;
  invoice_number: string;
  date: string;
  total_amount: number;
  discount: number | null;
  notes: string | null;
  workshops: {
    name: string;
    address: string | null;
    phone: string | null;
  } | null;
  vehicles: {
    plate_number: string;
    brand: string;
    model: string;
    year: number | null;
    mileage: number | null;
    profiles: {
      name: string;
      address: string | null;
      phone: string | null;
      email: string;
    } | null;
  } | null;
  invoice_service_details: {
    quantity: number;
    subtotal: number;
    packages?: { name: string } | null;
    services?: { name: string } | null;
    spareparts?: { name: string } | null;
  }[];
}

const InvoiceDetail = () => {
  const { isStaffOrOwner } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const { data: invoiceData, error } = await supabase
        .from('invoice_services')
        .select(`
          *,
          workshops (name, address, phone),
          vehicles (
            plate_number, brand, model, year, mileage, user_id
          ),
          invoice_service_details (
            quantity, subtotal,
            packages (name),
            services (name),
            spareparts (name)
          )
        `)
        .eq('invoice_parent_id', id)
        .single();

      if (error) throw error;

      let fullInvoice = { ...invoiceData } as any;

      // Manually fetch profile if vehicle exists
      if (fullInvoice.vehicles?.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name, address, phone, email')
          .eq('user_id', fullInvoice.vehicles.user_id)
          .single();
        
        if (profileData && fullInvoice.vehicles) {
          fullInvoice.vehicles.profiles = profileData;
        }
      }

      setInvoice(fullInvoice);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Gagal memuat invoice');
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

  const getItemName = (item: any) => {
    if (item.packages) return `[Paket] ${item.packages.name}`;
    if (item.services) return `[Jasa] ${item.services.name}`;
    if (item.spareparts) return `[Part] ${item.spareparts.name}`;
    return 'Unknown Item';
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!invoice) return <div className="p-8 text-center">Invoice tidak ditemukan</div>;

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-4xl mx-auto print:max-w-none print:w-full print:absolute print:top-0 print:left-0 print:bg-white print:z-50 print:p-8">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <div>
            <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent" onClick={() => navigate('/invoices')}>
                <ArrowLeft className="w-4 h-4" /> Kembali
            </Button>
            <h1 className="text-2xl font-bold mt-2">Detail Invoice</h1>
          </div>
          <div className="flex gap-2">
            {isStaffOrOwner && (
                <Button variant="outline" onClick={() => navigate(`/invoices/edit/${id}`)}>
                    <Pencil className="w-4 h-4 mr-2" /> Edit
                </Button>
            )}
            <Button onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" /> Cetak
            </Button>
          </div>
        </div>

        <Card className="print:shadow-none print:border-none">
          <CardContent className="p-8 space-y-8">
             {/* Header */}
             <div className="flex justify-between items-start border-b pb-8">
                <div>
                   <h2 className="text-2xl font-bold text-primary mb-2">{invoice.workshops?.name}</h2>
                   <p className="text-muted-foreground whitespace-pre-line text-sm max-w-xs">{invoice.workshops?.address}</p>
                   <p className="text-muted-foreground text-sm mt-1">{invoice.workshops?.phone}</p>
                </div>
                <div className="text-right">
                   <h3 className="text-xl font-mono font-semibold text-accent">{invoice.invoice_number}</h3>
                   <p className="text-muted-foreground">{new Date(invoice.date).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                </div>
             </div>

             {/* Customer & Vehicle */}
             <div className="grid grid-cols-2 gap-8">
                <div>
                   <h4 className="text-sm font-semibold text-muted-foreground mb-2">Pelanggan</h4>
                   <p className="font-medium text-lg">{invoice.vehicles?.profiles?.name}</p>
                   <p className="text-sm text-muted-foreground">{invoice.vehicles?.profiles?.address}</p>
                   <p className="text-sm text-muted-foreground">{invoice.vehicles?.profiles?.phone}</p>
                </div>
                <div className="text-right">
                   <h4 className="text-sm font-semibold text-muted-foreground mb-2">Kendaraan</h4>
                   <p className="font-medium text-lg">{invoice.vehicles?.plate_number}</p>
                   <p className="text-sm text-muted-foreground">{invoice.vehicles?.brand} {invoice.vehicles?.model}</p>
                   <p className="text-sm text-muted-foreground">{invoice.vehicles?.year ? `Tahun ${invoice.vehicles.year}` : ''}</p>
                </div>
             </div>

             {/* Items */}
             <div>
                <table className="w-full">
                   <thead className="bg-muted/50 border-y">
                      <tr>
                         <th className="py-3 px-4 text-left font-semibold text-sm">Deskripsi</th>
                         <th className="py-3 px-4 text-center font-semibold text-sm w-24">Qty</th>
                         <th className="py-3 px-4 text-right font-semibold text-sm w-40">Subtotal</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y">
                      {invoice.invoice_service_details.map((item, idx) => (
                         <tr key={idx}>
                            <td className="py-3 px-4">{getItemName(item)}</td>
                            <td className="py-3 px-4 text-center">{item.quantity}</td>
                            <td className="py-3 px-4 text-right">{formatCurrency(item.subtotal)}</td>
                         </tr>
                      ))}
                   </tbody>
                   <tfoot className="border-t">
                       <tr>
                          <td colSpan={2} className="py-4 px-4 text-right font-semibold">Subtotal</td>
                          <td className="py-4 px-4 text-right">
                             {formatCurrency(invoice.invoice_service_details.reduce((sum, item) => sum + item.subtotal, 0))}
                          </td>
                       </tr>
                       {invoice.discount && invoice.discount > 0 && (
                         <tr>
                            <td colSpan={2} className="py-2 px-4 text-right font-semibold text-muted-foreground">Diskon</td>
                            <td className="py-2 px-4 text-right text-muted-foreground">- {formatCurrency(invoice.discount)}</td>
                         </tr>
                       )}
                       <tr>
                          <td colSpan={2} className="py-4 px-4 text-right font-bold text-lg">Total</td>
                          <td className="py-4 px-4 text-right font-bold text-xl text-accent">{formatCurrency(invoice.total_amount)}</td>
                       </tr>
                    </tfoot>
                </table>
             </div>

             {/* Notes */}
             {invoice.notes && (
                <div className="pt-4 border-t">
                   <h4 className="text-sm font-semibold text-muted-foreground mb-1">Catatan</h4>
                   <p className="text-sm">{invoice.notes}</p>
                </div>
             )}

             {/* Footer */}
             <div className="pt-8 mt-8 border-t text-center text-sm text-muted-foreground print:block hidden">
                <p>Terima kasih atas kepercayaan Anda melakukan servis di bengkel kami.</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InvoiceDetail;
