import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const eventId = body?.eventId

    if (!eventId || typeof eventId !== 'string') {
      return NextResponse.json({ error: 'eventId es requerido' }, { status: 400 })
    }

    await db.event.update({
      where: { id: eventId },
      data: { clickCount: { increment: 1 } },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error tracking event click:', error)
    return NextResponse.json({ error: 'No se pudo registrar el click' }, { status: 500 })
  }
}
