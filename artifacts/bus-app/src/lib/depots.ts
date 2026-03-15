export interface DepotLocation {
  name: string;
  city: string;
  lat: number;
  lng: number;
}

export const DEFAULT_DEPOT: DepotLocation = {
  name: "Mainz Zentrum",
  city: "Mainz",
  lat: 49.9929,
  lng: 8.2473,
};
