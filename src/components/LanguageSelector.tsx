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
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-accent"
          aria-label={translate("select_language")}
        >
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {availableLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.id}
            onClick={() => setLanguage(lang)}
            className={`flex items-center justify-between ${
              currentLanguage.id === lang.id ? "bg-accent" : ""
            }`}
          >
            <span>{lang.native_name}</span>
            <span className="text-muted-foreground text-sm">({lang.name})</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}