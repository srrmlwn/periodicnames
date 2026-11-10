export const POPULAR_NAMES_YEAR = 2025;

export const POPULAR_GIRL_NAMES = [
  'Olivia', 'Charlotte', 'Emma', 'Amelia', 'Sophia', 'Mia', 'Isabella', 'Evelyn', 'Sofia', 'Eliana',
  'Ava', 'Eleanor', 'Violet', 'Ailany', 'Aurora', 'Harper', 'Elizabeth', 'Lily', 'Camila', 'Nora',
  'Hazel', 'Penelope', 'Chloe', 'Ellie', 'Lucy', 'Aria', 'Luna', 'Isla', 'Ella', 'Lainey',
  'Zoe', 'Scarlett', 'Gianna', 'Emily', 'Valentina', 'Layla', 'Avery', 'Grace', 'Ivy', 'Madison',
  'Abigail', 'Elena', 'Mila', 'Willow', 'Emilia', 'Nova', 'Naomi', 'Riley', 'Eloise', 'Sadie',
  'Delilah', 'Stella', 'Josephine', 'Victoria', 'Sophie', 'Hannah', 'Lillian', 'Leah', 'Adeline', 'Leilani',
  'Iris', 'Maya', 'Clara', 'Ruby', 'Alice', 'Genesis', 'Paisley', 'Claire', 'Zoey', 'Eden',
  'Madelyn', 'Vivian', 'Millie', 'Emery', 'Daisy', 'Maeve', 'Ayla', 'Liliana', 'Melody', 'Lyla',
  'Madeline', 'Josie', 'Lucia', 'Addison', 'Kennedy', 'Audrey', 'Maria', 'Autumn', 'Natalie', 'Sarah',
  'Everly', 'Lydia', 'Kinsley', 'Sienna', 'Jade', 'Caroline', 'Quinn', 'Amara', 'Georgia', 'Juniper',
];

export const POPULAR_BOY_NAMES = [
  'Liam', 'Noah', 'Oliver', 'Theodore', 'Henry', 'James', 'Elijah', 'Mateo', 'William', 'Lucas',
  'Benjamin', 'Levi', 'Elias', 'Luca', 'Jack', 'Sebastian', 'Hudson', 'Samuel', 'Leo', 'Ezra',
  'Michael', 'Daniel', 'John', 'Ethan', 'Julian', 'Santiago', 'Cooper', 'Asher', 'Joseph', 'Alexander',
  'Owen', 'Matthew', 'Luke', 'Thomas', 'David', 'Jackson', 'Gabriel', 'Wyatt', 'Mason', 'Bennett',
  'Dylan', 'Roman', 'Jacob', 'Miles', 'Carter', 'Anthony', 'Isaac', 'Charles', 'Maverick', 'Thiago',
  'Grayson', 'Wesley', 'Logan', 'Josiah', 'Weston', 'Waylon', 'Isaiah', 'Caleb', 'Rowan', 'Beau',
  'Ezekiel', 'Aiden', 'Nathan', 'Brooks', 'Nolan', 'Joshua', 'Angel', 'Christopher', 'Lincoln', 'Jayden',
  'Silas', 'Enzo', 'Andrew', 'Adrian', 'Atlas', 'Cameron', 'Everett', 'Walker', 'Axel', 'Aaron',
  'August', 'Theo', 'Ian', 'Adriel', 'Luka', 'Gael', 'Arthur', 'Jeremiah', 'Jonathan', 'Micah',
  'Leonardo', 'Robert', 'Kai', 'Emiliano', 'Jose', 'Christian', 'Eithan', 'Archer', 'Ryan', 'Myles',
];

export const POPULAR_NAMES = [...POPULAR_GIRL_NAMES, ...POPULAR_BOY_NAMES].sort((a, b) => a.localeCompare(b));

const POPULAR_BY_SLUG = new Map(POPULAR_NAMES.map(n => [n.toLowerCase(), n]));

export function popularNameSlug(name: string): string {
  return name.toLowerCase();
}

export function findPopularName(name: string): string | undefined {
  return POPULAR_BY_SLUG.get(name.trim().toLowerCase());
}

export function relatedPopularNames(name: string, count: number): string[] {
  const list = POPULAR_GIRL_NAMES.includes(name) ? POPULAR_GIRL_NAMES : POPULAR_BOY_NAMES;
  const i = list.indexOf(name);
  if (i < 0) return [];
  const half = Math.floor(count / 2);
  const start = Math.max(0, Math.min(i - half, list.length - count - 1));
  return list.slice(start, start + count + 1).filter(n => n !== name).slice(0, count);
}
