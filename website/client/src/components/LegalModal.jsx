import React from "react";
import ReactMarkdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/edubot/ui/dialog";
import { Button } from "@/components/edubot/ui/button";
import { Separator } from "@/components/edubot/ui/separator";
import { PRIVACY_POLICY, TERMS_CONDITIONS } from "../constants/legalContent";

export default function LegalModal({ open, onOpenChange, type }) {
  const content = type === "privacy" ? PRIVACY_POLICY : TERMS_CONDITIONS;
  const title = type === "privacy" ? "Privacy Policy" : "Terms & Conditions";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-full sm:max-w-[800px] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 shrink-0">
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-base">
            Please read our {title.toLowerCase()} carefully.
          </DialogDescription>
        </DialogHeader>
        <Separator className="shrink-0" />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6 text-foreground">
            <ReactMarkdown
              components={{
                h2: ({ node, ...props }) => (
                  <h2 className="text-xl font-bold mt-6 mb-4 text-primary" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground" {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p className="leading-7 mb-4 text-muted-foreground" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground" {...props} />
                ),
                li: ({ node, ...props }) => <li className="leading-6" {...props} />,
                strong: ({ node, ...props }) => (
                  <strong className="font-semibold text-foreground" {...props} />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
        <Separator className="shrink-0" />
        <DialogFooter className="p-6 pt-4 shrink-0">
          <DialogClose asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
