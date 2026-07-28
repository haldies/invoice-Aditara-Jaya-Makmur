import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Download, Share2, LucideIcon } from "lucide-react";
import { PdfAction } from "@/lib/pdfExport";

interface PdfActionButtonProps {
  label: string;
  icon: LucideIcon;
  isLoading: boolean;
  onAction: (action: PdfAction) => void;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  className?: string;
}

export function PdfActionButton({
  label,
  icon: Icon,
  isLoading,
  onAction,
  variant = "outline",
  className = "",
}: PdfActionButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isLoading} variant={variant} className={className}>
          <Icon className="h-4 w-4 shrink-0" /> <span className="truncate">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onAction("preview")} className="cursor-pointer font-medium">
          <Eye className="mr-2 h-4 w-4" /> Preview (Lihat PDF)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("share")} className="cursor-pointer font-medium text-emerald-600 focus:text-emerald-700">
          <Share2 className="mr-2 h-4 w-4" /> Bagikan ke WA
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("download")} className="cursor-pointer font-medium">
          <Download className="mr-2 h-4 w-4" /> Unduh PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
