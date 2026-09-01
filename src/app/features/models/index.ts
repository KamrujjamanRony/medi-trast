/**
 * API shapes.
 *
 * The previous versions of these interfaces declared their fields as the string
 * *literal* `"string"` (e.g. `id: "string"`), which meant the only assignable
 * value was the seven-character text "string". Every consumer therefore had to
 * fall back to `any`, and the compiler could not catch a single field typo.
 * They are real types now, and nullable fields are marked as such.
 */

export interface Product {
  id: string;
  companyID: number;
  productCategory: string;
  productName: string;
  brand: string | null;
  model: string | null;
  origin: string | null;
  description: string | null;
  aditionalInformation: string | null;
  specialFeature: string | null;
  catalogUrl: string | null;
  imageUrl: string | null;
}

export interface Carousel {
  id: string;
  companyID: number;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
}

export interface About {
  id: string;
  companyID: number;
  heading: string | null;
  title: string | null;
  description: string | null;
  title2: string | null;
  description2: string | null;
  title3: string | null;
  description3: string | null;
  title4: string | null;
  description4: string | null;
  title5: string | null;
  description5: string | null;
}

export interface Address {
  id: string;
  companyID: number;
  address1: string | null;
  address2: string | null;
  phoneNumber1: string | null;
  phoneNumber2: string | null;
  phoneNumber3: string | null;
  email: string | null;
  facebookLink: string | null;
  othersLink1: string | null;
  othersLink2: string | null;
}

/** The product categories the storefront filters by, in menu order. */
export const PRODUCT_CATEGORIES = [
  { slug: 'se', apiValue: 'SURGICAL EQUIPMENT', label: 'Surgical Equipment' },
  { slug: 'mf', apiValue: 'MEDICAL FURNITURE', label: 'Medical Furniture' },
  { slug: 'me', apiValue: 'MEDICAL EQUIPMENT', label: 'Medical Equipment' },
  { slug: 'le', apiValue: 'LABORATORY EQUIPMENT', label: 'Laboratory Equipment' },
  { slug: 'de', apiValue: 'DENTAL EQUIPMENT', label: 'Dental Equipment' },
  { slug: 'ao', apiValue: 'ACCESSORIES & OTHERS', label: 'Accessories & Others' },
] as const;

export type CategorySlug = (typeof PRODUCT_CATEGORIES)[number]['slug'];

export function categoryBySlug(slug: string | null) {
  return PRODUCT_CATEGORIES.find((category) => category.slug === slug) ?? null;
}
