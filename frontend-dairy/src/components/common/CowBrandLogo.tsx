import React from "react";

interface CowBrandLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
  subtitle?: string;
}

const sizeMap = {
  xs: { icon: "size-6", box: "size-7 rounded-lg" },
  sm: { icon: "size-7", box: "size-9 rounded-xl" },
  md: { icon: "size-9", box: "size-11 rounded-2xl" },
  lg: { icon: "size-12", box: "size-14 rounded-2xl" },
  xl: { icon: "size-16", box: "size-20 rounded-3xl" },
};

/**
 * High-clarity black-and-white Holstein dairy cow emblem.
 * Optimized for high legibility on small phone screens, headers, app icon, and module cards.
 */
export function CowIcon({ className = "size-7", ariaHidden = true }: { className?: string; ariaHidden?: boolean }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={ariaHidden}
    >
      {/* Background soft pasture ring */}
      <circle cx="24" cy="24" r="22" className="fill-emerald-500/15 dark:fill-emerald-400/20" />
      
      {/* Cow Head Base (White) */}
      <path
        d="M14 22C14 16.4772 18.4772 12 24 12C29.5228 12 34 16.4772 34 22V28C34 32.4183 30.4183 36 26 36H22C17.5817 36 14 32.4183 14 28V22Z"
        fill="#FFFFFF"
        stroke="#1E293B"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Horns */}
      <path
        d="M17 14C15 10 11 11 10 14C11 15 14 15.5 16 15"
        fill="#D97706"
        stroke="#1E293B"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M31 14C33 10 37 11 38 14C37 15 34 15.5 32 15"
        fill="#D97706"
        stroke="#1E293B"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Ears */}
      <path
        d="M14 19C10 19 8 22 9 24C11 25 13 23 14 21"
        fill="#F8FAFC"
        stroke="#1E293B"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M34 19C38 19 40 22 39 24C37 25 35 23 34 21"
        fill="#F8FAFC"
        stroke="#1E293B"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Holstein Black Patches */}
      {/* Right temple patch */}
      <path
        d="M26 12C30 12 34 15 34 19C34 23 31 24 29 22C27 20 28 16 26 12Z"
        fill="#0F172A"
      />
      {/* Left eye patch */}
      <path
        d="M14 21C14 18 16 17 18 18C20 19 21 23 18 24C16 24.5 14 23 14 21Z"
        fill="#0F172A"
      />

      {/* Eyes */}
      <ellipse cx="18.5" cy="21.5" rx="1.5" ry="1.8" fill="#FFFFFF" />
      <circle cx="18.8" cy="21.8" r="0.9" fill="#0F172A" />
      
      <ellipse cx="29.5" cy="21.5" rx="1.5" ry="1.8" fill="#0F172A" />
      <circle cx="29.2" cy="21.2" r="0.4" fill="#FFFFFF" />

      {/* Friendly Pink Muzzle */}
      <rect
        x="17"
        y="27"
        width="14"
        height="8"
        rx="4"
        fill="#FDA4AF"
        stroke="#1E293B"
        strokeWidth="1.8"
      />

      {/* Nostrils */}
      <ellipse cx="21" cy="30.5" rx="1.2" ry="1.4" fill="#881337" />
      <ellipse cx="27" cy="30.5" rx="1.2" ry="1.4" fill="#881337" />

      {/* Subtle gentle smile */}
      <path
        d="M22 32.5C23 33.3 25 33.3 26 32.5"
        stroke="#881337"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Dairy Farm Ear Tag (Yellow tag) */}
      <path
        d="M37 23L39 28H35L37 23Z"
        fill="#FACC15"
        stroke="#A16207"
        strokeWidth="1"
      />
    </svg>
  );
}

export function CowBrandLogo({
  size = "md",
  className = "",
  showText = true,
  subtitle = "Farm Management Platform",
}: CowBrandLogoProps) {
  const currentSize = sizeMap[size];

  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <div
        className={`relative grid shrink-0 place-items-center border border-emerald-500/20 bg-gradient-to-b from-white to-emerald-50/50 shadow-sm transition-transform duration-200 hover:scale-105 dark:border-emerald-500/30 dark:from-slate-800 dark:to-slate-900 ${currentSize.box}`}
      >
        <CowIcon className={currentSize.icon} />
      </div>
      {showText && (
        <div className="min-w-0 leading-tight">
          <p className="truncate font-extrabold tracking-tight text-foreground text-sm sm:text-base flex items-center gap-1.5">
            <span className="font-bold text-emerald-800 dark:text-emerald-300">ଝରଣାଇ</span>
            <span className="text-muted-foreground font-semibold text-xs sm:text-sm">(Jharanai)</span>
          </p>
          <p className="truncate text-[10px] sm:text-[11px] font-medium text-muted-foreground">
            {subtitle || "Dairy Farm · ଦୁଗ୍ଧ ଫାର୍ମ"}
          </p>
        </div>
      )}
    </div>
  );
}
