import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { mergeChartWithWatermark } from '../../utils/mergeChartWithWatermark'

interface DownloadChartButtonProps {
    chartRef: React.RefObject<HTMLElement | null>
    fileName?: string
    label?: string
}

export function DownloadChartButton({
    chartRef,
    fileName = 'chart',
    label = 'Download',
}: DownloadChartButtonProps) {
    const handleDownload = async () => {
        if (!chartRef.current) return

        try {
            const dataUrl = await mergeChartWithWatermark(chartRef.current, {
                text: 'onepieceofdata.com',
            })

            const link = document.createElement('a')
            link.download = `${fileName}.png`
            link.href = dataUrl
            link.click()
        } catch (error) {
            console.error('Failed to download chart:', error)
            alert('Failed to download chart. Please try again.')
        }
    }

    return (
        <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 bg-opacity-75 backdrop-blur-sm transition-colors cursor-pointer"
            title="Download chart with watermark"
        >
            <FontAwesomeIcon icon={faDownload} />
            {label}
        </button>
    )
}
