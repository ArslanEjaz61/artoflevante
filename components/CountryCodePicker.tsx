"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { COUNTRIES, CountryOption } from "@/lib/mobile";

interface CountryCodePickerProps {
  value: string; // Dial code e.g. "92" or ISO e.g. "PK"
  onChange: (code: string, country?: CountryOption) => void;
  className?: string;
  disabled?: boolean;
}

export function CountryCodePicker({
  value,
  onChange,
  className = "",
  disabled = false,
}: CountryCodePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const selectedCountry = useMemo(() => {
    const val = String(value || "").trim().toUpperCase();
    return (
      COUNTRIES.find((c) => c.iso === val) ||
      COUNTRIES.find((c) => c.code === val.replace(/^\+/, "")) ||
      COUNTRIES[0]
    );
  }, [value]);

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return COUNTRIES;
    const q = search.toLowerCase().trim();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.iso.toLowerCase().includes(q) ||
        c.code.includes(q) ||
        `+${c.code}`.includes(q)
    );
  }, [search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (c: CountryOption) => {
    onChange(c.code, c);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className={`relative shrink-0 ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-3 bg-white border border-[#EAE3DC] hover:border-[#143F26]/60 rounded-xl text-xs font-bold text-[#1E1815] shadow-2xs transition-all cursor-pointer disabled:opacity-50 shrink-0 h-11"
        aria-label={`Country code +${selectedCountry.code} (${selectedCountry.name})`}
      >
        <span className="text-base leading-none shrink-0">{selectedCountry.flag}</span>
        <span className="font-mono text-xs font-bold text-[#1E1815] shrink-0">
          +{selectedCountry.code}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#7A6E67] shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#143F26]" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 sm:w-88 bg-white border border-[#EAE3DC] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Header */}
          <div className="p-2.5 border-b border-[#F0EBE6] bg-[#FAF7F4]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#7A6E67] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search country, code (+92), or ISO (PK)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8.5 pr-3 py-2 bg-white border border-[#EAE3DC] rounded-xl text-xs font-medium text-[#1E1815] placeholder:text-[#B5AAA2] focus:outline-none focus:border-[#143F26] transition-colors"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
            {filteredCountries.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#7A6E67]">
                No country found for &quot;{search}&quot;
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected =
                  c.iso === selectedCountry.iso && c.code === selectedCountry.code;
                return (
                  <button
                    key={`${c.iso}-${c.code}`}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#143F26]/10 text-[#143F26] font-black"
                        : "text-[#1E1815] hover:bg-[#FAF7F4] font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      <span className="text-base leading-none shrink-0">
                        {c.flag}
                      </span>
                      <span className="truncate font-semibold">{c.name}</span>
                      <span className="text-[10px] text-[#7A6E67] font-mono shrink-0 font-bold uppercase">
                        {c.iso}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[10px] text-[#9A8C83] hidden sm:inline">
                        {c.placeholder}
                      </span>
                      <span
                        className={`font-mono text-[11px] px-1.5 py-0.5 rounded-md ${
                          isSelected
                            ? "bg-[#143F26] text-white font-bold"
                            : "bg-[#F0EBE6] text-[#5C504A] font-semibold"
                        }`}
                      >
                        +{c.code}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#143F26] shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
