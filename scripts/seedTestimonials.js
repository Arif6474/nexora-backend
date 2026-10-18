import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Testimonial from '../models/testimonialModel.js';

dotenv.config();

const DUMMY_TESTIMONIALS = [
    {
        author: "Sarah Jenkins",
        role: "Creative Director, Paris",
        content: "Nexora has redefined how I view lifestyle luxury. Each piece is a masterclass in detail, drape, and modern soul.",
        rating: 5,
        size: "large",
        serial: 1,
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
        isActive: true
    },
    {
        author: "Marcus Thorne",
        role: "Architect, Milan",
        content: "The curated selection is unparalleled. I finally found a store that speaks my aesthetic language of quiet sophistication.",
        rating: 5,
        size: "medium",
        serial: 2,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
        isActive: true
    },
    {
        author: "Elena Laurent",
        role: "Fashion Stylist, London",
        content: "Shopping here feels less like a transaction and more like discovering a piece of functional art. The craftsmanship is flawless.",
        rating: 5,
        size: "small",
        serial: 3,
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face",
        isActive: true
    },
    {
        author: "James West",
        role: "Interior Designer, New York",
        content: "The attention to detail in packaging, hand-stitching, and delivery is just as impressive as the products themselves.",
        rating: 5,
        size: "medium",
        serial: 4,
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
        isActive: true
    },
    {
        author: "Sophia Rossi",
        role: "Art Director, Florence",
        content: "Nexora is my definitive go-to for pieces that are minimal yet command subtle attention in any setting.",
        rating: 5,
        size: "small",
        serial: 5,
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
        isActive: true
    },
    {
        author: "David Kowalski",
        role: "Venture Partner, Zurich",
        content: "A seamless experience from digital discovery to unboxing. Truly the gold standard of contemporary luxury e-commerce.",
        rating: 5,
        size: "medium",
        serial: 6,
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
        isActive: true
    },
    {
        author: "Camille Dupont",
        role: "Editorial Stylist, Tokyo",
        content: "The pure wool silhouettes and tailored essentials are investment pieces that elevate everything else in my collection.",
        rating: 5,
        size: "medium",
        serial: 7,
        image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop&crop=face",
        isActive: true
    },
    {
        author: "Julian Vance",
        role: "Design Consultant, Berlin",
        content: "Impeccable cut, architectural precision, and an ethos of quality that is increasingly rare in today's fashion landscape.",
        rating: 5,
        size: "large",
        serial: 8,
        image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face",
        isActive: true
    }
];

async function seedTestimonials() {
    console.log('--- Connecting to MongoDB ---');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Remove existing seeded testimonials or keep them
    const existingCount = await Testimonial.countDocuments();
    console.log(`Found ${existingCount} existing testimonials.`);

    if (existingCount === 0) {
        console.log('Inserting dummy testimonials...');
        await Testimonial.insertMany(DUMMY_TESTIMONIALS);
        console.log(`Successfully seeded ${DUMMY_TESTIMONIALS.length} testimonials.`);
    } else {
        console.log('Refreshing/upserting dummy testimonials...');
        for (const t of DUMMY_TESTIMONIALS) {
            await Testimonial.findOneAndUpdate(
                { author: t.author },
                { $set: t },
                { upsert: true, new: true }
            );
        }
        console.log(`Successfully updated/seeded testimonials.`);
    }

    const total = await Testimonial.countDocuments();
    console.log(`Total testimonials in DB: ${total}`);

    await mongoose.disconnect();
    console.log('MongoDB disconnected. Done!');
}

seedTestimonials().catch((err) => {
    console.error('Error seeding testimonials:', err);
    process.exit(1);
});
