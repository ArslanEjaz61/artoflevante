"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { COUNTRIES, CountryOption } from "@/lib/mobile";

interface CountryCodePickerProps {
  value: string;
  onChange: (code: string) => void;
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

  const selectedCountry =
    COUNTRIES.find((c) => c.code === value) ||
    COUNTRIES[0];

  const filteredCountries = COUNTRIES.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.includes(q) ||
      `+${c.code}`.includes(q)
    );
  });

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
    onChange(c.code);
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
        className="flex items-center gap-2 px-3.5 py-3.5 bg-white border border-[#EAE3DC] hover:border-[#0E331E]/40 rounded-xl text-xs font-bold text-[#1E1815] shadow-2xs transition-all cursor-pointer disabled:opacity-50"
      >
        <span className="text-base leading-none">{selectedCountry.flag}</span>
        <span className="font-extrabold text-xs text-[#1E1815]">
          {selectedCountry.name}
        </span>
        <span className="font-mono text-[11px] font-bold text-[#7A6E67]">
          +{selectedCountry.code}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#7A6E67] transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#0E331E]" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-white border border-[#EAE3DC] rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Header */}
          <div className="p-2.5 border-b border-[#F0EBE6] bg-[#FAF7F4]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#7A6E67] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search country or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8.5 pr-3 py-2 bg-white border border-[#EAE3DC] rounded-xl text-xs font-medium text-[#1E1815] placeholder:text-[#B5AAA2] focus:outline-none focus:border-[#0E331E] transition-colors"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
            {filteredCountries.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#7A6E67]">
                No country found
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = c.code === value;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#0E331E]/10 text-[#0E331E] font-black"
                        : "text-[#1E1815] hover:bg-[#FAF7F4] font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base leading-none shrink-0">
                        {c.flag}
                      </span>
                      <span className="truncate">{c.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`font-mono text-[11px] px-1.5 py-0.5 rounded-md ${
                          isSelected
                            ? "bg-[#0E331E] text-white font-bold"
                            : "bg-[#F0EBE6] text-[#5C504A] font-semibold"
                        }`}
                      >
                        +{c.code}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#0E331E] shrink-0" />
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
