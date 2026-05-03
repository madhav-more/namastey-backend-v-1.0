/**
 * Namastey — All hardcoded data for MVP Phase 1.
 * Cities, areas, location types, greeting packages, cultural themes, and add-ons.
 */

const CITIES = [
  {
    id: 'pune',
    name: 'Pune',
    state: 'Maharashtra',
    areas: [
      { id: 'pune-airport', name: 'Pune Airport (Lohegaon)', type: 'airport' },
      { id: 'pune-station', name: 'Pune Junction Railway Station', type: 'railway' },
      { id: 'pune-swargate', name: 'Swargate Bus Stand', type: 'bus' },
      { id: 'pune-shivajinagar', name: 'Shivajinagar Bus Stand', type: 'bus' },
      { id: 'pune-hinjewadi', name: 'Hinjewadi', type: 'area' },
      { id: 'pune-koregaon', name: 'Koregaon Park', type: 'area' },
      { id: 'pune-kothrud', name: 'Kothrud', type: 'area' },
      { id: 'pune-wakad', name: 'Wakad', type: 'area' },
      { id: 'pune-baner', name: 'Baner', type: 'area' },
      { id: 'pune-viman-nagar', name: 'Viman Nagar', type: 'area' },
    ],
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    areas: [
      { id: 'mumbai-airport-t1', name: 'Mumbai Airport Terminal 1', type: 'airport' },
      { id: 'mumbai-airport-t2', name: 'Mumbai Airport Terminal 2', type: 'airport' },
      { id: 'mumbai-cst', name: 'CST (Chhatrapati Shivaji Terminus)', type: 'railway' },
      { id: 'mumbai-dadar', name: 'Dadar Railway Station', type: 'railway' },
      { id: 'mumbai-borivali', name: 'Borivali Bus Depot', type: 'bus' },
      { id: 'mumbai-andheri', name: 'Andheri', type: 'area' },
      { id: 'mumbai-bandra', name: 'Bandra', type: 'area' },
      { id: 'mumbai-juhu', name: 'Juhu', type: 'area' },
      { id: 'mumbai-powai', name: 'Powai', type: 'area' },
      { id: 'mumbai-colaba', name: 'Colaba', type: 'area' },
    ],
  },
  {
    id: 'solapur',
    name: 'Solapur',
    state: 'Maharashtra',
    areas: [
      { id: 'solapur-airport', name: 'Solapur Airport', type: 'airport' },
      { id: 'solapur-station', name: 'Solapur Railway Station', type: 'railway' },
      { id: 'solapur-cbs', name: 'Solapur CBS', type: 'bus' },
      { id: 'solapur-laxmi-peth', name: 'Laxmi Peth', type: 'area' },
      { id: 'solapur-vijapur', name: 'Vijapur Road', type: 'area' },
      { id: 'solapur-akkalkot', name: 'Akkalkot Road', type: 'area' },
    ],
  },
  {
    id: 'delhi',
    name: 'Delhi',
    state: 'Delhi',
    areas: [
      { id: 'delhi-igi-t1', name: 'IGI Airport Terminal 1', type: 'airport' },
      { id: 'delhi-igi-t3', name: 'IGI Airport Terminal 3', type: 'airport' },
      { id: 'delhi-ndls', name: 'New Delhi Railway Station', type: 'railway' },
      { id: 'delhi-hazrat', name: 'Hazrat Nizamuddin Station', type: 'railway' },
      { id: 'delhi-isbt-kashmere', name: 'ISBT Kashmere Gate', type: 'bus' },
      { id: 'delhi-connaught', name: 'Connaught Place', type: 'area' },
      { id: 'delhi-saket', name: 'Saket', type: 'area' },
      { id: 'delhi-karol-bagh', name: 'Karol Bagh', type: 'area' },
      { id: 'delhi-dwarka', name: 'Dwarka', type: 'area' },
      { id: 'delhi-rohini', name: 'Rohini', type: 'area' },
    ],
  },
];

const LOCATION_TYPES = [
  { id: 'airport', name: 'Airport', icon: 'airplane' },
  { id: 'railway', name: 'Railway Station', icon: 'train' },
  { id: 'bus', name: 'Bus Stand', icon: 'bus' },
  { id: 'area', name: 'Area / Address', icon: 'map-pin' },
];

const GREETING_PACKAGES = [
  {
    id: 'namastey-classic',
    name: 'Namastey Classic',
    description: 'A warm, traditional welcome with a placard, genuine smile, and sacred tilak.',
    price: 499,
    currency: 'INR',
    includes: ['Personalized placard', 'Traditional smile greeting', 'Sacred tilak'],
    image: 'namastey_classic',
    popular: true,
  },
  {
    id: 'celebration-delight',
    name: 'Celebration Delight',
    description: 'Make their arrival a celebration with balloons, flowers, cake, and a photo session.',
    price: 1499,
    currency: 'INR',
    includes: ['Colorful balloons', 'Fresh flower bouquet', 'Celebration cake', 'Photo session'],
    image: 'celebration_delight',
    popular: false,
  },
  {
    id: 'grand-indian-welcome',
    name: 'Grand Indian Welcome',
    description: 'The ultimate royal welcome — garland, aarti, and live shehnai music (if available).',
    price: 2999,
    currency: 'INR',
    includes: ['Traditional garland', 'Sacred aarti ceremony', 'Live shehnai (subject to availability)'],
    image: 'grand_indian_welcome',
    popular: false,
  },
  {
    id: 'custom-package',
    name: 'Custom Package',
    description: 'Build your own welcome experience. Choose from our curated add-ons.',
    price: 299,
    currency: 'INR',
    includes: ['Base service fee', 'Choose any add-ons below'],
    image: 'custom_package',
    popular: false,
  },
];

const CULTURAL_THEMES = [
  {
    id: 'indian-traditional',
    name: 'Indian Traditional',
    description: 'Classic Indian welcome with folded hands Namaste, kurta-clad greeters, and sandalwood fragrance.',
    costumes: 'Traditional kurta/saree',
    gestures: ['Namaste with folded hands', 'Tilak application', 'Aarti with diya'],
    image: 'indian_traditional',
  },
  {
    id: 'south-indian-temple',
    name: 'South Indian Temple Welcome',
    description: 'Temple-inspired welcome with brass lamp, kolam art, and carnation garlands.',
    costumes: 'White veshti/silk saree',
    gestures: ['Brass kuthu vilakku lighting', 'Flower garland offering', 'Sacred ash blessing'],
    image: 'south_indian_temple',
  },
  {
    id: 'punjabi-bhangra',
    name: 'Punjabi Bhangra Beat',
    description: 'Energetic Punjabi celebration with dhol beats, bhangra dancers, and lassi welcome drink.',
    costumes: 'Colorful Punjabi attire with turban',
    gestures: ['Dhol beats welcome', 'Bhangra dance', 'Lassi offering'],
    image: 'punjabi_bhangra',
  },
  {
    id: 'marwari-aarti',
    name: 'Marwari Aarti',
    description: 'Rajasthani royal welcome with aarti thali, marigold garlands, and folk music.',
    costumes: 'Rajasthani leheriya/bandhani attire',
    gestures: ['Grand aarti ceremony', 'Marigold mala', 'Rajasthani folk tune'],
    image: 'marwari_aarti',
  },
];

const ADDONS = [
  { id: 'flowers', name: 'Flowers', description: 'Fresh flower bouquet', price: 299, icon: '🌸' },
  { id: 'chocolate-box', name: 'Chocolate Box', description: 'Premium chocolate assortment', price: 399, icon: '🍫' },
  { id: 'video-message', name: 'Recorded Video Message', description: 'Professional recorded greeting video', price: 199, icon: '🎥' },
  { id: 'live-musician', name: 'Live Musician', description: 'Live instrumental welcome music', price: 1999, icon: '🎵' },
  { id: 'red-carpet', name: 'Red Carpet', description: 'VIP red carpet welcome experience', price: 999, icon: '🎗️' },
];

const BOOKING_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

module.exports = {
  CITIES,
  LOCATION_TYPES,
  GREETING_PACKAGES,
  CULTURAL_THEMES,
  ADDONS,
  BOOKING_STATUSES,
  USER_ROLES,
};
