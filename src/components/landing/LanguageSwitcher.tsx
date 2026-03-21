import { type Language, languageLabels, supportedLanguages } from "@/lib/i18n";

interface LanguageSwitcherProps {
  currentLanguage: Language;
  onChange: (language: Language) => void;
}

const LanguageSwitcher = ({ currentLanguage, onChange }: LanguageSwitcherProps) => (
  <div className="flex items-center gap-1.5" aria-label="Language switcher">
    {supportedLanguages.map((language) => {
      const label = languageLabels[language];
      const isActive = currentLanguage === language;

      return (
        <button
          key={language}
          type="button"
          onClick={() => onChange(language)}
          aria-label={label.full}
          aria-pressed={isActive}
          className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm transition-all ${
            isActive
              ? "border-primary bg-primary text-primary-foreground shadow-soft"
              : "border-border/60 bg-background text-foreground hover:border-primary/40 hover:bg-primary/5"
          }`}
        >
          <span className="text-base leading-none">{label.flag}</span>
        </button>
      );
    })}
  </div>
);

export default LanguageSwitcher;
