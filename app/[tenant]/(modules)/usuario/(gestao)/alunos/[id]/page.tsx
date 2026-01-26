'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { apiClient } from '@/shared/library/api-client'
import { StudentDetails } from './components/student-details'

interface StudentData {
  id: string
  empresaId: string | null
  fullName: string | null
  email: string
  cpf: string | null
  phone: string | null
  birthDate: string | null
  address: string | null
  zipCode: string | null
  cidade: string | null
  estado: string | null
  bairro: string | null
  pais: string | null
  numeroEndereco: string | null
  complemento: string | null
  enrollmentNumber: string | null
  instagram: string | null
  twitter: string | null
  hotmartId: string | null
  origemCadastro: string | null
  courses: { id: string; name: string }[]
  courseIds: string[]
  mustChangePassword: boolean
  temporaryPassword: string | null
  createdAt: string
  updatedAt: string
}

interface StudentResponse {
  data: StudentData
}

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string

  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [student, setStudent] = React.useState<StudentData | null>(null)

  const fetchStudent = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get<StudentResponse>(`/api/student/${studentId}`)
      if (response?.data) {
        setStudent(response.data)
      }
    } catch (err) {
      console.error('Error fetching student:', err)
      setError('Erro ao carregar dados do aluno')
    } finally {
      setLoading(false)
    }
  }, [studentId])

  React.useEffect(() => {
    if (studentId) {
      fetchStudent()
    }
  }, [studentId, fetchStudent])

  if (loading) {
    return (
      <div className="flex flex-col gap-6 h-full pb-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive">{error || 'Aluno não encontrado'}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <StudentDetails
      student={student}
      onUpdate={fetchStudent}
    />
  )
}
