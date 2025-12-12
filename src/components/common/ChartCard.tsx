import React, { useRef } from 'react'
import { DownloadChartButton } from './DownloadChartButton'

interface ChartCardProps {
    title: string
    children: React.ReactNode
    downloadFileName?: string
    className?: string
}

export function ChartCard({
    title,
    children,
    downloadFileName,
    className = '',
}: ChartCardProps) {
    const chartRef = useRef<HTMLDivElement>(null)

    // Default filename to title if not provided (sluggified simply)
    const fileName = downloadFileName || title.toLowerCase().replace(/\s+/g, '-')

    return (
        <div className={`bg-white rounded-lg shadow-md p-6 relative ${className}`}>
            <div className="absolute right-6 top-6 z-10">
                <DownloadChartButton chartRef={chartRef} fileName={fileName} />
            </div>
            {/* 
        This div is what gets captured by html-to-image.
        It includes the title and the chart content (children).
        We add bg-white and padding to ensure the captured image looks good.
      */}
            <div ref={chartRef} className="bg-white p-2">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>
                {children}
            </div>
        </div>
    )
}
