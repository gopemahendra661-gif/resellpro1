import { NextRequest } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || !url.includes('meesho.com')) {
      return Response.json({ error: 'Invalid Meesho URL' }, { status: 400 });
    }

    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(html);

    // Title extraction with multiple fallbacks
    let title =
      $('h1[data-testid="product-title"]').text().trim() ||
      $('h1.product-title').text().trim() ||
      $('h1[class*="title"]').text().trim() ||
      $('title').text().replace(/ - Meesho.*/i, '').trim() ||
      '';

    // Clean title
    title = title.replace(/\s+/g, ' ').trim();

    // Price extraction
    let price: number | null = null;
    let priceText =
      $('.pdp-price').text().trim() ||
      $('span[data-testid="price"]').text().trim() ||
      $('span.CxNYUP').text().trim() ||
      $('h4').text().trim() ||
      '';

    const priceMatch = priceText.match(/₹(\d+)/);
    if (priceMatch) {
      price = parseInt(priceMatch[1], 10);
    }

    // Fallback: search entire HTML for price
    if (price === null) {
      const htmlPriceMatch = html.match(/₹(\d+)/);
      if (htmlPriceMatch) {
        price = parseInt(htmlPriceMatch[1], 10);
      }
    }

    if (!title || price === null) {
      return Response.json(
        { error: 'Price or title not found. Invalid or unsupported product page.' },
        { status: 400 }
      );
    }

    // Extract images (only Meesho-hosted, non-placeholder)
    const images: string[] = [];
    $('img').each((_, el) => {
      let src = $(el).attr('src') || $(el).attr('data-src') || '';
      if (src && src.includes('meesho') && !src.includes('placeholder')) {
        // Convert relative to absolute if needed (rare on Meesho, but safe)
        if (src.startsWith('//')) {
          src = 'https:' + src;
        }
        if (!images.includes(src)) {
          images.push(src);
        }
      }
    });

    if (images.length === 0) {
      return Response.json(
        { error: 'No valid product images found.' },
        { status: 400 }
      );
    }

    return Response.json({ title, price, images });
  } catch (err) {
    console.error('Extraction error:', err);
    return Response.json(
      { error: 'Invalid link or product unavailable' },
      { status: 400 }
    );
  }
}
