import { Instagram, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 border-t mt-12">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-lg mb-4">Heldonica</h3>
            <p className="text-sm text-muted-foreground">
              Discover amazing travel destinations and experiences around the world.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="text-muted-foreground hover:text-foreground transition">
                  Home
                </a>
              </li>
              <li>
                <a href="/destinations" className="text-muted-foreground hover:text-foreground transition">
                  Destinations
                </a>
              </li>
              <li>
                <a href="/dashboard" className="text-muted-foreground hover:text-foreground transition">
                  Dashboard
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/legal/privacy" className="text-muted-foreground hover:text-foreground transition">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/legal/terms" className="text-muted-foreground hover:text-foreground transition">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/legal/cookies" className="text-muted-foreground hover:text-foreground transition">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="font-semibold mb-4">Follow Us</h4>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="mailto:contact@heldonica.com"
                className="text-muted-foreground hover:text-foreground transition"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Heldonica. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground mt-4 md:mt-0">
            Made with ❤️ by Helder Farinha
          </p>
        </div>
      </div>
    </footer>
  );
}
