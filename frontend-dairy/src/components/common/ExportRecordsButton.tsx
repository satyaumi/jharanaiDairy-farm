import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ExportModal } from "./ExportModal";

interface ExportRecordsButtonProps {
  module?: string;
  cowTag?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
}

export function ExportRecordsButton({
  module = "milk",
  cowTag = "all",
  variant = "outline",
  size = "sm",
  className = "",
  label = "Export Records",
}: ExportRecordsButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={`gap-1.5 rounded-xl font-bold ${className}`}
      >
        <Download className="size-4" />
        <span>{label}</span>
      </Button>

      <ExportModal
        open={open}
        onOpenChange={setOpen}
        defaultModule={module}
        defaultCowTag={cowTag}
        title={
          cowTag && cowTag !== "all"
            ? `Export Dossier for Cow ${cowTag}`
            : `Export ${module === "milk" ? "Milk Production" : module === "cows" ? "Herd Cattle" : "Farm"} Records`
        }
      />
    </>
  );
}
