'use client';

import { useState } from 'react';

interface ProductData {
  title: string;
  price: number;
  images: string[];
}

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [product, setProduct] = useState<ProductData | null>(null);
  const [marginPercent, setMarginPercent] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const extractProduct = async () => {
    if (!url.includes('meesho.com')) {
      setError('Please enter a valid Meesho product URL');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setProduct(null);
      } else {
        setProduct(data);
        setError('');
      }
    } catch (err) {
      setError('Failed to extract product. Try again.');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const marginAmount = product ? Math.round(product.price * (marginPercent / 100)) : 0;
  const sellingPrice = product ? product.price + marginAmount : 0;

  const downloadAllImages = () => {
    if (!product) return;
    product.images.forEach((imgUrl, i) => {
      fetch(imgUrl)
        .then(res => res.blob())
        .then(blob => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `meesho-product-${i + 1}.jpg`;
          a.click();
          URL.revokeObjectURL(a.href);
        });
    });
  };

  const shareProduct = async () => {
    if (!product) return;
    if (navigator.share) {
      try {
        const imageBlobs = await Promise.all(
          product.images.slice(0, 5).map(url =>
            fetch(url).then(r => r.blob())
          )
        );
        const files = imageBlobs.map((blob, i) =>
          new File([blob], `product-${i}.jpg`, { type: blob.type })
        );
        await navigator.share({
          title: product.title,
          text: `Price: ₹${sellingPrice}`,
          files,
        });
      } catch (err) {
        alert('Sharing failed or not supported on this device.');
      }
    } else {
      alert('Web Share API not supported. Copy link manually.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-2">ResellPro</h1>
      <p className="text-gray-600 text-center mb-8">Meesho Product Extractor</p>

      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste Meesho Product Link"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={extractProduct}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Extracting...' : 'Extract Product'}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {product && !error && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-2">{product.title}</h2>
          <p className="text-gray-700 mb-4">Original Price: ₹{product.price}</p>

          {/* Images */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
            {product.images.slice(0, 6).map((img, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded border">
                <img
                  src={img}
                  alt={`Product ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* Margin Slider */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Margin: {marginPercent}%
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={marginPercent}
              onChange={(e) => setMarginPercent(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <div className="bg-green-100 px-4 py-2 rounded-lg">
              <p className="text-sm text-gray-700">Selling Price</p>
              <p className="font-bold text-lg">₹{sellingPrice}</p>
            </div>
            <div className="bg-blue-100 px-4 py-2 rounded-lg">
              <p className="text-sm text-gray-700">Margin</p>
              <p className="font-bold">₹{marginAmount}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={downloadAllImages}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black"
            >
              Download All Images
            </button>
            <button
              onClick={shareProduct}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Share
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
