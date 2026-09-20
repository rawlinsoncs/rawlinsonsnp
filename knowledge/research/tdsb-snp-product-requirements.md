---
type: Research Note
title: TDSB SNP Product Choice Requirements — Full Rule Set
description: Complete, machine-encodable nutrition criteria for the TDSB/City of Toronto Student Nutrition Program morning snack, sourced from Ontario provincial guidelines (MCCSS 2020) and City of Toronto/TPH summaries. Reconciles the three school-page claims (sugar ≤ 8 g/30 g, sodium ≤ 10% DV, whole grain first ingredient) against authoritative sources.
tags: [snp, nutrition, tdsb, toronto, product-rules, research]
status: stable
generated: { by: opencode/qwen3.6-plus (research agent), at: 2026-09-20T15:00:00Z }
sources:
  - resource: https://files.ontario.ca/mccss-2020-student-nutrition-program-guidelines-en-2021-11-29.pdf
    title: Student Nutrition Program — Nutrition Guidelines 2020
    last_modified: "2021-11-29"
  - resource: https://www.ontario.ca/document/student-nutrition-program-nutrition-guidelines-2020/section-3-food-and-beverage-choice-tables
    title: Section 3 — Food and Beverage Choice Tables (SNP Nutrition Guidelines 2020)
    last_modified: "2024-02-02"
  - resource: https://www.toronto.ca/community-people/health-wellness-care/health-programs-advice/student-nutrition-program/nutrition-guidelines/
    title: Nutrition Guidelines — City of Toronto Student Nutrition Program
    last_modified: "2024-04-16"
  - resource: https://www.toronto.ca/wp-content/uploads/2017/11/962f-tph-SNPguideline-fs-eng-2017-09-05.pdf
    title: Nutrition Guideline Summary for Student Nutrition Programs (Toronto Public Health)
    last_modified: "2017-09-05"
  - resource: https://www.tdsb.on.ca/Elementary-School/Supporting-You/Student-Nutrition/Frequently-Asked-Questions
    title: TDSB Student Nutrition — Frequently Asked Questions by Parents & Volunteers
    last_modified: "2026"
  - resource: https://rawlinsoncs.github.io/rawlinsonsnp/docs/teachers/
    title: Rawlinson SNP Teacher Guidance
    last_modified: "2026"
  - resource: https://rawlinsoncs.github.io/rawlinsonsnp/docs/community/
    title: Rawlinson SNP Family Guide
    last_modified: "2026"
---

# TDSB SNP Product Choice Requirements — Full Rule Set

## Authoritative Sources

| # | Document | Publisher | Year/Version | URL |
|---|----------|-----------|--------------|-----|
| 1 | **Student Nutrition Program — Nutrition Guidelines 2020** | Ontario Ministry of Children, Community and Social Services (MCCSS) | 2020, published 2021-11-29 (PDF); web version updated 2024-02-02 | [PDF](https://files.ontario.ca/mccss-2020-student-nutrition-program-guidelines-en-2021-11-29.pdf); [Web](https://www.ontario.ca/document/student-nutrition-program-nutrition-guidelines-2020) |
| 2 | **Section 3: Food and Beverage Choice Tables** (part of Source 1) | MCCSS | Updated 2024-02-02 | [Web](https://www.ontario.ca/document/student-nutrition-program-nutrition-guidelines-2020/section-3-food-and-beverage-choice-tables) |
| 3 | **Nutrition Guidelines — City of Toronto SNP** | City of Toronto / Toronto Public Health | Updated 2024-04-16; "Adapted with permission from Ministry of Children, Community & Social Services, Student Nutrition Program Nutrition Guidelines (2020)" | [Web](https://www.toronto.ca/community-people/health-wellness-care/health-programs-advice/student-nutrition-program/nutrition-guidelines/) |
| 4 | **Nutrition Guideline Summary for SNP** (PDF factsheet) | Toronto Public Health | 2017-09-05 | [PDF](https://www.toronto.ca/wp-content/uploads/2017/11/962f-tph-SNPguideline-fs-eng-2017-09-05.pdf) |

**Source 1 (MCCSS 2020)** is the true owner of the nutrition criteria. Sources 3 and 4 are City of Toronto/TPH adaptations of Source 1 and are consistent with it. All three agree on every numeric threshold.

---

## Rule Set — Consolidated Machine-Encodable Table

### Global Label-Reading Rules

Every packaged product must be evaluated using the **Nutrition Facts table** and the **ingredient list**:

| Field | Rule |
|-------|------|
| Serving size basis | The Nutrition Facts table uses the manufacturer's stated serving size — it may or may not match the SNP portion size. Thresholds below are expressed **per the stated serving size on the label**, not per 100 g (except where noted). |
| % DV (Daily Value) | ≤ 5% DV = "a little"; ≥ 15% DV = "a lot" |
| Sodium threshold (general) | **≤ 10% DV per serving** for all categories |
| Ingredient list order | Ingredients listed in descending order by weight; first ingredient = heaviest |

### Snack Program Structure (AM snack)

Per both MCCSS guidelines and City of Toronto page:

> A **snack** at a Student Nutrition Program includes at least:
> 1. One **vegetable or fruit**, plus
> 2. One **protein food** OR one **whole grain food**

This is the **two-component rule**. Rawlinson's implementation (veg/fruit + whole grain/protein/dairy) matches: under Canada's Food Guide 2019, milk and dairy alternatives are classified as **protein foods**, so "dairy" is not a third component — it falls under component 2.

### Category 1: Vegetables & Fruit

**Serve:**
- Fresh vegetables and fruits (all, except raw sprouts for food safety)
- Frozen vegetables with no added salt or sauce
- Frozen fruits with no added sugar
- Unsweetened applesauce or fruit purées
- Canned fruit in water or 100% juice, drained
- Canned vegetables (drained, rinsed) with sodium **≤ 10% DV per serving**
- Canned tomatoes and tomato-based pasta/pizza sauces with sodium **≤ 10% DV per serving**
- Dried fruit with no added sugar

**Do Not Serve:**
- Vegetable juice, including 100% juice
- Fruit juice, including 100% juice
- Fruit flavoured drinks, punches, cocktails
- Unpasteurized juice or cider
- Fruit leathers
- Sweetened applesauce or fruit purées
- Canned fruit in syrup
- Dried fruit with sugar added
- Vegetable/fruit chips (potato, carrot, banana, plantain)
- French fries, hash browns, instant potatoes
- Battered or deep-fried vegetables or fruits
- Cream-based vegetable soups
- Raw sprouts (alfalfa, bean, clover, radish, mung beans) — food safety
- Fruit flavoured candies (gummies, fruit rolls) including those made with juice
- Jellied desserts that contain fruit

### Category 2: Whole Grain Foods

**Three-part pass criteria — ALL must be met:**

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | **Ingredient list** — whole grain, whole wheat, or bran must be **first** on the ingredient list | Boolean |
| 2 | **Sodium** | ≤ 10% DV per serving |
| 3 | **Sugar** | ≤ 8 g **per 30 g serving** |

**Serve (examples):**
- Whole grain or whole wheat breads, buns, bagels, rolls, English muffins, pitas, tortilla, flatbreads, roti, naan, bannock, chapatti, lavash, challah
- Whole grain or whole wheat pancakes or waffles
- Whole grain or whole wheat pizza crust or dough
- Oatmeal (quick cooking or large flake); instant oatmeal (lightly sweetened only)
- Whole grain cereals
- Whole grain muffins and scones
- Whole grain granola or cereal-type bars (no chocolate/candy/marshmallow/yogurt dip)
- Whole grain crackers, breadsticks
- Popcorn (air popped, unsalted, no butter)
- Brown rice cakes (unflavoured and unsweetened)
- Whole grains (quinoa, oats, bulgur, buckwheat, barley, farro, whole wheat couscous)
- Brown rice, wild rice
- Whole wheat or whole grain noodles, soba, udon, vermicelli
- Polenta

**Do Not Serve:**
- Products where whole grain/whole wheat/bran is **not** first on the ingredient list
- Products where sodium **>** 10% DV per serving
- Products where sugar **>** 8 g per 30 g serving
- Enriched wheat flour or multigrain bread/bagel/buns/etc.
- Flavoured or sugar-coated breads, naan, bagels (cinnamon, raisin, blueberry)
- White pizza crust or dough
- Cereal with chocolate, candies, marshmallows, or sugar-coated pieces
- Regularly sweetened instant oatmeal
- Toaster pastries, pastries, croissants
- Muffins and scones with chocolate, caramel, or candy
- Cakes, cupcakes, donuts, pies, cookies, squares
- Chocolate/yogurt-dipped granola bars or those with marshmallows/candy/chocolate
- Non-air-popped popcorn or popcorn with added flavours
- Pretzels, tortilla chips, pita chips, nachos, chip-like snack foods
- Flavoured/sweetened brown rice cakes
- White rice, rice noodles, enriched white pasta
- Flavoured pre-packaged grains/rice/pasta
- Instant noodle soup

### Category 3: Protein Foods

**General sodium threshold: ≤ 10% DV per serving** (applies across all protein sub-categories unless noted).

#### Milk
- **Serve:** Plain skim, 1%, or 2% cow's milk; skim/partly skimmed milk powder; canned evaporated milk (cooking/baking); buttermilk (cooking/baking)
- **Do Not Serve:** Flavoured milk (chocolate, strawberry); hot chocolate; milkshakes; 3.25% (homogenized) milk; table cream, coffee cream, whipping cream; unpasteurized milk

#### Milk Alternatives (Plant-based beverages)
- **Serve:** Unsweetened/unflavoured, fortified soy beverage; unsweetened/unflavoured plant-based beverages with ≥ 6 g protein per 250 ml AND ≥ 30% DV calcium AND ≥ 30% DV vitamin D per 250 ml
- **Do Not Serve:** Unfortified plant-based beverages; flavoured/sweetened plant-based beverages
- **Note:** Unsweetened plant-based beverages that don't meet protein/calcium/vitamin D thresholds (coconut, rice, almond, potato, oat) may be served **only** to accommodate allergies when soy is not an option.

#### Yogurt
- **Sugar threshold:** ≤ 11 g per 100 g serving (different basis than whole grain)
- **Milk fat threshold:** ≤ 2% milk fat
- **Serve:** Plain yogurt/soy yogurt/kefir (≤ 2% MF); flavoured/sweetened yogurt/soy yogurt/kefir (≤ 11 g sugar/100 g AND ≤ 2% MF)
- **Do Not Serve:** Yogurts with added sugar/candy/chocolate; frozen yogurt; drinkable yogurt; unpasteurized-milk yogurts

#### Cheese
- **Milk fat:** ≤ 20% MF when possible
- **Sodium:** ≤ 10% DV per serving (for cheese strings, cheese curds)
- **Serve:** Hard and soft non-processed cheese from pasteurized milk (cheddar, mozzarella, parmesan, monterey jack, havarti, gouda, swiss, paneer, feta, ricotta, cottage cheese) with ≤ 20% MF; cheese strings/curds with ≤ 20% MF and ≤ 10% DV sodium
- **Do Not Serve:** Processed cheese slices; unpasteurized cheese; soft unpasteurized cheeses (brie, camembert, blue-veined); breaded/fried cheese; cheese curds with > 10% DV sodium

#### Eggs
- **Serve:** Graded eggs from approved source; plain pasteurized liquid whole egg; pre-boiled hard cooked eggs
- **Do Not Serve:** Ungraded eggs; unpasteurized eggs; seasoned/flavoured liquid egg; raw/undercooked eggs or dishes

#### Nut, Seed, and Legume Butters
- **Serve:** Nut/seed/legume butters (peanut, almond, walnut, sesame, sunflower, pea, soy); whole nuts and seeds (dry roasted or unroasted, no added salt/sugar/oil)
- **Do Not Serve:** Nut/legume/seed butters with added sugar (chocolate, chocolate hazelnut, honey, berry); salted or coated nuts/seeds
- **Note:** Always follow school anaphylaxis policy

#### Tofu, Beans, Lentils
- **Sodium threshold:** ≤ 10% DV per serving
- **Serve:** Dried beans/lentils/peas; hummus/bean dips (≤ 10% DV); baked chickpeas (≤ 10% DV); lentil/chickpea/plant-based pastas (≤ 10% DV); canned beans/lentils/chickpeas (≤ 10% DV, drained/rinsed); tofu/tempeh/TVP (≤ 10% DV); plant-based burgers/meatballs (≤ 10% DV)
- **Do Not Serve:** Canned baked beans in tomato sauce with pork/molasses/maple syrup; store-bought breaded/fried meat alternatives; simulated meat strips; plant-based hotdogs/sausages/bacon; frozen/prepared tacos/burritos; tofu dessert

#### Fish
- **Sodium threshold:** ≤ 10% DV per serving
- **Serve:** Fresh/frozen/canned fish (≤ 10% DV, drained/rinsed, low mercury: cod, sole, haddock, salmon, tilapia, trout, canned light tuna, whitefish)
- **Do Not Serve:** Breaded/battered fried fish; high-mercury fish (canned albacore tuna); cold smoked fish

#### Meat
- **Sodium threshold:** ≤ 10% DV per serving
- **Serve:** Fresh/frozen/ground/pre-cooked lean cuts (beef, pork loin, skinless chicken/turkey, patties, meatballs) with ≤ 10% DV; canned chicken/turkey (drained/rinsed); pre-cooked chicken/turkey
- **Do Not Serve:** Prepared/cured meats (wieners, sausages, pepperoni); deli meats (bologna, salami, summer sausage, deli roast beef/turkey/chicken); breaded/fried meats; ham; ribs; bacon (side, back, turkey/chicken, imitation); meat pies

### Category 4: Miscellaneous — Always Do Not Serve

- Caffeinated foods/beverages (coffee, tea, iced tea)
- Diet pop, regular pop
- Energy drinks, sports drinks
- Flavoured or vitamin water
- "Protein" or meal replacement drinks and bars (except medically indicated by parent/caregiver)
- Candy (including yogurt-covered, gummy, licorice, fruit flavoured)
- Chocolate, chocolate bars (including energy/protein bars)
- Marshmallows
- Jellied-type desserts
- Frozen treats (ice cream, freezies, popsicles, slushies, frozen juice snacks)
- Hard margarines, lard, shortening, palm oil
- Foods with artificial trans fat
- Foods with sugar substitutes or sweeteners
- Pudding

### Minor Ingredients (permitted in small amounts)

| Item | Max per student |
|------|----------------|
| Condiments (ketchup, relish, mustard) | ~1-2 tsp |
| Cream cheese | ~1-2 tsp |
| Salsa | ~3 tbsp |
| Gravies, sauces | ~1-2 tbsp |
| Dips (salad dressing, sour cream) | ~1-2 tbsp |
| Baba ganoush, spinach dip | ~3 tbsp |
| Oils, non-hydrogenated margarine, butter | ~1-2 tsp |
| Toppings (coconut, parmesan) | ~2-3 tsp |
| Olives | ~4-5 per student |
| Pickles | ~1 medium per student |
| Honey, jam, jelly, marmalade, fruit butter, syrup | ~1-2 tsp |

**Note:** Cream cheese is **not** a protein food under CFG and does not count as a protein serving.

---

## Reconciliation with School Teacher-Guidance Claims

The Rawlinson teacher guidance page (knowledge/program/nutrition-standards.md) claims:

| Claim | School Page Value | Authoritative Source | Verdict |
|-------|-------------------|---------------------|---------|
| Whole grain first ingredient | "whole grain/wheat first in ingredients" | MCCSS: "whole grain, whole wheat, or **bran** is first on the ingredient list" | **Correct but incomplete** — missing "bran" |
| Sugar threshold | "≤ 8 g per 30 g serving" | MCCSS & City of Toronto: "≤ 8 g per 30 g serving" (whole grain products only) | **Confirmed** |
| Sodium threshold | "≤ 10% Daily Value" | MCCSS & City of Toronto: "≤ 10% DV per serving" (all categories) | **Confirmed** |

### What the school page gets right
- The sugar threshold (≤ 8 g/30 g) is exactly correct for whole grain products.
- The sodium threshold (≤ 10% DV) is correct as a general rule.
- The whole grain ingredient position rule is directionally correct.

### What the school page omits or oversimplifies
1. **Bran is also acceptable** as the first ingredient for whole grain products, not just whole grain/whole wheat.
2. **Sugar thresholds are category-specific**: ≤ 8 g/30 g applies to whole grain products; ≤ 11 g/100 g applies to flavoured yogurt; not a single universal sugar number.
3. **Sodium applies across ALL categories**, not just whole grain — vegetables (canned), protein foods (cheese strings, tofu, fish, meat, beans, hummus) all have the ≤ 10% DV threshold.
4. **Milk fat limits**: yogurt ≤ 2% MF; cheese ≤ 20% MF (when possible) — absent from school page.
5. **3.25% (homogenized) milk** is prohibited — only skim/1%/2% is served.
6. **Flavoured milk** (chocolate, strawberry) and **hot chocolate** are prohibited.
7. **"Do not serve" is categorical**: all items in the "do not serve" category are always do-not-serve regardless of ingredient list — this is an explicit rule on the City of Toronto page.
8. **Serving size basis**: the sugar threshold for whole grain is explicitly "per 30 g serving" — if a product's Nutrition Facts uses a different serving size (e.g., 40 g), the sugar value must be **pro-rated** to a 30 g equivalent before comparing against 8 g.
9. **Vegetable/fruit juice (including 100%)** is prohibited — a common misconception.
10. **Peanut/nut policy**: the school page doesn't mention that schools are peanut-free and nut/seed choices must follow the school anaphylaxis policy.

---

## Procurement Implications for Rawlinson (No Kitchen)

Rawlinson operates with **no prep kitchen** and serves **pre-packaged, ready-to-eat items only**. Key implications:

1. **All items must be purchased pre-packaged** from approved vendors (TFSS, Healthy Selections, Millennium Bakery, Costco, etc.). No home-prepared food.
2. **Vendors must provide product specification sheets** or the coordinator must check labels against the criteria above before ordering.
3. **Millennium Bakery items** (muffins, bagels) must be verified: whole grain/whole wheat/bran first in ingredients, ≤ 8 g sugar/30 g, ≤ 10% DV sodium.
4. **TFSS donated items** (fruit, dairy) are typically fresh produce and plain dairy — these automatically pass (fresh fruit/veg has no label needed; plain milk/yogurt meets criteria).
5. **Healthy Selections orders** (custom items, granola bars, crackers) require label verification before ordering.

---

## Notes

- The provincial guidelines are currently (as of June 2026) under review — Ontario Dietitians in Public Health submitted recommendations to MCCSS for an update. Monitor for changes.
- The City of Toronto page last updated 2024-04-16; the Ontario web version last updated 2024-02-02. Both consistent.
- PPM 150 (School Food and Beverage Policy) is the Ontario Ministry of Education policy for food **sold** in schools; the SNP guidelines apply to food **provided** in student nutrition programs. They are related but distinct frameworks — SNP guidelines are the applicable rules for Rawlinson's free snack program.
