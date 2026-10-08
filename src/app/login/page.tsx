import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Trainer Login | Indigo Tech Fest · Jarvis 3.0',
  description: 'Sign into the Pokémon Center terminal',
};

export default function LoginPage() {
  redirect('/auth?mode=login');
}
