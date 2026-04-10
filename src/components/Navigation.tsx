"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Database, Download, Upload, Package, Scissors, Calculator, LogOut } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/", label: "Υλικά", icon: Package },
    { href: "/recipes", label: "Συνταγές", icon: Scissors },
    { href: "/calculator", label: "Υπολογισμός Παραγγελιών", icon: Calculator },
  ];

  const handleExport = async () => {
    window.open("/api/db/export", "_blank");
  };

  const handleImport = () => {
    document.getElementById("db-import-input")?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    if (confirm("ΠΡΟΣΟΧΗ: Αυτή η ενέργεια θα διαγράψει τα υπάρχοντα δεδομένα και θα τα αντικαταστήσει με τα δεδομένα του αρχείου JSON. Είστε σίγουροι;")) {
      try {
        const res = await fetch("/api/db/import", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          alert("Η βάση δεδομένων εισήχθη επιτυχώς!");
          window.location.reload();
        } else {
          alert("Σφάλμα κατά την εισαγωγή.");
        }
      } catch (err) {
        alert("Σφάλμα επικοινωνίας.");
      }
    }
    
    e.target.value = "";
  };
  
  const handleLogout = async () => {
    document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
  };

  return (
    <header className="gradient-nav sticky top-0 z-50 shadow-lg shadow-primary-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center space-x-8">
            <div className="flex items-center text-white font-bold text-xl tracking-tight">
              <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center mr-2.5 backdrop-blur-sm">
                <Database className="h-4.5 w-4.5 text-primary-200" />
              </div>
              BOM Manager
            </div>
            <nav className="hidden md:flex space-x-1">
              {links.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-white/20 text-white shadow-sm backdrop-blur-sm"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="flex bg-white/10 backdrop-blur-sm p-1 rounded-lg">
              <button
                onClick={handleExport}
                className="flex items-center px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/15 hover:text-white rounded-md transition-all"
                title="Εξαγωγή Βάσης"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Εξαγωγή
              </button>
              <div className="w-px bg-white/20 mx-0.5 my-1"></div>
              <button
                onClick={handleImport}
                className="flex items-center px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/15 hover:text-white rounded-md transition-all"
                title="Εισαγωγή Βάσης"
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Εισαγωγή
              </button>
              <input 
                type="file" 
                id="db-import-input" 
                accept=".json" 
                className="hidden" 
                onChange={onFileChange} 
              />
            </div>
            
            <button
               onClick={handleLogout}
               className="text-white/50 hover:text-danger-400 hover:bg-white/10 transition-all p-2 rounded-lg"
               title="Αποσύνδεση"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
