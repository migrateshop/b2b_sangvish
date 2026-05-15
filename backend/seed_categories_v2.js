const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./models/Category');

dotenv.config();

const subImagePool = [
    '/uploads/categories/subs/machinery_part.jpg',
    '/uploads/categories/subs/gadget.jpg',
    '/uploads/categories/subs/cosmetics.jpg',
    '/uploads/categories/subs/farm_crop.jpg',
    '/uploads/categories/subs/furniture_detail.jpg',
    '/uploads/categories/subs/car_wheel.jpg',
    '/uploads/categories/subs/circuit.jpg',
    '/uploads/categories/subs/steel_beam.jpg',
    '/uploads/categories/subs/beaker.jpg',
    '/uploads/categories/subs/cardboard.jpg',
    '/uploads/categories/subs/lamp.jpg',
    '/uploads/categories/subs/medical_tool.jpg',
    '/uploads/categories/subs/sports_gear.jpg',
    '/uploads/categories/subs/toy_block.jpg',
    '/uploads/categories/subs/notebook.jpg',
    '/uploads/categories/subs/fruit_basket.jpg',
    '/uploads/categories/subs/door_handle.jpg'
];

const largeCategoryData = [
    {
        title: 'Industrial Machinery',
        image: '/uploads/categories/industrial_machinery.jpg',
        subImages: ['/uploads/categories/subs/machinery_part.jpg', '/uploads/categories/subs/circuit.jpg', '/uploads/categories/subs/steel_beam.jpg'],
        subs: ['Textile Machinery', 'Packaging Machine', 'Metalworking Machinery', 'Plastic & Rubber Machinery', 'Woodworking Machinery', 'Garment Machinery', 'Leather Machinery', 'Paper Processing Machinery', 'Chemical Equipment', 'Mining Machinery']
    },
    {
        title: 'Agriculture',
        image: '/uploads/categories/agriculture.jpg',
        subImages: ['/uploads/categories/subs/farm_crop.jpg', '/uploads/categories/subs/fruit_basket.jpg'],
        subs: ['Agricultural Machinery', 'Farm Equipment', 'Irrigation Systems', 'Greenhouses', 'Animal Husbandation', 'Plant & Garden', 'Fertilizer', 'Seeds & Bulbs', 'Pesticide', 'Forestry Machinery']
    },
    {
        title: 'Consumer Electronics',
        image: '/uploads/categories/consumer_electronics.jpg',
        subImages: ['/uploads/categories/subs/gadget.jpg', '/uploads/categories/subs/circuit.jpg', '/uploads/categories/subs/lamp.jpg'],
        subs: ['Mobile Phones', 'Computers & Software', 'Home Audio & Video', 'Cameras & Photo', 'Electronic Cigarettes', 'Wearable Devices', 'Power Accessories', 'Video Games', 'Portable Audio', 'Smart Electronics']
    },
    {
        title: 'Apparel & Fashion',
        image: '/uploads/categories/apparel_fashion.jpg',
        subImages: ['/uploads/categories/apparel_fashion.jpg', '/uploads/categories/subs/cosmetics.jpg'],
        subs: ['Men\'s Clothing', 'Women\'s Clothing', 'Children\'s Clothing', 'Sportswear', 'Underwear', 'Activewear', 'Swimwear', 'Socks', 'Uniforms', 'Fashion Accessories']
    },
    {
        title: 'Home, Garden & Furniture',
        image: '/uploads/categories/home_garden_furniture.jpg',
        subImages: ['/uploads/categories/subs/furniture_detail.jpg', '/uploads/categories/subs/lamp.jpg', '/uploads/categories/subs/door_handle.jpg'],
        subs: ['Home Furniture', 'Outdoor Furniture', 'Commercial Furniture', 'Kitchen & Tabletop', 'Home Decor', 'Garden Supplies', 'Household Chemicals', 'Home Storage', 'Cleaning Supplies', 'Pet Supplies']
    },
    {
        title: 'Health & Medical',
        image: '/uploads/categories/health_medical.jpg',
        subImages: ['/uploads/categories/subs/medical_tool.jpg', '/uploads/categories/subs/beaker.jpg'],
        subs: ['Medical Devices', 'Healthcare Products', 'Laboratory Supplies', 'Dental Equipment', 'Rehabilitation Supplies', 'Emergency Medical', 'Traditional Medicine', 'Massage Products', 'Body Weight Scales', 'Sanitary Wares']
    },
    {
        title: 'Beauty & Personal Care',
        image: '/uploads/categories/beauty_personal_care.jpg',
        subImages: ['/uploads/categories/subs/cosmetics.jpg', '/uploads/categories/subs/beaker.jpg'],
        subs: ['Makeup', 'Skin Care', 'Hair Care', 'Perfume & Fragrance', 'Nail Art', 'Oral Hygiene', 'Shaving & Hair Removal', 'Baby Care', 'Spa & Salon Equipment', 'Body Art']
    },
    {
        title: 'Sports & Entertainment',
        image: '/uploads/categories/sports_entertainment.jpg',
        subImages: ['/uploads/categories/subs/sports_gear.jpg', '/uploads/categories/subs/gadget.jpg'],
        subs: ['Fitness & Body Building', 'Outdoor Sports', 'Water Sports', 'Team Sports', 'Racket Sports', 'Golf', 'Musical Instruments', 'Camping & Hiking', 'Cycling', 'Fishing']
    },
    {
        title: 'Toys & Hobbies',
        image: '/uploads/categories/toys_hobbies.jpg',
        subImages: ['/uploads/categories/subs/toy_block.jpg', '/uploads/categories/subs/gadget.jpg'],
        subs: ['Educational Toys', 'Classic Toys', 'Remote Control Toys', 'Dolls & Stuffed Toys', 'Action Figures', 'Outdoor Toys', 'Baby Toys', 'Puzzles', 'Model Toys', 'Novelty Toys']
    },
    {
        title: 'Vehicles & Accessories',
        image: '/uploads/categories/vehicles_accessories.jpg',
        subImages: ['/uploads/categories/subs/car_wheel.jpg', '/uploads/categories/subs/machinery_part.jpg'],
        subs: ['Automobiles', 'Motorcycles', 'Electric Vehicles', 'Bicycles', 'Auto Parts', 'Car Electronics', 'Garage Equipment', 'Interior Accessories', 'Exterior Accessories', 'Boats & Ships']
    },
    {
        title: 'Tools & Hardware',
        image: '/uploads/categories/tools_hardware.jpg',
        subImages: ['/uploads/categories/tools_hardware.jpg', '/uploads/categories/subs/door_handle.jpg', '/uploads/categories/subs/steel_beam.jpg'],
        subs: ['Hand Tools', 'Power Tools', 'Lifting Tools', 'Pneumatic Tools', 'Garden Tools', 'Abrasives', 'Hardware Products', 'Fasteners', 'Valves', 'Pumps']
    },
    {
        title: 'Packaging & Printing',
        image: '/uploads/categories/packaging_printing.jpg',
        subImages: ['/uploads/categories/subs/cardboard.jpg', '/uploads/categories/subs/notebook.jpg'],
        subs: ['Packaging Materials', 'Bottles', 'Paper Boxes', 'Plastic Bags', 'Printing Machinery', 'Labelling Machinery', 'Adhesive Tapes', 'Cans', 'Tubes', 'Wrapping Materials']
    },
    {
        title: 'Chemicals',
        image: '/uploads/categories/chemicals.jpg',
        subImages: ['/uploads/categories/subs/beaker.jpg', '/uploads/categories/subs/circuit.jpg'],
        subs: ['Organic Chemicals', 'Inorganic Chemicals', 'Polymers', 'Agrochemicals', 'Adhesives & Sealants', 'Pigments & Dyes', 'Catalysts', 'Flavour & Fragrance', 'Water Treatment', 'Laboratory Chemicals']
    },
    {
        title: 'Metallurgy & Mining',
        image: '/uploads/categories/metallurgy_mining.jpg',
        subImages: ['/uploads/categories/subs/steel_beam.jpg', '/uploads/categories/subs/machinery_part.jpg'],
        subs: ['Steel Products', 'Non-Ferrous Metals', 'Ore', 'Refractories', 'Pipe Fittings', 'Ingots', 'Billets', 'Coils', 'Bars & Rods', 'Sheets & Plates']
    },
    {
        title: 'Construction & Real Estate',
        image: '/uploads/categories/construction_real_estate.jpg',
        subImages: ['/uploads/categories/subs/door_handle.jpg', '/uploads/categories/subs/steel_beam.jpg', '/uploads/categories/subs/furniture_detail.jpg'],
        subs: ['Building Materials', 'Flooring', 'Roofing', 'Walls & Cladding', 'Windows & Doors', 'Real Estate Services', 'Kitchen Fixtures', 'Bathroom Fixtures', 'Stairs & Railings', 'Timber & Lumber']
    },
    {
        title: 'Food & Beverage',
        image: '/uploads/categories/food_beverage.jpg',
        subImages: ['/uploads/categories/subs/fruit_basket.jpg', '/uploads/categories/food_beverage.jpg'],
        subs: ['Grains', 'Vegetables', 'Fruits', 'Meat & Poultry', 'Seafood', 'Dairy Products', 'Beverages', 'Canned Food', 'Snacks', 'Edible Oil']
    },
    {
        title: 'Office & School Supplies',
        image: '/uploads/categories/office_school_supplies.jpg',
        subImages: ['/uploads/categories/subs/notebook.jpg', '/uploads/categories/subs/toy_block.jpg'],
        subs: ['Stationery', 'Office Equipment', 'Calculators', 'Filing Supplies', 'Whiteboards', 'Notebooks', 'Pens & Pencils', 'Desk Organizers', 'Printer Supplies', 'School Bags']
    },
    {
        title: 'Gifts & Crafts',
        image: '/uploads/categories/gifts_crafts.jpg',
        subImages: ['/uploads/categories/gifts_crafts.jpg', '/uploads/categories/subs/ornament.jpg', '/uploads/categories/subs/lamp.jpg'],
        subs: ['Ceramics', 'Glass Crafts', 'Metal Crafts', 'Wood Crafts', 'Holiday Gifts', 'Fashion Jewellery', 'Keychains', 'Candle Holders', 'Photo Frames', 'Stickers']
    },
    {
        title: 'Lights & Lighting',
        image: '/uploads/categories/lights_lighting.jpg',
        subImages: ['/uploads/categories/subs/lamp.jpg', '/uploads/categories/subs/circuit.jpg'],
        subs: ['Indoor Lighting', 'Outdoor Lighting', 'LED Lamps', 'Smart Lighting', 'Industrial Lighting', 'Commercial Lighting', 'Decorative Lighting', 'Solar Lights', 'Holiday Lights', 'Lighting Accessories']
    },
    {
        title: 'Electrical Equipment & Supplies',
        image: '/uploads/categories/electrical_equipment.jpg',
        subImages: ['/uploads/categories/subs/circuit.jpg', '/uploads/categories/subs/machinery_part.jpg', '/uploads/categories/subs/lamp.jpg'],
        subs: ['Power Supplies', 'Transformers', 'Circuit Breakers', 'Connectors', 'Wires & Cables', 'Switches', 'Electrical Plug & Socket', 'Generators', 'Solar Panels', 'Batteries']
    }
];

async function seedLargeCategories() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing categories
        await Category.deleteMany({});
        console.log('Cleared existing categories');

        let totalParents = 0;
        let totalSubs = 0;

        for (const catData of largeCategoryData) {
            const parent = await Category.create({
                title: catData.title,
                description: `High-quality ${catData.title} from global suppliers.`,
                image: catData.image,
                level: 0,
                order: totalParents
            });
            totalParents++;
            console.log(`Created parent [${totalParents}/20]: ${parent.title}`);

            let subCount = 0;
            for (const subTitle of catData.subs) {
                // Cycle through subImages
                const imgIndex = subCount % (catData.subImages?.length || subImagePool.length);
                const subImg = catData.subImages ? catData.subImages[imgIndex] : subImagePool[imgIndex];

                await Category.create({
                    title: subTitle,
                    parent: parent._id,
                    level: 1,
                    order: subCount,
                    image: subImg
                });
                subCount++;
                totalSubs++;
            }
            console.log(`  Added ${subCount} subcategories.`);
        }

        console.log(`\nCategory seeding completed!`);
        console.log(`Total Parent Categories: ${totalParents}`);
        console.log(`Total Subcategories: ${totalSubs}`);
        process.exit();
    } catch (error) {
        console.error('Error seeding categories:', error);
        process.exit(1);
    }
}

seedLargeCategories();
