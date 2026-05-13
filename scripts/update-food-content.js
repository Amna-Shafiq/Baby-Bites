import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";

if (existsSync(".env")) {
  const lines = readFileSync(".env", "utf-8").split("\n");
  for (const line of lines) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) {
      const val = rest.join("=").trim().replace(/^["']|["']$/g, "");
      if (!process.env[key.trim()]) process.env[key.trim()] = val;
    }
  }
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const UPDATES = [
  {
    match: "blueberr%",
    data: {
      notes:
        "Blueberries are nutrient-dense, high in fiber, vitamin E, vitamin K, and vitamin C, and among the highest in antioxidants (anthocyanins) of any fruit — supporting heart health and immune function. Important: their round, firm shape is a leading choking hazard until age 4. Always prepare them by smashing or flattening before serving.",
      allergen_notes:
        "Blueberries are not a common allergen. Rare allergies are possible, with potential cross-reactivity with related berries and stone fruits due to lipid transfer proteins. Introduce alongside other foods and watch for any reaction.",
      tip_puree:
        "Cook blueberries until they burst and are completely soft, then blend or mash into yogurt, oatmeal, or porridge. You can also flatten raw ripe blueberries into discs with your thumb — never serve whole.",
      tip_finger_food:
        "Flatten large ripe blueberries into flat discs before every serving — do not offer them whole. Their round, firm shape is a leading choking hazard. Place flattened discs on a tray for baby to pick up.",
      tip_self_feeding:
        "As the pincer grasp develops around 9 months, continue flattening every blueberry into a disc. Whole blueberries remain a choking risk. Let baby practice picking up the flat pieces independently.",
      tip_family_meal:
        "Only introduce whole blueberries after 12 months if your child consistently chews well, does not mouth-stuff, and eats in a calm environment. Dried blueberries must be rehydrated until soft — avoid unmodified dried fruit until after age 2.",
    },
  },
  {
    match: "peach",
    data: {
      notes:
        "Peach is a safe, nutritious summer fruit offering carbohydrates, fiber, potassium, and vitamins A, C, E, and K — supporting energy, digestion, hydration, and immune function. Ripeness is critical: the peach must be soft enough to mash with gentle thumb pressure. Underripe peaches are firm and slippery, increasing the choking risk.",
      allergen_notes:
        "Peach is not a common allergen. Those sensitive to birch or grass pollens may experience Oral Allergy Syndrome — tingling or itching in the mouth or throat. Cross-reactivity is possible with apricots, nectarines, and plums.",
      tip_puree:
        "Offer pitted peach halves with skin on so baby can grip and gnaw, or mash very ripe peach into porridge or yogurt. Ensure the fruit is soft enough to squish between your fingers — never serve underripe, firm peach.",
      tip_finger_food:
        "Cut into finger-length strips or thin slices with skin on for grip. Peach skin is soft and safe at this stage. Ensure every slice is fully ripe and soft enough to gum without teeth.",
      tip_self_feeding:
        "Offer thin slices (skin on or off) that baby can pick up independently. Continue ensuring the peach is fully ripe. Small bite-sized pieces work well as the pincer grasp improves.",
      tip_family_meal:
        "Thinly-sliced or halved peaches are ideal. Pre-load bite-sized pieces on a fork to encourage self-feeding. After 18 months, a whole ripe peach can be offered with supervision and pit-safety awareness.",
    },
  },
];

async function run() {
  for (const update of UPDATES) {
    const { data: found, error: findErr } = await supabase
      .from("foods")
      .select("id, name")
      .ilike("name", update.match);

    if (findErr || !found?.length) {
      console.warn(`⚠ No food found matching "${update.match}"`);
      continue;
    }

    for (const food of found) {
      const { error } = await supabase
        .from("foods")
        .update(update.data)
        .eq("id", food.id);

      if (error) {
        console.error(`✗ Failed to update "${food.name}":`, error.message);
      } else {
        console.log(`✓ Updated "${food.name}" (${food.id})`);
      }
    }
  }
}

run().catch((err) => {
  console.error("Script failed:", err.message);
  process.exit(1);
});
