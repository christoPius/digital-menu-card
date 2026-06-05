export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'admin';
}

export interface Category {
  id: string;
  categoryName: string;
  description: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageURL: string;
  categoryId: string;
  availability: boolean;
  createdAt: string;
  dietaryTags?: string[];
}

export interface RestaurantInfo {
  name: string;
  logoURL: string;
  address: string;
  contactNumber: string;
  coverURL?: string;
}
