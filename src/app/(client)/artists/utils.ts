// الفئات الثابتة
export const CATEGORIES = [
  { id: "all", name: "All" },
  { id: "bridal", name: "Bridal Makeup" },
  { id: "party", name: "Party Makeup" },
  { id: "editorial", name: "Editorial & Photoshoot" },
  { id: "henna", name: "Henna Night & Engagement" },
  { id: "reception", name: "Bridal & Reception" },
  { id: "photoshoot", name: "Photoshoot Makeup" },
  { id: "runway", name: "Runway & Fashion Show" },
];

// دالة مساعدة للحصول على اسم الفئة من معرفها
export function getCategoryName(categoryId: string): string {
  const category = CATEGORIES.find((cat) => cat.id === categoryId);
  return category ? category.name : categoryId;
}
