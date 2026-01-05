import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-white font-semibold text-xl">PropertyPro</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 pt-20 pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Property Management
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              {" "}Made Simple
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Streamline your property operations with our comprehensive management system.
            Handle owners, tenants, leases, and finances all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/login"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25"
            >
              Access Dashboard
            </Link>
            <a
              href="#features"
              className="border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white font-semibold px-8 py-4 rounded-xl transition-all"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 max-w-4xl mx-auto">
          {[
            { value: '500+', label: 'Properties Managed' },
            { value: '2,000+', label: 'Active Tenants' },
            { value: '$10M+', label: 'Rent Collected' },
            { value: '99.9%', label: 'Uptime' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="bg-slate-800/50 py-24">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Everything You Need
          </h2>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
            A complete solution for property managers, owners, and tenants.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: '🏠',
                title: 'Property Management',
                description: 'Track properties, units, and manage assignments with detailed analytics.',
              },
              {
                icon: '👥',
                title: 'Tenant Portal',
                description: 'Self-service portal for tenants to pay rent and submit maintenance requests.',
              },
              {
                icon: '📊',
                title: 'Financial Tracking',
                description: 'Immutable ledger for all transactions with detailed reporting.',
              },
              {
                icon: '📄',
                title: 'Lease Management',
                description: 'Digital lease creation, e-signatures, and automated renewals.',
              },
              {
                icon: '🔧',
                title: 'Maintenance',
                description: 'Work order management with approval workflows and expense tracking.',
              },
              {
                icon: '💰',
                title: 'Owner Payouts',
                description: 'Automated monthly statements and direct deposit payouts.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Types */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-16">
            Built for Everyone
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                role: 'Admins',
                features: ['Full system access', 'User management', 'Financial reports', 'Audit logs'],
                color: 'blue',
                link: '/admin',
              },
              {
                role: 'Owners',
                features: ['Property portfolio', 'Monthly statements', 'Payout tracking', 'Read-only access'],
                color: 'purple',
                link: '/owner',
              },
              {
                role: 'Tenants',
                features: ['Pay rent online', 'Submit requests', 'View lease details', 'Message management'],
                color: 'green',
                link: '/tenant',
              },
            ].map((type, i) => (
              <div
                key={i}
                className={`bg-gradient-to-br from-${type.color}-500/10 to-${type.color}-600/5 border border-${type.color}-500/20 rounded-xl p-8`}
              >
                <h3 className="text-2xl font-bold text-white mb-4">{type.role}</h3>
                <ul className="space-y-3 mb-6">
                  {type.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-gray-300">
                      <span className="text-green-400">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={type.link}
                  className={`inline-block text-${type.color}-400 hover:text-${type.color}-300 font-semibold`}
                >
                  View Dashboard →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="text-gray-400">PropertyPro Management System</span>
            </div>
            <div className="text-gray-500 text-sm">
              © {new Date().getFullYear()} All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
