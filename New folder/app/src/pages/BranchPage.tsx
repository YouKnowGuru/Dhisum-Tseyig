import { Building2, GitBranch, BarChart3, Users, Receipt, MapPin, Rocket, Clock } from 'lucide-react';

const upcomingFeatures = [
  {
    icon: GitBranch,
    title: 'Multi-Branch POS',
    description: 'Tag every sale to a specific branch. Track revenue and transactions per location in real time.',
  },
  {
    icon: BarChart3,
    title: 'Per-Branch Reports',
    description: 'Filter your sales, expenses, and profit & loss reports by branch with a single click.',
  },
  {
    icon: Users,
    title: 'Employee Assignment',
    description: 'Assign staff to branches and manage payroll per location.',
  },
  {
    icon: Receipt,
    title: 'Branch on Receipts',
    description: 'Automatically print the branch name, address, and phone number on every invoice.',
  },
  {
    icon: MapPin,
    title: 'Branch Dashboard',
    description: 'A dedicated dashboard showing live metrics — sales, stock levels, and top items — for each location.',
  },
  {
    icon: Clock,
    title: 'Session-Based Branch Login',
    description: 'Staff select their active branch at login. All transactions are automatically scoped to that location.',
  },
];

export function BranchPage() {
  return (
    <div className="space-y-10 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Branches</h1>
          <p className="text-slate-500">Manage multiple business locations</p>
        </div>
      </div>

      {/* Coming Soon Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-bhutan-maroon via-[#8B1A2E] to-[#4A0E1A] p-10 text-white shadow-2xl shadow-bhutan-maroon/30">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-80 w-80 rounded-full bg-white/5" />

        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm shadow-inner">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
              <Rocket className="h-3 w-3" />
              Coming Soon
            </div>
            <h2 className="text-3xl font-black leading-tight">Multi-Branch Management</h2>
            <p className="mt-2 max-w-xl text-white/75 leading-relaxed">
              Full multi-location support is under active development. You'll be able to manage branches, assign staff, filter reports, and run your entire business across multiple locations — all from one app.
            </p>
          </div>
        </div>
      </div>

      {/* Feature grid */}
      <div>
        <p className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400">What's coming</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-200 hover:border-bhutan-maroon/20 hover:shadow-md"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-bhutan-maroon/8 text-bhutan-maroon transition-colors group-hover:bg-bhutan-maroon/15">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 font-bold text-slate-800">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{feature.description}</p>

                {/* Coming soon pill */}
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600">
                  <Clock className="h-3 w-3" />
                  In Development
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
