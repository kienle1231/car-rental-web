import { Car, Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';

const Footer = () => (
  <footer className="bg-black/90 border-t border-white/10 pt-16 pb-8">
    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
      <div className="lg:col-span-2">
        <div className="flex items-center gap-2 text-xl font-extrabold mb-4">
          <Car className="w-6 h-6 text-yellow-400" />
          <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">LUXERIDE</span>
        </div>
        <p className="text-gray-500 text-sm max-w-sm">Experience the future of luxury mobility. Curated fleets, elite service, and global access tailored for discerning travelers.</p>
        <div className="flex items-center gap-3 mt-6 text-gray-400">
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-yellow-400 hover:text-yellow-400 transition">
            <Facebook className="w-4 h-4" />
          </div>
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-yellow-400 hover:text-yellow-400 transition">
            <Instagram className="w-4 h-4" />
          </div>
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-yellow-400 hover:text-yellow-400 transition">
            <Twitter className="w-4 h-4" />
          </div>
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-yellow-400 hover:text-yellow-400 transition">
            <Linkedin className="w-4 h-4" />
          </div>
        </div>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-3">Company</h4>
        <div className="space-y-2 text-sm text-gray-500">
          <p className="hover:text-yellow-400 transition cursor-pointer">About</p>
          <p className="hover:text-yellow-400 transition cursor-pointer">Careers</p>
          <p className="hover:text-yellow-400 transition cursor-pointer">Press</p>
          <p className="hover:text-yellow-400 transition cursor-pointer">Investors</p>
        </div>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-3">Support</h4>
        <div className="space-y-2 text-sm text-gray-500">
          <p className="hover:text-yellow-400 transition cursor-pointer">Help Center</p>
          <p className="hover:text-yellow-400 transition cursor-pointer">Trust & Safety</p>
          <p className="hover:text-yellow-400 transition cursor-pointer">Insurance</p>
          <p className="hover:text-yellow-400 transition cursor-pointer">Accessibility</p>
        </div>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-3">Locations</h4>
        <div className="space-y-2 text-sm text-gray-500">
          <p className="hover:text-yellow-400 transition cursor-pointer">Ho Chi Minh City</p>
          <p className="hover:text-yellow-400 transition cursor-pointer">Singapore</p>
          <p className="hover:text-yellow-400 transition cursor-pointer">Los Angeles</p>
          <p className="hover:text-yellow-400 transition cursor-pointer">Dubai</p>
        </div>
      </div>
    </div>
    <div className="border-t border-white/10 mt-12 pt-6 text-center text-xs text-gray-600">
      © 2026 LUXERIDE. All rights reserved.
    </div>
  </footer>
);

export default Footer;
