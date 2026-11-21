from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.properties.models import Property, PropertyImage
from apps.materials.models import MaterialStore, Material
from apps.services.models import ServiceProvider
from apps.ratings.models import Rating
import decimal
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds database with initial premium data'

    def handle(self, *args, **options):
        self.stdout.write('Database tozalanyapti...')
        PropertyImage.objects.all().delete()
        Property.objects.all().delete()
        Material.objects.all().delete()
        MaterialStore.objects.all().delete()
        ServiceProvider.objects.all().delete()
        Rating.objects.all().delete()
        User.objects.all().delete()

        self.stdout.write('Foydalanuvchilar yaratilmoqda...')
        # Super Admin
        super_admin = User.objects.create_user(
            username='superadmin',
            email='superadmin@houseshop.uz',
            first_name='Super',
            last_name='Admin',
            phone='+998901111111',
            password='password123',
            profession='customer',
            is_verified=True,
            is_staff=True,
            is_superuser=True,
            is_admin=True,
            is_super_admin=True
        )

        # Admin
        admin = User.objects.create_user(
            username='admin',
            email='admin@houseshop.uz',
            first_name='Loyihalar',
            last_name='Nazoratchisi',
            phone='+998902222222',
            password='password123',
            profession='customer',
            is_verified=True,
            is_staff=True,
            is_admin=True
        )

        # Sellers
        sellers = []
        seller_names = [
            ('Ali', 'Valiyev', '+998903333333'),
            ('Sardor', 'Karimov', '+998904444444'),
            ('Nodira', 'Toshmatova', '+998905555555')
        ]
        for i, (fn, ln, ph) in enumerate(seller_names):
            s = User.objects.create_user(
                username=f'seller_{i+1}',
                email=f'{fn.lower()}@gmail.com',
                first_name=fn,
                last_name=ln,
                phone=ph,
                password='password123',
                profession='seller',
                is_verified=True
            )
            sellers.append(s)

        # Builders & Repairmen & Architects
        professionals = []
        pro_names = [
            ('Azizbek', 'Rahimov', 'builder', 'Katta imoratlar va yevro-kottedjlar qurish bo\'yicha mutaxassis. 12 yillik tajriba.'),
            ('Malika', 'Axmedova', 'architect', 'Zamonaviy minimalistik dizayn va landshaft loyihalashtirish.'),
            ('Javohir', 'Tursunov', 'repairman', 'Sifatli ichki pardozlash, devor qoplash va santexnika xizmatlari.'),
            ('Zafar', 'Yusupov', 'architect', 'Ko\'p qavatli binolar va ofislar arxitekturasi.'),
            ('Diyor', 'Umarov', 'builder', 'G\'isht va beton ishlari, poydevor quyish bo\'yicha katta guruh boshlig\'i.')
        ]

        for i, (fn, ln, prof, bio) in enumerate(pro_names):
            p = User.objects.create_user(
                username=f'pro_{i+1}',
                email=f'{fn.lower()}@gmail.com',
                first_name=fn,
                last_name=ln,
                phone=f'+99893555000{i}',
                password='password123',
                profession=prof,
                bio=bio,
                is_verified=True
            )
            # Create Service Provider Profile
            skills = ['G\'isht terish', 'Beton ishlari'] if prof == 'builder' else ['3D Max', 'AutoCAD', 'Revit'] if prof == 'architect' else ['Santexnika', 'Elektrika', 'Kafel yopishtirish']
            ServiceProvider.objects.create(
                user=p,
                specialization=f"Premium {prof.capitalize()} xizmatlari",
                experience_years=8 + i,
                bio=bio,
                hourly_rate=decimal.Decimal(50000 + i * 15000),
                skills=skills,
                portfolio_images=["https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=500"]
            )
            professionals.append(p)

        self.stdout.write('Uylar, kvartiralar va yerlar joylanmoqda...')
        # Properties
        locations = [
            ('Toshkent, Yunusobod tumani', 41.3625, 69.2891),
            ('Toshkent, Chilonzor tumani', 41.2783, 69.2014),
            ('Toshkent, Mirzo Ulug\'bek tumani', 41.3321, 69.3402),
            ('Samarqand shahar, Registon yaqinida', 39.6542, 66.9597),
            ('Buxoro shahar, Eski shahar', 39.7747, 64.4186),
        ]
        
        titles = [
            ('Premium Katta Hovli Uyi', 'house', 1200000000, 250, 5, 3),
            ('Shahar markazida shinam 3 xonali kvartira', 'apartment', 650000000, 85, 3, 2),
            ('Qurilish uchun ideal yer maydoni', 'land', 300000000, 600, 0, 0),
            ('Premium 2 qavatli Yevro Kottedj', 'house', 1800000000, 320, 6, 4),
            ('Ijaraga beriladigan 2 xonali modern kvartira', 'rental', 4500000, 65, 2, 1),
        ]

        for i, (title, ptype, price, area, beds, baths) in enumerate(titles):
            loc, lat, lng = locations[i % len(locations)]
            prop = Property.objects.create(
                title=title,
                property_type=ptype,
                price=decimal.Decimal(price),
                location=loc,
                latitude=lat,
                longitude=lng,
                bedrooms=beds,
                bathrooms=baths,
                area=area,
                description=f"{title} juda yaxshi holatda, barcha sharoitlar va infratuzilmalarga ega bo'lgan joyda joylashgan.",
                features=['Gaz bor', 'Svet doimiy', 'Internet OVF', 'Konditsioner', 'Parkovka'],
                owner=random.choice(sellers),
                status='active'
            )
            # Create a mock image
            urls = [
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
                "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800"
            ]
            for j, u in enumerate(urls):
                # We can save mock paths directly to model
                PropertyImage.objects.create(
                    property=prop,
                    image=f"mock_image_{i}_{j}.jpg",
                    is_primary=(j == 0),
                    order=j
                )

        self.stdout.write('Qurilish materiallari do\'konlari va tovarlar joylanmoqda...')
        # Stores
        store_names = ['Toshkent Qurilish Bazasi', 'Mega Metal & Sement', 'Usta Do\'koni']
        for i, name in enumerate(store_names):
            store = MaterialStore.objects.create(
                name=name,
                category='Umumiy Qurilish',
                location=locations[i % len(locations)][0],
                latitude=locations[i % len(locations)][1],
                longitude=locations[i % len(locations)][2],
                phone='+998991234567',
                rating=4.5 - i * 0.2,
                owner=random.choice(sellers)
            )
            # Add Materials
            Material.objects.create(
                store=store,
                name='Premium Portland Sement M-500',
                category='cement',
                price=decimal.Decimal(55000),
                unit='qop (50kg)',
                quantity=1200,
                description='Yuqori mustahkamlikka ega sement.'
            )
            Material.objects.create(
                store=store,
                name='Pishgan g\'isht (Qizil)',
                category='brick',
                price=decimal.Decimal(1800),
                unit='dona',
                quantity=50000,
                description='Pishgan sifatli g\'isht.'
            )
            Material.objects.create(
                store=store,
                name='Armatura diametri 12mm',
                category='metal',
                price=decimal.Decimal(12500),
                unit='metr',
                quantity=8000,
                description='Rossiya armaturasi.'
            )

        self.stdout.write('Reyting va baholar yozilmoqda...')
        # Create Ratings
        customers = []
        for i in range(5):
            c = User.objects.create_user(
                username=f'customer_{i+1}',
                email=f'customer{i+1}@gmail.com',
                first_name=f'Mijoz_{i+1}',
                last_name='Xaridor',
                phone=f'+99891777000{i}',
                password='password123',
                profession='customer'
            )
            customers.append(c)

        for pro in professionals:
            for cust in random.sample(customers, 3):
                Rating.objects.create(
                    user=cust,
                    target_user=pro,
                    stars=random.choice([4, 5]),
                    comment='Juda ajoyib va tezkor xizmat ko\'rsatildi, tavsiya qilaman!'
                )

        self.stdout.write(self.style.SUCCESS('Loyiha bazasi to\'liq seed qilindi!'))
