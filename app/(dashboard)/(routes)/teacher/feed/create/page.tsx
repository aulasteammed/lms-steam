'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { FileUpload } from '@/components/file-upload'

// Esquema de validación - todos los campos obligatorios
const formSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  location: z.string().min(3, 'La ubicación debe tener al menos 3 caracteres'),
  date: z.date({ required_error: 'Selecciona una fecha' }),
  startTime: z.date({ required_error: 'Selecciona la hora de inicio' }),
  endTime: z.date({ required_error: 'Selecciona la hora de fin' }),
  link: z.string().url('Debe ser un link válido').startsWith('https://','Debe iniciar con https://'), 
  imageUrl: z.string().min(1, 'La imagen es obligatoria'), // Ahora es obligatoria
}).refine((data) => {
  // Validación personalizada: la fecha debe ser futura
  const startDateTime = new Date(data.date)
  startDateTime.setHours(data.startTime.getHours(), data.startTime.getMinutes())
  return startDateTime > new Date()
}, {
  message: "La fecha y hora del evento debe ser futura",
  path: ["date"]
}).refine((data) => {
  // Validación personalizada: hora de fin debe ser después de inicio
  return data.endTime > data.startTime
}, {
  message: "La hora de fin debe ser posterior a la hora de inicio",
  path: ["endTime"]
}).refine((data) => {
  // Validación: hora de inicio debe estar entre 8 AM y 6 PM
  const startHour = data.startTime.getHours()
  return startHour >= 8 && startHour < 18
}, {
  message: "La hora de inicio debe estar entre las 8:00 AM y las 6:00 PM",
  path: ["startTime"]
}).refine((data) => {
  // Validación: hora de fin debe estar entre 8 AM y 6 PM
  const endHour = data.endTime.getHours()
  const endMinutes = data.endTime.getMinutes()
  return endHour >= 8 && (endHour < 18 || (endHour === 18 && endMinutes === 0))
}, {
  message: "La hora de fin debe estar entre las 8:00 AM y las 6:00 PM",
  path: ["endTime"]
})

type FormValues = z.infer<typeof formSchema>

// Función para crear fechas con horas específicas para los time pickers
const createTimeWithHour = (hour: number, minute: number = 0) => {
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  return date
}

// Función para filtrar las horas disponibles (8 AM a 6 PM)
const filterTime = (time: Date) => {
  const hour = time.getHours()
  return hour >= 8 && hour <= 18
}

const MONTHS_ABBR = [
  'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
  'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC',
]

export default function CreateEventPage() {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      location: 'M3 - 119 Aula STEAM',
      date: new Date(),
      startTime: createTimeWithHour(10), // 10 AM por defecto
      endTime: createTimeWithHour(12), // 12 PM por defecto
      link: '',
      imageUrl: '',
    },
  })

  const previewTitle = form.watch('title')
  const previewDescription = form.watch('description')
  const previewLocation = form.watch('location')
  const previewDate = form.watch('date')
  const previewStartTime = form.watch('startTime')
  const previewEndTime = form.watch('endTime')
  const previewLink = form.watch('link')

  const previewStart = new Date(previewDate)
  previewStart.setHours(previewStartTime.getHours(), previewStartTime.getMinutes(), 0, 0)

  const previewEnd = new Date(previewDate)
  previewEnd.setHours(previewEndTime.getHours(), previewEndTime.getMinutes(), 0, 0)

  const previewMonth = MONTHS_ABBR[previewStart.getMonth()]
  const previewDay = previewStart.getDate()
  const previewTimeRange = `${previewStart.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${previewEnd.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })}`

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      // Combinar fecha con horas
      const startDateTime = new Date(data.date)
      startDateTime.setHours(data.startTime.getHours(), data.startTime.getMinutes(), 0, 0)

      const endDateTime = new Date(data.date)
      endDateTime.setHours(data.endTime.getHours(), data.endTime.getMinutes(), 0, 0)

      // Validación adicional en el cliente
      if (endDateTime <= startDateTime) {
        toast.error('La hora de fin debe ser posterior a la de inicio')
        return
      }

      if (startDateTime <= new Date()) {
        toast.error('La fecha y hora del evento debe ser futura')
        return
      }

      // Validación de horario laboral
      const startHour = data.startTime.getHours()
      const endHour = data.endTime.getHours()
      const endMinutes = data.endTime.getMinutes()

      if (startHour < 8 || startHour >= 18) {
        toast.error('La hora de inicio debe estar entre las 8:00 AM y las 6:00 PM')
        return
      }

      if (endHour < 8 || endHour > 18 || (endHour === 18 && endMinutes > 0)) {
        toast.error('La hora de fin debe estar entre las 8:00 AM y las 6:00 PM')
        return
      }

      const payload = {
        title: data.title.trim(),
        description: data.description.trim(),
        location: data.location.trim(),
        imageUrl: imageUrl, // Ahora es obligatorio, no undefined
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        link: data.link.trim(), 
      }

      const res = await fetch('/api/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const responseData = await res.json()

      if (!res.ok) {
        toast.error(responseData.error || 'Hubo un error al crear el evento')
        return
      }

      toast.success('Evento creado correctamente')
      router.push('/feed') // Redirige al feed de eventos
      
    } catch (err: any) {
      console.error('Error inesperado:', err)
      toast.error('Ocurrió un error inesperado')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Crear nuevo evento</h1>
        <p className="text-gray-600">Completa la información para crear tu evento</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Título */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-medium">
                  Título del Evento <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ej: Workshop de React"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Descripción */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-medium">
                  Descripción <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Describe tu evento, qué se hará, a quién está dirigido..."
                    disabled={isSubmitting}
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Ubicación */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-medium">
                  Ubicación <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ej: M3 - 119 Aula STEAM"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Fecha */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-medium">
                  Fecha <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <DatePicker
                    className="w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    selected={field.value}
                    onChange={field.onChange}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Selecciona una fecha"
                    disabled={isSubmitting}
                    minDate={new Date()} // No permite fechas pasadas
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:items-end">
            {/* Hora de inicio */}
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-medium whitespace-nowrap">
                    Hora de inicio <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      className="w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      selected={field.value}
                      onChange={field.onChange}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={30}
                      timeCaption="Hora"
                      dateFormat="HH:mm"
                      disabled={isSubmitting}
                      minTime={createTimeWithHour(8)} // 8:00 AM
                      maxTime={createTimeWithHour(17, 30)} // 5:30 PM (última hora de inicio posible)
                      filterTime={filterTime}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hora de fin */}
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-medium whitespace-nowrap">
                    Hora de fin <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      className="w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      selected={field.value}
                      onChange={field.onChange}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={30}
                      timeCaption="Hora"
                      dateFormat="HH:mm"
                      disabled={isSubmitting}
                      minTime={createTimeWithHour(8, 30)} // 8:30 AM (mínimo 30 min después del inicio más temprano)
                      maxTime={createTimeWithHour(18)} // 6:00 PM
                      filterTime={filterTime}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Link */}
          <FormField
            control={form.control}
            name="link"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-medium">
                  Link inscripción <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="https://forms.gle/ejemplo"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Imagen */}
          <div className="space-y-2">
            <FormLabel className="text-lg font-medium">
              Imagen del evento <span className="text-red-500">*</span>
            </FormLabel>
            <FileUpload
              endpoint="courseImage"
              action={(url) => {
                if (url) {
                  setImageUrl(url)
                  form.setValue('imageUrl', url)
                }
              }}
            />
            {form.formState.errors.imageUrl && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.imageUrl.message}
              </p>
            )}
            <div className="mt-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Vista previa real del evento</h3>
              <div className="max-w-lg mx-auto">
                <div className="bg-white border border-amber-100 rounded-2xl shadow-md overflow-hidden">
                  <div className="p-2.5 sm:p-3">
                    <div className="mb-2.5 flex items-start justify-between gap-2.5">
                      <div className="space-y-1">
                        <h4 className="text-lg sm:text-xl font-semibold text-gray-800">
                          {previewTitle || 'Título del evento'}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg shadow-md">
                          Inscribirme
                        </span>
                      </div>
                    </div>

                    <div className="relative mx-auto w-full max-w-[360px] aspect-[3/3.8] bg-gradient-to-b from-amber-50 to-orange-50 overflow-hidden rounded-2xl border border-amber-100">
                      <div className="absolute top-3 left-3 bg-yellow-400 px-2 py-1 rounded-md text-center z-10 shadow-sm">
                        <span className="block text-xs font-bold text-gray-800">{previewMonth}</span>
                        <span className="block text-lg font-bold text-gray-800 leading-none">{previewDay}</span>
                      </div>
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="Vista previa del evento"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm text-gray-500 bg-amber-50">
                          Sube una imagen para previsualizar
                        </div>
                      )}
                    </div>

                    <div className="mt-2.5 space-y-2">
                      <div className="flex items-center text-gray-700">
                        <svg className="w-5 h-5 mr-3 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">{previewLocation || 'Ubicación del evento'}</span>
                      </div>

                      <div className="flex items-center text-gray-700">
                        <svg className="w-5 h-5 mr-3 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{previewTimeRange}</span>
                      </div>

                      <p className="text-sm text-gray-600 leading-relaxed">
                        {previewDescription || 'Descripción del evento'}
                      </p>

                      <p className="text-xs text-gray-500 break-all">
                        {previewLink || 'https://tu-link-de-inscripcion.com'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Creando evento...' : 'Crear evento'}
            </Button>
          </div>

        </form>
      </Form>
    </div>
  )
}
