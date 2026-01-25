import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const barcode = request.nextUrl.searchParams.get('barcode');

  if (!barcode) {
    return NextResponse.json({ error: 'Barcode required' }, { status: 400 });
  }

  try {
    // Hämta produktdata från Open Food Facts
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      {
        headers: {
          'User-Agent': 'SmartGutTracker/1.0 (simon@guttracker.app)',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const data = await response.json();

    if (data.status === 0) {
      return NextResponse.json({ error: 'Product not found in database' }, { status: 404 });
    }

    const product = data.product;

    // Extrahera relevant info
    const productInfo = {
      name: product.product_name || product.product_name_sv || 'Okänd produkt',
      brand: product.brands || '',
      ingredients: product.ingredients_text || product.ingredients_text_sv || '',
      allergens: product.allergens_tags || [],
      labels: product.labels_tags || [],
      nutriments: {
        energy: product.nutriments?.['energy-kcal_100g'],
        fat: product.nutriments?.fat_100g,
        saturatedFat: product.nutriments?.['saturated-fat_100g'],
        carbohydrates: product.nutriments?.carbohydrates_100g,
        sugars: product.nutriments?.sugars_100g,
        fiber: product.nutriments?.fiber_100g,
        proteins: product.nutriments?.proteins_100g,
        salt: product.nutriments?.salt_100g,
      },
      imageUrl: product.image_url,
      barcode: product.code,
    };

    return NextResponse.json(productInfo);
  } catch (error) {
    console.error('Open Food Facts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product data' },
      { status: 500 }
    );
  }
}
