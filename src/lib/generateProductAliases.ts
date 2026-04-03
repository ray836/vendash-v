import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic() // uses ANTHROPIC_API_KEY from env

/**
 * Calls Claude Haiku to generate 3–6 alternate names for a product.
 *
 * Size/weight variants are intentionally preserved in all aliases — e.g. "Lay's
 * Original 1.875oz" generates aliases like "Lays 1.875oz", not bare "Lays".
 * This prevents cross-matching between products that share a brand name but
 * differ only in size.
 *
 * Returns [] (silently) if the API call fails so callers never block on it.
 */
export async function generateProductAliases(name: string): Promise<string[]> {
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `You are a product naming assistant for a vending machine management system.
Given this product name: "${name}"
Generate a JSON array of 3-6 alternate names or common variations that someone might use to refer to this product (brand abbreviations, common nicknames, full names, name without brand, etc.).

IMPORTANT: If the product name includes a size or weight (e.g. "1oz", "2.5oz", "12ct", "20 fl oz"), every alias you generate MUST also include that exact size/weight. This ensures size variants of the same product (e.g. 1oz vs 2.5oz) are never confused with each other.

Only return valid JSON array of strings.
Example for "Lay's Original 1.875oz": ["Lays 1.875oz", "Lay's Classic 1.875oz", "Classic Potato Chips 1.875oz", "Lays Original 1.875oz"]
Example for "Coca-Cola 20 fl oz": ["Coke 20 fl oz", "Coca Cola 20oz", "Classic Coke 20 fl oz"]`,
        },
      ],
    })
    const text = message.content[0].type === 'text' ? message.content[0].text : '[]'
    const match = text.match(/\[[\s\S]*\]/)
    return match ? (JSON.parse(match[0]) as string[]) : []
  } catch {
    return []
  }
}
