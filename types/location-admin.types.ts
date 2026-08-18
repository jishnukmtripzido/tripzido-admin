export interface CountryAdmin {
  id: number;
  name: string;
  code: string;
}

export interface StateAdmin {
  id: number;
  country: number;
  country_name: string;
  name: string;
  code: string;
}

export interface CityAdmin {
  id: number;
  state: number;
  state_name: string;
  country_name: string;
  name: string;
  city_image: string | null;
}

export interface PickupLocationAdmin {
  id: number;
  city: number;
  city_name: string;
  name: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
}
