import { useState, useEffect, useRef } from "react";

interface Font {
  name: string;
  category: string;
  importSpec: string;
  weight: string;
  description: string;
}

const fonts: Font[] = [
  // Current
  { name: "DM Serif Display", category: "Current", importSpec: "", weight: "400", description: "Your current heading font" },

  // Classic Serifs
  { name: "Playfair Display", category: "Classic Serif", importSpec: "Playfair+Display:wght@700", weight: "700", description: "Elegant high-contrast display" },
  { name: "Cormorant Garamond", category: "Classic Serif", importSpec: "Cormorant+Garamond:wght@600", weight: "600", description: "Graceful renaissance-inspired" },
  { name: "Libre Baskerville", category: "Classic Serif", importSpec: "Libre+Baskerville:wght@700", weight: "700", description: "Classic bookish dignity" },
  { name: "Crimson Pro", category: "Classic Serif", importSpec: "Crimson+Pro:wght@600", weight: "600", description: "Traditional old-style serif" },
  { name: "EB Garamond", category: "Classic Serif", importSpec: "EB+Garamond:wght@600", weight: "600", description: "Refined classic Garamond revival" },

  // Modern Serifs
  { name: "Fraunces", category: "Modern Serif", importSpec: "Fraunces:opsz,wght@9..144,700", weight: "700", description: "Quirky warm variable serif" },
  { name: "Instrument Serif", category: "Modern Serif", importSpec: "Instrument+Serif", weight: "400", description: "Condensed editorial display" },
  { name: "Lora", category: "Modern Serif", importSpec: "Lora:wght@700", weight: "700", description: "Well-balanced contemporary serif" },
  { name: "Spectral", category: "Modern Serif", importSpec: "Spectral:wght@700", weight: "700", description: "Screen-first modern serif" },

  // Slab Serifs
  { name: "Zilla Slab", category: "Slab Serif", importSpec: "Zilla+Slab:wght@700", weight: "700", description: "Mozilla's modern slab" },
  { name: "Bitter", category: "Slab Serif", importSpec: "Bitter:wght@700", weight: "700", description: "Contemporary screen slab" },
  { name: "Arvo", category: "Slab Serif", importSpec: "Arvo:wght@700", weight: "700", description: "Geometric slab with personality" },

  // Geometric Sans
  { name: "Sora", category: "Geometric Sans", importSpec: "Sora:wght@700", weight: "700", description: "Clean tech-forward geometric" },
  { name: "Space Grotesk", category: "Geometric Sans", importSpec: "Space+Grotesk:wght@700", weight: "700", description: "Engineered mono-inspired sans" },
  { name: "Manrope", category: "Geometric Sans", importSpec: "Manrope:wght@800", weight: "800", description: "Minimal geometric display" },
  { name: "DM Sans", category: "Geometric Sans", importSpec: "DM+Sans:wght@700", weight: "700", description: "Low contrast geometric sans" },

  // Humanist/Grotesque Sans
  { name: "Bricolage Grotesque", category: "Humanist Sans", importSpec: "Bricolage+Grotesque:wght@700", weight: "700", description: "Eclectic sans with personality" },
  { name: "Plus Jakarta Sans", category: "Humanist Sans", importSpec: "Plus+Jakarta+Sans:wght@700", weight: "700", description: "Friendly polished humanist" },
  { name: "Outfit", category: "Humanist Sans", importSpec: "Outfit:wght@700", weight: "700", description: "Friendly rounded geometric" },
  { name: "Archivo", category: "Humanist Sans", importSpec: "Archivo:wght@700", weight: "700", description: "Versatile grotesque headlines" },

  // Impact/Heavy
  { name: "Black Ops One", category: "Impact", importSpec: "Black+Ops+One", weight: "400", description: "Ultra bold military stencil" },
  { name: "Oswald", category: "Impact", importSpec: "Oswald:wght@700", weight: "700", description: "Condensed gothic display" },
  { name: "Anton", category: "Impact", importSpec: "Anton", weight: "400", description: "Heavy condensed impact" },
  { name: "Alfa Slab One", category: "Impact", importSpec: "Alfa+Slab+One", weight: "400", description: "Ultra bold fat face slab" },

  // Handwritten/Script
  { name: "Pacifico", category: "Handwritten", importSpec: "Pacifico", weight: "400", description: "Casual surf brush script" },
  { name: "Dancing Script", category: "Handwritten", importSpec: "Dancing+Script:wght@700", weight: "700", description: "Lively casual handwritten" },
  { name: "Caveat", category: "Handwritten", importSpec: "Caveat:wght@700", weight: "700", description: "Loose hand-drawn personal" },
  { name: "Satisfy", category: "Handwritten", importSpec: "Satisfy", weight: "400", description: "Formal connected calligraphic" },
  { name: "Kaushan Script", category: "Handwritten", importSpec: "Kaushan+Script", weight: "400", description: "Bold casual brush lettering" },
  { name: "Shadows Into Light", category: "Handwritten", importSpec: "Shadows+Into+Light", weight: "400", description: "Casual architect-style writing" },
];

const categories = [
  "All",
  "Current",
  "Classic Serif",
  "Modern Serif",
  "Slab Serif",
  "Geometric Sans",
  "Humanist Sans",
  "Impact",
  "Handwritten",
];

const categoryColors: Record<string, string> = {
  "Current": "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  "Classic Serif": "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  "Modern Serif": "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  "Slab Serif": "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  "Geometric Sans": "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  "Humanist Sans": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
  "Impact": "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  "Handwritten": "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
};

export default function FontSwitcher() {
  const [selectedIndex, setSelectedIndex] = useState(8);
  const [isOpen, setIsOpen] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState<Set<string>>(new Set(["DM Serif Display"]));
  const [activeCategory, setActiveCategory] = useState("All");
  const listRef = useRef<HTMLDivElement>(null);

  // Load all fonts on mount
  useEffect(() => {
    const allSpecs = fonts
      .filter((f) => f.importSpec)
      .map((f) => `family=${f.importSpec}`);
    const url = `https://fonts.googleapis.com/css2?${allSpecs.join("&")}&display=swap`;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.onload = () => {
      setFontsLoaded(new Set(fonts.map((f) => f.name)));
    };
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  // Apply font to heading elements
  useEffect(() => {
    const font = fonts[selectedIndex];
    const style = `"${font.name}", serif`;
    // Target the main heading and inline serif spans
    document.querySelectorAll("[data-font-target]").forEach((el) => {
      (el as HTMLElement).style.fontFamily = style;
      (el as HTMLElement).style.fontWeight = font.weight;
    });
  }, [selectedIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const filtered = activeCategory === "All" ? fonts : fonts.filter(f => f.category === activeCategory);
      const currentFilteredIdx = filtered.findIndex(f => f.name === fonts[selectedIndex].name);

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        const nextFiltered = (currentFilteredIdx + 1) % filtered.length;
        const globalIdx = fonts.indexOf(filtered[nextFiltered]);
        setSelectedIndex(globalIdx);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const prevFiltered = (currentFilteredIdx - 1 + filtered.length) % filtered.length;
        const globalIdx = fonts.indexOf(filtered[prevFiltered]);
        setSelectedIndex(globalIdx);
      } else if (e.key === "Escape") {
        setIsOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedIndex, activeCategory]);

  const filteredFonts = activeCategory === "All" ? fonts : fonts.filter(f => f.category === activeCategory);
  const currentFont = fonts[selectedIndex];

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[#dc143c] text-white shadow-lg flex items-center justify-center hover:bg-[#b91030] transition-colors"
        title="Toggle font switcher"
      >
        <span className="text-lg font-bold">Aa</span>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-80 max-h-[70vh] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 pt-4 pb-2 border-b border-stone-200 dark:border-stone-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Font Switcher
              </h3>
              <span className="text-xs text-stone-500">
                {selectedIndex + 1}/{fonts.length} &middot; j/k to navigate
              </span>
            </div>
            {/* Current selection */}
            <div className="text-xs text-stone-500 dark:text-stone-400 mb-3">
              Active: <span className="font-medium text-stone-800 dark:text-stone-200">{currentFont.name}</span>
              <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${categoryColors[currentFont.category]}`}>
                {currentFont.category}
              </span>
            </div>
            {/* Category filter pills */}
            <div className="flex flex-wrap gap-1 pb-1">
              {categories.map((cat) => {
                const count = cat === "All" ? fonts.length : fonts.filter(f => f.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                      activeCategory === cat
                        ? "bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font list */}
          <div ref={listRef} className="overflow-y-auto flex-1 py-1">
            {filteredFonts.map((font) => {
              const globalIndex = fonts.indexOf(font);
              const isSelected = globalIndex === selectedIndex;
              const isLoaded = fontsLoaded.has(font.name);
              return (
                <button
                  key={font.name}
                  onClick={() => setSelectedIndex(globalIndex)}
                  className={`w-full text-left px-4 py-2.5 transition-colors ${
                    isSelected
                      ? "bg-stone-100 dark:bg-stone-800"
                      : "hover:bg-stone-50 dark:hover:bg-stone-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xl text-stone-900 dark:text-stone-100 truncate flex-1"
                      style={{
                        fontFamily: isLoaded ? `"${font.name}", serif` : "serif",
                        fontWeight: Number(font.weight),
                      }}
                    >
                      Anhad
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${categoryColors[font.category]}`}>
                      {font.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-medium text-stone-600 dark:text-stone-400">
                      {font.name}
                    </span>
                    <span className="text-[10px] text-stone-400 dark:text-stone-500">
                      {font.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
