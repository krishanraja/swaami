export interface User {
  id: string;
  phone: string;
  radius: number;
  skills: string[];
  availability: 'now' | 'later' | 'this-week';
  credits: number;
  createdAt: Date;
}

export interface Task {
  id: string;
  ownerId: string;
  helperId?: string;
  title: string;
  description: string;
  timeEstimate: string;
  distance: number;
  location: {
    lat: number;
    lng: number;
    approxAddress: string;
  };
  status: 'open' | 'matched' | 'in-progress' | 'completed';
  createdAt: Date;
}

export interface Message {
  id: string;
  taskId: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

export type Skill = {
  id: string;
  label: string;
  icon: string;
};

export const SKILLS: Skill[] = [
  { id: 'groceries', label: 'Groceries', icon: '🛒' },
  { id: 'tech', label: 'Tech Help', icon: '💻' },
  { id: 'transport', label: 'Transport', icon: '🚗' },
  { id: 'cooking', label: 'Cooking', icon: '🍳' },
  { id: 'pets', label: 'Pet Care', icon: '🐕' },
  { id: 'handyman', label: 'Handyman', icon: '🔧' },
  { id: 'childcare', label: 'Childcare', icon: '👶' },
  { id: 'language', label: 'Language', icon: '🗣️' },
  { id: 'medical', label: 'Medical', icon: '🏥' },
  { id: 'garden', label: 'Gardening', icon: '🌱' },
];

export const SAMPLE_TASKS: Task[] = [
  {
    id: '1',
    ownerId: 'user1',
    title: 'Carry groceries upstairs',
    description: 'Need help carrying 3 bags of groceries to the 4th floor. No elevator.',
    timeEstimate: '10-15 mins',
    distance: 150,
    location: { lat: 0, lng: 0, approxAddress: 'Nearby' },
    status: 'open',
    createdAt: new Date(),
  },
  {
    id: '2',
    ownerId: 'user2',
    title: 'Quick laptop fix',
    description: 'My laptop is running slow, might need some cleanup or virus scan.',
    timeEstimate: '20 mins',
    distance: 400,
    location: { lat: 0, lng: 0, approxAddress: 'Nearby' },
    status: 'open',
    createdAt: new Date(),
  },
  {
    id: '3',
    ownerId: 'user3',
    title: 'Walk my dog',
    description: 'Golden retriever needs a 20 min walk. Very friendly!',
    timeEstimate: '25 mins',
    distance: 280,
    location: { lat: 0, lng: 0, approxAddress: 'Nearby' },
    status: 'open',
    createdAt: new Date(),
  },
  {
    id: '4',
    ownerId: 'user4',
    title: 'Pick up package',
    description: 'Package at the post office, I can\'t go today. Will share details.',
    timeEstimate: '30 mins',
    distance: 520,
    location: { lat: 0, lng: 0, approxAddress: 'Nearby' },
    status: 'open',
    createdAt: new Date(),
  },
  {
    id: '5',
    ownerId: 'user5',
    title: 'Help with moving boxes',
    description: 'Moving to new apartment next door. Need help with 5 boxes.',
    timeEstimate: '45 mins',
    distance: 90,
    location: { lat: 0, lng: 0, approxAddress: 'Nearby' },
    status: 'open',
    createdAt: new Date(),
  },
];
