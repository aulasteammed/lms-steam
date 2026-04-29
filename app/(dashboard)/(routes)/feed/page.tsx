'use client'

import React, { useState, useMemo, useEffect } from 'react'
import EventCardReadOnly from '@/app/(dashboard)/(routes)/feed/_components/EventCardReadOnly'
import { CustomCalendar } from '@/app/(dashboard)/(routes)/feed/_components/custom-calendar'
import { isSameDay, parseISO, compareAsc } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

interface Event {
  id: string
  title: string
  description: string
  location: string
  imageUrl: string
  startDateTime: string // ISO
  endDateTime: string   // ISO
  userId: string
  link: string
}

export default function EventsPage() {
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/event')
        
        if (!response.ok) {
          throw new Error('Error al cargar los eventos')
        }
        
        const data = await response.json()
        setEvents(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching events:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const eventDates = useMemo(
    () => events.map(e => parseISO(e.startDateTime)),
    [events]
  )

  const displayedEvents = useMemo(() => {
    if (selectedDay) {
      return events.filter(e =>
        isSameDay(parseISO(e.startDateTime), selectedDay)
      )
    }
    const today = new Date()
    const future = events
      .filter(e => compareAsc(parseISO(e.startDateTime), today) >= 0)
      .sort((a, b) =>
        compareAsc(parseISO(a.startDateTime), parseISO(b.startDateTime))
      )
    return future
  }, [selectedDay, events])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando eventos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <Button onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Botón móvil: calendario en panel lateral */}
      <div className="sticky top-2 z-20 flex justify-center px-4 pt-3 lg:hidden">
        <Sheet open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <SheetTrigger asChild>
            <Button className="rounded-full shadow-md">Abrir calendario</Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[92vw] max-w-none overflow-y-auto p-4">
            <SheetHeader className="mb-4">
              <SheetTitle>Calendario</SheetTitle>
            </SheetHeader>
            <CustomCalendar
              selected={selectedDay}
              onSelect={setSelectedDay}
              className="mx-auto rounded-md shadow-sm border"
              eventDates={eventDates}
              showEventDetails={true}
            />
            {selectedDay && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  Mostrando eventos del {selectedDay.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <button
                  onClick={() => setSelectedDay(undefined)}
                  className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                >
                  Limpiar selección
                </button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Contenido principal - Flexible */}
      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
        {/* Columna izquierda: eventos - Solo esta columna hace scroll */}
        <div className="w-full lg:w-2/3 overflow-y-auto">
          <div className="p-6 bg-gray-50">
            {displayedEvents.length > 0 ? (
              <div className="space-y-8">
                {displayedEvents.map((event) => (
                  <div key={event.id} className="max-w-xl mx-auto">
                    <EventCard event={event} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center mt-20">
                {events.length === 0 ? (
                  <div>
                    <h3 className="text-xl text-gray-600 mb-2">No hay eventos disponibles</h3>
                    <p className="text-gray-500">No hay eventos para mostrar</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl text-gray-600 mb-2">
                      {selectedDay 
                        ? "No hay eventos para esta fecha" 
                        : "No hay eventos próximos"
                      }
                    </h3>
                    {selectedDay && (
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedDay(undefined)}
                        className="mt-4"
                      >
                        Ver todos los eventos
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha: calendario - Fijo, sin scroll propio */}
        <div className="hidden lg:flex lg:w-1/3 border-l bg-white flex-col">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Calendario</h2>
            <div className="space-y-4">
              <CustomCalendar
                selected={selectedDay}
                onSelect={setSelectedDay}
                className="mx-auto rounded-md shadow-sm border"
                eventDates={eventDates}
                showEventDetails={true}
              />
            </div>
            
            {selectedDay && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  Mostrando eventos del {selectedDay.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <button 
                  onClick={() => setSelectedDay(undefined)}
                  className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                >
                  Limpiar selección
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente individual para cada evento (versión solo lectura)
function EventCard({ event }: { event: Event }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const start = new Date(event.startDateTime)
  const end = new Date(event.endDateTime)

  const fmtTime = (date: Date) =>
    date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  const timeRange = `${fmtTime(start)} - ${fmtTime(end)}`

  // Determinar si el evento ya pasó
  const isPastEvent = start < new Date()

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  return (
    <>
      <div className={`bg-white border border-amber-100 rounded-2xl shadow-md overflow-hidden ${isPastEvent ? 'opacity-75' : ''}`}>
        <div className="p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">{event.title}</h3>
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 012 0v4h2V3a1 1 0 012 0v4h2V3a1 1 0 012 0v4a1 1 0 011 1v6a1 1 0 01-1 1H7a1 1 0 01-1-1V8a1 1 0 011-1z" />
                </svg>
                {start.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
            {isPastEvent && (
              <span className="bg-gray-500 text-white text-xs px-2.5 py-1 rounded-full">
                Finalizado
              </span>
            )}
          </div>

          <div 
          className="relative mx-auto w-full max-w-[430px] aspect-[3/4] bg-gradient-to-b from-amber-50 to-orange-50 cursor-pointer overflow-hidden rounded-2xl border border-amber-100 hover:opacity-95 transition-opacity"
          onClick={openModal}
        >
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-20">
            <div className="bg-white bg-opacity-90 rounded-full p-2">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
          </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center text-gray-700">
              <svg className="w-5 h-5 mr-3 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium">{event.location}</span>
            </div>
            
            <div className="flex items-center text-gray-700">
              <svg className="w-5 h-5 mr-3 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{timeRange}</span>
            </div>

            {event.description && (
              <p className="text-sm text-gray-600 leading-relaxed">
                {event.description}
              </p>
            )}

            {event.link && (
              isPastEvent ? (
                <span className="mt-3 inline-block bg-gray-300 text-gray-600 text-sm font-medium px-4 py-2 rounded-md">
                  Evento finalizado
                </span>
              ) : (
                <a
                  href={event.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Inscribirme
                </a>
              )
            )}

          </div>
        </div>
      </div>

      {/* Modal para imagen completa */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div className="relative w-full max-w-[520px] h-[92vh]">
            {/* Botón cerrar */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </>
  )
}
