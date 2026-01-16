export interface Passenger {
    id: string;
    full_name: string;
    phone_number: string;
    is_favorite: boolean;
    passenger_class: string;
    avatar_url?: string;
    created_at: string;
}

export interface Trip {
    id: string;
    passenger_id: string;
    trip_date: string;
    amount: number;
    status: 'paid' | 'pending';
    notes?: string;
    created_at: string;
    passenger?: Passenger;
}

export interface DriverProfile {
    id: string;
    full_name: string;
    license_plate: string;
    vehicle_model: string;
    phone_number: string;
    avatar_url?: string;
    report_logo_url?: string;
    signature_url?: string;
    car_document_url?: string;
    cnh_url?: string;
    show_license_plate: boolean;
    include_signature: boolean;
    is_active: boolean;
    is_admin: boolean;
    password?: string;
    email?: string;
    pix_key?: string;
}
