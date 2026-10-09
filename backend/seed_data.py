"""
Run with: python manage.py shell < seed_data.py
or: python manage.py shell -c "exec(open('seed_data.py').read())"
"""
import os
import shutil
from django.conf import settings
from products.models import Category, Product, ProductImage, ProductSize, ProductColor
from core.models import BusinessSettings

# Setup media directories
os.makedirs(os.path.join(settings.MEDIA_ROOT, 'products', 'thumbnails'), exist_ok=True)
os.makedirs(os.path.join(settings.MEDIA_ROOT, 'products', 'images'), exist_ok=True)
os.makedirs(os.path.join(settings.MEDIA_ROOT, 'settings'), exist_ok=True)

BASE_DIR = settings.BASE_DIR
ROOT_DIR = os.path.dirname(BASE_DIR)

# Copy logo
logo_src = os.path.join(ROOT_DIR, 'logo.jpeg')
logo_dst = os.path.join(settings.MEDIA_ROOT, 'settings', 'logo.jpeg')
if os.path.exists(logo_src) and not os.path.exists(logo_dst):
    shutil.copy2(logo_src, logo_dst)
    print("Logo copied.")

# Copy t-shirt images
for i in range(1, 10):
    src = os.path.join(ROOT_DIR, f't-shirt{i}.jpeg')
    dst = os.path.join(settings.MEDIA_ROOT, 'products', 'thumbnails', f't-shirt{i}.jpeg')
    dst2 = os.path.join(settings.MEDIA_ROOT, 'products', 'images', f't-shirt{i}.jpeg')
    if os.path.exists(src):
        if not os.path.exists(dst):
            shutil.copy2(src, dst)
        if not os.path.exists(dst2):
            shutil.copy2(src, dst2)
print("Product images copied.")

# Update business settings
biz, _ = BusinessSettings.objects.get_or_create(pk=1)
biz.business_name = 'Murshid'
biz.business_email = 'murshid10032004@gmail.com'
biz.business_phone = '+91 70421 29273'
biz.business_address = 'Mumbai, Maharashtra, India'
biz.whatsapp_number = '917042129273'
if os.path.exists(logo_dst):
    biz.logo = 'settings/logo.jpeg'
biz.save()
print("Business settings updated.")

# Create categories
men, _ = Category.objects.get_or_create(name='Men')
women, _ = Category.objects.get_or_create(name='Women')
kids, _ = Category.objects.get_or_create(name='Kids')
accessories, _ = Category.objects.get_or_create(name='Accessories')
print("Categories created.")

# Product data
products_data = [
    {
        'name': 'Oversized Streetwear Tee',
        'category': men,
        'description': 'Premium heavyweight cotton oversized t-shirt with dropped shoulders. Perfect for the modern street style look.',
        'price': 1299,
        'discount_price': 999,
        'thumbnail': 'products/thumbnails/t-shirt1.jpeg',
        'images': ['products/images/t-shirt1.jpeg'],
        'sizes': ['S', 'M', 'L', 'XL', 'XXL'],
        'colors': [('Black', '#000000'), ('White', '#FFFFFF')],
        'is_new_arrival': True, 'is_trending': True,
    },
    {
        'name': 'Essential Graphic Tee',
        'category': men,
        'description': 'Clean minimal graphic print t-shirt in premium cotton blend. A wardrobe staple for every season.',
        'price': 899,
        'discount_price': None,
        'thumbnail': 'products/thumbnails/t-shirt2.jpeg',
        'images': ['products/images/t-shirt2.jpeg'],
        'sizes': ['S', 'M', 'L', 'XL'],
        'colors': [('White', '#FFFFFF'), ('Grey', '#888888')],
        'is_new_arrival': True, 'is_best_seller': True,
    },
    {
        'name': 'Premium Drop Shoulder Tee',
        'category': men,
        'description': 'Ultra-soft drop shoulder design tee crafted for maximum comfort and contemporary style.',
        'price': 1199,
        'discount_price': 949,
        'thumbnail': 'products/thumbnails/t-shirt3.jpeg',
        'images': ['products/images/t-shirt3.jpeg', 'products/images/t-shirt1.jpeg'],
        'sizes': ['M', 'L', 'XL', 'XXL'],
        'colors': [('Black', '#000000'), ('Navy', '#001F5B'), ('Olive', '#556B2F')],
        'is_trending': True, 'is_featured': True,
    },
    {
        'name': 'Vintage Washed Tee',
        'category': men,
        'description': 'Stone-washed vintage finish tee with a relaxed fit. The worn-in look that never goes out of style.',
        'price': 1099,
        'discount_price': None,
        'thumbnail': 'products/thumbnails/t-shirt4.jpeg',
        'images': ['products/images/t-shirt4.jpeg'],
        'sizes': ['S', 'M', 'L', 'XL'],
        'colors': [('Beige', '#F5F0E8'), ('Dusty Pink', '#D4A5A5')],
        'is_new_arrival': True,
    },
    {
        'name': 'Crop Streetwear Tee',
        'category': men,
        'description': 'Trendy cropped tee with modern streetwear aesthetic. Pairs perfectly with high-waist bottoms.',
        'price': 799,
        'discount_price': 649,
        'thumbnail': 'products/thumbnails/t-shirt5.jpeg',
        'images': ['products/images/t-shirt5.jpeg'],
        'sizes': ['XS', 'S', 'M', 'L'],
        'colors': [('White', '#FFFFFF'), ('Black', '#000000'), ('Pink', '#FFB6C1')],
        'is_trending': True, 'is_best_seller': True,
    },
    {
        'name': 'Minimal Logo Tee',
        'category': men,
        'description': 'Clean minimal logo embroidered tee in soft pima cotton. Timeless and versatile.',
        'price': 999,
        'discount_price': None,
        'thumbnail': 'products/thumbnails/t-shirt6.jpeg',
        'images': ['products/images/t-shirt6.jpeg'],
        'sizes': ['XS', 'S', 'M', 'L', 'XL'],
        'colors': [('White', '#FFFFFF'), ('Black', '#000000'), ('Sage', '#B2C9AD')],
        'is_featured': True,
    },
    {
        'name': 'Unisex Premium Tee',
        'category': men,
        'description': 'Gender-neutral premium heavyweight tee designed for everyone. Made with 100% organic cotton.',
        'price': 1499,
        'discount_price': 1199,
        'thumbnail': 'products/thumbnails/t-shirt7.jpeg',
        'images': ['products/images/t-shirt7.jpeg', 'products/images/t-shirt8.jpeg'],
        'sizes': ['S', 'M', 'L', 'XL', 'XXL'],
        'colors': [('Black', '#000000'), ('White', '#FFFFFF'), ('Brown', '#8B4513')],
        'is_new_arrival': True, 'is_best_seller': True, 'is_featured': True,
    },
    {
        'name': 'Relaxed Fit Tee',
        'category': men,
        'description': 'Effortlessly relaxed fit tee with a boyfriend silhouette. Super soft and breathable.',
        'price': 849,
        'discount_price': None,
        'thumbnail': 'products/thumbnails/t-shirt8.jpeg',
        'images': ['products/images/t-shirt8.jpeg'],
        'sizes': ['XS', 'S', 'M', 'L'],
        'colors': [('Lavender', '#E6E6FA'), ('White', '#FFFFFF'), ('Black', '#000000')],
        'is_trending': True,
    },
    {
        'name': 'Classic Essential Tee',
        'category': men,
        'description': 'The classic tee reinvented with premium cotton and a modern slim fit. Your everyday essential.',
        'price': 699,
        'discount_price': 549,
        'thumbnail': 'products/thumbnails/t-shirt9.jpeg',
        'images': ['products/images/t-shirt9.jpeg'],
        'sizes': ['S', 'M', 'L', 'XL', 'XXL'],
        'colors': [('Black', '#000000'), ('White', '#FFFFFF'), ('Grey', '#808080'), ('Navy', '#001F5B')],
        'is_best_seller': True,
    },
]

for p_data in products_data:
    if Product.objects.filter(name=p_data['name']).exists():
        print(f"Skipping existing: {p_data['name']}")
        continue

    product = Product.objects.create(
        name=p_data['name'],
        category=p_data['category'],
        description=p_data['description'],
        price=p_data['price'],
        discount_price=p_data.get('discount_price'),
        thumbnail=p_data['thumbnail'],
        is_new_arrival=p_data.get('is_new_arrival', False),
        is_trending=p_data.get('is_trending', False),
        is_featured=p_data.get('is_featured', False),
        is_best_seller=p_data.get('is_best_seller', False),
    )

    for idx, img_path in enumerate(p_data.get('images', [])):
        ProductImage.objects.create(product=product, image=img_path, display_order=idx)

    for size in p_data.get('sizes', []):
        ProductSize.objects.create(product=product, size=size)

    for color_name, color_hex in p_data.get('colors', []):
        ProductColor.objects.create(product=product, color=color_name, color_hex=color_hex)

    print(f"Created: {product.name}")

print("\nSeed complete!")
print(f"Total products: {Product.objects.count()}")
print(f"Total categories: {Category.objects.count()}")
