import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, UserPlus } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { EmptyState } from '../components/ui/EmptyState'
import { Fab } from '../components/ui/Fab'
import { Snackbar } from '../components/ui/Snackbar'
import { Button } from '../components/ui/Button'
import { PatientFormModal, type PatientFormData } from '../components/patients/PatientFormModal'
import { PatientDirectoryRow } from '../components/patients/PatientDirectoryRow'
import {
  PatientDirectoryColumnHeader,
  PatientDirectorySkeleton,
} from '../components/patients/PatientDirectoryList'
import {
  PatientDirectoryToolbar,
  type ConsentFilter,
  type SocialMediaFilter,
  type DirectorySort,
} from '../components/patients/PatientDirectoryToolbar'
import {
  createPaciente,
  getPacientesDirectory,
  searchPacientesByName,
  type PacienteDirectory,
} from '../lib/pacienteService'
import { getFichasDirectorySummary } from '../lib/fichaService'
import {
  buildFichasByPaciente,
  getPatientDirectoryMeta,
  type PatientDirectoryMeta,
} from '../lib/patientDirectoryUtils'
import { calcAge, parseLocalDate } from '../lib/dateUtils'

const PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 300

interface DirectoryEntry {
  patient: PacienteDirectory
  meta: PatientDirectoryMeta
}

export const AdminDashboard = () => {
  const navigate = useNavigate()
  const [allPatients, setAllPatients] = useState<PacienteDirectory[]>([])
  const [searchResults, setSearchResults] = useState<PacienteDirectory[] | null>(null)
  const [fichasSummary, setFichasSummary] = useState<Awaited<ReturnType<typeof getFichasDirectorySummary>>>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [consentFilter, setConsentFilter] = useState<ConsentFilter>('all')
  const [socialMediaFilter, setSocialMediaFilter] = useState<SocialMediaFilter>('all')
  const [sortBy, setSortBy] = useState<DirectorySort>('name')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  const loadDirectoryData = async () => {
    const [patientsData, fichasData] = await Promise.all([
      getPacientesDirectory(),
      getFichasDirectorySummary(),
    ])
    setAllPatients(patientsData)
    setFichasSummary(fichasData)
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setFetchError('')
      try {
        await loadDirectoryData()
      } catch {
        if (!cancelled) {
          setFetchError('No se pudieron cargar los pacientes. Verifica tu conexión e intenta de nuevo.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, consentFilter, socialMediaFilter, sortBy])

  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setSearchResults(null)
      setSearchLoading(false)
      return
    }

    let cancelled = false
    void (async () => {
      setSearchLoading(true)
      try {
        const results = await searchPacientesByName(debouncedSearch)
        if (!cancelled) {
          setSearchResults(
            results.map(p => ({
              id: p.id,
              nombre_completo: p.nombre_completo,
              telefono: p.telefono,
              consiente_tratamiento: p.consiente_tratamiento,
              permite_fotos_redes: p.permite_fotos_redes,
              created_at: p.created_at,
              fecha_registro: p.fecha_registro,
            })),
          )
        }
      } catch {
        if (!cancelled) setSearchResults([])
      } finally {
        if (!cancelled) setSearchLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [debouncedSearch])

  const fichasByPaciente = useMemo(() => buildFichasByPaciente(fichasSummary), [fichasSummary])

  const basePatients = useMemo(() => {
    if (debouncedSearch.length >= 2) {
      const q = debouncedSearch.toLowerCase()
      return (searchResults ?? []).filter(p => {
        const name = p.nombre_completo?.toLowerCase() ?? ''
        const phone = p.telefono ?? ''
        return name.includes(q) || phone.includes(debouncedSearch)
      })
    }
    const q = debouncedSearch.toLowerCase()
    if (!q) return allPatients
    return allPatients.filter(p => {
      const name = p.nombre_completo?.toLowerCase() ?? ''
      const phone = p.telefono ?? ''
      return name.includes(q) || phone.includes(debouncedSearch)
    })
  }, [allPatients, searchResults, debouncedSearch])

  const directoryEntries = useMemo(() => {
    const entries: DirectoryEntry[] = basePatients
      .map(patient => ({
        patient,
        meta: getPatientDirectoryMeta(patient, fichasByPaciente.get(patient.id)),
      }))
      .filter(entry => {
        if (consentFilter === 'all') return true
        return entry.meta.consentimiento === consentFilter
      })
      .filter(entry => {
        if (socialMediaFilter === 'all') return true
        if (socialMediaFilter === 'yes') return entry.patient.permite_fotos_redes === true
        if (socialMediaFilter === 'no') return entry.patient.permite_fotos_redes === false
        if (socialMediaFilter === 'pending') return entry.patient.permite_fotos_redes === null
        return true
      })

    entries.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.patient.nombre_completo ?? '').localeCompare(
          b.patient.nombre_completo ?? '',
          'es',
          { sensitivity: 'base' },
        )
      }
      if (sortBy === 'recent') {
        return new Date(b.patient.created_at).getTime() - new Date(a.patient.created_at).getTime()
      }
      const aVisit = a.meta.ultimaVisita ? parseLocalDate(a.meta.ultimaVisita).getTime() : 0
      const bVisit = b.meta.ultimaVisita ? parseLocalDate(b.meta.ultimaVisita).getTime() : 0
      if (aVisit === 0 && bVisit === 0) return 0
      if (aVisit === 0) return 1
      if (bVisit === 0) return -1
      return bVisit - aVisit
    })

    return entries
  }, [basePatients, fichasByPaciente, consentFilter, socialMediaFilter, sortBy])

  const totalPages = Math.max(1, Math.ceil(directoryEntries.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const pageStart = (safePage - 1) * PAGE_SIZE
  const paginatedEntries = directoryEntries.slice(pageStart, pageStart + PAGE_SIZE)
  const showingFrom = directoryEntries.length === 0 ? 0 : pageStart + 1
  const showingTo = Math.min(pageStart + PAGE_SIZE, directoryEntries.length)

  const handleCreatePatient = async (formData: PatientFormData) => {
    setCreating(true)
    try {
      const edad = formData.fecha_nacimiento ? calcAge(formData.fecha_nacimiento) : undefined
      await createPaciente({
        nombre_completo: formData.nombre_completo,
        telefono: formData.telefono,
        ...(formData.correo ? { correo: formData.correo } : {}),
        ...(formData.fecha_nacimiento ? { fecha_nacimiento: formData.fecha_nacimiento } : {}),
        ...(edad != null ? { edad } : {}),
        ...(formData.como_nos_conocio ? { como_nos_conocio: formData.como_nos_conocio } : {}),
        ...(formData.nacionalidad ? { nacionalidad: formData.nacionalidad } : {}),
        ...(formData.domicilio ? { domicilio: formData.domicilio } : {}),
      })
      setModalOpen(false)
      setSnackbarMessage('Paciente creado correctamente')
      setSnackbarOpen(true)
      await loadDirectoryData()
      setSearchResults(null)
      setSearchTerm('')
      setDebouncedSearch('')
    } catch (err) {
      const detail = err instanceof Error ? err.message : ''
      setSnackbarMessage(detail ? `Error al crear el paciente: ${detail}` : 'Error al crear el paciente')
      setSnackbarOpen(true)
    } finally {
      setCreating(false)
    }
  }

  const listLoading = loading || (debouncedSearch.length >= 2 && searchLoading && searchResults === null)

  return (
    <AppShell>
      <div className="bg-surface rounded-2xl shadow-premium border border-border">
        <div className="px-5 sm:px-8 pt-7 sm:pt-8 pb-5 sm:pb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-ink font-outfit tracking-tight">
                Directorio de pacientes
              </h1>
              <span className="text-xs sm:text-sm font-semibold text-primary bg-primary-light px-2.5 py-0.5 rounded-full">
                {allPatients.length}
              </span>
            </div>
            <p className="text-sm text-muted font-medium mt-1.5 max-w-lg">
              Gestiona fichas clínicas, consentimientos y consultas desde un solo lugar.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="hidden md:inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary-dark active:bg-brand-dark text-on-primary text-sm font-semibold font-outfit shadow-premium transition-all duration-200 cursor-pointer min-h-[48px] shrink-0 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" strokeWidth={2.25} />
            Nuevo paciente
          </button>
        </div>

        <div className="px-5 sm:px-8 pb-6 sm:pb-8">
          <PatientDirectoryToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            consentFilter={consentFilter}
            onConsentFilterChange={setConsentFilter}
            socialMediaFilter={socialMediaFilter}
            onSocialMediaFilterChange={setSocialMediaFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            filtersOpen={filtersOpen}
            onToggleFilters={() => setFiltersOpen(open => !open)}
            totalCount={allPatients.length}
            filteredCount={directoryEntries.length}
          />

          {fetchError && (
            <div className="p-6 mb-4 rounded-xl bg-error-light text-center text-sm text-error font-medium">
              {fetchError}
            </div>
          )}

          {listLoading && !fetchError && <PatientDirectorySkeleton />}

          {!listLoading && !fetchError && (
            <>
              {directoryEntries.length === 0 ? (
                <EmptyState
                  icon={<Users className="w-6 h-6" />}
                  title={searchTerm || consentFilter !== 'all' ? 'Sin resultados' : 'Aún no hay pacientes'}
                  description={
                    searchTerm || consentFilter !== 'all'
                      ? 'Prueba con otro término o ajusta los filtros.'
                      : 'Registra tu primer paciente con el botón «Nuevo paciente».'
                  }
                />
              ) : (
                <>
                  <PatientDirectoryColumnHeader />
                  <div className="space-y-3">
                    {paginatedEntries.map(({ patient, meta }) => (
                      <PatientDirectoryRow
                        key={patient.id}
                        patient={patient}
                        meta={meta}
                        onViewProfile={() => navigate(`/admin/paciente/${patient.id}`)}
                        onStartConsulta={() => navigate(`/admin/paciente/${patient.id}/ficha/nueva`)}
                      />
                    ))}
                  </div>

                  {directoryEntries.length > PAGE_SIZE && (
                    <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-border">
                      <p className="text-sm text-muted font-medium font-outfit">
                        Mostrando {showingFrom}–{showingTo} de {directoryEntries.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={safePage <= 1}
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          className="min-h-[44px]"
                        >
                          Anterior
                        </Button>
                        <span className="text-xs text-muted font-semibold font-outfit px-2">
                          {safePage} / {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={safePage >= totalPages}
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          className="min-h-[44px]"
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <Fab
        icon={<UserPlus className="w-5 h-5" />}
        label="Nuevo paciente"
        onClick={() => setModalOpen(true)}
        className="md:hidden bg-primary text-on-primary hover:bg-primary-dark"
      />

      <PatientFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreatePatient}
        isLoading={creating}
      />

      <Snackbar isOpen={snackbarOpen} onClose={() => setSnackbarOpen(false)} message={snackbarMessage} />
    </AppShell>
  )
}
