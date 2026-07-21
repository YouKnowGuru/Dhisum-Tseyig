import { useState } from 'react';
import { Upload, Download, FileSpreadsheet, Users, Package, AlertCircle, CheckCircle, FileText, ShoppingCart, Wallet, CreditCard, TrendingUp, BarChart3 } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import * as XLSX from 'xlsx';

export function ImportExportPage() {
  const { showNotification } = useAppStore();
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('export');
  const [importType, setImportType] = useState<'contacts' | 'items'>('contacts');
  const [contactType, setContactType] = useState<'customer' | 'supplier'>('customer');
  const [importResult, setImportResult] = useState<any>(null);
  const [fileName, setFileName] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (importType === 'contacts') {
          const result = await window.electronSecureAPI.csvImport?.contacts(jsonData, contactType);
          setImportResult(result);
          showNotification(result?.message || 'Import done', result?.success ? 'success' : 'error');
        } else {
          const result = await window.electronSecureAPI.csvImport?.items(jsonData);
          setImportResult(result);
          showNotification(result?.message || 'Import done', result?.success ? 'success' : 'error');
        }
      } catch (error: any) {
        showNotification('Failed to parse file: ' + error.message, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = (type: string) => {
    let headers: string[];
    if (type === 'customers') headers = ['name', 'contactPerson', 'phone', 'email', 'address', 'gstNumber', 'creditLimit', 'creditDays', 'openingBalance'];
    else if (type === 'suppliers') headers = ['name', 'contactPerson', 'phone', 'email', 'address', 'gstNumber', 'creditLimit', 'creditDays', 'openingBalance'];
    else headers = ['code', 'name', 'description', 'category', 'unit', 'purchasePrice', 'sellingPrice', 'quantityInStock', 'reorderLevel', 'gstRate', 'gstApplicable'];

    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `${type}_template.xlsx`);
  };

  const exportData = async (type: string) => {
    try {
      let data: any[];
      let wsName: string;

      if (type === 'customers') {
        const result = await window.electronSecureAPI.contacts?.getAll('customer');
        data = Array.isArray(result?.data) ? result.data.map((c: any) => ({ name: c.name, contactPerson: c.contactPerson, phone: c.phone, email: c.email, creditLimit: c.creditLimit, currentBalance: c.currentBalance, gstNumber: c.gstNumber })) : [];
        wsName = 'Customers';
      } else if (type === 'suppliers') {
        const result = await window.electronSecureAPI.contacts?.getAll('supplier');
        data = Array.isArray(result?.data) ? result.data.map((c: any) => ({ name: c.name, contactPerson: c.contactPerson, phone: c.phone, email: c.email, creditLimit: c.creditLimit, currentBalance: c.currentBalance, gstNumber: c.gstNumber })) : [];
        wsName = 'Suppliers';
      } else if (type === 'items') {
        const result = await window.electronSecureAPI.inventory?.getItems();
        data = Array.isArray(result?.data) ? result.data.map((i: any) => ({ code: i.code, name: i.name, category: i.category, unit: i.unit, purchasePrice: i.purchasePrice, sellingPrice: i.sellingPrice, quantityInStock: i.quantityInStock, reorderLevel: i.reorderLevel, gstRate: i.gstRate })) : [];
        wsName = 'Items';
      } else if (type === 'transactions') {
        const result = await window.electronSecureAPI.transactions?.getAll();
        data = Array.isArray(result?.data) ? result.data.map((t: any) => ({ transactionNo: t.transactionNo, date: t.date, type: t.type, contactName: t.contactName, netAmount: t.netAmount, paymentMode: t.paymentMode, status: t.status })) : [];
        wsName = 'Transactions';
      } else {
        const result = await window.electronSecureAPI.contacts?.getAll();
        data = Array.isArray(result?.data) ? result.data.map((c: any) => ({ name: c.name, type: c.type, phone: c.phone, email: c.email, currentBalance: c.currentBalance })) : [];
        wsName = 'All Contacts';
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, wsName);
      XLSX.writeFile(wb, `${wsName}_${new Date().toISOString().split('T')[0]}.xlsx`);
      showNotification(`${wsName} exported successfully`, 'success');
    } catch (error: any) {
      showNotification('Export failed: ' + error.message, 'error');
    }
  };

  const exportOptions = [
    {
      label: 'Customers',
      icon: Users,
      type: 'customers',
      desc: 'Export all customer records with balances and contact info',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      hoverColor: 'hover:border-emerald-300',
      iconBg: 'bg-emerald-100 group-hover:bg-emerald-200',
    },
    {
      label: 'Suppliers',
      icon: ShoppingCart,
      type: 'suppliers',
      desc: 'Export all supplier records with payment terms',
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      hoverColor: 'hover:border-blue-300',
      iconBg: 'bg-blue-100 group-hover:bg-blue-200',
    },
    {
      label: 'Items',
      icon: Package,
      type: 'items',
      desc: 'Export inventory items with pricing and stock levels',
      color: 'bg-purple-50 text-purple-600 border-purple-100',
      hoverColor: 'hover:border-purple-300',
      iconBg: 'bg-purple-100 group-hover:bg-purple-200',
    },
    {
      label: 'Transactions',
      icon: FileSpreadsheet,
      type: 'transactions',
      desc: 'Export all transactions with amounts and payment modes',
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      hoverColor: 'hover:border-amber-300',
      iconBg: 'bg-amber-100 group-hover:bg-amber-200',
    },
    {
      label: 'All Contacts',
      icon: Users,
      type: 'contacts',
      desc: 'Export customers and suppliers combined',
      color: 'bg-rose-50 text-rose-600 border-rose-100',
      hoverColor: 'hover:border-rose-300',
      iconBg: 'bg-rose-100 group-hover:bg-rose-200',
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-bhutan-maroon to-bhutan-maroon-dark rounded-[32px] p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2">Import / Export</h1>
          <p className="text-white/70 font-medium">Bulk data management with professional Excel exports</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => { setActiveTab('export'); setImportResult(null); }}
          className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'export'
              ? 'bg-white text-bhutan-maroon shadow-lg shadow-bhutan-maroon/10'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Data
          </div>
        </button>
        <button
          onClick={() => { setActiveTab('import'); setImportResult(null); }}
          className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'import'
              ? 'bg-white text-bhutan-maroon shadow-lg shadow-bhutan-maroon/10'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import Data
          </div>
        </button>
      </div>

      {activeTab === 'export' ? (
        <div className="space-y-6">
          {/* Export Info */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-[24px] p-6 border border-slate-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-bhutan-maroon/10 rounded-2xl">
                <FileText className="w-6 h-6 text-bhutan-maroon" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1">Professional Excel Exports</h3>
                <p className="text-sm text-slate-600">
                  All exports include Bhutanese-themed styling with crimson headers, gold accents, alternating row colors, and formatted currency columns.
                </p>
              </div>
            </div>
          </div>

          {/* Export Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exportOptions.map((item) => (
              <button
                key={item.type}
                onClick={() => exportData(item.type)}
                className={`group relative bg-white rounded-[24px] shadow-sm border border-slate-100 p-6 hover:shadow-xl hover:shadow-slate-200/50 ${item.hoverColor} transition-all duration-300 text-left overflow-hidden`}
              >
                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-50 to-transparent rounded-bl-[48px]" />

                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`inline-flex p-3 ${item.iconBg} rounded-2xl transition-colors mb-4`}>
                    <item.icon className={`w-6 h-6 ${item.color.split(' ')[1]}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-black text-slate-800 mb-2">{item.label}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-6">{item.desc}</p>

                  {/* Action */}
                  <div className="flex items-center gap-2 text-bhutan-maroon font-bold text-sm group-hover:gap-3 transition-all">
                    <Download className="w-4 h-4" />
                    <span>Export Excel</span>
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Export Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: BarChart3, label: 'Crimson Headers', desc: 'Branded header rows' },
              { icon: TrendingUp, label: 'Currency Formatting', desc: 'Nu. with commas' },
              { icon: CreditCard, label: 'Color Coding', desc: 'Payment mode colors' },
              { icon: Wallet, label: 'Total Rows', desc: 'Auto-calculated sums' },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 text-center">
                <div className="inline-flex p-2 bg-bhutan-maroon/5 rounded-xl mb-2">
                  <feature.icon className="w-5 h-5 text-bhutan-maroon" />
                </div>
                <p className="text-xs font-bold text-slate-800">{feature.label}</p>
                <p className="text-[10px] text-slate-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-2xl space-y-6">
          {/* Import Type Selection */}
          <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-bhutan-maroon/10 rounded-2xl">
                <Upload className="w-6 h-6 text-bhutan-maroon" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Import Settings</h3>
                <p className="text-sm text-slate-500">Configure your import preferences</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest">Import Type</label>
                <select
                  value={importType}
                  onChange={(e) => setImportType(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-bhutan-maroon/20 focus:border-bhutan-maroon transition-colors"
                >
                  <option value="contacts">Contacts</option>
                  <option value="items">Items</option>
                </select>
              </div>
              {importType === 'contacts' && (
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-widest">Contact Type</label>
                  <select
                    value={contactType}
                    onChange={(e) => setContactType(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-bhutan-maroon/20 focus:border-bhutan-maroon transition-colors"
                  >
                    <option value="customer">Customers</option>
                    <option value="supplier">Suppliers</option>
                  </select>
                </div>
              )}
            </div>

            <button
              onClick={() => downloadTemplate(importType === 'contacts' ? contactType + 's' : 'items')}
              className="flex items-center gap-3 px-6 py-3 bg-slate-100 rounded-xl hover:bg-slate-200 text-sm font-bold text-slate-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download Template
            </button>
          </div>

          {/* File Upload */}
          <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-100 rounded-2xl">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Upload File</h3>
                <p className="text-sm text-slate-500">Select your Excel or CSV file</p>
              </div>
            </div>

            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-bhutan-maroon/50 hover:bg-gradient-to-br hover:from-bhutan-maroon/5 hover:to-transparent transition-all duration-300">
              <div className="p-4 bg-slate-100 rounded-2xl mb-4 group-hover:bg-bhutan-maroon/10 transition-colors">
                <Upload className="w-10 h-10 text-slate-400 group-hover:text-bhutan-maroon" />
              </div>
              <p className="text-base font-bold text-slate-700 mb-1">{fileName || 'Click to select file'}</p>
              <p className="text-sm text-slate-400">.xlsx, .xls, .csv supported</p>
              <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
            </label>

            {importResult && (
              <div className={`mt-6 p-5 rounded-2xl ${importResult.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-3 mb-2">
                  {importResult.success ? (
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                  ) : (
                    <div className="p-2 bg-red-100 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                  )}
                  <span className="font-bold text-sm">{importResult.message}</span>
                </div>
                {importResult.data?.errors?.length > 0 && (
                  <div className="mt-3 text-sm text-red-600 space-y-1 bg-white/50 p-3 rounded-xl">
                    {importResult.data.errors.slice(0, 5).map((err: string, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                        {err}
                      </div>
                    ))}
                    {importResult.data.errors.length > 5 && (
                      <div className="text-red-400 font-medium">+{importResult.data.errors.length - 5} more errors</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
