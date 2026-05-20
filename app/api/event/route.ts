// app/api/event/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { deleteUploadThingFilesByUrls } from '@/lib/uploadthing-server'

// Esquema de validación simple
interface CreateEventData {
  title: string
  description?: string
  location: string
  imageUrl?: string
  startDateTime: string
  endDateTime: string
  link: string
}

function validateEventData(data: unknown): CreateEventData {
  if (typeof data !== "object" || data === null) {
    throw new Error("Datos inválidos")
  }

  const payload = data as Record<string, unknown>
  const title = payload.title
  const description = payload.description
  const location = payload.location
  const imageUrl = payload.imageUrl
  const startDateTime = payload.startDateTime
  const endDateTime = payload.endDateTime
  const link = payload.link

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('El título es requerido')
  }

  if (!location || typeof location !== 'string' || location.trim().length === 0) {
    throw new Error('La ubicación es requerida')
  }

  if (
    !startDateTime ||
    !endDateTime ||
    typeof startDateTime !== "string" ||
    typeof endDateTime !== "string"
  ) {
    throw new Error('Las fechas de inicio y fin son requeridas')
  }

  if (!link || typeof link !== 'string' || link.trim().length === 0) {
    throw new Error('El link de inscripción es requerido')
  } 

  try {
    new URL(link)
  } catch {
    throw new Error('El link debe ser una URL válida')
  }

  const startDate = new Date(startDateTime)
  const endDate = new Date(endDateTime)

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Las fechas deben tener un formato válido')
  }

  if (startDate >= endDate) {
    throw new Error('La fecha de inicio debe ser anterior a la fecha de fin')
  }

  if (startDate < new Date()) {
    throw new Error('La fecha de inicio no puede ser en el pasado')
  }

  return {
    title: title.trim(),
    description: typeof description === "string" ? description.trim() : undefined,
    location: location.trim(),
    imageUrl: typeof imageUrl === "string" ? imageUrl.trim() : undefined,
    startDateTime,
    endDateTime,
    link: link.trim()
  }
}

// Método GET para obtener todos los eventos
export async function GET(req: NextRequest) {
  try {
    const lastThirtyDays = new Date()
    lastThirtyDays.setDate(lastThirtyDays.getDate() - 30)

    // Obtener solo eventos futuros, ordenados por fecha
    const events = await db.event.findMany({
      where: {
        startDateTime: {
          gte: lastThirtyDays
        }
      },
      orderBy: {
        startDateTime: 'asc'
      },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        imageUrl: true,
        startDateTime: true,
        endDateTime: true,
        userId: true,
        createdAt: true,
        link: true,
        clickCount: true,
      }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Error al obtener los eventos' }, 
      { status: 500 }
    )
  }
}

// Método POST para crear un nuevo evento
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No estás autenticado' }, { status: 401 })
    }

    const body = await req.json()
    
    // Validar los datos
    const validatedData = validateEventData(body)

    // Crear el evento en la base de datos
    const newEvent = await db.event.create({
      data: {
        ...validatedData,
        userId,
        startDateTime: new Date(validatedData.startDateTime),
        endDateTime: new Date(validatedData.endDateTime),
      },
    })

    return NextResponse.json(newEvent, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear el evento' }, 
      { status: 500 }
    )
  }
}

// Método DELETE para borrar un evento
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No estás autenticado' }, { status: 401 })
    }

    const url = new URL(req.url)
    const eventId = url.searchParams.get('id')

    if (!eventId) {
      return NextResponse.json(
        { error: 'ID del evento es requerido' }, 
        { status: 400 }
      )
    }

    // Verificar que el evento existe y pertenece al usuario
    const existingEvent = await db.event.findFirst({
      where: {
        id: eventId,
        userId: userId
      }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Evento no encontrado o no tienes permisos para eliminarlo' }, 
        { status: 404 }
      )
    }

    await deleteUploadThingFilesByUrls([existingEvent.imageUrl])

    // Eliminar el evento
    await db.event.delete({
      where: {
        id: eventId
      }
    })

    return NextResponse.json({ 
      message: 'Evento eliminado correctamente',
      eventId: eventId 
    })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el evento' }, 
      { status: 500 }
    )
  }
}
