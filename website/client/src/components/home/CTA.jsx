import { Button } from "@/components/edubot/ui/button";
import { Apple, Monitor, Store } from "lucide-react";

export default function CTA() {
  const handleClick = (label) => () => {
    console.log(`${label} clicked`);
  };

  return (
    <section className="py-20 px-6 scroll-mt-32" id="download">
      <div className="mx-auto max-w-4xl space-y-8 text-center">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold md:text-4xl">Get EduBot Now!</h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Download our app or access it from your browser to start your AI-powered learning journey today.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            variant="secondary"
            className="min-w-[200px] px-8 text-base"
            onClick={handleClick("Google Play download")}
            data-testid="button-google-play"
          >
            <Store className="mr-2 h-5 w-5" />
            Google Play
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="min-w-[200px] px-8 text-base"
            onClick={handleClick("App Store download")}
            data-testid="button-app-store"
          >
            <Apple className="mr-2 h-5 w-5" />
            App Store
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="min-w-[200px] px-8 text-base"
            onClick={handleClick("Web version")}
            data-testid="button-web-version"
          >
            <Monitor className="mr-2 h-5 w-5" />
            Web Version
          </Button>
        </div>
      </div>
    </section>
  );
}
