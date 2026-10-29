// Neutral ambiance photography (stock — not real listings) used until the realtor
// uploads her own media through the admin panel.

export const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80";

export const PROPERTY_FALLBACK =
  "https://images.unsplash.com/photo-1646987916641-1f3c8992daa2?auto=format&fit=crop&w=1200&q=70";

export interface LifestyleCategory {
  title: string;
  description: string;
  image: string;
  to: string;
}

export const LIFESTYLE_CATEGORIES: LifestyleCategory[] = [
  {
    title: "Primeiro apartamento",
    description: "Compactos e práticos para começar sua vida nova.",
    image:
      "https://images.unsplash.com/photo-1646987916641-1f3c8992daa2?auto=format&fit=crop&w=900&q=70",
    to: "/comprar?property_type=apartamento",
  },
  {
    title: "Imóveis para investir",
    description: "Oportunidades com bom potencial de valorização e renda.",
    image:
      "https://images.unsplash.com/photo-1757924461488-ef9ad0670978?auto=format&fit=crop&w=900&q=70",
    to: "/comprar",
  },
  {
    title: "Alto padrão",
    description: "Imóveis exclusivos de médio e alto padrão.",
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=900&q=70",
    to: "/comprar?min_price=1000000",
  },
  {
    title: "Casas com quintal",
    description: "Espaço para as crianças, o pet e o churrasco de domingo.",
    image:
      "https://images.unsplash.com/photo-1710046385385-a37df445b619?auto=format&fit=crop&w=900&q=70",
    to: "/comprar?property_type=casa&features=quintal",
  },
  {
    title: "Apartamentos com lazer",
    description: "Piscina, academia e salão de festas no condomínio.",
    image:
      "https://images.unsplash.com/photo-1670589953903-b4e2f17a70a9?auto=format&fit=crop&w=900&q=70",
    to: "/comprar?property_type=apartamento&features=piscina",
  },
  {
    title: "Chácaras e imóveis de campo",
    description: "Tranquilidade e contato com a natureza, pertinho da cidade.",
    image:
      "https://images.unsplash.com/photo-1604715686140-d5bef96c8b9d?auto=format&fit=crop&w=900&q=70",
    to: "/comprar?property_type=chacara",
  },
];
