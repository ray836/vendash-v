import { z } from "zod"

// A product in the shared, app-maintained catalog. Read-only to owners; they
// "pick" one to clone it into their org-scoped products (see products.sourceStandardId).
export const StandardProductDTO = z.object({
  id: z.string(),
  name: z.string(),
  recommendedPrice: z.number(),
  category: z.string(),
  image: z.string(),
  vendorLink: z.string().optional(),
  vendorSku: z.string().optional(),
  barcode: z.string().optional(),
  caseCost: z.number(),
  caseSize: z.number(),
  shelfLifeDays: z.number().optional(),
  region: z.string().optional(),
})
export type StandardProductDTO = z.infer<typeof StandardProductDTO>

// What the setup catalog grid renders: every standard product plus whether the
// current org has already cloned it (so the UI can show an "Added" state).
export const StandardCatalogEntryDTO = StandardProductDTO.extend({
  alreadyAdded: z.boolean(),
})
export type StandardCatalogEntryDTO = z.infer<typeof StandardCatalogEntryDTO>
