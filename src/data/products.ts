import watch1 from "@/assets/watch-1.jpg";
import watch2 from "@/assets/watch-2.jpg";
import watch3 from "@/assets/watch-3.jpg";
import watch4 from "@/assets/watch-4.jpg";
import watch1Detail from "@/assets/watch-1-detail.jpg";
import watch2Detail from "@/assets/watch-2-detail.jpg";
import watch3Detail from "@/assets/watch-3-detail.jpg";
import watch4Detail from "@/assets/watch-4-detail.jpg";

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  gallery: string[];
  specs: {
    diameter: string;
    movement: string;
    crystal: string;
    waterResistance: string;
    caseMaterial: string;
    strapMaterial: string;
  };
  description: string;
  reference: string;
  unitsAvailable: number;
}

export const products: Product[] = [
  {
    id: "obsidian-classic",
    name: "Obsidian Classic",
    price: 2450,
    image: watch1,
    gallery: [watch1, watch1Detail],
    specs: {
      diameter: "40mm",
      movement: "Automático — Cal. Z01",
      crystal: "Zafiro antirreflejante",
      waterResistance: "50m",
      caseMaterial: "Acero inoxidable 316L",
      strapMaterial: "Cuero italiano negro",
    },
    description:
      "El Obsidian Classic es la esencia de Zyra destilada en su forma más pura. Una caja de 40mm en acero pulido con esfera blanca y movimiento automático manufactura. Cada detalle ha sido calibrado para transmitir precisión sin ornamento.",
    reference: "ZYR-OC-001",
    unitsAvailable: 24,
  },
  {
    id: "cobalt-diver",
    name: "Cobalt Diver",
    price: 3200,
    image: watch2,
    gallery: [watch2, watch2Detail],
    specs: {
      diameter: "42mm",
      movement: "Automático — Cal. Z03 Diver",
      crystal: "Zafiro con AR doble cara",
      waterResistance: "200m",
      caseMaterial: "Acero inoxidable 316L",
      strapMaterial: "Brazalete acero con cierre micro-ajuste",
    },
    description:
      "Ingeniería submarina sin concesiones estéticas. El Cobalt Diver combina una luneta cerámica unidireccional con el movimiento Cal. Z03 certificado a 200 metros. La esfera azul cobalto cambia de tono bajo distintas condiciones de luz.",
    reference: "ZYR-CD-002",
    unitsAvailable: 12,
  },
  {
    id: "rose-heritage",
    name: "Rose Heritage",
    price: 4100,
    image: watch3,
    gallery: [watch3, watch3Detail],
    specs: {
      diameter: "38mm",
      movement: "Cuerda manual — Cal. Z05",
      crystal: "Zafiro abovedado",
      waterResistance: "30m",
      caseMaterial: "Oro rosa 18K",
      strapMaterial: "Cuero aligátor marrón oscuro",
    },
    description:
      "Una pieza que rinde homenaje a la relojería clásica con los estándares de manufactura de Zyra. El calibre Z05 de cuerda manual ofrece 72 horas de reserva de marcha en una caja de oro rosa de 38mm. Elegancia reducida a lo esencial.",
    reference: "ZYR-RH-003",
    unitsAvailable: 8,
  },
  {
    id: "void-stealth",
    name: "Void Stealth",
    price: 2800,
    image: watch4,
    gallery: [watch4, watch4Detail],
    specs: {
      diameter: "41mm",
      movement: "Automático — Cal. Z01 DLC",
      crystal: "Zafiro con tratamiento AR negro",
      waterResistance: "100m",
      caseMaterial: "Acero con recubrimiento DLC negro",
      strapMaterial: "Caucho FKM negro texturizado",
    },
    description:
      "Invisible y presente. El Void Stealth desaparece en la muñeca con su acabado DLC negro total, pero su presencia se siente en cada detalle: desde las agujas satinadas hasta el índice luminova aplicado a mano.",
    reference: "ZYR-VS-004",
    unitsAvailable: 16,
  },
];

export const getProductById = (id: string) => products.find((p) => p.id === id);
