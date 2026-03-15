import * as Slider from '@radix-ui/react-slider'

interface RangeSliderProps {
  label: string
  min: number
  max: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  onCommit?: (value: [number, number]) => void
}

export function RangeSlider({
  label,
  min,
  max,
  value,
  onChange,
  onCommit,
}: RangeSliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </label>
        <span className="text-xs font-semibold text-blue-600">
          {value[0].toLocaleString()} – {value[1].toLocaleString()}
        </span>
      </div>
      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        min={min}
        max={max}
        step={1}
        value={value}
        onValueChange={(v: number[]) => onChange(v as [number, number])}
        onValueCommit={(v: number[]) => onCommit?.(v as [number, number])}
        minStepsBetweenThumbs={1}
      >
        <Slider.Track className="bg-gray-200 relative grow rounded-full h-1.5">
          <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
        </Slider.Track>
        <Slider.Thumb
          className="block w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 cursor-pointer"
          aria-label={`${label} minimum`}
        />
        <Slider.Thumb
          className="block w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 cursor-pointer"
          aria-label={`${label} maximum`}
        />
      </Slider.Root>
    </div>
  )
}
