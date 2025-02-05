const API_URL = "https://trackapi.nutritionix.com/v2";

type NutritionInfo = {
  calories: number;
  protein_g: number;
  carbohydrates_g: number;
  fat_g: number;
};

export async function getNutritionInfo(
  query: string
): Promise<NutritionInfo> {
  const response = await fetch(`${API_URL}/natural/nutrients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-app-id": process.env.NUTRITIONIX_APP_ID!,
      "x-app-key": process.env.NUTRITIONIX_API_KEY!,
    },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();
  const firstFood = data.foods[0];

  return {
    calories: Math.round(firstFood.nf_calories),
    protein_g: Math.round(firstFood.nf_protein * 10) / 10,
    carbohydrates_g: Math.round(firstFood.nf_total_carbohydrate * 10) / 10,
    fat_g: Math.round(firstFood.nf_total_fat * 10) / 10,
  };
}
