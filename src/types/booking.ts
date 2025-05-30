// New Booking types to replace Appointment types

export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export interface Booking {
  id: string;
  user_id: string;
  artist_id: string;
  service_type: string;
  service_price: number | null;
  total_price: number | null;
  date_time: Date | string;
  booking_status: BookingStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    phone: string | null;
  };
  artist?: {
    id: string;
    user_id: string;
    pricing: number | null;
    experience_years: string | null;
    portfolio: string | null;
    gender: string | null;
    rating: number | null;
    address: string | null;
    bio: string | null;
    availability: boolean;
    earnings: number;
  };
}

export interface BookingWithProfit extends Booking {
  profit?: number;
}

export interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalCustomers: number;
  availableBalance: number;
  totalEarnings: number;
}

export interface PaginationInfo {
  total: number;
  pages: number;
  page: number;
  pageSize: number;
}

export interface ArtistAccount {
  totalEarnings: number;
  pendingPayouts: number;
  availableBalance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
  description: string | null;
}
