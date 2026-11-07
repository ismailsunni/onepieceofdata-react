import toast from 'react-hot-toast'
import { toPng } from 'html-to-image'

const isAbort = (err: unknown) => (err as DOMException)?.name === 'AbortError'

export async function shareImage(
  node: HTMLElement,
  fileName: string,
  title: string,
  text: string
): Promise<void> {
  try {
    const dataUrl = await toPng(node, {
      cacheBust: true,
      pixelRatio: 1,
      skipFonts: true,
    })
    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], fileName, { type: 'image/png' })

    if (navigator.canShare?.({ files: [file] }) && navigator.share) {
      try {
        await navigator.share({ files: [file], title, text })
        return
      } catch (err) {
        if (isAbort(err)) return
      }
    }

    const link = document.createElement('a')
    link.href = dataUrl
    link.download = fileName
    link.click()
    toast.success('Image downloaded — share it anywhere!')
  } catch (err) {
    console.error(err)
    toast.error('Could not generate share image')
  }
}

export async function shareText(text: string): Promise<void> {
  if (navigator.share) {
    try {
      await navigator.share({ text })
      return
    } catch (err) {
      if (isAbort(err)) return
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Score copied to clipboard!')
  } catch {
    toast.error('Could not share — try copying manually')
  }
}
