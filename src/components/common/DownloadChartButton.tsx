import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { logger } from '../../utils/logger'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { mergeChartWithWatermark } from '../../utils/mergeChartWithWatermark'

interface DownloadChartButtonProps {
    chartRef: React.RefObject<HTMLElement | null>
    fileName?: string
}

export function DownloadChartButton({
    chartRef,
    fileName = 'chart',
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
            toast.success('Chart downloaded successfully!')
        } catch (error) {
            logger.error('Failed to download chart:', error)
            toast.error('Failed to download chart. Please try again.')
        } finally {
            setIsDownloading(false)
        }
    }

    return (
        <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={`p-2 rounded-lg transition-colors ${isDownloading
                    ? 'text-gray-400 bg-gray-50 cursor-wait'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer'
                }`}
            title={isDownloading ? 'Downloading...' : 'Download chart with watermark'}
        >
            <FontAwesomeIcon
                icon={isDownloading ? faSpinner : faDownload}
                className={`w-4 h-4 ${isDownloading ? 'animate-spin' : ''}`}
            />
        </button>
    )
}
