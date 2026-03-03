import Navbar from '../../components/Navbar';
import Hero from '../../components/Hero';
import Categories from '../../components/Categories';
import WhyChoose from '../../components/WhyChoose';

export default function Home() {
  return (
    <main className="relative min-h-screen z-0">
      <Navbar />
      <Hero />
      <Categories />
      <WhyChoose />
      <Footer />
    </main>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-white/8 py-12 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-widest text-white">
                CBRI<span className="text-blue-400">XI</span>
              </span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed">
              Smart devices for a smarter life. Premium tech, delivered.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide uppercase">Quick Links</h4>
            <ul className="space-y-2">
              {['Home', 'Shop', 'Categories', 'Deals'].map((l) => (
                <li key={l}>
                  <a href="#" className="text-white/40 hover:text-white text-sm transition-colors">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide uppercase">Categories</h4>
            <ul className="space-y-2">
              {['Smart Watches', 'Smart Home', 'Audio Devices', 'Accessories'].map((c) => (
                <li key={c}>
                  <a href="#categories" className="text-white/40 hover:text-white text-sm transition-colors">
                    {c}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide uppercase">Support</h4>
            <ul className="space-y-2">
              {['Contact Us', 'FAQ', 'Returns', 'Track Order'].map((s) => (
                <li key={s}>
                  <a href="#contact" className="text-white/40 hover:text-white text-sm transition-colors">
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm">© 2026 CBRIXI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((t) => (
              <a key={t} href="#" className="text-white/30 hover:text-white/60 text-xs transition-colors">
                {t}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
