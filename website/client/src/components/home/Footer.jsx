import { useState } from "react";
import { Button } from "@/components/edubot/ui/button";
import { Input } from "@/components/edubot/ui/input";
import { Facebook, Instagram, Linkedin, Send, Twitter } from "lucide-react";
import logo from "@/public/logo.png";

const QUICK_LINKS = [
  { label: "Home", href: "#" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
];

const EXPLORE_LINKS = [
  { label: "Pricing", href: "#" },
  { label: "About Us", href: "#" },
  { label: "Contact", href: "#" },
];

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = () => {
    console.log("Subscribe clicked with email:", email);
    setEmail("");
  };

  return (
    <footer className="border-t border-card-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-12 grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="EduBot" className="h-10 w-10 rounded-full" />
              <span className="text-xl font-bold">EduBot</span>
            </div>
            <p className="text-sm text-muted-foreground">+92 0000001142</p>
            <p className="text-sm text-muted-foreground">
              Get started with the smartest AI learning companion designed for students.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    data-testid={`link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Explore</h3>
            <ul className="space-y-2 text-sm">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    data-testid={`link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Newsletter</h3>
            <p className="text-sm text-muted-foreground">
              Subscribe to get the latest updates and educational tips.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="flex-1"
                data-testid="input-newsletter-email"
              />
              <Button size="icon" onClick={handleSubscribe} data-testid="button-subscribe">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground md:flex-row">
          <p>© 2025 EduBot. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="transition-colors hover:text-foreground" data-testid="link-privacy-policy">
              Privacy Policy
            </a>
            <a href="#" className="transition-colors hover:text-foreground" data-testid="link-terms-conditions">
              Terms &amp; Conditions
            </a>
          </div>
          <div className="flex gap-4">
            <a href="#" className="transition-colors hover:text-foreground" data-testid="link-facebook">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="transition-colors hover:text-foreground" data-testid="link-twitter">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="transition-colors hover:text-foreground" data-testid="link-linkedin">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href="#" className="transition-colors hover:text-foreground" data-testid="link-instagram">
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
