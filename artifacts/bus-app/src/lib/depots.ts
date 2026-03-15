export interface DepotLocation {
  name: string;
  city: string;
  lat: number;
  lng: number;
}

export const DEPOT_LOCATIONS: DepotLocation[] = [
  { name: "Mainz Zentrum",        city: "Mainz",          lat: 49.9929, lng: 8.2473  },
  { name: "Frankfurt Hauptbahnhof", city: "Frankfurt",    lat: 50.1070, lng: 8.6635  },
  { name: "Wiesbaden Depot",       city: "Wiesbaden",     lat: 50.0820, lng: 8.2400  },
  { name: "Koblenz",               city: "Koblenz",       lat: 50.3569, lng: 7.5889  },
  { name: "Darmstadt",             city: "Darmstadt",     lat: 49.8728, lng: 8.6512  },
  { name: "Mannheim",              city: "Mannheim",      lat: 49.4875, lng: 8.4660  },
  { name: "Heidelberg",            city: "Heidelberg",    lat: 49.3988, lng: 8.6724  },
  { name: "Stuttgart Mitte",       city: "Stuttgart",     lat: 48.7758, lng: 9.1829  },
  { name: "Köln Hbf",              city: "Köln",          lat: 50.9432, lng: 6.9587  },
  { name: "Düsseldorf",            city: "Düsseldorf",    lat: 51.2217, lng: 6.7762  },
  { name: "Berlin Zentrum",        city: "Berlin",        lat: 52.5200, lng: 13.4050 },
  { name: "München Zentrum",       city: "München",       lat: 48.1351, lng: 11.5820 },
  { name: "Hamburg Zentrum",       city: "Hamburg",       lat: 53.5753, lng: 10.0153 },
  { name: "Nürnberg",              city: "Nürnberg",      lat: 49.4521, lng: 11.0767 },
  { name: "Leipzig",               city: "Leipzig",       lat: 51.3397, lng: 12.3731 },
  { name: "Hannover",              city: "Hannover",      lat: 52.3759, lng: 9.7320  },
  { name: "Dresden",               city: "Dresden",       lat: 51.0509, lng: 13.7383 },
  { name: "Freiburg",              city: "Freiburg",      lat: 47.9990, lng: 7.8421  },
  { name: "Karlsruhe",             city: "Karlsruhe",     lat: 49.0069, lng: 8.4037  },
  { name: "Kassel",                city: "Kassel",        lat: 51.3127, lng: 9.4797  },
];

export const DEFAULT_DEPOT = DEPOT_LOCATIONS[0];
