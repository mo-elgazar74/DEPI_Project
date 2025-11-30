import { useState } from "react";
import { Button } from "@/components/edubot/ui/button";
import { Input } from "@/components/edubot/ui/input";
import { Linkedin, Send, Youtube, Mail } from "lucide-react";
import logo from "@/public/logo.png";
import LegalModal from "../LegalModal";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState("privacy");
  const { t } = useLanguage();

  const QUICK_LINKS = [
    { label: t("nav.home"), href: "#hero" },
    { label: t("nav.about"), href: "#hero-content" },
    { label: t("nav.features"), href: "#features" },
    { label: t("nav.whyUs"), href: "#why-us" },
    { label: t("nav.upcoming"), href: "#upcoming" },
    { label: t("nav.faq"), href: "#faq" },
  ];

  const handleSubscribe = () => {
    console.log("Subscribe clicked with email:", email);
    setEmail("");
  };

  const openLegalModal = (type) => {
    setLegalModalType(type);
    setLegalModalOpen(true);
  };

  return (
    <footer className="border-t border-border bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-10 sm:mb-12 grid gap-8 sm:gap-10 md:gap-12 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="EduBot" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full" />
              <span className="text-lg sm:text-xl font-bold">{t("hero.badge")}</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">+201098963742</p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t("hero.subheadline")}
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">{t("footer.quickLinks")}</h3>
            <ul className="grid grid-cols-2 gap-x-0 gap-y-0 text-xs sm:text-sm">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-foreground inline-block min-h-[44px] flex items-center"
                    data-testid={`link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">{t("footer.newsletter")}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t("footer.subscribeText")}
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder={t("footer.enterEmail")}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="flex-1 text-sm"
                data-testid="input-newsletter-email"
              />
              <Button size="icon" onClick={handleSubscribe} data-testid="button-subscribe" className="flex-shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:pt-8 text-xs sm:text-sm text-muted-foreground md:flex-row">
          <p className="text-center md:text-left">{t("footer.rightsReserved")}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => openLegalModal("privacy")}
              className="transition-colors hover:text-foreground text-start min-h-[44px] flex items-center"
              data-testid="link-privacy-policy"
            >
              {t("footer.privacyPolicy")}
            </button>
            <button
              onClick={() => openLegalModal("terms")}
              className="transition-colors hover:text-foreground text-start min-h-[44px] flex items-center"
              data-testid="link-terms-conditions"
            >
              {t("footer.termsConditions")}
            </button>
          </div>
          <div className="flex gap-4 sm:gap-4">
            <a href="https://www.linkedin.com/in/mohamed-mousad-elgazar/" className="transition-colors hover:text-foreground p-2" data-testid="link-linkedin" target="_blank" rel="noopener noreferrer">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href="https://www.youtube.com/@mohamedelgazar7042" className="transition-colors hover:text-foreground p-2" data-testid="link-youtube" target="_blank" rel="noopener noreferrer">
              <Youtube className="h-5 w-5" />
            </a>
            <a href="https://mail.google.com/mail/?view=cm&fs=1&to=edubotegypt@gmail.com&su=Hello%20EduBot!" className="transition-colors hover:text-foreground p-2" data-testid="link-mail" target="_blank" rel="noopener noreferrer">
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
      <LegalModal
        open={legalModalOpen}
        onOpenChange={setLegalModalOpen}
        type={legalModalType}
      />
    </footer>
  );
}
