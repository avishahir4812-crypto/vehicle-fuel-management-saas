import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FleetFuel — Vehicle & Fuel Management",
    short_name: "FleetFuel",
    description:
      "Photo-verified fuel logging, monthly analytics and secure owner–driver chat for commercial fleets.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f6f2",
    theme_color: "#171510",
    icons: [],
  };
}
