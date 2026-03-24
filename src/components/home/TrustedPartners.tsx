import React from 'react';

interface Partner {
  name: string;
  color: string;
  group?: string;
}

const partners: Partner[] = [
  // 🔴 Raymond Group
  { name: "ColorPlus", color: "#6B1F1F", group: "Raymond Group" },
  { name: "Park Avenue", color: "#000000", group: "Raymond Group" },
  { name: "JK Investor", color: "#3A3A3A", group: "Raymond Group" },

  // 🟠 Others
  { name: "Linen Club (Aditya Birla)", color: "#8B6F47" },
  { name: "Donear", color: "#1A2A5A" },
  { name: "Arvind Lifestyle", color: "#003A8F" },
  { name: "Bombay Rayon Fashion Ltd", color: "#6A1B1B" },
  { name: "Shreeji Lifestyle", color: "#8A6A2F" },
  { name: "Siyaram's", color: "#2E2E2E" },
];

const TrustedPartners = () => {
  return (
    <section className="bg-background py-16 md:py-20">
      <div className="container px-4 mx-auto">

        {/* Heading */}
        <div className="text-center mb-12">
          <span className="mb-2 inline-block font-serif text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Trusted Network
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-[#2A2623]">
            Trusted by Industry Leaders
          </h2>
        </div>

        {/* 🔴 Raymond Group */}
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-400 mb-6">
            Raymond Group
          </p>

          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            {partners
              .filter(p => p.group === "Raymond Group")
              .map((partner, index) => (
                <span
                  key={index}
                  className="text-neutral-400 text-base md:text-lg font-serif tracking-wide cursor-default transition-all duration-300 hover:scale-105"
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = partner.color;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#9CA3AF";
                  }}
                >
                  {partner.name}
                </span>
              ))}
          </div>
        </div>

        {/* 🟠 Other Brands */}
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-400 mb-6">
            Other Partners
          </p>

          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            {partners
              .filter(p => !p.group)
              .map((partner, index) => (
                <span
                  key={index}
                  className="text-neutral-400 text-base md:text-lg font-serif tracking-wide cursor-default transition-all duration-300 hover:scale-105"
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = partner.color;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#9CA3AF";
                  }}
                >
                  {partner.name}
                </span>
              ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default TrustedPartners;