import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

export function LanguageSelector() {
  const { currentLanguage, setLanguage, availableLanguages, translate } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Globe className="h-5 w-5" />
          <span className="sr-only">{translate("select_language")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {availableLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.id}
            onClick={() => setLanguage(lang)}
            className={currentLanguage.id === lang.id ? "bg-accent" : ""}
          >
            <span className="flex-1">{lang.native_name}</span>
            <span className="text-muted-foreground">({lang.name})</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}