import { ROWS, COLS, getGrowthEmoji, type Garden } from "./gardenTools";

interface Props {
  garden: Garden;
}

export function GardenView({ garden }: Props) {
  return (
    <div className="p-4">
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        {garden.map((row, ri) =>
          row.map((cell, ci) => {
            const loc = ROWS[ri] + COLS[ci];
            const isWatered = cell.watered && cell.crop;
            const hasPlant = !!cell.crop;

            return (
              <div
                key={loc}
                className="relative rounded-xl flex flex-col items-center justify-center transition-all duration-300"
                style={{
                  width: "80px",
                  height: "80px",
                  backgroundColor: isWatered
                    ? "#E3F2FD"
                    : hasPlant
                    ? "#E8D5B0"
                    : "#D4A574",
                  border: "2px solid",
                  borderColor: isWatered
                    ? "#90CAF9"
                    : hasPlant
                    ? "#C49A6C"
                    : "#B8865A",
                  boxShadow: cell.growthStage === 3
                    ? "0 0 8px 2px rgba(202,161,42,0.4)"
                    : "inset 0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                {/* Grid location label */}
                <span
                  className="absolute top-1 left-1.5 text-[10px] font-bold opacity-60"
                  style={{ color: hasPlant ? "#5C4B30" : "#8B6040" }}
                >
                  {loc}
                </span>

                {/* Plant emoji */}
                <span className="text-2xl leading-none mt-1">
                  {cell.crop ? getGrowthEmoji(cell.crop, cell.growthStage) : ""}
                </span>

                {/* Crop name */}
                {cell.crop && (
                  <span
                    className="text-[9px] font-semibold mt-0.5 leading-none truncate max-w-[70px] text-center"
                    style={{ color: "#5C4B30" }}
                  >
                    {cell.crop}
                  </span>
                )}

                {/* Water drop indicator */}
                {isWatered && (
                  <span className="absolute top-1 right-1 text-[10px]">💧</span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#5C4B30]">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: "#D4A574" }} />
          Empty
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: "#E3F2FD", border: "1px solid #90CAF9" }} />
          Watered
        </span>
        <span className="flex items-center gap-1">🌱 Seed</span>
        <span className="flex items-center gap-1">🌿 Sprout</span>
        <span className="flex items-center gap-1">🍅 Growing</span>
        <span className="flex items-center gap-1">✨ Ready!</span>
      </div>
    </div>
  );
}
