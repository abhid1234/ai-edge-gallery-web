// Garden types and game logic

export interface GardenCell {
  crop: string | null;
  watered: boolean;
  growthStage: number; // 0=seed, 1=sprout, 2=growing, 3=ready
  plantedAt: number;
}

export type Garden = GardenCell[][];

export interface ActionLog {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  timestamp: number;
}

// 4x4 grid: rows A-D, cols 1-4
export const ROWS = ["A", "B", "C", "D"] as const;
export const COLS = ["1", "2", "3", "4"] as const;

export type GridLocation = `${(typeof ROWS)[number]}${(typeof COLS)[number]}`;

export const CROP_EMOJIS: Record<string, string> = {
  tomato: "🍅",
  carrot: "🥕",
  sunflower: "🌻",
  corn: "🌽",
  cucumber: "🥒",
  pepper: "🫑",
  potato: "🥔",
  lettuce: "🥬",
  strawberry: "🍓",
  pumpkin: "🎃",
};

export function getGrowthEmoji(crop: string, stage: number): string {
  if (stage === 0) return "🌱";
  if (stage === 1) return "🌿";
  const cropEmoji = CROP_EMOJIS[crop.toLowerCase()] ?? "🌾";
  if (stage === 3) return cropEmoji + "✨";
  return cropEmoji;
}

export function createEmptyGarden(): Garden {
  return Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => ({
      crop: null,
      watered: false,
      growthStage: 0,
      plantedAt: 0,
    }))
  );
}

export function locationToIndex(location: string): { row: number; col: number } | null {
  const normalized = location.trim().toUpperCase();
  const rowChar = normalized[0];
  const colChar = normalized[1];
  const row = ROWS.indexOf(rowChar as (typeof ROWS)[number]);
  const col = COLS.indexOf(colChar as (typeof COLS)[number]);
  if (row === -1 || col === -1) return null;
  return { row, col };
}

export interface GardenAction {
  type: "plantCrop" | "waterCrop" | "harvestCrop" | "checkGarden";
  args: Record<string, string>;
}

// Execute a garden action and return updated garden + log message
export function executePlantCrop(
  garden: Garden,
  cropName: string,
  location: string
): { garden: Garden; message: string; success: boolean } {
  const idx = locationToIndex(location);
  if (!idx) {
    return { garden, message: "Invalid location: " + location + ". Use A1-D4.", success: false };
  }
  const { row, col } = idx;
  const cell = garden[row][col];

  if (cell.crop) {
    return {
      garden,
      message: location.toUpperCase() + " already has " + cell.crop + " growing there!",
      success: false,
    };
  }

  const normalizedCrop = cropName.toLowerCase().trim();
  const newGarden = garden.map((r, ri) =>
    r.map((c, ci) =>
      ri === row && ci === col
        ? { ...c, crop: normalizedCrop, growthStage: 0, watered: false, plantedAt: Date.now() }
        : c
    )
  );

  const emoji = CROP_EMOJIS[normalizedCrop] ?? "🌾";
  return {
    garden: newGarden,
    message: "Planted " + normalizedCrop + " " + emoji + " at " + location.toUpperCase() + "! 🌱",
    success: true,
  };
}

export function executeWaterCrop(
  garden: Garden,
  location: string
): { garden: Garden; message: string; success: boolean } {
  const idx = locationToIndex(location);
  if (!idx) {
    return { garden, message: "Invalid location: " + location + ". Use A1-D4.", success: false };
  }
  const { row, col } = idx;
  const cell = garden[row][col];

  if (!cell.crop) {
    return {
      garden,
      message: "Nothing planted at " + location.toUpperCase() + " yet!",
      success: false,
    };
  }
  if (cell.growthStage >= 3) {
    return {
      garden,
      message: cell.crop + " at " + location.toUpperCase() + " is ready to harvest — no need to water!",
      success: false,
    };
  }

  const newStage = Math.min(cell.growthStage + 1, 3);
  const newGarden = garden.map((r, ri) =>
    r.map((c, ci) =>
      ri === row && ci === col ? { ...c, watered: true, growthStage: newStage } : c
    )
  );

  const stageLabels = ["sprout", "growing", "ready to harvest!"];
  const emoji = getGrowthEmoji(cell.crop, newStage);
  return {
    garden: newGarden,
    message: "Watered " + cell.crop + " at " + location.toUpperCase() + "! " + emoji + " Now " + (stageLabels[newStage - 1] ?? "growing") + ".",
    success: true,
  };
}

export function executeHarvestCrop(
  garden: Garden,
  location: string
): { garden: Garden; message: string; success: boolean } {
  const idx = locationToIndex(location);
  if (!idx) {
    return { garden, message: "Invalid location: " + location + ". Use A1-D4.", success: false };
  }
  const { row, col } = idx;
  const cell = garden[row][col];

  if (!cell.crop) {
    return {
      garden,
      message: "Nothing planted at " + location.toUpperCase() + " to harvest!",
      success: false,
    };
  }
  if (cell.growthStage < 3) {
    const remaining = 3 - cell.growthStage;
    return {
      garden,
      message: cell.crop + " at " + location.toUpperCase() + " needs " + remaining + " more watering" + (remaining > 1 ? "s" : "") + " to be ready!",
      success: false,
    };
  }

  const harvestedCrop = cell.crop;
  const emoji = CROP_EMOJIS[harvestedCrop] ?? "🌾";
  const newGarden = garden.map((r, ri) =>
    r.map((c, ci) =>
      ri === row && ci === col
        ? { crop: null, watered: false, growthStage: 0, plantedAt: 0 }
        : c
    )
  );

  return {
    garden: newGarden,
    message: "Harvested " + harvestedCrop + " " + emoji + " from " + location.toUpperCase() + "! Great work! 🎉",
    success: true,
  };
}

export function executeCheckGarden(garden: Garden): { message: string } {
  const planted: string[] = [];
  const ready: string[] = [];
  let empty = 0;

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const cell = garden[r][c];
      const loc = ROWS[r] + COLS[c];
      if (!cell.crop) {
        empty++;
      } else if (cell.growthStage === 3) {
        ready.push(loc + ": " + cell.crop + " ✨");
      } else {
        const stageNames = ["seed", "sprout", "growing"];
        planted.push(loc + ": " + cell.crop + " (" + (stageNames[cell.growthStage] ?? "growing") + ")");
      }
    }
  }

  if (empty === 16) return { message: "Your garden is empty. Try planting something! 🌱" };

  const lines: string[] = ["Garden status:"];
  if (ready.length) lines.push("Ready to harvest: " + ready.join(", "));
  if (planted.length) lines.push("Growing: " + planted.join(", "));
  if (empty) lines.push("Empty plots: " + empty);

  return { message: lines.join("\n") };
}

// Parse tool_call tags from model output
export function parseToolCalls(output: string): GardenAction[] {
  const actions: GardenAction[] = [];

  // Match <tool_call>...</tool_call> blocks
  const toolCallRegex = /<tool_call>([\s\S]*?)<\/tool_call>/gi;
  let match: RegExpExecArray | null;

  while ((match = toolCallRegex.exec(output)) !== null) {
    const content = match[1].trim();
    try {
      const parsed = JSON.parse(content) as { name?: string; arguments?: Record<string, string>; args?: Record<string, string> };
      if (parsed.name && (parsed.arguments || parsed.args)) {
        actions.push({ type: parsed.name as GardenAction["type"], args: parsed.arguments ?? parsed.args ?? {} });
      }
    } catch {
      // ignore parse error
    }
  }

  // Also try plain JSON function call format
  if (actions.length === 0) {
    const jsonRegex = /\{[^{}]*"name"\s*:\s*"(plantCrop|waterCrop|harvestCrop|checkGarden)"[^{}]*\}/gi;
    while ((match = jsonRegex.exec(output)) !== null) {
      try {
        const parsed = JSON.parse(match[0]) as { name?: string; arguments?: Record<string, string>; args?: Record<string, string> };
        if (parsed.name && (parsed.arguments || parsed.args)) {
          actions.push({
            type: parsed.name as GardenAction["type"],
            args: parsed.arguments ?? parsed.args ?? {},
          });
        }
      } catch {
        // ignore
      }
    }
  }

  // Fallback: parse function-call style from model output
  if (actions.length === 0) {
    const plantRe = /plantCrop\s*\(\s*["']?([a-zA-Z]+)["']?\s*,\s*["']?([A-Da-d][1-4])["']?\s*\)/gi;
    const waterRe = /waterCrop\s*\(\s*["']?([A-Da-d][1-4])["']?\s*\)/gi;
    const harvestRe = /harvestCrop\s*\(\s*["']?([A-Da-d][1-4])["']?\s*\)/gi;
    const checkRe = /checkGarden\s*\(\s*\)/gi;

    let m: RegExpExecArray | null;
    while ((m = plantRe.exec(output)) !== null) {
      actions.push({ type: "plantCrop", args: { crop_name: m[1], location: m[2] } });
    }
    while ((m = waterRe.exec(output)) !== null) {
      actions.push({ type: "waterCrop", args: { location: m[1] } });
    }
    while ((m = harvestRe.exec(output)) !== null) {
      actions.push({ type: "harvestCrop", args: { location: m[1] } });
    }
    if (checkRe.test(output)) {
      actions.push({ type: "checkGarden", args: {} });
    }
  }

  return actions;
}

export function buildSystemPrompt(garden: Garden): string {
  const gardenStateJSON = JSON.stringify(
    garden.map((row, ri) =>
      row.map((cell, ci) => ({
        location: ROWS[ri] + COLS[ci],
        crop: cell.crop,
        watered: cell.watered,
        growthStage: cell.growthStage,
      }))
    )
  );

  return (
    "You are a garden assistant. The user manages a 4x4 garden grid (locations A1-D4).\n" +
    "Available tools:\n" +
    "- plantCrop(crop_name: string, location: string): Plant a crop at the given location\n" +
    "- waterCrop(location: string): Water the crop at the given location\n" +
    "- harvestCrop(location: string): Harvest the crop if it's ready\n" +
    "- checkGarden(): Show the current state of the garden\n\n" +
    "Respond with tool calls in this format:\n" +
    '<tool_call>{"name": "plantCrop", "arguments": {"crop_name": "tomato", "location": "A1"}}</tool_call>\n\n' +
    "Multiple actions can be done in one turn, just output multiple tool_call tags.\n" +
    "Current garden state: " + gardenStateJSON
  );
}
