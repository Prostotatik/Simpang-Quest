import type { Poi } from '../types'

/**
 * Hard-coded prototype dataset: real Malaysian locations with real
 * coordinates. Nothing is geocoded at runtime, so the demo never depends
 * on network availability or an API quota.
 */
export const POIS: Poi[] = [
  {
    id: 'langkawi-skybridge', name: 'Langkawi Sky Bridge', lat: 6.3844, lng: 99.665,
    category: 'nature', tags: ['nature', 'adventure', 'photography', 'view'],
    costRM: 60, durationHours: 2.5, veganFriendly: false, accessible: true, region: 'Langkawi',
    description: 'A curved pedestrian bridge slung 660 m above sea level over the rainforest canopy.',
  },
  {
    id: 'langkawi-cenang', name: 'Pantai Cenang Beach', lat: 6.2903, lng: 99.7285,
    category: 'beach', tags: ['beaches', 'chill', 'photography', 'family'],
    costRM: 15, durationHours: 3, veganFriendly: true, accessible: true, region: 'Langkawi',
    description: 'The liveliest stretch of white sand in Langkawi, perfect for a slow sunset evening.',
  },
  {
    id: 'langkawi-kilim', name: 'Kilim Geoforest Park', lat: 6.4082, lng: 99.8536,
    category: 'nature', tags: ['nature', 'adventure', 'wildlife', 'photography'],
    costRM: 90, durationHours: 4, veganFriendly: false, accessible: false, region: 'Langkawi',
    description: 'Mangrove rivers, limestone karsts and eagles circling above a boat trail.',
  },
  {
    id: 'penang-streetart', name: 'George Town Street Art', lat: 5.4164, lng: 100.3327,
    category: 'culture', tags: ['art', 'culture', 'photography', 'cities'],
    costRM: 10, durationHours: 2, veganFriendly: false, accessible: true, region: 'Penang',
    description: 'A UNESCO old town stitched together by murals, iron caricatures and shophouses.',
  },
  {
    id: 'penang-streetfood', name: 'Penang Street Food', lat: 5.4373, lng: 100.3093,
    category: 'food', tags: ['food', 'culture', 'nightlife'],
    costRM: 35, durationHours: 2, veganFriendly: true, accessible: true, region: 'Penang',
    description: 'Gurney Drive hawker stalls: char kway teow, laksa and cendol until late.',
  },
  {
    id: 'penang-hill', name: 'Penang Hill', lat: 5.4239, lng: 100.2764,
    category: 'nature', tags: ['nature', 'hiking', 'view', 'photography'],
    costRM: 30, durationHours: 3, veganFriendly: false, accessible: true, region: 'Penang',
    description: 'A funicular railway climbs to cool air and a balcony view over the strait.',
  },
  {
    id: 'penang-kekloksi', name: 'Kek Lok Si Temple', lat: 5.3995, lng: 100.2732,
    category: 'culture', tags: ['culture', 'museums', 'history', 'photography'],
    costRM: 12, durationHours: 2, veganFriendly: true, accessible: false, region: 'Penang',
    description: 'The largest Buddhist temple in Malaysia, terraced up a hillside in gold and tile.',
  },
  {
    id: 'alorsetar-tower', name: 'Alor Setar Tower', lat: 6.1214, lng: 100.3679,
    category: 'city', tags: ['cities', 'view', 'photography'],
    costRM: 18, durationHours: 1.5, veganFriendly: false, accessible: true, region: 'Kedah',
    description: 'A slim telecom tower with an observation deck over the Kedah paddy plains.',
  },
  {
    id: 'taiping-lake', name: 'Taiping Lake Gardens', lat: 4.85, lng: 100.74,
    category: 'nature', tags: ['nature', 'chill', 'family', 'photography'],
    costRM: 0, durationHours: 2, veganFriendly: false, accessible: true, region: 'Perak',
    description: 'Rain trees arching over still water in the oldest public garden in the country.',
  },
  {
    id: 'ipoh-oldtown', name: 'Ipoh Old Town', lat: 4.5975, lng: 101.0901,
    category: 'culture', tags: ['culture', 'art', 'food', 'photography'],
    costRM: 20, durationHours: 3, veganFriendly: true, accessible: true, region: 'Perak',
    description: 'White coffee, colonial facades and back-lane murals in an old tin-mining town.',
  },
  {
    id: 'ipoh-kellies', name: 'Kellie’s Castle', lat: 4.4661, lng: 101.1012,
    category: 'culture', tags: ['culture', 'museums', 'history', 'photography'],
    costRM: 12, durationHours: 1.5, veganFriendly: false, accessible: false, region: 'Perak',
    description: 'An unfinished Scottish mansion in the jungle, half ruin and half ghost story.',
  },
  {
    id: 'cameron-tea', name: 'Cameron Highlands', lat: 4.471, lng: 101.3776,
    category: 'nature', tags: ['nature', 'hiking', 'chill', 'photography'],
    costRM: 80, durationHours: 6, veganFriendly: true, accessible: true, region: 'Pahang',
    description: 'Tea plantations, mossy forests, and fresh mountain air.',
  },
  {
    id: 'cameron-mossy', name: 'Mossy Forest', lat: 4.5286, lng: 101.3826,
    category: 'nature', tags: ['nature', 'hiking', 'adventure', 'active'],
    costRM: 45, durationHours: 3, veganFriendly: false, accessible: false, region: 'Pahang',
    description: 'A cloud forest boardwalk through dripping moss and stunted, twisted trees.',
  },
  {
    id: 'taman-negara', name: 'Taman Negara', lat: 4.3833, lng: 102.4,
    category: 'nature', tags: ['nature', 'adventure', 'hiking', 'wildlife', 'active'],
    costRM: 120, durationHours: 8, veganFriendly: false, accessible: false, region: 'Pahang',
    description: 'A 130-million-year-old rainforest with one of the longest canopy walkways on earth.',
  },
  {
    id: 'kuala-gandah', name: 'Kuala Gandah Elephant Sanctuary', lat: 3.4325, lng: 102.1662,
    category: 'nature', tags: ['nature', 'wildlife', 'family', 'chill'],
    costRM: 25, durationHours: 3, veganFriendly: true, accessible: true, region: 'Pahang',
    description: 'A conservation centre for rescued Asian elephants inside the Krau reserve.',
  },
  {
    id: 'kotabharu-market', name: 'Kota Bharu Central Market', lat: 6.1254, lng: 102.2381,
    category: 'culture', tags: ['culture', 'food', 'art', 'shopping'],
    costRM: 15, durationHours: 2, veganFriendly: true, accessible: true, region: 'Kelantan',
    description: 'A three-tier spiral of spice traders, batik and nasi kerabu in Kelantan.',
  },
  {
    id: 'redang-island', name: 'Redang Island', lat: 5.7833, lng: 103.0167,
    category: 'beach', tags: ['beaches', 'nature', 'adventure', 'chill'],
    costRM: 140, durationHours: 8, veganFriendly: false, accessible: false, region: 'Terengganu',
    description: 'Clear shallow reefs and powdered sand out on the South China Sea side.',
  },
  {
    id: 'crystal-mosque', name: 'Crystal Mosque', lat: 5.325, lng: 103.145,
    category: 'culture', tags: ['culture', 'museums', 'photography', 'history'],
    costRM: 10, durationHours: 1.5, veganFriendly: false, accessible: true, region: 'Terengganu',
    description: 'Steel and glass domes mirrored in the Terengganu river at dusk.',
  },
  {
    id: 'cherating', name: 'Cherating Turtle Beach', lat: 4.129, lng: 103.396,
    category: 'beach', tags: ['beaches', 'nature', 'wildlife', 'chill'],
    costRM: 20, durationHours: 3, veganFriendly: false, accessible: true, region: 'Pahang',
    description: 'A long surf beach with a turtle hatchery and a firefly river nearby.',
  },
  {
    id: 'kuantan-teluk', name: 'Teluk Cempedak Beach', lat: 3.81, lng: 103.3722,
    category: 'beach', tags: ['beaches', 'chill', 'photography', 'family'],
    costRM: 12, durationHours: 3, veganFriendly: true, accessible: true, region: 'Pahang',
    description: 'An easy city beach, boulders at one end and satay grills at the other.',
  },
  {
    id: 'kl-petronas', name: 'Petronas Twin Towers', lat: 3.1578, lng: 101.7117,
    category: 'city', tags: ['cities', 'view', 'photography', 'art'],
    costRM: 98, durationHours: 2, veganFriendly: false, accessible: true, region: 'Kuala Lumpur',
    description: 'The steel-clad twins and their skybridge, best at blue hour from the park.',
  },
  {
    id: 'kl-tower', name: 'KL Tower', lat: 3.1528, lng: 101.7039,
    category: 'city', tags: ['cities', 'view', 'photography'],
    costRM: 50, durationHours: 1.5, veganFriendly: false, accessible: true, region: 'Kuala Lumpur',
    description: 'A glass sky box cantilevered 300 m above the forest reserve in the city centre.',
  },
  {
    id: 'batu-caves', name: 'Batu Caves', lat: 3.2379, lng: 101.684,
    category: 'culture', tags: ['culture', 'history', 'hiking', 'photography'],
    costRM: 12, durationHours: 2, veganFriendly: true, accessible: false, region: 'Kuala Lumpur',
    description: 'A limestone cathedral above 272 rainbow steps and a gilded statue.',
  },
  {
    id: 'jalan-alor', name: 'Jalan Alor', lat: 3.1458, lng: 101.7085,
    category: 'food', tags: ['food', 'nightlife', 'culture'],
    costRM: 35, durationHours: 2.5, veganFriendly: true, accessible: true, region: 'Kuala Lumpur',
    description: 'A whole street that turns into plastic stools, smoke and grilled everything.',
  },
  {
    id: 'kl-nightmarket', name: 'Kuala Lumpur Night Market', lat: 3.1436, lng: 101.6981,
    category: 'food', tags: ['food', 'nightlife', 'cities', 'shopping'],
    costRM: 30, durationHours: 2, veganFriendly: false, accessible: true, region: 'Kuala Lumpur',
    description: 'Petaling Street after dark: lanterns, bargaining and late-night noodles.',
  },
  {
    id: 'kl-perdana', name: 'Perdana Botanical Garden', lat: 3.1436, lng: 101.6869,
    category: 'nature', tags: ['nature', 'chill', 'family', 'photography'],
    costRM: 0, durationHours: 2, veganFriendly: false, accessible: true, region: 'Kuala Lumpur',
    description: 'The oldest park in the capital: orchid houses, a deer pen and a lake loop.',
  },
  {
    id: 'putra-mosque', name: 'Putra Mosque', lat: 2.9353, lng: 101.6919,
    category: 'culture', tags: ['culture', 'photography', 'museums', 'history'],
    costRM: 0, durationHours: 1.5, veganFriendly: false, accessible: true, region: 'Putrajaya',
    description: 'Rose-tinted granite domes floating on the edge of the Putrajaya lake.',
  },
  {
    id: 'portdickson', name: 'Blue Lagoon, Port Dickson', lat: 2.4485, lng: 101.8524,
    category: 'beach', tags: ['beaches', 'chill', 'family'],
    costRM: 15, durationHours: 3, veganFriendly: true, accessible: true, region: 'Negeri Sembilan',
    description: 'A sheltered cove an easy drive from the capital, calm enough for swimming.',
  },
  {
    id: 'seremban-food', name: 'Seremban Hawker Lane', lat: 2.7297, lng: 101.9381,
    category: 'food', tags: ['food', 'culture'],
    costRM: 22, durationHours: 1.5, veganFriendly: false, accessible: true, region: 'Negeri Sembilan',
    description: 'Siew pau straight from the oven and rendang with deep Minangkabau roots.',
  },
  {
    id: 'melaka-stadthuys', name: 'Melaka Historic City', lat: 2.1942, lng: 102.2486,
    category: 'culture', tags: ['culture', 'museums', 'history', 'photography'],
    costRM: 40, durationHours: 2.5, veganFriendly: false, accessible: true, region: 'Melaka',
    description: 'Dutch red squares, Portuguese ruins and a river of murals in a single walk.',
  },
  {
    id: 'melaka-jonker', name: 'Jonker Street', lat: 2.1953, lng: 102.2465,
    category: 'food', tags: ['food', 'culture', 'art', 'nightlife', 'shopping'],
    costRM: 40, durationHours: 3, veganFriendly: true, accessible: true, region: 'Melaka',
    description: 'A weekend night market of Peranakan antiques, satay celup and chendol.',
  },
  {
    id: 'tioman-island', name: 'Tioman Island', lat: 2.79, lng: 104.17,
    category: 'beach', tags: ['beaches', 'adventure', 'nature', 'photography'],
    costRM: 90, durationHours: 6, veganFriendly: false, accessible: false, region: 'Pahang',
    description: 'Crystal clear waters, great for snorkeling and diving. Perfect for a relaxed day by the sea.',
  },
  {
    id: 'juara-beach', name: 'Juara Beach', lat: 2.82, lng: 104.2,
    category: 'beach', tags: ['beaches', 'chill', 'nature', 'wildlife'],
    costRM: 75, durationHours: 4, veganFriendly: true, accessible: false, region: 'Pahang',
    description: 'The quiet east side of Tioman: a turtle hatchery and almost nobody else.',
  },
  {
    id: 'jb-legoland', name: 'Legoland Malaysia', lat: 1.427, lng: 103.632,
    category: 'city', tags: ['family', 'cities', 'adventure', 'active'],
    costRM: 220, durationHours: 6, veganFriendly: true, accessible: true, region: 'Johor',
    description: 'A full-size theme park built out of forty million plastic bricks.',
  },
  {
    id: 'jb-nightmarket', name: 'Johor Bahru Night Market', lat: 1.4927, lng: 103.7414,
    category: 'food', tags: ['food', 'nightlife', 'culture', 'shopping'],
    costRM: 28, durationHours: 2, veganFriendly: true, accessible: true, region: 'Johor',
    description: 'Pasar malam stalls on the causeway side: cheap, loud and very good.',
  },
  // --- places to sleep: inserted by the planner when a day ends far from base
  {
    id: 'stay-kl', name: 'Bukit Bintang Hotel', lat: 3.147, lng: 101.7122,
    category: 'stay', tags: ['cities', 'chill'],
    costRM: 200, durationHours: 10, veganFriendly: true, accessible: true, region: 'Kuala Lumpur',
    description: 'A mid-range tower right off the shopping strip, ten minutes from Jalan Alor.',
  },
  {
    id: 'stay-penang', name: 'George Town Heritage Hotel', lat: 5.4182, lng: 100.3352,
    category: 'stay', tags: ['culture', 'chill'],
    costRM: 160, durationHours: 10, veganFriendly: true, accessible: true, region: 'Penang',
    description: 'A restored shophouse with a courtyard, inside the heritage zone.',
  },
  {
    id: 'stay-ipoh', name: 'Ipoh Riverside Hotel', lat: 4.596, lng: 101.0872,
    category: 'stay', tags: ['chill'],
    costRM: 120, durationHours: 10, veganFriendly: false, accessible: true, region: 'Perak',
    description: 'Plain, clean rooms a short walk from the old town kopitiams.',
  },
  {
    id: 'stay-cameron', name: 'Cameron Highlands Inn', lat: 4.472, lng: 101.3802,
    category: 'stay', tags: ['nature', 'chill'],
    costRM: 140, durationHours: 10, veganFriendly: true, accessible: false, region: 'Pahang',
    description: 'A tudor-style guesthouse with a fireplace and cold mountain nights.',
  },
  {
    id: 'stay-melaka', name: 'Jonker Boutique Hotel', lat: 2.1958, lng: 102.249,
    category: 'stay', tags: ['culture', 'chill'],
    costRM: 150, durationHours: 10, veganFriendly: true, accessible: true, region: 'Melaka',
    description: 'Peranakan tiles, a tiny pool, and the night market outside the door.',
  },
  {
    id: 'stay-kuantan', name: 'Teluk Cempedak Motel', lat: 3.809, lng: 103.37,
    category: 'stay', tags: ['beaches', 'chill'],
    costRM: 110, durationHours: 10, veganFriendly: false, accessible: true, region: 'Pahang',
    description: 'A simple motel across the road from the sand.',
  },
  {
    id: 'stay-tioman', name: 'Tioman Beach Chalet', lat: 2.8, lng: 104.1482,
    category: 'stay', tags: ['beaches', 'chill', 'nature'],
    costRM: 170, durationHours: 10, veganFriendly: true, accessible: false, region: 'Pahang',
    description: 'Wooden chalets on stilts, a few metres from the reef.',
  },
  {
    id: 'stay-kotabharu', name: 'Kota Bharu Rest House', lat: 6.123, lng: 102.2402,
    category: 'stay', tags: ['culture', 'chill'],
    costRM: 95, durationHours: 10, veganFriendly: true, accessible: true, region: 'Kelantan',
    description: 'An old government rest house, cheap and quiet.',
  },
  {
    id: 'stay-jb', name: 'Johor Bahru City Hotel', lat: 1.495, lng: 103.75,
    category: 'stay', tags: ['cities', 'chill'],
    costRM: 130, durationHours: 10, veganFriendly: true, accessible: true, region: 'Johor',
    description: 'A business hotel by the causeway, good for an early start.',
  },
  {
    id: 'stay-terengganu', name: 'Kuala Terengganu Waterfront', lat: 5.3305, lng: 103.1402,
    category: 'stay', tags: ['culture', 'chill', 'beaches'],
    costRM: 115, durationHours: 10, veganFriendly: false, accessible: true, region: 'Terengganu',
    description: 'Rooms over the river mouth, with the Crystal Mosque lit up at night.',
  },
  {
    id: 'stay-langkawi', name: 'Cenang Beach Resort', lat: 6.288, lng: 99.7312,
    category: 'stay', tags: ['beaches', 'chill'],
    costRM: 180, durationHours: 10, veganFriendly: true, accessible: true, region: 'Langkawi',
    description: 'Bungalows behind the dune line, right where the sunset happens.',
  },
]

export const poiById = (id: string) => POIS.find((p) => p.id === id)
