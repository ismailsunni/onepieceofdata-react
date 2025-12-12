import { toPng } from 'html-to-image'

interface WatermarkOptions {
    text: string
    font?: string
    color?: string
    margin?: number
}

const DEFAULT_OPTIONS: WatermarkOptions = {
    text: 'onepieceofdata.com',
    font: '20px sans-serif',
    color: 'rgba(0, 0, 0, 0.6)',
    margin: 20,
}

/**
 * Merges a chart element with a watermark and returns the base64 image data.
 * @param chartElement The DOM element containing the chart (via useRef).
 * @param options Watermark customization options.
 * @returns Promise resolving to the base64 string of the final image.
 */
export async function mergeChartWithWatermark(
    chartElement: HTMLElement,
    options: Partial<WatermarkOptions> = {}
): Promise<string> {
    const settings = { ...DEFAULT_OPTIONS, ...options }

    // 1. Convert chart HTML to PNG base64
    // We use html-to-image to capture the rendered chart
    // backgroundColor: 'white' ensures we don't have transparent backgrounds if not intended

    // Find all scrollable elements and temporarily remove overflow constraints
    const scrollableElements: Array<{ element: HTMLElement; originalOverflow: string; originalMaxWidth: string; originalMaxHeight: string }> = []

    const findAndModifyScrollableElements = (element: HTMLElement) => {
        const computedStyle = window.getComputedStyle(element)
        const hasOverflow = element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight

        if (hasOverflow && (computedStyle.overflow === 'auto' || computedStyle.overflow === 'scroll' ||
            computedStyle.overflowX === 'auto' || computedStyle.overflowX === 'scroll' ||
            computedStyle.overflowY === 'auto' || computedStyle.overflowY === 'scroll')) {
            scrollableElements.push({
                element,
                originalOverflow: element.style.overflow,
                originalMaxWidth: element.style.maxWidth,
                originalMaxHeight: element.style.maxHeight,
            })
            // Temporarily remove overflow constraints
            element.style.overflow = 'visible'
            element.style.maxWidth = 'none'
            element.style.maxHeight = 'none'
        }

        // Recursively check children
        Array.from(element.children).forEach((child) => {
            if (child instanceof HTMLElement) {
                findAndModifyScrollableElements(child)
            }
        })
    }

    findAndModifyScrollableElements(chartElement)

    // Capture options
    const captureOptions: any = {
        backgroundColor: 'white',
        pixelRatio: 2,
    }

    // If we found scrollable elements, we need to capture with full dimensions
    if (scrollableElements.length > 0) {
        // Wait a bit for layout to update
        await new Promise(resolve => setTimeout(resolve, 100))

        captureOptions.width = chartElement.scrollWidth
        captureOptions.height = chartElement.scrollHeight
    }

    const chartBase64 = await toPng(chartElement, captureOptions)

    // Restore original styles
    scrollableElements.forEach(({ element, originalOverflow, originalMaxWidth, originalMaxHeight }) => {
        element.style.overflow = originalOverflow
        element.style.maxWidth = originalMaxWidth
        element.style.maxHeight = originalMaxHeight
    })

    return new Promise((resolve, reject) => {
        // 2. Create a hidden canvas
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        img.onload = () => {
            // Set canvas dimensions to match the chart
            canvas.width = img.width
            canvas.height = img.height

            if (!ctx) {
                reject(new Error('Could not get canvas context'))
                return
            }

            // 3. Draw the chart image onto the canvas
            ctx.drawImage(img, 0, 0)

            // 4. Draw the watermark
            ctx.font = settings.font!
            ctx.fillStyle = settings.color!
            ctx.textAlign = 'right'
            ctx.textBaseline = 'bottom'

            // Position: bottom-right with margin
            const x = canvas.width - settings.margin!
            const y = canvas.height - settings.margin!

            ctx.fillText(settings.text, x, y)

            // 5. Convert final canvas to base64
            resolve(canvas.toDataURL('image/png'))
        }

        img.onerror = (err) => {
            reject(err)
        }

        img.src = chartBase64
    })
}
