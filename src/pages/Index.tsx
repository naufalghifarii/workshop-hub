import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Wrench, ArrowRight, Car, FileText, Users } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center shadow-glow">
              <Wrench className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-primary-foreground">
              Workshop<span className="text-accent">Pro</span>
            </span>
          </div>
          <Link to="/auth">
            <Button variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
              Masuk
            </Button>
          </Link>
        </header>

        {/* Hero */}
        <main className="flex flex-col items-center text-center py-20 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-primary-foreground mb-6 max-w-4xl">
            Sistem Manajemen Bengkel
            <span className="text-gradient block mt-2">Modern & Efisien</span>
          </h1>
          <p className="text-lg text-primary-foreground/70 max-w-2xl mb-10">
            Kelola workshop, kendaraan, layanan, dan invoice dalam satu platform terintegrasi. Tingkatkan produktivitas bengkel Anda.
          </p>
          <div className="flex gap-4">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-accent text-accent-foreground shadow-glow hover:shadow-glow-lg gap-2">
                Mulai Sekarang
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-20 w-full max-w-4xl">
            {[
              { icon: Car, title: 'Manajemen Kendaraan', desc: 'Kelola data kendaraan pelanggan dengan mudah' },
              { icon: FileText, title: 'Invoice Otomatis', desc: 'Buat invoice servis dengan kalkulasi otomatis' },
              { icon: Users, title: 'Multi-Role', desc: 'Akses berbeda untuk owner, staff, dan customer' },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-primary-foreground/5 border border-primary-foreground/10 backdrop-blur">
                <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center mb-4 mx-auto">
                  <feature.icon className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="font-display font-semibold text-primary-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-primary-foreground/60">{feature.desc}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
