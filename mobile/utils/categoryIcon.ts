import { Bed, BedDouble, Briefcase, Building2, Crown, Sofa, Star, Users } from 'lucide-react-native';

/** Picks an icon for a room type from its name (works for any custom type the admin adds). */
export function categoryIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('president')) return Crown;
  if (n.includes('suite')) return Sofa;
  if (n.includes('family')) return Users;
  if (n.includes('executive')) return Briefcase;
  if (n.includes('superior')) return Star;
  if (n.includes('deluxe')) return BedDouble;
  if (n.includes('standard')) return Bed;
  return Building2;
}
