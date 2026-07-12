import sys
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from apps.catalog.models import Category, SubCategory, MenuItem


class Command(BaseCommand):
    help = "Seed the database with the complete Midnight House menu."

    def handle(self, *args, **options):
        # Counters for created objects
        created_cats = 0
        created_subcats = 0
        created_items = 0

        # -----------------------------------------------------------------
        # Data definition
        # -----------------------------------------------------------------
        menu_data = {
            "Moon Brew Station": {
                "Tea": {
                    "Ginger Tea": 15,
                    "Black Tea": 10,
                    "Jaggery Tea": 20,
                    "Elaichi Tea": 20,
                    "Masala Tea": 20,
                },
                "Coffee": {
                    "Americano": 20,
                    "Hot Coffee": 30,
                    "Cold Coffee": 70,
                    "Chocolate Hazelnut Whipped": 120,
                    "Cold Coffee Ice Cream": 120,
                },
            },
            "Craving Corner": {
                None: {
                    "Salted Fries": 79,
                    "Masala Fries": 89,
                    "Peri Peri Fries": 99,
                    "Cheese Loaded Fries": 129,
                    "Corn Chaat": 119,
                    "Crispy Corn": 149,
                }
            },
            "Bite House": {
                "Burgers": {
                    "Veg Burger": 70,
                    "Veg Cheese Burger": 90,
                    "Cheese Corn Burger": 90,
                    "Paneer Cheese Burger": 119,
                    "Double Tikki": 119,
                },
                "Sandwiches": {
                    "Bombay Kachha Sandwich": 50,
                    "Veg Sandwich": 70,
                    "Veg Cheese Sandwich": 99,
                    "Corn Cheese Sandwich": 99,
                    "Corn Veg Cheese Sandwich": 99,
                    "Masala Sandwich": 70,
                    "Masala Cheese Sandwich": 99,
                    "Paneer Sandwich": 119,
                    "Tandoori Paneer Sandwich": 139,
                    "Cheese Chutney Sandwich": 99,
                },
                "Pizza": {
                    "Margherita Pizza": 149,
                    "Veggie Delight": 159,
                    "Onion Capsicum": 159,
                    "Corn Cheese Pizza": 179,
                    "Paneer Tikka Pizza": 199,
                },
            },
            "Fresh Sip Bar": {
                "Mojitos": {
                    "Lemon Juice": 20,
                    "Virgin Mojito": 99,
                    "Kiwi Mojito": 119,
                    "Strawberry Mojito": 119,
                    "Watermelon Mojito": 119,
                },
                "Juices": {
                    "Pineapple": 45,
                    "Mango": 50,
                    "Mix Fruit": 65,
                    "Strawberry": 50,
                    "Watermelon": 50,
                    "Mosambi": 50,
                    "Orange": 45,
                },
                "Shakes": {
                    "Pineapple Shake": 60,
                    "Mango Shake": 65,
                    "Mix Fruit Shake": 75,
                    "Strawberry Shake": 65,
                    "Watermelon Shake": 65,
                    "Oreo Shake": 129,
                    "Kitkat Shake": 129,
                    "Chocolate Shake": 129,
                },
            },
            "Comfort Bowl": {
                "Maggie": {
                    "Regular Maggie": 50,
                    "Masala Maggie": 60,
                    "Double Masala Maggie": 70,
                    "Veg Masala Maggie": 70,
                    "Veg Cheese Maggie": 99,
                    "Corn Cheese Maggie": 99,
                    "Cheese Maggie": 89,
                    "Special Maggie": 119,
                },
                "Pasta": {
                    "White Sauce Pasta": 149,
                    "Red Sauce Pasta": 149,
                    "Mix Sauce Pasta": 169,
                },
            },
            "Add-Ons": {
                None: {
                    "Butter Toast": 40,
                    "Muska Bun": 40,
                    "Extra Cheese": 25,
                    "Extra Butter": 25,
                }
            },
            "Combos": {
                None: {
                    "Burger + Fries + Cold Coffee": 199,
                    "Masala / Veg Cheese Sandwich + Fries + Cold Coffee": 219,
                    "Pizza + Pasta + Cold Coffee": 329,
                    "Pasta + Maggie": 199,
                }
            },
            "House Signatures": {
                None: {
                    "Midnight Dream Cold Coffee": {
                        "price": 159,
                        "description": (
                            "Cold coffee with ice cream, chocolate drizzle & cookie crumbles"
                        ),
                    },
                    "Midnight Loaded Fries": {
                        "price": 119,
                        "description": (
                            "Crispy fries with cheese sauce, corn, peri peri & mayo"
                        ),
                    },
                    "Midnight Comfort Pasta": {
                        "price": 169,
                        "description": (
                            "Creamy pasta with mixed sauce, herbs & extra cheese"
                        ),
                    },
                    "Midnight Fudge Brownie Shake": {
                        "price": 179,
                        "description": (
                            "Rich chocolate shake + fudge brownie + chocolate sauce + whipped cream"
                        ),
                    },
                }
            },
        }

        # -----------------------------------------------------------------
        # Seeding logic (wrapped in a transaction for atomicity)
        # -----------------------------------------------------------------
        with transaction.atomic():
            for cat_name, subcat_dict in menu_data.items():
                cat_slug = slugify(cat_name)
                category, cat_created = Category.objects.get_or_create(
                    name=cat_name,
                    defaults={"slug": cat_slug},
                )
                if cat_created:
                    created_cats += 1

                for subcat_name, items in subcat_dict.items():
                    # Subcategory may be None (items belong directly to the category)
                    subcategory = None
                    if subcat_name is not None:
                        subcat_slug = slugify(subcat_name)
                        subcategory, sub_created = SubCategory.objects.get_or_create(
                            name=subcat_name,
                            category=category,
                            defaults={"slug": subcat_slug},
                        )
                        if sub_created:
                            created_subcats += 1

                    for item_name, item_data in items.items():
                        # Item data can be a simple price (int) or a dict with price/description
                        if isinstance(item_data, dict):
                            price = item_data["price"]
                            description = item_data.get("description", "")
                        else:
                            price = item_data
                            description = ""

                        menu_item, item_created = MenuItem.objects.get_or_create(
                            name=item_name,
                            category=category,
                            subcategory=subcategory,
                            defaults={
                                "price": price,
                                "description": description,
                                "is_available": True,
                                "is_featured": False,
                            },
                        )
                        if item_created:
                            created_items += 1

        # -----------------------------------------------------------------
        # Output summary
        # -----------------------------------------------------------------
        self.stdout.write(self.style.SUCCESS(f"Categories created: {created_cats}"))
        self.stdout.write(self.style.SUCCESS(f"SubCategories created: {created_subcats}"))
        self.stdout.write(self.style.SUCCESS(f"MenuItems created: {created_items}"))
