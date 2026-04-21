import React, { useState, useMemo } from 'react';
import { Input } from './ui/input';
import * as Lucide from 'lucide-react';

// Curated list of the most useful Lucide icons for business categories.
// Lucide has ~1500+ icons, this is a highly usable subset to keep the picker fast.
const ICON_SET = [
  // Food & drink
  'Utensils', 'UtensilsCrossed', 'Coffee', 'Pizza', 'IceCream', 'Wine', 'Beer', 'Sandwich', 'CakeSlice', 'Apple',
  // Shopping & retail
  'Store', 'ShoppingBag', 'ShoppingCart', 'Shirt', 'Gem', 'Watch', 'Gift', 'Package', 'Tag',
  // Health & beauty
  'Heart', 'HeartPulse', 'Stethoscope', 'Pill', 'Syringe', 'Activity', 'Cross', 'Sparkles', 'Scissors', 'BathIcon',
  // Pets & animals
  'Dog', 'Cat', 'Bird', 'Fish', 'PawPrint', 'Rabbit', 'Turtle',
  // Travel & places
  'Plane', 'Hotel', 'Home', 'Building2', 'Building', 'Factory', 'Landmark', 'Map', 'MapPin', 'Palmtree', 'Mountain', 'TreePine',
  // Sports & leisure
  'Dumbbell', 'Bike', 'Trophy', 'Target', 'Gamepad2', 'Music', 'Film', 'Ticket', 'PartyPopper',
  // Tech & tools
  'Laptop', 'Smartphone', 'Cpu', 'Wifi', 'Wrench', 'Hammer', 'Paintbrush', 'Brush', 'Wand2',
  // Education & office
  'BookOpen', 'GraduationCap', 'Briefcase', 'FileText', 'PenTool', 'Calculator', 'Clipboard',
  // Kids & family
  'Baby', 'Users', 'User', 'Smile',
  // Nature & misc
  'Flower2', 'Leaf', 'Sun', 'Cloud', 'Flame', 'Droplets', 'Zap', 'Star', 'Shield', 'Globe', 'Car', 'Bus',
  // Service generic
  'Settings', 'Key', 'Lock', 'CircleHelp', 'Info', 'Headphones', 'Phone', 'Mail', 'MessageSquare',
];

// Filter to only those actually present in lucide-react
const AVAILABLE = ICON_SET.filter(name => Lucide[name] !== undefined);

export function LucideIconPicker({ onSelect }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return AVAILABLE;
    return AVAILABLE.filter(n => n.toLowerCase().includes(needle));
  }, [q]);

  return (
    <div className="w-[300px]" data-testid="lucide-picker">
      <Input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Buscar icono..."
        className="rounded-xl mb-2 h-9"
        data-testid="lucide-picker-search"
      />
      <div className="grid grid-cols-6 gap-1 max-h-[300px] overflow-y-auto pr-1">
        {filtered.map(name => {
          const Ico = Lucide[name];
          return (
            <button
              type="button"
              key={name}
              onClick={() => onSelect(`lucide:${name}`)}
              title={name}
              className="aspect-square flex items-center justify-center rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition"
              data-testid={`lucide-${name}`}
            >
              <Ico className="w-4 h-4 text-foreground" strokeWidth={1.8} />
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-6 text-center text-xs text-muted-foreground py-4">Sin coincidencias</p>
        )}
      </div>
    </div>
  );
}

// Helper: resolve "lucide:Name" -> component. Returns null if not found.
export function getLucideComponent(iconString) {
  if (typeof iconString !== 'string' || !iconString.startsWith('lucide:')) return null;
  const name = iconString.slice('lucide:'.length);
  return Lucide[name] !== undefined ? Lucide[name] : null;
}
