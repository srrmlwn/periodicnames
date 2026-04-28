# Printful Product Catalog Reference

Variant IDs fetched from the Printful API for use in `printProducts.ts` and `api/print/*`.

---

## Product IDs (Printful product IDs)

| Product | Printful Product ID |
|---|---|
| Enhanced Matte Paper Poster | 1 |
| White Glossy Mug | 19 |
| Bella + Canvas 3001 T-Shirt | 71 |

---

## Product 1 — Enhanced Matte Paper Poster (variant IDs)

| Size | Variant ID |
|---|---|
| 5″×7″ | 16364 |
| 8″×10″ | 4463 |
| 10″×10″ | 6239 |
| 11″×14″ | 14125 |
| 12″×12″ | 4464 |
| 12″×16″ | 1349 |
| 12″×18″ | 3876 |
| 14″×14″ | 6240 |
| 16″×16″ | 4465 |
| 16″×20″ | 3877 |
| 18″×18″ | 6242 |
| 18″×24″ | 1 |
| 20″×30″ | 16365 |
| 24″×36″ | 2 |
| A1 (23.3″×33.1″) | 19527 |
| A2 (16.5″×23.3″) | 19528 |

---

## Product 19 — White Glossy Mug (variant IDs)

| Size | Variant ID |
|---|---|
| 11 oz | 1320 |
| 15 oz | 4830 |
| 20 oz | 16586 |

---

## Product 71 — Bella + Canvas 3001 T-Shirt

590 total variants (83 colors × up to 9 sizes). Sizes available: XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL.

The full variant list lives in `products_71.json` (gitignored). To look up a specific variant ID, query the Printful API:

```
GET https://api.printful.com/products/71
```

### Colors available (83 total)

Aqua, Army, Ash, Asphalt, Athletic Heather, Autumn, Baby Blue, Berry, Black, Black Heather, Brown, Burnt Orange, Cardinal, Charity Pink, Dark Grey, Dark Grey Heather, Forest, Gold, Heather Aqua, Heather Autumn, Heather Brown, Heather Carolina Blue, Heather Clay, Heather Columbia Blue, Heather Deep Teal, Heather Dust, Heather Emerald, Heather Forest, Heather Grass Green, Heather Ice Blue, Heather Kelly, Heather Mauve, Heather Midnight Navy, Heather Mint, Heather Natural, Heather Navy, Heather Olive, Heather Orange, Heather Orchid, Heather Prism Dusty Blue, Heather Prism Ice Blue, Heather Prism Lilac, Heather Prism Mint, Heather Prism Peach, Heather Raspberry, Heather Red, Heather Slate, Heather Team Purple, Heather True Royal, Heather Yellow Gold, Kelly, Leaf, Light Blue, Lilac, Maroon, Mauve, Military Green, Mint, Mustard, Natural, Navy, Ocean Blue, Olive, Orange, Oxblood Black, Pebble, Pink, Red, Sage, Silver, Soft Cream, Soft Pink, Solid White Blend, Steel Blue, Tan, Teal, Team Purple, Toast, True Royal, Turquoise, Vintage Black, Vintage White, White, Yellow

### Common colors for the UI color picker (suggested subset)

| Display name | Printful color name |
|---|---|
| White | White |
| Black | Black |
| Navy | Navy |
| Red | Red |
| Forest Green | Forest |
| Athletic Grey | Athletic Heather |
| Natural | Natural |
| Military Green | Military Green |
