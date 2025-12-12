import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faSpinner } from '@fortawesome/free-solid-svg-icons'
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
    const [isDownloading, setIsDownloading] = useState(false)

    const handleDownload = async () => {
        if (!chartRef.current || isDownloading) return

        try {
            setIsDownloading(true)
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
        } finally {
            setIsDownloading(false)
        }
    }

    return (
        <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold shadow-sm ring-1 ring-inset transition-colors ${isDownloading
                    ? 'bg-gray-100 text-gray-400 ring-gray-200 cursor-wait'
                    : 'bg-white text-gray-900 ring-gray-300 hover:bg-gray-50 cursor-pointer'
                } bg-opacity-75 backdrop-blur-sm`}
            title={isDownloading ? 'Downloading...' : 'Download chart with watermark'}
        >
            <FontAwesomeIcon
                icon={isDownloading ? faSpinner : faDownload}
                className={isDownloading ? 'animate-spin' : ''}
            />
            {isDownloading ? 'Downloading...' : label}
        </button>
    )
}
