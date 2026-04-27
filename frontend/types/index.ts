export interface Game {
  id: number;
  title: string;
  description: string;
  price: number;
  platform: string;
  image_url: string;
  created_at: string;
  in_stock: number;
}

export interface AuthResponse {
  token: string;
}

export interface User {
  id: number;
  email: string;
  role: string;
}
