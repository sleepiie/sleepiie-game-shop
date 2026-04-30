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
  avatar_url: string;
  role: string;
  created_at: string;
}

export interface UpdateProfilePayload {
  avatar_url?: string;
  current_password?: string;
  new_password?: string;
}

// Cart types
export interface CartItem {
  id: number;
  game_id: number;
  game: Game;
  created_at: string;
}

export interface CartResponse {
  items: CartItem[];
  total_amount: number;
  total_items: number;
}

// Order types
export interface OrderItem {
  id: number;
  order_id: number;
  game_id: number;
  price: number;
}

export interface OrderKeyResponse {
  game_id: number;
  key_value: string;
}

export interface OrderHistoryResponse {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
  keys: OrderKeyResponse[];
}
