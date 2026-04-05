// =============================================
// Database Seed Script
// Run: node utils/seed.js
// =============================================

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Event.deleteMany({});

    // Create admin
    const admin = await User.create({
      name: 'EventFlow Admin',
      email: process.env.ADMIN_EMAIL || 'admin@eventflow.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin',
      isVerified: true
    });
    console.log('✅ Admin created:', admin.email);

    // Create demo users
    const user1 = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@demo.com',
      password: 'Demo@1234',
      role: 'user',
      isVerified: true
    });

    // Create sample events
    const now = new Date();
    const events = [
      {
        title: 'TechSummit 2025 — Future of AI',
        shortDescription: 'India\'s biggest AI & technology conference with 50+ speakers',
        description: 'Join 5000+ tech enthusiasts, founders, and developers at TechSummit 2025. Explore cutting-edge AI, Web3, and emerging technologies. Network with industry leaders and attend hands-on workshops.',
        category: 'Technology',
        tags: ['AI', 'Machine Learning', 'Web3', 'Startups'],
        location: { venue: 'Bombay Exhibition Centre', address: 'NSE Complex, Goregaon', city: 'Mumbai', state: 'Maharashtra', country: 'India', isOnline: false },
        startDate: new Date(now.getFullYear(), now.getMonth() + 1, 15, 9, 0),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 16, 18, 0),
        registrationDeadline: new Date(now.getFullYear(), now.getMonth() + 1, 13),
        ticketTypes: [
          { name: 'General', price: 999, totalSeats: 2000 },
          { name: 'Pro', price: 2499, totalSeats: 500, description: 'Includes workshops + meals' },
          { name: 'VIP', price: 4999, totalSeats: 100, description: 'VIP lounge + speaker meet & greet' }
        ],
        maxCapacity: 2600,
        status: 'published',
        isFeatured: true,
        organizer: admin._id,
        organizerName: admin.name,
        coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
        highlights: ['50+ World-Class Speakers', 'AI Hackathon', 'Networking Dinner', 'Workshop Sessions', 'Startup Pitches']
      },
      {
        title: 'Harmony Music Festival 2025',
        shortDescription: '3-day open-air music festival featuring 30+ artists across 5 stages',
        description: 'Experience the magic of live music at Harmony Festival 2025. Three days of non-stop music across 5 stages featuring indie, EDM, classical fusion, and world music.',
        category: 'Music',
        tags: ['Music', 'Festival', 'Live', 'EDM', 'Indie'],
        location: { venue: 'Mahalaxmi Racecourse', city: 'Mumbai', state: 'Maharashtra', country: 'India' },
        startDate: new Date(now.getFullYear(), now.getMonth() + 2, 5, 16, 0),
        endDate: new Date(now.getFullYear(), now.getMonth() + 2, 7, 23, 0),
        ticketTypes: [
          { name: 'Day Pass', price: 1499, totalSeats: 5000 },
          { name: '3-Day Pass', price: 3499, totalSeats: 3000 },
          { name: 'Backstage VIP', price: 8999, totalSeats: 200 }
        ],
        maxCapacity: 8200,
        status: 'published',
        isFeatured: true,
        organizer: admin._id,
        organizerName: admin.name,
        coverImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200',
        highlights: ['30+ Artists', '5 Stages', 'Food & Art Village', 'Camping Zone']
      },
      {
        title: 'Startup Founders Bootcamp',
        shortDescription: 'Intensive 2-day program to help you go from idea to funded startup',
        description: 'Join 200 ambitious founders for an intensive two-day bootcamp. Learn fundraising, product-market fit, go-to-market strategy, and pitch to real investors on Day 2.',
        category: 'Business',
        tags: ['Startup', 'Entrepreneurship', 'Fundraising', 'VC'],
        location: { venue: 'NSRCEL IIM Bangalore', city: 'Bangalore', state: 'Karnataka', country: 'India' },
        startDate: new Date(now.getFullYear(), now.getMonth() + 1, 20, 8, 0),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 21, 18, 0),
        ticketTypes: [
          { name: 'Founder', price: 4999, totalSeats: 150, description: 'Full access + mentoring session' },
          { name: 'Team (3 people)', price: 11999, totalSeats: 20 }
        ],
        maxCapacity: 170,
        status: 'published',
        isFeatured: false,
        organizer: admin._id,
        organizerName: admin.name,
        coverImage: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200',
        highlights: ['Investor Pitching', 'Mentorship', 'Certificate', 'Lifetime Community Access']
      },
      {
        title: 'Free React Workshop — Build in Public',
        shortDescription: 'Free hands-on React workshop for developers of all levels',
        description: 'Join our community React workshop where we build a real app live. Suitable for beginners and intermediate developers. Bring your laptop!',
        category: 'Technology',
        tags: ['React', 'JavaScript', 'Coding', 'Free'],
        location: { venue: 'Online (Zoom)', city: 'Online', isOnline: true, onlineLink: 'https://zoom.us/j/example' },
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10, 10, 0),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10, 14, 0),
        ticketTypes: [
          { name: 'Free Seat', price: 0, totalSeats: 500 }
        ],
        maxCapacity: 500,
        status: 'published',
        isFeatured: true,
        organizer: admin._id,
        organizerName: admin.name,
        coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200'
      }
    ];

    for (const ev of events) {
      await Event.create(ev);
    }
    console.log('✅ Sample events created');

    console.log('\n🎉 Seed complete!');
    console.log('Admin credentials:');
    console.log('  Email:', process.env.ADMIN_EMAIL || 'admin@eventflow.com');
    console.log('  Password:', process.env.ADMIN_PASSWORD || 'Admin@123456');
    console.log('\nDemo user:');
    console.log('  Email: rahul@demo.com');
    console.log('  Password: Demo@1234');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
