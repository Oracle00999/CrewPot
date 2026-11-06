import { copyFileSync, mkdirSync } from "node:fs";
mkdirSync("lib/contracts", { recursive: true });
copyFileSync("target/idl/crewpot.json", "lib/contracts/crewpot.json");
copyFileSync("target/types/crewpot.ts", "lib/contracts/crewpot.ts");
console.log("Synced generated CrewPot IDL and types.");
